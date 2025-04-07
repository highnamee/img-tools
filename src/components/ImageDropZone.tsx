import { useCallback, useState } from "react";

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
          // Get dimensions
          const img = new Image();
          img.src = file.preview;
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          return {
            ...file,
            originalWidth: img.width,
            originalHeight: img.height,
          };
        })
      );

      onFilesAdded(filesWithDimensions);
    },
    [onFilesAdded]
  );

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
        "flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors",
        isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
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
        <p className="text-muted-foreground text-sm font-medium">
          Drag and drop images here, or click to select files
        </p>
        <p className="text-muted-foreground text-xs">Supports PNG, JPEG, WebP, AVIF, BMP, TIFF</p>
      </label>
    </div>
  );
}
