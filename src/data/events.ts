/**
 * 随机事件数据 - 青云之志模式
 * 在关卡之间或特殊条件下触发的事件
 */

export type EventType = 'buff' | 'debuff' | 'choice' | 'battle' | 'shop' | 'mystery';
export type EventRarity = 'common' | 'rare' | 'special';

export interface EventChoice {
  text: string;          // 选项文本
  result: EventResult;   // 选择结果
  condition?: string;    // 显示条件
}

export interface EventResult {
  type: 'amulet' | 'star_coin' | 'hp_damage' | 'hp_heal' | 'score_boost' 
      | 'tile_blessing' | 'curse' | 'seal' | 'none';
  value: number;
  message: string;
}

export interface GameEvent {
  id: string;
  name: string;
  desc: string;
  type: EventType;
  rarity: EventRarity;
  choices?: EventChoice[];  // 选择型事件
  autoTrigger?: EventResult; // 自动触发事件
  minFloor?: number;         // 最低触发楼层
  maxTriggers?: number;      // 最大触发次数
  icon?: string;
}

// 事件数据库
export const EVENTS: GameEvent[] = [
  // ========== 增益类事件 ==========
  {
    id: 'event_buff_001',
    name: '福神降临',
    desc: '一位福神路过，赐予你祝福',
    type: 'buff',
    rarity: 'common',
    autoTrigger: { type: 'star_coin', value: 50, message: '福神赐予你50星币！' },
  },
  {
    id: 'event_buff_002',
    name: '连胜之魂',
    desc: '感受到一股强大的气势涌入体内',
    type: 'buff',
    rarity: 'common',
    autoTrigger: { type: 'score_boost', value: 20, message: '气势提升！本层得分+20%' },
  },
  {
    id: 'event_buff_003',
    name: '牌山祝福',
    desc: '牌山散发出淡淡的光芒',
    type: 'buff',
    rarity: 'common',
    autoTrigger: { type: 'tile_blessing', value: 1, message: '万能牌出现率+1' },
  },
  {
    id: 'event_buff_004',
    name: '金龙赐福',
    desc: '一条金龙从牌山中飞出',
    type: 'buff',
    rarity: 'rare',
    autoTrigger: { type: 'amulet', value: 1, message: '获得一个随机护身符！' },
  },
  {
    id: 'event_buff_005',
    name: '凤凰涅槃',
    desc: '凤凰之火净化了你的灵魂',
    type: 'buff',
    rarity: 'rare',
    autoTrigger: { type: 'hp_heal', value: 30, message: '生命回复30%！' },
  },
  {
    id: 'event_buff_006',
    name: '神圣庇护',
    desc: '受到神圣力量的保护',
    type: 'buff',
    rarity: 'special',
    autoTrigger: { type: 'amulet', value: 2, message: '获得2个随机护身符！' },
  },
  {
    id: 'event_buff_007',
    name: '天照奇遇',
    desc: '太阳神的光芒笼罩着你',
    type: 'buff',
    rarity: 'special',
    autoTrigger: { type: 'score_boost', value: 100, message: '天照大神祝福！本层得分×2！' },
  },
  {
    id: 'event_buff_008',
    name: '神泉涌动',
    desc: '喝下神泉水，精力充沛',
    type: 'buff',
    rarity: 'common',
    autoTrigger: { type: 'hp_heal', value: 20, message: '生命回复20%！' },
  },

  // ========== 减益类事件 ==========
  {
    id: 'event_debuff_001',
    name: '滑倒失误',
    desc: '不小心踩到香蕉皮，损失惨重',
    type: 'debuff',
    rarity: 'common',
    autoTrigger: { type: 'hp_damage', value: 10, message: '损失10%生命！' },
  },
  {
    id: 'event_debuff_002',
    name: '诅咒低语',
    desc: '听到一阵邪恶的低语',
    type: 'debuff',
    rarity: 'common',
    autoTrigger: { type: 'curse', value: 1, message: '本层得分-10%！' },
  },
  {
    id: 'event_debuff_003',
    name: '黑云笼罩',
    desc: '乌云密布，运势下降',
    type: 'debuff',
    rarity: 'common',
    autoTrigger: { type: 'score_boost', value: -15, message: '运势下降，得分-15%！' },
  },
  {
    id: 'event_debuff_004',
    name: '恶灵缠身',
    desc: '被恶灵缠上，难以脱身',
    type: 'debuff',
    rarity: 'rare',
    autoTrigger: { type: 'hp_damage', value: 20, message: '损失20%生命！' },
  },
  {
    id: 'event_debuff_005',
    name: '财神远离',
    desc: '财神爷不想见你',
    type: 'debuff',
    rarity: 'rare',
    autoTrigger: { type: 'star_coin', value: -30, message: '损失30星币...' },
  },
  {
    id: 'event_debuff_006',
    name: '蛇神诅咒',
    desc: '蛇神之灵对你施下诅咒',
    type: 'debuff',
    rarity: 'special',
    autoTrigger: { type: 'curse', value: 3, message: '强烈的诅咒！本层得分-30%！' },
  },

  // ========== 选择类事件 ==========
  {
    id: 'event_choice_001',
    name: '神秘的宝箱',
    desc: '发现一个神秘的宝箱，里面有三道光芒',
    type: 'choice',
    rarity: 'common',
    minFloor: 1,
    choices: [
      {
        text: '选择金色光芒',
        result: { type: 'star_coin', value: 80, message: '获得80星币！' },
      },
      {
        text: '选择银色光芒',
        result: { type: 'amulet', value: 1, message: '获得普通护身符！' },
      },
      {
        text: '选择铜色光芒',
        result: { type: 'score_boost', value: 15, message: '得分+15%！' },
      },
    ],
  },
  {
    id: 'event_choice_002',
    name: '老麻将师傅',
    desc: '一位白发苍苍的老者出现在你面前',
    type: 'choice',
    rarity: 'rare',
    minFloor: 3,
    choices: [
      {
        text: '请教番数技巧',
        result: { type: 'amulet', value: 1, message: '获得稀有护身符！' },
      },
      {
        text: '请求指点牌谱',
        result: { type: 'score_boost', value: 30, message: '本层得分+30%！' },
      },
      {
        text: '膜拜求好运',
        result: { type: 'hp_heal', value: 25, message: '生命回复25%！' },
      },
    ],
  },
  {
    id: 'event_choice_003',
    name: '恶魔的交易',
    desc: '一个神秘的恶魔出现，提出交易',
    type: 'choice',
    rarity: 'special',
    minFloor: 5,
    choices: [
      {
        text: '用50星币换取护身符',
        result: { type: 'amulet', value: 1, message: '用50星币换取护身符！' },
        condition: 'star_coin >= 50',
      },
      {
        text: '用生命换取力量',
        result: { type: 'score_boost', value: 50, message: '生命-30%，得分+50%！' },
      },
      {
        text: '拒绝交易',
        result: { type: 'none', value: 0, message: '你拒绝了恶魔，转身离开...' },
      },
    ],
  },
  {
    id: 'event_choice_004',
    name: '占卜婆婆',
    desc: '一位占卜婆婆要为你算一卦',
    type: 'choice',
    rarity: 'common',
    minFloor: 2,
    choices: [
      {
        text: '占卜命运',
        result: { type: 'score_boost', value: 25, message: '命运眷顾，得分+25%！' },
      },
      {
        text: '占卜财运',
        result: { type: 'star_coin', value: 60, message: '财运亨通，获得60星币！' },
      },
      {
        text: '占卜健康',
        result: { type: 'hp_heal', value: 30, message: '身体健康，生命回复30%！' },
      },
    ],
  },
  {
    id: 'event_choice_005',
    name: '迷路的小鬼',
    desc: '一个小鬼迷路，向你求助',
    type: 'choice',
    rarity: 'common',
    minFloor: 1,
    choices: [
      {
        text: '帮助小鬼找路',
        result: { type: 'amulet', value: 1, message: '小鬼感激，赠送护身符！' },
      },
      {
        text: '给小鬼一些星币',
        result: { type: 'score_boost', value: 20, message: '小鬼祝福你，得分+20%！' },
      },
      {
        text: '无视离开',
        result: { type: 'none', value: 0, message: '小鬼消失在黑暗中...' },
      },
    ],
  },
  {
    id: 'event_choice_006',
    name: '赌博小次郎',
    desc: '赌博小次郎要和你赌一把',
    type: 'choice',
    rarity: 'rare',
    minFloor: 4,
    choices: [
      {
        text: '接受挑战，押注30星币',
        result: { type: 'star_coin', value: 60, message: '获胜！获得60星币！' },
        condition: 'star_coin >= 30',
      },
      {
        text: '接受挑战，押注50星币',
        result: { type: 'star_coin', value: 100, message: '大获胜！获得100星币！' },
        condition: 'star_coin >= 50',
      },
      {
        text: '拒绝挑战',
        result: { type: 'none', value: 0, message: '小次郎嘲笑你胆怯...' },
      },
    ],
  },
  {
    id: 'event_choice_007',
    name: '神龙的试炼',
    desc: '神龙出现，提出试炼',
    type: 'choice',
    rarity: 'special',
    minFloor: 7,
    choices: [
      {
        text: '接受火之试炼',
        result: { type: 'hp_damage', value: 25, message: '火焰灼烧，损失25%生命！' },
      },
      {
        text: '接受龙之试炼',
        result: { type: 'score_boost', value: 80, message: '试炼通过，得分+80%！' },
      },
      {
        text: '献上星币祈求庇护',
        result: { type: 'amulet', value: 2, message: '献上100星币，获得2个传说护身符！' },
        condition: 'star_coin >= 100',
      },
    ],
  },

  // ========== 战斗类事件 ==========
  {
    id: 'event_battle_001',
    name: '恶犬拦路',
    desc: '一只恶犬从阴影中窜出！',
    type: 'battle',
    rarity: 'common',
    minFloor: 1,
    autoTrigger: { type: 'hp_damage', value: 15, message: '被恶犬咬伤，损失15%生命！' },
  },
  {
    id: 'event_battle_002',
    name: '盗贼突袭',
    desc: '盗贼团埋伏，发动袭击！',
    type: 'battle',
    rarity: 'common',
    minFloor: 2,
    autoTrigger: { type: 'hp_damage', value: 20, message: '盗贼袭击，损失20%生命！' },
  },
  {
    id: 'event_battle_003',
    name: '毒蛇陷阱',
    desc: '踩到毒蛇，被咬伤！',
    type: 'battle',
    rarity: 'common',
    minFloor: 1,
    autoTrigger: { type: 'hp_damage', value: 10, message: '被毒蛇咬伤，损失10%生命！' },
  },
  {
    id: 'event_battle_004',
    name: '魔将拦路',
    desc: '魔将率领大军阻挡你的去路！',
    type: 'battle',
    rarity: 'rare',
    minFloor: 5,
    autoTrigger: { type: 'hp_damage', value: 35, message: '魔将攻击，损失35%生命！' },
  },
  {
    id: 'event_battle_005',
    name: '恶龙本体现身',
    desc: '塔顶的恶龙终于现身！',
    type: 'battle',
    rarity: 'special',
    minFloor: 10,
    autoTrigger: { type: 'hp_damage', value: 50, message: '恶龙吐息，损失50%生命！' },
  },

  // ========== 商店类事件 ==========
  {
    id: 'event_shop_001',
    name: '移动商店',
    desc: '一个商人带着货物经过',
    type: 'shop',
    rarity: 'common',
    minFloor: 1,
  },
  {
    id: 'event_shop_002',
    name: '神秘商人',
    desc: '神秘商人出现在你面前',
    type: 'shop',
    rarity: 'rare',
    minFloor: 3,
  },
  {
    id: 'event_shop_003',
    name: '黑市商人',
    desc: '黑市商人出售各种稀有物品',
    type: 'shop',
    rarity: 'special',
    minFloor: 6,
  },

  // ========== 神秘类事件 ==========
  {
    id: 'event_mystery_001',
    name: '时空裂缝',
    desc: '一道时空裂缝出现，散发着诡异的光芒',
    type: 'mystery',
    rarity: 'rare',
    minFloor: 4,
    choices: [
      {
        text: '踏入裂缝',
        result: { type: 'amulet', value: 2, message: '穿越到神秘空间，获得2个护身符！' },
      },
      {
        text: '用星币封印',
        result: { type: 'star_coin', value: -50, message: '消耗50星币封印裂缝...' },
        condition: 'star_coin >= 50',
      },
      {
        text: '小心绕开',
        result: { type: 'none', value: 0, message: '你谨慎地绕开了裂缝...' },
      },
    ],
  },
  {
    id: 'event_mystery_002',
    name: '古老的遗迹',
    desc: '发现一座被遗忘的遗迹',
    type: 'mystery',
    rarity: 'special',
    minFloor: 5,
    choices: [
      {
        text: '进入遗迹探索',
        result: { type: 'seal', value: 1, message: '在遗迹深处发现一枚珍贵印章！' },
      },
      {
        text: '祈祷许愿',
        result: { type: 'score_boost', value: 50, message: '愿望实现，本层得分+50%！' },
      },
      {
        text: '采集发光矿石',
        result: { type: 'star_coin', value: 100, message: '卖出矿石，获得100星币！' },
      },
    ],
  },
  {
    id: 'event_mystery_003',
    name: '命运岔路口',
    desc: '面前出现两条路',
    type: 'mystery',
    rarity: 'common',
    minFloor: 1,
    choices: [
      {
        text: '走阳光大道',
        result: { type: 'hp_heal', value: 15, message: '阳光温暖，生命+15%！' },
      },
      {
        text: '走幽暗小径',
        result: { type: 'score_boost', value: 20, message: '险中求胜，得分+20%！' },
      },
    ],
  },
  {
    id: 'event_mystery_004',
    name: '凤凰涅槃之地',
    desc: '这里曾有凤凰浴火重生',
    type: 'mystery',
    rarity: 'special',
    minFloor: 8,
    choices: [
      {
        text: '接受凤凰的祝福',
        result: { type: 'hp_heal', value: 50, message: '浴火重生，生命全满！' },
      },
      {
        text: '收集凤凰羽毛',
        result: { type: 'amulet', value: 1, message: '获得传说护身符！' },
      },
      {
        text: '在旁边休息片刻',
        result: { type: 'score_boost', value: 40, message: '休息恢复，得分+40%！' },
      },
    ],
  },
];

/**
 * 获取可触发的事件
 */
export function getAvailableEvents(floor: number, triggers: Map<string, number>): GameEvent[] {
  const available: GameEvent[] = [];
  
  for (const event of EVENTS) {
    // 检查楼层限制
    if (event.minFloor && floor < event.minFloor) continue;
    
    // 检查触发次数限制
    if (event.maxTriggers) {
      const currentTriggers = triggers.get(event.id) || 0;
      if (currentTriggers >= event.maxTriggers) continue;
    }
    
    available.push(event);
  }
  
  return available;
}

/**
 * 根据稀有度获取随机事件
 */
export function getRandomEvent(floor: number, rarity?: EventRarity): GameEvent | undefined {
  const available = getAvailableEvents(floor, new Map());
  
  let pool = available;
  if (rarity) {
    pool = available.filter(e => e.rarity === rarity);
  }
  
  if (pool.length === 0) return undefined;
  
  // 稀有度权重
  const weights: Record<EventRarity, number> = {
    common: 60,
    rare: 30,
    special: 10,
  };
  
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const [r, w] of Object.entries(weights)) {
    cumulative += w;
    if (rand < cumulative) {
      const filtered = pool.filter(e => e.rarity === r);
      if (filtered.length > 0) {
        return filtered[Math.floor(Math.random() * filtered.length)];
      }
    }
  }
  
  // 默认返回普通事件
  const commonEvents = pool.filter(e => e.rarity === 'common');
  return commonEvents[Math.floor(Math.random() * commonEvents.length)];
}

/**
 * 事件结果应用到游戏状态
 */
export interface EventResultContext {
  starCoin: number;
  amulets: number;
  currentFloor: number;
}

export function applyEventResult(
  result: EventResult,
  context: EventResultContext
): EventResultContext {
  const newContext = { ...context };
  
  switch (result.type) {
    case 'star_coin':
      newContext.starCoin = Math.max(0, newContext.starCoin + result.value);
      break;
    case 'amulet':
      newContext.amulets += result.value;
      break;
    case 'score_boost':
      // 分数增益在引擎层处理
      break;
    case 'hp_heal':
      // 生命回复在引擎层处理
      break;
    case 'hp_damage':
      // 伤害在引擎层处理
      break;
    case 'curse':
      // 诅咒在引擎层处理
      break;
    case 'seal':
      // 印章在引擎层处理
      break;
  }
  
  return newContext;
}
