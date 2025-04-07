import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import { ImageFile } from "@/services/imageService";
import { fileToBase64, createImgTagWithBase64 } from "@/services/base64Service";
import { Base64Modal } from "@/components/Base64Modal";
import { extractImageFormat } from "@/utils/imageUtils";
import { createImageProcessingQueue } from "@/services/queueService";

interface Base64ImageFile extends ImageFile {
  base64String?: string;
  htmlImgTag?: string;
}

export default function Base64Converter() {
  const [files, setFiles] = useState<Base64ImageFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    waiting: number;
    processing: number;
  }>({
    waiting: 0,
    processing: 0,
  });

  const handleFilesAdded = (newFiles: ImageFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

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

  const handleProgress = (processing: number, waiting: number) => {
    setProcessingStatus({ waiting, processing });
  };

  const convertToBase64 = async () => {
    if (files.length === 0) return;

    const queue = createImageProcessingQueue<Base64ImageFile>();

    setFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        isError: false,
      }))
    );

    files.forEach((imageFile, index) => {
      if (imageFile.base64String) return;

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
  };

  const viewBase64Output = (index: number) => {
    setSelectedFileIndex(index);
  };

  const closeBase64Output = () => {
    setSelectedFileIndex(null);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold">Image to Base64 Converter</h1>
          <h2 className="text-muted-foreground mb-4 text-xs">
            Convert images to base64 encoded strings that can be used in HTML img tags or CSS
            backgrounds
          </h2>
        </div>
        <ImageDropZone onFilesAdded={handleFilesAdded} />

        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={convertToBase64}
                disabled={files.length === 0 || files.some((f) => f.isProcessing)}
                className="w-32"
              >
                {processingStatus.processing > 0 ? `Converting...` : "Convert Images"}
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
                format={extractImageFormat(file.name)}
                onRemove={() => handleRemoveFile(fileIndex)}
                hideDownload={true}
                extraData={
                  file.base64String && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => viewBase64Output(fileIndex)}
                    >
                      View Base64
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
              onClose={closeBase64Output}
              base64String={files[selectedFileIndex].base64String}
              htmlImgTag={files[selectedFileIndex].htmlImgTag}
              fileName={files[selectedFileIndex].name}
              originalSize={files[selectedFileIndex].file.size}
            />
          )}
      </Card>
    </div>
  );
}
