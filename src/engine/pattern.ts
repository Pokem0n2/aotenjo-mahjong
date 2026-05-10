/**
 * pattern.ts - 牌型识别模块
 * 单人肉鸽麻将专用：仅识别结构牌型（不涉及副露、门前清等状态）
 * 
 * 职责：根据 tiles34 数组识别牌型名称
 * 输入：number[] (34张牌计数数组)
 * 输出：string (牌型名称)
 */

/**
 * 根据34张牌数组识别牌型名称
 * 用于：
 * 1. 胡牌时显示牌型
 * 2. 道具卡触发判定（如通天藤蔓需要知道是否清一色）
 * 3. 番数计算
 */
export function detectPattern(tiles34: number[]): string {
  // 检查七对子
  let pairs = 0;
  for (const c of tiles34) {
    if (c === 2) pairs++;
    if (c === 4) pairs += 2;
  }
  if (pairs === 7) return '七对子';

  // 检查国士无双
  const yaochuIndices = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let hasAllYaochu = true;
  let hasPair = false;
  for (const idx of yaochuIndices) {
    if (tiles34[idx] === 0) hasAllYaochu = false;
    if (tiles34[idx] >= 2) hasPair = true;
  }
  if (hasAllYaochu && hasPair) return '国士无双';

  // 统计各花色数量
  let suitCounts = { m: 0, p: 0, s: 0, z: 0 };
  for (let i = 0; i < 34; i++) {
    if (tiles34[i] > 0) {
      if (i < 9) suitCounts.m += tiles34[i];
      else if (i < 18) suitCounts.p += tiles34[i];
      else if (i < 27) suitCounts.s += tiles34[i];
      else suitCounts.z += tiles34[i];
    }
  }

  const nonZeroSuits = [];
  if (suitCounts.m > 0) nonZeroSuits.push('m');
  if (suitCounts.p > 0) nonZeroSuits.push('p');
  if (suitCounts.s > 0) nonZeroSuits.push('s');
  if (suitCounts.z > 0) nonZeroSuits.push('z');

  // 检查九莲宝灯（必须在清一色之前判定，因为九莲宝灯是清一色的特殊形式）
  // 九莲宝灯：同花色1112345678999 + 任意一张同花色牌 = 14张
  if (nonZeroSuits.length === 1 && suitCounts.z === 0) {
    let suitStart = -1;
    if (suitCounts.m > 0) suitStart = 0;
    else if (suitCounts.p > 0) suitStart = 9;
    else if (suitCounts.s > 0) suitStart = 18;

    if (suitStart >= 0) {
      // 检查9种牌是否各至少1张
      let hasAllNine = true;
      for (let i = 0; i < 9; i++) {
        if (tiles34[suitStart + i] < 1) {
          hasAllNine = false;
          break;
        }
      }

      // 九莲宝灯必须满足：9种牌各至少1张，且1和9至少有2张，且总共14张
      const totalTiles = tiles34.reduce((sum, c) => sum + c, 0);
      if (hasAllNine && tiles34[suitStart] >= 2 && tiles34[suitStart + 8] >= 2 && totalTiles === 14) {
        return '九莲宝灯';
      }
    }
  }

  // 清一色（不区分花色）
  if (nonZeroSuits.length === 1 && suitCounts.z === 0) {
    return '清一色';
  }

  // 混一色（不区分花色）
  if (nonZeroSuits.length === 2 && suitCounts.z > 0) {
    return '混一色';
  }

  // 检查对对和
  let kotsuCount = 0;
  for (const c of tiles34) {
    if (c >= 3) kotsuCount++;
  }
  if (kotsuCount >= 4) return '对对和';

  return '一般';
}
