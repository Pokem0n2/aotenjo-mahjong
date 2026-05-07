import { Tile, TileId, Suit, ALL_TILE_IDS, createTile, shuffleDeck, handToCounts, TILE_NAMES } from '../types/tile';
import { HandState, createHand, initHand, handDraw, handDiscard } from './hand';
import { isAgari, AgariResult } from './agari';

// ========== 牌山状态 ==========
export interface WallState {
  tiles: Tile[];           // 36张牌（独立于手牌）
  revealed: boolean[];      // 哪些位置是明牌（随机9张）
  currentIndex: number;     // 当前摸牌位置（0-35）
}

// ========== 道具卡定义 ==========
export interface ItemCard {
  id: string;
  name: string;
  description: string;
  type: 'multiplier' | 'conditional' | 'transform';
}

// ========== 10张道具卡 ==========
export const ITEM_CARDS: ItemCard[] = [
  {
    id: 'wuxiang',
    name: '万象天引',
    description: '手牌中的一张麻将变成万能牌，胡牌时可以代替任意牌',
    type: 'transform'
  },
  {
    id: 'fuzhong1',
    name: '负重前行',
    description: '胡牌结算时得分×N，初始N=1.5，每过一关N=N×1.5',
    type: 'multiplier'
  },
  {
    id: 'fuzhong2',
    name: '负重前行',
    description: '胡牌结算时得分×N，初始N=1.5，每过一关N=N×1.5',
    type: 'multiplier'
  },
  {
    id: 'tiaotiao',
    name: '条条大路',
    description: '胡牌为条一色时，得分×10',
    type: 'conditional'
  },
  {
    id: 'binbin',
    name: '彬彬有礼',
    description: '胡牌为筒一色时，得分×10',
    type: 'conditional'
  },
  {
    id: 'wanwan',
    name: '万万不可',
    description: '胡牌为万一色时，得分×10',
    type: 'conditional'
  },
  {
    id: 'guoshi',
    name: '国士无双',
    description: '胡牌为十三幺时，得分×52',
    type: 'conditional'
  },
  {
    id: 'tongtian',
    name: '通天藤蔓',
    description: '胡牌为条一色时，得分×N，初始N=1.1，每胡一次条一色N=N×1.1',
    type: 'conditional'
  }
];

// ========== 道具卡槽位状态 ==========
export interface ItemSlot {
  card: ItemCard | null;
  multiplier: number;
}

// ========== 关卡状态 ==========
export interface LevelState {
  level: number;
  targetScore: number;
  currentScore: number;
  wall: WallState;          // 36张牌山
  hand: HandState;          // 13张手牌 + lastDraw
  itemSlots: ItemSlot[];
  isComplete: boolean;
  lastWinScore: number;     // 最后一次胡牌得分
  totalWins: number;        // 本关胡牌次数
}

// ========== 游戏全局状态 ==========
export interface GameState {
  level: number;
  totalScore: number;
  itemSlots: ItemSlot[];
  shopChoices: ItemCard[];
  gameOver: boolean;
  message: string;
}

// ========== 创建完整牌组（136张） ==========
function createFullDeck(): Tile[] {
  const deck: Tile[] = [];
  for (const id of ALL_TILE_IDS) {
    for (let i = 0; i < 4; i++) {
      deck.push(createTile(id));
    }
  }
  return deck;
}

// ========== 创建关卡：发13张手牌 + 36张牌山 ==========
export function createLevel(level: number, itemSlots: ItemSlot[]): LevelState {
  // 1. 创建136张完整牌组并洗牌
  const fullDeck = createFullDeck();
  const shuffled = shuffleDeck(fullDeck);
  
  // 2. 先发13张给玩家作为初始手牌
  const handTiles = shuffled.slice(0, 13);
  const hand = initHand(handTiles);
  
  // 3. 从剩余牌中抽取36张作为牌山
  const wallTiles = shuffled.slice(13, 13 + 36);
  
  // 4. 随机选择9个位置作为明牌
  const revealed = new Array(36).fill(false);
  const revealedSet = new Set<number>();
  while (revealedSet.size < 9) {
    revealedSet.add(Math.floor(Math.random() * 36));
  }
  revealedSet.forEach(idx => revealed[idx] = true);
  
  // 5. 牌山初始状态
  const wall: WallState = {
    tiles: wallTiles,
    revealed,
    currentIndex: 0
  };
  
  // 6. 初始摸一张牌到手牌（玩家有14张，需要弃1张）
  const initialDrawTile = wallTiles[0];
  const handWithDraw = handDraw(hand, initialDrawTile);
  
  // 7. 更新牌山：currentIndex推进到1（第一张已摸走）
  wall.currentIndex = 1;
  
  // 8. 计算目标分数
  const targetScore = level === 1 ? 2000 : Math.pow(5, level - 1) * 2000;
  
  return {
    level,
    targetScore,
    currentScore: 0,
    wall,
    hand: handWithDraw,
    itemSlots: itemSlots.map(slot => ({ ...slot })),
    isComplete: false,
    lastWinScore: 0,
    totalWins: 0
  };
}

// ========== 摸牌：从牌山当前位置摸一张到手牌 ==========
export function drawFromWall(wall: WallState, hand: HandState): { newHand: HandState; tile: Tile | null; newWall: WallState } {
  if (wall.currentIndex >= wall.tiles.length) {
    return { newHand: hand, tile: null, newWall: wall };
  }
  
  const tile = wall.tiles[wall.currentIndex];
  const newHand = handDraw(hand, tile);
  const newWall: WallState = {
    tiles: wall.tiles,
    revealed: wall.revealed,
    currentIndex: wall.currentIndex + 1
  };
  
  return { newHand, tile, newWall };
}

// ========== 弃牌：从手牌丢弃一张，然后自动摸新牌 ==========
export function discardAndDraw(wall: WallState, hand: HandState, discardTile: Tile): { 
  newHand: HandState; 
  newWall: WallState; 
  drawnTile: Tile | null;
  message: string;
} {
  // 1. 丢弃选中的牌
  const tileIndex = hand.tiles.findIndex(t => t.id === discardTile.id);
  const discardResult = handDiscard(hand, tileIndex >= 0 ? tileIndex : hand.tiles.length - 1);
  const handAfterDiscard = discardResult.hand;
  
  // 2. 检查是否胡牌（13张牌）
  const lastDraw = handAfterDiscard.lastDraw;
  if (lastDraw && handAfterDiscard.tiles.length === 13) {
    const agariResult = isAgari(handAfterDiscard, lastDraw);
    if (agariResult.isAgari) {
      // 胡牌了，不继续摸牌
      return {
        newHand: handAfterDiscard,
        newWall: wall,
        drawnTile: null,
        message: `胡牌！`
      };
    }
  }
  
  // 3. 从牌山摸一张新牌
  const drawResult = drawFromWall(wall, handAfterDiscard);
  
  if (!drawResult.tile) {
    // 牌山已空
    return {
      newHand: drawResult.newHand,
      newWall: drawResult.newWall,
      drawnTile: null,
      message: '牌山已空！'
    };
  }
  
  return {
    newHand: drawResult.newHand,
    newWall: drawResult.newWall,
    drawnTile: drawResult.tile,
    message: `摸到 ${TILE_NAMES[drawResult.tile.id as TileId]}，请选择一张牌丢弃`
  };
}

// ========== 判断胡牌 ==========
export function checkWin(hand: HandState, winningTile?: Tile): { isWin: boolean; pattern: string; fan: number; score: number } {
  const lastTile = winningTile || hand.lastDraw;
  if (!lastTile || hand.tiles.length !== 14) {
    return { isWin: false, pattern: '', fan: 0, score: 0 };
  }
  
  // hand.tiles 包含14张牌（含lastDraw）
  // 需要移除lastDraw来创建13张牌的tempHand
  const tilesWithoutLast = hand.tiles.filter(t => t.id !== lastTile.id);
  
  // 如果过滤后只有12张，说明有重复牌，需要更精确地移除一张
  const tempHand = { 
    ...hand, 
    tiles: tilesWithoutLast.length === 13 ? tilesWithoutLast : hand.tiles.slice(0, -1)
  };
  
  const result = isAgari(tempHand, lastTile);
  
  if (result.isAgari) {
    const pattern = getPatternName(result.form);
    const fan = calculateFan(pattern, tempHand);
    const baseScore = calculateBaseScore(hand);
    return {
      isWin: true,
      pattern,
      fan,
      score: baseScore * fan
    };
  }
  
  return { isWin: false, pattern: '', fan: 0, score: 0 };
}

// ========== 根据和了形态获取牌型名称 ==========
function getPatternName(form?: string): string {
  const patternMap: Record<string, string> = {
    'standard': '一般',
    'chiitoitsu': '七对子',
    'kokushi': '国士无双'
  };
  return patternMap[form || ''] || '一般';
}

// ========== 计算番数（扩展版） ==========
function calculateFan(pattern: string, hand?: HandState): number {
  const fanMap: Record<string, number> = {
    '一般': 1,
    '七对子': 2,
    '国士无双': 13,
    '清一色': 6,
    '混一色': 3,
    '对对和': 2,
    '小三元': 2,
    '大三元': 13,
    '小四喜': 13,
    '大四喜': 26,
    '字一色': 13,
    '绿一色': 13,
    '九莲宝灯': 13,
    '四暗刻': 13,
    '清老头': 26,
    '四杠子': 26
  };
  
  // 检查清一色/混一色
  if (hand && hand.tiles.length >= 13) {
    const suits = new Set(hand.tiles.map(t => t.suit));
    if (suits.size === 1 && !suits.has('z')) {
      return fanMap['清一色'] || 6;
    }
    if (suits.size === 2 && suits.has('z')) {
      return fanMap['混一色'] || 3;
    }
  }
  
  return fanMap[pattern] || 1;
}

// ========== 计算单张牌的分数 ==========
export function calculateTileScore(tile: Tile): number {
  if (tile.suit === 'z') {
    return 10;
  }
  return tile.value;
}

// ========== 计算手牌基础分数 ==========
export function calculateBaseScore(hand: HandState): number {
  return hand.tiles.reduce((sum, tile) => sum + calculateTileScore(tile), 0);
}

// ========== 道具卡效果应用（含万能牌） ==========
export function applyItemEffects(
  baseScore: number,
  pattern: string,
  itemSlots: ItemSlot[],
  hand?: HandState
): { finalScore: number; details: string[]; universalTiles?: Tile[] } {
  let score = baseScore;
  const details: string[] = [`基础分: ${baseScore}`];
  let universalTiles: Tile[] = [];
  
  // 先应用番数
  const fan = calculateFan(pattern, hand);
  score *= fan;
  details.push(`×${fan}番 = ${score}`);
  
  // 依次应用8个槽位的道具卡
  for (let i = 0; i < itemSlots.length; i++) {
    const slot = itemSlots[i];
    if (!slot.card) continue;
    
    const card = slot.card;
    
    switch (card.id) {
      case 'wuxiang':
        // 万象天引：将手牌中的一张牌变成万能牌
        if (hand && hand.tiles.length > 0) {
          // 选择最后一张非万能牌变成万能牌
          const targetTile = hand.tiles[hand.tiles.length - 1];
          if (targetTile.id !== 'universal') {
            universalTiles.push(targetTile);
            details.push(`[槽${i+1}] ${card.name}: ${targetTile.id}→万能牌`);
          }
        }
        break;
        
      case 'fuzhong1':
      case 'fuzhong2':
        score *= slot.multiplier;
        details.push(`[槽${i+1}] ${card.name} ×${slot.multiplier.toFixed(2)} = ${Math.floor(score)}`);
        break;
        
      case 'tiaotiao':
        if (pattern === '清一色' || pattern.indexOf('条') >= 0) {
          score *= 10;
          details.push(`[槽${i+1}] ${card.name} ×10 = ${Math.floor(score)}`);
        }
        break;
        
      case 'binbin':
        if (pattern === '清一色' || pattern.indexOf('筒') >= 0) {
          score *= 10;
          details.push(`[槽${i+1}] ${card.name} ×10 = ${Math.floor(score)}`);
        }
        break;
        
      case 'wanwan':
        if (pattern === '清一色' || pattern.indexOf('万') >= 0) {
          score *= 10;
          details.push(`[槽${i+1}] ${card.name} ×10 = ${Math.floor(score)}`);
        }
        break;
        
      case 'guoshi':
        if (pattern === '国士无双') {
          score *= 52;
          details.push(`[槽${i+1}] ${card.name} ×52 = ${Math.floor(score)}`);
        }
        break;
        
      case 'tongtian':
        if (pattern === '清一色' || pattern.indexOf('条') >= 0) {
          score *= slot.multiplier;
          details.push(`[槽${i+1}] ${card.name} ×${slot.multiplier.toFixed(2)} = ${Math.floor(score)}`);
        }
        break;
    }
  }
  
  return { finalScore: Math.floor(score), details, universalTiles };
}

// ========== 创建初始游戏状态 ==========
export function createGameState(): GameState {
  return {
    level: 1,
    totalScore: 0,
    itemSlots: Array(8).fill(null).map(() => ({ card: null, multiplier: 1 })),
    shopChoices: [],
    gameOver: false,
    message: '欢迎来到青天井！'
  };
}

// ========== 生成商店选项 ==========
export function generateShopChoices(): ItemCard[] {
  const shuffled = [...ITEM_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// ========== 添加道具卡到槽位 ==========
export function addItemCard(
  itemSlots: ItemSlot[],
  card: ItemCard,
  slotIndex: number
): ItemSlot[] {
  const newSlots = itemSlots.map(slot => ({ ...slot }));
  
  let multiplier = 1;
  if (card.id === 'fuzhong1' || card.id === 'fuzhong2') {
    multiplier = 1.5;
  } else if (card.id === 'tongtian') {
    multiplier = 1.1;
  }
  
  newSlots[slotIndex] = { card, multiplier };
  return newSlots;
}

// ========== 过关后更新道具卡 ==========
export function updateItemsAfterLevel(itemSlots: ItemSlot[]): ItemSlot[] {
  return itemSlots.map(slot => {
    if (!slot.card) return slot;
    
    const newSlot = { ...slot };
    
    if (slot.card.id === 'fuzhong1' || slot.card.id === 'fuzhong2') {
      newSlot.multiplier *= 1.5;
    }
    
    return newSlot;
  });
}

// ========== 胡牌后更新道具卡 ==========
export function updateItemsAfterWin(itemSlots: ItemSlot[], pattern: string): ItemSlot[] {
  return itemSlots.map(slot => {
    if (!slot.card) return slot;
    
    const newSlot = { ...slot };
    
    if (slot.card.id === 'tongtian' && (pattern.indexOf('条') >= 0 || pattern === '清一色')) {
      newSlot.multiplier *= 1.1;
    }
    
    return newSlot;
  });
}

// ========== 辅助函数：将Tile转为字符串ID ==========
export function tileToId(tile: Tile): string {
  return tile.id;
}

// ========== 辅助函数：检查两张牌是否相同 ==========
export function isSameTile(a: Tile, b: Tile): boolean {
  return a.id === b.id;
}
