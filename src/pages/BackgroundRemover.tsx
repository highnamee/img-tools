import { useState, ChangeEvent } from "react";

import { ImageDiffModal } from "@/components/ImageDiffModal";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { downloadAllFiles } from "@/services/fileService";
import { ImageFile, convertImage, ResizeOptions, getImageSize } from "@/services/imageService";
import { createImageProcessingQueue } from "@/services/queueService";

export default function BackgroundRemover() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState<number>(80);
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
  const [loadingStatus, setLoadingStatus] = useState<string>("");

  const handleFilesAdded = (newFiles: ImageFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleViewDiff = (index: number) => {
    setSelectedFileIndex(index);
  };

  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    setResizeOptions(() => ({
      height: 0,
      width: e.target.value ? parseInt(e.target.value) : 0,
    }));
  };

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    setResizeOptions(() => ({
      height: e.target.value ? parseInt(e.target.value) : 0,
      width: 0,
    }));
  };

  const processImageFile = async (imageFile: ImageFile, index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = {
        ...updatedFiles[index],
        isProcessing: true,
        isError: false,
      };
      return updatedFiles;
    });

    const { removeBackground } = await import("@imgly/background-removal");

    const processedBlob = await removeBackground(imageFile.file, {
      device: "gpu",
      output: {
        format: "image/png",
        quality: 1,
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

    const processedFile = {
      ...imageFile,
      file: new File([processedBlob], imageFile.name, {
        type: "image/png",
        lastModified: Date.now(),
      }),
    };

    const compressedBlob = await convertImage(
      processedFile,
      "png",
      quality,
      enableResize ? resizeOptions : undefined
    );

    const { width: newWidth, height: newHeight } = await getImageSize(compressedBlob);

    return {
      ...imageFile,
      processed: compressedBlob,
      newWidth,
      newHeight,
      isProcessing: false,
      isError: false,
    };
  };

  const handleComplete = (result: ImageFile, index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = result;
      return updatedFiles;
    });
  };

  const handleError = (error: Error, imageFile: ImageFile, index: number) => {
    console.error(`Error processing image ${imageFile.name}:`, error);
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = {
        ...updatedFiles[index],
        isProcessing: false,
        isError: true,
      };
      return updatedFiles;
    });
  };

  const handleProgress = (processing: number, waiting: number) => {
    setProcessingStatus({ waiting, processing });
  };

  const processImages = async () => {
    try {
      const queue = createImageProcessingQueue<ImageFile>(1);

      setFiles((prevFiles) =>
        prevFiles.map((file) => ({
          ...file,
          isError: false,
        }))
      );

      files.forEach((imageFile, index) => {
        queue.enqueue({
          task: () => processImageFile(imageFile, index),
          onComplete: (result) => handleComplete(result, index),
          onError: (error) => handleError(error, imageFile, index),
          onProgress: handleProgress,
        });
      });

      setProcessingStatus({
        waiting: queue.waiting,
        processing: queue.active,
      });
    } catch (error) {
      console.error("Error processing images:", error);
    } finally {
      setLoadingStatus("");
    }
  };

  const downloadAll = () => {
    const filesToDownload = files
      .filter((file) => file.processed)
      .map((file) => ({
        blob: file.processed!,
        filename: `${file.name.split(".")[0]}-no-bg.png`,
      }));
    downloadAllFiles(filesToDownload);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold">Background Remover</h1>
          <h2 className="text-muted-foreground mb-4 text-xs">
            Remove backgrounds from your images with one click - perfect for product photos,
            portraits, and more.
          </h2>
        </div>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        <div className="space-y-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-10">
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
                format="png"
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
