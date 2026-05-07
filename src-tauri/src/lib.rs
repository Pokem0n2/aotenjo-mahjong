/**
 * lib.rs - Tauri应用入口
 * 整合所有Rust模块
 */

pub mod mahjong;
pub mod game_state;
pub mod commands;

use tauri::generate_handler;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(generate_handler![
            // 麻将核心命令
            commands::cmd_create_deck,
            commands::cmd_deal_hands,
            commands::cmd_check_agari,
            commands::cmd_calculate_shanten,
            commands::cmd_find_waits,
            commands::cmd_shanten_with_universal,
            commands::cmd_draw_specific,
            commands::cmd_get_dora,
            
            // 游戏状态命令
            commands::cmd_create_save,
            commands::cmd_serialize_save,
            commands::cmd_deserialize_save,
            
            // 工具命令
            commands::cmd_get_tile_name,
            commands::cmd_get_tile_names,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
