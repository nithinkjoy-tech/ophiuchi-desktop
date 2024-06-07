// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "macos")]
mod mac;

use std::env;

#[cfg(target_os = "macos")]
use mac::mac_main;

fn main() {
  let _ = fix_path_env::fix();

  let client = sentry_tauri::sentry::init((
    "https://4dba3631eee3b1e7aeec29ba11fdfb84@o4504409717800960.ingest.sentry.io/4506153853255680",
    sentry_tauri::sentry::ClientOptions {
      release: sentry_tauri::sentry::release_name!(),
      ..Default::default()
    },
  ));

  // Everything before here runs in both app and crash reporter processes
  let _guard = sentry_tauri::minidump::init(&client);
  // Everything after here runs in only the app process

  #[cfg(target_os = "macos")]
  fn get_macos_handlers() -> Vec<tauri::InvokeHandler> {
      vec![
          tauri::generate_handler![mac::check_docker_installed],
          tauri::generate_handler![mac::add_cert_to_keychain],
          tauri::generate_handler![mac::remove_cert_from_keychain],
          tauri::generate_handler![mac::add_line_to_hosts],
          tauri::generate_handler![mac::delete_line_from_hosts],
      ]
  }

  tauri::Builder::default()
    .plugin(sentry_tauri::plugin())
    .invoke_handler(get_macos_handlers())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
  // tauri::Builder::default()
  //   .plugin(sentry_tauri::plugin())
  //   .invoke_handler(tauri::generate_handler![
  //     #[cfg(target_os = "macos")] check_docker_installed,
  //     #[cfg(target_os = "macos")] add_cert_to_keychain,
  //     #[cfg(target_os = "macos")] remove_cert_from_keychain,
  //     #[cfg(target_os = "macos")] add_line_to_hosts,
  //     #[cfg(target_os = "macos")] delete_line_from_hosts,
  //     keychain_passwords::save_password,
  //     keychain_passwords::get_password,
  //     keychain_passwords::delete_password,
  //   ])
  //   .run(tauri::generate_context!())
  //   .expect("error while running tauri application");
}


