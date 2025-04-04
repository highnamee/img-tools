import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { ImageFile, createImageFile } from "@/services/imageService";

interface ImageDropZoneProps {
  onFilesAdded: (files: ImageFile[]) => void;
}

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      const imageFiles = droppedFiles.map(createImageFile);
      onFilesAdded(imageFiles);
    },
    [onFilesAdded]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      const imageFiles = selectedFiles.map(createImageFile);
      onFilesAdded(imageFiles);
    },
    [onFilesAdded]
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
      <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center gap-2">
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
        <p className="text-muted-foreground text-xs">
          Supports PNG, JPEG, WebP, AVIF, GIF, BMP, TIFF
        </p>
      </label>
    </div>
  );
}
