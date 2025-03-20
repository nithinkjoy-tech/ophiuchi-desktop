import { invoke } from "@tauri-apps/api/core";
import { appDataDir, BaseDirectory, homeDir } from "@tauri-apps/api/path";
import { UnwatchFn, watch } from "@tauri-apps/plugin-fs";
import { create } from "zustand";

interface CertKeychainStore {
  watcher: UnwatchFn | null;
  certOnKeychain: Record<string, { exists: boolean; timestamp: number }>;
  init: () => Promise<void>;
  checkCertExistOnKeychain: (name: string, shouldFetch?: boolean) => Promise<boolean>;
  removeCertFromKeychain: (name: string) => Promise<void>;
  addCertToKeychain: (pemFilePath: string) => Promise<void>;
  generateManualCommand: (name: string) => Promise<string>;
}

const CACHE_TIME = 60000;

export const certKeychainStore = create<CertKeychainStore>((set, get) => ({
  watcher: null,
  certOnKeychain: {},
  init: async () => {
    if (get().watcher) {
      console.warn('Watcher already exists');
      // call unwatchFn 
      get().watcher?.();
    }
    const unWatchFn = await watch('cert', (event) => {
      console.log('Event:', event);
      console.log(`Kind`, (event as any).kind);
    }, {
      baseDir: BaseDirectory.AppData,
      delayMs: 1000,
      recursive: true,
    });

    set({ watcher: unWatchFn });
  },
  /**
   * Check if the certificate exists on the keychain.
   * @param name 
   * @param shouldFetch 
   * @returns 
   */
  checkCertExistOnKeychain: async (name, shouldFetch = false) => {
    const now = Date.now();
    const cached = get().certOnKeychain[name];

    if (
      !shouldFetch &&
      cached &&
      now - cached.timestamp < CACHE_TIME
    ) {
      console.log(`Cached: ${name}`, cached.exists);
      return cached.exists;
    }

    const exists = await invoke<boolean>('cert_exist_on_keychain', {
      name,
    });

    set(state => ({
      ...state,
      certOnKeychain: {
        ...state.certOnKeychain,
        [name]: { exists: exists as boolean, timestamp: now }
      }
    }));

    return exists;
  },
  /**
   * Remove requires the name of the certificate.
   * @param name 
   */
  removeCertFromKeychain: async (name) => {
    await invoke('remove_cert_from_keychain', {
      name,
    });

    set(state => ({
      ...state,
      certOnKeychain: {
        ...state.certOnKeychain,
        [name]: { exists: false, timestamp: Date.now() }
      }
    }));
  },
  /**
   * Adding requires path to the pem file.
   * @param name
   */
  addCertToKeychain: async (name) => {
    const appDataDirPath = await appDataDir();
    const pemFilePath = `${appDataDirPath}/cert/${name}/cert.pem`;
    await invoke('add_cert_to_keychain', {
      pem_file_path: pemFilePath,
    });
  },
  /**
   * Generate manual command to add the certificate to the keychain.
   * @param name
   * @returns
   */
  generateManualCommand: async (name) => {
    const homeDirectory = await homeDir();
    const appDataDirPath = await appDataDir();

    const keychainPath = `${homeDirectory}/Library/Keychains/login.keychain-db`;
    const pemFilePath = `${appDataDirPath}/cert/${name}/cert.pem`;

    const command = `security add-trusted-cert -k ${keychainPath} \"${pemFilePath}\"`;
    return command;
  }
}));
