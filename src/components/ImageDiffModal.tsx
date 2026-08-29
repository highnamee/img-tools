import { useState, useRef, useCallback, useEffect } from "react";

import {
  ChevronsLeftRight,
  Columns2,
  Maximize2,
  RotateCcw,
  SlidersHorizontal,
  SplitSquareVertical,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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

  // Aspect ratio based on original image
  const aspectRatio = originalWidth > 0 && originalHeight > 0 ? originalWidth / originalHeight : 1;

  // Default display width (capped at 650px or original width, min 100px)
  const defaultWidth = Math.min(Math.max(300, originalWidth || 600), 750);
  const [displayWidth, setDisplayWidth] = useState<number>(defaultWidth);

  // Live calculated height maintaining aspect ratio
  const displayHeight = Math.round(displayWidth / aspectRatio);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

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

  const handleWidthChange = (val: number) => {
    const clamped = Math.max(100, Math.min(2500, val));
    setDisplayWidth(clamped);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92vh] w-[95vw] sm:max-w-[1300px] flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 pb-3 border-b pr-8">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Image Comparison
            </DialogTitle>
            <p className="text-muted-foreground text-xs mt-1">
              Original: {formatDimensions(originalWidth, originalHeight)} • Processed:{" "}
              {formatDimensions(newWidth || originalWidth, newHeight || originalHeight)}
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

        {/* Dimension & Display Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs border-b bg-muted/20 px-3 rounded-lg">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Size:
            </span>

            {/* Quick preset buttons */}
            {[300, 500, 750, 1000].map((preset) => (
              <Button
                key={preset}
                variant={displayWidth === preset ? "default" : "outline"}
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => handleWidthChange(preset)}
              >
                {preset}px
              </Button>
            ))}

            {originalWidth > 0 && (
              <Button
                variant={displayWidth === originalWidth ? "default" : "outline"}
                size="sm"
                className="h-6 px-2 text-[11px] gap-1"
                onClick={() => handleWidthChange(originalWidth)}
              >
                <Maximize2 className="h-3 w-3" />
                Original ({originalWidth}px)
              </Button>
            )}

            {/* Custom Width Input & Slider */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={100}
                  max={2500}
                  step={10}
                  value={displayWidth}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="h-6 w-20 px-1.5 py-0 text-xs font-mono text-center"
                />
                <span className="text-muted-foreground text-[11px]">× {displayHeight}px</span>
              </div>

              <div className="w-24 hidden sm:block">
                <Slider
                  value={[displayWidth]}
                  min={100}
                  max={1500}
                  step={10}
                  onValueChange={([val]) => handleWidthChange(val)}
                  className="w-full"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
                title="Reset to default"
                onClick={() => handleWidthChange(defaultWidth)}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {viewMode === "slider" && (
            <div className="text-muted-foreground text-[11px] flex items-center gap-2">
              <span>Swipe/click to compare</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {Math.round(sliderPosition)}%
              </Badge>
            </div>
          )}
        </div>

        {/* Scrollable Viewport with full X and Y scrolling */}
        <div className="relative flex-1 h-[60vh] max-h-[65vh] w-full rounded-lg border border-border/80 bg-muted/10 overflow-auto">
          {viewMode === "slider" ? (
            <div className="min-w-full min-h-full flex items-center justify-center p-6">
              <div
                ref={containerRef}
                className={cn(
                  "relative select-none overflow-hidden rounded-md shadow-md border border-border/60 cursor-ew-resize shrink-0",
                  "bg-[linear-gradient(45deg,#0000000a_25%,transparent_25%),linear-gradient(-45deg,#0000000a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0000000a_75%),linear-gradient(-45deg,transparent_75%,#0000000a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] dark:bg-[linear-gradient(45deg,#ffffff0f_25%,transparent_25%),linear-gradient(-45deg,#ffffff0f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ffffff0f_75%),linear-gradient(-45deg,transparent_75%,#ffffff0f_75%)]"
                )}
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                {/* Background image: Processed image */}
                <img
                  src={processedSrc}
                  alt="Processed"
                  className="absolute inset-0 h-full w-full object-fill pointer-events-none"
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
                    className="absolute top-0 left-0 h-full max-w-none object-fill pointer-events-none"
                    style={{
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
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
            <div className="min-w-full min-h-full p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-center">
                {/* Original side */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex w-full items-center justify-between px-1">
                    <h3 className="font-semibold text-sm">Original</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {formatDimensions(originalWidth, originalHeight)}
                    </Badge>
                  </div>
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-lg border border-border/80 flex items-center justify-center shrink-0 shadow-xs",
                      "bg-[linear-gradient(45deg,#0000000a_25%,transparent_25%),linear-gradient(-45deg,#0000000a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0000000a_75%),linear-gradient(-45deg,transparent_75%,#0000000a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] dark:bg-[linear-gradient(45deg,#ffffff0f_25%,transparent_25%),linear-gradient(-45deg,#ffffff0f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ffffff0f_75%),linear-gradient(-45deg,transparent_75%,#ffffff0f_75%)]"
                    )}
                    style={{
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                      maxWidth: "100%",
                    }}
                  >
                    <img
                      src={originalSrc}
                      alt="Original"
                      className="h-full w-full object-fill rounded"
                    />
                  </div>
                </div>

                {/* Processed side */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex w-full items-center justify-between px-1">
                    <h3 className="font-semibold text-sm">Processed</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {formatDimensions(newWidth || originalWidth, newHeight || originalHeight)}
                    </Badge>
                  </div>
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-lg border border-border/80 flex items-center justify-center shrink-0 shadow-xs",
                      "bg-[linear-gradient(45deg,#0000000a_25%,transparent_25%),linear-gradient(-45deg,#0000000a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0000000a_75%),linear-gradient(-45deg,transparent_75%,#0000000a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] dark:bg-[linear-gradient(45deg,#ffffff0f_25%,transparent_25%),linear-gradient(-45deg,#ffffff0f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ffffff0f_75%),linear-gradient(-45deg,transparent_75%,#ffffff0f_75%)]"
                    )}
                    style={{
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                      maxWidth: "100%",
                    }}
                  >
                    <img
                      src={processedSrc}
                      alt="Processed"
                      className="h-full w-full object-fill rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
