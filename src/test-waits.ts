import { getWaitsAfterDiscard } from './engine/shanten-new';
import { createTile, Suit } from './types/tile';

const testHand = [
  createTile('1m'), createTile('1m'), createTile('2m'), createTile('2m'),
  createTile('3m'), createTile('3m'), createTile('4m'), createTile('4m'),
  createTile('5m'), createTile('5m'), createTile('6m'), createTile('6m'),
  createTile('7m'), { id: 'universal', suit: 'z' as Suit, value: 0, isHonor: true, isTerminal: false }
];

const waits = getWaitsAfterDiscard(testHand, 12);
console.log('听牌结果:', waits);
