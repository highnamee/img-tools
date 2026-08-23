import { useState } from "react";

import { Code2, RotateCcw, Trash2 } from "lucide-react";

import { Base64Modal } from "@/components/Base64Modal";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useImageQueue } from "@/hooks/useImageQueue";
import { fileToBase64, createImgTagWithBase64 } from "@/services/base64Service";
import { ImageFile } from "@/services/imageService";
import { extractImageFormat } from "@/utils/imageUtils";

interface Base64ImageFile extends ImageFile {
  base64String?: string;
  htmlImgTag?: string;
}

export default function Base64Converter() {
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
  } = useImageQueue<Base64ImageFile>(2);

  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

  const processImageFile = async (imageFile: Base64ImageFile, index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = { ...updatedFiles[index], isProcessing: true, isError: false };
      return updatedFiles;
    });

    const base64String = await fileToBase64(imageFile.file);
    const htmlImgTag = createImgTagWithBase64(base64String);

    return {
      ...imageFile,
      processed: imageFile.file,
      processedPreview: imageFile.preview,
      base64String,
      htmlImgTag,
      isProcessing: false,
      isError: false,
    };
  };

  const handleComplete = (result: Base64ImageFile, index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = result;
      return updatedFiles;
    });
  };

  const handleError = (error: Error, imageFile: Base64ImageFile, index: number) => {
    console.error(`Error converting ${imageFile.name} to base64:`, error);
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = { ...updatedFiles[index], isProcessing: false, isError: true };
      return updatedFiles;
    });
  };

  const convertToBase64 = async () => {
    if (files.length === 0) return;
    queue.current!.clear();
    setFiles((prevFiles) => prevFiles.map((file) => ({ ...file, isError: false })));

    files.forEach((imageFile, index) => {
      if (imageFile.base64String) return;
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

  const resetAllFiles = () => {
    queue.current!.clear();
    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        if (file.processedPreview && file.processedPreview !== file.preview) {
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
          base64String: undefined,
          htmlImgTag: undefined,
        };
      })
    );
  };

  return (
    <ToolLayout
      leftPanel={
        <>
          <div>
            <h1 className="text-2xl font-bold">Base64 Converter</h1>
            <p className="text-muted-foreground mt-1 text-xs">
              Convert images to Base64 strings for use in HTML img tags or CSS backgrounds
            </p>
          </div>

          <hr className="border-border/60" />

          <div className="space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={convertToBase64}
                  disabled={files.length === 0 || files.some((f) => f.isProcessing)}
                  size="default"
                  className="w-full"
                >
                  <Code2 className="mr-2 h-4 w-4" />
                  {processingStatus.processing > 0 ? "Converting…" : "Convert to Base64"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Encode all images as Base64 data URLs</TooltipContent>
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
                <TooltipContent side="right">Discard all encoded results and revert to originals</TooltipContent>
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
              format={extractImageFormat(file.name)}
              onRemove={() => handleRemoveFile(fileIndex)}
              onPreview={file.base64String ? () => setSelectedFileIndex(fileIndex) : undefined}
              hideDownload={true}
              extraData={
                file.base64String && (
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

      {selectedFileIndex !== null &&
        files[selectedFileIndex]?.base64String &&
        files[selectedFileIndex]?.htmlImgTag && (
          <Base64Modal
            isOpen={true}
            onClose={() => setSelectedFileIndex(null)}
            base64String={files[selectedFileIndex].base64String}
            htmlImgTag={files[selectedFileIndex].htmlImgTag}
            fileName={files[selectedFileIndex].name}
            originalSize={files[selectedFileIndex].file.size}
          />
        )}
    </ToolLayout>
  );
}
