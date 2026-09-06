"use client";

import { Edges, Line, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import { CatmullRomCurve3, DoubleSide, Group, MathUtils, Vector3 } from "three";
import { P } from "@/lib/palette";
import { hash, type V3 } from "./atoms";
import { useStage } from "./Stage";

/*
 * An isometric technical-illustration kit.
 *
 * Perspective diagrams fight themselves: the same object changes size
 * depending on where it sits, so a reader cannot compare two of them, and
 * a ring seen from the front collapses into a line. Parallel projection
 * fixes both — every object keeps its size wherever it is, and the fixed
 * three-quarter angle means a box always shows the same three faces.
 *
 * The look is deliberately draughtsman rather than render: thin ink
 * outlines, translucent coloured plates, construction lines that overrun
 * their object, and faint routing traces on the ground.
 */

/** The one camera angle. Everything in this kit assumes it. */
export const ISO_CAMERA = { position: [9, 7.4, 9] as V3, near: -100, far: 200 };

/* ------------------------------------------------------------ surfaces */

/**
 * A translucent plate, drawn like a sheet of coloured glass: a soft fill,
 * a bright edge, and an inset second outline that reads as bevel.
 */
export function GlassPanel({
  position,
  rotation = [0, 0, 0],
  size = [2.2, 2.6],
  color = P.teal,
  opacity = 0.24,
  inset = true,
  children,
}: {
  position: V3;
  rotation?: V3;
  size?: [number, number];
  color?: string;
  opacity?: number;
  inset?: boolean;
  children?: ReactNode;
}) {
  const [w, h] = size;
  const outlines = useMemo(() => {
    const rect = (rw: number, rh: number): V3[] => [
      [-rw / 2, -rh / 2, 0.002],
      [rw / 2, -rh / 2, 0.002],
      [rw / 2, rh / 2, 0.002],
      [-rw / 2, rh / 2, 0.002],
      [-rw / 2, -rh / 2, 0.002],
    ];
    return {
      outer: rect(w, h),
      inset: rect(Math.max(0.01, w - 0.16), Math.max(0.01, h - 0.16)),
    };
  }, [w, h]);

  return (
    <group position={position} rotation={rotation}>
      <mesh receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.22}
          metalness={0}
          transmission={0}
          clearcoat={0.2}
          clearcoatRoughness={0.28}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Line
        points={outlines.outer}
        color={color}
        lineWidth={1.8}
        transparent
        opacity={0.95}
        depthWrite={false}
      />
      {inset ? (
        <Line
          points={outlines.inset}
          color={color}
          lineWidth={0.9}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      ) : null}
      {children}
    </group>
  );
}

/**
 * A thin card seen edge-on in a receding row: the corpus shard, the
 * document, the sample. Cheap enough to draw fifty of.
 */
export function Sheet({
  position,
  rotation = [0, 0, 0],
  size = [1.5, 1.05],
  color = P.amber,
  fill = 0.5,
  marks = 0,
  markColor = P.violet,
}: {
  position: V3;
  rotation?: V3;
  size?: [number, number];
  color?: string;
  fill?: number;
  /** Little bars printed on the face — content, not decoration. */
  marks?: number;
  markColor?: string;
}) {
  const [w, h] = size;
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox
        args={[w, 0.045, h]}
        radius={Math.min(0.018, 0.045 / 2.2, w / 12, h / 12)}
        smoothness={2}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          transparent={fill < 1}
          opacity={fill}
          roughness={0.48}
          metalness={0.02}
          envMapIntensity={0.78}
          depthWrite={fill >= 0.95}
        />
      </RoundedBox>
      <Line
        points={[
          [-w / 2, 0.026, -h / 2],
          [w / 2, 0.026, -h / 2],
          [w / 2, 0.026, h / 2],
          [-w / 2, 0.026, h / 2],
          [-w / 2, 0.026, -h / 2],
        ]}
        color={P.inkSoft}
        lineWidth={0.9}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
      {Array.from({ length: marks }, (_, i) => (
        <mesh
          key={i}
          position={[w * 0.18, 0.03, -h / 2 + 0.18 + i * 0.17]}
          castShadow
        >
          <boxGeometry args={[w * 0.42, 0.012, 0.07]} />
          <meshStandardMaterial color={markColor} roughness={0.5} envMapIntensity={0.72} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The subject of the drawing: a hazy volume with a grid on it. Reads as
 * "the thing itself" without pretending to depict a specific machine.
 */
export function GridVolume({
  position,
  size = 2.2,
  color = P.violet,
  opacity = 0.16,
  spin = 0.06,
}: {
  position: V3;
  size?: number;
  color?: string;
  opacity?: number;
  spin?: number;
}) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const coreOpacity = Math.min(0.5, Math.max(0, opacity) * 1.6);
  useFrame((_, dt) => {
    if (ref.current && spin && !still) ref.current.rotation.y += dt * spin;
  });
  return (
    <group position={position}>
      <group ref={ref}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[size, size, size]} />
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={opacity}
            roughness={0.18}
            metalness={0.05}
            clearcoat={0.18}
            clearcoatRoughness={0.3}
            depthWrite={false}
          />
        </mesh>
        {/* A smaller, denser core keeps low-opacity volumes readable as
            objects with mass instead of a barely-there wire cage. */}
        <mesh scale={0.72} castShadow receiveShadow>
          <boxGeometry args={[size, size, size]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={coreOpacity}
            roughness={0.34}
            metalness={0.04}
            envMapIntensity={0.82}
            depthWrite={coreOpacity >= 0.95}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[size, size, size]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
          <Edges color={color} lineWidth={1.25} transparent opacity={0.82} depthWrite={false} />
        </mesh>
        {/* Denser grid on the top face only: a drawn surface, not a cage. */}
        <mesh position={[0, size / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[size, size, 8, 8]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.5} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------- drawing */

/**
 * A construction line that overruns its object at both ends, the way a
 * draughtsman extends an axis past the part it measures.
 */
export function AxisLine({
  from,
  to,
  overrun = 0.6,
  color = P.inkSoft,
  opacity = 0.35,
  dashed = true,
}: {
  from: V3;
  to: V3;
  overrun?: number;
  color?: string;
  opacity?: number;
  dashed?: boolean;
}) {
  const pts = useMemo<V3[]>(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const d = b.clone().sub(a).normalize().multiplyScalar(overrun);
    return [a.clone().sub(d).toArray() as V3, b.clone().add(d).toArray() as V3];
  }, [from, to, overrun]);

  return (
    <Line
      points={pts}
      color={color}
      lineWidth={0.9}
      transparent
      opacity={opacity}
      dashed={dashed}
      dashSize={0.16}
      gapSize={0.12}
      depthWrite={false}
    />
  );
}

/**
 * Routing traces on the ground plane, with a tick where they turn. The
 * reference for this is a PCB drawing: it tells you things are wired
 * without claiming anything specific about the wiring.
 */
export function PlanTrace({
  points,
  y = 0,
  color = P.amber,
  opacity = 0.5,
}: {
  points: [number, number][];
  y?: number;
  color?: string;
  opacity?: number;
}) {
  const pts = useMemo<V3[]>(() => points.map(([x, z]) => [x, y, z]), [points, y]);
  return (
    // Traces explain routing on the plate; they are decorative guides and
    // must not make the camera shrink the actual mechanism to fit them.
    <group userData={{ noFit: true, decorative: true }}>
      <Line
        points={pts}
        color={color}
        lineWidth={1}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
      {pts.slice(1, -1).map((p, i) => (
        <mesh key={i} position={p} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.045, 12]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity + 0.2}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Fine specks drifting between two parts. Scale cue, and life. */
export function IsoDust({
  count = 60,
  center = [0, 0, 0] as V3,
  spread = [1.6, 1.2, 1.6] as V3,
  color = P.inkSoft,
  size = 0.035,
}: {
  count?: number;
  center?: V3;
  spread?: V3;
  color?: string;
  size?: number;
}) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        p: [
          center[0] + (hash(i, 1) - 0.5) * spread[0] * 2,
          center[1] + (hash(i, 2) - 0.5) * spread[1] * 2,
          center[2] + (hash(i, 3) - 0.5) * spread[2] * 2,
        ] as V3,
        phase: hash(i, 4) * Math.PI * 2,
      })),
    [count, center, spread],
  );

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || still) return;
    const t = clock.elapsedTime;
    g.children.forEach((child, i) => {
      child.position.y = seeds[i].p[1] + Math.sin(t * 0.5 + seeds[i].phase) * 0.08;
    });
  });

  return (
    <group ref={ref} userData={{ noFit: true }}>
      {seeds.map((s, i) => (
        <mesh key={i} position={s.p}>
          <boxGeometry args={[size, size, size]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The drawn border of the plate, inset from the canvas edge. It is what
 * makes the composition read as a printed figure rather than a viewport
 * onto an endless scene.
 */
export function IsoFrame({
  width = 13,
  depth = 9,
  y = -0.02,
}: {
  width?: number;
  depth?: number;
  y?: number;
}) {
  const rect = (w: number, d: number): V3[] => [
    [-w / 2, y, -d / 2],
    [w / 2, y, -d / 2],
    [w / 2, y, d / 2],
    [-w / 2, y, d / 2],
    [-w / 2, y, -d / 2],
  ];
  return (
    // The frame is the paper boundary, not scene content for camera fitting.
    <group userData={{ noFit: true, decorative: true }}>
      <Line
        points={rect(width, depth)}
        color={P.lineStrong}
        lineWidth={1.1}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
      <Line
        points={rect(width - 0.28, depth - 0.28)}
        color={P.lineStrong}
        lineWidth={0.7}
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </group>
  );
}

/** A duct: the reference's amber elbow, carrying something somewhere. */
export function Duct({
  from,
  to,
  radius = 0.22,
  color = P.amber,
  bend = 0.7,
}: {
  from: V3;
  to: V3;
  radius?: number;
  color?: string;
  bend?: number;
}) {
  const curve = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const mid = a.clone().lerp(b, 0.5);
    mid.y = a.y + (b.y - a.y) * bend;
    return new CatmullRomCurve3([a, mid, b]);
  }, [from, to, bend]);

  return (
    <mesh castShadow receiveShadow>
      <tubeGeometry args={[curve, 40, radius, 16, false]} />
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.1}
        envMapIntensity={0.92}
      />
    </mesh>
  );
}

/** Slow float, so an isometric plate does not look frozen. */
export function IsoFloat({
  children,
  amount = 0.06,
  speed = 0.5,
  seed = 0,
}: {
  children: ReactNode;
  amount?: number;
  speed?: number;
  seed?: number;
}) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g || still) return;
    const target = Math.sin(clock.elapsedTime * speed + seed) * amount;
    g.position.y = MathUtils.damp(g.position.y, target, 6, dt);
  });
  return <group ref={ref}>{children}</group>;
}
