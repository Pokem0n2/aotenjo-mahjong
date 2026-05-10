/**
 * pattern.ts - 牌型识别模块
 * 单人肉鸽麻将专用：仅识别结构牌型（不涉及副露、门前清等状态）
 * 
 * 职责：根据 tiles34 数组识别牌型名称和花色
 * 输入：number[] (34张牌计数数组)
 * 输出：
 *   - detectPattern: string (牌型名称，如 '清一色'、'九莲宝灯')
 *   - detectPatternWithSuit: { name: string; suit?: 'm'|'p'|'s' } (牌型+花色)
 */

/** 花色类型 */
export type SuitType = 'm' | 'p' | 's';

/** 牌型识别结果（含花色） */
export interface PatternResult {
  name: string;      // 牌型名称：七对子、国士无双、九莲宝灯、清一色、混一色、对对和、一般
  suit?: SuitType;   // 花色：m=万, p=筒, s=条（仅清一色/九莲宝灯/混一色有）
}

/** 花色中文名映射 */
export const SUIT_NAMES: Record<SuitType, string> = {
  m: '万',
  p: '筒',
  s: '条'
};

/**
 * 内部辅助函数：统计各花色数量
 */
function countSuits(tiles34: number[]): { m: number; p: number; s: number; z: number; nonZero: ('m' | 'p' | 's' | 'z')[] } {
  let suitCounts = { m: 0, p: 0, s: 0, z: 0 };
  for (let i = 0; i < 34; i++) {
    if (tiles34[i] > 0) {
      if (i < 9) suitCounts.m += tiles34[i];
      else if (i < 18) suitCounts.p += tiles34[i];
      else if (i < 27) suitCounts.s += tiles34[i];
      else suitCounts.z += tiles34[i];
    }
  }

  const nonZero: ('m' | 'p' | 's' | 'z')[] = [];
  if (suitCounts.m > 0) nonZero.push('m');
  if (suitCounts.p > 0) nonZero.push('p');
  if (suitCounts.s > 0) nonZero.push('s');
  if (suitCounts.z > 0) nonZero.push('z');

  return { m: suitCounts.m, p: suitCounts.p, s: suitCounts.s, z: suitCounts.z, nonZero };
}

/**
 * 根据34张牌数组识别牌型名称和花色
 * 返回完整信息，用于道具卡触发判定（需要知道具体花色）
 */
export function detectPatternWithSuit(tiles34: number[]): PatternResult {
  // 检查七对子
  let pairs = 0;
  for (const c of tiles34) {
    if (c === 2) pairs++;
    if (c === 4) pairs += 2;
  }
  if (pairs === 7) {
    // 七对子也携带花色信息（用于道具卡花色判定）
    const { nonZero, z } = countSuits(tiles34);
    if (nonZero.length === 1 && z === 0) {
      return { name: '七对子', suit: nonZero[0] as SuitType };
    }
    return { name: '七对子' };
  }

  // 检查国士无双
  const yaochuIndices = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let hasAllYaochu = true;
  let hasPair = false;
  for (const idx of yaochuIndices) {
    if (tiles34[idx] === 0) hasAllYaochu = false;
    if (tiles34[idx] >= 2) hasPair = true;
  }
  if (hasAllYaochu && hasPair) return { name: '国士无双' };

  // 统计各花色
  const { m, p, s, z, nonZero } = countSuits(tiles34);

  // 检查九莲宝灯（必须在清一色之前判定）
  if (nonZero.length === 1 && z === 0) {
    let suitStart = -1;
    if (m > 0) suitStart = 0;
    else if (p > 0) suitStart = 9;
    else if (s > 0) suitStart = 18;

    if (suitStart >= 0) {
      let hasAllNine = true;
      for (let i = 0; i < 9; i++) {
        if (tiles34[suitStart + i] < 1) {
          hasAllNine = false;
          break;
        }
      }

      const totalTiles = tiles34.reduce((sum, c) => sum + c, 0);
      // 九莲宝灯：1和9至少3张，2-8至少1张，总共14张
      if (hasAllNine && tiles34[suitStart] >= 3 && tiles34[suitStart + 8] >= 3 && totalTiles === 14) {
        const suit = nonZero[0] as SuitType;
        return { name: '九莲宝灯', suit };
      }
    }
  }

  // 清一色
  if (nonZero.length === 1 && z === 0) {
    const suit = nonZero[0] as SuitType;
    return { name: '清一色', suit };
  }

  // 混一色
  if (nonZero.length === 2 && z > 0) {
    // 混一色的 suit 是非字牌的花色
    let suit: SuitType | undefined;
    for (const s of nonZero) {
      if (s !== 'z') {
        suit = s;
        break;
      }
    }
    if (suit) return { name: '混一色', suit };
  }

  // 检查对对和
  let kotsuCount = 0;
  for (const c of tiles34) {
    if (c >= 3) kotsuCount++;
  }
  if (kotsuCount >= 4) return { name: '对对和' };

  return { name: '一般' };
}

/**
 * 根据34张牌数组识别牌型名称（简化版，不含花色）
 * 用于：
 * 1. 胡牌时显示牌型
 * 2. 番数计算
 */
export function detectPattern(tiles34: number[]): string {
  return detectPatternWithSuit(tiles34).name;
}

/**
 * 检查牌型是否匹配指定花色的一色
 * 例如：isSuitPattern(result, 's') 检查是否条一色（清一色(条) 或 九莲宝灯(条)）
 */
export function isSuitPattern(result: PatternResult, suit: SuitType): boolean {
  return (result.name === '清一色' || result.name === '九莲宝灯' || result.name === '七对子') && result.suit === suit;
}
