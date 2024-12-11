"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import useDocker from "@/hooks/use-docker";
import systemStatusStore from "@/stores/system-status";
import { appDataDir } from "@tauri-apps/api/path";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

function SettingsPage() {
  const { isDockerInstalled } = systemStatusStore();
  const [isDockerContainerRunning, setIsDockerContainerRunning] =
    useState(false);
  const { checkDockerContainerStatus } = useDocker();

  const checkDockerContainerRunning = async () => {
    const appDataDirPath = await appDataDir();
    const dockerComposePath = `${appDataDirPath}/docker-compose.yml`;
    checkDockerContainerStatus(dockerComposePath).then((status) => {
      setIsDockerContainerRunning(status.isRunning);
    });
  };

  useEffect(() => {
    checkDockerContainerRunning();
  }, []);

  return (
    <div className="">
      <div className="">
        <p>Status</p>
      </div>
      <Separator />
      <div className="p-4 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Docker</CardTitle>
            <CardDescription>
              Docker is required to run the proxy server.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
              {isDockerInstalled ? (
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
              ) : (
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-rose-500" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Docker Installation
                </p>
                <p className="text-sm text-muted-foreground">
                  {isDockerInstalled ? "Installed" : "Not installed"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Docker Container</CardTitle>
            <CardDescription>Check if container is running.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
              {isDockerContainerRunning ? (
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
              ) : (
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-rose-500" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Container Status
                </p>
                <p className="text-sm text-muted-foreground">
                  {isDockerContainerRunning ? "Running" : "Not Running"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SettingsPage), {
  ssr: false,
});
