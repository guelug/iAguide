"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* prompt-assembly: the order of system/history/user; stable prefix halo; trim. */
type Mode = "order" | "stable" | "trim";

const COPY = {
  en: {
    prompt_is_a_cache_contract: "prompt is a cache contract",
    order_stable_trim: "order · stable prefix · trim",
    order: "order",
    stable: "stable",
    trim: "trim",
    system: "system",
    history: "history",
    user: "user",
    tool_def: "tool def",
    prefix_hits: "prefix hits",
    prefix_miss: "prefix miss",
    trim_low: "trim low-value",
  },
  es: {
    prompt_is_a_cache_contract: "el prompt es un contrato de caché",
    order_stable_trim: "orden · prefijo estable · poda",
    order: "orden",
    stable: "estable",
    trim: "poda",
    system: "sistema",
    history: "historial",
    user: "usuario",
    tool_def: "def tool",
    prefix_hits: "acierto prefijo",
    prefix_miss: "falla prefijo",
    trim_low: "poda lo de poco valor",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("order");

  return (
    <Figure
      label={t.prompt_is_a_cache_contract}
      hint={t.order_stable_trim}
      legend={[
        { color: P.violet, label: t.system },
        { color: P.teal, label: t.history },
        { color: P.amber, label: t.user },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "order", label: t.order, tone: P.violet },
            { value: "stable", label: t.stable, tone: P.teal },
            { value: "trim", label: t.trim, tone: P.rose },
          ]}
          ariaLabel={t.prompt_is_a_cache_contract}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "order" && (
          <>
            {(
              [
                [t.system, P.violet, -2.0, 1.0],
                [t.tool_def, P.amber, 0.1, 0.95],
                [t.history, P.teal, 1.3, 0.7],
                [t.user, P.rose, 2.5, 0.45],
              ] as const
            ).map(([lab, col, x, y], i) => (
              <group key={lab}>
                <Slab position={[x, y, 0]} size={[1.8, 0.4, 0.1]} color={col} fill={0.22 - i * 0.02} />
                <Tag position={[x, y + 0.35, 0.15]} tone={col === P.violet ? "violet" : col === P.amber ? "amber" : col === P.teal ? "teal" : "rose"} size="xs">
                  {lab}
                </Tag>
              </group>
            ))}
            <Ribbon
              points={[[-2.0, 1.4, 0], [-1.0, 0.3, 0], [0.1, 0.85, 0], [1.3, 0.35, 0], [2.5, 0.15, 0]]}
              color={P.lineStrong}
              radius={0.03}
              opacity={0.7}
            />
            <Wire points={[[-2.9, 0.05, 0], [3.4, 0.05, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[3.4, -0.3, 0.15]} tone="muted" size="xs">token position →</Tag>
            <Tag position={[0, -1.0, 0.15]} tone="muted" size="xs">early bytes are stable</Tag>
          </>
        )}

        {mode === "stable" && (
          <>
            {/* prefix halo hits on first part, miss on tail */}
            <Slab position={[-1.8, 0.6, 0]} size={[2.0, 0.55, 0.12]} color={P.teal} fill={0.32} />
            <Halo position={[-1.8, 0.6, 0]} radius={1.15} color={P.teal} opacity={0.4} spin={0.15} />
            <Tag position={[-1.8, 1.45, 0.15]} tone="teal">{t.prefix_hits}</Tag>
            <Slab position={[1.6, 0.6, 0]} size={[1.8, 0.55, 0.12]} color={P.rose} fill={0.32} />
            <Tag position={[1.6, 1.45, 0.15]} tone="rose">{t.prefix_miss}</Tag>
            <Wire points={[[-2.9, 0.05, 0], [3.0, 0.05, 0]]} color={P.lineStrong} opacity={0.5} />
            <Tag position={[0, -0.55, 0.15]} tone="muted" size="xs">1 byte changed → whole-cache miss</Tag>
            {/* a tiny change highlighted on the right */}
            <Node3D position={[2.5, 0.6, 0]} color={P.rose} radius={0.11} pulse={0.6} />
          </>
        )}

        {mode === "trim" && (
          <>
            {/* three sections; the rose one gets cut */}
            {[P.teal, P.violet, P.rose].map((col, i) => (
              <group key={i}>
                <Slab
                  position={[0, 0.7 - i * 0.55, 0]}
                  size={[4.0 - i * 0.4, 0.35, 0.12]}
                  color={col}
                  fill={i === 2 ? 0.3 : 0.18}
                />
                {i === 2 && (
                  <>
                    <Wire points={[[-1.3, -0.4, 0], [1.3, -0.4, 0]]} color={P.rose} width={2.5} opacity={0.9} dashed />
                    <Tag position={[0, -0.85, 0.15]} tone="rose" size="xs">{t.trim_low}</Tag>
                  </>
                )}
              </group>
            ))}
            {/* final answer halo emerges below */}
            <Ribbon points={[[0, -1.05, 0], [0, -1.6, 0]]} color={P.amber} radius={0.04} opacity={0.7} />
            <Halo position={[0, -1.95, 0]} radius={0.55} color={P.amber} opacity={0.6} spin={0.2} />
            <Tag position={[0, -2.3, 0.15]} tone="amber" size="xs">answer</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
