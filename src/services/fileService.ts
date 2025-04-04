export function downloadFile(blob: Blob, filename: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function downloadAllFiles(files: { blob: Blob; filename: string }[]) {
  files.forEach(({ blob, filename }) => {
    downloadFile(blob, filename);
  });
}
