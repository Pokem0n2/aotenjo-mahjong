import { getPatternName } from './engine/shanten-new';

// 普通清一色（4个顺子+雀头，不是九莲宝灯）
// 1-2-3s, 4-5-6s, 7-8-9s, 1-2-3s, 雀头: 1s
// 1s×4, 2s×2, 3s×2, 4s×1, 5s×1, 6s×1, 7s×1, 8s×1, 9s×1 = 14张
const pure = new Array(34).fill(0);
pure[18] = 4; // 1s
pure[19] = 2; // 2s
pure[20] = 2; // 3s
pure[21] = 1; // 4s
pure[22] = 1; // 5s
pure[23] = 1; // 6s
pure[24] = 1; // 7s
pure[25] = 1; // 8s
pure[26] = 1; // 9s
const total = pure.reduce((a, b) => a + b, 0);
console.log('普通清一色总张数:', total);
console.log('普通清一色牌型:', getPatternName(pure));

// 另一个普通清一色
// 1s×2(雀头), 2s×3(刻子), 3s×3(刻子), 4s×3(刻子), 5s×3(刻子) = 14张
const pure2 = new Array(34).fill(0);
pure2[18] = 2; // 1s
pure2[19] = 3; // 2s
pure2[20] = 3; // 3s
pure2[21] = 3; // 4s
pure2[22] = 3; // 5s
const total2 = pure2.reduce((a, b) => a + b, 0);
console.log('\n普通清一色2总张数:', total2);
console.log('普通清一色2牌型:', getPatternName(pure2));
