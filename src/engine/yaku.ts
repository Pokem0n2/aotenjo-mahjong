/**
 * yaku.ts - 役种判定系统
 * 实现日麻所有标准役种（翻数制）
 */
import { Tile, TileId, ALL_TILE_IDS, Suit } from '../types/tile';
import { Meld, HandState } from './hand';

/** 役种定义 */
export interface Yaku {
  name: string;        // 日文名
  nameEn: string;      // 英文名
  han: number;         // 翻数（门前清时/副露后）
  isYakuman: boolean;  // 是否役满
  menzenOnly?: boolean; // 是否门清限定
}

/** 检测到的役 */
export interface DetectedYaku {
  yaku: Yaku;
  han: number; // 实际翻数
}

/** 所有役种 */
export const YAKU_LIST = {
  // 一翻役
  RIICHI: { name: '立直', nameEn: 'Riichi', han: 1, menzenOnly: true, isYakuman: false },
  IPPATSU: { name: '一発', nameEn: 'Ippatsu', han: 1, menzenOnly: true, isYakuman: false },
  MENZEN_TSUMO: { name: '門前清自摸和', nameEn: 'Menzen Tsumo', han: 1, menzenOnly: true, isYakuman: false },
  TANYAO: { name: '断幺九', nameEn: 'Tanyao', han: 1, isYakuman: false },
  PINFU: { name: '平和', nameEn: 'Pinfu', han: 1, menzenOnly: true, isYakuman: false },
  IIPEIKOU: { name: '一盃口', nameEn: 'Iipeikou', han: 1, menzenOnly: true, isYakuman: false },
  YAKUHAI_HAKU: { name: '白', nameEn: 'Yakuhai (Haku)', han: 1, isYakuman: false },
  YAKUHAI_HATSU: { name: '発', nameEn: 'Yakuhai (Hatsu)', han: 1, isYakuman: false },
  YAKUHAI_CHUN: { name: '中', nameEn: 'Yakuhai (Chun)', han: 1, isYakuman: false },
  YAKUHAI_BAKAZE: { name: '場風', nameEn: 'Yakuhai (Bakaze)', han: 1, isYakuman: false },
  YAKUHAI_JIKAZE: { name: '自風', nameEn: 'Yakuhai (Jikaze)', han: 1, isYakuman: false },
  CHANTA: { name: '混全帯幺九', nameEn: 'Chanta', han: 2, isYakuman: false },
  ITTSU: { name: '一気通貫', nameEn: 'Ittsu', han: 2, isYakuman: false },
  SANSHOKU_DOUJUN: { name: '三色同順', nameEn: 'Sanshoku Doujun', han: 2, isYakuman: false },
  SANSHOKU_DOUKOU: { name: '三色同刻', nameEn: 'Sanshoku Doukou', han: 2, isYakuman: false },
  TOITOI: { name: '対々和', nameEn: 'Toitoi', han: 2, isYakuman: false },
  SANANKOU: { name: '三暗刻', nameEn: 'Sanankou', han: 2, isYakuman: false },
  SANKANTSU: { name: '三槓子', nameEn: 'Sankantsu', han: 2, isYakuman: false },
  HONROUTOU: { name: '混老頭', nameEn: 'Honroutou', han: 2, isYakuman: false },
  CHIITOITSU: { name: '七対子', nameEn: 'Chiitoitsu', han: 2, menzenOnly: true, isYakuman: false },
  SHOUSANGEN: { name: '小三元', nameEn: 'Shousangen', han: 2, isYakuman: false },
  HONITSU: { name: '混一色', nameEn: 'Honitsu', han: 3, isYakuman: false },
  JUNCHAN: { name: '純全帯幺九', nameEn: 'Junchan', han: 3, isYakuman: false },
  RYANPEIKOU: { name: '二盃口', nameEn: 'Ryanpeikou', han: 3, menzenOnly: true, isYakuman: false },
  CHINITSU: { name: '清一色', nameEn: 'Chinitsu', han: 6, isYakuman: false },
  // 役满
  KOKUSHI: { name: '国士無双', nameEn: 'Kokushi Musou', han: 0, menzenOnly: true, isYakuman: true },
  SUUANKOU: { name: '四暗刻', nameEn: 'Suuankou', han: 0, menzenOnly: true, isYakuman: true },
  DAISANGEN: { name: '大三元', nameEn: 'Daisangen', han: 0, isYakuman: true },
  SHOUSUUSHII: { name: '小四喜', nameEn: 'Shousuushii', han: 0, isYakuman: true },
  DAISUUSHII: { name: '大四喜', nameEn: 'Daisuushii', han: 0, isYakuman: true },
  TSUUIISOU: { name: '字一色', nameEn: 'Tsuuiisou', han: 0, isYakuman: true },
  CHINROUTOU: { name: '清老頭', nameEn: 'Chinroutou', han: 0, isYakuman: true },
  RYUUIISOU: { name: '緑一色', nameEn: 'Ryuuiisou', han: 0, isYakuman: true },
  CHUUREN: { name: '九蓮宝燈', nameEn: 'Chuuren Poutou', han: 0, menzenOnly: true, isYakuman: true },
  SUUKANTSU: { name: '四槓子', nameEn: 'Suukantsu', han: 0, isYakuman: true },
  TENHOU: { name: '天和', nameEn: 'Tenhou', han: 0, menzenOnly: true, isYakuman: true },
  CHIIHOU: { name: '地和', nameEn: 'Chiihou', han: 0, menzenOnly: true, isYakuman: true },
} as const;

/** 牌ID转数值索引（0-33） */
function tileIdToIndex(id: TileId): number {
  return ALL_TILE_IDS.indexOf(id);
}

/** 检查是否断幺九 */
export function isTanyao(tiles: Tile[], melds: Meld[]): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }
  return allTiles.every(t => !t.isHonor && !t.isTerminal);
}

/** 检查是否平和（4个顺子 + 非役牌雀头 + 两面听） */
export function isPinfu(hand: HandState, __winningTile: Tile): boolean {
  if (!hand.menzen) return false;
  if (hand.melds.length > 0) return false;

  // 简化判断：需要完整的面子分析
  // 这里做基础检查
  const counts = new Array(34).fill(0);
  for (const t of hand.tiles) {
    counts[tileIdToIndex(t.id as TileId)]++;
  }

  // 需要4个顺子 + 1个非役牌雀头
  // 实际实现需要完整的和了形解析
  return true; // 占位，需要完整实现
}

/** 检查一気通貫 */
export function isIttsu(tiles: Tile[], melds: Meld[]): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }

  // 检查每个花色是否包含 1-2-3, 4-5-6, 7-8-9
  const suits: Suit[] = ['m', 'p', 's'];
  for (const suit of suits) {
    const suitTiles = allTiles.filter(t => t.suit === suit);
    const vals = new Set(suitTiles.map(t => t.value));
    const has123 = vals.has(1) && vals.has(2) && vals.has(3);
    const has456 = vals.has(4) && vals.has(5) && vals.has(6);
    const has789 = vals.has(7) && vals.has(8) && vals.has(9);
    if (has123 && has456 && has789) return true;
  }
  return false;
}

/** 检查三色同順 */
export function isSanshokuDoujun(tiles: Tile[], melds: Meld[]): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }

  // 检查三个花色是否包含相同的顺子
  for (let v = 1; v <= 7; v++) {
    const hasM = allTiles.some(t => t.suit === 'm' && t.value === v) &&
                 allTiles.some(t => t.suit === 'm' && t.value === v + 1) &&
                 allTiles.some(t => t.suit === 'm' && t.value === v + 2);
    const hasP = allTiles.some(t => t.suit === 'p' && t.value === v) &&
                 allTiles.some(t => t.suit === 'p' && t.value === v + 1) &&
                 allTiles.some(t => t.suit === 'p' && t.value === v + 2);
    const hasS = allTiles.some(t => t.suit === 's' && t.value === v) &&
                 allTiles.some(t => t.suit === 's' && t.value === v + 1) &&
                 allTiles.some(t => t.suit === 's' && t.value === v + 2);
    if (hasM && hasP && hasS) return true;
  }
  return false;
}

/** 检查混一色 */
export function isHonitsu(tiles: Tile[], melds: Meld[]): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }
  const suits = new Set(allTiles.filter(t => t.suit !== 'z').map(t => t.suit));
  const hasHonor = allTiles.some(t => t.suit === 'z');
  return suits.size === 1 && hasHonor;
}

/** 检查清一色 */
export function isChinitsu(tiles: Tile[], melds: Meld[]): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }
  const suits = new Set(allTiles.filter(t => t.suit !== 'z').map(t => t.suit));
  return suits.size === 1 && !allTiles.some(t => t.suit === 'z');
}

/** 检查対々和（全部刻子） */
export function isToitoi(melds: Meld[]): boolean {
  return melds.every(m => m.type === 'pon' || m.type === 'ankan' || m.type === 'minkan' || m.type === 'kakan');
}

/** 检查三暗刻 */
export function isSanankou(melds: Meld[], _handTiles: Tile[], _winningTile: Tile, isTsumo: boolean): boolean {
  const ankanCount = melds.filter(m => m.type === 'ankan').length;
  // 门前清状态下摸到的刻子也算暗刻
  // 简化实现
  return ankanCount >= 3 || (ankanCount === 2 && isTsumo);
}

/** 检查混老頭 */
export function isHonroutou(tiles: Tile[], melds: Meld[]): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }
  return allTiles.every(t => t.isTerminal || t.isHonor);
}

/** 检查清老頭 */
export function isChinroutou(tiles: Tile[], melds: Meld[]): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }
  return allTiles.every(t => t.isTerminal);
}

/** 检查小三元 */
export function isShousangen(tiles: Tile[], melds: Meld[]): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }
  const dragonTiles = allTiles.filter(t => t.suit === 'z' && t.value >= 5);
  const dragonIds = new Set(dragonTiles.map(t => t.id));
  return dragonIds.size >= 3;
}

/** 检查大三元 */
export function isDaisangen(tiles: Tile[], melds: Meld[]): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }
  const has5z = allTiles.filter(t => t.id === '5z').length >= 3;
  const has6z = allTiles.filter(t => t.id === '6z').length >= 3;
  const has7z = allTiles.filter(t => t.id === '7z').length >= 3;
  return has5z && has6z && has7z;
}

/** 检查字一色 */
export function isTsuuiisou(tiles: Tile[], melds: Meld[]): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }
  return allTiles.every(t => t.suit === 'z');
}

/** 检查九蓮宝燈 */
export function isChuuren(hand: HandState): boolean {
  if (!hand.menzen) return false;
  // 门前清13张，加上和牌14张
  const counts = new Array(10).fill(0); // 1-9
  for (const t of hand.tiles) {
    if (t.suit === 'z') return false;
    counts[t.value]++;
  }
  // 标准形: 1112345678999 + 任意1张同花色
  if (counts[1] >= 3 && counts[9] >= 3 &&
      counts[2] >= 1 && counts[3] >= 1 && counts[4] >= 1 &&
      counts[5] >= 1 && counts[6] >= 1 && counts[7] >= 1 && counts[8] >= 1) {
    return true;
  }
  return false;
}

/** 检查七対子 */
export function isChiitoitsu(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false;
  const counts: Record<string, number> = {};
  for (const t of tiles) {
    counts[t.id] = (counts[t.id] || 0) + 1;
  }
  const pairs = Object.values(counts);
  return pairs.length === 7 && pairs.every(c => c === 2);
}

/** 检查一杯口 */
export function isIipeikou(tiles: Tile[]): boolean {
  const counts = new Array(34).fill(0);
  for (const t of tiles) {
    counts[tileIdToIndex(t.id as TileId)]++;
  }

  let pairCount = 0;
  for (let i = 0; i < 34; i++) {
    const suit = ALL_TILE_IDS[i][1] as Suit;
    const val = parseInt(ALL_TILE_IDS[i][0]);
    if (suit !== 'z' && val <= 7) {
      const i2 = ALL_TILE_IDS.indexOf(`${val + 1}${suit}` as TileId);
      const i3 = ALL_TILE_IDS.indexOf(`${val + 2}${suit}` as TileId);
      if (i2 >= 0 && i3 >= 0 && counts[i] >= 2 && counts[i2] >= 2 && counts[i3] >= 2) {
        pairCount++;
      }
    }
  }
  return pairCount >= 1;
}

/** 检查二杯口 */
export function isRyanpeikou(tiles: Tile[]): boolean {
  const counts = new Array(34).fill(0);
  for (const t of tiles) {
    counts[tileIdToIndex(t.id as TileId)]++;
  }

  let pairCount = 0;
  for (let i = 0; i < 34; i++) {
    const suit = ALL_TILE_IDS[i][1] as Suit;
    const val = parseInt(ALL_TILE_IDS[i][0]);
    if (suit !== 'z' && val <= 7) {
      const i2 = ALL_TILE_IDS.indexOf(`${val + 1}${suit}` as TileId);
      const i3 = ALL_TILE_IDS.indexOf(`${val + 2}${suit}` as TileId);
      if (i2 >= 0 && i3 >= 0 && counts[i] >= 2 && counts[i2] >= 2 && counts[i3] >= 2) {
        pairCount++;
      }
    }
  }
  return pairCount >= 2;
}

/** 役种役满检查 */
export function isYakuman(hand: HandState, winningTile: Tile, isTsumo: boolean, isDealer: boolean): DetectedYaku[] {
  const results: DetectedYaku[] = [];
  const allTiles = [...hand.tiles, winningTile];

  // 国士無双
  if (hand.menzen && isKokushi(allTiles)) {
    results.push({ yaku: YAKU_LIST.KOKUSHI, han: 13 });
    // 国士十三面
    // (可选：检查是否13面听牌)
  }

  // 四暗刻
  if (hand.menzen && isTsumo && isSuuankou(hand.tiles, winningTile)) {
    results.push({ yaku: YAKU_LIST.SUUANKOU, han: 13 });
  }

  // 大三元
  if (isDaisangen(hand.tiles, hand.melds)) {
    results.push({ yaku: YAKU_LIST.DAISANGEN, han: 13 });
  }

  // 字一色
  if (isTsuuiisou(hand.tiles, hand.melds)) {
    results.push({ yaku: YAKU_LIST.TSUUIISOU, han: 13 });
  }

  // 清老頭
  if (isChinroutou(hand.tiles, hand.melds)) {
    results.push({ yaku: YAKU_LIST.CHINROUTOU, han: 13 });
  }

  // 九蓮宝燈
  if (isChuuren(hand)) {
    results.push({ yaku: YAKU_LIST.CHUUREN, han: 13 });
  }

  // 天和/地和
  if (isDealer && isTsumo && hand.menzen && hand.tiles.length === 13) {
    results.push({ yaku: YAKU_LIST.TENHOU, han: 13 });
  }
  if (!isDealer && isTsumo && hand.menzen && hand.tiles.length === 13) {
    results.push({ yaku: YAKU_LIST.CHIIHOU, han: 13 });
  }

  return results;
}

/** 综合役种检测 */
export function detectYaku(hand: HandState, winningTile: Tile, isTsumo: boolean, isDealer: boolean, bakaze: TileId, jikaze: TileId): DetectedYaku[] {
  const results: DetectedYaku[] = [];

  // 先检查役满
  const yakuman = isYakuman(hand, winningTile, isTsumo, isDealer);
  if (yakuman.length > 0) return yakuman; // 役满互斥

  const allTiles = [...hand.tiles, winningTile];
  const menzen = hand.menzen;

  // 一翻役
  if (hand.riichi) {
    results.push({ yaku: YAKU_LIST.RIICHI, han: 1 });
  }
  if (hand.ippatsu) {
    results.push({ yaku: YAKU_LIST.IPPATSU, han: 1 });
  }
  if (menzen && isTsumo) {
    results.push({ yaku: YAKU_LIST.MENZEN_TSUMO, han: 1 });
  }
  if (isTanyao(allTiles, hand.melds)) {
    results.push({ yaku: YAKU_LIST.TANYAO, han: 1 });
  }
  if (isChiitoitsu(allTiles)) {
    results.push({ yaku: YAKU_LIST.CHIITOITSU, han: 2 });
  }

  // 役牌检查
  const yakuhaiTiles: { id: TileId; yaku: Yaku }[] = [
    { id: '5z', yaku: YAKU_LIST.YAKUHAI_HAKU },
    { id: '6z', yaku: YAKU_LIST.YAKUHAI_HATSU },
    { id: '7z', yaku: YAKU_LIST.YAKUHAI_CHUN },
  ];
  for (const { id, yaku } of yakuhaiTiles) {
    if (hasYakuhai(allTiles, hand.melds, id)) {
      results.push({ yaku, han: 1 });
    }
  }
  // 场风/自风
  if (hasYakuhai(allTiles, hand.melds, bakaze)) {
    results.push({ yaku: YAKU_LIST.YAKUHAI_BAKAZE, han: 1 });
  }
  if (jikaze !== bakaze && hasYakuhai(allTiles, hand.melds, jikaze)) {
    results.push({ yaku: YAKU_LIST.YAKUHAI_JIKAZE, han: 1 });
  }

  // 二翻役
  if (isIttsu(allTiles, hand.melds)) {
    results.push({ yaku: YAKU_LIST.ITTSU, han: menzen ? 2 : 1 });
  }
  if (isSanshokuDoujun(allTiles, hand.melds)) {
    results.push({ yaku: YAKU_LIST.SANSHOKU_DOUJUN, han: menzen ? 2 : 1 });
  }
  if (isToitoi(hand.melds)) {
    results.push({ yaku: YAKU_LIST.TOITOI, han: 2 });
  }
  if (isHonroutou(allTiles, hand.melds)) {
    results.push({ yaku: YAKU_LIST.HONROUTOU, han: 2 });
  }
  if (isShousangen(allTiles, hand.melds)) {
    results.push({ yaku: YAKU_LIST.SHOUSANGEN, han: 2 });
  }

  // 三翻役
  if (isHonitsu(allTiles, hand.melds)) {
    results.push({ yaku: YAKU_LIST.HONITSU, han: menzen ? 3 : 2 });
  }
  if (isRyanpeikou(allTiles)) {
    results.push({ yaku: YAKU_LIST.RYANPEIKOU, han: 3 });
  }

  // 六翻役
  if (isChinitsu(allTiles, hand.melds)) {
    results.push({ yaku: YAKU_LIST.CHINITSU, han: menzen ? 6 : 5 });
  }

  return results;
}

/** 检查役牌刻子 */
function hasYakuhai(tiles: Tile[], melds: Meld[], tileId: TileId): boolean {
  const allTiles = [...tiles];
  for (const meld of melds) {
    allTiles.push(...meld.tiles);
  }
  return allTiles.filter(t => t.id === tileId).length >= 3;
}

/** 检查国士無双 */
export function isKokushi(tiles: Tile[]): boolean {
  const yaochuu = ['1m','9m','1p','9p','1s','9s','1z','2z','3z','4z','5z','6z','7z'];
  const counts: Record<string, number> = {};
  for (const t of tiles) {
    counts[t.id] = (counts[t.id] || 0) + 1;
  }
  // 必须包含所有13种幺九牌，其中一种为对子
  for (const id of yaochuu) {
    if (!counts[id] || counts[id] < 1) return false;
  }
  const totalYaochuu = yaochuu.reduce((sum, id) => sum + (counts[id] || 0), 0);
  return totalYaochuu === 14;
}

/** 检查四暗刻 */
export function isSuuankou(tiles: Tile[], _winningTile: Tile): boolean {
  const counts: Record<string, number> = {};
  for (const t of tiles) {
    counts[t.id] = (counts[t.id] || 0) + 1;
  }
  let triplets = 0;
  let pairs = 0;
  for (const [_, count] of Object.entries(counts)) {
    if (count >= 4) triplets++; // 暗杠
    else if (count === 3) triplets++;
    else if (count === 2) pairs++;
  }
  return triplets === 4 && pairs === 1;
}

/** 获取牌图片路径 */
export function getTileImagePath(tileId: string): string {
  return `/tiles/${tileId}.png`;
}
