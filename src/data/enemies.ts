/**
 * 敌人数据 - 青云之志模式
 * 每层塔的BOSS和各种怪物
 */

export type EnemyType = 'normal' | 'elite' | 'boss' | 'miniboss';
export type EnemyRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface EnemyAbility {
  name: string;
  desc: string;
  effect: 'hp_drain' | 'score_reduce' | 'tile_curse' | 'steal_coin' | 'call_wind';
}

export interface Enemy {
  id: string;
  name: string;
  desc: string;
  type: EnemyType;
  rarity: EnemyRarity;
  hp: number;           // 生命值 (%)
  attack: number;        // 攻击力 (伤害百分比)
  defense: number;       // 防御力 (减伤百分比)
  reward: {
    starCoin: number;    // 基础星币奖励
    amulet?: number;     // 护身符掉落率 (0-100)
    scoreMult?: number;  // 击败后得分倍率
  };
  abilities: EnemyAbility[];
  appearFloor: number;    // 出现楼层
  bossFloor?: number;    // 如果是BOSS，出现楼层
}

export const ENEMY_RARITY_CONFIG = {
  common: { color: '#78909c', label: '普通', amuletDrop: 5 },
  rare: { color: '#7b1fa2', label: '稀有', amuletDrop: 15 },
  epic: { color: '#f57c00', label: '史诗', amuletDrop: 30 },
  legendary: { color: '#d32f2f', label: '传说', amuletDrop: 50 },
} as const;

// 敌人数据库
export const ENEMIES: Enemy[] = [
  // ========== 普通层敌人 ==========
  {
    id: 'enemy_common_001',
    name: '小恶犬',
    desc: '塔底层的小怪物，没什么威胁',
    type: 'normal',
    rarity: 'common',
    hp: 10,
    attack: 5,
    defense: 0,
    reward: { starCoin: 10, amulet: 5 },
    abilities: [],
    appearFloor: 1,
  },
  {
    id: 'enemy_common_002',
    name: '捣蛋小鬼',
    desc: '喜欢恶作剧的淘气小鬼',
    type: 'normal',
    rarity: 'common',
    hp: 12,
    attack: 8,
    defense: 0,
    reward: { starCoin: 12, amulet: 8 },
    abilities: [
      { name: '恶作剧', desc: '随机使你的手牌顺序打乱', effect: 'tile_curse' },
    ],
    appearFloor: 1,
  },
  {
    id: 'enemy_common_003',
    name: '懒惰的仆人',
    desc: '被恶魔控制的仆人',
    type: 'normal',
    rarity: 'common',
    hp: 15,
    attack: 6,
    defense: 5,
    reward: { starCoin: 15, amulet: 10 },
    abilities: [],
    appearFloor: 2,
  },
  {
    id: 'enemy_common_004',
    name: '毒蛇守卫',
    desc: '盘踞在塔中的毒蛇',
    type: 'normal',
    rarity: 'common',
    hp: 12,
    attack: 10,
    defense: 0,
    reward: { starCoin: 14, amulet: 8 },
    abilities: [
      { name: '毒液', desc: '攻击附带中毒效果', effect: 'hp_drain' },
    ],
    appearFloor: 2,
  },
  {
    id: 'enemy_common_005',
    name: '蝙蝠群',
    desc: '成群结队的吸血蝙蝠',
    type: 'normal',
    rarity: 'common',
    hp: 18,
    attack: 7,
    defense: 3,
    reward: { starCoin: 16, amulet: 12 },
    abilities: [
      { name: '吸血', desc: '造成伤害时回复生命', effect: 'hp_drain' },
    ],
    appearFloor: 3,
  },
  {
    id: 'enemy_common_006',
    name: '骷髅士兵',
    desc: '被复活的骷髅战士',
    type: 'normal',
    rarity: 'common',
    hp: 20,
    attack: 9,
    defense: 5,
    reward: { starCoin: 18, amulet: 10 },
    abilities: [],
    appearFloor: 3,
  },
  {
    id: 'enemy_common_007',
    name: '石像鬼',
    desc: '守护塔层的石雕怪物',
    type: 'normal',
    rarity: 'common',
    hp: 25,
    attack: 8,
    defense: 10,
    reward: { starCoin: 20, amulet: 12 },
    abilities: [
      { name: '石化凝视', desc: '有几率使你无法出牌', effect: 'tile_curse' },
    ],
    appearFloor: 4,
  },
  {
    id: 'enemy_common_008',
    name: '幽灵侍女',
    desc: '怨念化成的幽灵',
    type: 'normal',
    rarity: 'common',
    hp: 15,
    attack: 12,
    defense: 0,
    reward: { starCoin: 22, amulet: 15 },
    abilities: [
      { name: '穿墙', desc: '无视防御力', effect: 'score_reduce' },
    ],
    appearFloor: 4,
  },
  {
    id: 'enemy_common_009',
    name: '地狱猎犬',
    desc: '来自深渊的猎犬',
    type: 'normal',
    rarity: 'common',
    hp: 22,
    attack: 14,
    defense: 5,
    reward: { starCoin: 25, amulet: 15 },
    abilities: [
      { name: '撕咬', desc: '造成双倍伤害', effect: 'hp_drain' },
    ],
    appearFloor: 5,
  },
  {
    id: 'enemy_common_010',
    name: '堕落僧侣',
    desc: '被黑暗腐蚀的僧侣',
    type: 'normal',
    rarity: 'common',
    hp: 20,
    attack: 10,
    defense: 8,
    reward: { starCoin: 24, amulet: 18 },
    abilities: [
      { name: '诅咒', desc: '降低你的得分', effect: 'score_reduce' },
    ],
    appearFloor: 5,
  },

  // ========== 精英敌人 ==========
  {
    id: 'enemy_elite_001',
    name: '魔犬首领',
    desc: '恶犬群的首领，体型巨大',
    type: 'elite',
    rarity: 'rare',
    hp: 50,
    attack: 20,
    defense: 10,
    reward: { starCoin: 60, amulet: 25, scoreMult: 1.5 },
    abilities: [
      { name: '嚎叫', desc: '提升周围敌人攻击力', effect: 'call_wind' },
    ],
    appearFloor: 3,
  },
  {
    id: 'enemy_elite_002',
    name: '吸血鬼伯爵',
    desc: '古老的吸血鬼贵族',
    type: 'elite',
    rarity: 'rare',
    hp: 45,
    attack: 25,
    defense: 5,
    reward: { starCoin: 70, amulet: 30, scoreMult: 1.5 },
    abilities: [
      { name: '鲜血汲取', desc: '攻击吸取生命', effect: 'hp_drain' },
      { name: '魅惑', desc: '有几率偷走你的星币', effect: 'steal_coin' },
    ],
    appearFloor: 5,
  },
  {
    id: 'enemy_elite_003',
    name: '死亡骑士',
    desc: '身披黑甲的死神骑士',
    type: 'elite',
    rarity: 'rare',
    hp: 60,
    attack: 22,
    defense: 20,
    reward: { starCoin: 80, amulet: 35, scoreMult: 1.8 },
    abilities: [
      { name: '黑暗斩', desc: '造成大量伤害', effect: 'hp_drain' },
    ],
    appearFloor: 7,
  },
  {
    id: 'enemy_elite_004',
    name: '暗影法师',
    desc: '操控暗影魔法的法师',
    type: 'elite',
    rarity: 'rare',
    hp: 40,
    attack: 28,
    defense: 5,
    reward: { starCoin: 75, amulet: 40, scoreMult: 1.6 },
    abilities: [
      { name: '暗影箭', desc: '无视防御', effect: 'score_reduce' },
      { name: '混乱诅咒', desc: '使你的牌序混乱', effect: 'tile_curse' },
    ],
    appearFloor: 8,
  },
  {
    id: 'enemy_elite_005',
    name: '冥府守门人',
    desc: '冥界入口的守护者',
    type: 'elite',
    rarity: 'rare',
    hp: 70,
    attack: 25,
    defense: 25,
    reward: { starCoin: 90, amulet: 45, scoreMult: 2.0 },
    abilities: [
      { name: '冥火', desc: '持续灼烧伤害', effect: 'hp_drain' },
    ],
    appearFloor: 9,
  },

  // ========== 小BOSS ==========
  {
    id: 'enemy_miniboss_001',
    name: '赤炼火龙',
    desc: '守护第五层的火焰巨龙',
    type: 'miniboss',
    rarity: 'epic',
    hp: 100,
    attack: 30,
    defense: 15,
    reward: { starCoin: 150, amulet: 60, scoreMult: 2.5 },
    abilities: [
      { name: '龙息', desc: '大范围火焰攻击', effect: 'hp_drain' },
      { name: '火焰护盾', desc: '受到伤害减少', effect: 'tile_curse' },
    ],
    appearFloor: 5,
    bossFloor: 5,
  },
  {
    id: 'enemy_miniboss_002',
    name: '雷霆巨兽',
    desc: '操控雷电的远古巨兽',
    type: 'miniboss',
    rarity: 'epic',
    hp: 120,
    attack: 35,
    defense: 20,
    reward: { starCoin: 180, amulet: 65, scoreMult: 2.8 },
    abilities: [
      { name: '雷击', desc: '造成麻痹，下回合无法出牌', effect: 'tile_curse' },
      { name: '电能爆发', desc: '高额伤害', effect: 'hp_drain' },
    ],
    appearFloor: 8,
    bossFloor: 8,
  },
  {
    id: 'enemy_miniboss_003',
    name: '冰霜巨龙',
    desc: '冻结一切的冰龙',
    type: 'miniboss',
    rarity: 'epic',
    hp: 130,
    attack: 32,
    defense: 25,
    reward: { starCoin: 200, amulet: 70, scoreMult: 3.0 },
    abilities: [
      { name: '冰封吐息', desc: '冻结并造成伤害', effect: 'hp_drain' },
      { name: '寒冰护甲', desc: '减少受到伤害', effect: 'score_reduce' },
    ],
    appearFloor: 10,
    bossFloor: 10,
  },

  // ========== 最终BOSS ==========
  {
    id: 'enemy_boss_001',
    name: '暗黑魔龙',
    desc: '统治塔顶的终极BOSS，传说中最强大的恶龙',
    type: 'boss',
    rarity: 'legendary',
    hp: 200,
    attack: 50,
    defense: 30,
    reward: { starCoin: 500, amulet: 100, scoreMult: 5.0 },
    abilities: [
      { name: '暗龙吐息', desc: '毁灭性的黑暗火焰', effect: 'hp_drain' },
      { name: '龙威', desc: '降低你所有属性20%', effect: 'score_reduce' },
      { name: '掠魂', desc: '击败玩家时偷走一半星币', effect: 'steal_coin' },
    ],
    appearFloor: 15,
    bossFloor: 15,
  },
  {
    id: 'enemy_boss_002',
    name: '红莲主龙',
    desc: '浴火重生的终极火龙',
    type: 'boss',
    rarity: 'legendary',
    hp: 250,
    attack: 55,
    defense: 35,
    reward: { starCoin: 600, amulet: 100, scoreMult: 6.0 },
    abilities: [
      { name: '红莲业火', desc: '全屏火焰攻击', effect: 'hp_drain' },
      { name: '再生', desc: '每回合回复5%生命', effect: 'hp_drain' },
      { name: '灵魂抽取', desc: '击败玩家时偷走护身符', effect: 'steal_coin' },
    ],
    appearFloor: 20,
    bossFloor: 20,
  },
  {
    id: 'enemy_boss_003',
    name: '虚空巨龙',
    desc: '来自虚空维度的终极存在',
    type: 'boss',
    rarity: 'legendary',
    hp: 300,
    attack: 60,
    defense: 40,
    reward: { starCoin: 800, amulet: 100, scoreMult: 8.0 },
    abilities: [
      { name: '虚空冲击', desc: '无视任何防御', effect: 'hp_drain' },
      { name: '时间扭曲', desc: '让你的牌过期失效', effect: 'tile_curse' },
      { name: '万物归虚', desc: '大幅降低所有属性', effect: 'score_reduce' },
    ],
    appearFloor: 25,
    bossFloor: 25,
  },
];

/**
 * 根据楼层获取该层的敌人
 */
export function getEnemiesForFloor(floor: number): Enemy[] {
  return ENEMIES.filter(e => e.appearFloor === floor);
}

/**
 * 获取楼层的BOSS（如果有）
 */
export function getBossForFloor(floor: number): Enemy | undefined {
  return ENEMIES.find(e => e.bossFloor === floor);
}

/**
 * 获取随机普通敌人
 */
export function getRandomNormalEnemy(floor: number): Enemy | undefined {
  const normalEnemies = ENEMIES.filter(
    e => e.type === 'normal' && e.appearFloor <= floor
  );
  if (normalEnemies.length === 0) return undefined;
  return normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
}

/**
 * 获取随机精英敌人
 */
export function getRandomEliteEnemy(floor: number): Enemy | undefined {
  const eliteEnemies = ENEMIES.filter(
    e => e.type === 'elite' && e.appearFloor <= floor
  );
  if (eliteEnemies.length === 0) return undefined;
  return eliteEnemies[Math.floor(Math.random() * eliteEnemies.length)];
}

/**
 * 敌人战斗计算
 */
export interface BattleResult {
  playerDamage: number;    // 玩家受到的伤害
  enemyDamage: number;      // 敌人受到的伤害
  playerHpLost: number;     // 玩家损失生命
  enemyHpLost: number;      // 敌人损失生命
  amuletDrop: boolean;      // 是否掉落护身符
  starCoinGain: number;     // 获得星币
  scoreMultiplier: number;  // 得分倍率
}

export function calculateBattle(
  playerAttack: number,
  playerDefense: number,
  enemy: Enemy
): BattleResult {
  // 玩家对敌人造成的伤害 (考虑敌人防御)
  const effectiveEnemyDefense = enemy.defense;
  const baseEnemyHpLost = Math.max(1, playerAttack - effectiveEnemyDefense / 2);
  const enemyHpLost = Math.min(baseEnemyHpLost, enemy.hp);
  
  // 敌人对玩家造成的伤害 (考虑玩家防御)
  const effectivePlayerDefense = playerDefense;
  const basePlayerDamage = enemy.attack;
  const playerDamage = Math.max(5, basePlayerDamage - effectivePlayerDefense / 2);
  const playerHpLost = Math.min(playerDamage, 100); // 玩家生命上限100%
  
  // 奖励计算
  const amuletDrop = Math.random() * 100 < enemy.reward.amulet!;
  
  return {
    playerDamage,
    enemyDamage: enemyHpLost,
    playerHpLost,
    enemyHpLost,
    amuletDrop,
    starCoinGain: enemy.reward.starCoin,
    scoreMultiplier: enemy.reward.scoreMult || 1.0,
  };
}

/**
 * 计算玩家战斗力
 */
export interface PlayerStats {
  attack: number;
  defense: number;
  maxHp: number;
  currentHp: number;
  starCoin: number;
  amuletCount: number;
  scoreBoost: number;
}

export function calculatePlayerStats(
  baseAttack: number,
  baseDefense: number,
  level: number,
  amuletBonus: { attack: number; defense: number }
): PlayerStats {
  return {
    attack: baseAttack + level * 2 + amuletBonus.attack,
    defense: baseDefense + level * 1 + amuletBonus.defense,
    maxHp: 100,
    currentHp: 100,
    starCoin: 0,
    amuletCount: 0,
    scoreBoost: 0,
  };
}
