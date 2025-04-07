import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";


interface ImageDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalSrc: string;
  processedSrc: string;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
}

export function ImageDiffModal({
  isOpen,
  onClose,
  originalSrc,
  processedSrc,
  originalWidth,
  originalHeight,
  newWidth,
  newHeight,
}: Readonly<ImageDiffModalProps>) {
  const [scale, setScale] = useState(100);

  const getScaledDimensions = (width: number, height: number, scale: number) => {
    return {
      width: Math.round(width * (scale / 100)),
      height: Math.round(height * (scale / 100)),
    };
  };

  const originalScaled = getScaledDimensions(originalWidth, originalHeight, scale);
  const processedScaled = getScaledDimensions(newWidth, newHeight, scale);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] sm:max-w-[1280px]">
        <DialogHeader>
          <DialogTitle>Image Comparison</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="scale-100"
                checked={scale === 100}
                onCheckedChange={(checked) => checked && setScale(100)}
              />
              <label htmlFor="scale-100">
                100% ({originalWidth}×{originalHeight})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="scale-75"
                checked={scale === 75}
                onCheckedChange={(checked) => checked && setScale(75)}
              />
              <label htmlFor="scale-75">
                75% ({Math.round(originalWidth * 0.75)}×{Math.round(originalHeight * 0.75)})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="scale-50"
                checked={scale === 50}
                onCheckedChange={(checked) => checked && setScale(50)}
              />
              <label htmlFor="scale-50">
                50% ({Math.round(originalWidth * 0.5)}×{Math.round(originalHeight * 0.5)})
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="scale-25"
                checked={scale === 25}
                onCheckedChange={(checked) => checked && setScale(25)}
              />
              <label htmlFor="scale-25">
                25% ({Math.round(originalWidth * 0.25)}×{Math.round(originalHeight * 0.25)})
              </label>
            </div>
          </div>
          <ScrollArea className="h-[80vh]">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">
                  Original ({originalWidth}×{originalHeight})
                </h3>
                <div className="w-[85vw] overflow-auto sm:max-w-[1200px]">
                  <img
                    src={originalSrc}
                    alt="Original"
                    width={originalScaled.width}
                    height={originalScaled.height}
                    className="max-w-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">
                  Processed ({newWidth}×{newHeight})
                </h3>
                <div className="w-[85vw] overflow-auto sm:max-w-[1200px]">
                  <img
                    src={processedSrc}
                    alt="Processed"
                    width={processedScaled.width}
                    height={processedScaled.height}
                    className="max-w-none"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
