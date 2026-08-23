import { useState } from "react";

import { ResizeOptions } from "@/services/imageService";

/** Convenience hook to manage resize state for use with ResizeControl. */
export function useResizeControl() {
  const [enabled, setEnabled] = useState(false);
  const [options, setOptions] = useState<ResizeOptions>({ width: 0, height: 0 });

  /** Returns options when enabled, undefined otherwise — ready to pass to convertImage. */
  const activeOptions = enabled ? options : undefined;

  return { enabled, setEnabled, options, setOptions, activeOptions };
}
