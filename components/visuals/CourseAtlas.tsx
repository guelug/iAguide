"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { CatmullRomCurve3, Group, Mesh, Vector3 } from "three";
import { Halo, Motes, Tag, type V3 } from "@/components/three/atoms";
import { Stage, useStage } from "@/components/three/Stage";
import { P } from "@/lib/palette";

export type AtlasNode = {
  slug: string;
  order: number;
  title: string;
  track: string;
  color: string;
  status: "complete" | "wip";
  prereqs: string[];
};

/**
 * The course as a descending helix. Order is the path; colour is the
 * track; the bright thread running down the spiral is the reading order.
 * Prerequisite links are the chords that cut across it.
 */

const TURNS = 2.65;
const TOP = 2.55;
const BOTTOM = -2.55;
const RADIUS = 3.25;

function layout(n: number): V3[] {
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    const a = t * Math.PI * 2 * TURNS;
    const r = RADIUS + Math.sin(t * Math.PI * 3) * 0.28;
    return [Math.cos(a) * r, TOP + (BOTTOM - TOP) * t, Math.sin(a) * r] as V3;
  });
}

function NodeMesh({
  node,
  position,
  hovered,
  dimmed,
  onHover,
  onSelect,
}: {
  node: AtlasNode;
  position: V3;
  hovered: boolean;
  dimmed: boolean;
  onHover: (slug: string | null) => void;
  onSelect: (slug: string) => void;
}) {
  const ref = useRef<Mesh>(null);
  const { still } = useStage();
  const wip = node.status === "wip";
  const base = wip ? 0.115 : 0.16;

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const target = hovered ? base * 1.9 : dimmed ? base * 0.62 : base;
    const k = still ? 1 : Math.min(1, dt * 9);
    m.scale.setScalar(m.scale.x + (target - m.scale.x) * k);
  });

  return (
    <group position={position}>
      <mesh
        ref={ref}
        scale={base}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.slug);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.slug);
        }}
      >
        <icosahedronGeometry args={[1, wip ? 0 : 1]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered ? 2.6 : dimmed ? 0.25 : 1.1}
          roughness={0.3}
          metalness={0.15}
          wireframe={wip}
          transparent
          opacity={dimmed ? 0.5 : 1}
          toneMapped={false}
        />
      </mesh>
      {hovered ? (
        <>
          <Halo radius={0.42} thickness={0.006} color={node.color} opacity={0.8} spin={1.2} />
          <Tag position={[0, 0.5, 0]} tone="ink" center>
            {String(node.order).padStart(2, "0")} · {node.title}
          </Tag>
        </>
      ) : null}
    </group>
  );
}

function Thread({ points, dim }: { points: V3[]; dim: boolean }) {
  const group = useRef<Group>(null);
  const { still } = useStage();
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
    [points],
  );
  const line = useMemo(
    () => curve.getPoints(420).map((v) => v.toArray() as V3),
    [curve],
  );
  const beads = 14;

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const base = still ? 0.1 : (clock.elapsedTime * 0.045) % 1;
    g.children.forEach((child, i) => {
      const t = (base + i / beads) % 1;
      child.position.copy(curve.getPointAt(t));
      child.scale.setScalar(0.55 + Math.sin(t * Math.PI) * 0.6);
    });
  });

  return (
    <group>
      {/* The reading order, drawn in teal so it survives the paper. */}
      <Line
        points={line}
        color={P.teal}
        lineWidth={1.8}
        transparent
        opacity={dim ? 0.12 : 0.45}
      />
      <group ref={group}>
        {Array.from({ length: beads }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshBasicMaterial
              color={P.tealDeep}
              transparent
              opacity={dim ? 0.2 : 0.8}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function CourseAtlas({
  nodes,
  activeTrack,
  onHover,
  onSelect,
  className,
}: {
  nodes: AtlasNode[];
  activeTrack: string | null;
  onHover: (slug: string | null) => void;
  onSelect: (slug: string) => void;
  className?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const positions = useMemo(() => layout(nodes.length), [nodes.length]);
  const bySlug = useMemo(
    () => new Map(nodes.map((n, i) => [n.slug, positions[i]])),
    [nodes, positions],
  );

  const chords = useMemo(() => {
    const out: { key: string; pts: V3[]; color: string; slug: string }[] = [];
    nodes.forEach((n) => {
      const to = bySlug.get(n.slug);
      if (!to) return;
      n.prereqs.forEach((p) => {
        const from = bySlug.get(p);
        if (!from) return;
        // Bow the chord toward the axis so it reads as a shortcut.
        const mid: V3 = [
          (from[0] + to[0]) * 0.22,
          (from[1] + to[1]) / 2,
          (from[2] + to[2]) * 0.22,
        ];
        out.push({ key: `${p}->${n.slug}`, pts: [from, mid, to], color: n.color, slug: n.slug });
      });
    });
    return out;
  }, [nodes, bySlug]);

  const handleHover = (slug: string | null) => {
    setHover(slug);
    onHover(slug);
  };

  return (
    <Stage
      className={className}
      camera={{ position: [0, 2.6, 9.2], fov: 44 }}
      background={P.paper}
      controls={{ enableZoom: true, autoRotate: !hover, autoRotateSpeed: 0.32, minDistance: 5, maxDistance: 16 }}
    >
      <group onPointerMissed={() => handleHover(null)}>
        <Thread points={positions} dim={Boolean(activeTrack)} />

        {chords.map((c) => {
          const rel = hover ? c.key.includes(hover) : false;
          const dim = activeTrack
            ? !nodes.find((n) => n.slug === c.slug && n.track === activeTrack)
            : false;
          return (
            <Line
              key={c.key}
              points={c.pts}
              color={c.color}
              lineWidth={rel ? 2 : 1}
              transparent
              opacity={rel ? 0.85 : dim ? 0.04 : 0.1}
            />
          );
        })}

        {nodes.map((n, i) => (
          <NodeMesh
            key={n.slug}
            node={n}
            position={positions[i]}
            hovered={hover === n.slug}
            dimmed={Boolean(activeTrack) && n.track !== activeTrack}
            onHover={handleHover}
            onSelect={onSelect}
          />
        ))}

        {/* The spine the whole course winds around. */}
        <Line
          points={[
            [0, TOP + 0.7, 0],
            [0, BOTTOM - 0.7, 0],
          ]}
          color={P.lineStrong}
          lineWidth={1}
          transparent
          opacity={0.4}
          dashed
        />
        <Halo radius={RADIUS + 0.5} thickness={0.004} color={P.teal} opacity={0.22} position={[0, TOP, 0]} />
        <Halo radius={RADIUS + 0.5} thickness={0.004} color={P.violet} opacity={0.16} position={[0, BOTTOM, 0]} />
        {/* A faint base disc grounds the helix on the paper (shadow planes
            render as solid slabs on a transparent canvas — don't use them). */}
        <mesh position={[0, BOTTOM - 0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[RADIUS + 0.9, 48]} />
          <meshBasicMaterial color={P.sunken} transparent opacity={0.55} depthWrite={false} />
        </mesh>
        <Motes count={280} radius={9} color={P.violet} size={0.028} opacity={0.3} speed={0.008} />
      </group>
    </Stage>
  );
}
