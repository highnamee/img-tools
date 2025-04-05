import { useState, useCallback, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
  label?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function CopyButton({
  text,
  label = "Copy to Clipboard",
  size = "sm",
  variant = "outline",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
  }, [text]);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  return (
    <Button size={size} variant={variant} onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4" /> Copied!
        </>
      ) : (
        <>
          <Copy className="mr-2 h-4 w-4" /> {label}
        </>
      )}
    </Button>
  );
}
