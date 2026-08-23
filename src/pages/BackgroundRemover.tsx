import { useState, useEffect } from "react";

import { Download, Eraser, RotateCcw, Trash2 } from "lucide-react";

import { ImageDiffModal } from "@/components/ImageDiffModal";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import { ResizeControl } from "@/components/ResizeControl";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

  const processImageFile = async (imageFile: ImageFile, index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = { ...updatedFiles[index], isProcessing: true, isError: false };
      return updatedFiles;
    });

    const { removeBackground } = await import("@imgly/background-removal");

    let processedBlob;
    try {
      processedBlob = await removeBackground(imageFile.file, {
        device: "gpu",
        model: modelVariant,
        output: { format: "image/png", quality: 1 },
        progress: (key, current, total) => {
          if (key.startsWith("fetch:")) {
            const pct = Math.round((current / total) * 100);
            setLoadingStatus(pct === 100 ? "" : `Downloading model: (${pct}%)`);
          }
        },
      });
    } catch (gpuError) {
      console.warn("GPU background removal failed, trying CPU fallback:", gpuError);
      processedBlob = await removeBackground(imageFile.file, {
        device: "cpu",
        model: modelVariant,
        output: { format: "image/png", quality: 1 },
        progress: (key, current, total) => {
          if (key.startsWith("fetch:")) {
            const pct = Math.round((current / total) * 100);
            setLoadingStatus(pct === 100 ? "" : `Downloading model: (${pct}%)`);
          }
        },
      });
    }

    const processedFile = {
      ...imageFile,
      file: new File([processedBlob], imageFile.name, { type: "image/png", lastModified: Date.now() }),
    };

    const compressedBlob = await convertImage(processedFile, "png", quality, resize.activeOptions);
    const { width: newWidth, height: newHeight } = await getImageSize(compressedBlob);

    if (imageFile.processedPreview) URL.revokeObjectURL(imageFile.processedPreview);

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
      updatedFiles[index] = { ...updatedFiles[index], isProcessing: false, isError: true };
      return updatedFiles;
    });
  };

  const processImages = async () => {
    queue.current!.clear();
    setFiles((prevFiles) => prevFiles.map((file) => ({ ...file, isError: false })));

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
      .map((file) => ({ blob: file.processed!, filename: `${file.name.split(".")[0]}-no-bg.png` }));
    downloadAllFiles(filesToDownload);
  };

  const resetAllFiles = () => {
    queue.current!.clear();
    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        if (file.processedPreview) URL.revokeObjectURL(file.processedPreview);
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
    <ToolLayout
      leftPanel={
        <>
          <div>
            <h1 className="text-2xl font-bold">Background Remover</h1>
            <p className="text-muted-foreground mt-1 text-xs">
              Remove backgrounds from images with one click — perfect for product photos, portraits,
              and more
            </p>
          </div>

          {loadingStatus && (
            <div className="bg-primary/5 text-primary border-primary/20 flex animate-pulse items-center gap-3 rounded-lg border p-3 text-xs">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent flex-shrink-0" />
              <span>{loadingStatus}</span>
            </div>
          )}

          <hr className="border-border/60" />

          <div className="space-y-5">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Settings
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium">Quality: {quality}%</label>
                <button onClick={() => setQuality(80)} className="text-primary text-xs hover:underline">
                  Reset
                </button>
              </div>
              <Slider
                value={[quality]}
                onValueChange={([value]) => setQuality(value)}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model Preset</label>
              <Select
                value={modelVariant}
                onValueChange={(val: "isnet_fp16" | "isnet" | "isnet_quint8") => setModelVariant(val)}
              >
                <SelectTrigger className="w-full">
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

          <hr className="border-border/60" />

          <div className="space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={processImages}
                  disabled={files.length === 0 || files.some((f) => f.isProcessing)}
                  size="default"
                  className="w-full"
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  {processingStatus.processing > 0 ? "Removing…" : "Remove Background"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Remove background from all queued images using AI</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={downloadAll}
                  disabled={!files.some((f) => f.processed)}
                  variant="outline"
                  size="default"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Download all processed images as a ZIP</TooltipContent>
            </Tooltip>

            <div className="flex gap-2 pt-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={resetAllFiles}
                    disabled={files.length === 0}
                    variant="outline"
                    size="default"
                    className="flex-1"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Reset All
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Discard all processed results and revert to originals</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={clearAllFiles}
                    disabled={files.length === 0}
                    variant="destructive"
                    size="default"
                    className="flex-1"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Remove All
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Remove all files from the queue</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {(files.length > 0 || processingStatus.processing > 0) && (
            <p className="text-muted-foreground text-xs">
              {files.length} file{files.length !== 1 ? "s" : ""}
              {processingStatus.processing > 0 && ` • Processing ${processingStatus.processing}`}
              {processingStatus.waiting > 0 && ` • ${processingStatus.waiting} waiting`}
            </p>
          )}
        </>
      }
    >
      <ImageDropZone onFilesAdded={handleFilesAdded} />

      {files.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {files.map((file, fileIndex) => (
            <ImagePreview
              key={file.name + file.preview}
              file={file}
              format="png"
              onRemove={() => handleRemoveFile(fileIndex)}
              onPreview={file.processed ? () => setSelectedFileIndex(fileIndex) : undefined}
              extraData={
                file.processed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
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
    </ToolLayout>
  );
}
