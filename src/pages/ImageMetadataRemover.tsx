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

interface ImageWithMetadata extends ImageFile {
  metadata?: MetadataField[];
}

export default function ImageMetadataRemover() {
  const [files, setFiles] = useState<ImageWithMetadata[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

  const handleFilesAdded = useCallback(async (newFiles: ImageFile[]) => {
    const filesWithMetadata = await Promise.all(
      newFiles.map(async (file) => {
        const metadata = await extractMetadata(file.file);

        return {
          ...file,
          metadata,
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
    setProcessingFiles(new Set(files.map((f) => f.name)));
    try {
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            const processedBlob = await removeMetadata(file.file);
            return {
              ...file,
              processed: processedBlob,
            };
          } catch (error) {
            console.error("Error processing image:", error);
            return file;
          }
        })
      );

      setFiles(processedFiles);
    } catch (error) {
      console.error("Error processing images:", error);
    } finally {
      setProcessingFiles(new Set());
    }
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

  return (
    <div className="container mx-auto py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Image Metadata Remover</h1>

        <ImageDropZone onFilesAdded={handleFilesAdded} />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={processImages}
              disabled={files.length === 0 || processingFiles.size > 0}
            >
              {processingFiles.size > 0 ? "Processing..." : "Process Images"}
            </Button>
            <Button
              onClick={downloadAll}
              disabled={files.length === 0 || !files.some((f) => f.processed)}
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
        )}

        {files.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {files.map((file, fileIndex) => (
              <div key={file.name + file.preview}>
                <ImagePreview
                  file={file}
                  format={extractImageFormat(file.name)}
                  onRemove={() => handleRemoveFile(fileIndex)}
                  isProcessing={processingFiles.has(file.name)}
                  extraData={
                    file.metadata && file.metadata.length > 0 ? (
                      <div className="space-y-1">
                        {file.metadata.slice(0, 5).map((field) => (
                          <div key={field.name} className="flex items-center gap-2 text-xs">
                            <span className="min-w-1/4 font-medium">{field.name}</span>
                            <span className="text-muted-foreground ml-2">{field.value}</span>
                          </div>
                        ))}
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
                    ) : undefined
                  }
                />
              </div>
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
