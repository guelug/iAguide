"use client";

import { useMemo, useState } from "react";
import { CanvasFrame } from "@/components/CanvasFrame";

function Grid({ bits, gap }: { bits: number; gap: number }) {
  const cells = useMemo(() => {
    const out: { x: number; y: number; w: number }[] = [];
    const cols = 16;
    const n = bits === 16 ? 32 : 128;
    const w = bits === 16 ? 0.28 : 0.12;
    const h = 0.22;
    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      out.push({
        x: col * (w + gap) - (cols * (w + gap)) / 2 + w / 2,
        y: 0.7 - row * (h + 0.06),
        w,
      });
    }
    return out;
  }, [bits, gap]);

  const color = bits === 16 ? "#5aa8a0" : "#c9a35a";
  return (
    <group>
      {cells.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, 0]}>
          <boxGeometry args={[c.w, 0.2, 0.08]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export default function Visual() {
  const [mode, setMode] = useState<"fp16" | "q4">("fp16");
  return (
    <div className="bg-void">
      <CanvasFrame className="h-[260px] w-full" camera={{ position: [0, 0, 4.4], fov: 40 }}>
        <color attach="background" args={["#07090b"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[1, 2, 4]} intensity={12} color="#7ec4bc" />
        {mode === "fp16" ? <Grid bits={16} gap={0.05} /> : <Grid bits={4} gap={0.03} />}
      </CanvasFrame>
      <div className="flex items-center justify-between border-t border-line px-4 py-2">
        <p className="font-mono text-[0.7rem] tracking-[0.14em] uppercase text-muted">
          Same weights, different packing
        </p>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            className={mode === "fp16" ? "text-teal" : "text-faint"}
            onClick={() => setMode("fp16")}
          >
            FP16
          </button>
          <button
            type="button"
            className={mode === "q4" ? "text-amber" : "text-faint"}
            onClick={() => setMode("q4")}
          >
            Q4 / NF4
          </button>
        </div>
      </div>
    </div>
  );
}
