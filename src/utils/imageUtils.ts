import { ConversionFormat } from "@/services/imageService";

const SUPPORTED_FORMATS: ConversionFormat[] = ["jpeg", "png", "webp", "avif"];

export function extractImageFormat(filename: string): ConversionFormat {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (extension === "jpg") return "jpeg";
  return extension && SUPPORTED_FORMATS.includes(extension as ConversionFormat)
    ? (extension as ConversionFormat)
    : "jpeg";
}
