"use client";

import { Html, Line, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import {
  CatmullRomCurve3,
  Color,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
  Points,
  Vector3,
} from "three";
import { P } from "@/lib/palette";
import { useStage } from "./Stage";

export type V3 = [number, number, number];

const tmpObj = new Object3D();
const tmpVec = new Vector3();

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

  useFrame(({ clock }) => {
    if (!ref.current || !pulse || still) return;
    const t = clock.elapsedTime * 1.6 + pulse;
    ref.current.scale.setScalar(1 + Math.sin(t) * 0.08);
  });

  return (
    <mesh
      ref={ref}
      position={position}
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
        <sphereGeometry args={[radius, 24, 24]} />
      )}
      {matte ? (
        <meshBasicMaterial color={color} />
      ) : (
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.02} />
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
  const edges = useMemo<V3[]>(() => {
    const x = w / 2;
    const y = h / 2;
    const z = d / 2 + 0.001;
    return [
      [-x, -y, z],
      [x, -y, z],
      [x, y, z],
      [-x, y, z],
      [-x, -y, z],
    ];
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
      <RoundedBox args={[w, h, d]} radius={Math.min(0.05, d / 2.2)} smoothness={3}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={fill}
          roughness={0.55}
          metalness={0}
          depthWrite={fill > 0.85}
        />
      </RoundedBox>
      <Line points={edges} color={color} lineWidth={1.6} transparent opacity={rim} />
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
  const { still } = useStage();

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

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const base = still || paused ? 0.2 : (clock.elapsedTime * speed + offset) % 1;
    g.children.forEach((child, i) => {
      const t = (base + i / count) % 1;
      curve.getPointAt(t, tmpVec);
      child.position.copy(tmpVec);
      const fade = Math.sin(t * Math.PI);
      child.scale.setScalar(0.6 + fade * 0.7);
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
      />
      <group ref={group}>
        {Array.from({ length: count }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[size, 12, 12]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
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
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
    [points],
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 64, radius, 8, false]} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.45}
        metalness={0}
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
    <instancedMesh ref={ref} args={[undefined, undefined, count]} key={count}>
      <boxGeometry args={[size, size, size]} />
      {matte ? (
        <meshBasicMaterial transparent={opacity < 1} opacity={opacity} />
      ) : (
        <meshStandardMaterial
          roughness={0.45}
          metalness={0.02}
          transparent={opacity < 1}
          opacity={opacity}
        />
      )}
    </instancedMesh>
  );
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
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
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
    <points ref={ref}>
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
      <meshBasicMaterial color={color} transparent opacity={opacity} />
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
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={[scale, scale * 0.42, 1]}>
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
  const tones: Record<string, string> = {
    teal: "text-teal",
    amber: "text-amber",
    violet: "text-violet",
    ink: "text-ink",
    rose: "text-rose",
    muted: "text-muted",
  };
  return (
    <Html
      position={position}
      center={center}
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <span
        className={`whitespace-nowrap font-mono font-medium uppercase tracking-[0.13em] ${
          size === "xs" ? "text-[0.56rem]" : "text-[0.64rem]"
        } ${tones[tone]} ${
          plate ? "rounded-full border border-line bg-surface/92 px-1.5 py-0.5" : ""
        }`}
      >
        {children}
      </span>
    </Html>
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
