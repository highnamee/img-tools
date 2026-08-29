import { useState, useRef, useCallback, useEffect } from "react";

import {
  ChevronsLeftRight,
  Columns2,
  SplitSquareVertical,
  ZoomIn,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils/css";
import { formatDimensions } from "@/utils/formatUtils";

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
  const [viewMode, setViewMode] = useState<"slider" | "side-by-side">("slider");
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    []
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePointerMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handlePointerMove(e.clientX);
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("touchmove", handleGlobalTouchMove);
      window.addEventListener("touchend", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, [isDragging, handlePointerMove]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[95vh] w-[95vw] sm:max-w-[1300px] flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 pb-2 border-b pr-8">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Image Comparison
            </DialogTitle>
            <p className="text-muted-foreground text-xs mt-1">
              Compare original ({formatDimensions(originalWidth, originalHeight)}) vs processed (
              {formatDimensions(newWidth || originalWidth, newHeight || originalHeight)})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "slider" | "side-by-side")}
              className="w-auto"
            >
              <TabsList className="h-8">
                <TabsTrigger value="slider" className="text-xs px-2.5 py-1 gap-1.5">
                  <SplitSquareVertical className="h-3.5 w-3.5" />
                  Split Slider
                </TabsTrigger>
                <TabsTrigger value="side-by-side" className="text-xs px-2.5 py-1 gap-1.5">
                  <Columns2 className="h-3.5 w-3.5" />
                  Side by Side
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground flex items-center gap-1 font-medium">
              <ZoomIn className="h-3.5 w-3.5" /> Zoom:
            </span>
            {[25, 50, 75, 100, 150].map((level) => (
              <Button
                key={level}
                variant={zoomLevel === level ? "default" : "outline"}
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => setZoomLevel(level)}
              >
                {level}%
              </Button>
            ))}
            <span className="text-muted-foreground ml-2 text-[11px]">
              Display: {Math.round((originalWidth * zoomLevel) / 100)}×{Math.round((originalHeight * zoomLevel) / 100)}px
            </span>
          </div>

          {viewMode === "slider" && (
            <div className="text-muted-foreground text-[11px] flex items-center gap-2">
              <span>Drag slider or click anywhere on image</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {Math.round(sliderPosition)}%
              </Badge>
            </div>
          )}
        </div>

        {/* Main View Area */}
        <div className="relative flex-1 min-h-[400px] max-h-[70vh] rounded-lg border border-border/80 bg-muted/20 overflow-hidden flex items-center justify-center">
          {viewMode === "slider" ? (
            <div className="relative h-full w-full overflow-auto flex items-center justify-center p-4">
              <div
                ref={containerRef}
                className={cn(
                  "relative select-none overflow-hidden rounded-md shadow-md border border-border/60 cursor-ew-resize",
                  "bg-[linear-gradient(45deg,#0000000a_25%,transparent_25%),linear-gradient(-45deg,#0000000a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0000000a_75%),linear-gradient(-45deg,transparent_75%,#0000000a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] dark:bg-[linear-gradient(45deg,#ffffff0f_25%,transparent_25%),linear-gradient(-45deg,#ffffff0f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ffffff0f_75%),linear-gradient(-45deg,transparent_75%,#ffffff0f_75%)]"
                )}
                style={{
                  width: `${(originalWidth * zoomLevel) / 100}px`,
                  maxWidth: "100%",
                  maxHeight: "100%",
                  aspectRatio: `${originalWidth} / ${originalHeight}`,
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                {/* Background image: Processed image */}
                <img
                  src={processedSrc}
                  alt="Processed"
                  className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                  draggable={false}
                />

                {/* Foreground image: Original image clipped by slider position */}
                <div
                  className="absolute inset-0 h-full overflow-hidden pointer-events-none"
                  style={{
                    width: `${sliderPosition}%`,
                  }}
                >
                  <img
                    src={originalSrc}
                    alt="Original"
                    className="absolute top-0 left-0 h-full max-w-none object-contain pointer-events-none"
                    style={{
                      width: containerRef.current
                        ? `${containerRef.current.clientWidth}px`
                        : "100%",
                      height: "100%",
                    }}
                    draggable={false}
                  />
                </div>

                {/* Divider Line & Handle */}
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none flex items-center justify-center -translate-x-1/2"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="h-full w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
                  <div className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg border border-black/10 transition-transform hover:scale-110 active:scale-95">
                    <ChevronsLeftRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Floating Badges */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <Badge className="bg-black/75 text-white backdrop-blur-xs text-[11px] font-medium border-0 shadow-md">
                    Original ({formatDimensions(originalWidth, originalHeight)})
                  </Badge>
                </div>
                <div className="absolute top-3 right-3 z-10 pointer-events-none">
                  <Badge className="bg-black/75 text-white backdrop-blur-xs text-[11px] font-medium border-0 shadow-md">
                    Processed ({formatDimensions(newWidth || originalWidth, newHeight || originalHeight)})
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full w-full p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-full">
                {/* Original side */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Original</h3>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {formatDimensions(originalWidth, originalHeight)}
                      </Badge>
                      <span className="text-muted-foreground text-[10px]">
                        ({Math.round((originalWidth * zoomLevel) / 100)}×{Math.round((originalHeight * zoomLevel) / 100)}px)
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "relative overflow-auto rounded-lg border border-border/80 p-2 flex items-center justify-center min-h-[300px]",
                      "bg-[linear-gradient(45deg,#0000000a_25%,transparent_25%),linear-gradient(-45deg,#0000000a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0000000a_75%),linear-gradient(-45deg,transparent_75%,#0000000a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] dark:bg-[linear-gradient(45deg,#ffffff0f_25%,transparent_25%),linear-gradient(-45deg,#ffffff0f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ffffff0f_75%),linear-gradient(-45deg,transparent_75%,#ffffff0f_75%)]"
                    )}
                  >
                    <img
                      src={originalSrc}
                      alt="Original"
                      style={{
                        width: `${(originalWidth * zoomLevel) / 100}px`,
                        maxWidth: "100%",
                      }}
                      className="rounded object-contain"
                    />
                  </div>
                </div>

                {/* Processed side */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Processed</h3>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {formatDimensions(newWidth || originalWidth, newHeight || originalHeight)}
                      </Badge>
                      <span className="text-muted-foreground text-[10px]">
                        ({Math.round(((newWidth || originalWidth) * zoomLevel) / 100)}×{Math.round(((newHeight || originalHeight) * zoomLevel) / 100)}px)
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "relative overflow-auto rounded-lg border border-border/80 p-2 flex items-center justify-center min-h-[300px]",
                      "bg-[linear-gradient(45deg,#0000000a_25%,transparent_25%),linear-gradient(-45deg,#0000000a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0000000a_75%),linear-gradient(-45deg,transparent_75%,#0000000a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] dark:bg-[linear-gradient(45deg,#ffffff0f_25%,transparent_25%),linear-gradient(-45deg,#ffffff0f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ffffff0f_75%),linear-gradient(-45deg,transparent_75%,#ffffff0f_75%)]"
                    )}
                  >
                    <img
                      src={processedSrc}
                      alt="Processed"
                      style={{
                        width: `${((newWidth || originalWidth) * zoomLevel) / 100}px`,
                        maxWidth: "100%",
                      }}
                      className="rounded object-contain"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
