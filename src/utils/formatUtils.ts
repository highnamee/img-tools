export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function formatDimensions(width: number, height: number): string {
  return `${width}×${height}`;
}

export function calculateSavings(
  originalBytes: number,
  processedBytes: number
): {
  percent: number;
  text: string;
  isSaved: boolean;
} {
  if (originalBytes <= 0) return { percent: 0, text: "0%", isSaved: false };
  const diff = originalBytes - processedBytes;
  const percent = Math.round((diff / originalBytes) * 1000) / 10; // 1 decimal place

  if (percent > 0) {
    return {
      percent,
      text: `-${percent}%`,
      isSaved: true,
    };
  } else if (percent < 0) {
    return {
      percent: Math.abs(percent),
      text: `+${Math.abs(percent)}%`,
      isSaved: false,
    };
  }
  return { percent: 0, text: "0%", isSaved: false };
}
