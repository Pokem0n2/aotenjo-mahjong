/**
 * game_state.rs - 游戏状态管理
 * 序列化/反序列化、状态持久化
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 玩家数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerData {
    pub name: String,
    pub score: i32,
    pub star_coins: i32,
    pub total_score: i64,
    pub highest_floor: i32,
    pub wins: i32,
    pub losses: i32,
}

/// 护身符存档数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AmuletSaveData {
    pub id: String,
    pub stack_count: i32,
    pub seal_ids: Vec<String>,
}

/// 关卡存档数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LevelSaveData {
    pub current_floor: i32,
    pub max_floor: i32,
    pub cleared_floors: Vec<i32>,
    pub difficulty: f32,
}

/// 游戏存档
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSave {
    pub version: String,
    pub slot_id: i32,
    pub player: PlayerData,
    pub amulets: Vec<AmuletSaveData>,
    pub level: LevelSaveData,
    pub settings: GameSettings,
    pub timestamp: i64,
}

/// 游戏设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSettings {
    pub bgm_volume: f32,
    pub se_volume: f32,
    pub screen_scale: f32,
    pub auto_save: bool,
    pub show_tutorial: bool,
}

impl Default for GameSettings {
    fn default() -> Self {
        GameSettings {
            bgm_volume: 0.5,
            se_volume: 0.7,
            screen_scale: 1.0,
            auto_save: true,
            show_tutorial: true,
        }
    }
}

/// 创建新存档
pub fn create_new_save(slot_id: i32) -> GameSave {
    GameSave {
        version: "0.1.0".to_string(),
        slot_id,
        player: PlayerData {
            name: format!("玩家{}", slot_id),
            score: 25000,
            star_coins: 0,
            total_score: 0,
            highest_floor: 0,
            wins: 0,
            losses: 0,
        },
        amulets: vec![],
        level: LevelSaveData {
            current_floor: 1,
            max_floor: 25,
            cleared_floors: vec![],
            difficulty: 1.0,
        },
        settings: GameSettings::default(),
        timestamp: 0,
    }
}

/// 游戏状态管理器
pub struct GameStateManager {
    saves: HashMap<i32, GameSave>,
    current_slot: Option<i32>,
}

impl GameStateManager {
    pub fn new() -> Self {
        GameStateManager {
            saves: HashMap::new(),
            current_slot: None,
        }
    }

    pub fn load_save(&mut self, slot_id: i32) -> Option<&GameSave> {
        self.saves.get(&slot_id)
    }

    pub fn save_game(&mut self, save: GameSave) {
        self.saves.insert(save.slot_id, save);
    }

    pub fn get_current_save(&self) -> Option<&GameSave> {
        self.current_slot.and_then(|slot| self.saves.get(&slot))
    }

    pub fn set_current_slot(&mut self, slot_id: i32) {
        self.current_slot = Some(slot_id);
    }

    /// 序列化存档为JSON
    pub fn serialize_save(&self, slot_id: i32) -> Option<String> {
        self.saves.get(&slot_id)
            .and_then(|save| serde_json::to_string(save).ok())
    }

    /// 从JSON反序列化存档
    pub fn deserialize_save(&mut self, json: &str) -> Result<GameSave, String> {
        serde_json::from_str(json)
            .map_err(|e| format!("反序列化失败: {}", e))
    }
}
