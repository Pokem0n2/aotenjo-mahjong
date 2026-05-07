/**
 * 分数计算系统 - 青云之志模式
 * 基础分 × 2^番数 + 护身符加成
 */

import type { AmuletState } from './amulet';
import type { PlayerStats } from '../data/enemies';

/**
 * 分数计算配置
 */
export interface ScoreConfig {
  baseScore: number;          // 基础分
  oyaBonus: number;           // 亲权加成倍率
  tsumoBonus: number;         // 自摸加成
  riichiBonus: number;        // 立直加成
  ippatsuBonus: number;       // 一发加成
  uraDoraBonus: number;       // 里宝牌加成
  renchanBonus: number;       // 连庄加成
}

/**
 * 默认分数配置
 */
export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  baseScore: 100,
  oyaBonus: 1.5,
  tsumoBonus: 1.2,
  riichiBonus: 1.5,
  ippatsuBonus: 1.3,
  uraDoraBonus: 1.1,
  renchanBonus: 1.5,
};

/**
 * 役种类型
 */
export type YakuType =
  | 'tanyao'          // 断幺九
  | 'pinfu'           // 平和
  | 'reach'           // 立直
  | 'ippatsu'         // 一发
  | 'tsumo'           // 自摸
  | 'oya'             // 亲
  | '一等'            // 一盃口
  | 'ryanpeikou'      // 二盃口
  | 'toitoi'          // 对对和
  | 'sanankou'        // 三暗刻
  | 'sanshoku'        // 三色同顺
  | 'ittsu'           // 一气通贯
  | 'honrou'          // 混全带幺九
  | 'junrou'          // 纯全带幺九
  | 'honitsu'         // 混一色
  | 'chinitsu'        // 清一色
  | 'chitoitsu'       // 七对子
  | 'kokushimusou'    // 国士无双
  | 'tenhou'          // 天和
  | 'chihou'          // 地和
  | 'daisuushi'       // 大四喜
  | 'shosuushi'       // 小四喜
  | 'daisangen'       // 大三元
  | 'ryuiisou'        // 绿一色
  | 'chinroutou'      // 清老头
  | 'tsuuiisou'       // 字一色
  | 'sankantsu'       // 三杠子
  | 'suuankou'        // 四暗刻
  | 'suuankoutanki'   // 四暗刻单骑
  | 'daburReach'      // 双立直
  | 'uradora'         // 里宝牌
  | 'akadora'         // 赤宝牌
  | 'renhou'          // 人和
  | 'dora'            // 宝牌
  | 'chankan'         // 枪杠
  | 'haitei'          // 海底捞月
  | 'houtei'          // 河底捞鱼
  | 'tenpai';         // 听牌（流局）

/**
 * 役种信息
 */
export interface YakuInfo {
  type: YakuType;
  name: string;
  han: number;         // 番数
  isYakuman: boolean;   // 是否为役满
  desc: string;
}

/**
 * 标准役种表
 */
export const YAKU_LIST: YakuInfo[] = [
  // 1番
  { type: 'tanyao', name: '断幺九', han: 1, isYakuman: false, desc: '不含幺九牌的顺子/刻子' },
  { type: 'pinfu', name: '平和', han: 1, isYakuman: false, desc: '4组顺子+两边听牌' },
  { type: 'reach', name: '立直', han: 1, isYakuman: false, desc: '宣告立直后胡牌' },
  { type: 'tsumo', name: '自摸', han: 1, isYakuman: false, desc: '自己摸到胡牌' },
  { type: 'oya', name: '亲', han: 1, isYakuman: false, desc: '亲家胡牌' },
  { type: 'ippatsu', name: '一发', han: 1, isYakuman: false, desc: '立直后1巡内胡牌' },
  { type: 'dora', name: '宝牌', han: 1, isYakuman: false, desc: '每张宝牌+1番' },
  { type: 'akadora', name: '赤宝牌', han: 1, isYakuman: false, desc: '每张赤宝牌+1番' },
  
  // 2番
  { type: '一等', name: '一盃口', han: 2, isYakuman: false, desc: '同一顺子两组' },
  { type: 'sanshoku', name: '三色同顺', han: 2, isYakuman: false, desc: '万/筒/索同数字顺子' },
  { type: 'ittsu', name: '一气通贯', han: 2, isYakuman: false, desc: '同一花色123-789顺子' },
  { type: 'honrou', name: '混全带幺九', han: 2, isYakuman: false, desc: '所有牌带幺九牌' },
  { type: 'chitoitsu', name: '七对子', han: 2, isYakuman: false, desc: '7组对子' },
  
  // 3番
  { type: 'honitsu', name: '混一色', han: 3, isYakuman: false, desc: '同一花色+字牌' },
  { type: 'sanankou', name: '三暗刻', han: 3, isYakuman: false, desc: '3组暗刻' },
  { type: 'toitoi', name: '对对和', han: 3, isYakuman: false, desc: '4组刻子+雀头' },
  { type: 'sanshoku', name: '三色同刻', han: 3, isYakuman: false, desc: '万/筒/索同数字刻子' },
  { type: 'sankantsu', name: '三杠子', han: 3, isYakuman: false, desc: '3组杠子' },
  
  // 6番
  { type: 'junrou', name: '纯全带幺九', han: 6, isYakuman: false, desc: '全带幺九且同色' },
  { type: 'ryanpeikou', name: '二盃口', han: 6, isYakuman: false, desc: '两组一盃口' },
  
  // 役满 (13番或无限)
  { type: 'chinitsu', name: '清一色', han: 13, isYakuman: true, desc: '同一花色无字牌' },
  { type: 'chitoitsu', name: '七对子', han: 13, isYakuman: true, desc: '7组对子（特殊）' },
  { type: 'kokushimusou', name: '国士无双', han: 13, isYakuman: true, desc: '13种幺九牌各一张+' },
  { type: 'kokushimusou', name: '国士无双十三面', han: 26, isYakuman: true, desc: '国士无双听13张' },
  { type: 'tenhou', name: '天和', han: 13, isYakuman: true, desc: '亲家配牌后直接胡' },
  { type: 'chihou', name: '地和', han: 13, isYakuman: true, desc: '子家配牌后摸牌前胡' },
  { type: 'renhou', name: '人和', han: 13, isYakuman: true, desc: '子家第1巡内胡' },
  { type: 'daisuushi', name: '大四喜', han: 13, isYakuman: true, desc: '东南西北4组刻子' },
  { type: 'shosuushi', name: '小四喜', han: 13, isYakuman: true, desc: '东南西北3组刻子+对子' },
  { type: 'daisangen', name: '大三元', han: 13, isYakuman: true, desc: '白发中3组刻子' },
  { type: 'ryuiisou', name: '绿一色', han: 13, isYakuman: true, desc: '23468索+发' },
  { type: 'chinroutou', name: '清老头', han: 13, isYakuman: true, desc: '全部幺九牌的刻子' },
  { type: 'tsuuiisou', name: '字一色', han: 13, isYakuman: true, desc: '全部字牌' },
  { type: 'suuankou', name: '四暗刻', han: 13, isYakuman: true, desc: '4组暗刻' },
  { type: 'suuankoutanki', name: '四暗刻单骑', han: 26, isYakuman: true, desc: '四暗刻听单张' },
  { type: 'suuankou', name: '四杠子', han: 13, isYakuman: true, desc: '4组杠子' },
  
  // 加权役满
  { type: 'daburReach', name: '双立直', han: 5, isYakuman: false, desc: '第1巡立直后胡' },
  { type: 'uradora', name: '里宝牌', han: 1, isYakuman: false, desc: '每张里宝牌+1番' },
  { type: 'chankan', name: '枪杠', han: 1, isYakuman: false, desc: '抢杠胡' },
  { type: 'haitei', name: '海底捞月', han: 1, isYakuman: false, desc: '最后一张摸牌胡' },
  { type: 'houtei', name: '河底捞鱼', han: 1, isYakuman: false, desc: '最后一张舍牌胡' },
  { type: 'tenpai', name: '听牌', han: 1, isYakuman: false, desc: '流局时听牌（失格）' },
];

/**
 * 计算基础分
 */
export function calculateBaseScore(config: ScoreConfig, han: number, fu: number): number {
  // 役满直接返回
  if (han >= 13) return 8000 * Math.ceil(han / 13);
  
  // 标准公式: base * 2^(番数+2) + 符数
  const multiplier = Math.pow(2, han + 2);
  const baseWithFu = config.baseScore * multiplier + fu;
  
  return Math.floor(baseWithFu);
}

/**
 * 计算最终得分（青云之志模式）
 * 公式: (基础分 × 2^番数 + 符数加成) × 护身符倍率 + 护身符加分
 */
export function calculateFinalScore(
  baseScore: number,
  han: number,
  fu: number,
  amuletState: AmuletState,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG,
  options: {
    isOya?: boolean;
    isTsumo?: boolean;
    isRiichi?: boolean;
    isIppatsu?: boolean;
    doraCount?: number;
    uradoraCount?: number;
  } = {}
): number {
  // 1. 计算基础番数
  let totalHan = han;
  
  // 2. 加上宝牌番数
  if (options.doraCount) {
    totalHan += options.doraCount;
  }
  
  // 3. 立直相关
  if (options.isRiichi) {
    totalHan += config.riichiBonus > 1 ? 1 : 0;
  }
  if (options.isIppatsu) {
    totalHan += config.ippatsuBonus > 1 ? 1 : 0;
  }
  
  // 4. 自摸加成
  let score = baseScore;
  if (options.isTsumo) {
    score = Math.floor(score * config.tsumoBonus);
  }
  
  // 5. 亲权加成
  if (options.isOya) {
    score = Math.floor(score * config.oyaBonus);
  }
  
  // 6. 连庄加成
  // (由level.ts的renchan_bonus处理)
  
  // 7. 应用番数公式
  const hanMultiplier = Math.pow(2, totalHan);
  const hanScore = Math.floor(score * hanMultiplier);
  
  // 8. 符数加成
  const fuBonus = Math.floor(fu / 10) * 10;
  
  // 9. 计算护身符加成
  const amuletMult = getAmuletScoreMultiplier(amuletState);
  const amuletAdd = getAmuletScoreAdd(amuletState);
  const amuletHan = getAmuletHanBonus(amuletState);
  
  // 10. 最终计算
  // 基础分 × 2^番数 + 符数 + 护身符加成
  const withHan = Math.floor(hanScore * amuletMult / 100);
  const withFu = withHan + fuBonus;
  const withAmuletAdd = withFu + amuletAdd;
  const withAmuletHan = withAmuletAdd + amuletHan * 100;
  
  return Math.max(0, Math.floor(withAmuletHan));
}

/**
 * 获取护身符得分倍率
 */
function getAmuletScoreMultiplier(state: AmuletState): number {
  let mult = 100;
  for (const buff of state.activeBuffs) {
    if (buff.type === 'score_mult') {
      mult += buff.value;
    }
  }
  return mult;
}

/**
 * 获取护身符得分加成
 */
function getAmuletScoreAdd(state: AmuletState): number {
  let add = 0;
  for (const buff of state.activeBuffs) {
    if (buff.type === 'score_add') {
      add += buff.value;
    }
  }
  return add;
}

/**
 * 获取护身符番数加成
 */
function getAmuletHanBonus(state: AmuletState): number {
  let han = 0;
  for (const buff of state.activeBuffs) {
    if (buff.type === 'han_bonus') {
      han += buff.value;
    }
  }
  return han;
}

/**
 * 计算每回合得分
 */
export function calculatePerRoundScore(
  floor: number,
  baseConfig: ScoreConfig,
  amuletState: AmuletState
): number {
  // 每层基础分随楼层增加
  const floorBase = 100 * Math.pow(1.2, floor - 1);
  
  // 假设平均2番2符
  const avgScore = Math.floor(floorBase * Math.pow(2, 2));
  
  // 应用护身符加成
  const mult = getAmuletScoreMultiplier(amuletState);
  const add = getAmuletScoreAdd(amuletState);
  
  return Math.max(0, Math.floor(avgScore * mult / 100) + add);
}

/**
 * 计算通关总得分
 */
export function calculateTotalScore(
  clearedFloors: Set<number>,
  levelState: { totalScore: number; difficulty: number },
  amuletState: AmuletState
): number {
  // 基础分
  let score = levelState.totalScore;
  
  // 清层奖励（全部通关）
  if (clearedFloors.size >= 25) {
    score += 10000;
  }
  
  // 难度奖励
  score = Math.floor(score * levelState.difficulty);
  
  // 护身符最终加成
  const mult = getAmuletScoreMultiplier(amuletState);
  const add = getAmuletScoreAdd(amuletState);
  
  return Math.max(0, Math.floor(score * mult / 100) + add);
}

/**
 * 计算符数
 */
export function calculateFu(
  hand: number[],          // 手牌34维度数组
  winTile: number,         // 胡牌
  isTsumo: boolean,        // 自摸
  isPinfu: boolean,         // 平和
  isRiichi: boolean,        // 立直
  ponCount: number,         // 刻子数
  kanCount: number,         // 杠子数
  headTile?: number         // 雀头（若非平和）
): number {
  let fu = 20;
  
  // 雀头
  if (headTile !== undefined && headTile >= 0) {
    // 字牌雀头 +2
    if (headTile >= 27) fu += 2;
  }
  
  // 刻子
  for (let i = 0; i < 34; i++) {
    if (hand[i] >= 3) {
      const base = i < 27 
        ? (i % 9 === 0 || i % 9 === 8 ? 8 : 4)  // 数牌幺九8符，其他4符
        : 8; // 字牌全部8符
      fu += base * (1 + kanCount); // 杠子按刻子算
    }
  }
  
  // 杠子
  fu += kanCount * 16;
  
  // 听牌形态
  if (isPinfu) {
    // 平和听牌，两边嵌张
    fu = 20;
  }
  
  // 自摸
  if (isTsumo) {
    fu += 2;
  }
  
  // 立直
  if (isRiichi) {
    fu += 10;
  }
  
  // 符数向上取整到10的倍数
  return Math.ceil(fu / 10) * 10;
}

/**
 * 得分显示格式化
 */
export function formatScore(score: number): string {
  if (score >= 10000) {
    return `${(score / 10000).toFixed(1)}万`;
  }
  return score.toLocaleString();
}

/**
 * 得分估算（用于提示）
 */
export function estimateScore(
  baseScore: number,
  minHan: number,
  maxHan: number,
  amuletState: AmuletState
): { min: number; max: number } {
  const mult = getAmuletScoreMultiplier(amuletState);
  const add = getAmuletScoreAdd(amuletState);
  const han = getAmuletHanBonus(amuletState);
  
  const min = Math.max(0, Math.floor(baseScore * Math.pow(2, minHan) * mult / 100) + add + han * 100);
  const max = Math.max(0, Math.floor(baseScore * Math.pow(2, maxHan) * mult / 100) + add + han * 100);
  
  return { min, max };
}

/**
 * 得分记录
 */
export interface ScoreRecord {
  floor: number;
  han: number;
  fu: number;
  baseScore: number;
  finalScore: number;
  yakuList: YakuType[];
  doraCount: number;
  isTsumo: boolean;
  isOya: boolean;
  timestamp: number;
}

/**
 * 记录得分
 */
export function recordScore(record: ScoreRecord): void {
  const key = 'qingyun_mahjong_score_records';
  const records: ScoreRecord[] = JSON.parse(localStorage.getItem(key) || '[]');
  records.push(record);
  // 保留最近100条
  if (records.length > 100) {
    records.splice(0, records.length - 100);
  }
  localStorage.setItem(key, JSON.stringify(records));
}

/**
 * 获取得分记录
 */
export function getScoreRecords(limit: number = 10): ScoreRecord[] {
  const key = 'qingyun_mahjong_score_records';
  const records: ScoreRecord[] = JSON.parse(localStorage.getItem(key) || '[]');
  return records.slice(-limit);
}
