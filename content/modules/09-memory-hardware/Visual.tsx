"use client";

import { useMemo, useState } from "react";
import { CanvasFrame } from "@/components/CanvasFrame";

function Stack({
  kind,
  fill,
}: {
  kind: "vram" | "unified" | "pcie";
  fill: number;
}) {
  const colors = {
    vram: "#5aa8a0",
    unified: "#c9a35a",
    pcie: "#8a9086",
  } as const;
  const layers = kind === "vram" ? 1 : kind === "unified" ? 1 : 2;
  const h = 0.7;
  return (
    <group>
      {Array.from({ length: layers }).map((_, i) => (
        <mesh key={i} position={[0, i * 0.85 - 0.2, 0]}>
          <boxGeometry args={[2.6, h, 0.5]} />
          <meshStandardMaterial
            color="#12181a"
            roughness={0.5}
            metalness={0.2}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
      <mesh position={[0, -0.2, 0.05]} scale={[Math.min(1, fill), 1, 1]}>
        <boxGeometry args={[2.4, h * 0.7, 0.36]} />
        <meshStandardMaterial
          color={colors[kind]}
          emissive={colors[kind]}
          emissiveIntensity={0.45}
        />
      </mesh>
    </group>
  );
}

export default function Visual() {
  const [kind, setKind] = useState<"vram" | "unified" | "pcie">("vram");
  const [ctx, setCtx] = useState(8);
  const fill = useMemo(() => {
    const weights = 0.35;
    const kv = (ctx / 128) * (kind === "pcie" ? 0.7 : 0.55);
    return Math.min(0.98, weights + kv);
  }, [ctx, kind]);

  return (
    <div className="bg-void">
      <CanvasFrame className="h-[260px] w-full" camera={{ position: [0, 0.2, 5], fov: 40 }}>
        <color attach="background" args={["#07090b"]} />
        <ambientLight intensity={0.45} />
        <pointLight position={[2, 2, 4]} intensity={14} color="#7ec4bc" />
        <Stack kind={kind} fill={fill} />
      </CanvasFrame>
      <div className="space-y-2 border-t border-line px-4 py-3">
        <div className="flex flex-wrap gap-3 font-mono text-[0.7rem] tracking-[0.14em] uppercase">
          {(["vram", "unified", "pcie"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={kind === k ? "text-amber" : "text-faint"}
            >
              {k === "vram" ? "VRAM (discrete GPU)" : k === "unified" ? "Unified (Apple)" : "RAM + PCIe"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm text-muted">
          <span className="font-mono text-[0.7rem] tracking-wide uppercase">Context {ctx}k</span>
          <input
            type="range"
            min={4}
            max={128}
            step={4}
            value={ctx}
            onChange={(e) => setCtx(Number(e.target.value))}
            className="w-full accent-teal"
          />
        </label>
        <p className="text-xs text-faint">
          Fill is a teaching sketch: weights sit still, KV cache grows with context. Not a benchmark.
        </p>
      </div>
    </div>
  );
}
