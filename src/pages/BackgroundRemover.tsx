import { useState, useEffect } from "react";

import { ImageDiffModal } from "@/components/ImageDiffModal";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import { ResizeControl } from "@/components/ResizeControl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useImageQueue } from "@/hooks/useImageQueue";
import { useResizeControl } from "@/hooks/useResizeControl";
import { downloadAllFiles } from "@/services/fileService";
import { ImageFile, convertImage, getImageSize } from "@/services/imageService";

export default function BackgroundRemover() {
  const {
    files,
    setFiles,
    processingStatus,
    queue,
    handleFilesAdded,
    handleRemoveFile,
    clearAllFiles,
    resetSingleFile,
    handleProgress,
  } = useImageQueue<ImageFile>(1);
  const [quality, setQuality] = useState<number>(80);
  const [modelVariant, setModelVariant] = useState<"isnet_fp16" | "isnet" | "isnet_quint8">("isnet_fp16");
  const resize = useResizeControl();
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>("");

  useEffect(() => {
    const preloadModel = async () => {
      try {
        const { preload } = await import("@imgly/background-removal");
        await preload({ device: "gpu", model: modelVariant });
      } catch (error) {
        console.warn("GPU model preloading failed, trying CPU fallback:", error);
        try {
          const { preload } = await import("@imgly/background-removal");
          await preload({ device: "cpu", model: modelVariant });
        } catch (cpuError) {
          console.error("CPU preloading failed too:", cpuError);
        }
      }
    };

    void preloadModel();
  }, [modelVariant]);

  const handleViewDiff = (index: number) => {
    setSelectedFileIndex(index);
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

    let processedBlob;
    try {
      processedBlob = await removeBackground(imageFile.file, {
        device: "gpu",
        model: modelVariant,
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
    } catch (gpuError) {
      console.warn("GPU background removal failed, trying CPU fallback:", gpuError);
      processedBlob = await removeBackground(imageFile.file, {
        device: "cpu",
        model: modelVariant,
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
    }

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
      resize.activeOptions
    );

    const { width: newWidth, height: newHeight } = await getImageSize(compressedBlob);

    if (imageFile.processedPreview) {
      URL.revokeObjectURL(imageFile.processedPreview);
    }

    return {
      ...imageFile,
      processed: compressedBlob,
      processedPreview: URL.createObjectURL(compressedBlob),
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

  const processImages = async () => {
    queue.current!.clear();

    setFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        isError: false,
      }))
    );

    files.forEach((imageFile, index) => {
      if (imageFile.processed) return;

      queue.current!.enqueue({
        task: () => processImageFile(imageFile, index),
        onComplete: (result) => handleComplete(result, index),
        onError: (error) => handleError(error, imageFile, index),
        onProgress: handleProgress,
      });
    });
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

  const resetAllFiles = () => {
    queue.current!.clear();
    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        if (file.processedPreview) {
          URL.revokeObjectURL(file.processedPreview);
        }
        return {
          ...file,
          processed: undefined,
          processedPreview: undefined,
          isProcessing: false,
          isError: false,
          newWidth: undefined,
          newHeight: undefined,
        };
      })
    );
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Background Remover</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Remove backgrounds from your images with one click — perfect for product photos,
            portraits, and more.
          </p>
        </div>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        {/* Model loading banner */}
        {loadingStatus && (
          <div className="bg-primary/5 text-primary border-primary/20 mt-4 flex animate-pulse items-center gap-3 rounded-lg border p-4 text-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>{loadingStatus}</span>
          </div>
        )}

        {/* Settings Panel */}
        <div className="bg-muted/30 border-border mt-6 rounded-xl border p-4">
          <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
            Settings
          </p>
          <div className="flex flex-wrap items-start gap-8">
            {/* Quality */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
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
                className="w-56"
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Model Preset</label>
              <Select
                value={modelVariant}
                onValueChange={(val: "isnet_fp16" | "isnet" | "isnet_quint8") =>
                  setModelVariant(val)
                }
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select Preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isnet_quint8">Speed (Quantized, ~22 MB)</SelectItem>
                  <SelectItem value="isnet_fp16">Balanced (16-bit, ~44 MB)</SelectItem>
                  <SelectItem value="isnet">Maximum Detail (32-bit, ~176 MB)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ResizeControl
              enabled={resize.enabled}
              onEnabledChange={resize.setEnabled}
              value={resize.options}
              onChange={resize.setOptions}
            />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={processImages}
              disabled={files.length === 0 || files.some((f) => f.isProcessing)}
              size="sm"
            >
              {processingStatus.processing > 0 ? "Removing…" : "Remove Background"}
            </Button>
            <Button
              onClick={downloadAll}
              disabled={!files.some((f) => f.processed)}
              variant="outline"
              size="sm"
            >
              Download All
            </Button>
            <Button onClick={resetAllFiles} disabled={files.length === 0} variant="outline" size="sm">
              Reset All
            </Button>
          </div>
          <Button
            onClick={clearAllFiles}
            disabled={files.length === 0}
            variant="destructive"
            size="sm"
          >
            Remove All
          </Button>
        </div>
        {(files.length > 0 || processingStatus.processing > 0) && (
          <p className="text-muted-foreground mt-1 text-xs">
            {files.length} file{files.length !== 1 ? "s" : ""}
            {processingStatus.processing > 0 && ` • Processing ${processingStatus.processing}`}
            {processingStatus.waiting > 0 && ` • ${processingStatus.waiting} waiting`}
          </p>
        )}
      </Card>

      {/* Image Grid */}
      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
          {files.map((file, fileIndex) => (
            <ImagePreview
              key={file.name + file.preview}
              file={file}
              format="png"
              onRemove={() => handleRemoveFile(fileIndex)}
              onPreview={file.processed ? () => handleViewDiff(fileIndex) : undefined}
              extraData={
                file.processed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 text-xs"
                    onClick={() => resetSingleFile(fileIndex)}
                  >
                    Reset
                  </Button>
                )
              }
            />
          ))}
        </div>
      )}

      {/* Preview modal */}
      {selectedFileIndex !== null && files[selectedFileIndex]?.processed && (
        <ImageDiffModal
          isOpen={true}
          onClose={() => setSelectedFileIndex(null)}
          originalSrc={files[selectedFileIndex].preview}
          processedSrc={files[selectedFileIndex].processedPreview ?? ""}
          originalWidth={files[selectedFileIndex].originalWidth ?? 0}
          originalHeight={files[selectedFileIndex].originalHeight ?? 0}
          newWidth={files[selectedFileIndex].newWidth ?? 0}
          newHeight={files[selectedFileIndex].newHeight ?? 0}
        />
      )}
    </div>
  );
}
