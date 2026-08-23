import { useState } from "react";

import { Base64Modal } from "@/components/Base64Modal";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      updatedFiles[index] = {
        ...updatedFiles[index],
        isProcessing: true,
        isError: false,
      };
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
      updatedFiles[index] = {
        ...updatedFiles[index],
        isProcessing: false,
        isError: true,
      };
      return updatedFiles;
    });
  };

  const convertToBase64 = async () => {
    if (files.length === 0) return;

    queue.current!.clear();

    setFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        isError: false,
      }))
    );

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

  const viewBase64Output = (index: number) => {
    setSelectedFileIndex(index);
  };

  const closeBase64Output = () => {
    setSelectedFileIndex(null);
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
    <div className="container mx-auto py-8">
      <Card className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Image to Base64 Converter</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Convert images to Base64 encoded strings for use in HTML img tags or CSS backgrounds
          </p>
        </div>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        {/* Action Toolbar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={convertToBase64}
              disabled={files.length === 0 || files.some((f) => f.isProcessing)}
              size="sm"
            >
              {processingStatus.processing > 0 ? "Converting…" : "Convert to Base64"}
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

      {/* Image Grid */}
      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
          {files.map((file, fileIndex) => (
            <ImagePreview
              key={file.name + file.preview}
              file={file}
              format={extractImageFormat(file.name)}
              onRemove={() => handleRemoveFile(fileIndex)}
              onPreview={file.base64String ? () => viewBase64Output(fileIndex) : undefined}
              hideDownload={true}
              extraData={
                file.base64String && (
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

      {/* Base64 output modal */}
      {selectedFileIndex !== null &&
        files[selectedFileIndex]?.base64String &&
        files[selectedFileIndex]?.htmlImgTag && (
          <Base64Modal
            isOpen={true}
            onClose={closeBase64Output}
            base64String={files[selectedFileIndex].base64String}
            htmlImgTag={files[selectedFileIndex].htmlImgTag}
            fileName={files[selectedFileIndex].name}
            originalSize={files[selectedFileIndex].file.size}
          />
        )}
    </div>
  );
}
