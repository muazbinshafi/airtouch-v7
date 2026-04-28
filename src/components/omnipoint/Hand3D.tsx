// Hand3D — WebGL render of the MediaPipe hand skeleton(s) using
// @react-three/fiber. Activated by RenderModeStore.get() === "3d".
// Mounted as a fixed full-viewport overlay so the in-page cursor flow
// (BrowserCursor SVG) can be hidden while this renders the hand in 3D.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { TelemetryStore, type HandLandmarks } from "@/lib/omnipoint/TelemetryStore";
import { RenderModeStore } from "@/lib/omnipoint/RenderModeStore";

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

function lmToVec(lm: HandLandmarks): THREE.Vector3[] {
  // MediaPipe normalized: x,y in [0..1] (image space), z is relative depth
  // (negative = closer to camera). We re-center on the 4-anchor centroid
  // (wrist + index/middle/ring MCPs) so the hand floats around (0,0,0).
  if (lm.length < 21) return [];
  const ANCHORS = [0, 5, 9, 13];
  let cx = 0, cy = 0, cz = 0;
  for (const i of ANCHORS) { cx += lm[i].x; cy += lm[i].y; cz += lm[i].z; }
  cx /= ANCHORS.length; cy /= ANCHORS.length; cz /= ANCHORS.length;
  // Scale up for visibility; flip Y (screen → world) and Z (depth into scene).
  const S = 4;
  return lm.map((p) =>
    new THREE.Vector3((p.x - cx) * S, -(p.y - cy) * S, -(p.z - cz) * S * 1.5),
  );
}

function HandMesh({
  source,
  color,
}: {
  source: "primary" | "secondary";
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const jointRefs = useRef<THREE.Mesh[]>([]);
  const boneRefs = useRef<THREE.Mesh[]>([]);

  useFrame(() => {
    const snap = TelemetryStore.get();
    const present = source === "primary" ? snap.handPresent : snap.handPresentB;
    const lm = source === "primary" ? snap.landmarks : snap.landmarksB;
    if (!groupRef.current) return;
    groupRef.current.visible = present && lm.length >= 21;
    if (!present || lm.length < 21) return;

    const pts = lmToVec(lm);

    // Update joint positions
    for (let i = 0; i < 21; i++) {
      const m = jointRefs.current[i];
      if (m) m.position.copy(pts[i]);
    }

    // Update bones — orient + scale a unit cylinder between two joints
    for (let i = 0; i < HAND_CONNECTIONS.length; i++) {
      const [a, b] = HAND_CONNECTIONS[i];
      const m = boneRefs.current[i];
      if (!m) continue;
      const va = pts[a], vb = pts[b];
      const mid = new THREE.Vector3().addVectors(va, vb).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(vb, va);
      const len = dir.length();
      m.position.copy(mid);
      m.scale.set(1, len, 1);
      // Default cylinder is along Y; rotate Y axis onto dir.
      const up = new THREE.Vector3(0, 1, 0);
      m.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    }
  });

  // Offset the group so left/right hands don't overlap
  const xOffset = source === "primary" ? -1.0 : 1.0;

  return (
    <group ref={groupRef} position={[xOffset, 0, 0]}>
      {Array.from({ length: 21 }).map((_, i) => (
        <mesh
          key={`j-${i}`}
          ref={(el) => {
            if (el) jointRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[i === 4 || i === 8 ? 0.12 : 0.07, 16, 16]} />
          <meshStandardMaterial
            color={i === 4 || i === 8 ? "#ffffff" : color}
            emissive={color}
            emissiveIntensity={0.4}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
      ))}
      {HAND_CONNECTIONS.map((_, i) => (
        <mesh
          key={`b-${i}`}
          ref={(el) => {
            if (el) boneRefs.current[i] = el;
          }}
        >
          <cylinderGeometry args={[0.04, 0.04, 1, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function useRenderMode() {
  return useSyncExternalStore(
    (cb) => RenderModeStore.subscribe(cb),
    () => RenderModeStore.get(),
    () => RenderModeStore.get(),
  );
}

export function Hand3D() {
  const mode = useRenderMode();
  const [bothActive, setBothActive] = useState(false);

  // Re-poll telemetry to know when to mount/unmount the canvas (for perf).
  useEffect(() => {
    if (mode !== "3d") return;
    const id = window.setInterval(() => {
      const s = TelemetryStore.get();
      setBothActive(s.handPresent || s.handPresentB);
    }, 250);
    return () => window.clearInterval(id);
  }, [mode]);

  if (mode !== "3d") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483646,
        pointerEvents: "none",
        background: "transparent",
      }}
      aria-hidden
    >
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "4px 10px",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "hsl(var(--primary))",
          background: "hsl(var(--background) / 0.65)",
          border: "1px solid hsl(var(--border))",
          borderRadius: 999,
          backdropFilter: "blur(6px)",
        }}
      >
        3D Hand · {bothActive ? "tracking" : "waiting"}
      </div>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -3, 2]} intensity={0.3} color="#88aaff" />
        <HandMesh source="primary" color="hsl(160, 84%, 55%)" />
        <HandMesh source="secondary" color="hsl(280, 80%, 65%)" />
        <OrbitControls
          enablePan={false}
          enableZoom
          enableRotate
          minDistance={3}
          maxDistance={12}
        />
      </Canvas>
    </div>
  );
}
