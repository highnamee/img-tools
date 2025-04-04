import { useState, useCallback, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageDropZone } from "@/components/ImageDropZone";
import { ImagePreview } from "@/components/ImagePreview";
import {
  ImageFile,
  ConversionFormat,
  convertImage,
  downloadImage,
  formatRecommendations,
  ResizeOptions,
} from "@/services/imageService";

export default function ImageConverter() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [format, setFormat] = useState<ConversionFormat>("png");
  const [quality, setQuality] = useState(80);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const [resizeOptions, setResizeOptions] = useState<ResizeOptions>({ width: 0, height: 0 });
  const [enableResize, setEnableResize] = useState(false);

  useEffect(() => {
    setQuality(formatRecommendations[format].defaultQuality);
  }, [format]);

  const handleFilesAdded = useCallback((newFiles: ImageFile[]) => {
    const filesWithDimensions = newFiles.map(async (file) => {
      const img = new Image();
      img.src = file.preview;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      return {
        ...file,
        originalWidth: img.width,
        originalHeight: img.height,
      };
    });

    Promise.all(filesWithDimensions).then((files) => {
      setFiles((prev) => [...prev, ...files]);
    });
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);
  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    setResizeOptions((prev) => ({
      ...prev,
      width: e.target.value ? parseInt(e.target.value) : 0,
    }));
  };

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    setResizeOptions((prev) => ({
      ...prev,
      height: e.target.value ? parseInt(e.target.value) : 0,
    }));
  };

  const convertImages = useCallback(async () => {
    setProcessingFiles(new Set(files.map((f) => f.name)));
    try {
      const convertedFiles = await Promise.all(
        files.map(async (imageFile) => {
          const convertedBlob = await convertImage(
            imageFile.file,
            format,
            quality,
            enableResize ? resizeOptions : undefined
          );

          // Calculate new dimensions
          const img = new Image();
          img.src = URL.createObjectURL(convertedBlob);
          await new Promise((resolve) => {
            img.onload = resolve;
          });

          return {
            ...imageFile,
            converted: convertedBlob,
            newWidth: img.width,
            newHeight: img.height,
          };
        })
      );
      setFiles(convertedFiles);
    } catch (error) {
      console.error("Error converting images:", error);
    } finally {
      setProcessingFiles(new Set());
    }
  }, [files, format, quality, enableResize, resizeOptions]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        <h1 className="mb-6 text-2xl font-bold">Image Converter</h1>

        <div className="space-y-6">
          <ImageDropZone onFilesAdded={handleFilesAdded} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-10">
              <div className="space-y-2">
                <label className="text-sm font-medium">Output Format</label>
                <Select
                  value={format}
                  onValueChange={(value) => setFormat(value as ConversionFormat)}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="avif">AVIF</SelectItem>
                    <SelectItem value="gif">GIF</SelectItem>
                    <SelectItem value="bmp">BMP</SelectItem>
                    <SelectItem value="tiff">TIFF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quality: {quality}%</label>
                  <button
                    onClick={() => setQuality(formatRecommendations[format].defaultQuality)}
                    className="text-primary text-xs hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <Slider
                  value={[quality]}
                  onValueChange={([value]) => setQuality(value)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-64"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch checked={enableResize} onCheckedChange={setEnableResize} />
                  <label className="font-medium">
                    <span className="text-sm">Resize</span>
                    <span className="text-xs">
                      {" • Aspect ratio will be maintained automatically"}
                    </span>
                  </label>
                </div>
                {enableResize && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Width"
                      value={resizeOptions.width || ""}
                      onChange={handleWidthChange}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">or</span>
                    <Input
                      type="number"
                      placeholder="Height"
                      value={resizeOptions.height || ""}
                      onChange={handleHeightChange}
                      className="w-28"
                    />
                  </div>
                )}
              </div>
            </div>

            <p className="text-muted-foreground text-xs">
              {formatRecommendations[format].description}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={convertImages}
              disabled={files.length === 0 || processingFiles.size > 0}
            >
              {processingFiles.size > 0 ? "Converting..." : "Convert Images"}
            </Button>
            <Button
              onClick={() => {
                files.forEach((file) => {
                  if (file.converted) {
                    downloadImage(file.converted, file.name, format);
                  }
                });
              }}
              disabled={files.length === 0 || !files.some((f) => f.converted)}
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

          {files.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {files.map((file) => (
                <ImagePreview
                  key={file.name + file.preview}
                  file={file}
                  format={format}
                  onRemove={() => handleRemoveFile(files.indexOf(file))}
                  isProcessing={processingFiles.has(file.name)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
