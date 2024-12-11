import { create } from "zustand";

interface SystemStatusStore {
  isCheckDone: boolean;
  isDockerInstalled: boolean;
  isDockerRunning: boolean;
  isEverythingOk: () => boolean;
  setIsCheckDone: (checking: boolean) => void;
  setIsDockerInstalled: (installed: boolean) => void;
  setIsDockerRunning: (running: boolean) => void;
}

const systemStatusStore = create<SystemStatusStore>((set, get) => ({
  isCheckDone: false,
  isDockerInstalled: false,
  isDockerRunning: false,
  isEverythingOk: () => {
    const { isCheckDone, isDockerInstalled } = get();
    return isCheckDone && isDockerInstalled;
  },
  setIsCheckDone: (checking) => set({ isCheckDone: checking }),
  setIsDockerInstalled: (installed) => set({ isDockerInstalled: installed }),
  setIsDockerRunning: (running) => set({ isDockerRunning: running }),
}));

export default systemStatusStore;