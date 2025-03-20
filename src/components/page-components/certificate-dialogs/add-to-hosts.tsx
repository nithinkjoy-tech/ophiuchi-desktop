import { Button } from "@/components/ui/button";
import Code from "@/components/ui/code";
import { CopyCommandButton } from "@/components/ui/copy-command-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IProxyData } from "@/helpers/proxy-manager/interfaces";
import { useToast } from "@/hooks/use-toast";
import { invoke } from "@tauri-apps/api/core";
import { Globe, TriangleAlertIcon } from "lucide-react";
import React, { useCallback, useState } from "react";

export default function AddToHostsDialog({
  item,
  onDone,
}: {
  item: IProxyData;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [manualCommand, setManualCommand] = useState("");

  const onAddToHosts = useCallback(
    async (endpoint: IProxyData, password: string) => {
      try {
        setIsLoading(true);
        await invoke("add_line_to_hosts", {
          hostname: endpoint.hostname,
          password: password,
        });
        setOpen(false);
        onDone();
        toast({
          title: "Hosts Updated",
          description: "Successfully added hostname to /etc/hosts",
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "Update Failed",
          description: "Failed to add hostname to /etc/hosts",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [onDone, toast]
  );

  const generateManualCommand = useCallback(() => {
    const command = `echo "127.0.0.1 ${item.hostname}" | sudo tee -a /etc/hosts`;
    setManualCommand(command);
  }, [item.hostname]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open: boolean) => {
        setOpen(open);
        if (!open) {
          setPassword("");
          setManualCommand("");
        }
        onDone();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="">
          <Globe className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add to /etc/hosts</DialogTitle>
          <DialogDescription>
            This dialog will help you add the hostname to your <Code>/etc/hosts</Code> file.
            This is required for the browser to resolve the hostname to localhost.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="auto" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">Automatic</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="auto">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="flex items-start gap-2">
                  <div className="mt-1">
                    <TriangleAlertIcon className="h-5 w-5 text-yellow-500" />
                  </div>
                  <Label>
                    To add <Code>{item.hostname}</Code> to your <Code>/etc/hosts</Code> file,
                    please enter your machine&apos;s password.
                    <br />
                    <span className="text-red-500 text-sm">
                      Note: Password is never saved.
                    </span>
                  </Label>
                </div>
                <div className="mt-2">
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 px-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder: focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="default"
                onClick={() => {
                  onAddToHosts(item, password);
                }}
                disabled={!password || isLoading}
              >
                {isLoading ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="manual" className="py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TriangleAlertIcon className="h-5 w-5 text-yellow-500" />
                <p className="text-base text-muted-foreground">
                  If you prefer to add the hostname manually, you can use the following command:
                </p>
              </div>
              <div className="space-y-2">
                <Code className="text-sm whitespace-pre-wrap break-all max-w-full overflow-x-auto p-4">
                  {manualCommand || `echo "127.0.0.1 ${item.hostname}" | sudo tee -a /etc/hosts`}
                </Code>
                <div className="grid gap-2">
                  <CopyCommandButton command={manualCommand || `echo "127.0.0.1 ${item.hostname}" | sudo tee -a /etc/hosts`} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 