/**
 * 商店系统 - 青云之志模式
 * 使用星币购买护身符、印章和恢复道具
 */

import { Amulet, AMULETS, getRandomAmulet } from '../data/amulets';
import { Seal, SEALS, getSealById } from '../data/seals';
import { Enemy, getBossForFloor } from '../data/enemies';

export type ShopItemType = 'amulet' | 'seal' | 'heal' | 'refresh';

export interface ShopItem {
  id: string;
  type: ShopItemType;
  name: string;
  desc: string;
  cost: number;
  rarity?: 'N' | 'R' | 'L';
  data?: Amulet | Seal | null;
  healing?: number;  // 治疗量百分比
}

export interface ShopState {
  starCoin: number;
  items: ShopItem[];
  refreshCost: number;
  maxRefreshes: number;
  currentRefreshes: number;
}

export interface ShopConfig {
  baseRefreshCost: number;
  maxItemsPerShop: number;
  amuletPriceMultiplier: number;
  sealPriceMultiplier: number;
  bossShopMultiplier: number;  // BOSS层商店价格倍率
}

/**
 * 默认商店配置
 */
export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  baseRefreshCost: 20,
  maxItemsPerShop: 6,
  amuletPriceMultiplier: 1.0,
  sealPriceMultiplier: 1.5,
  bossShopMultiplier: 2.0,
};

/**
 * 创建商店状态
 */
export function createShop(starCoin: number): ShopState {
  return {
    starCoin,
    items: [],
    refreshCost: DEFAULT_SHOP_CONFIG.baseRefreshCost,
    maxRefreshes: 3,
    currentRefreshes: 0,
  };
}

/**
 * 生成商店商品
 */
export function generateShopItems(floor: number, config: ShopConfig = DEFAULT_SHOP_CONFIG): ShopItem[] {
  const items: ShopItem[] = [];
  const isBossFloor = getBossForFloor(floor) !== undefined;
  const priceMult = isBossFloor ? config.bossShopMultiplier : 1.0;
  
  // 1. 添加护身符 (2-3个)
  const amuletCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < amuletCount; i++) {
    const { amulet, rarity } = getRandomAmulet();
    const shopItem: ShopItem = {
      id: `shop_amulet_${Date.now()}_${i}`,
      type: 'amulet',
      name: amulet.name,
      desc: amulet.desc,
      cost: Math.floor(amulet.cost * config.amuletPriceMultiplier * priceMult),
      rarity,
      data: amulet,
    };
    items.push(shopItem);
  }
  
  // 2. 添加印章 (1-2个)
  const sealCount = 1 + Math.floor(Math.random() * 2);
  const availableSeals = SEALS.filter(s => {
    if (isBossFloor) return true;
    return s.rarity !== 'legendary';
  });
  
  for (let i = 0; i < sealCount && availableSeals.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableSeals.length);
    const seal = availableSeals.splice(idx, 1)[0];
    const shopItem: ShopItem = {
      id: `shop_seal_${Date.now()}_${i}`,
      type: 'seal',
      name: seal.name,
      desc: seal.desc,
      cost: Math.floor(seal.rarity === 'legendary' ? 800 
                   : seal.rarity === 'rare' ? 400 
                   : 150 * config.sealPriceMultiplier * priceMult),
      data: seal,
    };
    items.push(shopItem);
  }
  
  // 3. 添加治疗药水
  const healItem: ShopItem = {
    id: `shop_heal_${Date.now()}`,
    type: 'heal',
    name: '生命药水',
    desc: '恢复30%生命值',
    cost: Math.floor(50 * priceMult),
    healing: 30,
  };
  items.push(healItem);
  
  // 4. 大恢复药水（较少见）
  if (Math.random() > 0.5) {
    const bigHealItem: ShopItem = {
      id: `shop_bigheal_${Date.now()}`,
      type: 'heal',
      name: '高级生命药水',
      desc: '恢复50%生命值',
      cost: Math.floor(80 * priceMult),
      healing: 50,
    };
    items.push(bigHealItem);
  }
  
  // 5. 满血药水（BOSS层特有）
  if (isBossFloor) {
    const fullHealItem: ShopItem = {
      id: `shop_fullheal_${Date.now()}`,
      type: 'heal',
      name: '神圣生命药水',
      desc: '完全恢复生命值',
      cost: Math.floor(150 * priceMult),
      healing: 100,
    };
    items.push(fullHealItem);
  }
  
  // 打乱顺序
  return shuffleArray(items);
}

/**
 * 刷新商店
 */
export function refreshShop(state: ShopState, floor: number): ShopState {
  if (state.currentRefreshes >= state.maxRefreshes) {
    return state; // 无法刷新
  }
  
  const newState: ShopState = {
    ...state,
    items: generateShopItems(floor),
    refreshCost: Math.floor(state.refreshCost * 1.5),
    currentRefreshes: state.currentRefreshes + 1,
  };
  
  return newState;
}

/**
 * 购买物品
 */
export function purchaseItem(
  state: ShopState,
  itemId: string
): { state: ShopState; purchased: ShopItem | null; error?: string } {
  const itemIndex = state.items.findIndex(i => i.id === itemId);
  
  if (itemIndex === -1) {
    return { state, purchased: null, error: '商品不存在' };
  }
  
  const item = state.items[itemIndex];
  
  if (state.starCoin < item.cost) {
    return { state, purchased: null, error: '星币不足' };
  }
  
  // 扣除星币
  const newState: ShopState = {
    ...state,
    starCoin: state.starCoin - item.cost,
    items: state.items.filter(i => i.id !== itemId),
  };
  
  return { state: newState, purchased: item };
}

/**
 * 购买护身符（从背包添加）
 */
export function buyAmulet(
  state: ShopState,
  itemId: string,
  inventory: { amulets: Amulet[] }
): { 
  state: ShopState; 
  success: boolean; 
  amulet?: Amulet; 
  error?: string 
} {
  const result = purchaseItem(state, itemId);
  
  if (!result.purchased) {
    return { state, success: false, error: result.error };
  }
  
  if (result.purchased.type !== 'amulet') {
    return { state, success: false, error: '该物品不是护身符' };
  }
  
  return {
    state: result.state,
    success: true,
    amulet: result.purchased.data as Amulet,
  };
}

/**
 * 购买印章（装备）
 */
export function buySeal(
  state: ShopState,
  itemId: string
): { 
  state: ShopState; 
  success: boolean; 
  seal?: Seal; 
  error?: string 
} {
  const result = purchaseItem(state, itemId);
  
  if (!result.purchased) {
    return { state, success: false, error: result.error };
  }
  
  if (result.purchased.type !== 'seal') {
    return { state, success: false, error: '该物品不是印章' };
  }
  
  return {
    state: result.state,
    success: true,
    seal: result.purchased.data as Seal,
  };
}

/**
 * 购买治疗
 */
export function buyHeal(
  state: ShopState,
  itemId: string,
  currentHp: number,
  maxHp: number = 100
): { 
  state: ShopState; 
  success: boolean; 
  newHp?: number; 
  error?: string 
} {
  const result = purchaseItem(state, itemId);
  
  if (!result.purchased) {
    return { state, success: false, error: result.error };
  }
  
  if (result.purchased.type !== 'heal' || !result.purchased.healing) {
    return { state, success: false, error: '该物品不是治疗道具' };
  }
  
  const newHp = Math.min(maxHp, currentHp + result.purchased.healing);
  
  return {
    state: result.state,
    success: true,
    newHp,
  };
}

/**
 * 计算商店总价值
 */
export function getShopValue(items: ShopItem[]): number {
  return items.reduce((sum, item) => sum + item.cost, 0);
}

/**
 * 获取商店物品分类
 */
export function categorizeShopItems(items: ShopItem[]): {
  amulets: ShopItem[];
  seals: ShopItem[];
  heals: ShopItem[];
} {
  return {
    amulets: items.filter(i => i.type === 'amulet'),
    seals: items.filter(i => i.type === 'seal'),
    heals: items.filter(i => i.type === 'heal'),
  };
}

/**
 * 辅助函数：打乱数组
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 序列化商店状态（用于存档）
 */
export function serializeShopState(state: ShopState): string {
  return JSON.stringify(state);
}

/**
 * 反序列化商店状态（用于读档）
 */
export function deserializeShopState(json: string): ShopState {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    items: parsed.items.map((item: ShopItem) => ({
      ...item,
      data: item.type === 'amulet' 
        ? AMULETS.find(a => a.id === item.data?.id) || item.data
        : item.type === 'seal'
        ? getSealById(item.data?.id || '') || item.data
        : null,
    })),
  };
}
