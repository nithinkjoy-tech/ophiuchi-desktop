import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface CopyCommandButtonProps {
  command: string;
}

export function CopyCommandButton({ command }: CopyCommandButtonProps) {
  const { toast } = useToast();

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        navigator.clipboard.writeText(command);
        toast({
          title: "Command Copied",
          description: "Command has been copied to clipboard",
        });
      }}
    >
      <Copy className="h-4 w-4 mr-2" />
      Copy Command
    </Button>
  );
} 