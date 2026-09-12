import { useState } from "react";

import { ResizeOptions } from "@/services/imageService";

/** Convenience hook to manage resize state for use with ResizeControl. */
export function useResizeControl() {
  const [enabled, setEnabled] = useState(false);
  const [options, setOptions] = useState<ResizeOptions>({ width: 0, height: 0 });

  /** Returns options when enabled and valid dimension is set, undefined otherwise — ready to pass to convertImage. */
  const activeOptions =
    enabled && (options.width > 0 || options.height > 0) ? options : undefined;

  return { enabled, setEnabled, options, setOptions, activeOptions };
}
