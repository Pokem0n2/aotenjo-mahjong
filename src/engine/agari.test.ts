import { isAgari } from './agari';
import { createTile, TileId } from '../types/tile';
import { initHand, HandState } from './hand';

// 测试用例1: 简单和牌 - 1m2m3m 4m5m6m 7m8m9m 1p1p + 1p
function testSimpleAgari() {
  const tiles = [
    createTile('1m'), createTile('2m'), createTile('3m'),
    createTile('4m'), createTile('5m'), createTile('6m'),
    createTile('7m'), createTile('8m'), createTile('9m'),
    createTile('1p'), createTile('1p'), createTile('2p'), createTile('2p'),
  ];
  const hand = initHand(tiles);
  const winningTile = createTile('1p'); // 和牌
  
  console.log('Test 1 - Simple Agari:');
  console.log('Hand tiles:', tiles.map(t => t.id).join(', '));
  console.log('Winning tile:', winningTile.id);
  
  const result = isAgari(hand, winningTile);
  console.log('Result:', result.isAgari, result.form);
  console.log('Expected: true, standard');
  console.log('Pass:', result.isAgari === true && result.form === 'standard');
  console.log('');
}

// 测试用例2: 七对子
function testChiitoitsu() {
  const tiles = [
    createTile('1m'), createTile('1m'),
    createTile('2m'), createTile('2m'),
    createTile('3m'), createTile('3m'),
    createTile('4m'), createTile('4m'),
    createTile('1p'), createTile('1p'),
    createTile('2p'), createTile('2p'),
    createTile('3p'),
  ];
  const hand = initHand(tiles);
  const winningTile = createTile('3p');
  
  console.log('Test 2 - Chiitoitsu:');
  const result = isAgari(hand, winningTile);
  console.log('Result:', result.isAgari, result.form);
  console.log('Pass:', result.isAgari === true && result.form === 'chiitoitsu');
  console.log('');
}

// 测试用例3: 国士无双
function testKokushi() {
  const tiles = [
    createTile('1m'), createTile('9m'),
    createTile('1p'), createTile('9p'),
    createTile('1s'), createTile('9s'),
    createTile('1z'), createTile('2z'), createTile('3z'), createTile('4z'),
    createTile('5z'), createTile('6z'), createTile('7z'),
  ];
  const hand = initHand(tiles);
  const winningTile = createTile('1z'); // 重复1z做雀头
  
  console.log('Test 3 - Kokushi:');
  const result = isAgari(hand, winningTile);
  console.log('Result:', result.isAgari, result.form);
  console.log('Pass:', result.isAgari === true && result.form === 'kokushi');
  console.log('');
}

// 测试用例4: 向听数1的手牌（不能和牌）
function testNotAgari() {
  const tiles = [
    createTile('1m'), createTile('2m'), createTile('3m'),
    createTile('4m'), createTile('5m'), createTile('6m'),
    createTile('7m'), createTile('8m'),
    createTile('1p'), createTile('1p'), createTile('2p'), createTile('2p'),
    createTile('3p'),
  ];
  const hand = initHand(tiles);
  const winningTile = createTile('4p'); // 不能和牌
  
  console.log('Test 4 - Not Agari (shanten 1):');
  const result = isAgari(hand, winningTile);
  console.log('Result:', result.isAgari);
  console.log('Pass:', result.isAgari === false);
  console.log('');
}

// 运行所有测试
testSimpleAgari();
testChiitoitsu();
testKokushi();
testNotAgari();
