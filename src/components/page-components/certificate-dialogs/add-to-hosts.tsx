import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { hostsStore } from "@/stores/hosts-store";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";

interface AddToHostsDialogProps {
  hostname: string;
  onClose: () => void;
}

export default function AddToHostsDialog({
  hostname,
  onClose,
}: AddToHostsDialogProps) {
  const { toast } = useToast();
  const { checkHostExists, addHostToFile, removeHostFromFile } = hostsStore();
  const [loading, setLoading] = useState(false);
  const [hostExists, setHostExists] = useState(false);
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);

  const checkExist = async () => {
    try {
      const exists = await checkHostExists(hostname);
      setHostExists(exists);
    } catch (e) {
      console.error("Error checking host existence:", e);
    }
  };

  useEffect(() => {
    if (open) {
      checkExist();
    }
  }, [open]);

  const onAddToHosts = async () => {
    try {
      setLoading(true);

      if (hostExists) {
        await removeHostFromFile(hostname, password);
      }
      await addHostToFile(hostname, password);

      toast({
        title: "Success",
        description: "Successfully added to /etc/hosts",
      });
      setOpen(false);
      onClose();
    } catch (e) {
      console.error("Error adding to hosts:", e);
      toast({
        title: "Error",
        description: "Failed to add to /etc/hosts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            {!hostExists ? (
              <Button variant="default" size="sm">
                <Globe className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-green-500">
                <Globe className="h-4 w-4" />
              </Button>
            )}
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent side="right">
          <p>Add to /etc/hosts</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to /etc/hosts</DialogTitle>
          <DialogDescription>
            Add the following line to your /etc/hosts file:
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <CopyCommandButton
            command={`127.0.0.1 ${hostname}`}
            className="w-full"
          />
          {hostExists && (
            <p className="text-sm text-yellow-500">
              ⚠️ This hostname already exists in /etc/hosts. Re-adding will
              update it.
            </p>
          )}
          <input
            type="password"
            placeholder="Enter your password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={onAddToHosts}
            disabled={loading || !password}
            variant={hostExists ? "secondary" : "default"}
          >
            {loading
              ? "Adding..."
              : hostExists
              ? "Re-add to hosts"
              : "Add to hosts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
