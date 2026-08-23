import { useState, useRef, useEffect, useCallback } from "react";

import { ImageFile } from "@/services/imageService";
import { ProcessQueue, createImageProcessingQueue } from "@/services/queueService";

export interface QueueProgress {
  waiting: number;
  processing: number;
}

export function useImageQueue<T extends ImageFile>(concurrency = 2) {
  const [files, setFiles] = useState<T[]>([]);
  const [processingStatus, setProcessingStatus] = useState<QueueProgress>({
    waiting: 0,
    processing: 0,
  });

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const queueRef = useRef<ProcessQueue<T> | null>(null);
  if (queueRef.current == null) {
    queueRef.current = createImageProcessingQueue<T>(concurrency);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (queueRef.current) {
        queueRef.current.clear();
      }
      filesRef.current.forEach((file) => {
        URL.revokeObjectURL(file.preview);
        if (file.processedPreview && file.processedPreview !== file.preview) {
          URL.revokeObjectURL(file.processedPreview);
        }
      });
    };
  }, []);

  const handleFilesAdded = useCallback((newFiles: T[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file) {
        URL.revokeObjectURL(file.preview);
        if (file.processedPreview && file.processedPreview !== file.preview) {
          URL.revokeObjectURL(file.processedPreview);
        }
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearAllFiles = useCallback(() => {
    if (queueRef.current) {
      queueRef.current.clear();
    }
    filesRef.current.forEach((file) => {
      URL.revokeObjectURL(file.preview);
      if (file.processedPreview && file.processedPreview !== file.preview) {
        URL.revokeObjectURL(file.processedPreview);
      }
    });
    setFiles([]);
    setProcessingStatus({ waiting: 0, processing: 0 });
  }, []);

  const handleProgress = useCallback((processing: number, waiting: number) => {
    setProcessingStatus({ waiting, processing });
  }, []);

  return {
    files,
    setFiles,
    processingStatus,
    setProcessingStatus,
    queue: queueRef.current,
    handleFilesAdded,
    handleRemoveFile,
    clearAllFiles,
    handleProgress,
  };
}
