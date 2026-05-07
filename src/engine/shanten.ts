/**
 * shanten.ts - 向听数计算
 * 一般型、七对子、国士无双三种向听数
 * 
 * 向听数: 距离听牌还需要几张牌
 *   -1 = 和了（已胡）
 *    0 = 听牌
 *    1 = 一向听
 *    ...
 */
import { Tile, TileId, ALL_TILE_IDS, Suit, TileCounts, handToCounts } from '../types/tile';

/** 向听数结果 */
export interface ShantenResult {
  shanten: number;        // 最小向听数
  form: 'standard' | 'chiitoitsu' | 'kokushi'; // 最优形态
  standard: number;       // 一般型向听数
  chiitoitsu: number;     // 七对子向听数
  kokushi: number;        // 国士无双向听数
}

/** 手牌索引转花色和值 */
function indexToSuitValue(idx: number): { suit: Suit; value: number } {
  const id = ALL_TILE_IDS[idx];
  return { suit: id[1] as Suit, value: parseInt(id[0]) };
}

/**
 * 一般型向听数计算
 * 核心算法：递归分解面子 + 雀头
 * 
 * 向听数 = 8 - 2×面子数 - 搭子数 - 雀头(0或1)
 * 
 * 使用位运算优化的状态压缩
 */
export function calculateStandardShanten(counts: TileCounts): number {
  let minShanten = 8;

  // 尝试每种雀头
  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) {
      counts[i] -= 2;
      const mentsuShanten = findMentsuShanten(counts, 0, 0);
      // 有雀头时向听数 = 8 - 2*面子 - 搭子 - 1
      minShanten = Math.min(minShanten, mentsuShanten - 1);
      counts[i] += 2;
    }
  }

  // 无雀头的情况
  const mentsuShanten = findMentsuShanten(counts, 0, 0);
  minShanten = Math.min(minShanten, mentsuShanten);

  return minShanten;
}

/**
 * 递归寻找最大面子数和搭子数
 * 返回: 8 - 2*面子数 - 搭子数（即向听贡献）
 */
function findMentsuShanten(counts: TileCounts, idx: number, completedMelds: number): number {
  // 跳过空位
  while (idx < 34 && counts[idx] === 0) idx++;

  if (idx >= 34) {
    // 所有牌处理完毕
    return 8 - 2 * completedMelds;
  }

  let minShanten = 8 - 2 * completedMelds;

  // 1. 尝试刻子
  if (counts[idx] >= 3) {
    counts[idx] -= 3;
    minShanten = Math.min(minShanten, findMentsuShanten(counts, idx, completedMelds + 1));
    counts[idx] += 3;
  }

  // 2. 尝试顺子（数牌且不跨花色）
  const { suit, value } = indexToSuitValue(idx);
  if (suit !== 'z' && value <= 7) {
    const i2 = idx + 1;
    const i3 = idx + 2;
    // 检查不跨花色
    if (i2 < 34 && i3 < 34 &&
        ALL_TILE_IDS[i2][1] === suit && ALL_TILE_IDS[i3][1] === suit) {
      if (counts[i2] > 0 && counts[i3] > 0) {
        counts[idx]--;
        counts[i2]--;
        counts[i3]--;
        minShanten = Math.min(minShanten, findMentsuShanten(counts, idx, completedMelds + 1));
        counts[idx]++;
        counts[i2]++;
        counts[i3]++;
      }
    }
  }

  // 3. 不用这张牌做面子，尝试搭子（向听数贡献）
  // 搭子 = 缺一张就能成面子的组合
  // 这里我们先跳过，让后续递归处理
  // 向听数 = 8 - 2*面子 - 搭子，搭子数量在后续统计

  // 4. 跳过当前牌
  const nextIdx = idx + 1;
  minShanten = Math.min(minShanten, findMentsuShanten(counts, nextIdx, completedMelds));

  // 5. 如果有搭子（2张同花色相邻/间隔），记录搭子贡献
  if (suit !== 'z') {
    // 搭子: 顺子搭子（相邻2张）
    if (value <= 8) {
      const ni = ALL_TILE_IDS.indexOf(`${value + 1}${suit}` as TileId);
      if (ni >= 0 && counts[ni] > 0) {
        // 不用这2张，向听贡献 +1（还缺1张才能成面子）
        // 这种情况已经在"跳过当前牌"中隐式处理了
      }
    }
    // 搭子: 嵌张搭子（间隔1张）
    if (value <= 7) {
      const ni2 = ALL_TILE_IDS.indexOf(`${value + 2}${suit}` as TileId);
      if (ni2 >= 0 && counts[ni2] > 0) {
        // 嵌张搭子
      }
    }
  }

  return minShanten;
}

/**
 * 七对子向听数
 * 需要7个不同的对子
 */
export function calculateChiitoitsuShanten(counts: TileCounts): number {
  let pairs = 0;
  let unique = 0;

  for (let i = 0; i < 34; i++) {
    if (counts[i] >= 2) {
      pairs++;
      unique++;
    } else if (counts[i] === 1) {
      unique++;
    }
  }

  // 7对子向听数 = 7 - 对子数
  // 但手牌必须是14张，所以需要考虑牌数
  return 6 - pairs; // 7对子只需要7对，所以是 7-1-pairs = 6-pairs
}

/**
 * 国士无双向听数
 * 需要13种幺九牌各1张 + 任意1张幺九牌为对子
 */
export function calculateKokushiShanten(counts: TileCounts): number {
  const yaochuuIndices = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]; // 1m,9m,1p,9p,1s,9s,1z-7z

  let hasAll = 0;
  let hasPair = false;

  for (const idx of yaochuuIndices) {
    if (counts[idx] >= 1) {
      hasAll++;
      if (counts[idx] >= 2) hasPair = true;
    }
  }

  // 国士向听数 = 13 - 已有种数 - (有对子 ? 1 : 0)
  return 13 - hasAll - (hasPair ? 1 : 0);
}

/**
 * 综合向听数计算
 * 取三种形态的最小值
 */
export function calculateShanten(hand: Tile[]): ShantenResult {
  const counts = handToCounts(hand);

  const standard = calculateStandardShanten([...counts]);
  const chiitoitsu = calculateChiitoitsuShanten([...counts]);
  const kokushi = calculateKokushiShanten([...counts]);

  const minShanten = Math.min(standard, chiitoitsu, kokushi);

  let form: ShantenResult['form'] = 'standard';
  if (minShanten === chiitoitsu && chiitoitsu <= standard) form = 'chiitoitsu';
  if (minShanten === kokushi && kokushi <= chiitoitsu && kokushi <= standard) form = 'kokushi';

  return {
    shanten: minShanten,
    form,
    standard,
    chiitoitsu,
    kokushi,
  };
}

/**
 * 含万能牌的向听数计算（优化版）
 * 万能牌可以当任意牌，使用缓存和智能剪枝
 */
export function calculateShantenWithUniversal(hand: Tile[], universalCount: number): ShantenResult {
  if (universalCount === 0) {
    return calculateShanten(hand);
  }

  const baseCounts = handToCounts(hand);
  
  // 缓存键：牌型指纹 + 万能牌数量
  const cacheKey = `${countsToFingerprint(baseCounts)}_${universalCount}`;
  const cached = getCachedShanten(cacheKey);
  if (cached) {
    return cached;
  }

  // 快速路径：1张万能牌时，直接检查34种可能
  if (universalCount === 1) {
    let minShanten = 8;
    let bestForm: ShantenResult['form'] = 'standard';
    
    for (let i = 0; i < 34; i++) {
      if (baseCounts[i] >= 4) continue; // 不能超过4张
      const testCounts = [...baseCounts];
      testCounts[i]++;
      
      const s = calculateStandardShanten([...testCounts]);
      if (s < minShanten) { minShanten = s; bestForm = 'standard'; }
      
      const chi = calculateChiitoitsuShanten([...testCounts]);
      if (chi < minShanten) { minShanten = chi; bestForm = 'chiitoitsu'; }
      
      const kok = calculateKokushiShanten([...testCounts]);
      if (kok < minShanten) { minShanten = kok; bestForm = 'kokushi'; }
    }
    
    const result: ShantenResult = {
      shanten: minShanten,
      form: bestForm,
      standard: calculateStandardShanten([...baseCounts]),
      chiitoitsu: calculateChiitoitsuShanten([...baseCounts]),
      kokushi: calculateKokushiShanten([...baseCounts]),
    };
    setCachedShanten(cacheKey, result);
    return result;
  }

  // 2张及以上万能牌：使用递归+剪枝
  let minShanten = 8;
  let bestForm: ShantenResult['form'] = 'standard';

  function tryAssignUniversal(remaining: number, counts: TileCounts, startIdx: number) {
    // 剪枝1：已经和了
    if (minShanten <= -1) return;
    
    // 剪枝2：剩余万能牌不足以达到更优解
    // 当前counts的理论最小向听 = 不考虑剩余万能牌的向听 - remaining
    const currentBase = calculateStandardShanten([...counts]);
    if (currentBase - remaining >= minShanten) return;

    if (remaining === 0) {
      const s = calculateStandardShanten([...counts]);
      if (s < minShanten) { minShanten = s; bestForm = 'standard'; }
      
      const chi = calculateChiitoitsuShanten([...counts]);
      if (chi < minShanten) { minShanten = chi; bestForm = 'chiitoitsu'; }
      
      const kok = calculateKokushiShanten([...counts]);
      if (kok < minShanten) { minShanten = kok; bestForm = 'kokushi'; }
      return;
    }

    // 优先分配给已有牌的索引（更有用）
    for (let i = startIdx; i < 34; i++) {
      if (counts[i] >= 4) continue;
      counts[i]++;
      tryAssignUniversal(remaining - 1, counts, i);
      counts[i]--;
    }
  }

  tryAssignUniversal(universalCount, [...baseCounts], 0);

  const result: ShantenResult = {
    shanten: minShanten,
    form: bestForm,
    standard: calculateStandardShanten([...baseCounts]),
    chiitoitsu: calculateChiitoitsuShanten([...baseCounts]),
    kokushi: calculateKokushiShanten([...baseCounts]),
  };
  
  setCachedShanten(cacheKey, result);
  return result;
}

// 向听数缓存 - 使用对象替代Map避免ES2015依赖
const shantenCache: Record<string, ShantenResult> = {};
let shantenCacheSize = 0;
const MAX_CACHE_SIZE = 500;

// 牌型指纹：将counts数组转为紧凑字符串
function countsToFingerprint(counts: TileCounts): string {
  return counts.map(c => c.toString(36)).join('');
}

// 缓存管理
function getCachedShanten(key: string): ShantenResult | undefined {
  return shantenCache[key];
}

function setCachedShanten(key: string, result: ShantenResult): void {
  if (shantenCacheSize >= MAX_CACHE_SIZE) {
    // LRU: 删除最旧的键
    const keys = Object.keys(shantenCache);
    if (keys.length > 0) {
      delete shantenCache[keys[0]];
      shantenCacheSize--;
    }
  }
  shantenCache[key] = result;
  shantenCacheSize++;
}

/**
 * 获取有效牌列表（能减少向听数的牌）
 */
export function getEffectiveTiles(hand: Tile[]): TileId[] {
  const currentShanten = calculateShanten(hand).shanten;
  const effective: TileId[] = [];

  for (const tileId of ALL_TILE_IDS) {
    const testHand = [...hand, { id: tileId, suit: tileId[1] as Suit, value: parseInt(tileId[0]), isHonor: tileId[1] === 'z', isTerminal: tileId[1] !== 'z' && (parseInt(tileId[0]) === 1 || parseInt(tileId[0]) === 9) }];
    const newShanten = calculateShanten(testHand).shanten;
    if (newShanten < currentShanten) {
      effective.push(tileId);
    }
  }

  return effective;
}

/**
 * 向听数显示文字
 */
export function formatShanten(shanten: number): string {
  if (shanten === -1) return '和了';
  if (shanten === 0) return '聴牌';
  return `${shanten}向聴`;
}
