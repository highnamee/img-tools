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
    const val = parseInt(e.target.value, 10);
    onChange({ height: 0, width: isNaN(val) || val <= 0 ? 0 : val });
  };

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange({ height: isNaN(val) || val <= 0 ? 0 : val, width: 0 });
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
              min={1}
              placeholder="Width px"
              value={value.width || ""}
              onChange={handleWidthChange}
              className="w-28"
              disabled={!!value.height}
            />
            <span className="text-muted-foreground text-xs">or</span>
            <Input
              type="number"
              min={1}
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
