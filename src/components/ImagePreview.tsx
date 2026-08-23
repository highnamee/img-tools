import { ReactNode } from "react";

import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageFile, ConversionFormat, downloadImage } from "@/services/imageService";
import { cn } from "@/utils/css";
import { formatFileSize, formatDimensions } from "@/utils/formatUtils";

interface ImagePreviewProps {
  readonly file: ImageFile;
  readonly format: ConversionFormat;
  readonly onRemove: () => void;
  readonly extraData?: ReactNode;
  readonly hideDownload?: boolean;
  readonly showSizeInfo?: boolean;
  readonly showDimensionsInfo?: boolean;
}

export function ImagePreview({
  file,
  format,
  onRemove,
  extraData,
  hideDownload,
  showSizeInfo = true,
  showDimensionsInfo = true,
}: Readonly<ImagePreviewProps>) {
  const handleDownload = () => {
    if (file.processed) {
      downloadImage(file.processed, file.name, format);
    }
  };

  let badgeColor = "bg-gray-500";
  let badgeText = "Ready";

  if (file.isError) {
    badgeColor = "bg-red-500";
    badgeText = "Error";
  } else if (file.isProcessing) {
    badgeColor = "bg-yellow-500";
    badgeText = "Processing";
  } else if (file.processed) {
    badgeColor = "bg-green-500";
    badgeText = "Processed";
  }

  return (
    <Card className="relative gap-4 overflow-hidden pt-0 pb-4">
      <div className="group relative h-36 w-full bg-muted/10 flex items-center justify-center border-b">
        <img
          src={file.processedPreview ?? file.preview}
          alt={file.name}
          className="h-full w-full object-contain"
        />
        {file.isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {!file.isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {!hideDownload && !file.isError && (
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                Download
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={onRemove}>
              Remove
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-2 p-2">
        <p className="truncate text-sm font-medium">
          {file.processed ? `${file.name.split(".")[0]}.${format}` : file.name}
        </p>
        <Badge className={cn(badgeColor, "rounded-sm")}>{badgeText}</Badge>
        <div className="text-muted-foreground text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
          {showSizeInfo && (
            <span>
              {file.processed
                ? `${formatFileSize(file.file.size)} → ${formatFileSize(file.processed.size)}`
                : formatFileSize(file.file.size)}
            </span>
          )}
          {showSizeInfo && showDimensionsInfo && file.originalWidth && file.originalHeight && (
            <span className="text-muted-foreground/40">•</span>
          )}
          {showDimensionsInfo && file.originalWidth && file.originalHeight && (
            <span>
              {formatDimensions(file.originalWidth, file.originalHeight)}
              {file.newWidth && file.newHeight && (
                ` → ${formatDimensions(file.newWidth, file.newHeight)}`
              )}
            </span>
          )}
        </div>
        {extraData}
      </div>
    </Card>
  );
}
