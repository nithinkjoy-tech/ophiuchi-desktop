import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Command } from "@tauri-apps/plugin-shell";

import { useEffect, useState } from "react";

export default function DockerLogModal({
  stream,
  detailedStream,
  isOpen,
  onClosed,
}: {
  stream: any;
  detailedStream: any;
  isOpen: boolean;
  onClosed?: () => void;
}) {
  const [_isOpen, setIsOpen] = useState(true);
  const [showDetailedLog, setShowDetailedLog] = useState(false);

  useEffect(() => {
    setIsOpen(isOpen);
  }, [isOpen]);

  function closeModal() {
    setIsOpen(false);
    setShowDetailedLog(false);
    onClosed && onClosed();
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Docker Command Log</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="mt-2  w-full">
                <div className="h-[50%] max-h-[400px] overflow-y-auto  p-8 min-h-[400px] bg-foreground/10 rounded-lg">
                  <code className="text-sm  whitespace-pre-wrap">
                    {showDetailedLog ? detailedStream : stream}
                  </code>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 justify-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="detailed-logs"
                  checked={showDetailedLog}
                  onCheckedChange={(checked) =>
                    setShowDetailedLog(checked as boolean)
                  }
                />
                <label
                  htmlFor="detailed-logs"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  See detailed logs
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant={"outline"}
              onClick={async () => {
                const command = Command.create("open-docker-app");
                const output = await command.execute();
                console.log(output);
              }}
            >
              Open Docker Desktop
            </Button>
            <Button variant={"secondary"} onClick={closeModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
