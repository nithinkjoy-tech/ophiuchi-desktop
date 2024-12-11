"use client";

import { ModeToggle } from "@/components/page-components/theme-toggle";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";

function SettingsPage() {
  return (
    <div className="">
      <div className="">
        <p>Settings</p>
      </div>
      <Separator />
      <div className="p-4">
        <div className="flex items-center gap-4">
          <Label>
            <span>Theme</span>
          </Label>
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SettingsPage), {
  ssr: false,
});
