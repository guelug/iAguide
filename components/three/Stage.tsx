"use client";

import {
  AdaptiveDpr,
  OrbitControls,
  PerformanceMonitor,
  Preload,
} from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Canvas, type CanvasProps } from "@react-three/fiber";
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

type BloomConfig = {
  intensity?: number;
  threshold?: number;
  smoothing?: number;
  radius?: number;
};

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
  /** Solid clear colour. Omit for a transparent canvas over page background. */
  background?: string;
  /** [colour, near, far] exponential-free linear fog. */
  fog?: [string, number, number];
  bloom?: BloomConfig | false;
  vignette?: boolean;
  controls?: boolean | ControlsConfig;
  /** Max device pixel ratio before the perf monitor claws it back. */
  maxDpr?: number;
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

const LIGHTS_KEY = "iaguide-stage-lights";

function DefaultLights() {
  return (
    <group key={LIGHTS_KEY}>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={[P.teal, P.void, 0.5]} />
      <directionalLight position={[4, 6, 6]} intensity={1.1} color={P.paper} />
      <pointLight position={[-5, -2, 4]} intensity={22} color={P.violet} distance={22} decay={2} />
      <pointLight position={[5, 3, -3]} intensity={16} color={P.amber} distance={20} decay={2} />
    </group>
  );
}

export function Stage({
  children,
  className,
  camera,
  orthographic,
  background,
  fog,
  bloom = { intensity: 0.85, threshold: 0.22, smoothing: 0.5 },
  vignette = true,
  controls = false,
  maxDpr = 1.9,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [quality, setQuality] = useState(1);
  const still = useStillness();

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.02, rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const env = useMemo<StageEnv>(() => ({ quality, still }), [quality, still]);
  const ctl = typeof controls === "object" ? controls : {};
  const heavy = quality > 0.55 && !still;

  return (
    <div ref={host} className={className}>
      {onScreen || still ? (
        <Canvas
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
            <Suspense fallback={null}>{children}</Suspense>
            {controls ? (
              <OrbitControls
                makeDefault
                enableZoom={ctl.enableZoom ?? false}
                enablePan={ctl.enablePan ?? false}
                autoRotate={(ctl.autoRotate ?? false) && !still}
                autoRotateSpeed={ctl.autoRotateSpeed ?? 0.35}
                minPolarAngle={ctl.minPolarAngle ?? Math.PI * 0.22}
                maxPolarAngle={ctl.maxPolarAngle ?? Math.PI * 0.78}
                minDistance={ctl.minDistance ?? 3}
                maxDistance={ctl.maxDistance ?? 24}
                dampingFactor={0.08}
              />
            ) : null}
            {bloom && heavy ? (
              <EffectComposer enableNormalPass={false}>
                <Bloom
                  mipmapBlur
                  intensity={bloom.intensity ?? 0.85}
                  luminanceThreshold={bloom.threshold ?? 0.22}
                  luminanceSmoothing={bloom.smoothing ?? 0.5}
                  radius={bloom.radius ?? 0.72}
                />
                {vignette ? <Vignette eskil={false} offset={0.22} darkness={0.72} /> : <></>}
              </EffectComposer>
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
              "radial-gradient(ellipse at 38% 32%, rgba(94,184,174,0.14), transparent 58%), radial-gradient(ellipse at 72% 66%, rgba(139,123,216,0.10), transparent 52%)",
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
        q.current = Math.max(0.42, q.current - 0.18);
        onChange(q.current);
      }}
      onIncline={() => {
        q.current = Math.min(1, q.current + 0.12);
        onChange(q.current);
      }}
    />
  );
}
