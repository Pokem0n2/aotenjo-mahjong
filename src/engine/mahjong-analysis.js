/**
 * 日本麻将助手核心分析模块
 * 基于 EndlessCheng 的 mahjong-helper 项目
 */

// 麻将牌定义
const Mahjong = [
  "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m",
  "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p",
  "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s",
  "1z", "2z", "3z", "4z", "5z", "6z", "7z"
];

const MahjongZH = [
  "一万", "二万", "三万", "四万", "五万", "六万", "七万", "八万", "九万",
  "一筒", "二筒", "三筒", "四筒", "五筒", "六筒", "七筒", "八筒", "九筒",
  "一条", "二条", "三条", "四条", "五条", "六条", "七条", "八条", "九条",
  "东风", "南风", "西风", "北风", "白板", "发财", "红中"
];

const YaochuTiles = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];

// 常量定义
const shantenStateAgari = -1;
const shantenStateTenpai = 0;

// 工具函数
function MaxInt(a, b) {
  return Math.max(a, b);
}

function MinInt(a, b) {
  return Math.min(a, b);
}

// 计算手牌枚数
function CountOfTiles34(tiles34) {
  return tiles34.reduce((sum, count) => sum + count, 0);
}

// 计算手牌对子数
function CountPairsOfTiles34(tiles34) {
  return tiles34.filter(count => count >= 2).length;
}

// 初始化剩余牌
function InitLeftTiles34() {
  const leftTiles34 = new Array(34).fill(4);
  return leftTiles34;
}

// 根据传入的牌，返回移除这些牌后剩余的牌
function InitLeftTiles34WithTiles34(tiles34) {
  const leftTiles34 = new Array(34);
  for (let i = 0; i < 34; i++) {
    leftTiles34[i] = 4 - tiles34[i];
  }
  return leftTiles34;
}

// 七对子向听数 = 6-对子数+max(0,7-种类数)
function CalculateShantenOfChiitoi(tiles34) {
  let shanten = 6;
  let numKind = 0;
  for (const c of tiles34) {
    if (c === 0) {
      continue;
    }
    if (c >= 2) {
      shanten--;
    }
    numKind++;
  }
  shanten += MaxInt(0, 7 - numKind);
  return shanten;
}

// 一般型向听数计算
class Shanten {
  constructor(tiles34, countOfTiles) {
    this.tiles = tiles34;
    this.numberMelds = (14 - countOfTiles) / 3;
    this.numberTatsu = 0;
    this.numberPairs = 0;
    this.numberJidahai = 0; // 13枚にしてから少なくとも打牌しなければならない字牌の数
    this.ankanTiles = 0; // 暗杠，28bit 位压缩：27bit数牌|1bit字牌
    this.isolatedTiles = 0; // 孤张，28bit 位压缩：27bit数牌|1bit字牌
    this.minShanten = 8; // 不考虑国士无双和七对子的最大向听
  }

  // 扫描字牌
  scanCharacterTiles(countOfTiles) {
    let ankanTiles = 0;    // 暗杠，7bit 位压缩
    let isolatedTiles = 0; // 孤张，7bit 位压缩

    for (let i = 0; i < 7; i++) {
      const c = this.tiles[27 + i];
      if (c === 0) {
        continue;
      }
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
        // 此孤张不能视作单骑做雀头的材料
        this.ankanTiles |= 1 << 27;
      }
    }
  }

  // 计算一般型向听数
  calcNormalShanten() {
    let _shanten = 8 - 2 * this.numberMelds - this.numberTatsu - this.numberPairs;
    let numMentsuKouho = this.numberMelds + this.numberTatsu;
    if (this.numberPairs > 0) {
      numMentsuKouho += this.numberPairs - 1; // 有雀头时面子候补-1
    } else if (this.ankanTiles > 0 && this.isolatedTiles > 0) {
      if ((this.ankanTiles | this.isolatedTiles) === this.ankanTiles) {
        // 没有雀头，且除了暗杠外没有孤张，这连单骑都算不上
        _shanten++;
      }
    }
    if (numMentsuKouho > 4) { // 面子候补过多
      _shanten += numMentsuKouho - 4;
    }
    if (_shanten !== shantenStateAgari && _shanten < this.numberJidahai) {
      return this.numberJidahai;
    }
    return _shanten;
  }

  // 拆分出一个暗刻
  increaseSet(k) {
    this.tiles[k] -= 3;
    this.numberMelds++;
  }

  decreaseSet(k) {
    this.tiles[k] += 3;
    this.numberMelds--;
  }

  // 拆分出一个雀头
  increasePair(k) {
    this.tiles[k] -= 2;
    this.numberPairs++;
  }

  decreasePair(k) {
    this.tiles[k] += 2;
    this.numberPairs--;
  }

  // 拆分出一个顺子
  increaseSyuntsu(k) {
    this.tiles[k]--;
    this.tiles[k + 1]--;
    this.tiles[k + 2]--;
    this.numberMelds++;
  }

  decreaseSyuntsu(k) {
    this.tiles[k]++;
    this.tiles[k + 1]++;
    this.tiles[k + 2]++;
    this.numberMelds--;
  }

  // 拆分出一个两面/边张搭子
  increaseTatsuFirst(k) {
    this.tiles[k]--;
    this.tiles[k + 1]--;
    this.numberTatsu++;
  }

  decreaseTatsuFirst(k) {
    this.tiles[k]++;
    this.tiles[k + 1]++;
    this.numberTatsu--;
  }

  // 拆分出一个坎张搭子
  increaseTatsuSecond(k) {
    this.tiles[k]--;
    this.tiles[k + 2]--;
    this.numberTatsu++;
  }

  decreaseTatsuSecond(k) {
    this.tiles[k]++;
    this.tiles[k + 2]++;
    this.numberTatsu--;
  }

  // 拆分出一个孤张（浮牌）
  increaseIsolatedTile(k) {
    this.tiles[k]--;
    this.isolatedTiles |= 1 << k;
  }

  decreaseIsolatedTile(k) {
    this.tiles[k]++;
    this.isolatedTiles &= ~(1 << k);
  }

  // 递归计算向听数
  run(depth) {
    if (this.minShanten === shantenStateAgari) {
      return;
    }

    // 跳过空牌
    while (depth < 27 && this.tiles[depth] === 0) {
      depth++;
    }

    if (depth >= 27) {
      const _shanten = this.calcNormalShanten();
      this.minShanten = MinInt(this.minShanten, _shanten);
      return;
    }

    // 快速取模
    let i = depth;
    if (i > 8) i -= 9;
    if (i > 8) i -= 9;

    // 手牌拆解
    switch (this.tiles[depth]) {
      case 1:
        if (i < 6 && this.tiles[depth + 1] === 1 && this.tiles[depth + 2] > 0 && this.tiles[depth + 3] < 4) {
          // 延べ単
          // 顺子
          this.increaseSyuntsu(depth);
          this.run(depth + 2);
          this.decreaseSyuntsu(depth);
        } else {
          // 浮牌
          this.increaseIsolatedTile(depth);
          this.run(depth + 1);
          this.decreaseIsolatedTile(depth);

          if (i < 7 && this.tiles[depth + 2] > 0) {
            if (this.tiles[depth + 1] !== 0) {
              // 顺子
              this.increaseSyuntsu(depth);
              this.run(depth + 1);
              this.decreaseSyuntsu(depth);
            }
            // 坎张搭子
            this.increaseTatsuSecond(depth);
            this.run(depth + 1);
            this.decreaseTatsuSecond(depth);
          }
          if (i < 8 && this.tiles[depth + 1] > 0) {
            // 两面/边张搭子
            this.increaseTatsuFirst(depth);
            this.run(depth + 1);
            this.decreaseTatsuFirst(depth);
          }
        }
        break;
      case 2:
        // 雀头
        this.increasePair(depth);
        this.run(depth + 1);
        this.decreasePair(depth);

        if (i < 7 && this.tiles[depth + 1] > 0 && this.tiles[depth + 2] > 0) {
          // 顺子
          this.increaseSyuntsu(depth);
          this.run(depth);
          this.decreaseSyuntsu(depth);
        }
        break;
      case 3:
        // 暗刻
        this.increaseSet(depth);
        this.run(depth + 1);
        this.decreaseSet(depth);

        this.increasePair(depth);
        if (i < 7 && this.tiles[depth + 1] > 0 && this.tiles[depth + 2] > 0) {
          // 雀头+顺子
          this.increaseSyuntsu(depth);
          this.run(depth + 1);
          this.decreaseSyuntsu(depth);
        } else {
          if (i < 7 && this.tiles[depth + 2] > 0) {
            // 雀头+坎张搭子
            this.increaseTatsuSecond(depth);
            this.run(depth + 1);
            this.decreaseTatsuSecond(depth);
          }
          if (i < 8 && this.tiles[depth + 1] > 0) {
            // 雀头+两面/边张搭子
            this.increaseTatsuFirst(depth);
            this.run(depth + 1);
            this.decreaseTatsuFirst(depth);
          }
        }
        this.decreasePair(depth);

        if (i < 7 && this.tiles[depth + 1] >= 2 && this.tiles[depth + 2] >= 2) {
          // 一杯口
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
            // 暗刻+顺子
            this.increaseSyuntsu(depth);
            this.run(depth + 1);
            this.decreaseSyuntsu(depth);
          }
          // 暗刻+坎张搭子
          this.increaseTatsuSecond(depth);
          this.run(depth + 1);
          this.decreaseTatsuSecond(depth);
        }
        if (i < 8 && this.tiles[depth + 1] > 0) {
          // 暗刻+两面/边张搭子
          this.increaseTatsuFirst(depth);
          this.run(depth + 1);
          this.decreaseTatsuFirst(depth);
        }
        // 暗刻+孤张
        this.increaseIsolatedTile(depth);
        this.run(depth + 1);
        this.decreaseIsolatedTile(depth);
        this.decreaseSet(depth);

        this.increasePair(depth);
        if (i < 7 && this.tiles[depth + 2] > 0) {
          if (this.tiles[depth + 1] > 0) {
            // 雀头+顺子
            this.increaseSyuntsu(depth);
            this.run(depth);
            this.decreaseSyuntsu(depth);
          }
          // 雀头+坎张搭子
          this.increaseTatsuSecond(depth);
          this.run(depth + 1);
          this.decreaseTatsuSecond(depth);
        }
        if (i < 8 && this.tiles[depth + 1] > 0) {
          // 雀头+两面/边张搭子
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
function CalculateShantenOfNormal(tiles34, countOfTiles) {
  const st = new Shanten(tiles34, countOfTiles);
  st.scanCharacterTiles(countOfTiles);

  for (let i = 0; i < 27; i++) {
    if (tiles34[i] === 4) {
      st.ankanTiles |= 1 << i;
    }
  }

  st.run(0);
  return st.minShanten;
}

// 根据手牌计算向听数（不考虑国士）
function CalculateShanten(tiles34) {
  const countOfTiles = CountOfTiles34(tiles34);
  if (countOfTiles > 14) {
    throw new Error(`[CalculateShanten] 参数错误 >14: ${tiles34}, ${countOfTiles}`);
  }
  let minShanten = CalculateShantenOfNormal(tiles34, countOfTiles);
  if (countOfTiles >= 13) { // 考虑七对子
    minShanten = MinInt(minShanten, CalculateShantenOfChiitoi(tiles34));
  }
  return minShanten;
}

// 进张分析
class Waits {
  constructor() {
    this.waits = new Map();
  }

  add(tile, count) {
    this.waits.set(tile, count);
  }

  get(tile) {
    return this.waits.get(tile) || 0;
  }

  AllCount() {
    let count = 0;
    for (const cnt of this.waits.values()) {
      count += cnt;
    }
    return count;
  }

  AvailableTiles() {
    const tiles = [];
    for (const [tile, count] of this.waits.entries()) {
      if (count > 0) {
        tiles.push(tile);
      }
    }
    tiles.sort((a, b) => a - b);
    return tiles;
  }

  indexes() {
    const tiles = [];
    for (const tile of this.waits.keys()) {
      tiles.push(tile);
    }
    tiles.sort((a, b) => a - b);
    return tiles;
  }

  tilesZH() {
    const tiles = [];
    for (const tile of this.indexes()) {
      tiles.push(MahjongZH[tile]);
    }
    return tiles;
  }

  toString() {
    return `${this.AllCount()} 进张 ${this.tilesZH().join(' ')}`;
  }

  Equals(w1) {
    const tiles0 = this.AvailableTiles();
    const tiles1 = w1.AvailableTiles();
    if (tiles0.length !== tiles1.length) {
      return false;
    }
    for (let i = 0; i < tiles0.length; i++) {
      if (tiles0[i] !== tiles1[i]) {
        return false;
      }
    }
    return true;
  }
}

// 解析手牌字符串为 tiles34 格式
function ParseTiles(tilesStr) {
  const tiles34 = new Array(34).fill(0);
  const parts = tilesStr.trim().split(/\s+/);
  let totalCount = 0;
  
  for (const part of parts) {
    if (!part) continue;
    
    let i = 0;
    while (i < part.length) {
      let tile = '';
      if (part[i] === '0') {
        // 红宝牌
        tile = '0' + part[i + 1];
        i += 2;
      } else {
        // 普通牌
        tile = part[i] + part[i + 1];
        i += 2;
      }
      
      const index = Mahjong.indexOf(tile);
      if (index === -1) {
        throw new Error(`无效的牌: ${tile}`);
      }
      
      tiles34[index]++;
      totalCount++;
      
      if (tiles34[index] > 4) {
        throw new Error(`牌数超过4张: ${tile}`);
      }
      
      if (totalCount > 14) {
        throw new Error(`手牌张数超过14张: ${totalCount}`);
      }
    }
  }
  
  return tiles34;
}

// 分析手牌
function AnalyzeTiles(tilesStr) {
  try {
    const tiles34 = ParseTiles(tilesStr);
    const countOfTiles = CountOfTiles34(tiles34);
    
    // 检查手牌张数，确保不超过14张
    if (countOfTiles > 14) {
      return {
        suggestions: [],
        danger: {},
        error: `手牌张数超过14张: ${countOfTiles}`
      };
    }
    
    const shanten = CalculateShanten(tiles34);
    
    // 计算当前手牌的听牌情况（仅适用于13张手牌）
    let tenpaiTiles = [];
    if (countOfTiles === 13 && shanten === 0) {
      const waits = new Waits();
      const leftTiles34 = InitLeftTiles34WithTiles34(tiles34);
      
      for (let i = 0; i < 34; i++) {
        if (leftTiles34[i] === 0) continue;
        
        const newTiles34 = [...tiles34];
        newTiles34[i]++;
        const newCountOfTiles = countOfTiles + 1;
        
        if (newCountOfTiles > 14) continue;
        
        const newShanten = CalculateShanten(newTiles34);
        
        if (newShanten < shanten) {
          waits.add(i, leftTiles34[i]);
        }
      }
      
      tenpaiTiles = waits.tilesZH().join(',');
    }
    
    // 生成推荐舍牌
    const suggestions = [];
    
    // 模拟切每张牌，计算进张
    for (let i = 0; i < 34; i++) {
      if (tiles34[i] === 0) continue;
      
      const newTiles34 = [...tiles34];
      newTiles34[i]--;
      const newCountOfTiles = countOfTiles - 1;
      
      // 检查切牌后的张数，确保至少1张
      if (newCountOfTiles < 1) continue;
      
      // 计算切牌后的向听数
      const newShanten = CalculateShanten(newTiles34);
      
      // 计算切牌后的进张
      const newWaits = new Waits();
      const newLeftTiles34 = InitLeftTiles34WithTiles34(newTiles34);
      
      for (let j = 0; j < 34; j++) {
        if (newLeftTiles34[j] === 0) continue;
        
        const tempTiles34 = [...newTiles34];
        tempTiles34[j]++;
        const tempCountOfTiles = newCountOfTiles + 1;
        
        // 检查摸牌后的张数，确保不超过14张
        if (tempCountOfTiles > 14) continue;
        
        const tempShanten = CalculateShanten(tempTiles34);
        
        if (tempShanten < newShanten) {
          newWaits.add(j, newLeftTiles34[j]);
        }
      }
      
      // 生成推荐信息
      const suggestion = {
        tile: Mahjong[i],
        efficiency: `${newWaits.AllCount()}`,
        after: `${newWaits.AllCount()}`,
        speed: (8 - newShanten).toString(),
        points: '2000', // 简化处理
        yaku: '', // 简化处理
        tenpai: newShanten === 0,
        tiles: newWaits.tilesZH().join(',')
      };
      
      suggestions.push(suggestion);
    }
    
    // 按进张数排序
    suggestions.sort((a, b) => {
      const effA = parseInt(a.efficiency);
      const effB = parseInt(b.efficiency);
      return effB - effA;
    });
    
    // 危险度分析（简化处理）
    const danger = {};
    for (let i = 0; i < 34; i++) {
      if (tiles34[i] > 0) {
        danger[Mahjong[i]] = Math.floor(Math.random() * 20);
      }
    }
    
    return {
      suggestions,
      danger,
      shanten,
      tenpaiTiles
    };
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      suggestions: [],
      danger: {},
      error: error.message
    };
  }
}

// 导出模块
module.exports = {
  AnalyzeTiles,
  CalculateShanten,
  ParseTiles,
  Mahjong,
  MahjongZH
};