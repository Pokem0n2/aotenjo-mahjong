/**
 * deck.ts - 牌山管理、发牌、摸牌
 * 包含万能天引功能
 */
import { Tile, TileId, ALL_TILE_IDS, shuffleDeck, createFullDeck, UniversalTile } from '../types/tile';

/** 牌山配置 */
const DEAD_WALL_SIZE = 14; // 王牌（含岭上牌和里宝牌指示牌）

/** 牌山状态 */
export interface DeckState {
  wall: Tile[];           // 牌山（可摸的牌）
  deadWall: Tile[];       // 王牌
  doraIndicators: Tile[]; // 宝牌指示牌
  uraDoraIndicators: Tile[]; // 里宝牌指示牌
  kanDraws: number;       // 杠后摸牌次数（岭上牌）
  currentIndex: number;   // 当前摸牌位置（从牌山头部）
  deadWallIndex: number;  // 王牌中岭上牌的起始位置
}

/** 创建并洗牌 */
export function createDeck(): DeckState {
  const allTiles = createFullDeck();
  const shuffled = shuffleDeck(allTiles);

  // 从末尾取王牌（实际日麻从牌山尾部取）
  const deadWall = shuffled.splice(-DEAD_WALL_SIZE, DEAD_WALL_SIZE);

  // 第一张为宝牌指示牌（初始1张，暗杠后增加）
  const doraIndicators = [deadWall[0]];
  const uraDoraIndicators = [deadWall[1]];

  return {
    wall: shuffled,
    deadWall,
    doraIndicators,
    uraDoraIndicators,
    kanDraws: 0,
    currentIndex: 0,
    deadWallIndex: 2, // 前两张是宝牌指示牌，后面是岭上牌
  };
}

/** 发牌：返回4个玩家的手牌 */
export function dealHands(deck: DeckState): { hands: Tile[][]; deck: DeckState } {
  const hands: Tile[][] = [[], [], [], []];

  // 每人发12张（3轮 × 4张）
  for (let round = 0; round < 3; round++) {
    for (let player = 0; player < 4; player++) {
      for (let i = 0; i < 4; i++) {
        hands[player].push(drawTile(deck));
      }
    }
  }

  // 庄家多摸一张
  hands[0].push(drawTile(deck));

  // 排序手牌
  for (const hand of hands) {
    sortTiles(hand);
  }

  return { hands, deck };
}

/** 摸牌：从牌山头部取一张 */
export function drawTile(deck: DeckState): Tile {
  if (deck.currentIndex >= deck.wall.length) {
    // 牌山摸完，流局
    throw new Error('牌山已空，流局');
  }
  return deck.wall[deck.currentIndex++];
}

/** 岭上摸牌（杠后摸牌，从王牌区取） */
export function drawFromDeadWall(deck: DeckState): Tile {
  if (deck.deadWallIndex >= deck.deadWall.length) {
    throw new Error('岭上牌已空');
  }
  deck.kanDraws++;

  // 每次杠后追加一张宝牌指示牌（最多4张）
  if (deck.doraIndicators.length < 4) {
    const nextDora = deck.deadWall[deck.doraIndicators.length + deck.uraDoraIndicators.length];
    if (nextDora) {
      deck.doraIndicators.push(nextDora);
      const uraIdx = deck.doraIndicators.length + deck.uraDoraIndicators.length;
      if (uraIdx < deck.deadWall.length) {
        deck.uraDoraIndicators.push(deck.deadWall[uraIdx]);
      }
    }
  }

  return deck.deadWall[deck.deadWallIndex++];
}

/** 万能天引：玩家主动从牌山抽取指定牌 */
export function drawSpecific(deck: DeckState, targetTileId: TileId, universalTile?: UniversalTile): Tile {
  // 从牌山中找到目标牌
  const idx = deck.wall.findIndex(
    (t, i) => i >= deck.currentIndex && t.id === targetTileId
  );

  if (idx >= 0) {
    // 找到了，把目标牌换到当前位置，然后摸出
    const found = deck.wall[idx];
    deck.wall[idx] = deck.wall[deck.currentIndex];
    deck.wall[deck.currentIndex] = found;
    return drawTile(deck);
  }

  // 牌山中没有该牌了，使用万能牌代替
  if (universalTile) {
    return universalTile;
  }

  // 没有万能牌，从牌山正常摸
  console.warn(`牌山中已无 ${targetTileId}，改为正常摸牌`);
  return drawTile(deck);
}

/** 剩余牌数 */
export function remainingTiles(deck: DeckState): number {
  return deck.wall.length - deck.currentIndex;
}

/** 排序工具 */
export function sortTiles(tiles: Tile[]): void {
  const order: Record<string, number> = {};
  ALL_TILE_IDS.forEach((id, i) => order[id] = i);
  tiles.sort((a, b) => (order[a.id] ?? 99) - (order[b.id] ?? 99));
}

/** 获取宝牌列表 */
export function getDoraList(deck: DeckState): TileId[] {
  return deck.doraIndicators.map(ind => getNextTile(ind.id as TileId));
}

/** 获取里宝牌列表 */
export function getUraDoraList(deck: DeckState): TileId[] {
  return deck.uraDoraIndicators.map(ind => getNextTile(ind.id as TileId));
}

/** 宝牌指示牌 → 宝牌（下一张） */
function getNextTile(tileId: TileId): TileId {
  const suit = tileId[1];
  const value = parseInt(tileId[0]);

  if (suit === 'z') {
    // 字牌: 1234 → 2341 (东南西北循环), 567 → 675 (白发中循环)
    if (value <= 4) return `${value % 4 + 1}z` as TileId;
    return `${(value - 5) % 3 + 5 + 1 > 7 ? 5 : (value - 5 + 1) % 3 + 5}z` as TileId;
  }

  // 数牌: 1→2→...→9→1
  return `${(value % 9) + 1}${suit}` as TileId;
}
