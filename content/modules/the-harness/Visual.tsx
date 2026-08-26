"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Mesh } from "three";
import { CanvasFrame } from "@/components/CanvasFrame";

const NODES: { id: string; label: string; x: number; y: number }[] = [
  { id: "user", label: "user", x: -2.6, y: 0.9 },
  { id: "thread", label: "thread", x: -1.1, y: 0.9 },
  { id: "model", label: "prefill / decode", x: 0.6, y: 0.9 },
  { id: "tools", label: "tools", x: 2.4, y: 0.9 },
  { id: "sub", label: "subagent", x: 2.4, y: -0.85 },
  { id: "cache", label: "cache hit/miss", x: 0.6, y: -0.85 },
  { id: "compact", label: "compaction", x: -1.1, y: -0.85 },
];

const PATH = [0, 1, 2, 3, 4, 5, 6, 1];

function Pulse({ positions }: { positions: [number, number, number][] }) {
  const ref = useRef<Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current = (t.current + dt * 0.35) % 1;
    const seg = t.current * (positions.length - 1);
    const i = Math.min(positions.length - 2, Math.floor(seg));
    const f = seg - i;
    const a = positions[i];
    const b = positions[i + 1];
    if (!ref.current || !a || !b) return;
    ref.current.position.set(
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      0.2,
    );
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial color="#c9a35a" emissive="#c9a35a" emissiveIntensity={1.4} />
    </mesh>
  );
}

export default function Visual() {
  const [active, setActive] = useState("thread");
  const pts: [number, number, number][] = PATH.map((i) => {
    const n = NODES[i]!;
    return [n.x, n.y, 0];
  });

  return (
    <div className="bg-void">
      <CanvasFrame className="h-[320px] w-full" camera={{ position: [0, 0, 5.4], fov: 42 }}>
        <color attach="background" args={["#07090b"]} />
        <ambientLight intensity={0.45} />
        <pointLight position={[0, 2, 5]} intensity={14} color="#7ec4bc" />
        {PATH.slice(0, -1).map((from, i) => {
          const a = NODES[from]!;
          const b = NODES[PATH[i + 1]!]!;
          return (
            <Line
              key={i}
              points={[[a.x, a.y, 0], [b.x, b.y, 0]]}
              color="#5aa8a0"
              lineWidth={1.2}
              transparent
              opacity={0.35}
            />
          );
        })}
        {NODES.map((n) => (
          <mesh
            key={n.id}
            position={[n.x, n.y, 0]}
            onPointerOver={() => setActive(n.id)}
          >
            <sphereGeometry args={[0.16, 20, 20]} />
            <meshStandardMaterial
              color={active === n.id ? "#c9a35a" : "#5aa8a0"}
              emissive={active === n.id ? "#c9a35a" : "#5aa8a0"}
              emissiveIntensity={active === n.id ? 1.1 : 0.45}
            />
          </mesh>
        ))}
        <Pulse positions={pts} />
      </CanvasFrame>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2 font-mono text-[0.68rem] tracking-[0.14em] uppercase text-muted">
        {NODES.map((n) => (
          <span key={n.id} className={active === n.id ? "text-amber" : ""}>
            {n.label}
          </span>
        ))}
      </div>
    </div>
  );
}
