"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { CanvasFrame } from "@/components/CanvasFrame";

function Blocks({
  count,
  highlight,
  originX,
}: {
  count: number;
  highlight: number;
  originX: number;
}) {
  const meshes = useMemo(() => Array.from({ length: 48 }, (_, i) => i), []);
  return (
    <group position={[originX, 0, 0]}>
      {meshes.map((i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const filled = i < count;
        const isNew = i === highlight;
        const color = !filled ? "#1a2220" : isNew ? "#c9a35a" : "#5aa8a0";
        return (
          <mesh key={i} position={[col * 0.22 - 0.77, 0.55 - row * 0.22, 0]}>
            <boxGeometry args={[0.18, 0.18, 0.08]} />
            <meshStandardMaterial
              color={color}
              emissive={filled ? color : "#000000"}
              emissiveIntensity={filled ? (isNew ? 1.1 : 0.35) : 0}
              roughness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Scene() {
  const [prefill, setPrefill] = useState(0);
  const [decode, setDecode] = useState(0);
  const phase = useRef<"prefill" | "decode" | "pause">("prefill");
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    if (phase.current === "prefill") {
      if (t.current > 0.03) {
        t.current = 0;
        setPrefill((n) => {
          if (n >= 32) {
            phase.current = "decode";
            return n;
          }
          return n + 4;
        });
      }
    } else if (phase.current === "decode") {
      if (t.current > 0.28) {
        t.current = 0;
        setDecode((n) => {
          if (n >= 16) {
            phase.current = "pause";
            return n;
          }
          return n + 1;
        });
      }
    } else if (t.current > 1.6) {
      t.current = 0;
      setPrefill(0);
      setDecode(0);
      phase.current = "prefill";
    }
  });

  return (
    <>
      <color attach="background" args={["#07090b"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 4]} intensity={12} color="#7ec4bc" />
      <Blocks count={prefill} highlight={-1} originX={-1.7} />
      <Blocks count={decode} highlight={decode - 1} originX={1.5} />
    </>
  );
}

export default function Visual() {
  return (
    <div className="bg-void">
      <CanvasFrame className="h-[280px] w-full" camera={{ position: [0, 0, 4.2], fov: 42 }}>
        <Scene />
      </CanvasFrame>
      <div className="grid grid-cols-2 border-t border-line font-mono text-[0.7rem] tracking-[0.16em] uppercase text-muted">
        <p className="px-4 py-2">Prefill · KV written in a burst</p>
        <p className="px-4 py-2">Decode · one token, cache grows</p>
      </div>
    </div>
  );
}
