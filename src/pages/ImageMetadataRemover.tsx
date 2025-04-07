import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import { ImageMetadataModal } from "@/components/ImageMetadataModal";
import { ImageFile } from "@/services/imageService";
import { MetadataField, extractMetadata, removeMetadata } from "@/services/metadataService";
import { downloadAllFiles } from "@/services/fileService";
import { extractImageFormat } from "@/utils/imageUtils";
import { createImageProcessingQueue } from "@/services/queueService";

interface ImageWithMetadata extends ImageFile {
  metadata?: MetadataField[];
  coordinates?: { lat: number; lng: number };
}

export default function ImageMetadataRemover() {
  const [files, setFiles] = useState<ImageWithMetadata[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    waiting: number;
    processing: number;
  }>({
    waiting: 0,
    processing: 0,
  });

  const handleFilesAdded = useCallback(async (newFiles: ImageFile[]) => {
    const filesWithMetadata = await Promise.all(
      newFiles.map(async (file) => {
        const { metadata, coordinates } = await extractMetadata(file.file);
        return {
          ...file,
          metadata,
          coordinates,
        };
      })
    );

    setFiles((prev) => [...prev, ...filesWithMetadata]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleShowAllMetadata = useCallback((index: number) => {
    setSelectedFileIndex(index);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedFileIndex(null);
  }, []);

  const processImages = useCallback(async () => {
    // Create a processing queue with max 3 concurrent tasks
    const queue = createImageProcessingQueue<ImageWithMetadata>();

    // Mark all files as not processing yet
    setFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        isError: false,
      }))
    );

    // Add all tasks to the queue
    files.forEach((file, index) => {
      if (file.processed) return;

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

          const processedBlob = await removeMetadata(file.file);

          return {
            ...file,
            processed: processedBlob,
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
          console.error("Error processing image:", error);
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
  }, [files]);

  const downloadAll = useCallback(() => {
    const filesToDownload = files
      .filter((file) => file.processed)
      .map((file) => ({
        blob: file.processed!,
        filename: file.name,
      }));
    downloadAllFiles(filesToDownload);
  }, [files]);

  const openInGoogleMaps = useCallback((coordinates: { lat: number; lng: number }) => {
    const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
    window.open(url, "_blank");
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Image Metadata Remover</h1>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        <div className="space-y-6">
          <p className="text-muted-foreground text-xs">
            View and remove metadata from your images including GPS coordinates, camera information,
            and other sensitive data
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={processImages}
                disabled={files.length === 0 || files.some((f) => f.isProcessing)}
                className="w-40"
              >
                {processingStatus.processing > 0 ? `Removing...` : "Remove Metadata"}
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
                format={extractImageFormat(file.name)}
                onRemove={() => handleRemoveFile(fileIndex)}
                extraData={
                  file.metadata && file.metadata.length > 0 ? (
                    <div className="space-y-1">
                      {file.metadata.slice(0, 5).map((field) => (
                        <div key={field.name} className="flex items-center gap-2 text-xs">
                          <span className="min-w-1/4 font-medium">{field.name}</span>
                          <span className="text-muted-foreground ml-2">{field.value}</span>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2">
                        {file.coordinates && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => openInGoogleMaps(file.coordinates!)}
                          >
                            View on Map 🗺️
                          </Button>
                        )}
                        {file.metadata.length > 5 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => handleShowAllMetadata(fileIndex)}
                          >
                            Show all ({file.metadata.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}

        {selectedFileIndex !== null && files[selectedFileIndex]?.metadata && (
          <ImageMetadataModal
            isOpen={true}
            onClose={handleCloseModal}
            metadata={files[selectedFileIndex].metadata}
          />
        )}
      </Card>
    </div>
  );
}
