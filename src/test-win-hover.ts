import { getWaitsAfterDiscard } from './engine/shanten-new';
import { createTile, Suit } from './types/tile';

// 模拟胡牌后的手牌：包含万能牌 + 新摸的牌
const winningHand = [
  createTile('1m'), createTile('1m'), createTile('1m'),
  createTile('2m'), createTile('2m'), createTile('2m'),
  createTile('3m'), createTile('3m'), createTile('3m'),
  createTile('4m'), createTile('4m'), createTile('4m'),
  createTile('5m'), // lastDraw
  { id: 'universal', suit: 'z' as Suit, value: 0, isHonor: true, isTerminal: false }
];

console.log('胡牌后手牌（14张）:', winningHand.map(t => t.id));

// 测试悬停第0张牌（1m）
const waits0 = getWaitsAfterDiscard(winningHand, 0);
console.log('丢弃1m后的听牌:', waits0);

// 测试悬停第12张牌（5m，lastDraw）
const waits12 = getWaitsAfterDiscard(winningHand, 12);
console.log('丢弃5m(lastDraw)后的听牌:', waits12);

// 测试悬停万能牌（索引13）- 应该被跳过
const waits13 = getWaitsAfterDiscard(winningHand, 13);
console.log('丢弃万能牌后的听牌:', waits13);
