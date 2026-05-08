import { Tile, TileId, Suit, ALL_TILE_IDS, createTile, shuffleDeck, handToCounts, TILE_NAMES, UNIVERSAL_TILE_ID, createUniversalTile } from '../types/tile';
import { HandState, createHand, initHand, handDraw, handDiscard } from './hand';
import { isAgari, AgariResult, findBestAgariWithUniversal } from './agari';

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

// ========== 检查是否有万象天引道具 ==========
function hasWuxiangTianyin(itemSlots: ItemSlot[]): boolean {
  return itemSlots.some(slot => slot.card?.id === 'wuxiang');
}

// ========== 创建关卡：发13张手牌 + 36张牌山 ==========
export function createLevel(level: number, itemSlots: ItemSlot[], cheatMode: boolean = false): LevelState {
  // 1. 创建136张完整牌组并洗牌
  const fullDeck = createFullDeck();
  const shuffled = shuffleDeck(fullDeck);
  
  // 2. 检查是否有万象天引
  const hasUniversal = hasWuxiangTianyin(itemSlots);
  
  // 3. 发初始手牌
  let handTiles: Tile[];
  if (hasUniversal) {
    // 有万象天引：12张常规牌 + 1张万能牌（放在最前面）
    const regularTiles = shuffled.slice(0, 12);
    const universalTile = createUniversalTile('5z');
    handTiles = [universalTile, ...regularTiles];
  } else {
    // 无万象天引：13张常规牌
    handTiles = shuffled.slice(0, 13);
  }
  let hand = initHand(handTiles);
  
  // 如果有万能牌，确保它在最前面（索引0）
  if (hasUniversal) {
    const universalIdx = hand.tiles.findIndex(t => t.id === 'universal');
    if (universalIdx >= 0) {
      const newTiles = [...hand.tiles];
      const [universalTile] = newTiles.splice(universalIdx, 1);
      newTiles.unshift(universalTile);
      hand = { ...hand, tiles: newTiles };
    }
  }
  
  // 4. 从剩余牌中抽取36张作为牌山
  const wallTiles = shuffled.slice(hasUniversal ? 12 : 13, hasUniversal ? 12 + 36 : 13 + 36);
  
  // 5. 随机选择9个位置作为明牌（作弊模式下全部明牌）
  const revealed = new Array(36).fill(false);
  if (cheatMode) {
    // 作弊模式：所有牌都明牌
    for (let i = 0; i < 36; i++) {
      revealed[i] = true;
    }
  } else {
    const revealedSet = new Set<number>();
    while (revealedSet.size < 9) {
      revealedSet.add(Math.floor(Math.random() * 36));
    }
    revealedSet.forEach(idx => revealed[idx] = true);
  }
  
  // 6. 牌山初始状态
  const wall: WallState = {
    tiles: wallTiles,
    revealed,
    currentIndex: 0
  };
  
  // 7. 初始摸一张牌到手牌（玩家有14张，需要弃1张）
  const initialDrawTile = wallTiles[0];
  let handWithDraw = handDraw(hand, initialDrawTile);
  
  // 如果有万能牌，再次确保它在最前面（handDraw会排序）
  if (hasUniversal) {
    const universalIdx = handWithDraw.tiles.findIndex(t => t.id === 'universal');
    if (universalIdx >= 0) {
      const newTiles = [...handWithDraw.tiles];
      const [universalTile] = newTiles.splice(universalIdx, 1);
      newTiles.unshift(universalTile);
      handWithDraw = { ...handWithDraw, tiles: newTiles };
    }
  }
  
  // 8. 更新牌山：currentIndex推进到1（第一张已摸走）
  wall.currentIndex = 1;
  
  // 9. 计算目标分数
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
  isWin: boolean;  // 是否胡牌
  winPattern: string;
  winFan: number;
  winScore: number;
  isWallEmpty: boolean; // 牌山是否已空
  universalDisplayTile: TileId | null; // 万能牌临时显示的牌ID（胡牌时）
} {
  // 1. 丢弃选中的牌
  const tileIndex = hand.tiles.findIndex(t => t.id === discardTile.id);
  const discardResult = handDiscard(hand, tileIndex >= 0 ? tileIndex : hand.tiles.length - 1);
  const handAfterDiscard = discardResult.hand;
  
  // 2. 从牌山摸一张新牌
  const drawResult = drawFromWall(wall, handAfterDiscard);
  
  // 3. 检查摸牌后的手牌是否胡牌（14张牌，含lastDraw）
  const finalHand = drawResult.newHand;
  const finalLastDraw = finalHand.lastDraw;
  
  if (finalLastDraw && finalHand.tiles.length === 14) {
    // 检查是否有万能牌
    const hasUniversal = finalHand.tiles.some(t => t.id === UNIVERSAL_TILE_ID);
    
    let agariResult: AgariResult | null = null;
    let bestPattern = '';
    let bestFan = 0;
    
    let bestTileId: TileId | null = null;
    
    if (hasUniversal) {
      // 有万能牌：遍历34种可能，找最大番数
      const bestResult = findBestAgariWithUniversal(finalHand, finalLastDraw);
      if (bestResult.result) {
        agariResult = bestResult.result;
        bestPattern = getPatternName(bestResult.result.form);
        bestFan = bestResult.bestFan;
        bestTileId = bestResult.bestTileId;
      }
    } else {
      // 无万能牌：常规胡牌判定
      // 创建13张牌的tempHand用于胡牌判定
      const tilesWithoutLast = finalHand.tiles.filter(t => t.id !== finalLastDraw.id);
      const tempHand = { 
        ...finalHand, 
        tiles: tilesWithoutLast.length === 13 ? tilesWithoutLast : finalHand.tiles.slice(0, -1)
      };
      const result = isAgari(tempHand, finalLastDraw);
      if (result.isAgari) {
        agariResult = result;
        bestPattern = getPatternName(result.form);
        bestFan = calculateFan(bestPattern, tempHand);
      }
    }
    
    if (agariResult) {
      const baseScore = calculateBaseScore(finalHand);
      const score = baseScore * bestFan;
      // 检查牌山是否已空
      const wallEmpty = drawResult.newWall.currentIndex >= drawResult.newWall.tiles.length;
      return {
        newHand: finalHand,
        newWall: drawResult.newWall,
        drawnTile: null,
        message: `胡牌！${bestPattern} ${bestFan}番 ${score}分`,
        isWin: true,
        winPattern: bestPattern,
        winFan: bestFan,
        winScore: score,
        isWallEmpty: wallEmpty,
        universalDisplayTile: bestTileId
      };
    }
  }
  
  // 4. 检查牌山是否已空（摸完最后一张后还没胡牌）
  const isWallEmpty = drawResult.newWall.currentIndex >= drawResult.newWall.tiles.length;
  
  if (isWallEmpty) {
    // 没胡牌，牌山已空，让玩家手动选择丢弃最后一张牌后再结算
    return {
      newHand: drawResult.newHand,
      newWall: drawResult.newWall,
      drawnTile: null,
      message: '牌山已空！请丢弃一张手牌进行最终结算',
      isWin: false,
      winPattern: '',
      winFan: 0,
      winScore: 0,
      isWallEmpty: true,
      universalDisplayTile: null
    };
  }
  
  // 5. 牌山还有牌，正常继续游戏
  return {
    newHand: drawResult.newHand,
    newWall: drawResult.newWall,
    drawnTile: drawResult.tile,
    message: `摸到 ${TILE_NAMES[drawResult.tile!.id as TileId]}，请选择一张牌丢弃`,
    isWin: false,
    winPattern: '',
    winFan: 0,
    winScore: 0,
    isWallEmpty: false,
    universalDisplayTile: null
  };
}

// ========== 胡牌后自动丢弃lastDraw并摸新牌 ==========
export function autoDiscardAfterWin(wall: WallState, hand: HandState): {
  newHand: HandState;
  newWall: WallState;
  drawnTile: Tile | null;
  message: string;
} {
  // 1. 自动丢弃lastDraw（最后摸到的牌）
  const lastDrawTile = hand.lastDraw;
  if (!lastDrawTile) {
    // 没有lastDraw，直接摸牌
    const drawResult = drawFromWall(wall, hand);
    return {
      newHand: drawResult.newHand,
      newWall: drawResult.newWall,
      drawnTile: drawResult.tile,
      message: drawResult.tile ? `摸到 ${TILE_NAMES[drawResult.tile.id as TileId]}` : '牌山已空！'
    };
  }
  
  // 找到lastDraw在手牌中的索引（最后一张匹配的牌）
  let lastIndex = -1;
  for (let i = hand.tiles.length - 1; i >= 0; i--) {
    if (hand.tiles[i].id === lastDrawTile.id) {
      lastIndex = i;
      break;
    }
  }
  
  if (lastIndex === -1) {
    // 找不到lastDraw，直接摸牌
    const drawResult = drawFromWall(wall, hand);
    return {
      newHand: drawResult.newHand,
      newWall: drawResult.newWall,
      drawnTile: drawResult.tile,
      message: drawResult.tile ? `摸到 ${TILE_NAMES[drawResult.tile.id as TileId]}` : '牌山已空！'
    };
  }
  
  // 丢弃lastDraw
  const discardResult = handDiscard(hand, lastIndex);
  const handAfterDiscard = discardResult.hand;
  
  // 2. 从牌山摸一张新牌
  const drawResult = drawFromWall(wall, handAfterDiscard);
  
  if (!drawResult.tile) {
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
  const choices = shuffled.slice(0, 3);
  // 确保万象天引总是出现（用于测试）
  const hasWuxiang = choices.some(c => c.id === 'wuxiang');
  if (!hasWuxiang) {
    const wuxiang = ITEM_CARDS.find(c => c.id === 'wuxiang');
    if (wuxiang) {
      choices[2] = wuxiang; // 替换第三个
    }
  }
  return choices;
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
