"use client";

import {
  AdaptiveDpr,
  OrbitControls,
  PerformanceMonitor,
  Preload,
} from "@react-three/drei";
import { Canvas, useFrame, type CanvasProps } from "@react-three/fiber";
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
import { Box3, MathUtils, Vector3 } from "three";
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
   * Padding around the measured content when the rig frames the scene:
   * 1 = touching the edges, 1.12 = a comfortable margin. Pass `false`
   * when the visual drives its own camera in useFrame, and the rig will
   * keep its hands off. Ignored while OrbitControls owns the camera.
   */
  fit?: number | false;
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
  fit = 1.12,
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
            {fit !== false && !controls ? <CameraRig fit={fit} /> : null}
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

/* Scratch objects for the rig. Module scope so the measurement allocates
   nothing per frame and React never treats them as render values. */
const _box = new Box3();
const _center = new Vector3();
const _span = new Vector3();

/**
 * Measures everything in the scene that is not marked decorative, then
 * works out where a camera looking down `viewDir` has to sit for that box
 * to fill the frame at this fov and aspect. Writes into `outPos`/`outLook`
 * and reports whether it found anything to frame.
 */
function measureScene(
  scene: THREE.Object3D,
  cam: THREE.PerspectiveCamera,
  aspect: number,
  fit: number,
  viewDir: Vector3,
  outPos: Vector3,
  outLook: Vector3,
) {
  _box.makeEmpty();
  let found = false;

  scene.traverse((obj) => {
    if (obj.userData?.noFit) return;
    if (!(obj as THREE.Mesh).geometry) return;
    // A child of a decorative group is decorative too.
    for (let p = obj.parent; p; p = p.parent) {
      if (p.userData?.noFit) return;
    }
    _box.expandByObject(obj);
    found = true;
  });

  if (!found || _box.isEmpty()) return false;

  _box.getCenter(_center);
  _box.getSize(_span);

  const halfV = Math.tan(MathUtils.degToRad(cam.fov) / 2);
  const halfH = halfV * aspect;
  // Distance at which the box's height and width both fit, plus half its
  // depth so the near face does not poke through the frustum.
  const dist =
    Math.max(_span.y / 2 / halfV, _span.x / 2 / halfH) * fit + _span.z / 2 + 0.2;

  outPos.copy(_center).addScaledVector(viewDir, dist);
  outLook.copy(_center);
  return true;
}

/**
 * Frames whatever the scene actually contains.
 *
 * Every diagram in the course is laid out in its own arbitrary units and
 * then grows captions, legends and side panels as it is written, so a
 * hand-tuned camera distance goes stale the moment anyone edits the
 * scene. Instead of trusting the declared position, the rig measures the
 * content each half second and eases the camera to where it fits.
 *
 * The declared camera position still matters: its *direction* is the
 * viewing angle the author chose. Only the distance is taken over.
 *
 * Decorative volume — ambient motes, ground shadows, backdrops — sets
 * `userData.noFit`, so a dust cloud with a nine-unit radius cannot push
 * the subject into the distance.
 */
function CameraRig({ fit }: { fit: number }) {
  const dir = useRef<Vector3 | null>(null);
  const goalPos = useRef(new Vector3());
  const goalLook = useRef(new Vector3());
  const settled = useRef(false);
  const since = useRef(0);

  useFrame((state, dt) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;

    if (!dir.current) {
      const d = cam.position.clone();
      if (d.lengthSq() < 1e-6) d.set(0, 0, 1);
      dir.current = d.normalize();
    }

    since.current += dt;
    if (since.current > 0.4 || !settled.current) {
      since.current = 0;
      const aspect = state.size.width / Math.max(1, state.size.height);
      const got = measureScene(
        state.scene,
        cam,
        aspect,
        fit,
        dir.current,
        goalPos.current,
        goalLook.current,
      );
      // First measurement snaps: a diagram should not fly in on load.
      if (got && !settled.current) {
        cam.position.copy(goalPos.current);
        settled.current = true;
      }
    }

    if (!settled.current) return;
    cam.position.lerp(goalPos.current, 1 - Math.exp(-4 * dt));
    cam.lookAt(goalLook.current);
    cam.updateProjectionMatrix();
  });

  return null;
}
