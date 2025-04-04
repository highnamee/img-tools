import { parse } from "exifr";
import { ImageFile } from "./imageService";

export interface MetadataField {
  name: string;
  value: string;
}

const formatMetadataValue = (value: unknown): string => {
  if (value === undefined || value === null) return "N/A";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export async function extractMetadata(file: File): Promise<MetadataField[]> {
  try {
    const metadata = await parse(file);
    if (!metadata) return [];

    return Object.entries(metadata)
      .filter(([key]) => !key.startsWith("_"))
      .map(([name, value]) => ({
        name,
        value: formatMetadataValue(value),
      }));
  } catch (error) {
    console.error("Error extracting metadata:", error);
    return [];
  }
}

export async function removeMetadata(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      const format = file.type || "image/jpeg";

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create blob"));
      }, format);
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function createImageWithMetadata(file: File): ImageFile & { metadata?: MetadataField[] } {
  return {
    file,
    name: file.name,
    preview: URL.createObjectURL(file),
  };
}
