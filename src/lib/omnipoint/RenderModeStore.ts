// Reactive store for the hand-skeleton render mode (2D SVG vs 3D WebGL).
// Subscribed by the BrowserCursor overlay and the Hand3D component.

export type RenderMode = "2d" | "3d";

const KEY = "omnipoint:renderMode";
let mode: RenderMode = (typeof localStorage !== "undefined" &&
  (localStorage.getItem(KEY) as RenderMode)) || "2d";
const listeners = new Set<() => void>();

export const RenderModeStore = {
  get(): RenderMode {
    return mode;
  },
  set(next: RenderMode) {
    if (mode === next) return;
    mode = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    for (const l of listeners) l();
  },
  toggle() {
    this.set(mode === "2d" ? "3d" : "2d");
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};
