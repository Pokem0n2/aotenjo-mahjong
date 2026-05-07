/**
 * commands.rs - Tauri IPC命令接口
 * 前端通过 invoke 调用这些Rust函数
 */

use tauri::command;
use crate::mahjong::*;
use crate::game_state::*;

// ========== 麻将核心命令 ==========

/// 创建并洗牌
#[command]
pub fn cmd_create_deck() -> Vec<TileId> {
    create_deck()
}

/// 发牌
#[command]
pub fn cmd_deal_hands(mut deck: Vec<TileId>) -> Vec<Vec<TileId>> {
    deal_hands(&mut deck)
}

/// 胡牌判定
#[command]
pub fn cmd_check_agari(hand: Vec<TileId>) -> AgariResult {
    is_agari(&hand)
}

/// 向听数计算
#[command]
pub fn cmd_calculate_shanten(hand: Vec<TileId>) -> ShantenResult {
    calculate_shanten(&hand)
}

/// 听牌检测
#[command]
pub fn cmd_find_waits(hand: Vec<TileId>) -> Vec<TileId> {
    find_waits(&hand)
}

/// 万能牌向听数
#[command]
pub fn cmd_shanten_with_universal(hand: Vec<TileId>, universal_count: u8) -> ShantenResult {
    shanten_with_universal(&hand, universal_count)
}

/// 万能天引 - 从牌山抽取指定牌
#[command]
pub fn cmd_draw_specific(deck: Vec<TileId>, target: TileId) -> Option<TileId> {
    let mut d = deck;
    draw_specific(&mut d, target)
}

/// 获取宝牌
#[command]
pub fn cmd_get_dora(indicator: TileId) -> TileId {
    get_dora(indicator)
}

// ========== 游戏状态命令 ==========

/// 创建新存档
#[command]
pub fn cmd_create_save(slot_id: i32) -> GameSave {
    create_new_save(slot_id)
}

/// 序列化存档
#[command]
pub fn cmd_serialize_save(save: GameSave) -> Result<String, String> {
    serde_json::to_string(&save)
        .map_err(|e| format!("序列化失败: {}", e))
}

/// 反序列化存档
#[command]
pub fn cmd_deserialize_save(json: String) -> Result<GameSave, String> {
    serde_json::from_str(&json)
        .map_err(|e| format!("反序列化失败: {}", e))
}

/// 获取牌名称
#[command]
pub fn cmd_get_tile_name(tile_id: TileId) -> String {
    if tile_id < 34 {
        TILE_NAMES[tile_id as usize].to_string()
    } else {
        "未知".to_string()
    }
}

/// 批量获取牌名称
#[command]
pub fn cmd_get_tile_names(tile_ids: Vec<TileId>) -> Vec<String> {
    tile_ids.iter()
        .map(|&id| cmd_get_tile_name(id))
        .collect()
}
