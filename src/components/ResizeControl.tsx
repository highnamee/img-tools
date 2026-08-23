import { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ResizeOptions } from "@/services/imageService";

interface ResizeControlProps {
  /** Current enabled state */
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  /** Current resize dimensions */
  value: ResizeOptions;
  onChange: (opts: ResizeOptions) => void;
}

/**
 * Reusable resize toggle + width/height inputs.
 * Enforces mutually exclusive width-or-height with aspect-ratio hint.
 */
export function ResizeControl({ enabled, onEnabledChange, value, onChange }: ResizeControlProps) {
  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ height: 0, width: e.target.value ? parseInt(e.target.value) : 0 });
  };

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ height: e.target.value ? parseInt(e.target.value) : 0, width: 0 });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        <label className="text-sm font-medium">Resize</label>
      </div>
      {enabled && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Width px"
              value={value.width || ""}
              onChange={handleWidthChange}
              className="w-28"
              disabled={!!value.height}
            />
            <span className="text-muted-foreground text-xs">or</span>
            <Input
              type="number"
              placeholder="Height px"
              value={value.height || ""}
              onChange={handleHeightChange}
              className="w-28"
              disabled={!!value.width}
            />
          </div>
          <p className="text-muted-foreground text-xs">Aspect ratio maintained automatically</p>
        </div>
      )}
    </div>
  );
}
