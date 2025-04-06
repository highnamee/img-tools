import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import { ImageFile } from "@/services/imageService";
import { fileToBase64, createImgTagWithBase64 } from "@/services/base64Service";
import { Base64Modal } from "@/components/Base64Modal";
import { extractImageFormat } from "@/utils/imageUtils";

interface Base64ImageFile extends ImageFile {
  base64String?: string;
  htmlImgTag?: string;
}

export default function Base64Converter() {
  const [files, setFiles] = useState<Base64ImageFile[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const [errorFiles, setErrorFiles] = useState<Set<string>>(new Set());
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

  const handleFilesAdded = useCallback((newFiles: ImageFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const convertToBase64 = useCallback(async () => {
    if (files.length === 0) return;

    setProcessingFiles(new Set(files.map((f) => f.name)));
    setErrorFiles(new Set());
    try {
      const processedFiles = await Promise.all(
        files.map(async (imageFile) => {
          try {
            const base64String = await fileToBase64(imageFile.file);
            const htmlImgTag = createImgTagWithBase64(base64String);

            return {
              ...imageFile,
              // Assign original file to processed because we just used it for preview
              processed: imageFile.file,
              base64String,
              htmlImgTag,
            };
          } catch (error) {
            console.error(`Error converting ${imageFile.name} to base64:`, error);
            setErrorFiles((prev) => new Set([...prev, imageFile.name]));
            return imageFile;
          }
        })
      );
      setFiles(processedFiles);
    } catch (error) {
      console.error("Error converting to base64:", error);
    } finally {
      setProcessingFiles(new Set());
    }
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

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={convertToBase64}
              disabled={files.length === 0 || processingFiles.size > 0}
            >
              {processingFiles.size > 0 ? "Converting..." : "Convert to Base64"}
            </Button>
            <Button
              onClick={() => setFiles([])}
              disabled={files.length === 0}
              variant="destructive"
            >
              Clear All
            </Button>
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
                isProcessing={processingFiles.has(file.name)}
                isError={errorFiles.has(file.name)}
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
