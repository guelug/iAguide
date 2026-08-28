"use client";

import {
  AdaptiveDpr,
  OrbitControls,
  PerformanceMonitor,
  Preload,
} from "@react-three/drei";
import { Canvas, useThree, type CanvasProps } from "@react-three/fiber";
import {
  Suspense,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { P } from "@/lib/palette";
import type * as THREE from "three";

type ControlsConfig = {
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  maxDistance?: number;
  minDistance?: number;
};

type Props = {
  children: ReactNode;
  className?: string;
  camera?: CanvasProps["camera"];
  orthographic?: boolean;
  /** Solid clear colour. Omit for a transparent canvas over the page. */
  background?: string;
  /** [colour, near, far] linear fog, for depth on a light backdrop. */
  fog?: [string, number, number];
  controls?: boolean | ControlsConfig;
  /** Max device pixel ratio before the perf monitor claws it back. */
  maxDpr?: number;
  /**
   * Camera fit factor the rig uses to push further back on wide canvases
   * (fit > 1) so the diagram never drifts towards one edge. Default 1.
   * The rig always re-points the camera at the origin so an offset
   * declared by the visual never buries the content at the bottom.
   */
  fit?: number;
};

/**
 * Scenes read this to decide how hard to work. `quality` drops when the
 * perf monitor sees sustained frame drops; `still` is true when the user
 * asked for reduced motion, in which case useFrame never advances.
 */
export type StageEnv = { quality: number; still: boolean };
const StageContext = createContext<StageEnv>({ quality: 1, still: false });
export const useStage = () => useContext(StageContext);

/** Motion preference, live-updating. */
export function useStillness() {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setStill(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return still;
}

/**
 * Studio lighting for a white room. Bright and even, with one key light
 * so volumes still read, because a diagram lit from everywhere is flat
 * and a diagram lit from one side is dramatic instead of legible.
 */
function DefaultLights() {
  return (
    <>
      <ambientLight intensity={1.35} />
      <hemisphereLight args={[P.paper, P.sunken, 1.1]} />
      <directionalLight position={[3.5, 6, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 2, -3]} intensity={0.5} color={P.tealWash} />
    </>
  );
}

export function Stage({
  children,
  className,
  camera,
  orthographic,
  background,
  fog,
  controls = false,
  maxDpr = 2,
  fit = 1,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [quality, setQuality] = useState(1);
  const still = useStillness();

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.02, rootMargin: "220px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const env = useMemo<StageEnv>(() => ({ quality, still }), [quality, still]);
  const ctl = typeof controls === "object" ? controls : {};

  return (
    <div
      ref={host}
      className={className}
      style={{ maxWidth: "100%", overflow: "clip", touchAction: "pan-y" }}
    >
      {onScreen || still ? (
        <Canvas
          /* `flat` disables tone mapping: diagram colours must match the
             CSS swatches beside them exactly, or the legend lies. */
          flat
          dpr={[1, still ? 1.5 : maxDpr * quality]}
          frameloop={still ? "demand" : onScreen ? "always" : "never"}
          gl={{
            antialias: true,
            alpha: !background,
            powerPreference: "high-performance",
            stencil: false,
          }}
          camera={camera}
          orthographic={orthographic}
        >
          {background ? <color attach="background" args={[background]} /> : null}
          {fog ? <fog attach="fog" args={fog} /> : null}
          <StageContext.Provider value={env}>
            <PerfGovernor onChange={setQuality} enabled={!still} />
            <DefaultLights />
            <CameraRig fit={fit} />
            <Suspense fallback={null}>{children}</Suspense>
            {controls ? (
              <OrbitControls
                makeDefault
                enableZoom={ctl.enableZoom ?? false}
                enablePan={ctl.enablePan ?? false}
                autoRotate={(ctl.autoRotate ?? false) && !still}
                autoRotateSpeed={ctl.autoRotateSpeed ?? 0.35}
                minPolarAngle={ctl.minPolarAngle ?? Math.PI * 0.2}
                maxPolarAngle={ctl.maxPolarAngle ?? Math.PI * 0.8}
                minDistance={ctl.minDistance ?? 3}
                maxDistance={ctl.maxDistance ?? 24}
                dampingFactor={0.08}
              />
            ) : null}
            <AdaptiveDpr pixelated={false} />
            <Preload all />
          </StageContext.Provider>
        </Canvas>
      ) : (
        <div
          aria-hidden
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(ellipse at 40% 34%, var(--teal-wash), transparent 62%), radial-gradient(ellipse at 72% 68%, var(--violet-wash), transparent 55%)",
          }}
        />
      )}
    </div>
  );
}

/**
 * Lives inside the Canvas because PerformanceMonitor needs the R3F store.
 * Steps quality down on sustained decline and creeps it back on recovery.
 */
function PerfGovernor({
  onChange,
  enabled,
}: {
  onChange: (q: number) => void;
  enabled: boolean;
}) {
  const q = useRef(1);
  if (!enabled) return null;
  return (
    <PerformanceMonitor
      factor={1}
      flipflops={3}
      onDecline={() => {
        q.current = Math.max(0.45, q.current - 0.18);
        onChange(q.current);
      }}
      onIncline={() => {
        q.current = Math.min(1, q.current + 0.12);
        onChange(q.current);
      }}
    />
  );
}

/**
 * Keeps the canvas useful on tall and wide viewports.
 *
 * Three guarantees:
 *   1. The camera always *looks at the origin* — declared camera offsets
 *      are used as a direction only, so the content cannot drift to a
 *      corner of the canvas.
 *   2. The camera dollies in on narrow / out on wide viewports by the
 *      ratio of the canvas aspect to a 16:9 baseline, scaled by the
 *      parent `fit` factor. The clamp keeps it from going bird's-eye
 *      on a phone and microscopic on a cinema display.
 *   3. The rig re-applies every frame so a resize never strands the
 *      camera at a stale distance.
 */
function CameraRig({ fit }: { fit: number }) {
  const { camera, size } = useThree();

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    const base = cam.position.length() || 8;
    const aspect = size.width / Math.max(1, size.height);
    // 16:9 (1.78) is the baseline — wider canvases get further back so the
    // subject doesn't shrink, taller canvases don't get a fish-eye.
    const k = Math.sqrt(Math.max(0.6, Math.min(1.8, aspect / 1.78))) * fit;
    cam.position.setLength(base * k);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, fit]);

  return null;
}
