"use client";

import { Html, Line, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  AdditiveBlending,
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
 * A glowing point of interest. Everything that is "a thing" in a diagram —
 * a token, a layer, an expert, a module — is one of these.
 */
export function Node3D({
  position,
  color = P.teal,
  radius = 0.16,
  intensity = 1,
  pulse = 0,
  faceted = false,
  onPointerOver,
  onPointerOut,
  onClick,
  children,
}: {
  position: V3;
  color?: string;
  radius?: number;
  intensity?: number;
  /** Seconds of phase offset; 0 disables the breathing animation. */
  pulse?: number;
  faceted?: boolean;
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
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={intensity}
        roughness={0.28}
        metalness={0.12}
        toneMapped={false}
      />
      {children}
    </mesh>
  );
}

/** A flat translucent panel with a bright rim. Layers, blocks, stages. */
export function Slab({
  position,
  size = [1.6, 1, 0.14],
  color = P.teal,
  opacity = 0.14,
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
  opacity?: number;
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
    const z = d / 2;
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
      <RoundedBox args={[w, h, d]} radius={Math.min(0.06, d / 2)} smoothness={3}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.16}
          transparent
          opacity={opacity}
          roughness={0.5}
          metalness={0.05}
        />
      </RoundedBox>
      <Line points={edges} color={color} lineWidth={1.4} transparent opacity={rim} />
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ links */

/** A straight or gently curved connection with no traffic on it. */
export function Wire({
  points,
  color = P.teal,
  opacity = 0.3,
  width = 1,
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
 * A connection with data moving along it. This is the single most useful
 * primitive in the whole course: it turns a static box-and-arrow diagram
 * into something you can watch happen.
 */
export function Flow({
  points,
  color = P.teal,
  count = 3,
  speed = 0.35,
  size = 0.055,
  lineOpacity = 0.28,
  width = 1.2,
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
      child.scale.setScalar(0.55 + fade * 0.75);
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
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** A solid tube along a path. Heavier than Flow; use for spines and trunks. */
export function Ribbon({
  points,
  color = P.violet,
  radius = 0.03,
  opacity = 0.55,
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
        emissive={color}
        emissiveIntensity={0.55}
        transparent
        opacity={opacity}
        roughness={0.4}
        toneMapped={false}
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
  emissive = 0.5,
  opacity = 1,
}: {
  cells: Cell[];
  size?: number;
  emissive?: number;
  opacity?: number;
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
      <meshStandardMaterial
        emissiveIntensity={emissive}
        roughness={0.35}
        metalness={0.1}
        transparent={opacity < 1}
        opacity={opacity}
        toneMapped={false}
        onBeforeCompile={(shader) => {
          // Instance colours should drive emissive too, otherwise a
          // multi-colour lattice reads as one flat slab under bloom.
          shader.fragmentShader = shader.fragmentShader.replace(
            "vec3 totalEmissiveRadiance = emissive;",
            "vec3 totalEmissiveRadiance = emissive * vColor;",
          );
        }}
      />
    </instancedMesh>
  );
}

/** Ambient dust. Gives depth cues without costing anything. */
export function Motes({
  count = 320,
  radius = 9,
  color = P.teal,
  size = 0.035,
  speed = 0.02,
  opacity = 0.55,
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
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/** A flat glowing ring. Orbits, boundaries, scopes. */
export function Halo({
  position = [0, 0, 0] as V3,
  radius = 1,
  thickness = 0.012,
  color = P.teal,
  opacity = 0.5,
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
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ labels */

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
  occlude = false,
}: {
  position: V3;
  children: ReactNode;
  tone?: "teal" | "amber" | "violet" | "paper" | "rose" | "faint";
  size?: "xs" | "sm";
  center?: boolean;
  occlude?: boolean;
}) {
  const tones: Record<string, string> = {
    teal: "text-teal",
    amber: "text-amber",
    violet: "text-violet",
    paper: "text-paper",
    rose: "text-rose",
    faint: "text-faint",
  };
  return (
    <Html
      position={position}
      center={center}
      occlude={occlude}
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <span
        className={`whitespace-nowrap font-mono uppercase tracking-[0.16em] ${
          size === "xs" ? "text-[0.55rem]" : "text-[0.63rem]"
        } ${tones[tone]}`}
      >
        {children}
      </span>
    </Html>
  );
}

/* ------------------------------------------------------------- animations */

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
