// 麻将牌ID类型
export type TileType = 'm' | 'p' | 's' | 'z';
export type TileId = `${number}${TileType}`;

// 牌山 (deck) - 摸牌顺序
export type Deck = TileId[];

// 手牌
export type Hand = TileId[];

// 副露 (吃碰杠)
export type MeldType = 'pon' | 'chi' | 'kan' | 'ankang';
export interface Meld {
  type: MeldType;
  tiles: TileId[];
  from?: 'left' | 'center' | 'right'; // 吃牌来源
}

// 玩家状态
export interface PlayerState {
  hand: Hand;
  melds: Meld[];
  discards: TileId[];
  riichi: boolean;
  riichiSticks: number;
}

// 游戏状态
export type GamePhase = 'draw' | 'discard' | 'pon' | 'chi' | 'kan' | 'ron' | 'tsumo' | 'end';

export interface GameState {
  phase: GamePhase;
  deck: Deck;
  deckIndex: number;
  currentPlayer: number; // 0-3
  players: PlayerState[];
  lastDiscard?: TileId;
  lastDiscardPlayer?: number;
  doraIndicators: TileId[];
  round: number;
  honba: number;
  riichiSticks: number;
  scores: number[];
 oya: number;
}

// 牌型常量
export const TILE_SUITS: TileType[] = ['m', 'p', 's', 'z'];
export const TILE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

// 生成所有34张牌
export const ALL_TILES: TileId[] = [
  ...TILE_NUMBERS.map(n => `${n}m` as TileId),
  ...TILE_NUMBERS.map(n => `${n}p` as TileId),
  ...TILE_NUMBERS.map(n => `${n}s` as TileId),
  '1z', '2z', '3z', '4z', '5z', '6z', '7z',
];

// 万能牌 (天指定牌)
export const JOKER_TILE: TileId = '5z';
