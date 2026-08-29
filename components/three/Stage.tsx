"use client";

import {
  AdaptiveDpr,
  Environment,
  Lightformer,
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
import { BackSide, Box3, MathUtils, Vector3 } from "three";
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
   * Cast soft shadows between objects. On by default because a shadow is
   * the cheapest cue for "this is in front of that"; turn it off for
   * scenes made entirely of flat translucent panels, where a shadow map
   * only adds noise.
   */
  shadows?: boolean;
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
 * A softbox studio, built out of light shapes rather than a downloaded
 * HDRI so the page stays self-contained.
 *
 * The environment is what makes these read as objects instead of coloured
 * rectangles: a big rectangular key above and in front puts a soft
 * highlight along every top edge, two side panels separate a form from
 * the paper behind it, and the enclosing sphere keeps reflections warm
 * rather than black. It is baked once (`frames={1}`) and costs nothing
 * per frame after that.
 */
function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <mesh scale={60}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={P.paper} side={BackSide} />
      </mesh>
      {/* Key: broad, high, slightly in front. */}
      <Lightformer
        form="rect"
        intensity={3.2}
        color="#ffffff"
        position={[1.5, 6, 4]}
        rotation={[-Math.PI / 2.4, 0, 0]}
        scale={[12, 7, 1]}
      />
      {/* Cool fill from the left, warm bounce from the right: the two
          together are what give a white object a readable silhouette. */}
      <Lightformer
        form="rect"
        intensity={1.1}
        color={P.tealWash}
        position={[-7, 1.5, 2]}
        rotation={[0, Math.PI / 2.6, 0]}
        scale={[7, 6, 1]}
      />
      <Lightformer
        form="rect"
        intensity={0.9}
        color={P.amberWash}
        position={[7, 0.5, -1]}
        rotation={[0, -Math.PI / 2.6, 0]}
        scale={[7, 5, 1]}
      />
      {/* Rim from behind, to lift edges off the background. */}
      <Lightformer
        form="circle"
        intensity={1.6}
        color="#ffffff"
        position={[-2, 4, -6]}
        scale={[5, 5, 1]}
      />
    </Environment>
  );
}

/**
 * Direct light on top of the environment. Kept low: the studio does most
 * of the work, and this only has to carve the shadow that tells a reader
 * which object is in front.
 */
function DefaultLights({ shadows }: { shadows: boolean }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={[P.paper, P.sunken, 0.45]} />
      <directionalLight
        position={[4.5, 8, 5.5]}
        intensity={1.15}
        color="#ffffff"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0009}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-9, 9, 9, -9, 0.1, 32]} />
      </directionalLight>
      <directionalLight position={[-6, 2, -3]} intensity={0.3} color={P.tealWash} />
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
  shadows = true,
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
  const castShadows = shadows && quality > 0.7;

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
          /* PCFSoft, not drei's <SoftShadows>: that component patches
             three's shadow chunk with unpackRGBAToDepth, which r185 no
             longer ships, and every material silently fails to compile. */
          shadows={castShadows ? "soft" : false}
        >
          {background ? <color attach="background" args={[background]} /> : null}
          {fog ? <fog attach="fog" args={fog} /> : null}
          <StageContext.Provider value={env}>
            <PerfGovernor onChange={setQuality} enabled={!still} />
            <StudioEnvironment />
            <DefaultLights shadows={castShadows} />
            {castShadows ? <Floor /> : null}
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
const _corner = new Vector3();
const _xAxis = new Vector3();
const _yAxis = new Vector3();
const _zAxis = new Vector3();
const _up = new Vector3();


/* Scratch for the floor probe, kept apart from the rig's own scratch. */
const _fbox = new Box3();

/**
 * A shadow catcher that finds its own height.
 *
 * Almost every diagram in the course is composed on a plane facing the
 * reader, which renders as a flat drawing no matter how good the
 * materials are. Dropping an invisible floor just under the content and
 * letting the key light throw a soft shadow onto it is what makes the
 * same geometry read as objects standing in a room. The plane paints
 * nothing but the shadow, so the page's paper still shows through.
 */
function Floor() {
  const ref = useRef<THREE.Mesh>(null);
  const since = useRef(0);

  useFrame((state, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    since.current += dt;
    if (since.current < 0.5) return;
    since.current = 0;

    _fbox.makeEmpty();
    let found = false;
    state.scene.traverse((obj) => {
      if (obj === mesh || obj.userData?.noFit || obj.userData?.noFloor) return;
      if (!(obj as THREE.Mesh).geometry) return;
      for (let p = obj.parent; p; p = p.parent) {
        if (p.userData?.noFit) return;
      }
      _fbox.expandByObject(obj);
      found = true;
    });
    if (!found || _fbox.isEmpty()) return;

    const target = _fbox.min.y - 0.05;
    mesh.position.y = MathUtils.damp(mesh.position.y, target, 5, dt);
    mesh.position.x = (_fbox.min.x + _fbox.max.x) / 2;
    mesh.position.z = (_fbox.min.z + _fbox.max.z) / 2;
  });

  return (
    <mesh
      ref={ref}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -50, 0]}
      receiveShadow
      userData={{ noFit: true }}
    >
      <planeGeometry args={[80, 80]} />
      <shadowMaterial transparent opacity={0.17} color={P.ink} />
    </mesh>
  );
}

/**
 * Measures everything in the scene that is not marked decorative, then
 * solves for the camera distance that fits it.
 *
 * The distance is exact rather than estimated. Put the camera at
 * `center + dir * D` looking at the centre, and build the camera basis
 * from `dir`. A corner's camera-space x and y do not depend on D at all —
 * only its z does, as `q.z - D`. A point is inside the frustum when
 * `D - q.z >= |q.x| / tanH` and likewise for y, so the smallest D that
 * holds for every corner is just the largest of those expressions. That
 * matters because most of these diagrams are viewed obliquely, where a
 * deep box projects far wider than its world-space width.
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

  // Camera basis: +Z points back along the view direction.
  _zAxis.copy(viewDir).normalize();
  _up.set(0, 1, 0);
  if (Math.abs(_zAxis.dot(_up)) > 0.999) _up.set(0, 0, 1);
  _xAxis.copy(_up).cross(_zAxis).normalize();
  _yAxis.copy(_zAxis).cross(_xAxis).normalize();

  const tanV = Math.tan(MathUtils.degToRad(cam.fov) / 2);
  const tanH = tanV * aspect;

  let dist = 0;
  for (let i = 0; i < 8; i++) {
    _corner.set(
      i & 1 ? _box.max.x : _box.min.x,
      i & 2 ? _box.max.y : _box.min.y,
      i & 4 ? _box.max.z : _box.min.z,
    );
    _corner.sub(_center);
    const qx = _corner.dot(_xAxis);
    const qy = _corner.dot(_yAxis);
    const qz = _corner.dot(_zAxis);
    dist = Math.max(dist, qz + Math.max((Math.abs(qx) * fit) / tanH, (Math.abs(qy) * fit) / tanV));
  }

  outPos.copy(_center).addScaledVector(_zAxis, dist + 0.15);
  outLook.copy(_center);
  return true;
}

/**
 * The orthographic twin. Parallel projection does not change size with
 * depth, so there is no distance to solve for: the rig sets `zoom` from
 * the widest and tallest the content gets in camera space, and parks the
 * camera far enough back that nothing crosses the near plane.
 */
function measureOrtho(
  scene: THREE.Object3D,
  width: number,
  height: number,
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
    for (let p = obj.parent; p; p = p.parent) {
      if (p.userData?.noFit) return;
    }
    _box.expandByObject(obj);
    found = true;
  });
  if (!found || _box.isEmpty()) return 0;

  _box.getCenter(_center);
  _zAxis.copy(viewDir).normalize();
  _up.set(0, 1, 0);
  if (Math.abs(_zAxis.dot(_up)) > 0.999) _up.set(0, 0, 1);
  _xAxis.copy(_up).cross(_zAxis).normalize();
  _yAxis.copy(_zAxis).cross(_xAxis).normalize();

  let halfW = 0;
  let halfH = 0;
  let depth = 0;
  for (let i = 0; i < 8; i++) {
    _corner
      .set(
        i & 1 ? _box.max.x : _box.min.x,
        i & 2 ? _box.max.y : _box.min.y,
        i & 4 ? _box.max.z : _box.min.z,
      )
      .sub(_center);
    halfW = Math.max(halfW, Math.abs(_corner.dot(_xAxis)));
    halfH = Math.max(halfH, Math.abs(_corner.dot(_yAxis)));
    depth = Math.max(depth, Math.abs(_corner.dot(_zAxis)));
  }

  // R3F gives an orthographic camera a pixel-sized frustum, so the zoom
  // that fits N world units across a W pixel canvas is W / (2N).
  const zoom = Math.min(
    width / (2 * Math.max(0.001, halfW * fit)),
    height / (2 * Math.max(0.001, halfH * fit)),
  );

  outPos.copy(_center).addScaledVector(_zAxis, depth + 14);
  outLook.copy(_center);
  return zoom;
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
  const goalZoom = useRef(0);

  useFrame((state, dt) => {
    const cam = state.camera as THREE.PerspectiveCamera & THREE.OrthographicCamera;

    if (!dir.current) {
      const d = cam.position.clone();
      if (d.lengthSq() < 1e-6) d.set(0, 0, 1);
      dir.current = d.normalize();
    }

    since.current += dt;
    if (since.current > 0.4 || !settled.current) {
      since.current = 0;
      if (cam.isOrthographicCamera) {
        const z = measureOrtho(
          state.scene,
          state.size.width,
          state.size.height,
          fit,
          dir.current,
          goalPos.current,
          goalLook.current,
        );
        if (z > 0) {
          goalZoom.current = z;
          if (!settled.current) {
            cam.position.copy(goalPos.current);
            cam.zoom = z;
            settled.current = true;
          }
        }
      } else {
        const got = measureScene(
          state.scene,
          cam,
          state.size.width / Math.max(1, state.size.height),
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
    }

    if (!settled.current) return;
    cam.position.lerp(goalPos.current, 1 - Math.exp(-4 * dt));
    cam.lookAt(goalLook.current);
    if (cam.isOrthographicCamera && goalZoom.current > 0) {
      cam.zoom = MathUtils.damp(cam.zoom, goalZoom.current, 4, dt);
    }
    cam.updateProjectionMatrix();
  });

  return null;
}
