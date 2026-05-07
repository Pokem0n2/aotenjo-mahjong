/**
 * 印章数据 - 青云之志模式
 * 印章是一种可装备的永久强化道具
 */

export type SealType = 'attack' | 'defense' | 'special' | 'curse';
export type SealRarity = 'common' | 'rare' | 'legendary';

export interface SealEffect {
  type: 'han_add' | 'score_mult' | 'dora_add' | 'fu_add' 
      | 'riichi_protect' | 'draw_protect' | 'damage_reduce' | 'tile_exchange';
  value: number;
}

export interface Seal {
  id: string;
  name: string;
  desc: string;
  type: SealType;
  rarity: SealRarity;
  effects: SealEffect[];
  maxEquip: number;  // 最多可装备数量
  setBonus?: string; // 套装效果ID
}

export const SEAL_RARITY_CONFIG = {
  common: { color: '#8bc34a', label: '普通' },
  rare: { color: '#9c27b0', label: '稀有' },
  legendary: { color: '#ff5722', label: '传说' },
} as const;

// 印章套装
export interface SealSet {
  id: string;
  name: string;
  seals: string[];  // 所需印章ID列表
  bonus: SealEffect[];
  desc: string;
}

export const SEAL_SETS: SealSet[] = [
  {
    id: 'set_dragon',
    name: '龙之印记',
    seals: ['seal_dragon_1', 'seal_dragon_2', 'seal_dragon_3'],
    bonus: [
      { type: 'score_mult', value: 50 },
      { type: 'han_add', value: 3 },
    ],
    desc: '龙之印记套装：得分+50%，番数+3',
  },
  {
    id: 'set_phoenix',
    name: '凤凰之翼',
    seals: ['seal_phoenix_1', 'seal_phoenix_2', 'seal_phoenix_3'],
    bonus: [
      { type: 'score_mult', value: 40 },
      { type: 'dora_add', value: 2 },
    ],
    desc: '凤凰之翼套装：得分+40%，宝牌+2',
  },
  {
    id: 'set_tiger',
    name: '猛虎之牙',
    seals: ['seal_tiger_1', 'seal_tiger_2', 'seal_tiger_3'],
    bonus: [
      { type: 'han_add', value: 2 },
      { type: 'fu_add', value: 20 },
    ],
    desc: '猛虎之牙套装：番数+2，符数+20',
  },
  {
    id: 'set_turtle',
    name: '玄武之甲',
    seals: ['seal_turtle_1', 'seal_turtle_2', 'seal_turtle_3'],
    bonus: [
      { type: 'damage_reduce', value: 30 },
      { type: 'draw_protect', value: 1 },
    ],
    desc: '玄武之甲套装：受伤-30%，流局保护+1',
  },
];

// 印章数据库
export const SEALS: Seal[] = [
  // ========== 普通印章 ==========
  // 龙系印章
  {
    id: 'seal_dragon_1',
    name: '龙鳞·攻击',
    desc: '基础攻击+10%',
    type: 'attack',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'han_add', value: 1 }],
  },
  {
    id: 'seal_dragon_2',
    name: '龙鳞·强化',
    desc: '得分+15%',
    type: 'attack',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'score_mult', value: 15 }],
  },
  {
    id: 'seal_dragon_3',
    name: '龙鳞·完全',
    desc: '宝牌+1',
    type: 'attack',
    rarity: 'common',
    maxEquip: 1,
    effects: [{ type: 'dora_add', value: 1 }],
  },
  // 凤凰系印章
  {
    id: 'seal_phoenix_1',
    name: '凤羽·速度',
    desc: '番数+1',
    type: 'attack',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'han_add', value: 1 }],
  },
  {
    id: 'seal_phoenix_2',
    name: '凤羽·连击',
    desc: '得分+10%',
    type: 'attack',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'score_mult', value: 10 }],
  },
  {
    id: 'seal_phoenix_3',
    name: '凤羽·爆发',
    desc: '符数+10',
    type: 'attack',
    rarity: 'common',
    maxEquip: 1,
    effects: [{ type: 'fu_add', value: 10 }],
  },
  // 老虎系印章
  {
    id: 'seal_tiger_1',
    name: '虎爪·撕裂',
    desc: '番数+1',
    type: 'defense',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'han_add', value: 1 }],
  },
  {
    id: 'seal_tiger_2',
    name: '虎爪·坚韧',
    desc: '受伤-10%',
    type: 'defense',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'damage_reduce', value: 10 }],
  },
  {
    id: 'seal_tiger_3',
    name: '虎爪·终结',
    desc: '对BOSS伤害+20%',
    type: 'defense',
    rarity: 'common',
    maxEquip: 1,
    effects: [{ type: 'score_mult', value: 20 }],
  },
  // 玄武系印章
  {
    id: 'seal_turtle_1',
    name: '玄武·护盾',
    desc: '受伤-10%',
    type: 'defense',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'damage_reduce', value: 10 }],
  },
  {
    id: 'seal_turtle_2',
    name: '玄武·忍耐',
    desc: '流局时保护+1',
    type: 'defense',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'draw_protect', value: 1 }],
  },
  {
    id: 'seal_turtle_3',
    name: '玄武·重生',
    desc: '致命伤害减少1次',
    type: 'defense',
    rarity: 'common',
    maxEquip: 1,
    effects: [{ type: 'damage_reduce', value: 100 }],
  },
  // 通用普通印章
  {
    id: 'seal_common_001',
    name: '一击必杀',
    desc: '番数+1',
    type: 'attack',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'han_add', value: 1 }],
  },
  {
    id: 'seal_common_002',
    name: '铜墙铁壁',
    desc: '受伤-5%',
    type: 'defense',
    rarity: 'common',
    maxEquip: 3,
    effects: [{ type: 'damage_reduce', value: 5 }],
  },
  {
    id: 'seal_common_003',
    name: '宝物猎人',
    desc: '宝牌出现率+5%',
    type: 'special',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'dora_add', value: 1 }],
  },
  {
    id: 'seal_common_004',
    name: '幸运星',
    desc: '随机加成+3%',
    type: 'special',
    rarity: 'common',
    maxEquip: 3,
    effects: [{ type: 'score_mult', value: 3 }],
  },
  {
    id: 'seal_common_005',
    name: '绝境逢生',
    desc: '听牌时番数+1',
    type: 'special',
    rarity: 'common',
    maxEquip: 2,
    effects: [{ type: 'han_add', value: 1 }],
  },

  // ========== 稀有印章 ==========
  {
    id: 'seal_rare_001',
    name: '真龙之力',
    desc: '番数+2，得分+20%',
    type: 'attack',
    rarity: 'rare',
    maxEquip: 2,
    effects: [
      { type: 'han_add', value: 2 },
      { type: 'score_mult', value: 20 },
    ],
    setBonus: 'set_dragon',
  },
  {
    id: 'seal_rare_002',
    name: '真凤之舞',
    desc: '宝牌+2，符数+20',
    type: 'attack',
    rarity: 'rare',
    maxEquip: 2,
    effects: [
      { type: 'dora_add', value: 2 },
      { type: 'fu_add', value: 20 },
    ],
    setBonus: 'set_phoenix',
  },
  {
    id: 'seal_rare_003',
    name: '真虎之魂',
    desc: '番数+2，受伤-20%',
    type: 'defense',
    rarity: 'rare',
    maxEquip: 2,
    effects: [
      { type: 'han_add', value: 2 },
      { type: 'damage_reduce', value: 20 },
    ],
    setBonus: 'set_tiger',
  },
  {
    id: 'seal_rare_004',
    name: '真武之神',
    desc: '受伤-30%，流局保护+2',
    type: 'defense',
    rarity: 'rare',
    maxEquip: 2,
    effects: [
      { type: 'damage_reduce', value: 30 },
      { type: 'draw_protect', value: 2 },
    ],
    setBonus: 'set_turtle',
  },
  {
    id: 'seal_rare_005',
    name: '一掷千金',
    desc: '立直后必中，番数+3',
    type: 'special',
    rarity: 'rare',
    maxEquip: 1,
    effects: [
      { type: 'riichi_protect', value: 1 },
      { type: 'han_add', value: 3 },
    ],
  },
  {
    id: 'seal_rare_006',
    name: '命运逆转',
    desc: '点炮时触发反击，番数+2',
    type: 'curse',
    rarity: 'rare',
    maxEquip: 1,
    effects: [{ type: 'han_add', value: 2 }],
  },
  {
    id: 'seal_rare_007',
    name: '金手指',
    desc: '可指定摸牌，符数+30',
    type: 'special',
    rarity: 'rare',
    maxEquip: 1,
    effects: [
      { type: 'tile_exchange', value: 1 },
      { type: 'fu_add', value: 30 },
    ],
  },
  {
    id: 'seal_rare_008',
    name: '气场干扰',
    desc: '对手番数-1',
    type: 'curse',
    rarity: 'rare',
    maxEquip: 1,
    effects: [{ type: 'han_add', value: -1 }],
  },
  {
    id: 'seal_rare_009',
    name: '大赢家',
    desc: '获胜时额外得分×1.5',
    type: 'special',
    rarity: 'rare',
    maxEquip: 1,
    effects: [{ type: 'score_mult', value: 50 }],
  },
  {
    id: 'seal_rare_010',
    name: '永不言败',
    desc: '失败时保留50%得分',
    type: 'defense',
    rarity: 'rare',
    maxEquip: 1,
    effects: [{ type: 'damage_reduce', value: 50 }],
  },

  // ========== 传说印章 ==========
  {
    id: 'seal_legend_001',
    name: '龙帝之怒',
    desc: '攻击+100%，番数+5',
    type: 'attack',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'score_mult', value: 100 },
      { type: 'han_add', value: 5 },
    ],
    setBonus: 'set_dragon',
  },
  {
    id: 'seal_legend_002',
    name: '凤帝之翔',
    desc: '宝牌+5，得分+80%',
    type: 'attack',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'dora_add', value: 5 },
      { type: 'score_mult', value: 80 },
    ],
    setBonus: 'set_phoenix',
  },
  {
    id: 'seal_legend_003',
    name: '虎帝之啸',
    desc: '番数+5，对BOSS额外+100%',
    type: 'attack',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'han_add', value: 5 },
      { type: 'score_mult', value: 100 },
    ],
    setBonus: 'set_tiger',
  },
  {
    id: 'seal_legend_004',
    name: '武帝之御',
    desc: '受伤-80%，免疫一次致命伤害',
    type: 'defense',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'damage_reduce', value: 80 },
      { type: 'draw_protect', value: 99 },
    ],
    setBonus: 'set_turtle',
  },
  {
    id: 'seal_legend_005',
    name: '天照大神',
    desc: '所有加成翻倍，番数+10',
    type: 'special',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'score_mult', value: 100 },
      { type: 'han_add', value: 10 },
    ],
  },
  {
    id: 'seal_legend_006',
    name: '月读命',
    desc: '夜间攻击力×2，番数+6',
    type: 'special',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'score_mult', value: 100 },
      { type: 'han_add', value: 6 },
    ],
  },
  {
    id: 'seal_legend_007',
    name: '须佐之男',
    desc: '破坏力+150%，番数+8',
    type: 'attack',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'score_mult', value: 150 },
      { type: 'han_add', value: 8 },
    ],
  },
  {
    id: 'seal_legend_008',
    name: '伊邪那美',
    desc: '死亡复活一次，复活后番数+5',
    type: 'defense',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'draw_protect', value: 99 },
      { type: 'han_add', value: 5 },
    ],
  },
  {
    id: 'seal_legend_009',
    name: '八歧大蛇',
    desc: '每击败一个敌人攻击+10%（可叠加）',
    type: 'curse',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [{ type: 'han_add', value: 10 }],
  },
  {
    id: 'seal_legend_010',
    name: '草薙剑',
    desc: '对BOSS伤害+200%，番数+7',
    type: 'attack',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'score_mult', value: 200 },
      { type: 'han_add', value: 7 },
    ],
  },
  {
    id: 'seal_legend_011',
    name: '八咫镜',
    desc: '反弹所有负面效果，番数+6',
    type: 'defense',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'damage_reduce', value: 100 },
      { type: 'han_add', value: 6 },
    ],
  },
  {
    id: 'seal_legend_012',
    name: '八尺琼勾玉',
    desc: '每回合自动回复1%生命，番数+5',
    type: 'special',
    rarity: 'legendary',
    maxEquip: 1,
    effects: [
      { type: 'damage_reduce', value: 5 },
      { type: 'han_add', value: 5 },
    ],
  },
];

/**
 * 根据ID获取印章
 */
export function getSealById(id: string): Seal | undefined {
  return SEALS.find(s => s.id === id);
}

/**
 * 获取印章套装效果
 */
export function getSealSetBonus(equippedSeals: string[]): SealEffect[] {
  const effects: SealEffect[] = [];
  
  for (const set of SEAL_SETS) {
    const equippedInSet = set.seals.filter(s => equippedSeals.includes(s));
    if (equippedInSet.length === set.seals.length) {
      effects.push(...set.bonus);
    }
  }
  
  return effects;
}

/**
 * 计算已激活的套装数量
 */
export function getActivatedSets(equippedSeals: string[]): SealSet[] {
  return SEAL_SETS.filter(set => 
    set.seals.every(s => equippedSeals.includes(s))
  );
}
