/**
 * 存档系统 - 青云之志模式
 * 本地存储存档、自动存档、手动存档
 */

import { AmuletState, createAmuletState } from './amulet';
import { ShopState, createShop } from './shop';
import { LevelState, createLevelState, serializeLevelState, deserializeLevelState } from './level';

export interface GameSaveData {
  version: string;
  timestamp: number;
  playtime: number;       // 游戏时长（秒）
  
  // 玩家基础状态
  player: {
    name: string;
    level: number;
    exp: number;
    hp: number;
    maxHp: number;
  };
  
  // Roguelike状态
  level: LevelState;
  amulet: AmuletState;
  shop: ShopState;
  
  // 货币
  starCoin: number;
  
  // 印章（已装备）
  equippedSeals: string[];
  
  // 统计数据
  stats: {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    highestFloor: number;
    highestScore: number;
    totalPlaytime: number;
  };
}

export interface SaveSlot {
  id: string;
  name: string;
  timestamp: number;
  playtime: number;
  floor: number;
  score: number;
  level: number;
  isEmpty: boolean;
}

const SAVE_VERSION = '1.0.0';
const SAVE_KEY_PREFIX = 'qingyun_mahjong_save_';
const AUTO_SAVE_KEY = 'qingyun_mahjong_autosave';
const SETTINGS_KEY = 'qingyun_mahjong_settings';
const MAX_SAVE_SLOTS = 3;

/**
 * 创建新存档数据
 */
export function createNewGameData(playerName: string = '冒险者'): GameSaveData {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    playtime: 0,
    player: {
      name: playerName,
      level: 1,
      exp: 0,
      hp: 100,
      maxHp: 100,
    },
    level: createLevelState(),
    amulet: createAmuletState(),
    shop: createShop(100), // 初始100星币
    starCoin: 100,
    equippedSeals: [],
    stats: {
      totalGames: 1,
      totalWins: 0,
      totalLosses: 0,
      highestFloor: 1,
      highestScore: 0,
      totalPlaytime: 0,
    },
  };
}

/**
 * 保存游戏到指定槽位
 */
export function saveGame(data: GameSaveData, slot: number = 0): boolean {
  try {
    const key = `${SAVE_KEY_PREFIX}${slot}`;
    const saveData: GameSaveData = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.error('Failed to save game:', e);
    return false;
  }
}

/**
 * 自动存档
 */
export function autoSave(data: GameSaveData): boolean {
  try {
    const saveData: GameSaveData = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.error('Failed to auto save:', e);
    return false;
  }
}

/**
 * 从指定槽位加载存档
 */
export function loadGame(slot: number = 0): GameSaveData | null {
  try {
    const key = `${SAVE_KEY_PREFIX}${slot}`;
    const json = localStorage.getItem(key);
    if (!json) return null;
    
    const data = JSON.parse(json) as GameSaveData;
    
    // 版本兼容检查
    if (data.version !== SAVE_VERSION) {
      // TODO: 实现版本迁移
      console.warn(`Save version mismatch: ${data.version} vs ${SAVE_VERSION}`);
    }
    
    // 恢复 Sets（反序列化时需要转换）
    if (Array.isArray(data.level.clearedFloors)) {
      data.level.clearedFloors = new Set(data.level.clearedFloors);
    }
    
    return data;
  } catch (e) {
    console.error('Failed to load game:', e);
    return null;
  }
}

/**
 * 加载自动存档
 */
export function loadAutoSave(): GameSaveData | null {
  try {
    const json = localStorage.getItem(AUTO_SAVE_KEY);
    if (!json) return null;
    
    const data = JSON.parse(json) as GameSaveData;
    
    if (Array.isArray(data.level.clearedFloors)) {
      data.level.clearedFloors = new Set(data.level.clearedFloors);
    }
    
    return data;
  } catch (e) {
    console.error('Failed to load auto save:', e);
    return null;
  }
}

/**
 * 删除存档
 */
export function deleteSave(slot: number): boolean {
  try {
    const key = `${SAVE_KEY_PREFIX}${slot}`;
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Failed to delete save:', e);
    return false;
  }
}

/**
 * 获取所有存档槽位信息
 */
export function getSaveSlots(): SaveSlot[] {
  const slots: SaveSlot[] = [];
  
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    const key = `${SAVE_KEY_PREFIX}${i}`;
    const json = localStorage.getItem(key);
    
    if (json) {
      try {
        const data = JSON.parse(json) as GameSaveData;
        slots.push({
          id: key,
          name: data.player.name,
          timestamp: data.timestamp,
          playtime: data.playtime,
          floor: data.level.currentFloor,
          score: data.level.totalScore,
          level: data.player.level,
          isEmpty: false,
        });
      } catch {
        slots.push({
          id: key,
          name: `存档 ${i + 1}`,
          timestamp: 0,
          playtime: 0,
          floor: 0,
          score: 0,
          level: 0,
          isEmpty: true,
        });
      }
    } else {
      slots.push({
        id: key,
        name: `存档 ${i + 1}`,
        timestamp: 0,
        playtime: 0,
        floor: 0,
        score: 0,
        level: 0,
        isEmpty: true,
      });
    }
  }
  
  return slots;
}

/**
 * 检查是否有自动存档
 */
export function hasAutoSave(): boolean {
  return localStorage.getItem(AUTO_SAVE_KEY) !== null;
}

/**
 * 检查存档槽位是否为空
 */
export function isSaveSlotEmpty(slot: number): boolean {
  const key = `${SAVE_KEY_PREFIX}${slot}`;
  return localStorage.getItem(key) === null;
}

/**
 * 获取存档大小
 */
export function getSaveSize(): { used: number; available: number } {
  let used = 0;
  
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    const key = `${SAVE_KEY_PREFIX}${i}`;
    const item = localStorage.getItem(key);
    if (item) {
      used += item.length;
    }
  }
  
  const autoItem = localStorage.getItem(AUTO_SAVE_KEY);
  if (autoItem) {
    used += autoItem.length;
  }
  
  // localStorage 典型限制 5MB
  const available = 5 * 1024 * 1024 - used;
  
  return { used, available };
}

/**
 * 格式化存档时间为友好显示
 */
export function formatSaveTime(timestamp: number): string {
  if (!timestamp) return '无记录';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;
  
  // 1分钟内
  if (diff < 60 * 1000) return '刚刚';
  
  // 1小时内
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / (60 * 1000));
    return `${mins}分钟前`;
  }
  
  // 24小时内
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}小时前`;
  }
  
  // 超过24小时显示日期
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化游戏时长
 */
export function formatPlaytime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}分`;
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  return `${hours}小时${remainingMins}分`;
}

/**
 * 游戏设置
 */
export interface GameSettings {
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  animationEnabled: boolean;
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // 秒
  language: string;
}

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicVolume: 70,
  sfxVolume: 80,
  animationEnabled: true,
  autoSaveEnabled: true,
  autoSaveInterval: 60,
  language: 'zh-CN',
};

/**
 * 保存设置
 */
export function saveSettings(settings: GameSettings): boolean {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return false;
  }
}

/**
 * 加载设置
 */
export function loadSettings(): GameSettings {
  try {
    const json = localStorage.getItem(SETTINGS_KEY);
    if (!json) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 重置所有数据（危险操作）
 */
export function resetAllData(): boolean {
  try {
    // 删除所有存档
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      localStorage.removeItem(`${SAVE_KEY_PREFIX}${i}`);
    }
    localStorage.removeItem(AUTO_SAVE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch (e) {
    console.error('Failed to reset all data:', e);
    return false;
  }
}

/**
 * 导出存档为JSON字符串
 */
export function exportSave(data: GameSaveData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * 从JSON字符串导入存档
 */
export function importSave(json: string): GameSaveData | null {
  try {
    const data = JSON.parse(json) as GameSaveData;
    
    // 基本的有效性检查
    if (!data.version || !data.player || !data.level) {
      return null;
    }
    
    // 恢复 Sets
    if (Array.isArray(data.level.clearedFloors)) {
      data.level.clearedFloors = new Set(data.level.clearedFloors);
    }
    
    return data;
  } catch {
    return null;
  }
}
