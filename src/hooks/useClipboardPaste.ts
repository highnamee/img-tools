import { useEffect, useCallback } from "react";

interface UseClipboardPasteOptions {
  onImagesPasted: (files: File[]) => void;
  enabled?: boolean;
}

/**
 * Custom hook to listen for clipboard image paste events (Ctrl+V / Cmd+V).
 */
export function useClipboardPaste({ onImagesPasted, enabled = true }: UseClipboardPasteOptions) {
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (!enabled) return;

      const clipboardFiles = Array.from(e.clipboardData?.files || []);
      const imageFiles = clipboardFiles.filter((file) => file.type.startsWith("image/"));

      // Also check clipboard items for screenshot/bitmap data
      if (imageFiles.length === 0 && e.clipboardData?.items) {
        const items = Array.from(e.clipboardData.items);
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              const ext = file.type.split("/")[1] || "png";
              const namedFile = new File([file], `pasted-image-${Date.now()}.${ext}`, {
                type: file.type,
              });
              imageFiles.push(namedFile);
            }
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        onImagesPasted(imageFiles);
      }
    },
    [enabled, onImagesPasted]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [enabled, handlePaste]);
}
