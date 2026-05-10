import { getPatternName } from './engine/shanten-new';

// 测试九莲宝灯判定 - 正确的14张牌
// 条子九莲宝灯: 1112345678999s + 1张任意条子
const nineLanternTiles = new Array(34).fill(0);
// 条子位置 18-26
for (let i = 0; i < 9; i++) {
  nineLanternTiles[18 + i] = 1;
}
// 额外一张1s（作为雀头，总共14张）
nineLanternTiles[18] = 2; // 1s

const pattern = getPatternName(nineLanternTiles);
console.log('九莲宝灯测试(14张):', pattern);

// 测试普通清一色（不是九莲宝灯结构）
const pureTiles = new Array(34).fill(0);
// 条子: 1s×4, 2s×2, 3s×2, 4s×2, 5s×2, 6s×2 (14张)
pureTiles[18] = 4; // 1s
pureTiles[19] = 2; // 2s
pureTiles[20] = 2; // 3s
pureTiles[21] = 2; // 4s
pureTiles[22] = 2; // 5s
pureTiles[23] = 2; // 6s

const pattern2 = getPatternName(pureTiles);
console.log('普通清一色测试:', pattern2);

// 测试另一种九莲宝灯（雀头是9s）
const nineLantern2 = new Array(34).fill(0);
for (let i = 0; i < 9; i++) {
  nineLantern2[18 + i] = 1;
}
nineLantern2[26] = 2; // 9s作为雀头

const pattern3 = getPatternName(nineLantern2);
console.log('九莲宝灯(9s雀头):', pattern3);
