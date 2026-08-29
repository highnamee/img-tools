import { useCallback, useState } from "react";

import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { ImageFile, createImageFile } from "@/services/imageService";
import { cn } from "@/utils/css";

type ImageDropZoneProps = {
  onFilesAdded: (files: ImageFile[]) => void;
};

export function ImageDropZone({ onFilesAdded }: Readonly<ImageDropZoneProps>) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processAddedFiles = useCallback(
    async (rawFiles: File[]) => {
      const imageFiles = rawFiles.map(createImageFile);

      const filesWithDimensions = await Promise.all(
        imageFiles.map(async (file) => {
          // Get dimensions safely
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = file.preview;
          });

          return {
            ...file,
            originalWidth: img.width || undefined,
            originalHeight: img.height || undefined,
          };
        })
      );

      onFilesAdded(filesWithDimensions);
    },
    [onFilesAdded]
  );

  // Reusable clipboard paste hook
  useClipboardPaste({
    onImagesPasted: processAddedFiles,
  });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      processAddedFiles(droppedFiles);
    },
    [processAddedFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      processAddedFiles(selectedFiles);
    },
    [processAddedFiles]
  );

  return (
    <div
      className={cn(
        "flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-all duration-200",
        isDragging
          ? "border-primary bg-primary/10 scale-[0.99]"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2"
      >
        <div className="bg-primary/10 rounded-full p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="text-muted-foreground text-sm font-medium flex items-center flex-wrap justify-center gap-1.5">
          <span>Drag & drop images, paste</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="bg-muted text-foreground/80 border-border rounded border px-1.5 py-0.5 text-[10px] font-semibold">
              Ctrl+V
            </kbd>
            <span className="text-xs">/</span>
            <kbd className="bg-muted text-foreground/80 border-border rounded border px-1.5 py-0.5 text-[10px] font-semibold">
              ⌘V
            </kbd>
          </span>
          <span>or click to browse</span>
        </p>
        <p className="text-muted-foreground text-xs">Supports PNG, JPEG, WebP, AVIF</p>
      </label>
    </div>
  );
}
