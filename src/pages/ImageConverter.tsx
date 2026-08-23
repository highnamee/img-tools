import { useState } from "react";

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
      updatedFiles[index] = {
        ...updatedFiles[index],
        isProcessing: true,
        isError: false,
      };
      return updatedFiles;
    });

    const processedBlob = await convertImage(
      imageFile,
      format,
      quality,
      resize.activeOptions
    );

    const { width: newWidth, height: newHeight } = await getImageSize(processedBlob);

    if (imageFile.processedPreview) {
      URL.revokeObjectURL(imageFile.processedPreview);
    }

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
      updatedFiles[index] = {
        ...updatedFiles[index],
        isProcessing: false,
        isError: true,
      };
      return updatedFiles;
    });
  };


  const convertImages = async () => {
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

  const handleViewDiff = (index: number) => {
    setSelectedFileIndex(index);
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
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Image Converter</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Convert images between different formats with options to adjust quality and resize
            dimensions
          </p>
        </div>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        <div className="bg-muted/30 border-border mt-6 rounded-xl border p-4">
          <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">Settings</p>
          <div className="flex flex-wrap items-start gap-8">
            <div className="space-y-2">
              <label className="text-sm font-medium">Output Format</label>
              <Select
                value={format}
                onValueChange={(value) => handleFormatChange(value as ConversionFormat)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="bmp">BMP</SelectItem>
                  <SelectItem value="tiff">TIFF</SelectItem>
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
                className="w-56"
              />
            </div>

            <ResizeControl
              enabled={resize.enabled}
              onEnabledChange={resize.setEnabled}
              value={resize.options}
              onChange={resize.setOptions}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={convertImages}
              disabled={files.length === 0 || files.some((f) => f.isProcessing)}
              size="sm"
            >
              {processingStatus.processing > 0 ? "Converting…" : "Convert Images"}
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
            {processingStatus.processing > 0 && ` • Converting ${processingStatus.processing}`}
            {processingStatus.waiting > 0 && ` • ${processingStatus.waiting} waiting`}
          </p>
        )}
      </Card>

      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
          {files.map((file, fileIndex) => (
            <ImagePreview
              key={file.name + file.preview}
              file={file}
              format={format}
              onRemove={() => handleRemoveFile(fileIndex)}
              onPreview={file.processed ? () => handleViewDiff(fileIndex) : undefined}
              extraData={
                file.processed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs flex-1"
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
    </div>
  );
}
