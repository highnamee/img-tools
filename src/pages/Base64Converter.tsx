import { useState, useCallback } from "react";
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
    total: number;
    completed: number;
    processing: number;
  }>({
    total: 0,
    completed: 0,
    processing: 0,
  });

  const handleFilesAdded = useCallback((newFiles: ImageFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const convertToBase64 = useCallback(async () => {
    if (files.length === 0) return;

    // Create a processing queue with max 3 concurrent tasks
    const queue = createImageProcessingQueue<Base64ImageFile>();

    // Mark all files as not processing yet
    setFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        isProcessing: false,
        isError: false,
      }))
    );

    // Set initial processing status
    setProcessingStatus({
      total: files.length,
      completed: 0,
      processing: 0,
    });

    // Add all tasks to the queue
    files.forEach((imageFile, index) => {
      queue.enqueue(
        // Task to execute
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

          // Update processing status
          setProcessingStatus((prev) => ({
            ...prev,
            processing: prev.processing + 1,
          }));

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
        },
        // On complete callback
        (result) => {
          setFiles((prevFiles) => {
            const updatedFiles = [...prevFiles];
            updatedFiles[index] = result;
            return updatedFiles;
          });

          setProcessingStatus((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            processing: prev.processing - 1,
          }));
        },
        // On error callback
        (error) => {
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

          setProcessingStatus((prev) => ({
            ...prev,
            completed: prev.completed + 1,
            processing: prev.processing - 1,
          }));
        }
      );
    });
  }, [files]);

  const viewBase64Output = useCallback((index: number) => {
    setSelectedFileIndex(index);
  }, []);

  const closeBase64Output = useCallback(() => {
    setSelectedFileIndex(null);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Image to Base64 Converter</h1>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        <div className="space-y-6">
          <p className="text-muted-foreground text-xs">
            Convert images to base64 encoded strings that can be used in HTML img tags or CSS
            backgrounds
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={convertToBase64}
                disabled={files.length === 0 || files.some((f) => f.isProcessing)}
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

            {processingStatus.processing > 0 && (
              <div className="text-muted-foreground text-xs">
                Processing {processingStatus.processing} images in parallel (completed{" "}
                {processingStatus.completed} of {processingStatus.total})
              </div>
            )}
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {files.map((file, fileIndex) => (
              <ImagePreview
                key={file.name + file.preview}
                file={file}
                format={extractImageFormat(file.name)}
                onRemove={() => handleRemoveFile(fileIndex)}
                hideDownload={true}
                extraData={
                  <div className="space-y-0.5">
                    {file.base64String && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => viewBase64Output(fileIndex)}
                      >
                        View Base64
                      </Button>
                    )}
                  </div>
                }
              />
            ))}
          </div>
        )}

        {selectedFileIndex !== null &&
          files[selectedFileIndex] &&
          files[selectedFileIndex].base64String &&
          files[selectedFileIndex].htmlImgTag && (
            <Base64Modal
              isOpen={true}
              onClose={closeBase64Output}
              base64String={files[selectedFileIndex].base64String!}
              htmlImgTag={files[selectedFileIndex].htmlImgTag!}
              fileName={files[selectedFileIndex].name}
              originalSize={files[selectedFileIndex].file.size}
            />
          )}
      </Card>
    </div>
  );
}
