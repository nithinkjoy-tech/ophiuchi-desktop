import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface CopyCommandButtonProps {
  command: string;
  className?: string;
}

export function CopyCommandButton({
  command,
  className,
}: CopyCommandButtonProps) {
  const { toast } = useToast();

  return (
    <Button
      size="sm"
      variant="secondary"
      className={className}
      onClick={() => {
        navigator.clipboard.writeText(command);
        toast({
          title: "Command Copied",
          description: "Command has been copied to clipboard",
        });
      }}
    >
      <Copy className="h-3 w-3" />
      <span className="text-xs">Copy</span>
    </Button>
  );
}
