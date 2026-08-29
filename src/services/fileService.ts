import JSZip from "jszip";

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 100);
}

/**
 * Downloads multiple files bundled cleanly into a single ZIP archive.
 * Falls back to single file download if only 1 file is present.
 */
export async function downloadAllFiles(
  files: { blob: Blob; filename: string }[],
  zipFilename = "img-tools-processed.zip"
): Promise<void> {
  if (files.length === 0) return;

  if (files.length === 1) {
    const file = files[0];
    if (file) {
      downloadFile(file.blob, file.filename);
    }
    return;
  }

  const zip = new JSZip();
  const nameCounts: Record<string, number> = {};

  files.forEach(({ blob, filename }) => {
    let finalName = filename;
    if (nameCounts[filename] !== undefined) {
      nameCounts[filename]++;
      const parts = filename.split(".");
      const ext = parts.pop() || "";
      const base = parts.join(".");
      finalName = `${base} (${nameCounts[filename]}).${ext}`;
    } else {
      nameCounts[filename] = 0;
    }

    zip.file(finalName, blob);
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadFile(zipBlob, zipFilename);
}
