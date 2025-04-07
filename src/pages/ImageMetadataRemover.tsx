import { useState } from "react";

import { ImageDropZone } from "@/components/ImageDropZone";
import { ImageMetadataModal } from "@/components/ImageMetadataModal";
import { ImagePreview } from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { downloadAllFiles } from "@/services/fileService";
import { ImageFile } from "@/services/imageService";
import { MetadataField, extractMetadata, removeMetadata } from "@/services/metadataService";
import { createImageProcessingQueue } from "@/services/queueService";
import { extractImageFormat } from "@/utils/imageUtils";

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

  const handleFilesAdded = async (newFiles: ImageFile[]) => {
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
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleShowAllMetadata = (index: number) => {
    setSelectedFileIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedFileIndex(null);
  };

  const processImageFile = async (file: ImageWithMetadata, index: number) => {
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
  };

  const handleComplete = (result: ImageWithMetadata, index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = result;
      return updatedFiles;
    });
  };

  const handleError = (error: Error, file: ImageWithMetadata, index: number) => {
    console.error(`Error processing ${file.name}:`, error);
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
    const queue = createImageProcessingQueue<ImageWithMetadata>();

    setFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        isError: false,
      }))
    );

    files.forEach((file, index) => {
      if (file.processed) return;

      queue.enqueue({
        task: () => processImageFile(file, index),
        onComplete: (result) => handleComplete(result, index),
        onError: (error) => handleError(error, file, index),
        onProgress: handleProgress,
      });
    });

    setProcessingStatus({
      waiting: queue.waiting,
      processing: queue.active,
    });
  };

  const downloadAll = () => {
    const filesToDownload = files
      .filter((file) => file.processed)
      .map((file) => ({
        blob: file.processed!,
        filename: file.name,
      }));
    downloadAllFiles(filesToDownload);
  };

  const openInGoogleMaps = (coordinates: { lat: number; lng: number }) => {
    const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
    window.open(url, "_blank");
  };

  const resetAllFiles = () => {
    setFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        processed: undefined,
        isProcessing: false,
        isError: false,
        newWidth: undefined,
        newHeight: undefined,
        metadata: undefined,
        coordinates: undefined,
      }))
    );
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <div>
          <h1 className="mb-4 text-2xl font-bold">Image Metadata Remover</h1>
          <h2 className="text-muted-foreground mb-4 text-xs">
            View and remove metadata from your images including GPS coordinates, camera information,
            and other sensitive data
          </h2>
        </div>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        <div className="space-y-6">
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
              <Button onClick={resetAllFiles} disabled={files.length === 0} variant="outline">
                Reset All
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
