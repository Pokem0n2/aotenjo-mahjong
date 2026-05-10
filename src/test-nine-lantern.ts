import { getPatternName } from './engine/shanten-new';

// 测试九莲宝灯判定
// 条子九莲宝灯: 1112345678999 + 额外一张2s
const nineLanternTiles = new Array(34).fill(0);
// 条子位置 18-26
for (let i = 0; i < 9; i++) {
  nineLanternTiles[18 + i] = 1;
}
// 额外一张2s（作为雀头）
nineLanternTiles[19] = 2; // 2s

const pattern = getPatternName(nineLanternTiles);
console.log('九莲宝灯测试:', pattern);

// 测试普通清一色
const pureTiles = new Array(34).fill(0);
for (let i = 0; i < 9; i++) {
  pureTiles[18 + i] = 1;
}
pureTiles[18] = 2; // 1s对子

const pattern2 = getPatternName(pureTiles);
console.log('清一色测试:', pattern2);
