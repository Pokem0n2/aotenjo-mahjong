/**
 * 向听数计算与听牌分析
 * 基于 EndlessCheng 的 mahjong-helper 项目算法
 * 适配为 TypeScript，支持万能牌
 */

import { Tile, TileId, ALL_TILE_IDS, TileCounts } from '../types/tile';

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

  // 扫描字牌
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

  // 计算一般型向听数
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

  // 递归计算向听数
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
 * 计算向听数（支持万能牌）
 * @param tiles34 34维牌计数数组
 * @param universalCount 万能牌数量
 * @returns 向听数（-1=胡牌，0=听牌，1+=未听牌）
 */
export function calculateShanten(tiles34: number[], universalCount: number = 0): number {
  const countOfTiles = countOfTiles34(tiles34) + universalCount;

  if (countOfTiles > 14) {
    throw new Error(`[calculateShanten] 手牌超过14张: ${countOfTiles}`);
  }

  // 没有万能牌：直接计算
  if (universalCount === 0) {
    const normalShanten = calculateShantenOfNormal(tiles34, countOfTiles);
    const chiitoiShanten = calculateShantenOfChiitoi(tiles34);
    const kokushiShanten = calculateShantenOfKokushi(tiles34);
    return minInt(minInt(normalShanten, chiitoiShanten), kokushiShanten);
  }

  // 有万能牌：遍历万能牌作为每种牌的情况，找最小向听数
  let minShanten = 8;

  // 情况1：万能牌作为独立牌（增加对子/刻子）
  for (let i = 0; i < 34; i++) {
    const tempTiles = [...tiles34];
    // 将一张万能牌作为牌i
    tempTiles[i]++;
    const shanten = calculateShanten(tempTiles, universalCount - 1);
    minShanten = minInt(minShanten, shanten);
    if (minShanten === SHANTEN_AGARI) return SHANTEN_AGARI;
  }

  // 情况2：如果有多张万能牌，递归处理
  if (universalCount >= 2) {
    for (let i = 0; i < 34; i++) {
      for (let j = 0; j < 34; j++) {
        const tempTiles = [...tiles34];
        tempTiles[i]++;
        tempTiles[j]++;
        const shanten = calculateShanten(tempTiles, universalCount - 2);
        minShanten = minInt(minShanten, shanten);
        if (minShanten === SHANTEN_AGARI) return SHANTEN_AGARI;
      }
    }
  }

  return minShanten;
}

/**
 * 获取听牌列表（13张手牌且向听数为0时）
 * @param tiles34 34维牌计数数组
 * @param universalCount 万能牌数量
 * @returns 听的牌ID列表
 */
export function getTenpaiTiles(tiles34: number[], universalCount: number = 0): TileId[] {
  const countOfTiles = countOfTiles34(tiles34) + universalCount;
  const shanten = calculateShanten(tiles34, universalCount);

  if (countOfTiles !== 13 || shanten !== 0) {
    return [];
  }

  const tenpaiTiles: TileId[] = [];

  for (let i = 0; i < 34; i++) {
    const tempTiles = [...tiles34];
    tempTiles[i]++;
    const newShanten = calculateShanten(tempTiles, universalCount);
    if (newShanten < shanten) {
      tenpaiTiles.push(ALL_TILE_IDS[i]);
    }
  }

  return tenpaiTiles;
}

/**
 * 检查是否胡牌（14张牌）
 * @param tiles34 34维牌计数数组
 * @param universalCount 万能牌数量
 * @returns 是否胡牌
 */
export function isAgariWithShanten(tiles34: number[], universalCount: number = 0): boolean {
  const countOfTiles = countOfTiles34(tiles34) + universalCount;
  if (countOfTiles !== 14) return false;
  return calculateShanten(tiles34, universalCount) === SHANTEN_AGARI;
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
 * 获取听牌信息
 */
export function getTenpaiInfo(handTiles: Tile[], universalCount: number = 0): TenpaiInfo {
  const tiles34 = tilesTo34(handTiles);
  const shanten = calculateShanten(tiles34, universalCount);
  const countOfTiles = countOfTiles34(tiles34) + universalCount;

  if (countOfTiles === 13 && shanten === 0) {
    return {
      isTenpai: true,
      waits: getTenpaiTiles(tiles34, universalCount),
      shanten: 0,
    };
  }

  return {
    isTenpai: false,
    waits: [],
    shanten,
  };
}
