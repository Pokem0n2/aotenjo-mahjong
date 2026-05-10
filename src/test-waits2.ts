import { getWaitsAfterDiscard } from './engine/shanten-new';
import { createTile, Suit } from './types/tile';

// 测试1: 13张普通牌 + 1万能牌，13张普通牌本身听牌
// 例如: 1112223334445m + 万能牌
const testHand1 = [
  createTile('1m'), createTile('1m'), createTile('1m'),
  createTile('2m'), createTile('2m'), createTile('2m'),
  createTile('3m'), createTile('3m'), createTile('3m'),
  createTile('4m'), createTile('4m'), createTile('4m'),
  createTile('5m'),
  { id: 'universal', suit: 'z' as Suit, value: 0, isHonor: true, isTerminal: false }
];

const waits1 = getWaitsAfterDiscard(testHand1, 12);
console.log('测试1 - 丢弃5m后的听牌:', waits1);

// 测试2: 14张普通牌（无万能牌），丢弃一张后听牌
// 例如: 123456789m 111p 12s - 丢弃2s后听3s
const testHand2 = [
  createTile('1m'), createTile('2m'), createTile('3m'),
  createTile('4m'), createTile('5m'), createTile('6m'),
  createTile('7m'), createTile('8m'), createTile('9m'),
  createTile('1p'), createTile('1p'), createTile('1p'),
  createTile('2s'), createTile('3s')
];

const waits2 = getWaitsAfterDiscard(testHand2, 12);
console.log('测试2 - 丢弃2s后的听牌:', waits2);

// 测试3: 14张普通牌，丢弃后听牌
// 例如: 1122334455667m 89p - 丢弃7m后听...?
const testHand3 = [
  createTile('1m'), createTile('1m'), createTile('2m'), createTile('2m'),
  createTile('3m'), createTile('3m'), createTile('4m'), createTile('4m'),
  createTile('5m'), createTile('5m'), createTile('6m'), createTile('6m'),
  createTile('7m'), createTile('8p'), createTile('9p')
];

const waits3 = getWaitsAfterDiscard(testHand3, 12);
console.log('测试3 - 丢弃7m后的听牌:', waits3);
