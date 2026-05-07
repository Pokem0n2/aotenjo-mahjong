/**
 * 麻将牌类型定义
 * 万子(m): 1m-9m
 * 筒子(p): 1p-9p  
 * 索子(s): 1s-9s
 * 字牌(z): 1z-7z (东南西北白发中)
 */

export type Suit = 'm' | 'p' | 's' | 'z';

export interface Tile {
  id: string;        // 唯一标识，如 "1m", "5p", "7z"
  suit: Suit;
  value: number;     // 1-9 或 1-7(字牌)
  isHonor: boolean;  // 是否为字牌
  isTerminal: boolean; // 是否为幺九牌(1,9)
}

export type TileId = 
  | '1m'|'2m'|'3m'|'4m'|'5m'|'6m'|'7m'|'8m'|'9m'
  | '1p'|'2p'|'3p'|'4p'|'5p'|'6p'|'7p'|'8p'|'9p'
  | '1s'|'2s'|'3s'|'4s'|'5s'|'6s'|'7s'|'8s'|'9s'
  | '1z'|'2z'|'3z'|'4z'|'5z'|'6z'|'7z';

// 34种标准日麻牌
export const ALL_TILE_IDS: TileId[] = [
  '1m','2m','3m','4m','5m','6m','7m','8m','9m',
  '1p','2p','3p','4p','5p','6p','7p','8p','9p',
  '1s','2s','3s','4s','5s','6s','7s','8s','9s',
  '1z','2z','3z','4z','5z','6z','7z'
];

// 创建牌对象
export function createTile(id: TileId): Tile {
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

// 创建完整牌山（136张，每种4张）
export function createFullDeck(): Tile[] {
  const deck: Tile[] = [];
  for (const id of ALL_TILE_IDS) {
    for (let i = 0; i < 4; i++) {
      deck.push(createTile(id));
    }
  }
  return deck;
}

// 洗牌
export function shuffleDeck(deck: Tile[]): Tile[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 手牌计数 (34维数组)
export type TileCounts = number[]; // length 34

export function handToCounts(hand: Tile[]): TileCounts {
  const counts = new Array(34).fill(0);
  for (const tile of hand) {
    const idx = ALL_TILE_IDS.indexOf(tile.id as TileId);
    if (idx >= 0) counts[idx]++;
  }
  return counts;
}

// 牌名映射
export const TILE_NAMES: Record<TileId, string> = {
  '1m': '一万', '2m': '二万', '3m': '三万', '4m': '四万', '5m': '五万',
  '6m': '六万', '7m': '七万', '8m': '八万', '9m': '九万',
  '1p': '一筒', '2p': '二筒', '3p': '三筒', '4p': '四筒', '5p': '五筒',
  '6p': '六筒', '7p': '七筒', '8p': '八筒', '9p': '九筒',
  '1s': '一条', '2s': '二条', '3s': '三条', '4s': '四条', '5s': '五条',
  '6s': '六条', '7s': '七条', '8s': '八条', '9s': '九条',
  '1z': '东风', '2z': '南风', '3z': '西风', '4z': '北风',
  '5z': '白板', '6z': '发财', '7z': '红中',
};

// 万能牌ID
export const UNIVERSAL_TILE_ID = 'universal';

export interface UniversalTile extends Tile {
  id: typeof UNIVERSAL_TILE_ID;
  originalId: TileId; // 显示用的原始牌
  canBeAny: true;
}

export function createUniversalTile(originalId: TileId = '5z'): UniversalTile {
  const base = createTile(originalId);
  return {
    ...base,
    id: UNIVERSAL_TILE_ID,
    originalId,
    canBeAny: true,
  };
}
