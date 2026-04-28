// RenderModeToggle — floating chip-style button that flips the hand
// skeleton render between 2D SVG and 3D WebGL.

import { useSyncExternalStore } from "react";
import { Box, Square } from "lucide-react";
import { RenderModeStore } from "@/lib/omnipoint/RenderModeStore";
import { Button } from "@/components/ui/button";

export function RenderModeToggle() {
  const mode = useSyncExternalStore(
    (cb) => RenderModeStore.subscribe(cb),
    () => RenderModeStore.get(),
    () => RenderModeStore.get(),
  );
  const is3D = mode === "3d";
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => RenderModeStore.toggle()}
      className="gap-2"
      aria-label={`Switch to ${is3D ? "2D" : "3D"} hand view`}
      title={`Switch to ${is3D ? "2D" : "3D"} hand view`}
    >
      {is3D ? <Box className="h-4 w-4" /> : <Square className="h-4 w-4" />}
      <span className="font-mono text-xs uppercase tracking-wider">
        {is3D ? "3D" : "2D"}
      </span>
    </Button>
  );
}
