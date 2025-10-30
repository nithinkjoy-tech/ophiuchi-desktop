// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod keychainmgr;

use dotenv::dotenv;
// use keychainmgr::keychain_passwords;
use regex;
use std::env;
use std::fs::File;
use std::io::{self, prelude::*};
use std::process::Command;
use tauri_plugin_sentry::{minidump, sentry};

#[tauri::command]
fn get_env(name: &str) -> String {
    std::env::var(String::from(name)).unwrap_or(String::from(""))
}

#[tauri::command(rename_all = "snake_case")]
fn add_line_to_hosts(hostname: String, password: String) {
    let line_to_add = format!("127.0.0.1 {}", hostname);

    if !host_line_exists(&line_to_add) {
        #[cfg(target_os = "windows")]
        append_to_hosts_windows(&line_to_add);

        #[cfg(not(target_os = "windows"))]
        append_to_hosts_with_sudo(&line_to_add, &password);
    } else {
        println!("Line already exists in hosts file: {}", line_to_add);
    }
}

#[tauri::command(rename_all = "snake_case")]
fn delete_line_from_hosts(hostname: String, password: String) {
    backup_hosts_file(&password);
    find_and_delete_line_hosts(&hostname, &password);
}

fn find_and_delete_line_hosts(hostname: &str, password: &str) {
    #[cfg(target_os = "windows")]
    {
        let hosts_path = r"C:\Windows\System32\drivers\etc\hosts";
        let escaped_hostname = regex::escape(hostname);
        
        // Read current hosts file
        if let Ok(content) = std::fs::read_to_string(hosts_path) {
            let new_content: Vec<String> = content
                .lines()
                .filter(|line| {
                    let re = regex::Regex::new(&format!(r"^127\.0\.0\.1\s+{}\s*$", escaped_hostname)).unwrap();
                    !re.is_match(line.trim())
                })
                .map(|s| s.to_string())
                .collect();
            
            // Write back using PowerShell with admin rights
            let new_content_str = new_content.join("\n");
            let ps_command = format!(
                "$content = @'\n{}\n'@; Set-Content -Path '{}' -Value $content -Force",
                new_content_str, hosts_path
            );
            
            let status = Command::new("powershell")
                .arg("-Command")
                .arg(&format!("Start-Process powershell -Verb RunAs -ArgumentList '-Command', '{}' -Wait", ps_command.replace("'", "''")))
                .status();
            
            match status {
                Ok(s) if s.success() => println!("Hostname {} deleted from hosts file", hostname),
                _ => eprintln!("Error deleting hostname from hosts file."),
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let escaped_hostname = regex::escape(hostname);
        let sed_command = format!(
            "echo '{}' | sudo -S sed -i '' '/^127\\.0\\.0\\.1[[:space:]]*{}$/d' /etc/hosts",
            password, escaped_hostname
        );

        let status = Command::new("sh")
            .arg("-c")
            .arg(sed_command)
            .status()
            .expect("Failed to run shell command");

        if status.success() {
            println!("Hostname {} deleted from /etc/hosts", hostname);
        } else {
            eprintln!("Error deleting hostname from /etc/hosts.");
        }
    }
}

fn host_line_exists(line: &str) -> bool {
    if let Ok(hosts) = read_hosts_file() {
        for host in hosts.lines() {
            if host.trim() == line.trim() {
                return true;
            }
        }
    }
    false
}

fn read_hosts_file() -> io::Result<String> {
    #[cfg(target_os = "windows")]
    let path = r"C:\Windows\System32\drivers\etc\hosts";

    #[cfg(not(target_os = "windows"))]
    let path = "/etc/hosts";

    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

fn backup_hosts_file(password: &str) {
    let cur_day = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();

    #[cfg(target_os = "windows")]
    {
        if let Some(user_profile) = env::var_os("USERPROFILE") {
            if let Some(profile_str) = user_profile.to_str() {
                let backup_dir = format!("{}\\ophiuchi.hosts.bak\\", profile_str);
                
                // Create directory
                let _ = std::fs::create_dir_all(&backup_dir);
                
                let backup_path = format!("{}hosts.bak.{}", backup_dir, cur_day);
                let hosts_path = r"C:\Windows\System32\drivers\etc\hosts";
                
                // Copy hosts file
                match std::fs::copy(hosts_path, &backup_path) {
                    Ok(_) => println!("Backup created: {}", backup_path),
                    Err(e) => eprintln!("Error creating backup: {}", e),
                }
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        if let Some(home_dir) = env::var_os("HOME") {
            if let Some(home_dir_str) = home_dir.to_str() {
                let backup_dir = format!("{}/ophiuchi.hosts.bak/", home_dir_str);
                let mkdir_command = format!("mkdir -p {}", backup_dir);
                let status = Command::new("sh")
                    .arg("-c")
                    .arg(mkdir_command)
                    .status()
                    .expect("Failed to run shell command");

                if status.success() {
                    println!("Backup directory created: {}", backup_dir);
                    let backup_command = format!(
                        "echo '{}' | sudo -S -- sh -c 'cp /etc/hosts {}/hosts.bak.{}'",
                        password, backup_dir, cur_day
                    );
                    let status = Command::new("sh")
                        .arg("-c")
                        .arg(backup_command)
                        .status()
                        .expect("Failed to run shell command");

                    if status.success() {
                        println!("Backup of /etc/hosts created.");
                    } else {
                        eprintln!("Error creating backup of /etc/hosts.");
                    }
                } else {
                    eprintln!("Error creating backup directory.");
                }
            }
        }
    }
}

#[cfg(target_os = "windows")]
fn append_to_hosts_windows(line: &str) {
    let hosts_path = r"C:\Windows\System32\drivers\etc\hosts";
    
    // PowerShell command to append with admin rights
    let ps_command = format!(
        "Add-Content -Path '{}' -Value '{}' -Force",
        hosts_path, line
    );
    
    let status = Command::new("powershell")
        .arg("-Command")
        .arg(&format!("Start-Process powershell -Verb RunAs -ArgumentList '-Command', '{}' -Wait", ps_command.replace("'", "''")))
        .status();
    
    match status {
        Ok(s) if s.success() => println!("Line added to hosts file: {}", line),
        _ => eprintln!("Error appending to hosts file."),
    }
}

#[cfg(not(target_os = "windows"))]
fn append_to_hosts_with_sudo(line: &str, password: &str) {
    backup_hosts_file(password);

    let append_command = format!(
        "echo '{}' | sudo -S -- sh -c 'echo \"{}\" >> /etc/hosts'",
        password, line
    );

    let status = Command::new("sh")
        .arg("-c")
        .arg(append_command)
        .status()
        .expect("Failed to run shell command");

    if status.success() {
        println!("Line added to /etc/hosts: {}", line);
    } else {
        eprintln!("Error appending to /etc/hosts.");
    }
}

#[tauri::command(rename_all = "snake_case")]
fn add_cert_to_keychain(pem_file_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // Import certificate to Windows certificate store
        let ps_command = format!(
            "Import-Certificate -FilePath '{}' -CertStoreLocation Cert:\\CurrentUser\\Root",
            pem_file_path
        );

        let output = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(&format!("Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile', '-Command', '{}' -Wait", ps_command.replace("'", "''")))
            .output()
            .map_err(|e| format!("Failed to execute command: {}", e))?;

        if output.status.success() {
            println!("Certificate added successfully.");
            Ok(())
        } else {
            Err(format!("Error adding certificate: {}", String::from_utf8_lossy(&output.stderr)))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        if let Some(home_dir) = env::var_os("HOME") {
            if let Some(home_dir_str) = home_dir.to_str() {
                let keychain_path = format!("{}/Library/Keychains/login.keychain-db", home_dir_str);

                let mut command = Command::new("security");
                command
                    .arg("add-trusted-cert")
                    .arg("-k")
                    .arg(&keychain_path)
                    .arg(&pem_file_path);

                let output = command.output().expect("Failed to execute command");

                if output.status.success() {
                    println!("Certificate added successfully.");
                    Ok(())
                } else {
                    eprintln!("Error: {:?}", output);
                    Err("Error adding certificate: reason: ".to_string()
                        + &String::from_utf8_lossy(&output.stderr))
                }
            } else {
                eprintln!("Failed to convert home directory to string.");
                Err("Failed to convert home directory to string".to_string())
            }
        } else {
            eprintln!("Home directory not found.");
            Err("Home directory not found".to_string())
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
fn remove_cert_from_keychain(name: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let ps_command = format!(
            "$cert = Get-ChildItem -Path Cert:\\CurrentUser\\Root | Where-Object {{ $_.Subject -like '*{}*' }} | Select-Object -First 1; if ($cert) {{ Remove-Item -Path $cert.PSPath -Force }}",
            name
        );

        let output = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(&format!("Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile', '-Command', '{}' -Wait", ps_command.replace("'", "''")))
            .output()
            .map_err(|e| format!("Failed to execute command: {}", e))?;

        if output.status.success() {
            println!("Certificate removed successfully.");
            Ok(())
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("Failed to remove certificate: {}", error))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let home_dir = env::var_os("HOME").ok_or_else(|| "Home directory not found.".to_string())?;
        let home_dir_str = home_dir
            .to_str()
            .ok_or_else(|| "Failed to convert home directory to string.".to_string())?;

        let keychain_path = format!("{}/Library/Keychains/login.keychain-db", home_dir_str);

        let find_command = format!(
            "security find-certificate -c '{}' -Z | grep SHA-1 | awk '{{print $NF}}'",
            name
        );

        let hash_output = Command::new("sh")
            .arg("-c")
            .arg(&find_command)
            .output()
            .map_err(|e| format!("Failed to execute find command: {}", e))?;

        if !hash_output.status.success() {
            return Err("Certificate not found".to_string());
        }

        let hash = String::from_utf8_lossy(&hash_output.stdout)
            .trim()
            .to_string();
        if hash.is_empty() {
            return Err("Certificate not found".to_string());
        }

        let delete_command = format!("security delete-certificate -Z '{}'", hash);

        let output = Command::new("sh")
            .arg("-c")
            .arg(&delete_command)
            .output()
            .map_err(|e| format!("Failed to execute delete command: {}", e))?;

        if output.status.success() {
            println!("Certificate removed successfully.");
            Ok(())
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("Failed to remove certificate: {}", error))
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
fn cert_exist_on_keychain(name: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let command = format!(
            "Get-ChildItem -Path Cert:\\CurrentUser\\Root | Where-Object {{ $_.Subject -like '*{}*' }}",
            name
        );

        let output = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-NonInteractive")
            .arg("-Command")
            .arg(&command)
            .output()
            .map_err(|e| format!("Failed to execute command: {}", e))?;

        if output.status.success() {
            let result = String::from_utf8_lossy(&output.stdout);
            let exists = !result.trim().is_empty();
            println!("Certificate {} on certificate store.", if exists { "found" } else { "not found" });
            Ok(exists)
        } else {
            println!("Certificate not found on certificate store.");
            Ok(false)
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let mut command = Command::new("security");
        command
            .arg("find-certificate")
            .arg("-c")
            .arg(name)
            .arg("-Z");

        let output = command.output().expect("Failed to execute command");

        if output.status.success() {
            println!("Certificate found on keychain.");
            Ok(true)
        } else {
            println!("Certificate not found on keychain.");
            Ok(false)
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
fn check_docker_installed() -> Result<bool, String> {
    let output = Command::new("docker").arg("--version").output();

    match output {
        Ok(output) => {
            if output.status.success() {
                Ok(true)
            } else {
                Ok(false)
            }
        }
        Err(err) => Err(format!("Failed to execute command: {}", err)),
    }
}

#[tauri::command(rename_all = "snake_case")]
fn open_finder_or_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    let output = Command::new("explorer").arg(path.clone()).output();

    #[cfg(not(target_os = "windows"))]
    let output = Command::new("open").arg(path.clone()).output();

    match output {
        Ok(output) => {
            if output.status.success() {
                Ok(())
            } else {
                Err(format!("Failed to open path: {}", path))
            }
        }
        Err(err) => Err(format!("Failed to execute command: {}", err)),
    }
}

#[tauri::command(rename_all = "snake_case")]
fn check_host_exists(hostname: String) -> Result<bool, String> {
    let line_to_check = format!("127.0.0.1 {}", hostname);

    match read_hosts_file() {
        Ok(hosts_content) => {
            let exists = hosts_content
                .lines()
                .filter(|line| !line.trim().starts_with('#'))
                .any(|line| line.trim() == line_to_check.trim());
            Ok(exists)
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command(rename_all = "snake_case")]
fn get_hosts_file_context() -> Result<String, String> {
    match read_hosts_file() {
        Ok(hosts_content) => Ok(hosts_content),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command(rename_all = "snake_case")]
fn find_certificates(name: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let command = format!(
            "Get-ChildItem -Path Cert:\\CurrentUser\\Root | Where-Object {{ $_.Subject -like '*{}*' }} | Format-List Subject, Thumbprint, NotAfter, NotBefore, Issuer",
            name
        );

        let output = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-NonInteractive")
            .arg("-Command")
            .arg(&command)
            .output()
            .map_err(|e| format!("Failed to execute find command: {}", e))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(format!("Failed to find certificates: {}", error));
        }

        let result = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(result)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let command = format!("security find-certificate -a -c {} -Z", name);

        let output = Command::new("sh")
            .arg("-c")
            .arg(&command)
            .output()
            .map_err(|e| format!("Failed to execute find command: {}", e))?;

        if !output.status.success() {
            return Err("Failed to find certificates".to_string());
        }

        let result = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(result)
    }
}

#[tauri::command(rename_all = "snake_case")]
fn remove_cert_by_sha1(sha1: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // On Windows, use thumbprint to remove certificate
        let ps_command = format!(
            "$cert = Get-ChildItem -Path Cert:\\CurrentUser\\Root | Where-Object {{ $_.Thumbprint -eq '{}' }}; if ($cert) {{ Remove-Item -Path $cert.PSPath -Force }}",
            sha1
        );

        let output = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-Command")
            .arg(&format!("Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile', '-Command', '{}' -Wait", ps_command.replace("'", "''")))
            .output()
            .map_err(|e| format!("Failed to execute delete command: {}", e))?;

        if output.status.success() {
            println!("Certificate removed successfully.");
            Ok(())
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("Failed to remove certificate: {}", error))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let delete_command = format!("security delete-certificate -Z '{}'", sha1);

        let output = Command::new("sh")
            .arg("-c")
            .arg(&delete_command)
            .output()
            .map_err(|e| format!("Failed to execute delete command: {}", e))?;

        if output.status.success() {
            println!("Certificate removed successfully.");
            Ok(())
        } else {
            let error = String::from_utf8_lossy(&output.stderr);
            Err(format!("Failed to remove certificate: {}", error))
        }
    }
}

fn main() {
    dotenv().ok();
    let _ = fix_path_env::fix();
    let sentry_dsn = std::env::var("SENTRY_DSN");
    let mut builder = tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        });

    if sentry_dsn.is_ok() {
        println!("Sentry DSN found: {}", sentry_dsn.clone().unwrap());

        let client = sentry::init((
            sentry_dsn.unwrap(),
            sentry::ClientOptions {
                release: sentry::release_name!(),
                ..Default::default()
            },
        ));

        let _guard = minidump::init(&client);

        builder = builder.plugin(tauri_plugin_sentry::init(&client));
    } else {
        println!("No Sentry DSN found.");
    }

    builder
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_env,
            check_docker_installed,
            add_cert_to_keychain,
            remove_cert_from_keychain,
            cert_exist_on_keychain,
            add_line_to_hosts,
            delete_line_from_hosts,
            check_host_exists,
            open_finder_or_explorer,
            get_hosts_file_context,
            find_certificates,
            remove_cert_by_sha1,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}