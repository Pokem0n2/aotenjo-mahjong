/**
 * hand.ts - 手牌操作、吃碰杠
 */
import { Tile, TileId, Suit, ALL_TILE_IDS, TileCounts, UNIVERSAL_TILE_ID } from '../types/tile';
import { sortTiles } from './deck';

/** 副露类型 */
export type MeldType = 'chi' | 'pon' | 'ankan' | 'minkan' | 'kakan';

/** 副露（面子） */
export interface Meld {
  type: MeldType;
  tiles: Tile[];
  fromPlayer?: number;  // 吃/碰/明杠时的来源玩家
  calledTile?: Tile;    // 被叫的那张牌
}

/** 玩家手牌状态 */
export interface HandState {
  tiles: Tile[];         // 手牌（门前清部分）
  melds: Meld[];         // 副露
  discards: Tile[];      // 弃牌
  riichi: boolean;       // 是否立直
  ippatsu: boolean;      // 一发
  menzen: boolean;       // 门前清
  tsumo: boolean;        // 自摸
  lastDraw?: Tile;       // 最后摸的牌
  lastDiscard?: Tile;    // 最后弃的牌
}

/** 创建空手牌 */
export function createHand(): HandState {
  return {
    tiles: [],
    melds: [],
    discards: [],
    riichi: false,
    ippatsu: false,
    menzen: true,
    tsumo: false,
  };
}

/** 初始化手牌（发牌后） */
export function initHand(tiles: Tile[]): HandState {
  const sorted = [...tiles];
  sortTiles(sorted);
  return {
    ...createHand(),
    tiles: sorted,
  };
}

/** 摸牌 */
import { sortHandTiles, sortAfterDiscard } from './deck';

export function handDraw(hand: HandState, tile: Tile): HandState {
  // 新规则：摸牌后，新牌固定在最右侧，其余牌排序
  const newTiles = [...hand.tiles, tile];
  const sortedTiles = sortHandTiles(newTiles, tile);
  return {
    ...hand,
    tiles: sortedTiles,
    lastDraw: tile,
    tsumo: false,
  };
}

/** 出牌 */
export function handDiscard(hand: HandState, tileIndex: number): { hand: HandState; tile: Tile } {
  const tile = hand.tiles[tileIndex];
  const newTiles = hand.tiles.filter((_, i) => i !== tileIndex);
  // 新规则：弃牌后，最右侧牌保持不动，其余牌排序
  const sortedTiles = sortAfterDiscard(newTiles);
  return {
    hand: {
      ...hand,
      tiles: sortedTiles,
      discards: [...hand.discards, tile],
      lastDiscard: tile,
      lastDraw: undefined as unknown as Tile,
      ippatsu: false, // 出牌后一发消失
    },
    tile,
  };
}

/** 检查能否吃（上家的牌） */
export function canChi(hand: HandState, tile: Tile, _fromPlayer: number): boolean {
  // 只能吃上家的牌
  // （在实际实现中需要检查玩家位置关系，这里简化）
  if (tile.isHonor) return false; // 字牌不能吃
  if (!hand.menzen || hand.melds.length > 0) {
    // 非门前清也可以吃
  }

  const suit = tile.suit;
  const value = tile.value;
  const counts = suitCounts(hand.tiles, suit);

  // 检查三种组合: [n-2,n-1,n], [n-1,n,n+1], [n,n+1,n+2]
  let canForm = false;
  if (value >= 3 && counts[value - 3] > 0 && counts[value - 2] > 0) canForm = true;
  if (value >= 2 && value <= 8 && counts[value - 2] > 0 && counts[value] > 0) canForm = true;
  if (value <= 7 && counts[value] > 0 && counts[value + 1 - 1] > 0) canForm = true;

  return canForm;
}

/** 执行吃 */
export function doChi(hand: HandState, tile: Tile, combo: [number, number]): { hand: HandState; meld: Meld } {
  // combo是手牌中两张牌的索引
  const [i1, i2] = combo;
  const meldTiles = [hand.tiles[i1], hand.tiles[i2], tile];
  meldTiles.sort((a, b) => a.value - b.value);

  const newTiles = hand.tiles.filter((_, i) => i !== i1 && i !== i2);
  sortTiles(newTiles);

  const meld: Meld = {
    type: 'chi',
    tiles: meldTiles,
    calledTile: tile,
  };

  return {
    hand: {
      ...hand,
      tiles: newTiles,
      melds: [...hand.melds, meld],
      menzen: false,
    },
    meld,
  };
}

/** 检查能否碰 */
export function canPon(hand: HandState, tile: Tile): boolean {
  const count = hand.tiles.filter(t => t.id === tile.id).length;
  return count >= 2;
}

/** 执行碰 */
export function doPon(hand: HandState, tile: Tile, fromPlayer: number): { hand: HandState; meld: Meld } {
  // 从手牌中移除两张相同的牌
  let removed = 0;
  const newTiles = hand.tiles.filter(t => {
    if (t.id === tile.id && removed < 2) {
      removed++;
      return false;
    }
    return true;
  });

  const meld: Meld = {
    type: 'pon',
    tiles: [tile, tile, tile], // 简化，实际需要区分来源
    fromPlayer,
    calledTile: tile,
  };

  return {
    hand: {
      ...hand,
      tiles: newTiles,
      melds: [...hand.melds, meld],
      menzen: false,
    },
    meld,
  };
}

/** 检查能否暗杠 */
export function canAnkan(hand: HandState): TileId[] {
  const counts: Record<string, number> = {};
  for (const t of hand.tiles) {
    counts[t.id] = (counts[t.id] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([_, count]) => count >= 4)
    .map(([id]) => id as TileId);
}

/** 执行暗杠 */
export function doAnkan(hand: HandState, tileId: TileId): { hand: HandState; meld: Meld } {
  let removed = 0;
  const newTiles = hand.tiles.filter(t => {
    if (t.id === tileId && removed < 4) {
      removed++;
      return false;
    }
    return true;
  });

  const meld: Meld = {
    type: 'ankan',
    tiles: [createTileFromId(tileId), createTileFromId(tileId), createTileFromId(tileId), createTileFromId(tileId)],
  };

  return {
    hand: {
      ...hand,
      tiles: newTiles,
      melds: [...hand.melds, meld],
      // 暗杠不影响门前清
    },
    meld,
  };
}

/** 检查能否明杠 */
export function canMinkan(hand: HandState, tile: Tile): boolean {
  const count = hand.tiles.filter(t => t.id === tile.id).length;
  return count >= 3;
}

/** 检查能否加杠（碰后加第四张） */
export function canKakan(hand: HandState, tile: Tile): boolean {
  return hand.melds.some(m => m.type === 'pon' && m.tiles[0].id === tile.id);
}

/** 手牌中指定花色的数值统计 */
function suitCounts(tiles: Tile[], suit: Suit): number[] {
  const counts = new Array(10).fill(0); // index 1-9
  for (const t of tiles) {
    if (t.suit === suit) {
      counts[t.value]++;
    }
  }
  return counts;
}

/** 工具：从ID创建牌 */
function createTileFromId(id: TileId): Tile {
  const suit = id[1] as Suit;
  const value = parseInt(id[0]);
  return {
    id,
    suit,
    value,
    isHonor: suit === 'z',
    isTerminal: suit !== 'z' && (value === 1 || value === 9),
  };
}

/** 获取手牌中万能牌数量 */
export function getUniversalCount(hand: HandState): number {
  return hand.tiles.filter(t => t.id === UNIVERSAL_TILE_ID).length;
}

/** 计算手牌中每种牌的数量（含万能牌展开） */
export function handToFlexibleCounts(hand: HandState): { base: TileCounts; universalCount: number } {
  const base = new Array(34).fill(0);
  let universalCount = 0;
  for (const tile of hand.tiles) {
    if (tile.id === UNIVERSAL_TILE_ID) {
      universalCount++;
    } else {
      const idx = ALL_TILE_IDS.indexOf(tile.id as TileId);
      if (idx >= 0) base[idx]++;
    }
  }
  return { base, universalCount };
}
