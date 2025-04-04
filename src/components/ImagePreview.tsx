import { ImageFile, ConversionFormat, downloadImage } from "@/services/imageService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ImagePreviewProps {
  readonly file: ImageFile;
  readonly format: ConversionFormat;
  readonly onRemove: () => void;
  readonly isProcessing?: boolean;
}

export function ImagePreview({
  file,
  format,
  onRemove,
  isProcessing,
}: Readonly<ImagePreviewProps>) {
  const handleDownload = () => {
    if (file.converted) {
      downloadImage(file.converted, file.name, format);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const formatDimensions = (width?: number, height?: number) => {
    if (!width || !height) return "";
    return `${width}×${height}`;
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="group relative aspect-square">
        <img src={file.preview} alt={file.name} className="h-full w-full object-contain" />
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {!isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              disabled={!file.converted}
            >
              Download
            </Button>
            <Button variant="destructive" size="sm" onClick={onRemove}>
              Remove
            </Button>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-sm font-medium">
          {file.converted ? `${file.name.split(".")[0]}.${format}` : file.name}
        </p>
        <p className="text-muted-foreground text-xs">
          {isProcessing ? "Processing..." : file.converted ? "Converted" : "Ready to convert"}
        </p>
        <p className="text-muted-foreground text-xs">
          {file.converted
            ? `${formatFileSize(file.file.size)} → ${formatFileSize(file.converted.size)}`
            : formatFileSize(file.file.size)}
        </p>
        {file.originalWidth && file.originalHeight && (
          <p className="text-muted-foreground text-xs">
            {file.newWidth && file.newHeight
              ? `${formatDimensions(file.originalWidth, file.originalHeight)} → ${formatDimensions(file.newWidth, file.newHeight)}`
              : formatDimensions(file.originalWidth, file.originalHeight)}
          </p>
        )}
      </div>
    </Card>
  );
}
