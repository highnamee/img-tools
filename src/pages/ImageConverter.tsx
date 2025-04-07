import { useState, useCallback, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import {
  ImageFile,
  ConversionFormat,
  convertImage,
  formatRecommendations,
  ResizeOptions,
} from "@/services/imageService";
import { downloadAllFiles } from "@/services/fileService";
import { ImageDiffModal } from "@/components/ImageDiffModal";
import { createImageProcessingQueue } from "@/services/queueService";

export default function ImageConverter() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [format, setFormat] = useState<ConversionFormat>("png");
  const [quality, setQuality] = useState(80);
  const [resizeOptions, setResizeOptions] = useState<ResizeOptions>({ width: 0, height: 0 });
  const [enableResize, setEnableResize] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    waiting: number;
    processing: number;
  }>({
    waiting: 0,
    processing: 0,
  });

  useEffect(() => {
    setQuality(formatRecommendations[format].defaultQuality);
  }, [format]);

  const handleFilesAdded = useCallback((newFiles: ImageFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    setResizeOptions((prev) => ({
      ...prev,
      width: e.target.value ? parseInt(e.target.value) : 0,
    }));
  };

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    setResizeOptions((prev) => ({
      ...prev,
      height: e.target.value ? parseInt(e.target.value) : 0,
    }));
  };

  const convertImages = useCallback(async () => {
    // Create a processing queue with max 3 concurrent tasks
    const queue = createImageProcessingQueue<ImageFile>();

    setFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        isError: false,
      }))
    );

    // Add all tasks to the queue
    files.forEach((imageFile, index) => {
      if (imageFile.processed) return;

      queue.enqueue(
        async () => {
          // Mark this file as processing
          setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[index] = {
              ...updatedFiles[index],
              isProcessing: true,
              isError: false,
            };
            return updatedFiles;
          });

          const processedBlob = await convertImage(
            imageFile.file,
            format,
            quality,
            enableResize ? resizeOptions : undefined
          );

          // Calculate new dimensions
          const img = new Image();
          img.src = URL.createObjectURL(processedBlob);
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          return {
            ...imageFile,
            processed: processedBlob,
            newWidth: img.width,
            newHeight: img.height,
            isProcessing: false,
            isError: false,
          };
        },
        // On complete callback
        (result) => {
          setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[index] = result;
            return updatedFiles;
          });
        },
        // On error callback
        (error) => {
          console.error(`Error converting image ${imageFile.name}:`, error);
          setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[index] = {
              ...updatedFiles[index],
              isProcessing: false,
              isError: true,
            };
            return updatedFiles;
          });
        },
        // On progress callback
        (processing, waiting) => {
          setProcessingStatus({ waiting, processing });
        }
      );
    });

    setProcessingStatus({
      waiting: queue.waiting,
      processing: queue.active,
    });
  }, [files, format, quality, enableResize, resizeOptions]);

  const downloadAll = useCallback(() => {
    const filesToDownload = files.filter((file) => file.processed);
    if (filesToDownload.length > 0) {
      downloadAllFiles(
        filesToDownload.map((file) => ({
          blob: file.processed!,
          filename: `${file.name.split(".")[0]}.${format}`,
        }))
      );
    }
  }, [files, format]);

  const handleViewDiff = useCallback((index: number) => {
    setSelectedFileIndex(index);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Image Converter</h1>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        <div className="space-y-6">
          <p className="text-muted-foreground text-xs">
            Convert images between different formats with options to adjust quality and resize
            dimensions
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-10">
              <div className="space-y-2">
                <label className="text-sm font-medium">Output Format</label>
                <Select
                  value={format}
                  onValueChange={(value) => setFormat(value as ConversionFormat)}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="avif">AVIF</SelectItem>
                    <SelectItem value="gif">GIF</SelectItem>
                    <SelectItem value="bmp">BMP</SelectItem>
                    <SelectItem value="tiff">TIFF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quality: {quality}%</label>
                  <button
                    onClick={() => setQuality(formatRecommendations[format].defaultQuality)}
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

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch checked={enableResize} onCheckedChange={setEnableResize} />
                  <label className="font-medium">
                    <span className="text-sm">Resize</span>
                    <span className="text-xs">
                      {" • Aspect ratio will be maintained automatically"}
                    </span>
                  </label>
                </div>
                {enableResize && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Width"
                      value={resizeOptions.width || ""}
                      onChange={handleWidthChange}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">or</span>
                    <Input
                      type="number"
                      placeholder="Height"
                      value={resizeOptions.height || ""}
                      onChange={handleHeightChange}
                      className="w-28"
                    />
                  </div>
                )}
              </div>
            </div>

            <p className="text-muted-foreground text-xs">
              {formatRecommendations[format].description}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={convertImages}
                disabled={files.length === 0 || files.some((f) => f.isProcessing)}
                className="w-32"
              >
                {processingStatus.processing > 0 ? `Converting...` : "Convert Images"}
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
              {processingStatus.processing > 0 &&
                `• Processing ${processingStatus.processing} images`}
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
