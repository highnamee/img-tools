import { useState } from "react";

import {
  Download,
  ImagePlay,
  RotateCcw,
  Trash2,
} from "lucide-react";

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
import {
  ImageFile,
  ConversionFormat,
  convertImage,
  formatRecommendations,
  getImageSize,
} from "@/services/imageService";

export default function ImageConverter() {
  const {
    files,
    setFiles,
    processingStatus,
    setProcessingStatus,
    queue,
    handleFilesAdded,
    handleRemoveFile,
    clearAllFiles,
    resetSingleFile,
    handleProgress,
  } = useImageQueue<ImageFile>(2);
  const [format, setFormat] = useState<ConversionFormat>("jpeg");
  const [quality, setQuality] = useState(85);
  const resize = useResizeControl();
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

  const handleFormatChange = (newFormat: ConversionFormat) => {
    setFormat(newFormat);
    setQuality(formatRecommendations[newFormat].defaultQuality);
  };

  const processImageFile = async (imageFile: ImageFile, index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = { ...updatedFiles[index], isProcessing: true, isError: false };
      return updatedFiles;
    });

    const processedBlob = await convertImage(imageFile, format, quality, resize.activeOptions);
    const { width: newWidth, height: newHeight } = await getImageSize(processedBlob);

    if (imageFile.processedPreview) URL.revokeObjectURL(imageFile.processedPreview);

    return {
      ...imageFile,
      processed: processedBlob,
      processedPreview: URL.createObjectURL(processedBlob),
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
    console.error(`Error converting image ${imageFile.name}:`, error);
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = { ...updatedFiles[index], isProcessing: false, isError: true };
      return updatedFiles;
    });
  };

  const convertImages = async () => {
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

    setProcessingStatus({
      waiting: queue.current!.waiting,
      processing: queue.current!.active,
    });
  };

  const downloadAll = () => {
    const filesToDownload = files.filter((file) => file.processed);
    if (filesToDownload.length > 0) {
      downloadAllFiles(
        filesToDownload.map((file) => ({
          blob: file.processed!,
          filename: `${file.name.split(".")[0]}.${format}`,
        }))
      );
    }
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
            <h1 className="text-2xl font-bold">Image Converter</h1>
            <p className="text-muted-foreground mt-1 text-xs">
              Convert images between formats with quality and resize options
            </p>
          </div>

          <hr className="border-border/60" />

          <div className="space-y-5">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Settings
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Output Format</label>
              <Select
                value={format}
                onValueChange={(value) => handleFormatChange(value as ConversionFormat)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="avif">AVIF</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {formatRecommendations[format].description}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
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
                className="w-full"
              />
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
                  onClick={convertImages}
                  disabled={files.length === 0 || files.some((f) => f.isProcessing)}
                  size="default"
                  className="w-full"
                >
                  <ImagePlay className="mr-2 h-4 w-4" />
                  {processingStatus.processing > 0 ? "Converting…" : "Convert Images"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Convert all queued images to the selected format</TooltipContent>
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
              <TooltipContent side="right">Download all successfully converted images as a ZIP</TooltipContent>
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
                <TooltipContent side="right">Discard all conversion results and revert to originals</TooltipContent>
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
              {processingStatus.processing > 0 && ` • Converting ${processingStatus.processing}`}
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
              format={format}
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
