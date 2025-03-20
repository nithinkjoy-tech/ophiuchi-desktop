import { cn } from "@/lib/utils";

export default function Code({
  children,
  style = "normal",
  className,
}: {
  children: React.ReactNode;
  style?: "normal" | "sudo";
  className?: string;
}) {
  function fontColor() {
    return style === "normal" ? " " : "text-red-500";
  }

  function bgColor() {
    return style === "normal" ? " " : "bg-red-950";
  }

  return (
    <code
      className={cn(fontColor(), bgColor(), "px-1.5 py-0.5 rounded-md text-sm whitespace-break-spaces", className)}
    >
      {children}
    </code>
  );
}
