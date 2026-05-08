/**
 * agari.ts - 胡牌判定
 * 一般型（4面子+1雀头）、七对子、国士无双
 * 包含万能牌展开
 */
import { Tile, TileId, ALL_TILE_IDS, Suit, TileCounts } from '../types/tile';
import { HandState, Meld, handToFlexibleCounts } from './hand';

/** 和了形态 */
export type WinForm = 'standard' | 'chiitoitsu' | 'kokushi';

/** 和了结果 */
export interface AgariResult {
  isAgari: boolean;
  form?: WinForm;
  melds: Meld[];        // 最终的面子组合
  pairTile?: TileId;    // 雀头
  winningTile?: Tile;   // 和牌
  isTsumo: boolean;     // 是否自摸
  isMenzen: boolean;    // 是否门前清
  waits: TileId[];      // 听牌列表
}

/**
 * 综合胡牌判定
 * 检查三种形态：一般型、七对子、国士无双
 */
export function isAgari(hand: HandState, winningTile: Tile): AgariResult {
  const allTiles = [...hand.tiles, winningTile];

  // 检查万能牌 - 需要包含和牌
  const { base, universalCount } = handToFlexibleCounts({ ...hand, tiles: allTiles });
  // winningTile也可能是万能牌，已通过handToFlexibleCounts处理

  // 1. 检查国士无双
  if (hand.menzen) {
    const kokushi = checkKokushi(base, universalCount);
    if (kokushi.isAgari) {
      return {
        ...kokushi,
        form: 'kokushi',
        winningTile,
        isTsumo: hand.lastDraw?.id === winningTile.id,
        isMenzen: true,
      };
    }
  }

  // 2. 检查七对子
  if (hand.melds.length === 0) {
    const chiitoi = checkChiitoitsu(base, universalCount, allTiles.length);
    if (chiitoi.isAgari) {
      return {
        ...chiitoi,
        form: 'chiitoitsu',
        winningTile,
        isTsumo: hand.lastDraw?.id === winningTile.id,
        isMenzen: true,
      };
    }
  }

  // 3. 检查一般型（4面子+1雀头）
  const standard = checkStandard(base, universalCount, hand.melds);
  if (standard.isAgari) {
    return {
      ...standard,
      form: 'standard',
      winningTile,
      isTsumo: hand.lastDraw?.id === winningTile.id,
      isMenzen: hand.menzen,
    };
  }

  return { isAgari: false, melds: [], waits: [], isTsumo: false, isMenzen: false };
}

/**
 * 一般型胡牌判定（4面子+1雀头）
 */
type CheckResult = { isAgari: boolean; melds: Meld[]; pairTile?: TileId; waits: TileId[] };

function checkStandard(counts: TileCounts, universalCount: number, melds: Meld[]): CheckResult {
  const neededMelds = 4 - melds.length; // 已有的副露算作面子

  // 尝试每种雀头
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) {
      counts[i] -= 2;
      const result = findMentsuWithUniversal(counts, universalCount, neededMelds);
      if (result.success) {
        counts[i] += 2;
        return {
          isAgari: true,
          melds: [...melds, ...result.newMelds],
          pairTile: ALL_TILE_IDS[i],
          waits: [],
        };
      }
      counts[i] += 2;
    }
  }

  // 用万能牌凑雀头
  if (universalCount >= 2) {
    for (let i = 0; i < 34; i++) {
      if (counts[i] >= 1) {
        // 用1张万能牌凑成对
        counts[i] -= 1;
        const result = findMentsuWithUniversal(counts, universalCount - 1, neededMelds);
        if (result.success) {
          counts[i] += 1;
          return {
            isAgari: true,
            melds: [...melds, ...result.newMelds],
            pairTile: ALL_TILE_IDS[i],
            waits: [],
          };
        }
        counts[i] += 1;
      }
    }
    // 用2张万能牌当雀头
    const result = findMentsuWithUniversal(counts, universalCount - 2, neededMelds);
    if (result.success) {
      return {
        isAgari: true,
        melds: [...melds, ...result.newMelds],
        pairTile: '1z' as TileId, // 任意雀头
        waits: [],
      };
    }
  }

  return { isAgari: false, melds: [], waits: [] };
}

/**
 * 递归寻找面子组合（支持万能牌）
 */
function findMentsuWithUniversal(
  counts: TileCounts,
  universalCount: number,
  neededMelds: number
): { success: boolean; newMelds: Meld[] } {
  if (neededMelds === 0) {
    // 所有牌都应被消耗完
    const remaining = counts.reduce((a, b) => a + b, 0);
    if (remaining <= universalCount) {
      return { success: true, newMelds: [] };
    }
    return { success: false, newMelds: [] };
  }

  // 找到第一个非零位
  let idx = 0;
  while (idx < 34 && counts[idx] === 0) idx++;

  if (idx >= 34) {
    // 牌面已用完，需要万能牌来补
    return { success: universalCount >= neededMelds, newMelds: [] };
  }

  // 尝试刻子
  if (counts[idx] >= 3) {
    counts[idx] -= 3;
    const r = findMentsuWithUniversal(counts, universalCount, neededMelds - 1);
    if (r.success) {
      counts[idx] += 3;
      const meld: Meld = { type: 'pon', tiles: [makeTile(idx), makeTile(idx), makeTile(idx)] };
      return { success: true, newMelds: [meld, ...r.newMelds] };
    }
    counts[idx] += 3;
  }

  // 用万能牌补刻子 (2张牌 + 1万能)
  if (counts[idx] >= 2 && universalCount >= 1) {
    counts[idx] -= 2;
    const r = findMentsuWithUniversal(counts, universalCount - 1, neededMelds - 1);
    if (r.success) {
      counts[idx] += 2;
      const meld: Meld = { type: 'pon', tiles: [makeTile(idx), makeTile(idx), makeTile(idx)] };
      return { success: true, newMelds: [meld, ...r.newMelds] };
    }
    counts[idx] += 2;
  }

  // 用万能牌补刻子 (1张牌 + 2万能)
  if (counts[idx] >= 1 && universalCount >= 2) {
    counts[idx] -= 1;
    const r = findMentsuWithUniversal(counts, universalCount - 2, neededMelds - 1);
    if (r.success) {
      counts[idx] += 1;
      const meld: Meld = { type: 'pon', tiles: [makeTile(idx), makeTile(idx), makeTile(idx)] };
      return { success: true, newMelds: [meld, ...r.newMelds] };
    }
    counts[idx] += 1;
  }

  // 尝试顺子 (3张连续数牌)
  const { suit, value } = indexToSuitValue(idx);
  if (suit !== 'z' && value <= 7) {
    const i2 = idx + 1;
    const i3 = idx + 2;
    if (i2 < 34 && i3 < 34 &&
        ALL_TILE_IDS[i2][1] === suit && ALL_TILE_IDS[i3][1] === suit) {
      // 情况1: 3张都有
      if (counts[i2] > 0 && counts[i3] > 0) {
        counts[idx]--;
        counts[i2]--;
        counts[i3]--;
        const r = findMentsuWithUniversal(counts, universalCount, neededMelds - 1);
        if (r.success) {
          counts[idx]++;
          counts[i2]++;
          counts[i3]++;
          const meld: Meld = { type: 'chi', tiles: [makeTile(idx), makeTile(i2), makeTile(i3)] };
          return { success: true, newMelds: [meld, ...r.newMelds] };
        }
        counts[idx]++;
        counts[i2]++;
        counts[i3]++;
      }
      // 情况2: 缺1张，用万能牌补
      if (universalCount >= 1) {
        // 缺i2
        if (counts[i2] === 0 && counts[i3] > 0) {
          counts[idx]--;
          counts[i3]--;
          const r = findMentsuWithUniversal(counts, universalCount - 1, neededMelds - 1);
          if (r.success) {
            counts[idx]++;
            counts[i3]++;
            const meld: Meld = { type: 'chi', tiles: [makeTile(idx), makeTile(i2), makeTile(i3)] };
            return { success: true, newMelds: [meld, ...r.newMelds] };
          }
          counts[idx]++;
          counts[i3]++;
        }
        // 缺i3
        if (counts[i2] > 0 && counts[i3] === 0) {
          counts[idx]--;
          counts[i2]--;
          const r = findMentsuWithUniversal(counts, universalCount - 1, neededMelds - 1);
          if (r.success) {
            counts[idx]++;
            counts[i2]++;
            const meld: Meld = { type: 'chi', tiles: [makeTile(idx), makeTile(i2), makeTile(i3)] };
            return { success: true, newMelds: [meld, ...r.newMelds] };
          }
          counts[idx]++;
          counts[i2]++;
        }
        // 缺idx (不可能，因为idx>0才进到这里)
      }
      // 情况3: 缺2张，用2万能牌补
      if (universalCount >= 2 && counts[i2] === 0 && counts[i3] === 0) {
        counts[idx]--;
        const r = findMentsuWithUniversal(counts, universalCount - 2, neededMelds - 1);
        if (r.success) {
          counts[idx]++;
          const meld: Meld = { type: 'chi', tiles: [makeTile(idx), makeTile(i2), makeTile(i3)] };
          return { success: true, newMelds: [meld, ...r.newMelds] };
        }
        counts[idx]++;
      }
    }
  }

  // 跳过当前牌（不用它做面子）
  // 如果当前牌是单张且没有搭子，只能跳过
  return { success: false, newMelds: [] };
}

/**
 * 七对子胡牌判定
 */
function checkChiitoitsu(counts: TileCounts, universalCount: number, totalTiles: number): CheckResult {
  // 支持14张牌（标准）或15张牌（包含万能牌）
  if (totalTiles !== 14 && totalTiles !== 15) return { isAgari: false, melds: [], waits: [] };

  let pairs = 0;
  let singles = 0;

  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) pairs++;
    else if (counts[i] === 1) singles++;
  }

  // 需要7对，万能牌可以补缺
  const needed = 7 - pairs;
  if (needed <= universalCount) {
    return {
      isAgari: true,
      melds: [], // 七对子没有面子
      waits: [],
    };
  }

  return { isAgari: false, melds: [], waits: [] };
}

/**
 * 国士无双胡牌判定
 */
function checkKokushi(counts: TileCounts, universalCount: number): CheckResult {
  const yaochuuIndices = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

  let hasAll = 0;
  let hasPair = false;
  let pairIdx = -1;

  for (const idx of yaochuuIndices) {
    if (counts[idx] >= 1) {
      hasAll++;
      if (counts[idx] >= 2) {
        hasPair = true;
        pairIdx = idx;
      }
    }
  }

  // 需要13种幺九牌 + 1个对子
  const needed = 13 - hasAll + (hasPair ? 0 : 1);

  if (needed <= universalCount) {
    return {
      isAgari: true,
      melds: [],
      pairTile: pairIdx >= 0 ? ALL_TILE_IDS[pairIdx] : '1m' as TileId,
      waits: [],
    };
  }

  return { isAgari: false, melds: [], waits: [] };
}

/**
 * 判断是否听牌（返回听牌列表）
 */
export function getTenpaiTiles(hand: HandState): TileId[] {
  const tenpai: TileId[] = [];

  for (const tileId of ALL_TILE_IDS) {
    const testTile: Tile = {
      id: tileId,
      suit: tileId[1] as Suit,
      value: parseInt(tileId[0]),
      isHonor: tileId[1] === 'z',
      isTerminal: tileId[1] !== 'z' && (parseInt(tileId[0]) === 1 || parseInt(tileId[0]) === 9),
    };

    const result = isAgari(hand, testTile);
    if (result.isAgari) {
      tenpai.push(tileId);
    }
  }

  return tenpai;
}

/**
 * 检查是否听牌（向听数为0）
 * 注意：需要从外部导入 calculateShanten 以避免循环依赖
 */
export function _isTenpaiCheck(handTiles: Tile[]): boolean {
  // 延迟导入避免循环依赖
  // 实际使用时请直接调用 shanten.ts 的 calculateShanten
  const counts = new Array(34).fill(0);
  for (const t of handTiles) {
    const idx = ALL_TILE_IDS.indexOf(t.id as TileId);
    if (idx >= 0) counts[idx]++;
  }
  // 简化检查：手牌张数是否为 3n+2 (13张门前清) 或 3n+1 (有副露)
  return handTiles.length % 3 === 2 || handTiles.length % 3 === 1;
}

/** 辅助：从索引创建牌 */
function makeTile(idx: number): Tile {
  const id = ALL_TILE_IDS[idx];
  return {
    id,
    suit: id[1] as Suit,
    value: parseInt(id[0]),
    isHonor: id[1] === 'z',
    isTerminal: id[1] !== 'z' && (parseInt(id[0]) === 1 || parseInt(id[0]) === 9),
  };
}

/** 辅助：索引转花色值 */
function indexToSuitValue(idx: number): { suit: Suit; value: number } {
  const id = ALL_TILE_IDS[idx];
  return { suit: id[1] as Suit, value: parseInt(id[0]) };
}

/**
 * 显示胡牌信息
 */
export function formatAgari(result: AgariResult): string {
  if (!result.isAgari) return '未和了';

  const formNames: Record<WinForm, string> = {
    standard: '一般型',
    chiitoitsu: '七対子',
    kokushi: '国士無双',
  };

  const parts = [`和了！形态: ${formNames[result.form!]}`];
  if (result.pairTile) parts.push(`雀头: ${result.pairTile}`);
  parts.push(result.isTsumo ? '自摸' : '荣和');

  return parts.join(' | ');
}

/**
 * 万能牌最大番数搜索
 * 遍历34种牌，找到万能牌作为哪种牌时胡牌番数最大
 * 返回最佳胡牌结果和万能牌应扮演的牌ID
 * 
 * 注意：hand.tiles 包含14张牌（含lastDraw），需要移除winningTile后再传给isAgari
 * 这样isAgari内部 allTiles = 13张 + winningTile = 14张，胡牌判定才能正确
 */
export function findBestAgariWithUniversal(
  hand: HandState,
  winningTile: Tile
): { result: AgariResult | null; bestTileId: TileId | null; bestFan: number } {
  let bestResult: AgariResult | null = null;
  let bestTileId: TileId | null = null;
  let bestFan = 0;

  // 从14张手牌中移除winningTile，得到13张牌的手牌
  // 注意：可能有重复牌，只移除一张
  const tilesWithoutWinning: Tile[] = [];
  let removed = false;
  for (const t of hand.tiles) {
    if (!removed && t.id === winningTile.id) {
      removed = true; // 跳过第一张匹配的winningTile
      continue;
    }
    tilesWithoutWinning.push(t);
  }
  
  // 如果过滤后少于13张（说明没有匹配的winningTile），取前13张
  const baseHand13: HandState = {
    ...hand,
    tiles: tilesWithoutWinning.length === 13 ? tilesWithoutWinning : hand.tiles.slice(0, 13)
  };

  // 遍历34种牌，测试万能牌作为每种牌的情况
  for (const tileId of ALL_TILE_IDS) {
    // 创建临时手牌：将万能牌替换为当前测试的牌
    const tempTiles = baseHand13.tiles.map(t =>
      t.id === 'universal' ? makeTile(ALL_TILE_IDS.indexOf(tileId)) : t
    );
    const tempHand: HandState = {
      ...baseHand13,
      tiles: tempTiles,
    };

    const result = isAgari(tempHand, winningTile);
    if (result.isAgari) {
      // 计算番数（简化：根据牌型估算）
      let fan = 1;
      if (result.form === 'chiitoitsu') fan = 2;
      if (result.form === 'kokushi') fan = 13;
      // TODO: 更精确的番数计算

      if (fan > bestFan) {
        bestFan = fan;
        bestResult = result;
        bestTileId = tileId;
      }
    }
  }

  return { result: bestResult, bestTileId, bestFan };
}
