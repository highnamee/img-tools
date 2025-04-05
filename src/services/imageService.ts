import imageCompression, { Options } from "browser-image-compression";

export interface ImageFile {
  file: File;
  name: string;
  preview: string;
  originalWidth?: number;
  originalHeight?: number;
  newWidth?: number;
  newHeight?: number;
  processed?: Blob;
}

export type ConversionFormat = "png" | "jpeg" | "webp" | "avif" | "bmp" | "tiff";

export type ResizeOptions = {
  width: number;
  height: number;
};

export const formatRecommendations: Record<
  ConversionFormat,
  { defaultQuality: number; description: string }
> = {
  png: { defaultQuality: 80, description: "Good for images with transparency" },
  jpeg: { defaultQuality: 85, description: "Best for photos and complex images" },
  webp: { defaultQuality: 80, description: "Modern format with good compression" },
  avif: { defaultQuality: 75, description: "Advanced format with excellent compression" },
  bmp: { defaultQuality: 100, description: "Uncompressed format, not recommended" },
  tiff: { defaultQuality: 100, description: "High quality, large file size" },
};

export const createImageFile = (file: File): ImageFile => ({
  file,
  preview: URL.createObjectURL(file),
  name: file.name,
});

export const convertImage = async (
  file: File,
  format: ConversionFormat,
  quality: number,
  resizeOptions?: ResizeOptions
): Promise<Blob> => {
  if (format === "bmp" || format === "tiff") {
    return file;
  }

  const options: Options = {
    maxSizeMB: 1,
    useWebWorker: true,
    fileType: `image/${format}`,
    initialQuality: quality / 100,
    preserveExif: false,
  };

  if (resizeOptions) {
    options.maxWidthOrHeight = resizeOptions.width ?? resizeOptions.height;
  } else {
    options.alwaysKeepResolution = true;
  }

  try {
    const compressedBlob = await imageCompression(file, options);

    if (compressedBlob.size > file.size) {
      console.warn(`Compression resulted in larger file size for ${file.name}, returning original`);
      return file;
    }

    return compressedBlob;
  } catch (error) {
    console.error("Error compressing image:", error);
    return file;
  }
};

export const downloadImage = (blob: Blob, filename: string, format: ConversionFormat) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename.split(".")[0]}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
