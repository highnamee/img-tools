import { useState } from "react";

import { Download, RotateCcw, ScanSearch, Trash2 } from "lucide-react";

import { ImageDropZone } from "@/components/ImageDropZone";
import { ImageMetadataModal } from "@/components/ImageMetadataModal";
import { ImagePreview } from "@/components/ImagePreview";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

  const processImageFile = async (file: ImageWithMetadata, index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = { ...updatedFiles[index], isProcessing: true, isError: false };
      return updatedFiles;
    });

    const processedBlob = await removeMetadata(file.file);
    if (file.processedPreview) URL.revokeObjectURL(file.processedPreview);

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
    setFiles((prevFiles) => prevFiles.map((file) => ({ ...file, isError: false })));

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
    <ToolLayout
      leftPanel={
        <>
          <div>
            <h1 className="text-2xl font-bold">Metadata Remover</h1>
            <p className="text-muted-foreground mt-1 text-xs">
              View and strip metadata from images — GPS coordinates, camera info, and other
              sensitive data
            </p>
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
                  <ScanSearch className="mr-2 h-4 w-4" />
                  {processingStatus.processing > 0 ? "Removing…" : "Remove Metadata"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Strip all metadata (GPS, camera info, etc.) from images</TooltipContent>
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
                <TooltipContent side="right">Discard processed results and revert to originals</TooltipContent>
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
              format={extractImageFormat(file.name)}
              onRemove={() => handleRemoveFile(fileIndex)}
              onPreview={
                file.metadata && file.metadata.length > 0
                  ? () => setSelectedFileIndex(fileIndex)
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
                          className="w-full text-xs"
                          onClick={() => openInGoogleMaps(file.coordinates!)}
                        >
                          View on Map 🗺️
                        </Button>
                      )}
                      {file.metadata.length > 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setSelectedFileIndex(fileIndex)}
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
          onClose={() => setSelectedFileIndex(null)}
          metadata={files[selectedFileIndex].metadata}
        />
      )}
    </ToolLayout>
  );
}
