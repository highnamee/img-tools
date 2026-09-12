export interface ImageFile {
  file: File;
  name: string;
  preview: string;
  processedPreview?: string;
  originalWidth?: number;
  originalHeight?: number;
  newWidth?: number;
  newHeight?: number;
  processed?: Blob;
  isProcessing?: boolean;
  isError?: boolean;
}

export type ConversionFormat = "png" | "jpeg" | "webp" | "avif";

export type ResizeOptions = {
  width: number;
  height: number;
};

export const formatRecommendations: Record<
  ConversionFormat,
  { defaultQuality: number; description: string }
> = {
  jpeg: { defaultQuality: 85, description: "Best for photos and complex images" },
  png: { defaultQuality: 80, description: "Good for images with transparency" },
  webp: { defaultQuality: 80, description: "Modern format with good compression" },
  avif: { defaultQuality: 75, description: "Next-gen format with superior compression" },
};

export const createImageFile = (file: File): ImageFile => ({
  file,
  preview: URL.createObjectURL(file),
  name: file.name,
});

const canvasConvert = async (
  file: File,
  format: ConversionFormat,
  quality: number,
  resizeOptions?: ResizeOptions,
  originalWidth?: number,
  originalHeight?: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = originalWidth || img.naturalWidth || img.width;
      let targetHeight = originalHeight || img.naturalHeight || img.height;

      if (resizeOptions) {
        const { width, height } = resizeOptions;
        const ratio = targetWidth / targetHeight;

        if (width && height) {
          targetWidth = width;
          targetHeight = height;
        } else if (width) {
          targetWidth = width;
          targetHeight = width / ratio;
        } else if (height) {
          targetHeight = height;
          targetWidth = height * ratio;
        }
      }

      targetWidth = Math.max(1, Math.round(targetWidth));
      targetHeight = Math.max(1, Math.round(targetHeight));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get 2D context"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // If format is JPEG, draw a white background to preserve transparency nicely
      if (format === "jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const mimeType =
        format === "jpeg" ? "image/jpeg" : format === "avif" ? "image/avif" : `image/${format}`;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas conversion returned null blob"));
          }
        },
        mimeType,
        quality / 100
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
};

export const convertImage = async (
  imageFile: ImageFile,
  format: ConversionFormat,
  quality: number,
  resizeOptions?: ResizeOptions
): Promise<Blob> => {
  const { file, originalWidth, originalHeight } = imageFile;

  try {
    const canvasBlob = await canvasConvert(
      file,
      format,
      quality,
      resizeOptions,
      originalWidth,
      originalHeight
    );

    return canvasBlob;
  } catch (err) {
    console.error("Canvas conversion failed:", err);
    return file;
  }
};

export const downloadImage = (blob: Blob, filename: string, format: ConversionFormat) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename.split(".")[0]}.${format}`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
};

export const getImageSize = async (file: Blob) => {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.src = objectUrl;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });

  URL.revokeObjectURL(objectUrl);
  return { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
};
