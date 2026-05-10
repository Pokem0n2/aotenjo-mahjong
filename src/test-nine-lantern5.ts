import { getPatternName } from './engine/shanten-new';

// 正确的九莲宝灯: 14张
// 1s×3, 2s×1, 3s×1, 4s×1, 5s×1, 6s×1, 7s×1, 8s×1, 9s×3 = 13张? 不对
// 需要14张

// 九莲宝灯: 1112345678999 + 任意一张
// 即: 1s×3, 2s×1, 3s×1, 4s×1, 5s×1, 6s×1, 7s×1, 8s×1, 9s×2 + 额外1张
// 额外一张可以是任意同花色牌
// 例如: +1s = 1s×4, 2s×1, 3s×1, 4s×1, 5s×1, 6s×1, 7s×1, 8s×1, 9s×2 = 14张
const nineLantern = new Array(34).fill(0);
nineLantern[18] = 4; // 1s×4
nineLantern[19] = 1; // 2s
nineLantern[20] = 1; // 3s
nineLantern[21] = 1; // 4s
nineLantern[22] = 1; // 5s
nineLantern[23] = 1; // 6s
nineLantern[24] = 1; // 7s
nineLantern[25] = 1; // 8s
nineLantern[26] = 2; // 9s×2
const total = nineLantern.reduce((a, b) => a + b, 0);
console.log('九莲宝灯总张数:', total);
console.log('九莲宝灯牌型:', getPatternName(nineLantern));

// 另一个: +5s
// 1s×3, 2s×1, 3s×1, 4s×1, 5s×2, 6s×1, 7s×1, 8s×1, 9s×2 = 14张
const nineLantern2 = new Array(34).fill(0);
nineLantern2[18] = 3; // 1s×3
nineLantern2[19] = 1; // 2s
nineLantern2[20] = 1; // 3s
nineLantern2[21] = 1; // 4s
nineLantern2[22] = 2; // 5s×2
nineLantern2[23] = 1; // 6s
nineLantern2[24] = 1; // 7s
nineLantern2[25] = 1; // 8s
nineLantern2[26] = 2; // 9s×2
const total2 = nineLantern2.reduce((a, b) => a + b, 0);
console.log('\n九莲宝灯2总张数:', total2);
console.log('九莲宝灯2牌型:', getPatternName(nineLantern2));

// 普通清一色（不是九莲宝灯）
// 1s×4, 2s×2, 3s×2, 4s×2, 5s×2, 6s×2 = 14张
const pure = new Array(34).fill(0);
pure[18] = 4;
pure[19] = 2;
pure[20] = 2;
pure[21] = 2;
pure[22] = 2;
pure[23] = 2;
const total3 = pure.reduce((a, b) => a + b, 0);
console.log('\n普通清一色总张数:', total3);
console.log('普通清一色牌型:', getPatternName(pure));
