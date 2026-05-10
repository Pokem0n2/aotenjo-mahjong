/**
 * 向听数计算与听牌分析
 * 基于 EndlessCheng 的 mahjong-helper 项目算法
 * 适配为 TypeScript
 * 
 * 核心思路：
 * 1. 无万能牌：直接计算向听数/听牌列表
 * 2. 有万能牌：移除万能牌→13张牌→计算听牌列表→万能牌可变为任意听牌
 */

import { Tile, TileId, ALL_TILE_IDS } from '../types/tile';

// 常量定义
const SHANTEN_AGARI = -1;
const SHANTEN_TENPAI = 0;

// 工具函数
function maxInt(a: number, b: number): number {
  return Math.max(a, b);
}

function minInt(a: number, b: number): number {
  return Math.min(a, b);
}

// 计算手牌枚数
function countOfTiles34(tiles34: number[]): number {
  return tiles34.reduce((sum, count) => sum + count, 0);
}

// 七对子向听数 = 6-对子数+max(0,7-种类数)
function calculateShantenOfChiitoi(tiles34: number[]): number {
  let shanten = 6;
  let numKind = 0;
  for (const c of tiles34) {
    if (c === 0) continue;
    if (c >= 2) shanten--;
    numKind++;
  }
  shanten += maxInt(0, 7 - numKind);
  return shanten;
}

// 国士无双向听数
function calculateShantenOfKokushi(tiles34: number[]): number {
  const yaochuIndices = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let hasAll = 0;
  let hasPair = false;
  for (const idx of yaochuIndices) {
    if (tiles34[idx] >= 1) {
      hasAll++;
      if (tiles34[idx] >= 2) hasPair = true;
    }
  }
  return 13 - hasAll - (hasPair ? 1 : 0);
}

// 一般型向听数计算
class ShantenCalculator {
  tiles: number[];
  numberMelds: number;
  numberTatsu: number;
  numberPairs: number;
  numberJidahai: number;
  ankanTiles: number;
  isolatedTiles: number;
  minShanten: number;

  constructor(tiles34: number[], countOfTiles: number) {
    this.tiles = [...tiles34];
    this.numberMelds = (14 - countOfTiles) / 3;
    this.numberTatsu = 0;
    this.numberPairs = 0;
    this.numberJidahai = 0;
    this.ankanTiles = 0;
    this.isolatedTiles = 0;
    this.minShanten = 8;
  }

  scanCharacterTiles(countOfTiles: number) {
    let ankanTiles = 0;
    let isolatedTiles = 0;

    for (let i = 0; i < 7; i++) {
      const c = this.tiles[27 + i];
      if (c === 0) continue;
      switch (c) {
        case 1:
          isolatedTiles |= 1 << i;
          break;
        case 2:
          this.numberPairs++;
          break;
        case 3:
          this.numberMelds++;
          break;
        case 4:
          this.numberMelds++;
          this.numberJidahai++;
          ankanTiles |= 1 << i;
          isolatedTiles |= 1 << i;
          break;
      }
    }

    if (this.numberJidahai > 0 && countOfTiles % 3 === 2) {
      this.numberJidahai--;
    }

    if (isolatedTiles > 0) {
      this.isolatedTiles |= 1 << 27;
      if ((ankanTiles | isolatedTiles) === ankanTiles) {
        this.ankanTiles |= 1 << 27;
      }
    }
  }

  calcNormalShanten(): number {
    let shanten = 8 - 2 * this.numberMelds - this.numberTatsu - this.numberPairs;
    let numMentsuKouho = this.numberMelds + this.numberTatsu;
    if (this.numberPairs > 0) {
      numMentsuKouho += this.numberPairs - 1;
    } else if (this.ankanTiles > 0 && this.isolatedTiles > 0) {
      if ((this.ankanTiles | this.isolatedTiles) === this.ankanTiles) {
        shanten++;
      }
    }
    if (numMentsuKouho > 4) {
      shanten += numMentsuKouho - 4;
    }
    if (shanten !== SHANTEN_AGARI && shanten < this.numberJidahai) {
      return this.numberJidahai;
    }
    return shanten;
  }

  increaseSet(k: number) {
    this.tiles[k] -= 3;
    this.numberMelds++;
  }

  decreaseSet(k: number) {
    this.tiles[k] += 3;
    this.numberMelds--;
  }

  increasePair(k: number) {
    this.tiles[k] -= 2;
    this.numberPairs++;
  }

  decreasePair(k: number) {
    this.tiles[k] += 2;
    this.numberPairs--;
  }

  increaseSyuntsu(k: number) {
    this.tiles[k]--;
    this.tiles[k + 1]--;
    this.tiles[k + 2]--;
    this.numberMelds++;
  }

  decreaseSyuntsu(k: number) {
    this.tiles[k]++;
    this.tiles[k + 1]++;
    this.tiles[k + 2]++;
    this.numberMelds--;
  }

  increaseTatsuFirst(k: number) {
    this.tiles[k]--;
    this.tiles[k + 1]--;
    this.numberTatsu++;
  }

  decreaseTatsuFirst(k: number) {
    this.tiles[k]++;
    this.tiles[k + 1]++;
    this.numberTatsu--;
  }

  increaseTatsuSecond(k: number) {
    this.tiles[k]--;
    this.tiles[k + 2]--;
    this.numberTatsu++;
  }

  decreaseTatsuSecond(k: number) {
    this.tiles[k]++;
    this.tiles[k + 2]++;
    this.numberTatsu--;
  }

  increaseIsolatedTile(k: number) {
    this.tiles[k]--;
    this.isolatedTiles |= 1 << k;
  }

  decreaseIsolatedTile(k: number) {
    this.tiles[k]++;
    this.isolatedTiles &= ~(1 << k);
  }

  run(depth: number) {
    if (this.minShanten === SHANTEN_AGARI) return;

    while (depth < 27 && this.tiles[depth] === 0) {
      depth++;
    }

    if (depth >= 27) {
      const shanten = this.calcNormalShanten();
      this.minShanten = minInt(this.minShanten, shanten);
      return;
    }

    let i = depth;
    if (i > 8) i -= 9;
    if (i > 8) i -= 9;

    switch (this.tiles[depth]) {
      case 1:
        if (i < 6 && this.tiles[depth + 1] === 1 && this.tiles[depth + 2] > 0 && this.tiles[depth + 3] < 4) {
          this.increaseSyuntsu(depth);
          this.run(depth + 2);
          this.decreaseSyuntsu(depth);
        } else {
          this.increaseIsolatedTile(depth);
          this.run(depth + 1);
          this.decreaseIsolatedTile(depth);

          if (i < 7 && this.tiles[depth + 2] > 0) {
            if (this.tiles[depth + 1] !== 0) {
              this.increaseSyuntsu(depth);
              this.run(depth + 1);
              this.decreaseSyuntsu(depth);
            }
            this.increaseTatsuSecond(depth);
            this.run(depth + 1);
            this.decreaseTatsuSecond(depth);
          }
          if (i < 8 && this.tiles[depth + 1] > 0) {
            this.increaseTatsuFirst(depth);
            this.run(depth + 1);
            this.decreaseTatsuFirst(depth);
          }
        }
        break;
      case 2:
        this.increasePair(depth);
        this.run(depth + 1);
        this.decreasePair(depth);

        if (i < 7 && this.tiles[depth + 1] > 0 && this.tiles[depth + 2] > 0) {
          this.increaseSyuntsu(depth);
          this.run(depth);
          this.decreaseSyuntsu(depth);
        }
        break;
      case 3:
        this.increaseSet(depth);
        this.run(depth + 1);
        this.decreaseSet(depth);

        this.increasePair(depth);
        if (i < 7 && this.tiles[depth + 1] > 0 && this.tiles[depth + 2] > 0) {
          this.increaseSyuntsu(depth);
          this.run(depth + 1);
          this.decreaseSyuntsu(depth);
        } else {
          if (i < 7 && this.tiles[depth + 2] > 0) {
            this.increaseTatsuSecond(depth);
            this.run(depth + 1);
            this.decreaseTatsuSecond(depth);
          }
          if (i < 8 && this.tiles[depth + 1] > 0) {
            this.increaseTatsuFirst(depth);
            this.run(depth + 1);
            this.decreaseTatsuFirst(depth);
          }
        }
        this.decreasePair(depth);

        if (i < 7 && this.tiles[depth + 1] >= 2 && this.tiles[depth + 2] >= 2) {
          this.increaseSyuntsu(depth);
          this.increaseSyuntsu(depth);
          this.run(depth);
          this.decreaseSyuntsu(depth);
          this.decreaseSyuntsu(depth);
        }
        break;
      case 4:
        this.increaseSet(depth);
        if (i < 7 && this.tiles[depth + 2] > 0) {
          if (this.tiles[depth + 1] > 0) {
            this.increaseSyuntsu(depth);
            this.run(depth + 1);
            this.decreaseSyuntsu(depth);
          }
          this.increaseTatsuSecond(depth);
          this.run(depth + 1);
          this.decreaseTatsuSecond(depth);
        }
        if (i < 8 && this.tiles[depth + 1] > 0) {
          this.increaseTatsuFirst(depth);
          this.run(depth + 1);
          this.decreaseTatsuFirst(depth);
        }
        this.increaseIsolatedTile(depth);
        this.run(depth + 1);
        this.decreaseIsolatedTile(depth);
        this.decreaseSet(depth);

        this.increasePair(depth);
        if (i < 7 && this.tiles[depth + 2] > 0) {
          if (this.tiles[depth + 1] > 0) {
            this.increaseSyuntsu(depth);
            this.run(depth);
            this.decreaseSyuntsu(depth);
          }
          this.increaseTatsuSecond(depth);
          this.run(depth + 1);
          this.decreaseTatsuSecond(depth);
        }
        if (i < 8 && this.tiles[depth + 1] > 0) {
          this.increaseTatsuFirst(depth);
          this.run(depth + 1);
          this.decreaseTatsuFirst(depth);
        }
        this.decreasePair(depth);
        break;
    }
  }
}

// 根据手牌计算一般型（不考虑七对国士）的向听数
function calculateShantenOfNormal(tiles34: number[], countOfTiles: number): number {
  const st = new ShantenCalculator(tiles34, countOfTiles);
  st.scanCharacterTiles(countOfTiles);

  for (let i = 0; i < 27; i++) {
    if (tiles34[i] === 4) {
      st.ankanTiles |= 1 << i;
    }
  }

  st.run(0);
  return st.minShanten;
}

// 计算向听数（综合一般型、七对子、国士无双）
function calculateShanten(tiles34: number[]): number {
  const countOfTiles = countOfTiles34(tiles34);
  const normalShanten = calculateShantenOfNormal(tiles34, countOfTiles);
  const chiitoiShanten = calculateShantenOfChiitoi(tiles34);
  const kokushiShanten = calculateShantenOfKokushi(tiles34);
  return minInt(minInt(normalShanten, chiitoiShanten), kokushiShanten);
}

// ========== 对外接口 ==========

/**
 * 将Tile数组转为tiles34格式
 */
export function tilesTo34(tiles: Tile[]): number[] {
  const tiles34 = new Array(34).fill(0);
  for (const tile of tiles) {
    const idx = ALL_TILE_IDS.indexOf(tile.id as TileId);
    if (idx >= 0) tiles34[idx]++;
  }
  return tiles34;
}

/**
 * 获取听牌列表（13张手牌且向听数为0时）
 * @param tiles34 34维牌计数数组
 * @returns 听的牌ID列表
 */
export function getTenpaiTiles(tiles34: number[]): TileId[] {
  const countOfTiles = countOfTiles34(tiles34);
  const shanten = calculateShanten(tiles34);

  if (countOfTiles !== 13 || shanten !== 0) {
    return [];
  }

  const tenpaiTiles: TileId[] = [];

  for (let i = 0; i < 34; i++) {
    const tempTiles = [...tiles34];
    tempTiles[i]++;
    const newShanten = calculateShanten(tempTiles);
    if (newShanten < shanten) {
      tenpaiTiles.push(ALL_TILE_IDS[i]);
    }
  }

  return tenpaiTiles;
}

/**
 * 检查是否胡牌（14张牌）
 * @param tiles34 34维牌计数数组
 * @returns 是否胡牌
 */
export function isAgariWithShanten(tiles34: number[]): boolean {
  const countOfTiles = countOfTiles34(tiles34);
  if (countOfTiles !== 14) return false;
  return calculateShanten(tiles34) === SHANTEN_AGARI;
}

/**
 * 万能牌最佳牌型搜索结果
 */
export interface BestUniversalResult {
  bestTileId: TileId | null;  // 万能牌应变成的牌（null=无法胡牌）
  isAgari: boolean;           // 是否胡牌
  pattern: string;            // 牌型名称
  fan: number;                // 番数
  shanten: number;            // 向听数
  waits: TileId[];            // 听牌列表
}

/**
 * 评估手牌（含万能牌）
 * 
 * 核心逻辑：
 * 1. 从手牌中移除万能牌，得到13张普通牌
 * 2. 用mahjong-analysis算法计算这13张牌的听牌列表
 * 3. 对每张听牌，模拟摸入后计算牌型得分
 * 4. 选择得分最高的牌型，万能牌变成该牌型所缺的牌
 * 
 * @param handTiles 完整手牌（含万能牌）
 * @returns 最佳结果
 */
export function evaluateHandWithUniversal(handTiles: Tile[]): BestUniversalResult {
  // 分离万能牌和普通牌
  const normalTiles: Tile[] = [];
  let universalCount = 0;
  
  for (const tile of handTiles) {
    if (tile.id === 'universal') {
      universalCount++;
    } else {
      normalTiles.push(tile);
    }
  }

  const tiles34 = tilesTo34(normalTiles);
  const countOfTiles = countOfTiles34(tiles34);

  // 无万能牌：直接计算
  if (universalCount === 0) {
    const shanten = calculateShanten(tiles34);
    return {
      bestTileId: null,
      isAgari: shanten === SHANTEN_AGARI,
      pattern: shanten === SHANTEN_AGARI ? '一般' : '',
      fan: shanten === SHANTEN_AGARI ? 1 : 0,
      shanten,
      waits: [],
    };
  }

  // 有万能牌：
  // 情况A：13张普通牌 + 1张万能牌 = 14张
  // 万能牌可以变成任意牌，所以13张普通牌的听牌列表就是万能牌的可变范围
  if (countOfTiles === 13 && universalCount === 1) {
    const shanten = calculateShanten(tiles34);
    const waits = getTenpaiTiles(tiles34);

      if (waits.length > 0) {
        // 听牌了！遍历所有听牌，找得分最高的
        let bestTileId: TileId | null = null;
        let bestFan = 0;
        let bestPattern = '一般';

        for (const waitTileId of waits) {
          // 模拟摸入这张牌（万能牌变成这张牌）
          const tempTiles = [...tiles34];
          const idx = ALL_TILE_IDS.indexOf(waitTileId);
          tempTiles[idx]++;
          
          // 计算牌型得分（简化版）
          const fan = calculatePatternFan(tempTiles);
          
          if (fan > bestFan) {
            bestFan = fan;
            bestTileId = waitTileId;
            // 根据牌型确定pattern名称
            bestPattern = getPatternName(tempTiles);
          }
        }

        return {
          bestTileId: bestTileId || waits[0],
          isAgari: true,
          pattern: bestPattern,
          fan: bestFan || 1,
          shanten: SHANTEN_TENPAI,
          waits,
        };
      }

    // 未听牌，返回向听数
    return {
      bestTileId: null,
      isAgari: false,
      pattern: '',
      fan: 0,
      shanten,
      waits: [],
    };
  }

  // 其他情况（如12张普通牌 + 2张万能牌等）：降级为遍历处理
  // TODO: 处理多张万能牌的情况
  return {
    bestTileId: null,
    isAgari: false,
    pattern: '',
    fan: 0,
    shanten: 8,
    waits: [],
  };
}

/**
 * 计算牌型番数（简化版）
 * 基于14张牌的牌型特征计算
 */
function calculatePatternFan(tiles34: number[]): number {
  let fan = 1;
  
  // 检查七对子
  let pairs = 0;
  for (const c of tiles34) {
    if (c === 2) pairs++;
    if (c === 4) pairs += 2;
  }
  if (pairs === 7) return 2;
  
  // 检查国士无双
  const yaochuIndices = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  let hasAllYaochu = true;
  let hasPair = false;
  for (const idx of yaochuIndices) {
    if (tiles34[idx] === 0) hasAllYaochu = false;
    if (tiles34[idx] >= 2) hasPair = true;
  }
  if (hasAllYaochu && hasPair) return 13;
  
  // 检查清一色
  let suitCounts = { m: 0, p: 0, s: 0, z: 0 };
  for (let i = 0; i < 34; i++) {
    if (tiles34[i] > 0) {
      if (i < 9) suitCounts.m += tiles34[i];
      else if (i < 18) suitCounts.p += tiles34[i];
      else if (i < 27) suitCounts.s += tiles34[i];
      else suitCounts.z += tiles34[i];
    }
  }
  
  const nonZeroSuits = [suitCounts.m, suitCounts.p, suitCounts.s, suitCounts.z].filter(c => c > 0);
  if (nonZeroSuits.length === 1 && suitCounts.z === 0) {
    // 清一色
    fan = Math.max(fan, 6);
  } else if (nonZeroSuits.length === 2 && suitCounts.z > 0) {
    // 混一色
    fan = Math.max(fan, 3);
  }
  
  // 检查对对和
  let kotsuCount = 0;
  for (const c of tiles34) {
    if (c >= 3) kotsuCount++;
  }
  if (kotsuCount >= 4) {
    fan = Math.max(fan, 2);
  }
  
  return fan;
}

/**
 * 根据34张牌数组获取牌型名称
 * 用于道具卡触发判定（如通天藤蔓需要知道是条/筒/万一色）
 */
export function getPatternName(tiles34: number[]): string {
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
  
  // 检查清一色/混一色，并返回具体花色
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
  // 关键特征：9种牌各至少1张，且1和9至少有2张（作为雀头或刻子的一部分）
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
      // 因为九莲宝灯结构要求111...和...999
      const totalTiles = tiles34.reduce((sum, c) => sum + c, 0);
      if (hasAllNine && tiles34[suitStart] >= 2 && tiles34[suitStart + 8] >= 2 && totalTiles === 14) {
        return '九莲宝灯';
      }
    }
  }
  
  if (nonZeroSuits.length === 1) {
    if (suitCounts.m > 0) return '清一色(万)';
    if (suitCounts.p > 0) return '清一色(筒)';
    if (suitCounts.s > 0) return '清一色(条)';
  } else if (nonZeroSuits.length === 2 && suitCounts.z > 0) {
    if (suitCounts.m > 0) return '混一色(万)';
    if (suitCounts.p > 0) return '混一色(筒)';
    if (suitCounts.s > 0) return '混一色(条)';
  }
  
  // 检查对对和
  let kotsuCount = 0;
  for (const c of tiles34) {
    if (c >= 3) kotsuCount++;
  }
  if (kotsuCount >= 4) return '对对和';
  
  return '一般';
}

/**
 * 听牌信息
 */
export interface TenpaiInfo {
  isTenpai: boolean;
  waits: TileId[];
  shanten: number;
}

/**
 * 获取听牌信息（13张牌）
 */
export function getTenpaiInfo(handTiles: Tile[]): TenpaiInfo {
  const tiles34 = tilesTo34(handTiles);
  const shanten = calculateShanten(tiles34);
  const countOfTiles = countOfTiles34(tiles34);

  if (countOfTiles === 13 && shanten === 0) {
    return {
      isTenpai: true,
      waits: getTenpaiTiles(tiles34),
      shanten: 0,
    };
  }

  return {
    isTenpai: false,
    waits: [],
    shanten,
  };
}

/**
 * 计算丢弃某张牌后的听牌列表
 * 用于悬停预览功能
 * 
 * @param handTiles 当前手牌（14张）
 * @param discardIndex 要丢弃的牌索引
 * @returns 听牌列表（TileId数组），如果丢弃后未听牌则返回空数组
 */
export function getWaitsAfterDiscard(handTiles: Tile[], discardIndex: number): TileId[] {
  // 检查索引有效性
  if (discardIndex < 0 || discardIndex >= handTiles.length) {
    return [];
  }
  
  // 创建丢弃后的13张牌数组
  const remainingTiles = handTiles.filter((_, i) => i !== discardIndex);
  
  // 检查是否有万能牌
  const hasUniversal = remainingTiles.some(t => t.id === 'universal');
  
  if (hasUniversal) {
    // 有万能牌：13张牌中含1张万能牌 = 12张普通牌 + 1万能牌
    // 万能牌可以变成任意牌，所以遍历所有34种牌，看哪种能让13张牌听牌
    const normalTiles = remainingTiles.filter(t => t.id !== 'universal');
    const tiles34 = tilesTo34(normalTiles);
    const waits: TileId[] = [];
    
    for (let i = 0; i < 34; i++) {
      // 模拟万能牌变成第i种牌
      const tempTiles = [...tiles34];
      tempTiles[i]++;
      const shanten = calculateShanten(tempTiles);
      if (shanten === SHANTEN_TENPAI) {
        // 13张牌（12普通+1万能变牌）听牌了
        waits.push(ALL_TILE_IDS[i]);
      }
    }
    
    return waits;
  } else {
    // 无万能牌：直接计算13张牌的听牌列表
    const tiles34 = tilesTo34(remainingTiles);
    return getTenpaiTiles(tiles34);
  }
}
