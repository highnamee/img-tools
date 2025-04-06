import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import { ImageFile } from "@/services/imageService";
import { downloadAllFiles } from "@/services/fileService";
import { formatFileSize, formatDimensions } from "@/utils/formatUtils";

type OutputFormat = "png" | "jpeg" | "webp";

export default function BackgroundRemover() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const [errorFiles, setErrorFiles] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState<number>(80);
  const [loadingStatus, setLoadingStatus] = useState<string>("");

  useEffect(() => setQuality(80), [format]);

  const handleFilesAdded = useCallback((newFiles: ImageFile[]) => {
    const filesWithDimensions = newFiles.map(async (file) => {
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
    });

    Promise.all(filesWithDimensions).then((files) => {
      setFiles((prev) => [...prev, ...files]);
    });
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const processImages = useCallback(async () => {
    setProcessingFiles(new Set(files.map((f) => f.name)));
    setErrorFiles(new Set());
    setLoadingStatus("Initializing...");

    try {
      // Process images sequentially instead of in parallel
      const processedFiles = [...files];

      for (let i = 0; i < files.length; i++) {
        const imageFile = files[i];

        try {
          const { removeBackground } = await import("@imgly/background-removal");

          const processedBlob = await removeBackground(imageFile.file, {
            device: "gpu",
            output: {
              format: `image/${format}`,
              quality: quality / 100,
            },
            progress: (key, current, total) => {
              const operationType = key.startsWith("fetch:")
                ? "fetch"
                : key.replace("compute:", "");

              // Display a more user-friendly message
              const statusMessage = `Image ${i + 1}/${files.length} - ${operationType}: (${Math.round((current / total) * 100)}%)`;
              setLoadingStatus(statusMessage);
            },
          });

          // Calculate new dimensions
          const img = new Image();
          img.src = URL.createObjectURL(processedBlob);
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          processedFiles[i] = {
            ...imageFile,
            processed: processedBlob,
            newWidth: img.width,
            newHeight: img.height,
          };

          // Update files state after each image is processed to show progress
          setFiles([...processedFiles]);

          // Update processing files to remove the current file from the set
          setProcessingFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(imageFile.name);
            return newSet;
          });
        } catch (error) {
          console.error(`Error removing background from ${imageFile.name}:`, error);
          setErrorFiles((prev) => new Set([...prev, imageFile.name]));

          setProcessingFiles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(imageFile.name);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error("Error processing images:", error);
    } finally {
      setProcessingFiles(new Set());
      setLoadingStatus("");
    }
  }, [files, format, quality]);

  const downloadAll = useCallback(() => {
    const filesToDownload = files
      .filter((file) => file.processed)
      .map((file) => ({
        blob: file.processed!,
        filename: `${file.name.split(".")[0]}-no-bg.${format}`,
      }));
    downloadAllFiles(filesToDownload);
  }, [files, format]);

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Background Remover</h1>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        <div className="space-y-6">
          <p className="text-muted-foreground text-xs">
            Remove backgrounds from your images with one click - perfect for product photos,
            portraits, and more
          </p>

          <div className="flex flex-wrap items-center gap-10">
            <div className="space-y-2">
              <label className="text-sm font-medium">Output Format</label>
              <Select value={format} onValueChange={(value) => setFormat(value as OutputFormat)}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Quality: {quality}%</label>
                <button
                  onClick={() => setQuality(80)}
                  className="text-primary text-xs hover:underline"
                >
                  Reset
                </button>
              </div>
              <Slider
                value={[quality]}
                onValueChange={([value]) => setQuality(value)}
                min={1}
                max={100}
                step={1}
                className="w-64"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={processImages}
                disabled={files.length === 0 || processingFiles.size > 0}
              >
                {processingFiles.size > 0 ? "Processing..." : "Remove Background"}
              </Button>
              <Button
                onClick={downloadAll}
                disabled={!files.some((f) => f.processed)}
                variant="outline"
              >
                Download All
              </Button>
              <Button
                onClick={() => setFiles([])}
                disabled={files.length === 0}
                variant="destructive"
              >
                Clear All
              </Button>
            </div>

            {loadingStatus && (
              <div className="py-2">
                <p className="text-muted-foreground text-sm">{loadingStatus}</p>
              </div>
            )}
          </div>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {files.map((file, fileIndex) => (
              <div key={file.name + file.preview}>
                <ImagePreview
                  file={file}
                  format={format}
                  onRemove={() => handleRemoveFile(fileIndex)}
                  isProcessing={processingFiles.has(file.name)}
                  isError={errorFiles.has(file.name)}
                  extraData={
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground text-xs">
                        {file.processed
                          ? `${formatFileSize(file.file.size)} → ${formatFileSize(file.processed.size)}`
                          : formatFileSize(file.file.size)}
                      </p>
                      {file.originalWidth && file.originalHeight && (
                        <p className="text-muted-foreground text-xs">
                          <span>{formatDimensions(file.originalWidth, file.originalHeight)} </span>
                          {file.newWidth && file.newHeight && (
                            <span> → {formatDimensions(file.newWidth, file.newHeight)}</span>
                          )}
                        </p>
                      )}
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
