/**
 * mahjong.rs - Rust高性能麻将核心
 * 胡牌判定、向听数计算、牌型分析
 */

use serde::{Deserialize, Serialize};

/// 麻将牌ID (0-33)
/// 0-8: 万子(1m-9m), 9-17: 筒子(1p-9p), 18-26: 索子(1s-9s), 27-33: 字牌(1z-7z)
pub type TileId = u8;

/// 34种牌的标准名称
pub const TILE_NAMES: [&str; 34] = [
    "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m",
    "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p",
    "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s",
    "1z", "2z", "3z", "4z", "5z", "6z", "7z",
];

/// 手牌计数 (34维数组)
pub type TileCounts = [u8; 34];

/// 和了形态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WinForm {
    Standard,    // 一般型 (4面子+1雀头)
    Chiitoitsu,  // 七对子
    Kokushi,     // 国士无双
}

/// 胡牌结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgariResult {
    pub is_agari: bool,
    pub form: Option<WinForm>,
    pub pair_tile: Option<TileId>,
    pub waits: Vec<TileId>,
}

/// 向听数结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShantenResult {
    pub shanten: i8,  // -1=和了, 0=听牌, 1+=向听
    pub standard: i8,
    pub chiitoitsu: i8,
    pub kokushi: i8,
}

/// 创建空计数数组
pub fn empty_counts() -> TileCounts {
    [0; 34]
}

/// 手牌转计数数组
pub fn hand_to_counts(hand: &[TileId]) -> TileCounts {
    let mut counts = empty_counts();
    for &tile in hand {
        if tile < 34 {
            counts[tile as usize] += 1;
        }
    }
    counts
}

/// 检查一般型胡牌 (4面子+1雀头)
pub fn check_standard(counts: &mut TileCounts) -> bool {
    // 尝试每种牌作为雀头
    for pair in 0..34 {
        if counts[pair] >= 2 {
            counts[pair] -= 2;
            if find_mentsu(counts, 0, 4) {
                counts[pair] += 2;
                return true;
            }
            counts[pair] += 2;
        }
    }
    false
}

/// 递归寻找面子 (刻子或顺子)
fn find_mentsu(counts: &mut TileCounts, idx: usize, needed: i32) -> bool {
    if needed == 0 {
        return counts.iter().all(|&c| c == 0);
    }
    
    let mut i = idx;
    while i < 34 && counts[i] == 0 {
        i += 1;
    }
    if i >= 34 {
        return false;
    }
    
    // 尝试刻子
    if counts[i] >= 3 {
        counts[i] -= 3;
        if find_mentsu(counts, i, needed - 1) {
            counts[i] += 3;
            return true;
        }
        counts[i] += 3;
    }
    
    // 尝试顺子 (仅数牌)
    if i < 27 && i % 9 < 7 && counts[i + 1] > 0 && counts[i + 2] > 0 {
        counts[i] -= 1;
        counts[i + 1] -= 1;
        counts[i + 2] -= 1;
        if find_mentsu(counts, i, needed - 1) {
            counts[i] += 1;
            counts[i + 1] += 1;
            counts[i + 2] += 1;
            return true;
        }
        counts[i] += 1;
        counts[i + 1] += 1;
        counts[i + 2] += 1;
    }
    
    false
}

/// 检查七对子
pub fn check_chiitoitsu(counts: &TileCounts) -> bool {
    let mut pairs = 0;
    let mut singles = 0;
    for &c in counts.iter() {
        if c >= 2 {
            pairs += 1;
        } else if c == 1 {
            singles += 1;
        }
    }
    pairs == 7 || (pairs == 6 && singles == 1)
}

/// 检查国士无双
pub fn check_kokushi(counts: &TileCounts) -> bool {
    // 幺九牌索引: 0,8,9,17,18,26,27,28,29,30,31,32,33
    let yaochu = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
    let mut has_all = true;
    let mut has_pair = false;
    
    for &idx in &yaochu {
        if counts[idx] == 0 {
            has_all = false;
        }
        if counts[idx] >= 2 {
            has_pair = true;
        }
    }
    
    // 13面听: 全部13种幺九牌各1张
    let thirteen_wait = yaochu.iter().all(|&i| counts[i] == 1);
    
    // 标准国士: 12种各1张 + 1种2张
    let standard = has_all && has_pair;
    
    thirteen_wait || standard
}

/// 综合胡牌判定
pub fn is_agari(hand: &[TileId]) -> AgariResult {
    let mut counts = hand_to_counts(hand);
    let total: u8 = counts.iter().sum();
    
    if total != 14 {
        return AgariResult {
            is_agari: false,
            form: None,
            pair_tile: None,
            waits: vec![],
        };
    }
    
    // 检查国士无双
    if check_kokushi(&counts) {
        return AgariResult {
            is_agari: true,
            form: Some(WinForm::Kokushi),
            pair_tile: None,
            waits: vec![],
        };
    }
    
    // 检查七对子
    if check_chiitoitsu(&counts) {
        return AgariResult {
            is_agari: true,
            form: Some(WinForm::Chiitoitsu),
            pair_tile: None,
            waits: vec![],
        };
    }
    
    // 检查一般型
    if check_standard(&mut counts) {
        return AgariResult {
            is_agari: true,
            form: Some(WinForm::Standard),
            pair_tile: None,
            waits: vec![],
        };
    }
    
    AgariResult {
        is_agari: false,
        form: None,
        pair_tile: None,
        waits: vec![],
    }
}

/// 一般型向听数计算
pub fn standard_shanten(counts: &mut TileCounts) -> i8 {
    let mut min_shanten = 8i8;
    
    // 尝试每种雀头
    for pair in 0..34 {
        if counts[pair] >= 2 {
            counts[pair] -= 2;
            let s = find_mentsu_shanten(counts, 0, 0, 0);
            min_shanten = min_shanten.min(s - 1);
            counts[pair] += 2;
        }
    }
    
    // 无雀头
    let s = find_mentsu_shanten(counts, 0, 0, 0);
    min_shanten.min(s)
}

/// 递归计算向听数
fn find_mentsu_shanten(counts: &mut TileCounts, idx: usize, melds: i32, tatsu: i32) -> i8 {
    let mut i = idx;
    while i < 34 && counts[i] == 0 {
        i += 1;
    }
    
    if i >= 34 {
        return (8 - 2 * melds - tatsu) as i8;
    }
    
    let mut min_s = (8 - 2 * melds) as i8;
    
    // 刻子
    if counts[i] >= 3 {
        counts[i] -= 3;
        min_s = min_s.min(find_mentsu_shanten(counts, i, melds + 1, tatsu));
        counts[i] += 3;
    }
    
    // 顺子
    if i < 27 && i % 9 < 7 && counts[i + 1] > 0 && counts[i + 2] > 0 {
        counts[i] -= 1;
        counts[i + 1] -= 1;
        counts[i + 2] -= 1;
        min_s = min_s.min(find_mentsu_shanten(counts, i, melds + 1, tatsu));
        counts[i] += 1;
        counts[i + 1] += 1;
        counts[i + 2] += 1;
    }
    
    // 对子 (搭子)
    if counts[i] >= 2 {
        counts[i] -= 2;
        min_s = min_s.min(find_mentsu_shanten(counts, i, melds, tatsu + 1));
        counts[i] += 2;
    }
    
    // 两面/坎张搭子
    if i < 27 && i % 9 < 8 && counts[i + 1] > 0 {
        counts[i] -= 1;
        counts[i + 1] -= 1;
        min_s = min_s.min(find_mentsu_shanten(counts, i, melds, tatsu + 1));
        counts[i] += 1;
        counts[i + 1] += 1;
    }
    
    // 边张搭子
    if i < 27 && i % 9 < 7 && counts[i + 2] > 0 {
        counts[i] -= 1;
        counts[i + 2] -= 1;
        min_s = min_s.min(find_mentsu_shanten(counts, i, melds, tatsu + 1));
        counts[i] += 1;
        counts[i + 2] += 1;
    }
    
    min_s
}

/// 七对子向听数
pub fn chiitoitsu_shanten(counts: &TileCounts) -> i8 {
    let mut pairs = 0;
    let mut kinds = 0;
    for &c in counts.iter() {
        if c > 0 {
            kinds += 1;
            if c >= 2 {
                pairs += 1;
            }
        }
    }
    (6 - pairs + (7 - kinds).max(0)) as i8
}

/// 国士无双向听数
pub fn kokushi_shanten(counts: &TileCounts) -> i8 {
    let yaochu = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
    let mut has = 0;
    let mut pair = 0;
    
    for &idx in &yaochu {
        if counts[idx] > 0 {
            has += 1;
        }
        if counts[idx] >= 2 {
            pair = 1;
        }
    }
    
    (13 - has - pair) as i8
}

/// 综合向听数计算
pub fn calculate_shanten(hand: &[TileId]) -> ShantenResult {
    let mut counts = hand_to_counts(hand);
    let total: u8 = counts.iter().sum();
    
    // 标准向听数需要13或14张牌
    let std = if total >= 13 {
        standard_shanten(&mut counts)
    } else {
        99
    };
    
    let chiitoi = chiitoitsu_shanten(&counts);
    let kokushi = kokushi_shanten(&counts);
    
    let min_shanten = std.min(chiitoi).min(kokushi);
    
    ShantenResult {
        shanten: min_shanten,
        standard: std,
        chiitoitsu,
        kokushi,
    }
}

/// 听牌检测 - 返回所有听的牌
pub fn find_waits(hand: &[TileId]) -> Vec<TileId> {
    let mut waits = vec![];
    let base_counts = hand_to_counts(hand);
    
    for test_tile in 0..34u8 {
        let mut counts = base_counts;
        counts[test_tile as usize] += 1;
        
        let total: u8 = counts.iter().sum();
        if total != 14 {
            continue;
        }
        
        // 检查是否胡牌
        let mut test_counts = counts;
        if check_standard(&mut test_counts) || check_chiitoitsu(&counts) || check_kokushi(&counts) {
            waits.push(test_tile);
        }
    }
    
    waits
}

/// 万能牌向听数计算 (支持万能牌作为任意牌)
pub fn shanten_with_universal(hand: &[TileId], universal_count: u8) -> ShantenResult {
    if universal_count == 0 {
        return calculate_shanten(hand);
    }
    
    // 尝试将万能牌当作每种牌，取最小向听数
    let mut min_shanten = ShantenResult {
        shanten: 99,
        standard: 99,
        chiitoitsu: 99,
        kokushi: 99,
    };
    
    for tile_type in 0..34u8 {
        let mut test_hand: Vec<TileId> = hand.iter()
            .filter(|&&t| t != 255) // 255表示万能牌
            .copied()
            .collect();
        
        // 添加万能牌替代
        for _ in 0..universal_count {
            test_hand.push(tile_type);
        }
        
        let result = calculate_shanten(&test_hand);
        if result.shanten < min_shanten.shanten {
            min_shanten = result;
        }
    }
    
    min_shanten
}

/// 牌山创建与洗牌
pub fn create_deck() -> Vec<TileId> {
    let mut deck = Vec::with_capacity(136);
    for tile in 0..34u8 {
        for _ in 0..4 {
            deck.push(tile);
        }
    }
    
    // Fisher-Yates shuffle
    use rand::seq::SliceRandom;
    use rand::thread_rng;
    deck.shuffle(&mut thread_rng());
    
    deck
}

/// 发牌 (4人，每人13张，庄家14张)
pub fn deal_hands(deck: &mut Vec<TileId>) -> Vec<Vec<TileId>> {
    let mut hands: Vec<Vec<TileId>> = vec![vec![]; 4];
    
    for round in 0..3 {
        for player in 0..4 {
            for _ in 0..4 {
                if let Some(tile) = deck.pop() {
                    hands[player].push(tile);
                }
            }
        }
    }
    
    // 庄家多一张
    if let Some(tile) = deck.pop() {
        hands[0].push(tile);
    }
    
    hands
}

/// 万能天引 - 从牌山抽取指定牌
pub fn draw_specific(deck: &mut Vec<TileId>, target: TileId) -> Option<TileId> {
    if let Some(pos) = deck.iter().position(|&t| t == target) {
        Some(deck.remove(pos))
    } else {
        None
    }
}

/// 获取宝牌 (根据指示牌)
pub fn get_dora(indicator: TileId) -> TileId {
    if indicator < 27 {
        // 数牌: 循环+1 (9变1)
        let suit_base = indicator / 9 * 9;
        let value = indicator % 9;
        if value == 8 {
            suit_base
        } else {
            indicator + 1
        }
    } else {
        // 字牌: 东南西北循环，白发中循环
        match indicator {
            27 => 28, // 东->南
            28 => 29, // 南->西
            29 => 30, // 西->北
            30 => 27, // 北->东
            31 => 32, // 白->发
            32 => 33, // 发->中
            33 => 31, // 中->白
            _ => indicator,
        }
    }
}
