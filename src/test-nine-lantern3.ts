import { getPatternName } from './engine/shanten-new';

// 正确的九莲宝灯: 1112345678999s + 1s
// 即: 1s×3, 2s×1, 3s×1, 4s×1, 5s×1, 6s×1, 7s×1, 8s×1, 9s×2 = 14张
const nineLantern = new Array(34).fill(0);
nineLantern[18] = 3; // 1s×3 (一个刻子)
nineLantern[19] = 1; // 2s
nineLantern[20] = 1; // 3s
nineLantern[21] = 1; // 4s
nineLantern[22] = 1; // 5s
nineLantern[23] = 1; // 6s
nineLantern[24] = 1; // 7s
nineLantern[25] = 1; // 8s
nineLantern[26] = 2; // 9s×2 (雀头)

const total = nineLantern.reduce((a, b) => a + b, 0);
console.log('总张数:', total);

const pattern = getPatternName(nineLantern);
console.log('牌型:', pattern);

// 另一个正确的九莲宝灯: 1112345678999s + 5s
// 1s×2(雀头), 2s×1, 3s×1, 4s×1, 5s×3(刻子), 6s×1, 7s×1, 8s×1, 9s×1
const nineLantern2 = new Array(34).fill(0);
nineLantern2[18] = 2; // 1s×2 (雀头)
nineLantern2[19] = 1; // 2s
nineLantern2[20] = 1; // 3s
nineLantern2[21] = 1; // 4s
nineLantern2[22] = 3; // 5s×3 (刻子)
nineLantern2[23] = 1; // 6s
nineLantern2[24] = 1; // 7s
nineLantern2[25] = 1; // 8s
nineLantern2[26] = 1; // 9s

const total2 = nineLantern2.reduce((a, b) => a + b, 0);
console.log('\n总张数2:', total2);

const pattern2 = getPatternName(nineLantern2);
console.log('牌型2:', pattern2);
