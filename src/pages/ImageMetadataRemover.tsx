import { useState } from "react";

import { ImageDropZone } from "@/components/ImageDropZone";
import { ImageMetadataModal } from "@/components/ImageMetadataModal";
import { ImagePreview } from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useImageQueue } from "@/hooks/useImageQueue";
import { downloadAllFiles } from "@/services/fileService";
import { ImageFile } from "@/services/imageService";
import { MetadataField, extractMetadata, removeMetadata } from "@/services/metadataService";
import { extractImageFormat } from "@/utils/imageUtils";

interface ImageWithMetadata extends ImageFile {
  metadata?: MetadataField[];
  coordinates?: { lat: number; lng: number };
}

export default function ImageMetadataRemover() {
  const {
    files,
    setFiles,
    processingStatus,
    setProcessingStatus,
    queue,
    handleRemoveFile,
    clearAllFiles,
    handleProgress,
  } = useImageQueue<ImageWithMetadata>(2);

  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

  const handleFilesAdded = async (newFiles: ImageFile[]) => {
    const filesWithMetadata = await Promise.all(
      newFiles.map(async (file) => {
        const { metadata, coordinates } = await extractMetadata(file.file);
        return { ...file, metadata, coordinates };
      })
    );
    setFiles((prev) => [...prev, ...filesWithMetadata]);
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
      updatedFiles[index] = { ...updatedFiles[index], isProcessing: true, isError: false };
      return updatedFiles;
    });

    const processedBlob = await removeMetadata(file.file);

    if (file.processedPreview) {
      URL.revokeObjectURL(file.processedPreview);
    }

    return {
      ...file,
      processed: processedBlob,
      processedPreview: URL.createObjectURL(processedBlob),
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
      updatedFiles[index] = { ...updatedFiles[index], isProcessing: false, isError: true };
      return updatedFiles;
    });
  };

  const processImages = async () => {
    queue.current!.clear();

    setFiles((prevFiles) =>
      prevFiles.map((file) => ({ ...file, isError: false }))
    );

    files.forEach((file, index) => {
      if (file.processed) return;

      queue.current!.enqueue({
        task: () => processImageFile(file, index),
        onComplete: (result) => handleComplete(result, index),
        onError: (error) => handleError(error, file, index),
        onProgress: handleProgress,
      });
    });

    setProcessingStatus({
      waiting: queue.current!.waiting,
      processing: queue.current!.active,
    });
  };

  const downloadAll = () => {
    const filesToDownload = files
      .filter((file) => file.processed)
      .map((file) => ({ blob: file.processed!, filename: file.name }));
    downloadAllFiles(filesToDownload);
  };

  const openInGoogleMaps = (coordinates: { lat: number; lng: number }) => {
    window.open(`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`, "_blank");
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
          metadata: undefined,
          coordinates: undefined,
        };
      })
    );
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Image Metadata Remover</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            View and strip metadata from your images — including GPS coordinates, camera info, and
            other sensitive data
          </p>
        </div>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        {/* Action Toolbar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={processImages}
              disabled={files.length === 0 || files.some((f) => f.isProcessing)}
              size="sm"
            >
              {processingStatus.processing > 0 ? "Removing…" : "Remove Metadata"}
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
              format={extractImageFormat(file.name)}
              onRemove={() => handleRemoveFile(fileIndex)}
              onPreview={
                file.metadata && file.metadata.length > 0
                  ? () => handleShowAllMetadata(fileIndex)
                  : undefined
              }
              extraData={
                file.metadata && file.metadata.length > 0 ? (
                  <div className="space-y-1">
                    {file.metadata.slice(0, 5).map((field) => (
                      <div key={field.name} className="flex items-center gap-2 text-xs">
                        <span className="min-w-1/4 font-medium">{field.name}</span>
                        <span className="text-muted-foreground ml-2 truncate">{field.value}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      {file.coordinates && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 text-xs"
                          onClick={() => openInGoogleMaps(file.coordinates!)}
                        >
                          View on Map 🗺️
                        </Button>
                      )}
                      {file.metadata.length > 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 text-xs"
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

      {/* Metadata modal */}
      {selectedFileIndex !== null && files[selectedFileIndex]?.metadata && (
        <ImageMetadataModal
          isOpen={true}
          onClose={handleCloseModal}
          metadata={files[selectedFileIndex].metadata}
        />
      )}
    </div>
  );
}
