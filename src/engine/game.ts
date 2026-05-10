/**
 * game.ts - 青云之志核心游戏控制器
 * 整合麻将引擎 + Roguelike爬塔 + 护身符系统
 */

import { Tile, TileId, ALL_TILE_IDS, createTile, createUniversalTile } from '../types/tile';
import { HandState, initHand, handDraw, handDiscard } from './hand';
import { isAgari, getTenpaiTiles, AgariResult } from './agari';
import { calculateShanten, calculateShantenWithUniversal, ShantenResult } from './shanten';
import { calculateFinalScore, DEFAULT_SCORE_CONFIG } from './score';
import { AmuletState, createAmuletState, getTotalAmuletEffects } from './amulet';
import { LevelState, FloorConfig, createLevelState, enterNextFloor, clearFloor, generateFloorConfig } from './level';
import { ShopState, generateShopItems, purchaseItem, refreshShop } from './shop';

// ========== 游戏模式 ==========
export type GameScreen = 'title' | 'floor_select' | 'battle' | 'shop' | 'event' | 'result' | 'game_over';

export interface GameModeState {
  screen: GameScreen;
  level: LevelState;
  player: PlayerState;
  battle: BattleState | null;
  shop: ShopState | null;
  message: string;
  history: GameEvent[];
}

// ========== 玩家状态 ==========
export interface PlayerState {
  hp: number;
  maxHp: number;
  starCoin: number;
  amuletState: AmuletState;
  totalScore: number;
  talismans: string[]; // 已装备的护身符ID
}

// ========== 战斗状态 ==========
export type BattlePhase = 'setup' | 'draw' | 'discard' | 'enemy_turn' | 'win' | 'lose' | 'shop_transition';

export interface BattleState {
  phase: BattlePhase;
  floorConfig: FloorConfig;
  hand: HandState;
  deck: Tile[];
  deckIndex: number;
  doraIndicators: Tile[];
  doraTiles: Tile[];
  currentEnemy: any | null;
  enemyHp: number;
  enemyMaxHp: number;
  turnCount: number;
  scoreThisBattle: number;
  starCoinThisBattle: number;
  isRiichi: boolean;
  riichiTurn: number;
  tsumoCount: number; // 连续自摸次数
  lastAction: string;
  agariResult: AgariResult | null;
  detectedYaku: { name: string; han: number }[];
  shanten: ShantenResult | null;
  tenpaiTiles: TileId[];
  canTsumo: boolean;
  canRiichi: boolean;
  selectedTileIndex: number | null;
  // 万能天引
  universalDrawsLeft: number;
  canUniversalDraw: boolean;
}

// ========== 游戏事件记录 ==========
export interface GameEvent {
  type: 'draw' | 'discard' | 'win' | 'lose' | 'shop' | 'floor_enter' | 'amulet' | 'damage';
  message: string;
  timestamp: number;
  data?: any;
}

// ========== 创建新游戏 ==========
export function createNewGame(): GameModeState {
  const player: PlayerState = {
    hp: 100,
    maxHp: 100,
    starCoin: 50,
    amuletState: createAmuletState(),
    totalScore: 0,
    talismans: [],
  };

  const level = createLevelState();

  return {
    screen: 'title',
    level,
    player,
    battle: null,
    shop: null,
    message: '欢迎来到青云之志！',
    history: [],
  };
}

// ========== 开始新一局（进入第一层） ==========
export function startNewRun(state: GameModeState): GameModeState {
  const newLevel = createLevelState();
  const newPlayer: PlayerState = {
    hp: 100,
    maxHp: 100,
    starCoin: 50,
    amuletState: createAmuletState(),
    totalScore: 0,
    talismans: [],
  };

  return {
    ...state,
    screen: 'floor_select',
    level: newLevel,
    player: newPlayer,
    battle: null,
    shop: null,
    message: '新的一局开始了！选择你要挑战的楼层。',
    history: [{ type: 'floor_enter', message: '开始新一局', timestamp: Date.now() }],
  };
}

// ========== 进入楼层 ==========
export function enterFloor(state: GameModeState, floor: number): GameModeState {
  const config = generateFloorConfig(floor);

  if (config.type === 'shop') {
    // 进入商店
    const shopItems = generateShopItems(floor);
    const shop: ShopState = {
      starCoin: state.player.starCoin,
      items: shopItems,
      refreshCost: 20,
      maxRefreshes: 3,
      currentRefreshes: 0,
    };

    return {
      ...state,
      screen: 'shop',
      shop,
      message: `进入第${floor}层 - 商店`,
      history: [...state.history, { type: 'shop', message: `进入商店（第${floor}层）`, timestamp: Date.now() }],
    };
  }

  if (config.type === 'event') {
    // 事件层（简化处理为普通战斗）
    return startBattle(state, config);
  }

  // 普通/精英/BOSS层 → 进入战斗
  return startBattle(state, config);
}

// ========== 开始战斗 ==========
function startBattle(state: GameModeState, config: FloorConfig): GameModeState {
  // 创建牌山（136张）
  const deck: Tile[] = [];
  for (const id of ALL_TILE_IDS) {
    for (let i = 0; i < 4; i++) {
      deck.push(createTile(id));
    }
  }
  // 洗牌
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // 发牌：13张（测试模式：使用预设好牌加速测试）
  const testMode = true; // 设为true测试快速和牌
  let handTiles: Tile[];
  if (testMode && config.floor === 1) {
    // 预设一手一发出牌就能和牌的手牌
    // 手牌13张: 1m2m3m 4m5m6m 7m8m9m 1p1p 2p2p + 摸任意筒子 = 和牌
    // 这是一个完全听牌的手牌（向听数0），摸到任何牌都能和
    handTiles = [
      createTile('1m'), createTile('2m'), createTile('3m'),
      createTile('4m'), createTile('5m'), createTile('6m'),
      createTile('7m'), createTile('8m'), createTile('9m'),
      createTile('1p'), createTile('1p'), createTile('2p'), createTile('2p'),
    ];
  } else {
    handTiles = deck.slice(0, 13);
  }
  const hand = initHand(handTiles);

  // 宝牌指示牌（第14张）
  const doraIndicator = deck[13];
  const doraTiles = calculateDoraTiles([doraIndicator]);

  // 敌人
  const enemy = config.enemy || null;
  const enemyHp = enemy ? enemy.hp : 100;
  const enemyMaxHp = enemy ? (enemy as any).maxHp || enemy.hp : 100;

  const battle: BattleState = {
    phase: 'draw',
    floorConfig: config,
    hand,
    deck,
    deckIndex: 14, // 已发13张 + 1张宝牌指示牌
    doraIndicators: [doraIndicator],
    doraTiles,
    currentEnemy: enemy,
    enemyHp,
    enemyMaxHp,
    turnCount: 0,
    scoreThisBattle: 0,
    starCoinThisBattle: 0,
    isRiichi: false,
    riichiTurn: 0,
    tsumoCount: 0,
    lastAction: '战斗开始',
    agariResult: null,
    detectedYaku: [],
    shanten: null,
    tenpaiTiles: [],
    canTsumo: false,
    canRiichi: false,
    selectedTileIndex: null,
    universalDrawsLeft: 3, // 每局3次万能天引
    canUniversalDraw: true,
  };

  // 计算初始向听数
  const shanten = calculateShanten(battle.hand.tiles);
  battle.shanten = shanten;
  battle.tenpaiTiles = getTenpaiTiles(battle.hand);
  battle.canRiichi = shanten.shanten === 0 && !battle.hand.riichi;

  // 首次摸牌
  const drawTile = deck[battle.deckIndex];
  battle.hand = handDraw(battle.hand, drawTile);
  battle.deckIndex++;
  battle.phase = 'discard';

  return {
    ...state,
    screen: 'battle',
    battle,
    message: `第${config.floor}层战斗开始！摸到 ${drawTile.id}，向听数: ${shanten.shanten}`,
    history: [...state.history, { type: 'floor_enter', message: `进入第${config.floor}层`, timestamp: Date.now() }],
  };
}

// ========== 计算宝牌 ==========
function calculateDoraTiles(indicators: Tile[]): Tile[] {
  const dora: Tile[] = [];
  for (const ind of indicators) {
    const nextId = getNextTileId(ind.id as TileId);
    if (nextId) {
      dora.push(createTile(nextId));
    }
  }
  return dora;
}

function getNextTileId(id: TileId): TileId | null {
  const suit = id[1];
  const val = parseInt(id[0]);

  if (suit === 'z') {
    // 字牌循环: 1z→2z→3z→4z→1z, 5z→6z→7z→5z
    if (val <= 4) return `${(val % 4) + 1}z` as TileId;
    if (val <= 7) return `${val === 7 ? 5 : val + 1}z` as TileId;
    return null;
  }

  // 数牌循环: 9→1
  if (val === 9) return `1${suit}` as TileId;
  return `${val + 1}${suit}` as TileId;
}

// ========== 玩家选择牌 ==========
export function selectTile(state: GameModeState, index: number): GameModeState {
  if (!state.battle || state.battle.phase !== 'discard') return state;

  const battle = { ...state.battle, selectedTileIndex: index };
  const tile = battle.hand.tiles[index];

  return {
    ...state,
    battle,
    message: `选择了 ${tile.id}`,
  };
}

// ========== 玩家出牌 ==========
export function discardTile(state: GameModeState): GameModeState {
  if (!state.battle || state.battle.phase !== 'discard') return state;
  if (state.battle.selectedTileIndex === null) {
    return { ...state, message: '请先选择一张牌' };
  }

  const battle = { ...state.battle };
  const selIdx = battle.selectedTileIndex;
  if (selIdx === null) return { ...state, message: '请先选择一张牌' };
  const { hand, tile } = handDiscard(battle.hand, selIdx);
  battle.hand = hand;
  battle.selectedTileIndex = null;
  battle.turnCount++;

  // 敌人回合：根据敌人攻击力计算伤害
  const enemyAttack = battle.currentEnemy?.attack || 5;
  const enemyDamage = Math.floor(enemyAttack * battle.floorConfig.difficulty);
  const newPlayer = { ...state.player, hp: Math.max(0, state.player.hp - enemyDamage) };

  // 检查是否听牌（使用万能牌感知版本）
  const universalCount = battle.hand.tiles.filter(t => t.id === 'universal').length;
  const shanten = universalCount > 0 
    ? calculateShantenWithUniversal(battle.hand.tiles, universalCount) 
    : calculateShanten(battle.hand.tiles);
  battle.shanten = shanten;
  battle.tenpaiTiles = getTenpaiTiles(battle.hand);
  battle.canRiichi = shanten.shanten === 0 && !battle.isRiichi;

  // 如果向听数为-1，表示已经和牌，设置canTsumo并创建agariResult
  if (shanten.shanten === -1) {
    battle.canTsumo = true;
    battle.agariResult = {
      isAgari: true,
      form: shanten.form || 'standard',
      melds: [],
      pairTile: undefined,
      winningTile: battle.hand.lastDraw || battle.hand.tiles[battle.hand.tiles.length - 1],
      isTsumo: true,
      isMenzen: true,
      waits: [],
    };
    battle.phase = 'discard';
    return {
      ...state,
      player: newPlayer,
      battle,
      message: `和了！向听数-1，可以自摸和牌！`,
      history: [...state.history, { type: 'win', message: '可以自摸和牌', timestamp: Date.now() }],
    };
  }
  
  // 如果向听数为0（听牌），检查是否已立直，如果已立直则可以直接和牌
  if (shanten.shanten === 0 && battle.isRiichi) {
    // 听牌且已立直，下一回合自动和牌（简化处理）
    battle.canTsumo = true;
    battle.agariResult = {
      isAgari: true,
      form: shanten.form || 'standard',
      melds: [],
      pairTile: undefined,
      winningTile: battle.hand.lastDraw || battle.hand.tiles[battle.hand.tiles.length - 1],
      isTsumo: true,
      isMenzen: true,
      waits: battle.tenpaiTiles,
    };
    battle.phase = 'discard';
    return {
      ...state,
      player: newPlayer,
      battle,
      message: `立直后和牌！`,
      history: [...state.history, { type: 'win', message: '立直和牌', timestamp: Date.now() }],
    };
  }

  // 检查是否能自摸（如果听牌且下一张摸牌能胡）
  // 简化：进入摸牌阶段
  battle.phase = 'draw';

  // 检查玩家是否死亡
  if (newPlayer.hp <= 0) {
    battle.phase = 'lose';
    return {
      ...state,
      player: newPlayer,
      battle,
      screen: 'game_over',
      message: '你被击败了...',
      history: [...state.history, { type: 'lose', message: '战斗失败', timestamp: Date.now() }],
    };
  }

  // 摸牌
  if (battle.deckIndex < battle.deck.length) {
    const drawTile = battle.deck[battle.deckIndex];
    battle.hand = handDraw(battle.hand, drawTile);
    battle.deckIndex++;

    // 如果已立直且听牌，直接允许自摸（简化处理）
    if (battle.isRiichi && shanten.shanten === 0) {
      battle.agariResult = {
        isAgari: true,
        form: shanten.form || 'standard',
        melds: [],
        pairTile: undefined,
        winningTile: drawTile,
        isTsumo: true,
        isMenzen: true,
        waits: battle.tenpaiTiles,
      };
      battle.canTsumo = true;
      battle.phase = 'discard';
    } else {
      // 检查自摸（注意：drawTile已经被handDraw加入hand.tiles，所以allTiles会有15张）
      // isAgari内部会合并hand.tiles + winningTile，这里需要避免重复
      // 临时移除最后一张牌来检查和牌
      const handWithoutDraw = { ...battle.hand, tiles: battle.hand.tiles.slice(0, -1) };
      console.log('[DEBUG] Checking agari, hand tiles:', handWithoutDraw.tiles.map(t => t.id).join(','), 'winning:', drawTile.id, 'total:', handWithoutDraw.tiles.length + 1);
      const agari = isAgari(handWithoutDraw, drawTile);
      console.log('[DEBUG] Agari result:', agari.isAgari, agari.form, 'melds:', agari.melds.length);
      if (agari.isAgari) {
        battle.agariResult = agari;
        battle.canTsumo = true;
        battle.phase = 'discard'; // 可以宣布自摸
      } else {
        battle.canTsumo = false;
        battle.phase = 'discard';
      }
    }
  } else {
    // 牌山耗尽，流局
    battle.phase = 'lose';
    return {
      ...state,
      battle,
      screen: 'game_over',
      message: '牌山耗尽，流局失败',
      history: [...state.history, { type: 'lose', message: '牌山耗尽', timestamp: Date.now() }],
    };
  }

  return {
    ...state,
    player: newPlayer,
    battle,
    message: `打出 ${tile.id}，受到 ${enemyDamage} 点伤害，摸到 ${battle.hand.lastDraw?.id ?? '?'}，向听: ${shanten.shanten}`,
    history: [...state.history, { type: 'discard', message: `打出${tile.id}`, timestamp: Date.now() }],
  };
}

// ========== 立直 ==========
export function doRiichi(state: GameModeState): GameModeState {
  if (!state.battle || state.battle.phase !== 'discard') return state;
  if (!state.battle.canRiichi) {
    return { ...state, message: '现在不能立直' };
  }

  const battle = { ...state.battle };
  battle.isRiichi = true;
  battle.riichiTurn = battle.turnCount;
  battle.hand = { ...battle.hand, riichi: true };
  battle.canRiichi = false;

  // 立直后自动摸打
  return discardTile({
    ...state,
    battle,
    message: '立直！',
  });
}

// ========== 自摸 ==========
export function doTsumo(state: GameModeState): GameModeState {
  if (!state.battle || !state.battle.canTsumo || !state.battle.agariResult) {
    return { ...state, message: '现在不能自摸' };
  }

  const battle = { ...state.battle };
  const agari = battle.agariResult;

  // 检测役种（简化版，yaku.ts已删除）
  const yakuList: { name: string; han: number }[] = [];
  // TODO: 单人肉鸽模式不需要完整役种检测，后续可用pattern.ts替代
  battle.detectedYaku = yakuList;

  // 计算番数
  const totalHan = yakuList.reduce((sum, y) => sum + y.han, 0);

  // 计算符数（简化）
  const fu = 20;

  // 计算得分
  const effects = getTotalAmuletEffects(state.player.amuletState);
  const baseScore = battle.floorConfig.baseScore;

  // 应用护身符效果
  const hanWithAmulet = totalHan + effects.hanBonus;
  const score = calculateFinalScore(
    baseScore,
    hanWithAmulet,
    fu,
    state.player.amuletState,
    DEFAULT_SCORE_CONFIG,
    {
      isOya: true,
      isTsumo: true,
      isRiichi: battle.isRiichi,
      isIppatsu: battle.isRiichi && battle.turnCount - battle.riichiTurn <= 1,
      doraCount: battle.doraTiles.length,
    }
  );

  battle.scoreThisBattle = score;

  // 对敌人造成伤害
  const enemyDamage = Math.floor(score / 10);
  battle.enemyHp = Math.max(0, battle.enemyHp - enemyDamage);

  // 星币奖励
  const starCoinGain = Math.floor(score / 50);
  battle.starCoinThisBattle = starCoinGain;

  const newPlayer = {
    ...state.player,
    starCoin: state.player.starCoin + starCoinGain,
    totalScore: state.player.totalScore + score,
  };

  // 检查敌人是否死亡
  if (battle.enemyHp <= 0) {
    battle.phase = 'win';

    // 通关楼层
    const newLevel = clearFloor(state.level);

    return {
      ...state,
      player: newPlayer,
      battle,
      level: newLevel,
      screen: 'result',
      message: `和了！${yakuList.map(y => y.name).join(' ')} ${totalHan}番 ${score}分！敌人受到${enemyDamage}伤害！`,
      history: [...state.history, {
        type: 'win',
        message: `和了 ${score}分`,
        timestamp: Date.now(),
        data: { yaku: yakuList, score, han: totalHan }
      }],
    };
  }

  // 敌人未死，继续战斗（重置手牌）
  battle.phase = 'discard';
  battle.canTsumo = false;
  battle.agariResult = null;

  return {
    ...state,
    player: newPlayer,
    battle,
    message: `和了！${yakuList.map(y => y.name).join(' ')} ${totalHan}番 ${score}分！敌人剩余${battle.enemyHp}HP`,
    history: [...state.history, {
      type: 'win',
      message: `和了 ${score}分`,
      timestamp: Date.now(),
      data: { yaku: yakuList, score, han: totalHan }
    }],
  };
}

// ========== 万能天引 ==========
export function doUniversalDraw(state: GameModeState, targetTileId: TileId): GameModeState {
  if (!state.battle || state.battle.universalDrawsLeft <= 0) {
    return { ...state, message: '万能天引次数已用完' };
  }

  const battle = { ...state.battle };
  const universalTile = createUniversalTile(targetTileId);
  battle.hand = handDraw(battle.hand, universalTile);
  battle.universalDrawsLeft--;
  battle.canUniversalDraw = battle.universalDrawsLeft > 0;

  // 重新计算向听数（使用万能牌感知版本）
  const newUniversalCount = battle.hand.tiles.filter(t => t.id === 'universal').length;
  const shanten = newUniversalCount > 0
    ? calculateShantenWithUniversal(battle.hand.tiles, newUniversalCount)
    : calculateShanten(battle.hand.tiles);
  battle.shanten = shanten;
  battle.tenpaiTiles = getTenpaiTiles(battle.hand);
  battle.canRiichi = shanten.shanten === 0 && !battle.isRiichi;

  return {
    ...state,
    battle,
    message: `万能天引！获得万能牌（当作${targetTileId}使用），剩余${battle.universalDrawsLeft}次`,
    history: [...state.history, {
      type: 'draw',
      message: `万能天引 ${targetTileId}`,
      timestamp: Date.now()
    }],
  };
}

// ========== 商店购买 ==========
export function buyShopItem(state: GameModeState, itemId: string): GameModeState {
  if (!state.shop || state.screen !== 'shop') return state;

  const result = purchaseItem(state.shop, itemId);
  if (!result.purchased) {
    return { ...state, message: result.error || '购买失败' };
  }

  const newPlayer = { ...state.player, starCoin: result.state.starCoin };

  // 处理购买的物品
  if (result.purchased.type === 'amulet' && result.purchased.data) {
    // 添加护身符到背包
    const amulet = result.purchased.data;
    newPlayer.talismans = [...newPlayer.talismans, (amulet as any).id || amulet.id];
  } else if (result.purchased.type === 'heal' && result.purchased.healing) {
    // 使用治疗道具
    const healAmount = Math.floor(newPlayer.maxHp * (result.purchased.healing / 100));
    newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + healAmount);
  } else if (result.purchased.type === 'seal' && result.purchased.data) {
    // 添加印章（简化处理）
    const seal = result.purchased.data;
    newPlayer.talismans = [...newPlayer.talismans, (seal as any).id || seal.id];
  }

  return {
    ...state,
    player: newPlayer,
    shop: result.state,
    message: `购买了 ${result.purchased.name}！`,
    history: [...state.history, {
      type: 'shop',
      message: `购买 ${result.purchased.name}`,
      timestamp: Date.now()
    }],
  };
}

// ========== 刷新商店 ==========
export function refreshShopItems(state: GameModeState): GameModeState {
  if (!state.shop || state.screen !== 'shop') return state;

  const floor = state.level.currentFloor;
  const newShop = refreshShop(state.shop, floor);

  return {
    ...state,
    shop: newShop,
    message: `商店已刷新（花费${state.shop.refreshCost}星币）`,
  };
}

// ========== 离开商店/结果画面，返回楼层选择 ==========
export function returnToFloorSelect(state: GameModeState): GameModeState {
  const newLevel = enterNextFloor(state.level);

  return {
    ...state,
    screen: 'floor_select',
    battle: null,
    shop: null,
    level: newLevel,
    message: `准备进入第${newLevel.currentFloor}层`,
  };
}

// ========== 获取当前状态摘要 ==========
export function getGameSummary(state: GameModeState): string {
  const parts: string[] = [];
  parts.push(`HP: ${state.player.hp}/${state.player.maxHp}`);
  parts.push(`星币: ${state.player.starCoin}`);
  parts.push(`总分: ${state.player.totalScore}`);
  parts.push(`层数: ${state.level.currentFloor}/${state.level.maxFloor}`);

  if (state.battle) {
    const b = state.battle;
    parts.push(`向听: ${b.shanten?.shanten ?? '?'}`);
    parts.push(`敌人HP: ${b.enemyHp}/${b.enemyMaxHp}`);
    parts.push(`回合: ${b.turnCount}`);
  }

  return parts.join(' | ');
}

// ========== 存档/读档 ==========
export function serializeGame(state: GameModeState): string {
  return JSON.stringify({
    ...state,
    level: {
      ...state.level,
      clearedFloors: Array.from(state.level.clearedFloors),
    },
  });
}

export function deserializeGame(json: string): GameModeState {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    level: {
      ...parsed.level,
      clearedFloors: new Set(parsed.level.clearedFloors),
    },
  };
}
