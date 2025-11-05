//! Windows-only helpers – **no** `#[tauri::command]` here
use std::fs;
use std::env::temp_dir;
use std::process::Command;
use regex;

pub fn append_to_hosts(line: &str) {
    let hosts_path = r"C:\Windows\System32\drivers\etc\hosts";

    let ps = format!(
        "Add-Content -Path '{}' -Value '{}' -Force",
        hosts_path, line
    );

    let _ = Command::new("powershell")
        .arg("-WindowStyle").arg("Hidden")
        .arg("-Command")
        .arg(&format!(
            "Start-Process powershell -Verb RunAs -WindowStyle Hidden \
             -ArgumentList '-WindowStyle','Hidden','-Command','{}' -Wait",
            ps.replace("'", "''")
        ))
        .status();
}

pub fn delete_line(hostname: &str) {
    let hosts_path = r"C:\Windows\System32\drivers\etc\hosts";
    let esc = regex::escape(hostname);

    if let Ok(content) = std::fs::read_to_string(hosts_path) {
        let new: Vec<_> = content
            .lines()
            .filter(|l| {
                let re = regex::Regex::new(&format!(r"^127\.0\.0\.1\s+{}\s*$", esc)).unwrap();
                !re.is_match(l.trim())
            })
            .map(|s| s.to_string())
            .collect();

        let ps = format!(
            "$c = @'\n{}\n'@; Set-Content -Path '{}' -Value $c -Force",
            new.join("\n"), hosts_path
        );

        let _ = Command::new("powershell")
            .arg("-Command")
            .arg(&format!(
                "Start-Process powershell -Verb RunAs -ArgumentList '-Command','{}' -Wait",
                ps.replace("'", "''")
            ))
            .status();
    }
}

pub fn backup_hosts() {
    use chrono::Local;
    let now = Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();

    if let Some(profile) = std::env::var_os("USERPROFILE")
        .and_then(|s| s.into_string().ok())
    {
        let dir = format!(r"{}\ophiuchi.hosts.bak\", profile);
        let _ = std::fs::create_dir_all(&dir);
        let dst = format!(r"{}hosts.bak.{}", dir, now);
        let src = r"C:\Windows\System32\drivers\etc\hosts";

        match std::fs::copy(src, &dst) {
            Ok(_) => println!("Backup: {}", dst),
            Err(e) => eprintln!("Backup error: {}", e),
        }
    }
}

pub fn add_cert(pem: String) -> Result<(), String> {
    let ps = format!(
        "Import-Certificate -FilePath '{}' -CertStoreLocation Cert:\\CurrentUser\\Root",
        pem
    );

    let out = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-Command")
        .arg(&format!(
            "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-Command','{}' -Wait",
            ps.replace("'", "''")
        ))
        .output()
        .map_err(|e| format!("cmd: {}", e))?;

    if out.status.success() {
        println!("addifnf success");
        Ok(())
    } else {
        println!("addifnf failed");
        Err(String::from_utf8_lossy(&out.stderr).into())
    }
}

pub fn remove_cert(name: String) -> Result<(), String> {
    let ps = format!(
        "$c = Get-ChildItem Cert:\\CurrentUser\\Root | ? {{ $_.Subject -like '*{}*' }} | select -First 1; \
         if ($c) {{ Remove-Item $c.PSPath -Force }}",
        name
    );

    let out = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-Command")
        .arg(&format!(
            "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-Command','{}' -Wait",
            ps.replace("'", "''")
        ))
        .output()
        .map_err(|e| format!("cmd: {}", e))?;

    if out.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).into())
    }
}

pub fn cert_exists(name: String) -> Result<bool, String> {
    let ps = format!(
        "Get-ChildItem Cert:\\CurrentUser\\Root | ? {{ $_.Subject -like '*{}*' }}",
        name
    );

    let out = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-NonInteractive")
        .arg("-Command")
        .arg(&ps)
        .output()
        .map_err(|e| format!("cmd: {}", e))?;

    Ok(out.status.success() && !String::from_utf8_lossy(&out.stdout).trim().is_empty())
}

pub fn find_certs(name: String) -> Result<String, String> {
    let ps = format!(
        "Get-ChildItem Cert:\\CurrentUser\\Root | ? {{ $_.Subject -like '*{}*' }} | \
         Format-List Subject,Thumbprint,NotAfter,NotBefore,Issuer",
        name
    );

    let out = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-NonInteractive")
        .arg("-Command")
        .arg(&ps)
        .output()
        .map_err(|e| format!("cmd: {}", e))?;

    if out.status.success() {
        println!("certificate found");
        Ok(String::from_utf8_lossy(&out.stdout).into())
    } else {
        println!("Err finding cert");
        Err(String::from_utf8_lossy(&out.stderr).into())
    }
}

pub fn remove_cert_by_sha1(sha1: String) -> Result<(), String> {
    println!("removing certficated");
    let ps = format!(
        "$c = Get-ChildItem Cert:\\CurrentUser\\Root | Where-Object {{ $_.Thumbprint -eq '{}' }}; \
         if ($c) {{ Remove-Item $c.PSPath -Force }}",
        sha1
    );

    let out = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-Command")
        .arg(&ps)
        .output()
        .map_err(|e| format!("cmd: {}", e))?;

    if out.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).into())
    }
}

pub fn open_explorer(path: String) -> Result<(), String> {
    let out = Command::new("explorer").arg(path).output()
        .map_err(|e| format!("cmd: {}", e))?;
    if out.status.success() { Ok(()) } else { Err("explorer failed".into()) }
}