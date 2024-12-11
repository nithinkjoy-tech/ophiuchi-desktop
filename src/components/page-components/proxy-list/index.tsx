"use client";

import { Label } from "@/components/ui/label";
import {
  TooltipProvider
} from "@/components/ui/tooltip";
import proxyListStore from "@/stores/proxy-list";
import { appDataDir } from "@tauri-apps/api/path";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import { useCallback } from "react";
import DockerControl from "../docker-control";
import { ProxyGroupSelect } from "./group-select";
import ProxyListTable from "./table";

export default function ProxyListComponent() {
  const { proxyList } = proxyListStore();

  const openAppData = useCallback(async () => {
    const appDataDirPath = await appDataDir();
    shellOpen(appDataDirPath);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col min-h-screen   ">
        <div className="p-4 mt-20">
          <div className="flex flex-col gap-2 mb-4">
            <Label className="text-base font-medium">Select Group</Label>
            <div className="flex gap-2 items-center">
              <ProxyGroupSelect
                onAddGroupButton={() => {
                  // wow!
                }}
              />
              <DockerControl />
            </div>
          </div>
          <ProxyListTable />
        </div>
      </div>
    </TooltipProvider>
  );
}
