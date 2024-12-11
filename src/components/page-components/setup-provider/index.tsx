/* eslint-disable @next/next/no-img-element */
"use client";

import { SystemHelper } from "@/helpers/system";
import systemStatusStore from "@/stores/system-status";
// When using the Tauri API npm package:
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect } from "react";

export function SystemSetupProvider(props: any) {
  const { setIsDockerInstalled, setIsCheckDone } = systemStatusStore();

  async function checkDocker() {
    try {
      const isInstalled = (await invoke("check_docker_installed")) as boolean;
      setIsDockerInstalled(isInstalled);
      return isInstalled;
    } catch (error) {
      console.error("Error checking Docker installation:", error);
    }
  }

  const onStartApp = useCallback(async () => {
    const systemHelper = new SystemHelper();
    await systemHelper.boot();
    await checkDocker();
    setIsCheckDone(true);
  }, []);

  useEffect(() => {
    onStartApp();
  }, []);

  return props.children;
}
