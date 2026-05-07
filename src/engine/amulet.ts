/**
 * 护身符效果系统 - 青云之志模式
 * 护身符是可叠加的临时增益道具
 */

import { Amulet, AMULETS, calculateAmuletBonus } from '../data/amulets';
import type { TileId } from '../types/tile';

export interface AmuletSlot {
  amulet: Amulet;
  stackCount: number;
}

/**
 * 玩家护身符状态
 */
export interface AmuletState {
  slots: AmuletSlot[];
  activeBuffs: ActiveBuff[];
  universalTile: TileId | null;  // 当前万能牌
  universalBoost: number;        // 万能牌加成倍率
}

export interface ActiveBuff {
  type: 'score_mult' | 'score_add' | 'han_bonus' | 'dora_bonus' | 'protect';
  value: number;
  turnsRemaining: number;  // 剩余回合数，-1表示永久
  sourceAmulet: string;     // 来源护身符ID
}

/**
 * 创建初始护身符状态
 */
export function createAmuletState(): AmuletState {
  return {
    slots: [],
    activeBuffs: [],
    universalTile: null,
    universalBoost: 1,
  };
}

/**
 * 添加护身符到背包
 */
export function addAmulet(state: AmuletState, amulet: Amulet, count: number = 1): AmuletState {
  const newSlots = [...state.slots];
  
  // 检查是否已存在可叠加的同类护身符
  const existingSlot = newSlots.find(
    s => s.amulet.id === amulet.id && s.stackCount < (amulet.maxStack || 1)
  );
  
  if (existingSlot) {
    existingSlot.stackCount = Math.min(
      existingSlot.stackCount + count,
      amulet.maxStack || 1
    );
  } else if (amulet.stackable) {
    newSlots.push({ amulet, stackCount: Math.min(count, amulet.maxStack || 1) });
  }
  
  return { ...state, slots: newSlots };
}

/**
 * 移除护身符
 */
export function removeAmulet(state: AmuletState, amuletId: string, count: number = 1): AmuletState {
  const newSlots = state.slots.filter(slot => {
    if (slot.amulet.id === amuletId) {
      slot.stackCount -= count;
      return slot.stackCount > 0;
    }
    return true;
  });
  
  return { ...state, slots: newSlots };
}

/**
 * 使用护身符（激活效果）
 */
export function equipAmulet(state: AmuletState, amuletId: string): AmuletState {
  const slot = state.slots.find(s => s.amulet.id === amuletId);
  if (!slot) return state;
  
  const newBuffs: ActiveBuff[] = [];
  
  for (const effect of slot.amulet.effects) {
    const buff: ActiveBuff = {
      type: effect.type === 'score_mult' ? 'score_mult' 
          : effect.type === 'score_add' ? 'score_add'
          : effect.type === 'dora_bonus' ? 'dora_bonus'
          : effect.type === 'han_min' || effect.type === 'riichi_bonus' 
          || effect.type === 'oya_win' || effect.type === 'renchan_bonus'
          ? 'han_bonus'
          : 'protect',
      value: effect.value * slot.stackCount,
      turnsRemaining: -1, // 永久效果
      sourceAmulet: amuletId,
    };
    newBuffs.push(buff);
  }
  
  // 处理万能牌相关效果
  const universalEffect = slot.amulet.effects.find(e => e.type === 'exchange_tile');
  if (universalEffect) {
    return {
      ...state,
      universalBoost: state.universalBoost * (universalEffect.value > 1 ? 2 : 1),
    };
  }
  
  return {
    ...state,
    activeBuffs: [...state.activeBuffs, ...newBuffs],
  };
}

/**
 * 计算当前护身符总效果
 */
export function getTotalAmuletEffects(state: AmuletState): {
  scoreMult: number;
  scoreAdd: number;
  hanBonus: number;
  doraBonus: number;
  protectCount: number;
} {
  // 首先计算已装备的效果
  let scoreMult = 100;
  let scoreAdd = 0;
  let hanBonus = 0;
  let doraBonus = 0;
  let protectCount = 0;
  
  // 计算已激活buff
  for (const buff of state.activeBuffs) {
    switch (buff.type) {
      case 'score_mult':
        scoreMult += buff.value;
        break;
      case 'score_add':
        scoreAdd += buff.value;
        break;
      case 'han_bonus':
        hanBonus += buff.value;
        break;
      case 'dora_bonus':
        doraBonus += buff.value;
        break;
      case 'protect':
        protectCount += buff.value;
        break;
    }
  }
  
  // 叠加装备中的护身符加成
  const equipped = calculateAmuletBonus(state.slots.map(s => s.amulet));
  scoreMult += equipped.scoreMult - 100;
  scoreAdd += equipped.scoreAdd;
  hanBonus += equipped.hanBonus;
  doraBonus += equipped.doraBonus;
  
  // 应用万能牌加成
  if (state.universalBoost > 1) {
    scoreMult *= state.universalBoost;
  }
  
  return {
    scoreMult: Math.round(scoreMult),
    scoreAdd,
    hanBonus: Math.round(hanBonus),
    doraBonus: Math.round(doraBonus),
    protectCount,
  };
}

/**
 * 检查是否有保护效果
 */
export function hasProtect(state: AmuletState): boolean {
  return state.activeBuffs.some(b => b.type === 'protect') || 
         state.slots.some(s => s.amulet.effects.some(e => e.type === 'protect'));
}

/**
 * 触发保护效果（被攻击时）
 */
export function triggerProtect(state: AmuletState, damage: number): { state: AmuletState; actualDamage: number } {
  const effects = getTotalAmuletEffects(state);
  
  if (effects.protectCount > 0) {
    const reducedDamage = Math.max(0, damage - effects.protectCount * 10);
    return { state, actualDamage: reducedDamage };
  }
  
  return { state, actualDamage: damage };
}

/**
 * 每回合更新护身符状态
 */
export function tickAmulets(state: AmuletState): AmuletState {
  const newBuffs = state.activeBuffs
    .map(buff => ({
      ...buff,
      turnsRemaining: buff.turnsRemaining > 0 ? buff.turnsRemaining - 1 : buff.turnsRemaining,
    }))
    .filter(buff => buff.turnsRemaining !== 0);
  
  return { ...state, activeBuffs: newBuffs };
}

/**
 * 获取护身符信息摘要
 */
export function getAmuletSummary(state: AmuletState): string {
  const effects = getTotalAmuletEffects(state);
  const lines: string[] = [];
  
  if (effects.scoreMult !== 100) {
    lines.push(`得分倍率: ×${(effects.scoreMult / 100).toFixed(2)}`);
  }
  if (effects.scoreAdd > 0) {
    lines.push(`基础加分: +${effects.scoreAdd}`);
  }
  if (effects.hanBonus > 0) {
    lines.push(`番数加成: +${effects.hanBonus}`);
  }
  if (effects.doraBonus > 0) {
    lines.push(`宝牌加成: +${effects.doraBonus}`);
  }
  if (effects.protectCount > 0) {
    lines.push(`保护: ${effects.protectCount}层`);
  }
  
  if (lines.length === 0) {
    return '无激活护身符效果';
  }
  
  return lines.join(' | ');
}

/**
 * 计算最终得分
 */
export function calculateFinalScore(
  baseScore: number,
  han: number,
  fu: number,
  state: AmuletState
): number {
  const effects = getTotalAmuletEffects(state);
  
  // 标准麻将得分公式: base * 2^(han+2) + fu_bonus
  // 这里简化处理: (baseScore + scoreAdd) * scoreMult/100 * 2^han + fu_bonus + hanBonus*100
  
  const hanMultiplier = Math.pow(2, han + 2);
  const fuBonus = Math.floor(fu / 10) * 10;
  
  const rawScore = baseScore * hanMultiplier + fuBonus;
  const withMult = Math.floor(rawScore * effects.scoreMult / 100);
  const withAdd = withMult + effects.scoreAdd;
  const final = withAdd + han * 100 + effects.hanBonus * 100 + effects.doraBonus * 20;
  
  return Math.max(0, Math.floor(final));
}
