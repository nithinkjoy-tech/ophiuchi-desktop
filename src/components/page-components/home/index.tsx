"use client";

// When using the Tauri API npm package:
import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect } from "react";
// Write a text file to the `$APPCONFIG/app.conf` path

const onStartServer = () => {
  // Invoke the command
};
const loadTest = async () => {
  const res = await fetch("http://localhost:8899/api/test");
  const data = await res.json();
  console.log(data);
  return data;
};

export function HomeComponent() {
  useEffect(() => {
    loadTest();
  }, []);

  const onStartServer = useCallback(async () => {
    const res = await writeTextFile("app.conf", "file contents", {
      baseDir: BaseDirectory.AppData,
    });
    console.log(res);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="py-4">
        <h1 className="text-2xl font-semibold tracking-tight">Ophiuchi</h1>
        <p className="text-sm">
          Start your local HTTPS proxy server with docker.
        </p>
      </div>
      <div className="rounded-xl bg-blue-950 p-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-1">
            <label className="text-sm">HOSTNAME</label>
            <input
              type="text"
              className="border-b border-b-blue-600 bg-transparent p-2 caret-blue-600"
              placeholder="hostname (ex:local.domain.com)"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm">PORT</label>
            <input
              type="text"
              className="border-b border-b-blue-600 bg-transparent p-2 caret-blue-600"
              placeholder="proxy port number (ex:3000)"
            />
          </div>
          <div className="">
            <button
              className="rounded-lg bg-blue-700 px-4 py-2"
              onClick={() => {
                onStartServer();
              }}
            >
              Start Docker Server
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
