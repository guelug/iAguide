"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Mesh } from "three";
import { CanvasFrame } from "@/components/CanvasFrame";
import { useRouter } from "@/i18n/navigation";

export type Star = {
  slug: string;
  order: number;
  title: string;
  status: "complete" | "wip";
};

const LAYOUT: [number, number, number][] = [
  [-3.4, 1.35, 0],
  [-2.15, 0.55, 0],
  [-0.85, 1.25, 0],
  [0.25, 0.4, 0],
  [-2.55, -0.85, 0],
  [-1.15, -1.35, 0],
  [0.15, -0.85, 0],
  [1.45, 1.2, 0],
  [2.55, 0.45, 0],
  [3.35, -0.45, 0],
  [1.55, -1.4, 0],
  [2.85, -1.55, 0],
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [5, 6],
  [3, 7], [7, 8], [8, 9], [6, 10], [10, 11], [8, 11],
];

function StarNode({
  star,
  position,
  hovered,
  onHover,
  onClick,
}: {
  star: Star;
  position: [number, number, number];
  hovered: boolean;
  onHover: (slug: string | null) => void;
  onClick: () => void;
}) {
  const ref = useRef<Mesh>(null);
  const wip = star.status === "wip";
  const color = wip ? "#5c635c" : hovered ? "#c9a35a" : "#5aa8a0";

  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = hovered ? 0.16 : 0.1;
    const s = ref.current.scale.x + (target - ref.current.scale.x) * Math.min(1, dt * 8);
    ref.current.scale.setScalar(s);
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(star.slug);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        if (!wip) onClick();
      }}
    >
      <sphereGeometry args={[1, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 1.2 : 0.55}
        roughness={0.35}
        metalness={0.1}
      />
    </mesh>
  );
}

export function CourseConstellation({ stars }: { stars: Star[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const active = stars.find((s) => s.slug === hover);
  const router = useRouter();

  return (
    <div className="relative">
      <div className="h-[420px] w-full overflow-hidden rounded-xl border border-line bg-paper md:h-[520px]">
        <CanvasFrame className="h-full w-full" camera={{ position: [0, 0, 7.2], fov: 42 }}>
          <color attach="background" args={["#07090b"]} />
          <ambientLight intensity={0.35} />
          <pointLight position={[2, 3, 6]} intensity={18} color="#7ec4bc" />
          <pointLight position={[-4, -2, 4]} intensity={8} color="#c9a35a" />
          {EDGES.map(([a, b], i) => (
            <Line
              key={i}
              points={[LAYOUT[a], LAYOUT[b]]}
              color="#5aa8a0"
              lineWidth={1}
              transparent
              opacity={0.28}
            />
          ))}
          {stars.map((star, i) => (
            <StarNode
              key={star.slug}
              star={star}
              position={LAYOUT[i] ?? [0, 0, 0]}
              hovered={hover === star.slug}
              onHover={setHover}
              onClick={() => router.push("/m/" + star.slug)}
            />
          ))}
        </CanvasFrame>
      </div>
      <p className="mt-3 min-h-[1.5rem] text-center font-mono text-xs tracking-[0.18em] uppercase text-muted">
        {active ? String(active.order).padStart(2, "0") + " · " + active.title : "—"}
      </p>
    </div>
  );
}
