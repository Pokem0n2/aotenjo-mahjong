import { Tile, TileId, Suit, ALL_TILE_IDS, createTile, shuffleDeck, handToCounts, TILE_NAMES, UNIVERSAL_TILE_ID, createUniversalTile } from '../types/tile';
import { HandState, createHand, initHand, handDraw, handDiscard } from './hand';
import { AgariResult } from './agari';
import { tilesTo34, isAgariWithShanten, evaluateHandWithUniversal } from './shanten-new';
import { detectPattern, detectPatternWithSuit, isSuitPattern, PatternResult } from './pattern';

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

// ========== 统一分数格式化 ==========
export function formatScore(score: number): string {
  if (score > 10000) {
    const exponent = Math.floor(Math.log10(score));
    const mantissa = (score / Math.pow(10, exponent)).toFixed(2);
    return `${mantissa}e${exponent}`;
  }
  return score.toLocaleString('en-US');
}

// ========== 排行榜 ==========
export interface LeaderboardEntry {
  rank: number;
  score: number;
  level: number;
  date: string;
}

const LEADERBOARD_KEY = 'aotenjo_leaderboard';
const MAX_LEADERBOARD_SIZE = 10;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

export function addToLeaderboard(score: number, level: number): LeaderboardEntry[] {
  const entries = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    rank: 0,
    score,
    level,
    date: new Date().toLocaleDateString('zh-CN')
  };
  entries.push(newEntry);
  // 按分数降序排列
  entries.sort((a, b) => b.score - a.score);
  // 只保留前10名
  const topEntries = entries.slice(0, MAX_LEADERBOARD_SIZE);
  // 重新计算排名
  topEntries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  saveLeaderboard(topEntries);
  return topEntries;
}

// ========== 测试牌组类型 ==========
export type TestDeckType = 'normal' | 'tiao' | 'tong' | 'wan' | 'guoshi';

let TEST_DECK: TestDeckType = 'normal';

export function setTestDeck(type: TestDeckType): void {
  TEST_DECK = type;
}

export function getTestDeck(): TestDeckType {
  return TEST_DECK;
}

// ========== 创建条一色测试牌组 ==========
function createTiaoDeck(): Tile[] {
  const deck: Tile[] = [];
  // 条子牌 (1s-9s)，每种4张 = 36张
  const souIds: TileId[] = ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s'];
  for (const id of souIds) {
    for (let i = 0; i < 4; i++) {
      deck.push(createTile(id));
    }
  }
  // 填充到50张（剩余14张用万子）
  const manIds: TileId[] = ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m'];
  let manIdx = 0;
  while (deck.length < 50) {
    deck.push(createTile(manIds[manIdx % 9]));
    manIdx++;
  }
  return deck;
}

// ========== 创建筒一色测试牌组 ==========
function createTongDeck(): Tile[] {
  const deck: Tile[] = [];
  // 筒子牌 (1p-9p)，每种4张 = 36张
  const pinIds: TileId[] = ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'];
  for (const id of pinIds) {
    for (let i = 0; i < 4; i++) {
      deck.push(createTile(id));
    }
  }
  // 填充到50张（剩余14张用万子）
  const manIds: TileId[] = ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m'];
  let manIdx = 0;
  while (deck.length < 50) {
    deck.push(createTile(manIds[manIdx % 9]));
    manIdx++;
  }
  return deck;
}

// ========== 创建万一色测试牌组 ==========
function createWanDeck(): Tile[] {
  const deck: Tile[] = [];
  // 万子牌 (1m-9m)，每种4张 = 36张
  const manIds: TileId[] = ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m'];
  for (const id of manIds) {
    for (let i = 0; i < 4; i++) {
      deck.push(createTile(id));
    }
  }
  // 填充到50张（剩余14张用筒子）
  const pinIds: TileId[] = ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'];
  let pinIdx = 0;
  while (deck.length < 50) {
    deck.push(createTile(pinIds[pinIdx % 9]));
    pinIdx++;
  }
  return deck;
}

// ========== 创建国士无双测试牌组 ==========
function createGuoshiDeck(): Tile[] {
  const deck: Tile[] = [];
  // 国士无双需要的13种幺九牌，每种4张
  const guoshiIds: TileId[] = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z'];
  for (const id of guoshiIds) {
    for (let i = 0; i < 4; i++) {
      deck.push(createTile(id));
    }
  }
  // 52张，超出50张没关系，shuffle后取前50张即可
  return deck;
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
  // 1. 创建牌组（根据测试配置选择牌组）
  const testDeck = getTestDeck();
  let fullDeck: Tile[];
  if (testDeck === 'tiao') {
    fullDeck = createTiaoDeck();
  } else if (testDeck === 'tong') {
    fullDeck = createTongDeck();
  } else if (testDeck === 'wan') {
    fullDeck = createWanDeck();
  } else if (testDeck === 'guoshi') {
    fullDeck = createGuoshiDeck();
  } else {
    fullDeck = createFullDeck();
  }
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
  
  // 9. 计算目标分数：第1关为基础分(默认100)，之后每关是上一关的5倍
  const BASE_TARGET_SCORE = 100;
  const targetScore = level === 1 ? BASE_TARGET_SCORE : BASE_TARGET_SCORE * Math.pow(5, level - 1);
  
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
export function discardAndDraw(
  wall: WallState,
  hand: HandState,
  discardTile: Tile,
  itemSlots?: ItemSlot[]
): { 
  newHand: HandState; 
  newWall: WallState; 
  drawnTile: Tile | null;
  message: string;
  isWin: boolean;  // 是否胡牌
  winPattern: PatternResult;
  winFan: number;
  winScore: number;
  isWallEmpty: boolean; // 牌山是否已空
  universalDisplayTile: TileId | null; // 万能牌临时显示的牌ID（胡牌时）
  scoreFormula: string; // 得分计算公式
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
    let bestPatternResult: PatternResult = { name: '' };
    let bestPatternName = '';
    let bestFan = 0;
    
    let bestTileId: TileId | null = null;
    
    if (hasUniversal) {
      // 有万能牌：使用evaluateHandWithUniversal评估
      const evalResult = evaluateHandWithUniversal(finalHand.tiles);
      if (evalResult.isAgari) {
        agariResult = { isAgari: true, form: 'standard', melds: [], waits: [], isTsumo: true, isMenzen: true };
        bestPatternName = evalResult.pattern;
        bestFan = evalResult.fan;
        bestTileId = evalResult.bestTileId;
      }
    } else {
      // 无万能牌：使用向听数计算判定胡牌
      const tiles34 = tilesTo34(finalHand.tiles);
      if (isAgariWithShanten(tiles34)) {
        agariResult = { isAgari: true, form: 'standard', melds: [], waits: [], isTsumo: true, isMenzen: true };
        bestPatternName = detectPattern(tiles34);
        bestFan = calculateFan(bestPatternName, finalHand);
      }
    }
    
    if (agariResult) {
      const baseScore = calculateBaseScore(finalHand);
      let score = baseScore * bestFan;
      
      // 获取牌型结果（含花色信息，用于道具卡判定）
      // 有万能牌时，使用evaluateHandWithUniversal返回的牌型名称，并补充花色信息
      let patternResult: PatternResult;
      if (hasUniversal) {
        const tiles34 = tilesTo34(finalHand.tiles);
        const suitResult = detectPatternWithSuit(tiles34);
        // 使用evaluateHandWithUniversal的牌型名称（更准确），但保留花色信息
        patternResult = {
          name: bestPatternName,
          suit: suitResult.suit
        };
      } else {
        const tiles34 = tilesTo34(finalHand.tiles);
        patternResult = detectPatternWithSuit(tiles34);
      }
      
      // 应用道具卡效果（负重前行等）
      if (itemSlots && itemSlots.length > 0) {
        const effectResult = applyItemEffects(score, patternResult, itemSlots, finalHand);
        score = effectResult.finalScore;
      }
      
      // 检查牌山是否已空
      const wallEmpty = drawResult.newWall.currentIndex >= drawResult.newWall.tiles.length;
      
      // 构建得分计算公式
      const formulaParts: string[] = [];
      formulaParts.push(`基础分${baseScore}`);
      formulaParts.push(`×${bestFan}番`);
      
      // 应用道具卡效果
      let effectResult: { finalScore: number; details: string[]; totalMultiplier: number } | null = null;
      if (itemSlots && itemSlots.length > 0) {
        effectResult = applyItemEffects(baseScore * bestFan, patternResult, itemSlots, finalHand);
        score = effectResult.finalScore;
        
        // 只有实际有道具卡倍率加成时才显示倍率
        if (effectResult.totalMultiplier > 1) {
          const totalMul = effectResult.totalMultiplier;
          if (totalMul > 10000) {
            formulaParts.push(`×${formatScore(totalMul)}倍率`);
          } else {
            formulaParts.push(`×${totalMul.toFixed(2)}倍率`);
          }
        }
      }
      
      const scoreFormula = formulaParts.join(' ') + ` = ${formatScore(score)}分`;
      
      return {
        newHand: finalHand,
        newWall: drawResult.newWall,
        drawnTile: null,
        message: `胡牌！${bestPatternName} ${bestFan}番 ${formatScore(score)}分`,
        isWin: true,
        winPattern: patternResult,
        winFan: bestFan,
        winScore: score,
        isWallEmpty: wallEmpty,
        universalDisplayTile: bestTileId,
        scoreFormula
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
      winPattern: { name: '' },
      winFan: 0,
      winScore: 0,
      isWallEmpty: true,
      universalDisplayTile: null,
      scoreFormula: ''
    };
  }
  
  // 5. 牌山还有牌，正常继续游戏
  return {
    newHand: drawResult.newHand,
    newWall: drawResult.newWall,
    drawnTile: drawResult.tile,
    message: `摸到 ${TILE_NAMES[drawResult.tile!.id as TileId]}，请选择一张牌丢弃`,
    isWin: false,
    winPattern: { name: '' },
    winFan: 0,
    winScore: 0,
    isWallEmpty: false,
    universalDisplayTile: null,
    scoreFormula: ''
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
export function checkWin(hand: HandState, winningTile?: Tile): { isWin: boolean; pattern: PatternResult; fan: number; score: number } {
  const lastTile = winningTile || hand.lastDraw;
  if (!lastTile || hand.tiles.length !== 14) {
    return { isWin: false, pattern: { name: '' }, fan: 0, score: 0 };
  }
  
  // 使用向听数计算判定胡牌（直接对14张牌判定）
  const tiles34 = tilesTo34(hand.tiles);
  if (isAgariWithShanten(tiles34)) {
    // 正确识别牌型名称和花色
    const pattern = detectPatternWithSuit(tiles34);
    const fan = calculateFan(pattern.name, hand);
    const baseScore = calculateBaseScore(hand);
    return {
      isWin: true,
      pattern,
      fan,
      score: baseScore * fan
    };
  }
  
  return { isWin: false, pattern: { name: '' }, fan: 0, score: 0 };
}

// ========== 根据和了形态获取牌型名称 ==========
function getPatternNameFromForm(form?: string): string {
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
// 注意：传入的 baseScore 已经是"基础分 × 番数"后的结果
// 本函数只应用道具卡的倍率效果
export function applyItemEffects(
  baseScore: number,
  patternResult: PatternResult,
  itemSlots: ItemSlot[],
  hand?: HandState
): { finalScore: number; details: string[]; totalMultiplier: number; universalTiles?: Tile[] } {
  let score = baseScore;
  const details: string[] = [];
  let universalTiles: Tile[] = [];
  let totalMultiplier = 1;
  
  // 依次应用8个槽位的道具卡
  for (let i = 0; i < itemSlots.length; i++) {
    const slot = itemSlots[i];
    if (!slot.card) continue;
    
    const card = slot.card;
    let triggered = false;
    let multiplier = 1;
    
    switch (card.id) {
      case 'wuxiang':
        // 万象天引：将手牌中的一张牌变成万能牌
        if (hand && hand.tiles.length > 0) {
          const targetTile = hand.tiles[hand.tiles.length - 1];
          if (targetTile.id !== 'universal') {
            universalTiles.push(targetTile);
            details.push(`[槽${i+1}] ${card.name}: ${targetTile.id}→万能牌`);
          }
        }
        break;
        
      case 'fuzhong1':
      case 'fuzhong2':
        triggered = true;
        multiplier = slot.multiplier;
        break;
        
      case 'tiaotiao':
        // 条一色：清一色(条) 或 九莲宝灯(条)
        if (isSuitPattern(patternResult, 's')) {
          triggered = true;
          multiplier = 10;
        }
        break;
        
      case 'binbin':
        // 筒一色：清一色(筒) 或 九莲宝灯(筒)
        if (isSuitPattern(patternResult, 'p')) {
          triggered = true;
          multiplier = 10;
        }
        break;
        
      case 'wanwan':
        // 万一色：清一色(万) 或 九莲宝灯(万)
        if (isSuitPattern(patternResult, 'm')) {
          triggered = true;
          multiplier = 10;
        }
        break;
        
      case 'guoshi':
        if (patternResult.name === '国士无双') {
          triggered = true;
          multiplier = 52;
        }
        break;
        
      case 'tongtian':
        // 通天藤蔓：条一色（清一色(条) 或 九莲宝灯(条)）
        // 或者万能牌临时变成了条子牌
        const hasTongtianUniversal = universalTiles.length > 0 && universalTiles.some(tile => {
          const idx = ALL_TILE_IDS.indexOf(tile.id as TileId);
          return idx >= 18 && idx <= 26;
        });
        if (hasTongtianUniversal || isSuitPattern(patternResult, 's')) {
          triggered = true;
          multiplier = slot.multiplier;
        }
        break;
    }
    
    if (triggered && multiplier !== 1) {
      score *= multiplier;
      totalMultiplier *= multiplier;
      details.push(`[槽${i+1}] ${card.name} ×${multiplier.toFixed(2)} = ${formatScore(Math.floor(score))}`);
    }
  }
  
  return { finalScore: Math.floor(score), details, totalMultiplier, universalTiles };
}

// ========== 创建初始游戏状态 ==========
export function createGameState(): GameState {
  return {
    level: 1,
    totalScore: 0,
    itemSlots: Array(8).fill(null).map(() => ({ card: null, multiplier: 1 })),
    shopChoices: [],
    gameOver: false,
    message: '欢迎来到青云之志！'
  };
}

// ========== 生成商店选项 ==========
export function generateShopChoices(currentSlots?: ItemSlot[]): ItemCard[] {
  // 检查玩家是否已经有万象天引
  const hasWuxiang = currentSlots?.some(slot => slot.card?.id === 'wuxiang');
  
  // 如果已有万象天引，从可选牌堆中移除
  let availableCards = ITEM_CARDS;
  if (hasWuxiang) {
    availableCards = ITEM_CARDS.filter(c => c.id !== 'wuxiang');
  }
  
  const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
  const choices = shuffled.slice(0, 3);
  
  // 作弊模式：第一关强制包含负重前行
  if (currentSlots && currentSlots.every(s => s.card === null)) {
    const hasFuzhong = choices.some(c => c.id === 'fuzhong1' || c.id === 'fuzhong2');
    if (!hasFuzhong) {
      // 替换第一个选项为负重前行
      choices[0] = ITEM_CARDS.find(c => c.id === 'fuzhong1') || choices[0];
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
export function updateItemsAfterWin(
  itemSlots: ItemSlot[], 
  patternResult: PatternResult
): ItemSlot[] {
  return itemSlots.map(slot => {
    if (!slot.card) return slot;
    
    const newSlot = { ...slot };
    
    // 通天藤蔓：胡牌牌型为条一色（清一色(条) 或 九莲宝灯(条)）时触发
    if (slot.card.id === 'tongtian' && isSuitPattern(patternResult, 's')) {
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
