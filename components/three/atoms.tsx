"use client";

import { Html, Line, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CatmullRomCurve3,
  Color,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  Object3D,
  Points,
  Quaternion,
  Vector3,
} from "three";
import { P, mixHex } from "@/lib/palette";
import { useViewer } from "./ViewerContext";
import { useStage } from "./Stage";

export type V3 = [number, number, number];

const tmpObj = new Object3D();
const tmpVec = new Vector3();

/**
 * Deterministic 0..1 noise. Diagrams must look identical on every render
 * and every reload — a figure that reshuffles itself on a re-render is a
 * figure a reader cannot point at.
 */
export function hash(i: number, salt: number) {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/* ------------------------------------------------------------------ nodes */

/**
 * A point of interest. Everything that is "a thing" in a diagram — a
 * token, a layer, an expert, a module — is one of these. Solid colour on
 * paper, not a glow: it has to survive a projector.
 */
export function Node3D({
  position,
  color = P.teal,
  radius = 0.16,
  pulse = 0,
  faceted = false,
  matte = false,
  onPointerOver,
  onPointerOut,
  onClick,
  children,
}: {
  position: V3;
  color?: string;
  radius?: number;
  /** Seconds of phase offset; 0 disables the breathing animation. */
  pulse?: number;
  faceted?: boolean;
  /** Unlit flat fill. Use for small marks that must hold their hue. */
  matte?: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<Mesh>(null);
  const { still } = useStage();
  const { studio } = useViewer();

  useFrame(({ clock }) => {
    if (!ref.current || !pulse) return;
    if (still) {
      // Reduced-motion scenes should settle on the authored size rather than
      // preserving a frame from the breathing animation.
      ref.current.scale.setScalar(1);
      return;
    }
    const t = clock.elapsedTime * 1.6 + pulse;
    ref.current.scale.setScalar(1 + Math.sin(t) * 0.08);
  });

  return (
    <mesh
      ref={ref}
      position={position}
      castShadow={!matte}
      receiveShadow={!matte}
      onPointerOver={
        onPointerOver
          ? (e) => {
              e.stopPropagation();
              onPointerOver();
            }
          : undefined
      }
      onPointerOut={onPointerOut}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
    >
      {faceted ? (
        <icosahedronGeometry args={[radius, 1]} />
      ) : (
        <sphereGeometry args={[radius, 32, 20]} />
      )}
      {matte ? (
        <meshBasicMaterial color={color} />
      ) : studio ? (
        <meshPhysicalMaterial
          color={color}
          roughness={faceted ? 0.42 : 0.34}
          metalness={0}
          clearcoat={0.65}
          clearcoatRoughness={0.18}
          flatShading={faceted}
        />
      ) : (
        <meshStandardMaterial
          color={color}
          roughness={faceted ? 0.36 : 0.3}
          metalness={0.04}
          envMapIntensity={0.95}
          flatShading={faceted}
        />
      )}
      {children}
    </mesh>
  );
}

/** A panel with a printed edge. Layers, blocks, stages, memory pages. */
export function Slab({
  position,
  size = [1.6, 1, 0.14],
  color = P.teal,
  fill = 0.18,
  rim = 0.9,
  rotation,
  onPointerOver,
  onPointerOut,
  onClick,
  children,
}: {
  position: V3;
  size?: V3;
  color?: string;
  /** 0 = outline only, 1 = solid. */
  fill?: number;
  rim?: number;
  rotation?: V3;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const [w, h, d] = size;
  const { studio } = useViewer();
  /* A face-on panel big enough to be "a component of the system" is drawn
     as a physical module: a pale body, a tinted face and an accent band
     along the top. Thin layers, tiles and bars stay frosted acrylic. */
  const asModule = studio && fill < 0.6 && w >= 0.9 && h >= 0.7 && d <= 0.3;
  const band = Math.min(0.13, h * 0.1);
  const edgeLoops = useMemo(() => {
    const x = w / 2;
    const y = h / 2;
    const frontZ = d / 2 + 0.003;
    const backZ = -d / 2 - 0.001;
    const front: V3[] = [
      [-x, -y, frontZ],
      [x, -y, frontZ],
      [x, y, frontZ],
      [-x, y, frontZ],
      [-x, -y, frontZ],
    ];
    const back: V3[] = [
      [-x, -y, backZ],
      [x, -y, backZ],
      [x, y, backZ],
      [-x, y, backZ],
      [-x, -y, backZ],
    ];
    const sides: V3[][] = [
      [front[0], back[0]],
      [front[1], back[1]],
      [front[2], back[2]],
      [front[3], back[3]],
    ];
    return { front, back, sides };
  }, [w, h, d]);

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={
        onPointerOver
          ? (e) => {
              e.stopPropagation();
              onPointerOver();
            }
          : undefined
      }
      onPointerOut={onPointerOut}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
    >
      <RoundedBox
        args={[w, h, d]}
        radius={Math.min(0.05, d / 2.2)}
        smoothness={3}
        castShadow={fill > 0.7 || asModule}
        receiveShadow
      >
        {asModule ? (
          <meshPhysicalMaterial
            color={mixHex(P.surface, color, 0.05 + fill * 0.18)}
            roughness={0.5}
            metalness={0}
            clearcoat={0.35}
            clearcoatRoughness={0.3}
          />
        ) : studio && fill < 1 ? (
          /* Frosted acrylic: a faint accent at low opacity is mostly the
             environment's reflection, which read as mint rather than teal.
             Mixing the tint toward paper and raising opacity keeps the hue
             and gives the plate a body the shadow and AO can describe. */
          <meshPhysicalMaterial
            color={mixHex(P.paper, color, 0.3 + fill * 0.75)}
            transparent
            opacity={Math.min(0.92, 0.5 + fill * 0.8)}
            roughness={0.42}
            metalness={0}
            clearcoat={0.4}
            clearcoatRoughness={0.3}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            transparent={fill < 1}
            opacity={fill}
            roughness={0.4}
            metalness={0.03}
            envMapIntensity={0.82}
            depthWrite={fill > 0.85}
            polygonOffset={fill < 1}
            polygonOffsetFactor={-1}
          />
        )}
      </RoundedBox>
      {asModule ? (
        <>
          <mesh position={[0, -band / 2, d / 2 + 0.002]} receiveShadow>
            <planeGeometry args={[w - 0.14, h - band - 0.14]} />
            <meshStandardMaterial color={mixHex(P.paper, color, 0.07 + fill * 0.34)} roughness={0.7} metalness={0} />
          </mesh>
          <mesh position={[0, h / 2 - band / 2 - 0.035, d / 2 + 0.003]}>
            <planeGeometry args={[w - 0.14, band]} />
            <meshStandardMaterial color={color} roughness={0.45} metalness={0} />
          </mesh>
        </>
      ) : null}
      <Line
        points={edgeLoops.front}
        color={color}
        lineWidth={1.6}
        transparent
        opacity={rim}
        depthWrite={false}
      />
      <Line
        points={edgeLoops.back}
        color={color}
        lineWidth={1.05}
        transparent
        opacity={rim * 0.42}
        depthWrite={false}
      />
      {edgeLoops.sides.map((segment, i) => (
        <Line
          key={i}
          points={segment}
          color={color}
          lineWidth={1.05}
          transparent
          opacity={rim * 0.68}
          depthWrite={false}
        />
      ))}
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ links */

/** A connection with no traffic on it. */
export function Wire({
  points,
  color = P.lineStrong,
  opacity = 0.75,
  width = 1.2,
  dashed = false,
}: {
  points: V3[];
  color?: string;
  opacity?: number;
  width?: number;
  dashed?: boolean;
}) {
  return (
    <Line
      points={points}
      color={color}
      lineWidth={width}
      transparent
      opacity={opacity}
      dashed={dashed}
      dashSize={0.12}
      gapSize={0.1}
      depthWrite={false}
    />
  );
}

/**
 * A connection with data moving along it. The single most useful
 * primitive in the course: it turns a box-and-arrow diagram into
 * something you can watch happen.
 */
export function Flow({
  points,
  color = P.teal,
  count = 3,
  speed = 0.35,
  size = 0.055,
  lineOpacity = 0.42,
  width = 1.4,
  offset = 0,
  paused = false,
  tension = 0.4,
}: {
  points: V3[];
  color?: string;
  count?: number;
  speed?: number;
  size?: number;
  lineOpacity?: number;
  width?: number;
  offset?: number;
  paused?: boolean;
  tension?: number;
}) {
  const group = useRef<Group>(null);
  const phase = useRef(((offset % 1) + 1) % 1);
  const previousOffset = useRef(offset);
  const { still } = useStage();
  const { studio } = useViewer();
  /* A comet tail makes direction legible at a glance; a lone dot on a
     loop could be going either way. */
  const trail = studio ? 4 : 0;

  const curve = useMemo(
    () =>
      new CatmullRomCurve3(
        points.map((p) => new Vector3(...p)),
        false,
        "catmullrom",
        tension,
      ),
    [points, tension],
  );

  const line = useMemo(
    () => curve.getPoints(Math.max(24, points.length * 12)).map((v) => v.toArray() as V3),
    [curve, points.length],
  );

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (previousOffset.current !== offset) {
      phase.current = ((offset % 1) + 1) % 1;
      previousOffset.current = offset;
    }
    if (!still && !paused) {
      phase.current = (phase.current + dt * speed) % 1;
      if (phase.current < 0) phase.current += 1;
    }
    const base = phase.current;
    const stride = trail + 1;
    g.children.forEach((child, j) => {
      const i = Math.floor(j / stride);
      const k = j % stride;
      const head = (base + i / count) % 1;
      const t = head - k * 0.016;
      if (t < 0) {
        child.visible = false;
        return;
      }
      child.visible = true;
      curve.getPointAt(t, tmpVec);
      child.position.copy(tmpVec);
      const fade = Math.sin(head * Math.PI);
      child.scale.setScalar((0.6 + fade * 0.7) * (1 - k * 0.19));
    });
  });

  return (
    <group>
      <Line
        points={line}
        color={color}
        lineWidth={width}
        transparent
        opacity={lineOpacity}
        depthWrite={false}
      />
      <group ref={group}>
        {Array.from({ length: count * (trail + 1) }, (_, j) => {
          const k = j % (trail + 1);
          return (
            <mesh key={j}>
              <sphereGeometry args={[size, 14, 12]} />
              <meshBasicMaterial
                color={color}
                transparent={k > 0}
                opacity={1 - k * 0.22}
                depthWrite={k === 0}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** A solid tube along a path. Heavier than Flow; use for spines. */
export function Ribbon({
  points,
  color = P.violet,
  radius = 0.03,
  opacity = 1,
}: {
  points: V3[];
  color?: string;
  radius?: number;
  opacity?: number;
}) {
  const { studio } = useViewer();
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
    [points],
  );
  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, studio ? 128 : 64, radius, studio ? 16 : 10, false]} />
      <meshPhysicalMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={studio ? 0.3 : 0.36}
        metalness={studio ? 0 : 0.06}
        clearcoat={studio ? 0.6 : 0}
        clearcoatRoughness={0.2}
        envMapIntensity={0.9}
        depthWrite={opacity >= 0.98}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ fields */

export type Cell = {
  position: V3;
  scale?: number | V3;
  color?: string;
};

/**
 * Instanced cubes. Matrices, weight grids, KV caches, VRAM blocks —
 * anything where the count itself is the message.
 */
export function Lattice({
  cells,
  size = 0.1,
  opacity = 1,
  matte = false,
}: {
  cells: Cell[];
  size?: number;
  opacity?: number;
  matte?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  const count = cells.length;
  const { studio } = useViewer();

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const col = new Color();
    cells.forEach((cell, i) => {
      tmpObj.position.set(...cell.position);
      if (Array.isArray(cell.scale)) tmpObj.scale.set(...cell.scale);
      else tmpObj.scale.setScalar(cell.scale ?? 1);
      tmpObj.rotation.set(0, 0, 0);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
      mesh.setColorAt(i, col.set(cell.color ?? P.teal));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cells]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, count]}
      key={count}
      castShadow
      receiveShadow
    >
      {studio ? <RoundedBoxGeometryCell size={size} /> : <boxGeometry args={[size, size, size]} />}
      {matte ? (
        <meshBasicMaterial
          transparent={opacity < 1}
          opacity={opacity}
          depthWrite={opacity >= 0.98}
        />
      ) : (
        <meshPhysicalMaterial
          roughness={studio ? 0.4 : 0.36}
          metalness={studio ? 0 : 0.06}
          clearcoat={studio ? 0.45 : 0}
          clearcoatRoughness={0.25}
          envMapIntensity={0.9}
          transparent={opacity < 1}
          opacity={opacity}
          depthWrite={opacity >= 0.98}
        />
      )}
    </instancedMesh>
  );
}

/** A cube with softened edges, so instanced grids catch a highlight on every cell. */
function RoundedBoxGeometryCell({ size }: { size: number }) {
  const geometry = useMemo(() => new RoundedBoxGeometry(size, size, size, 2, size * 0.14), [size]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <primitive object={geometry} attach="geometry" />;
}

/** Ambient dust. Depth cues that cost nothing. */
export function Motes({
  count = 320,
  radius = 9,
  color = P.faint,
  size = 0.035,
  speed = 0.02,
  opacity = 0.5,
}: {
  count?: number;
  radius?: number;
  color?: string;
  size?: number;
  speed?: number;
  opacity?: number;
}) {
  const ref = useRef<Points>(null);
  const { still } = useStage();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius * Math.cbrt(hash(i, 1));
      const theta = hash(i, 2) * Math.PI * 2;
      const phi = Math.acos(2 * hash(i, 3) - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, radius]);

  useFrame((_, dt) => {
    if (!ref.current || still) return;
    ref.current.rotation.y += dt * speed;
  });

  return (
    <points ref={ref} userData={{ noFit: true }}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      {/* Normal blending, not additive: additive on paper is invisible. */}
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** A drawn ring. Orbits, boundaries, scopes, budgets. */
export function Halo({
  position = [0, 0, 0] as V3,
  radius = 1,
  thickness = 0.012,
  color = P.lineStrong,
  opacity = 0.8,
  rotation = [Math.PI / 2, 0, 0] as V3,
  spin = 0,
}: {
  position?: V3;
  radius?: number;
  thickness?: number;
  color?: string;
  opacity?: number;
  rotation?: V3;
  spin?: number;
}) {
  const ref = useRef<Mesh>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (!ref.current || !spin || still) return;
    ref.current.rotation.z += dt * spin;
  });
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <torusGeometry args={[radius, thickness, 8, 96]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ labels */

/**
 * A hand-drawn ground shadow: a soft flat ellipse under a subject. Cheaper
 * and more predictable than shadow-map contact shadows, which smear into a
 * solid grey band at low glancing camera angles.
 */
export function ShadowBlob({
  position = [0, 0, 0] as V3,
  scale = 1,
  color = P.ink,
  opacity = 0.1,
}: {
  position?: V3;
  /** X radius multiplier; the blob keeps a 1:0.42 ellipse ratio. */
  scale?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[scale, scale * 0.42, 1]}
      userData={{ noFit: true }}
    >
      <circleGeometry args={[0.5, 40]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

/**
 * A DOM label anchored to a 3D point. Real text: selectable, translatable,
 * and readable by a screen reader, which SDF text in the canvas is not.
 */
export function Tag({
  position,
  children,
  tone = "teal",
  size = "sm",
  center = false,
  plate = true,
}: {
  position: V3;
  children: ReactNode;
  tone?: "teal" | "amber" | "violet" | "ink" | "rose" | "muted";
  size?: "xs" | "sm";
  center?: boolean;
  /** Paper chip behind the text so it stays legible over geometry. */
  plate?: boolean;
}) {
  const { labels, studio } = useViewer();
  if (!labels) return null;
  const tones: Record<string, string> = {
    teal: "text-teal",
    amber: "text-amber",
    violet: "text-violet",
    ink: "text-ink",
    rose: "text-rose",
    muted: "text-muted",
  };
  /* Html has no geometry, so a label would be invisible to the camera rig
     and get cropped — which is exactly what used to happen to long tags
     near an edge. The anchor below is never drawn; it exists so the fit
     knows the caption is there, and it is sized from the text so a wide
     label reserves wide space instead of a point. */
  const chars = typeof children === "string" ? children.length : 8;
  const anchorW = Math.min(1.6, 0.06 + chars * 0.032);

  return (
    <group position={position}>
      <mesh visible={false} position={[center ? 0 : anchorW / 2, 0, 0]}>
        <boxGeometry args={[anchorW, 0.16, 0.02]} />
      </mesh>
    <Html
      center={center}
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <span
        className={`whitespace-nowrap font-mono font-medium uppercase tracking-[0.13em] ${
          size === "xs" ? "text-[0.56rem]" : "text-[0.64rem]"
        } ${tones[tone]} ${
          plate
            ? studio
              ? "rounded-full border border-line-strong/60 bg-surface/88 px-2 py-0.5 shadow-[0_1px_2px_rgba(20,23,27,0.07),0_4px_10px_-6px_rgba(20,23,27,0.22)] backdrop-blur-[3px]"
              : "rounded-full border border-line bg-surface/92 px-1.5 py-0.5"
            : ""
        }`}
      >
        {children}
      </span>
    </Html>
    </group>
  );
}

/* --------------------------------------------------------------- motion */

/** Drifts a group on a slow lissajous path. Cheap life for static scenes. */
export function Drift({
  children,
  amount = 0.12,
  speed = 0.4,
  seed = 0,
}: {
  children: ReactNode;
  amount?: number;
  speed?: number;
  seed?: number;
}) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame(({ clock }) => {
    if (!ref.current || still) return;
    const t = clock.elapsedTime * speed + seed;
    ref.current.position.y = Math.sin(t) * amount;
    ref.current.position.x = Math.cos(t * 0.73) * amount * 0.5;
    ref.current.rotation.z = Math.sin(t * 0.5) * amount * 0.1;
  });
  return <group ref={ref}>{children}</group>;
}

/** Slow yaw for whole scenes. Pauses under reduced motion. */
export function Turntable({
  children,
  speed = 0.06,
  tilt = 0,
}: {
  children: ReactNode;
  speed?: number;
  tilt?: number;
}) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (!ref.current || still) return;
    ref.current.rotation.y += dt * speed;
  });
  return (
    <group rotation={[tilt, 0, 0]}>
      <group ref={ref}>{children}</group>
    </group>
  );
}

/** Follows the pointer with damping. Parallax that never leaves the frame. */
export function PointerTilt({
  children,
  amount = 0.14,
}: {
  children: ReactNode;
  amount?: number;
}) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame(({ pointer }, dt) => {
    const g = ref.current;
    if (!g || still) return;
    const k = Math.min(1, dt * 3);
    g.rotation.y += (pointer.x * amount - g.rotation.y) * k;
    g.rotation.x += (-pointer.y * amount * 0.6 - g.rotation.x) * k;
  });
  return <group ref={ref}>{children}</group>;
}

/* ------------------------------------------------------------ explainers */

/**
 * A wire that ends in a head. Direction is meaning in a teaching diagram:
 * "the tool result goes back to the model" is a different claim from "the
 * model and the tool are connected", and only one of them has an arrow.
 */
export function Arrow({
  from,
  to,
  color = P.inkSoft,
  width = 1.6,
  opacity = 0.85,
  head = 0.11,
  dashed = false,
  /** Lifts the midpoint perpendicular to the run, for a drawn-by-hand bow. */
  bow = 0,
}: {
  from: V3;
  to: V3;
  color?: string;
  width?: number;
  opacity?: number;
  head?: number;
  dashed?: boolean;
  bow?: number;
}) {
  const { path, tip, quat } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    const len = dir.length() || 1;
    const unit = dir.clone().normalize();

    // Stop the shaft short so the cone is the thing that touches the target.
    const stop = b.clone().sub(unit.clone().multiplyScalar(head * 0.92));
    const mid = a.clone().add(b).multiplyScalar(0.5);
    if (bow) {
      // Perpendicular in the plane that keeps the bow visible from a
      // front-ish camera: cross with view-up, falling back to Z.
      const up = Math.abs(unit.y) > 0.92 ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0);
      mid.add(unit.clone().cross(up).normalize().multiplyScalar(-bow * len * 0.3));
    }

    const pts: V3[] = bow
      ? new CatmullRomCurve3([a, mid, stop])
          .getPoints(24)
          .map((v) => v.toArray() as V3)
      : [a.toArray() as V3, stop.toArray() as V3];

    // Cones point +Y by default; rotate that onto the arrow direction.
    const q = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      bow ? b.clone().sub(mid).normalize() : unit,
    );
    return { path: pts, tip: b.toArray() as V3, quat: q };
  }, [from, to, head, bow]);

  return (
    <group>
      <Line
        points={path}
        color={color}
        lineWidth={width}
        transparent
        opacity={opacity}
        dashed={dashed}
        dashSize={0.1}
        gapSize={0.08}
        depthWrite={false}
      />
      <mesh position={tip} quaternion={quat}>
        <coneGeometry args={[head * 0.52, head * 1.5, 18]} />
        <meshStandardMaterial
          color={color}
          roughness={0.42}
          metalness={0.02}
          transparent
          opacity={opacity}
          depthWrite={opacity >= 0.95}
        />
      </mesh>
    </group>
  );
}

export type Bar = {
  label?: string;
  /** 0..1 of the tallest bar's height. */
  value: number;
  color?: string;
  /** Printed on the tag instead of the raw value. */
  note?: string;
};

/**
 * A row of extruded bars with a baseline. Reach for this the moment a
 * module makes a quantitative claim — cost, throughput, quality loss —
 * because "twice as slow" should be twice as tall, not twice as adjectival.
 */
export function Bars({
  bars,
  height = 1.6,
  width = 0.34,
  gap = 0.24,
  depth = 0.34,
  baseline = 0,
  tone = "ink",
  showTags = true,
}: {
  bars: Bar[];
  height?: number;
  width?: number;
  gap?: number;
  depth?: number;
  baseline?: number;
  tone?: "teal" | "amber" | "violet" | "ink" | "rose" | "muted";
  showTags?: boolean;
}) {
  const pitch = width + gap;
  const span = (bars.length - 1) * pitch;
  const refs = useRef<(Mesh | null)[]>([]);
  const { still } = useStage();
  const { studio } = useViewer();

  // Grow on mount so the comparison reads as a measurement being taken.
  useFrame((_, dt) => {
    bars.forEach((bar, i) => {
      const m = refs.current[i];
      if (!m) return;
      const target = Math.max(0.001, bar.value) * height;
      const next = still ? target : MathUtils.damp(m.scale.y, target, 6, dt);
      m.scale.y = next;
      m.position.y = baseline + next / 2;
    });
  });

  return (
    <group>
      {bars.map((bar, i) => {
        const x = i * pitch - span / 2;
        const color = bar.color ?? P.teal;
        return (
          <group key={bar.label ?? i} position={[x, 0, 0]}>
            <RoundedBox
              ref={(m) => {
                refs.current[i] = m;
              }}
              args={[width, height, depth]}
              radius={Math.min(0.055, width / 4, depth / 4)}
              smoothness={2}
              position={[0, baseline, 0]}
              scale={[1, 0.001, 1]}
              castShadow
              receiveShadow
            >
              <meshPhysicalMaterial
                color={color}
                roughness={studio ? 0.34 : 0.32}
                metalness={studio ? 0 : 0.06}
                clearcoat={studio ? 0.55 : 0}
                clearcoatRoughness={0.2}
                envMapIntensity={0.92}
              />
            </RoundedBox>
            {showTags && bar.label ? (
              <Tag position={[0, baseline - 0.24, depth / 2]} tone={tone} size="xs" center>
                {bar.label}
              </Tag>
            ) : null}
            {bar.note ? (
              <Tag
                position={[0, baseline + bar.value * height + 0.22, depth / 2]}
                tone={tone}
                size="xs"
                center
              >
                {bar.note}
              </Tag>
            ) : null}
          </group>
        );
      })}
      <Line
        points={[
          [-span / 2 - width, baseline, depth / 2],
          [span / 2 + width, baseline, depth / 2],
        ]}
        color={P.lineStrong}
        lineWidth={1.2}
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </group>
  );
}

/**
 * A titled card standing in 3D space. Slab is a shape; Panel is a labelled
 * component of a system — it has a header strip so a reader can name it
 * without hunting for a floating tag.
 */
export function Panel({
  position,
  rotation,
  size = [1.9, 1.25],
  color = P.teal,
  title,
  fill = 0.1,
  active = false,
  onClick,
  onPointerOver,
  onPointerOut,
  children,
}: {
  position: V3;
  rotation?: V3;
  /** [width, height]; depth is fixed thin so panels stack cleanly. */
  size?: [number, number];
  color?: string;
  title?: string;
  fill?: number;
  active?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  children?: ReactNode;
}) {
  const [w, h] = size;
  const head = Math.min(0.24, h * 0.22);
  const ref = useRef<Group>(null);
  const { still } = useStage();

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = active ? 1.06 : 1;
    g.scale.setScalar(still ? target : MathUtils.damp(g.scale.x, target, 6, dt));
  });

  return (
    <group
      ref={ref}
      position={position}
      rotation={rotation}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
      onPointerOver={
        onPointerOver
          ? (e) => {
              e.stopPropagation();
              onPointerOver();
            }
          : undefined
      }
      onPointerOut={onPointerOut}
    >
      <RoundedBox args={[w, h, 0.07]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial
          color={P.surface}
          roughness={0.36}
          metalness={0.04}
          envMapIntensity={0.96}
        />
      </RoundedBox>
      {/* Header strip: the panel's identity, not a floating annotation. */}
      <mesh position={[0, h / 2 - head / 2, 0.038]}>
        <planeGeometry args={[w - 0.06, head]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={active ? 0.95 : 0.75}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, -head / 2, 0.038]}>
        <planeGeometry args={[w - 0.06, h - head - 0.06]} />
        <meshBasicMaterial color={color} transparent opacity={fill} depthWrite={false} />
      </mesh>
      <Line
        points={[[-w / 2 + 0.04, h / 2 - head, 0.046], [w / 2 - 0.04, h / 2 - head, 0.046]]}
        color={color}
        lineWidth={0.8}
        transparent
        opacity={active ? 0.8 : 0.45}
        depthWrite={false}
      />
      <Line
        points={[
          [-w / 2, -h / 2, 0.04],
          [w / 2, -h / 2, 0.04],
          [w / 2, h / 2, 0.04],
          [-w / 2, h / 2, 0.04],
          [-w / 2, -h / 2, 0.04],
        ]}
        color={color}
        lineWidth={active ? 2 : 1.3}
        transparent
        opacity={active ? 0.95 : 0.6}
      />
      {title ? (
        <Tag position={[0, h / 2 - head / 2, 0.06]} tone="ink" size="xs" center plate={false}>
          <span className="text-paper">{title}</span>
        </Tag>
      ) : null}
      {children}
    </group>
  );
}

/**
 * A numbered badge. Pairs with prose that says "at (3) the harness checks
 * permissions" — the diagram and the paragraph share a coordinate system.
 */
export function Marker({
  position,
  n,
  color = P.ink,
  active = true,
}: {
  position: V3;
  n: number;
  color?: string;
  active?: boolean;
}) {
  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[0.115, 28]} />
        <meshBasicMaterial color={active ? color : P.line} />
      </mesh>
      <Tag position={[0, 0, 0.02]} tone="ink" size="xs" center plate={false}>
        <span className="text-paper">{n}</span>
      </Tag>
    </group>
  );
}

/**
 * Advances an index on a timer so a scene can play a process by itself.
 * Diagrams that auto-advance teach sequence; diagrams that wait for a
 * click teach nothing until the reader guesses there is something to click.
 */
export function useCycle(length: number, seconds = 1.9, paused = false) {
  const [i, setI] = useState(0);
  const { still } = useStage();
  useEffect(() => {
    if (still || paused || length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % length), seconds * 1000);
    return () => clearInterval(id);
  }, [length, seconds, paused, still]);
  return [i, setI] as const;
}
