/**
 * 关卡系统 - 青云之志模式
 * 爬塔进度、难度递增、楼层事件
 */

import { Enemy, getBossForFloor, getRandomNormalEnemy, getRandomEliteEnemy } from '../data/enemies';
import { GameEvent, getRandomEvent, getAvailableEvents } from '../data/events';
import { ShopItem, generateShopItems } from './shop';

export type FloorType = 'normal' | 'elite' | 'boss' | 'shop' | 'event' | 'rest';

export interface FloorConfig {
  floor: number;
  type: FloorType;
  enemy?: Enemy;
  event?: GameEvent;
  shopItems?: ShopItem[];
  difficulty: number;      // 难度倍率
  baseScore: number;       // 基础分
  enemyCount: number;      // 该层敌人数
  starCoinBonus: number;   // 星币奖励加成
  dropRateBonus: number;   // 掉落率加成
}

export interface LevelState {
  currentFloor: number;
  maxFloor: number;
  totalScore: number;
  totalStarCoin: number;
  consecutiveWins: number;   // 连胜次数
  consecutiveLosses: number; // 连败次数
  difficulty: number;        // 全局难度倍率
  unlockedFloors: number[];  // 已解锁的楼层
  clearedFloors: Set<number>; // 已通关的楼层
  currentFloorState: FloorState | null;
}

export interface FloorState {
  config: FloorConfig;
  isCleared: boolean;
  isFailed: boolean;
  turnCount: number;
  playerHp: number;
  enemiesDefeated: number;
  scoreEarned: number;
  starCoinEarned: number;
}

/**
 * 最大楼层数
 */
export const MAX_FLOORS = 25;

/**
 * 每层难度递增配置
 */
export function calculateFloorDifficulty(floor: number): number {
  // 每层难度+5%，BOSS层额外+20%
  const isBoss = getBossForFloor(floor) !== undefined;
  const baseMultiplier = 1 + (floor - 1) * 0.05;
  return isBoss ? baseMultiplier * 1.2 : baseMultiplier;
}

/**
 * 计算每层基础分
 */
export function calculateFloorBaseScore(floor: number): number {
  // 基础100分，每层+20%
  return Math.floor(100 * Math.pow(1.2, floor - 1));
}

/**
 * 生成楼层配置
 */
export function generateFloorConfig(floor: number, playerLevel: number = 1): FloorConfig {
  const boss = getBossForFloor(floor);
  const difficulty = calculateFloorDifficulty(floor);
  const baseScore = calculateFloorBaseScore(floor);
  
  let type: FloorType = 'normal';
  let enemy: Enemy | undefined;
  
  if (boss) {
    type = 'boss';
    enemy = boss;
  } else if (floor % 5 === 0) {
    // 每5层有精英敌人
    type = 'elite';
    enemy = getRandomEliteEnemy(floor);
  } else if (floor % 3 === 0) {
    // 每3层有商店
    type = 'shop';
  } else if (floor % 7 === 0) {
    // 每7层有事件
    type = 'event';
  } else {
    // 普通层
    type = 'normal';
    enemy = getRandomNormalEnemy(floor);
  }
  
  const enemyCount = type === 'boss' ? 1 
    : type === 'elite' ? 1 + Math.floor(floor / 10)
    : 1 + Math.floor(floor / 5);
  
  const config: FloorConfig = {
    floor,
    type,
    enemy,
    difficulty,
    baseScore,
    enemyCount,
    starCoinBonus: 1 + (floor - 1) * 0.1,
    dropRateBonus: 1 + (floor - 1) * 0.05,
  };
  
  if (type === 'shop') {
    config.shopItems = generateShopItems(floor);
  }
  
  if (type === 'event') {
    config.event = getRandomEvent(floor);
  }
  
  return config;
}

/**
 * 创建初始关卡状态
 */
export function createLevelState(): LevelState {
  return {
    currentFloor: 1,
    maxFloor: MAX_FLOORS,
    totalScore: 0,
    totalStarCoin: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    difficulty: 1.0,
    unlockedFloors: [1],
    clearedFloors: new Set(),
    currentFloorState: null,
  };
}

/**
 * 进入下一层
 */
export function enterNextFloor(state: LevelState): LevelState {
  const nextFloor = state.currentFloor + 1;
  
  if (nextFloor > MAX_FLOORS) {
    return state; // 已通关
  }
  
  const config = generateFloorConfig(nextFloor);
  const floorState: FloorState = {
    config,
    isCleared: false,
    isFailed: false,
    turnCount: 0,
    playerHp: 100,
    enemiesDefeated: 0,
    scoreEarned: 0,
    starCoinEarned: 0,
  };
  
  return {
    ...state,
    currentFloor: nextFloor,
    currentFloorState: floorState,
    unlockedFloors: state.unlockedFloors.includes(nextFloor) 
      ? state.unlockedFloors 
      : [...state.unlockedFloors, nextFloor],
  };
}

/**
 * 进入指定楼层
 */
export function enterFloor(state: LevelState, floor: number): LevelState {
  if (!state.unlockedFloors.includes(floor)) {
    return state; // 未解锁
  }
  
  const config = generateFloorConfig(floor);
  const floorState: FloorState = {
    config,
    isCleared: false,
    isFailed: false,
    turnCount: 0,
    playerHp: 100,
    enemiesDefeated: 0,
    scoreEarned: 0,
    starCoinEarned: 0,
  };
  
  return {
    ...state,
    currentFloor: floor,
    currentFloorState: floorState,
  };
}

/**
 * 通关当前楼层
 */
export function clearFloor(state: LevelState): LevelState {
  if (!state.currentFloorState) return state;
  
  const floorState = state.currentFloorState;
  const config = floorState.config;
  
  // 计算奖励
  const scoreMultiplier = floorState.isCleared 
    ? 1.0 
    : 0.5; // 失败只给50%分
  
  const floorScore = Math.floor(config.baseScore * scoreMultiplier);
  const starCoinGain = Math.floor(
    (floorState.enemiesDefeated * 10 + config.baseScore / 10) 
    * config.starCoinBonus
  );
  
  // 更新连胜/连败
  const newConsecutiveWins = state.consecutiveWins + 1;
  const newConsecutiveLosses = 0;
  
  // 通关加成（连胜奖励）
  const winBonus = newConsecutiveWins > 1 ? 1 + newConsecutiveWins * 0.1 : 1.0;
  
  const newFloorState: FloorState = {
    ...floorState,
    isCleared: true,
    scoreEarned: Math.floor(floorScore * winBonus),
    starCoinEarned: starCoinGain,
  };
  
  return {
    ...state,
    currentFloorState: newFloorState,
    totalScore: state.totalScore + newFloorState.scoreEarned,
    totalStarCoin: state.totalStarCoin + newFloorState.starCoinEarned,
    consecutiveWins: newConsecutiveWins,
    consecutiveLosses: newConsecutiveLosses,
    difficulty: calculateFloorDifficulty(state.currentFloor),
    clearedFloors: new Set([...state.clearedFloors, state.currentFloor]),
  };
}

/**
 * 挑战当前楼层失败
 */
export function failFloor(state: LevelState): LevelState {
  if (!state.currentFloorState) return state;
  
  const floorState = state.currentFloorState;
  
  // 失败惩罚：失去一些星币
  const starCoinLoss = Math.floor(state.totalStarCoin * 0.1);
  
  const newFloorState: FloorState = {
    ...floorState,
    isFailed: true,
    scoreEarned: Math.floor(floorState.config.baseScore * 0.2),
    starCoinEarned: -starCoinLoss,
  };
  
  return {
    ...state,
    currentFloorState: newFloorState,
    totalScore: state.totalScore + newFloorState.scoreEarned,
    totalStarCoin: Math.max(0, state.totalStarCoin - starCoinLoss),
    consecutiveWins: 0,
    consecutiveLosses: state.consecutiveLosses + 1,
  };
}

/**
 * 获取楼层描述
 */
export function getFloorDescription(floor: number): string {
  if (floor > MAX_FLOORS) return '塔顶 - 通关！';
  
  const boss = getBossForFloor(floor);
  if (boss) return `第${floor}层 - BOSS: ${boss.name}`;
  
  if (floor % 5 === 0) return `第${floor}层 - 精英关卡`;
  if (floor % 3 === 0) return `第${floor}层 - 商店`;
  if (floor % 7 === 0) return `第${floor}层 - 事件`;
  
  return `第${floor}层 - 普通关卡`;
}

/**
 * 获取楼层进度
 */
export function getFloorProgress(state: LevelState): {
  current: number;
  total: number;
  percentage: number;
  cleared: number;
} {
  const cleared = state.clearedFloors.size;
  return {
    current: state.currentFloor,
    total: MAX_FLOORS,
    percentage: Math.floor((cleared / MAX_FLOORS) * 100),
    cleared,
  };
}

/**
 * 序列化关卡状态（用于存档）
 */
export function serializeLevelState(state: LevelState): string {
  return JSON.stringify({
    ...state,
    clearedFloors: Array.from(state.clearedFloors),
  });
}

/**
 * 反序列化关卡状态（用于读档）
 */
export function deserializeLevelState(json: string): LevelState {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    clearedFloors: new Set(parsed.clearedFloors),
  };
}

/**
 * 获取下一BOSS层
 */
export function getNextBossFloor(currentFloor: number): number {
  for (let f = currentFloor + 1; f <= MAX_FLOORS; f++) {
    if (getBossForFloor(f)) return f;
  }
  return MAX_FLOORS;
}

/**
 * 计算通关总评价
 */
export function calculateFinalGrade(state: LevelState): {
  grade: string;
  stars: number;
  desc: string;
} {
  const progress = getFloorProgress(state);
  const clearedFloors = state.clearedFloors.size;
  const totalScore = state.totalScore;
  
  let stars = 0;
  let grade = 'F';
  let desc = '未完成第一层';
  
  if (clearedFloors >= 25) {
    stars = 5;
    grade = 'S+';
    desc = '完美通关！传说级玩家！';
  } else if (clearedFloors >= 20) {
    stars = 5;
    grade = 'S';
    desc = '优秀通关！大师级玩家！';
  } else if (clearedFloors >= 15) {
    stars = 4;
    grade = 'A';
    desc = '顺利通关！高手级玩家！';
  } else if (clearedFloors >= 10) {
    stars = 3;
    grade = 'B';
    desc = '普通通关，新晋高手！';
  } else if (clearedFloors >= 5) {
    stars = 2;
    grade = 'C';
    desc = '初窥门径，继续努力！';
  } else if (clearedFloors >= 1) {
    stars = 1;
    grade = 'D';
    desc = '刚刚开始，潜力无限！';
  }
  
  return { grade, stars, desc };
}
