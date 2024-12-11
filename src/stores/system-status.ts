import { create } from "zustand";

interface SystemStatusStore {
  isCheckDone: boolean;
  isDockerInstalled: boolean;
  isEverythingOk: () => boolean;
  setIsCheckDone: (checking: boolean) => void;
  setIsDockerInstalled: (installed: boolean) => void;
}

const systemStatusStore = create<SystemStatusStore>((set, get) => ({
  isCheckDone: false,
  isDockerInstalled: false,
  isEverythingOk: () => {
    const { isCheckDone, isDockerInstalled } = get();
    return isCheckDone && isDockerInstalled;
  },
  setIsCheckDone: (checking) => set({ isCheckDone: checking }),
  setIsDockerInstalled: (installed) => set({ isDockerInstalled: installed }),
}));

export default systemStatusStore;