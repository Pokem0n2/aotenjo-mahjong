/**
 * 护身符数据 - 青云之志模式
 * 分普通(N)、稀有(R)、传说(L)三个品质
 */

export type AmuletRarity = 'N' | 'R' | 'L';

export interface AmuletEffect {
  type: 'score_mult' | 'score_add' | 'han_min' | 'fu_bonus' | 'riichi_bonus' 
      | 'oya_win' | 'draw_bonus' | 'tsumo_bonus' | 'renchan_bonus' | 'dora_bonus'
      | 'start_hand' | 'exchange_tile' | 'see_hand' | 'protect';
  value: number;
  desc: string;
}

export interface Amulet {
  id: string;
  name: string;
  desc: string;
  rarity: AmuletRarity;
  cost: number;       // 星币价格
  effects: AmuletEffect[];
  stackable: boolean;
  maxStack?: number;  // 可叠加数量
  icon?: string;      // 图标标识
}

export const AMULET_RARITY_CONFIG = {
  N: { color: '#9e9e9e', dropRate: 0.70, label: '普通' },
  R: { color: '#2196f3', dropRate: 0.25, label: '稀有' },
  L: { color: '#ff9800', dropRate: 0.05, label: '传说' },
} as const;

// 护身符图鉴
export const AMULETS: Amulet[] = [
  // ========== 普通品质 (N) ==========
  {
    id: 'amulet_n_001',
    name: '小福运',
    desc: '基础得分+50',
    rarity: 'N',
    cost: 100,
    stackable: true,
    maxStack: 5,
    effects: [{ type: 'score_add', value: 50, desc: '基础得分+50' }],
  },
  {
    id: 'amulet_n_002',
    name: '平和之印',
    desc: '平和番数+1',
    rarity: 'N',
    cost: 120,
    stackable: true,
    maxStack: 3,
    effects: [{ type: 'han_min', value: 1, desc: '平和番数+1' }],
  },
  {
    id: 'amulet_n_003',
    name: '断幺护符',
    desc: '断幺九番数+1',
    rarity: 'N',
    cost: 120,
    stackable: true,
    maxStack: 3,
    effects: [{ type: 'han_min', value: 1, desc: '断幺九番数+1' }],
  },
  {
    id: 'amulet_n_004',
    name: '一星珠',
    desc: '番数计算×1.1',
    rarity: 'N',
    cost: 150,
    stackable: true,
    maxStack: 10,
    effects: [{ type: 'score_mult', value: 110, desc: '番数×1.1' }],
  },
  {
    id: 'amulet_n_005',
    name: '幺九残片',
    desc: '幺九牌攻击力+5%',
    rarity: 'N',
    cost: 80,
    stackable: true,
    maxStack: 10,
    effects: [{ type: 'score_add', value: 5, desc: '幺九牌加成+5%' }],
  },
  {
    id: 'amulet_n_006',
    name: '门清护符',
    desc: '门清+1番',
    rarity: 'N',
    cost: 130,
    stackable: true,
    maxStack: 3,
    effects: [{ type: 'han_min', value: 1, desc: '门清番数+1' }],
  },
  {
    id: 'amulet_n_007',
    name: '自摸徽章',
    desc: '自摸得分+30',
    rarity: 'N',
    cost: 100,
    stackable: true,
    maxStack: 5,
    effects: [{ type: 'tsumo_bonus', value: 30, desc: '自摸得分+30' }],
  },
  {
    id: 'amulet_n_008',
    name: '岭上花',
    desc: '杠后摸牌得分+20',
    rarity: 'N',
    cost: 110,
    stackable: true,
    maxStack: 5,
    effects: [{ type: 'score_add', value: 20, desc: '杠后摸牌+20' }],
  },
  {
    id: 'amulet_n_009',
    name: '三元护符',
    desc: '白发中任一+1番',
    rarity: 'N',
    cost: 140,
    stackable: true,
    maxStack: 3,
    effects: [{ type: 'han_min', value: 1, desc: '三元牌番数+1' }],
  },
  {
    id: 'amulet_n_010',
    name: '风花雪月',
    desc: '东南西北任一+1番',
    rarity: 'N',
    cost: 140,
    stackable: true,
    maxStack: 3,
    effects: [{ type: 'han_min', value: 1, desc: '风牌番数+1' }],
  },
  {
    id: 'amulet_n_011',
    name: '一杯口印记',
    desc: '一盃口番数+1',
    rarity: 'N',
    cost: 150,
    stackable: true,
    maxStack: 2,
    effects: [{ type: 'han_min', value: 1, desc: '一盃口番数+1' }],
  },
  {
    id: 'amulet_n_012',
    name: '纯全护符',
    desc: '纯全带幺九番数+1',
    rarity: 'N',
    cost: 160,
    stackable: true,
    maxStack: 2,
    effects: [{ type: 'han_min', value: 1, desc: '纯全带幺九番数+1' }],
  },
  {
    id: 'amulet_n_013',
    name: '混一护符',
    desc: '混一色番数+1',
    rarity: 'N',
    cost: 180,
    stackable: true,
    maxStack: 2,
    effects: [{ type: 'han_min', value: 1, desc: '混一色番数+1' }],
  },
  {
    id: 'amulet_n_014',
    name: '三暗刻残片',
    desc: '三暗刻概率+5%',
    rarity: 'N',
    cost: 120,
    stackable: true,
    maxStack: 10,
    effects: [{ type: 'score_add', value: 5, desc: '三暗刻概率+5%' }],
  },
  {
    id: 'amulet_n_015',
    name: '三杠子残片',
    desc: '三杠子概率+3%',
    rarity: 'N',
    cost: 100,
    stackable: true,
    maxStack: 10,
    effects: [{ type: 'score_add', value: 3, desc: '三杠子概率+3%' }],
  },
  {
    id: 'amulet_n_016',
    name: '二杯口碎片',
    desc: '二盃口概率+2%',
    rarity: 'N',
    cost: 130,
    stackable: true,
    maxStack: 5,
    effects: [{ type: 'score_add', value: 2, desc: '二盃口概率+2%' }],
  },
  {
    id: 'amulet_n_017',
    name: '立直残心',
    desc: '立直后防守力+5%',
    rarity: 'N',
    cost: 90,
    stackable: true,
    maxStack: 10,
    effects: [{ type: 'score_add', value: 5, desc: '立直防守+5%' }],
  },
  {
    id: 'amulet_n_018',
    name: '早رز保护',
    desc: '开局手牌+1',
    rarity: 'N',
    cost: 150,
    stackable: true,
    maxStack: 3,
    effects: [{ type: 'start_hand', value: 1, desc: '开局手牌+1' }],
  },
  {
    id: 'amulet_n_019',
    name: '宝牌感应',
    desc: '宝牌得分+15/张',
    rarity: 'N',
    cost: 130,
    stackable: true,
    maxStack: 10,
    effects: [{ type: 'dora_bonus', value: 15, desc: '宝牌+15/张' }],
  },
  {
    id: 'amulet_n_020',
    name: '赤牌残片',
    desc: '赤宝牌概率+3%',
    rarity: 'N',
    cost: 100,
    stackable: true,
    maxStack: 10,
    effects: [{ type: 'dora_bonus', value: 3, desc: '赤牌概率+3%' }],
  },

  // ========== 稀有品质 (R) ==========
  {
    id: 'amulet_r_001',
    name: '二星珠',
    desc: '番数计算×1.25',
    rarity: 'R',
    cost: 300,
    stackable: true,
    maxStack: 5,
    effects: [{ type: 'score_mult', value: 125, desc: '番数×1.25' }],
  },
  {
    id: 'amulet_r_002',
    name: '三暗刻之魂',
    desc: '三暗刻稳定触发，番数+2',
    rarity: 'R',
    cost: 400,
    stackable: true,
    maxStack: 2,
    effects: [
      { type: 'han_min', value: 2, desc: '三暗刻番数+2' },
      { type: 'score_add', value: 100, desc: '三暗刻稳定触发' },
    ],
  },
  {
    id: 'amulet_r_003',
    name: '一气通贯魂',
    desc: '一气通贯番数+3',
    rarity: 'R',
    cost: 450,
    stackable: true,
    maxStack: 2,
    effects: [{ type: 'han_min', value: 3, desc: '一气通贯番数+3' }],
  },
  {
    id: 'amulet_r_004',
    name: '流局满判',
    desc: '流局听牌时获得基础分×3',
    rarity: 'R',
    cost: 350,
    stackable: true,
    maxStack: 1,
    effects: [{ type: 'score_mult', value: 300, desc: '流局听牌得分×3' }],
  },
  {
    id: 'amulet_r_005',
    name: '连庄护卫',
    desc: '被连庄时得分+50%',
    rarity: 'R',
    cost: 380,
    stackable: true,
    maxStack: 3,
    effects: [{ type: 'renchan_bonus', value: 50, desc: '连庄加成+50%' }],
  },
  {
    id: 'amulet_r_006',
    name: '亲权强化',
    desc: '亲权得分×1.5',
    rarity: 'R',
    cost: 400,
    stackable: true,
    maxStack: 3,
    effects: [{ type: 'oya_win', value: 50, desc: '亲权得分×1.5' }],
  },
  {
    id: 'amulet_r_007',
    name: '立直一発魂',
    desc: '立直一発番数+2',
    rarity: 'R',
    cost: 420,
    stackable: true,
    maxStack: 2,
    effects: [{ type: 'han_min', value: 2, desc: '立直一発番数+2' }],
  },
  {
    id: 'amulet_r_008',
    name: '双立直魂',
    desc: '双立直番数+3',
    rarity: 'R',
    cost: 480,
    stackable: true,
    maxStack: 1,
    effects: [{ type: 'han_min', value: 3, desc: '双立直番数+3' }],
  },
  {
    id: 'amulet_r_009',
    name: '三色通贯魂',
    desc: '三色同顺番数+2',
    rarity: 'R',
    cost: 350,
    stackable: true,
    maxStack: 2,
    effects: [{ type: 'han_min', value: 2, desc: '三色同顺番数+2' }],
  },
  {
    id: 'amulet_r_010',
    name: '一色通贯魂',
    desc: '一色同顺概率大幅提升',
    rarity: 'R',
    cost: 500,
    stackable: true,
    maxStack: 2,
    effects: [
      { type: 'han_min', value: 3, desc: '一色同顺番数+3' },
      { type: 'score_add', value: 50, desc: '同顺概率提升' },
    ],
  },
  {
    id: 'amulet_r_011',
    name: '混全带幺魂',
    desc: '混全带幺九番数+2',
    rarity: 'R',
    cost: 380,
    stackable: true,
    maxStack: 2,
    effects: [{ type: 'han_min', value: 2, desc: '混全带幺九番数+2' }],
  },
  {
    id: 'amulet_r_012',
    name: '对对和之魂',
    desc: '对对和番数+2',
    rarity: 'R',
    cost: 400,
    stackable: true,
    maxStack: 2,
    effects: [{ type: 'han_min', value: 2, desc: '对对和番数+2' }],
  },
  {
    id: 'amulet_r_013',
    name: '七对子之魂',
    desc: '七对子番数+2',
    rarity: 'R',
    cost: 420,
    stackable: true,
    maxStack: 2,
    effects: [{ type: 'han_min', value: 2, desc: '七对子番数+2' }],
  },
  {
    id: 'amulet_r_014',
    name: '国士护符',
    desc: '国士无双番数+3',
    rarity: 'R',
    cost: 550,
    stackable: true,
    maxStack: 1,
    effects: [{ type: 'han_min', value: 3, desc: '国士无双番数+3' }],
  },
  {
    id: 'amulet_r_015',
    name: '大三元之魂',
    desc: '大三元番数+3',
    rarity: 'R',
    cost: 500,
    stackable: true,
    maxStack: 1,
    effects: [{ type: 'han_min', value: 3, desc: '大三元番数+3' }],
  },
  {
    id: 'amulet_r_016',
    name: '小四喜之魂',
    desc: '小四喜番数+2',
    rarity: 'R',
    cost: 480,
    stackable: true,
    maxStack: 1,
    effects: [{ type: 'han_min', value: 2, desc: '小四喜番数+2' }],
  },
  {
    id: 'amulet_r_017',
    name: '字一色之魂',
    desc: '字一色番数+2',
    rarity: 'R',
    cost: 450,
    stackable: true,
    maxStack: 1,
    effects: [{ type: 'han_min', value: 2, desc: '字一色番数+2' }],
  },
  {
    id: 'amulet_r_018',
    name: '清一色之魂',
    desc: '清一色番数+2',
    rarity: 'R',
    cost: 480,
    stackable: true,
    maxStack: 2,
    effects: [{ type: 'han_min', value: 2, desc: '清一色番数+2' }],
  },
  {
    id: 'amulet_r_019',
    name: '九莲宝灯魂',
    desc: '九莲宝灯番数+4',
    rarity: 'R',
    cost: 600,
    stackable: true,
    maxStack: 1,
    effects: [{ type: 'han_min', value: 4, desc: '九莲宝灯番数+4' }],
  },
  {
    id: 'amulet_r_020',
    name: '四暗刻单骑魂',
    desc: '四暗刻单骑番数+5',
    rarity: 'R',
    cost: 650,
    stackable: true,
    maxStack: 1,
    effects: [{ type: 'han_min', value: 5, desc: '四暗刻单骑番数+5' }],
  },

  // ========== 传说品质 (L) ==========
  {
    id: 'amulet_l_001',
    name: '三星珠',
    desc: '番数计算×1.5',
    rarity: 'L',
    cost: 800,
    stackable: true,
    maxStack: 3,
    effects: [{ type: 'score_mult', value: 150, desc: '番数×1.5' }],
  },
  {
    id: 'amulet_l_002',
    name: '天和之魂',
    desc: '天和必触发，基础番数+10',
    rarity: 'L',
    cost: 1200,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 10, desc: '天和番数+10' },
      { type: 'score_add', value: 500, desc: '天和必触发' },
    ],
  },
  {
    id: 'amulet_l_003',
    name: '地和之魂',
    desc: '地和必触发，基础番数+8',
    rarity: 'L',
    cost: 1000,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 8, desc: '地和番数+8' },
      { type: 'score_add', value: 400, desc: '地和必触发' },
    ],
  },
  {
    id: 'amulet_l_004',
    name: '人池和之魂',
    desc: '人池和概率大幅提升',
    rarity: 'L',
    cost: 900,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 6, desc: '人池和番数+6' },
      { type: 'score_add', value: 300, desc: '人池和概率提升' },
    ],
  },
  {
    id: 'amulet_l_005',
    name: '四暗刻刻神',
    desc: '四暗刻必触发，番数+6',
    rarity: 'L',
    cost: 1100,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 6, desc: '四暗刻番数+6' },
      { type: 'score_add', value: 800, desc: '四暗刻必触发' },
    ],
  },
  {
    id: 'amulet_l_006',
    name: '大三元大圣',
    desc: '大三元必触发，番数+5',
    rarity: 'L',
    cost: 1000,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 5, desc: '大三元番数+5' },
      { type: 'score_add', value: 600, desc: '大三元必触发' },
    ],
  },
  {
    id: 'amulet_l_007',
    name: '绿一色大圣',
    desc: '绿一色必触发，番数+5',
    rarity: 'L',
    cost: 1050,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 5, desc: '绿一色番数+5' },
      { type: 'score_add', value: 500, desc: '绿一色必触发' },
    ],
  },
  {
    id: 'amulet_l_008',
    name: '清四喜大圣',
    desc: '清四喜必触发，番数+5',
    rarity: 'L',
    cost: 1050,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 5, desc: '清四喜番数+5' },
      { type: 'score_add', value: 600, desc: '清四喜必触发' },
    ],
  },
  {
    id: 'amulet_l_009',
    name: '九莲宝灯真',
    desc: '九莲宝灯必触发，番数+6',
    rarity: 'L',
    cost: 1150,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 6, desc: '九莲宝灯番数+6' },
      { type: 'score_add', value: 800, desc: '九莲宝灯必触发' },
    ],
  },
  {
    id: 'amulet_l_010',
    name: '国士无双十三面',
    desc: '国士无双十三面必触发，番数+8',
    rarity: 'L',
    cost: 1300,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 8, desc: '国士十三面番数+8' },
      { type: 'score_add', value: 1000, desc: '国士无双十三面必触发' },
    ],
  },
  {
    id: 'amulet_l_011',
    name: '大四喜极',
    desc: '大四喜必触发，番数+6',
    rarity: 'L',
    cost: 1100,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 6, desc: '大四喜番数+6' },
      { type: 'score_add', value: 700, desc: '大四喜必触发' },
    ],
  },
  {
    id: 'amulet_l_012',
    name: '四杠子神',
    desc: '四杠子必触发，番数+5',
    rarity: 'L',
    cost: 1000,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 5, desc: '四杠子番数+5' },
      { type: 'score_add', value: 500, desc: '四杠子必触发' },
    ],
  },
  {
    id: 'amulet_l_013',
    name: '天秀之魂',
    desc: '所有番数+1，所有得分+100',
    rarity: 'L',
    cost: 1500,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 1, desc: '全部番数+1' },
      { type: 'score_add', value: 100, desc: '全部得分+100' },
    ],
  },
  {
    id: 'amulet_l_014',
    name: '福德财神',
    desc: 'Base分×2，番数+2',
    rarity: 'L',
    cost: 1400,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'score_mult', value: 200, desc: '基础分×2' },
      { type: 'han_min', value: 2, desc: '番数+2' },
    ],
  },
  {
    id: 'amulet_l_015',
    name: '万能天引',
    desc: '万能牌效果×2，可主动指定万能牌',
    rarity: 'L',
    cost: 1200,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'score_mult', value: 200, desc: '万能牌效果×2' },
      { type: 'exchange_tile', value: 1, desc: '可指定万能牌' },
    ],
  },
  {
    id: 'amulet_l_016',
    name: '青龙之魂',
    desc: '清一色必触发，额外番数+4',
    rarity: 'L',
    cost: 1100,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 4, desc: '清一色番数+4' },
      { type: 'score_add', value: 500, desc: '清一色必触发' },
    ],
  },
  {
    id: 'amulet_l_017',
    name: '白虎之魂',
    desc: '混一色必触发，额外番数+3',
    rarity: 'L',
    cost: 950,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 3, desc: '混一色番数+3' },
      { type: 'score_add', value: 300, desc: '混一色必触发' },
    ],
  },
  {
    id: 'amulet_l_018',
    name: '玄武之魂',
    desc: '对對和/三暗刻额外番数+3',
    rarity: 'L',
    cost: 900,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 3, desc: '刻子系额外+3' },
      { type: 'score_add', value: 400, desc: '刻子系必触发' },
    ],
  },
  {
    id: 'amulet_l_019',
    name: '朱雀之魂',
    desc: '顺子系额外番数+3',
    rarity: 'L',
    cost: 900,
    stackable: true,
    maxStack: 1,
    effects: [
      { type: 'han_min', value: 3, desc: '顺子系额外+3' },
      { type: 'score_add', value: 400, desc: '顺子系概率提升' },
    ],
  },
  {
    id: 'amulet_l_020',
    name: '永恒幸运',
    desc: '每层塔基础分+200，全局番数+1',
    rarity: 'L',
    cost: 1600,
    stackable: true,
    maxStack: 2,
    effects: [
      { type: 'score_add', value: 200, desc: '每层塔+200基础分' },
      { type: 'han_min', value: 1, desc: '全局番数+1' },
    ],
  },
];

/**
 * 根据稀有度获取随机护身符
 */
export function getRandomAmuletByRarity(rarity: AmuletRarity): Amulet {
  const pool = AMULETS.filter(a => a.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 根据权重获取随机护身符
 */
export function getRandomAmulet(): { amulet: Amulet; rarity: AmuletRarity } {
  const rand = Math.random();
  let cumulative = 0;
  let selectedRarity: AmuletRarity = 'N';
  
  for (const [rarity, config] of Object.entries(AMULET_RARITY_CONFIG)) {
    cumulative += config.dropRate;
    if (rand < cumulative) {
      selectedRarity = rarity as AmuletRarity;
      break;
    }
  }
  
  return {
    amulet: getRandomAmuletByRarity(selectedRarity),
    rarity: selectedRarity,
  };
}

/**
 * 获取护身符名称（带品质颜色）
 */
export function getAmuletDisplayName(amulet: Amulet): string {
  return amulet.name;
}

/**
 * 护身符效果叠加计算
 */
export function calculateAmuletBonus(amulets: Amulet[]): {
  scoreMult: number;
  scoreAdd: number;
  hanBonus: number;
  doraBonus: number;
} {
  let scoreMult = 100; // 100% = 1.0
  let scoreAdd = 0;
  let hanBonus = 0;
  let doraBonus = 0;
  
  for (const amulet of amulets) {
    for (const effect of amulet.effects) {
      switch (effect.type) {
        case 'score_mult':
          scoreMult += effect.value - 100; // 假设value是百分比
          break;
        case 'score_add':
          scoreAdd += effect.value;
          break;
        case 'han_min':
        case 'riichi_bonus':
        case 'oya_win':
        case 'tsumo_bonus':
        case 'renchan_bonus':
          hanBonus += effect.value;
          break;
        case 'dora_bonus':
          doraBonus += effect.value;
          break;
      }
    }
  }
  
  return { scoreMult, scoreAdd, hanBonus, doraBonus };
}
