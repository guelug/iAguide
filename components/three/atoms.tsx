"use client";

import { Html, Line, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
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
import { P } from "@/lib/palette";
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
      />
      <mesh position={tip} quaternion={quat}>
        <coneGeometry args={[head * 0.52, head * 1.5, 14]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.02} transparent opacity={opacity} />
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
            <mesh
              ref={(m) => {
                refs.current[i] = m;
              }}
              position={[0, baseline, 0]}
              scale={[1, 0.001, 1]}
            >
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial color={color} roughness={0.42} metalness={0.03} />
            </mesh>
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
      <RoundedBox args={[w, h, 0.07]} radius={0.05} smoothness={3}>
        <meshStandardMaterial
          color={P.surface}
          roughness={0.5}
          metalness={0}
          transparent
          opacity={0.96}
        />
      </RoundedBox>
      {/* Header strip: the panel's identity, not a floating annotation. */}
      <mesh position={[0, h / 2 - head / 2, 0.038]}>
        <planeGeometry args={[w - 0.06, head]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.95 : 0.75} />
      </mesh>
      <mesh position={[0, -head / 2, 0.038]}>
        <planeGeometry args={[w - 0.06, h - head - 0.06]} />
        <meshBasicMaterial color={color} transparent opacity={fill} />
      </mesh>
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
