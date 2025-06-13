<a href="https://www.producthunt.com/posts/ophiuchi?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-ophiuchi" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=462347&theme=light" alt="Ophiuchi - Setup&#0032;Localhost&#0032;SSL&#0032;Proxy&#0032;in&#0032;5&#0032;Seconds&#0033; | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>


# Ophiuchi - Localhost SSL Proxy Server Manager


![Screenshot 2024-06-10 at 11 56 57 AM](https://github.com/apilylabs/ophiuchi-desktop/assets/5467111/a5b465b6-065e-43c4-ac66-bf8a502d5bae)




# Download the Built App: 

The latest built app is available at the website:

🚀 [Ophiuchi Official Website](https://www.ophiuchi.dev/)

<img width="1392" alt="Screenshot 2025-05-15 at 2 26 24 PM" src="https://github.com/user-attachments/assets/70bc9027-43cb-4346-b960-04fd68aba03d" />

--- 

## Related Links

### Join Discord for Support:

💪 [Discord Channel](https://discord.gg/fpp8kNyPtz)

### Where Ophiuchi was Showcased

[dev.to Article](https://dev.to/cheeselemon/ssl-in-localhost-takes-5-seconds-now-460i)

[daily.dev Article](https://app.daily.dev/posts/ssl-in-localhost-takes-5-seconds-now--zhuzgvwxh)

[GeekNews Article(ko)](https://news.hada.io/topic?id=20888)

[RaqibNur's Bookmarks](https://www.raqibnur.com/bookmark)

---

# Build from Source & Run Locally

1. See [Tauri's Docs](https://v2.tauri.app/start/prerequisites/) to prepare for tauri app development.

2. Clone the repo and run: 

```
npm install
```

3. To build and run the app: 

```
npm run tauri dev
```

### Building the App 

```
CI=true npm run tauri build 
```

### Debuggable build

```
npm run tauri build -- --debug
```

### Build macOS App Bundles

Tauri v2 build command for macOS app bundles


```
npm run tauri build -- --bundles app
```


---
# Troubleshooting 

## Resolving Tauri Build Error: "No such file or directory (os error 2)"

The error you're encountering indicates that Tauri is trying to use Rust's Cargo build system, but it cannot find the necessary Rust setup to compile the project. This is likely because either Rust is not installed, or the environment isn’t configured properly for Tauri's Rust dependencies.

### Steps to Resolve

### 1. Install Rust
Tauri uses Rust, so ensure you have the Rust toolchain installed. You can install Rust using `rustup`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
## Set Up Tauri’s Rust Targets

#### Since you are building for universal-apple-darwin, you will need to install the necessary Rust targets. Use:
```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
```
## Run the Build Command Again
#### After setting up Rust and the necessary targets, try running the build command again:

```bash
npm run tauri build -- --debug
```

## Build Errors

### Can't find crate for 'core' error...

```bash
error[E0463]: can't find crate for `core`
  |
  = note: the `aarch64-apple-darwin` target may not be installed
  = help: consider downloading the target with `rustup target add aarch64-apple-darwin`

For more information about this error, try `rustc --explain E0463`.
error: could not compile `cfg-if` (lib) due to 1 previous error
warning: build failed, waiting for other jobs to finish...
failed to build aarch64-apple-darwin binary: failed to build app
    Error [tauri_cli_node] failed to build aarch64-apple-darwin binary: failed to build app
```

In this case, update rustup to the latest version:

```bash
rustup update
```




### notes 

https://discord.com/channels/616186924390023171/1096449326672248903/1096449326672248903

