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
import { ImageDiffModal } from "@/components/ImageDiffModal";

type OutputFormat = "png" | "jpeg" | "webp";

export default function BackgroundRemover() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState<number>(80);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    waiting: number;
    processing: number;
    currentIndex: number;
  }>({
    waiting: 0,
    processing: 0,
    currentIndex: -1,
  });
  const [loadingStatus, setLoadingStatus] = useState<string>("");

  useEffect(() => setQuality(80), [format]);

  const handleFilesAdded = useCallback((newFiles: ImageFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleViewDiff = useCallback((index: number) => {
    setSelectedFileIndex(index);
  }, []);

  const processImages = useCallback(async () => {
    try {
      // Reset files error state
      setFiles((prevFiles) =>
        prevFiles.map((file) => ({
          ...file,
          isError: false,
        }))
      );

      // Prepare files to process (exclude already processed ones)
      const filesToProcess = files.filter((file) => !file.processed);
      if (filesToProcess.length === 0) return;

      // Set initial processing status
      setProcessingStatus({
        waiting: filesToProcess.length - 1, // First one is processing, rest are waiting
        processing: 1, // Always 1 for sequential processing
        currentIndex: 0,
      });

      // Process images sequentially (not in parallel)
      for (let i = 0; i < filesToProcess.length; i++) {
        const imageFile = filesToProcess[i];
        const fileIndex = files.findIndex((f) => f === imageFile);

        // Update current processing index
        setProcessingStatus((prev) => ({
          ...prev,
          waiting: filesToProcess.length - i - 1,
          currentIndex: fileIndex,
        }));

        // Mark this file as processing
        setFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          updatedFiles[fileIndex] = {
            ...updatedFiles[fileIndex],
            isProcessing: true,
            isError: false,
          };
          return updatedFiles;
        });

        try {
          const { removeBackground } = await import("@imgly/background-removal");

          const processedBlob = await removeBackground(imageFile.file, {
            device: "gpu",
            output: {
              format: `image/${format}`,
              quality: quality / 100,
            },
            progress: (key, current, total) => {
              if (key.startsWith("fetch:")) {
                const percentComplete = Math.round((current / total) * 100);
                setLoadingStatus(
                  percentComplete === 100 ? "" : `Downloading model: (${percentComplete}%)`
                );
              }
            },
          });

          // Calculate new dimensions
          const img = new Image();
          img.src = URL.createObjectURL(processedBlob);
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          // Update the processed file using functional state update
          setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              processed: processedBlob,
              newWidth: img.width,
              newHeight: img.height,
              isProcessing: false,
              isError: false,
            };
            return updatedFiles;
          });
        } catch (error) {
          console.error(`Error removing background from ${imageFile.name}:`, error);

          // Mark as error using functional state update
          setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              isProcessing: false,
              isError: true,
            };
            return updatedFiles;
          });
        }
      }

      // Reset processing status when done
      setProcessingStatus({
        waiting: 0,
        processing: 0,
        currentIndex: -1,
      });
    } catch (error) {
      console.error("Error processing images:", error);
    } finally {
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

          <div className="flex flex-col gap-4">
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

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={processImages}
                disabled={files.length === 0 || files.some((f) => f.isProcessing)}
                className="w-40"
              >
                {processingStatus.processing > 0 ? "Removing..." : "Remove Background"}
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

            <div className="text-muted-foreground text-xs">
              {`${files.length} Uploaded `}
              {loadingStatus && `• ${loadingStatus}`}
              {processingStatus.processing > 0 &&
                processingStatus.currentIndex >= 0 &&
                `• Processing image ${processingStatus.currentIndex + 1} of ${files.length} sequentially`}
              {processingStatus.waiting > 0 &&
                `• ${processingStatus.waiting} images are waiting to be processed`}
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {files.map((file, fileIndex) => (
              <ImagePreview
                key={file.name + file.preview}
                file={file}
                format={format}
                onRemove={() => handleRemoveFile(fileIndex)}
                extraData={
                  file.processed && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleViewDiff(fileIndex)}
                    >
                      View Diff
                    </Button>
                  )
                }
              />
            ))}
          </div>
        )}

        {selectedFileIndex !== null && files[selectedFileIndex]?.processed && (
          <ImageDiffModal
            isOpen={true}
            onClose={() => setSelectedFileIndex(null)}
            originalSrc={files[selectedFileIndex].preview}
            processedSrc={URL.createObjectURL(files[selectedFileIndex].processed)}
            originalWidth={files[selectedFileIndex].originalWidth ?? 0}
            originalHeight={files[selectedFileIndex].originalHeight ?? 0}
            newWidth={files[selectedFileIndex].newWidth ?? 0}
            newHeight={files[selectedFileIndex].newHeight ?? 0}
          />
        )}
      </Card>
    </div>
  );
}
