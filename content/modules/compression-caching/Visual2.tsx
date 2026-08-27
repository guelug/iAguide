"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* compression-caching: a long thread shrinks into a summary, prefix halo stable,
   LRU evictions slide out. */
type Mode = "compact" | "prefix" | "evict";

const COPY = {
  en: {
    keep_only_what_earns_its_token: "keep only what earns its token",
    compact_prefix_evict: "compact · prefix · evict",
    compact: "compact",
    prefix: "prefix",
    evict: "evict",
    thread: "thread",
    summary: "summary",
    stable_prefix: "stable prefix",
    lru: "lru",
    hit: "hit",
    miss: "miss",
  },
  es: {
    keep_only_what_earns_its_token: "quedarte solo lo que se gana el token",
    compact_prefix_evict: "compacta · prefijo · expulsa",
    compact: "compacta",
    prefix: "prefijo",
    evict: "expulsa",
    thread: "hilo",
    summary: "resumen",
    stable_prefix: "prefijo estable",
    lru: "lru",
    hit: "acierto",
    miss: "fallo",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("compact");

  return (
    <Figure
      label={t.keep_only_what_earns_its_token}
      hint={t.compact_prefix_evict}
      legend={[
        { color: P.teal, label: t.thread },
        { color: P.violet, label: t.summary },
        { color: P.rose, label: t.lru },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "compact", label: t.compact, tone: P.teal },
            { value: "prefix", label: t.prefix, tone: P.violet },
            { value: "evict", label: t.evict, tone: P.rose },
          ]}
          ariaLabel={t.keep_only_what_earns_its_token}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "compact" && (
          <>
            {/* long thread of message slabs condensed into one small summary */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Slab
                key={i}
                position={[-2.5 + i * 0.85, 0.9 - (i % 2) * 0.2, 0]}
                size={[0.75, 0.55, 0.1]}
                color={P.teal}
                fill={0.16 + i * 0.02}
              />
            ))}
            <Tag position={[0, 1.8, 0.15]} tone="teal">{t.thread}</Tag>
            <Flow points={[[-0.5, 0.7, 0], [0.5, -0.15, 0]]} color={P.violet} count={3} size={0.05} />
            {/* the result summary */}
            <Slab position={[1.3, -0.4, 0]} size={[1.4, 0.85, 0.14]} color={P.violet} fill={0.3} rim={0.8} />
            <Tag position={[1.3, 0.65, 0.15]} tone="violet">{t.summary}</Tag>
            <Ribbon points={[[-1.8, 0.7, 0], [-1.0, 0.2, 0], [1.3, -0.05, 0]]} color={P.rose} radius={0.03} opacity={0.7} />
            <Tag position={[0, -1.0, 0.15]} tone="muted" size="xs">10k → 200 tokens</Tag>
          </>
        )}

        {mode === "prefix" && (
          <>
            <Halo position={[0, 0.5, 0]} radius={1.3} color={P.teal} opacity={0.4} spin={0.1} />
            {/* stable prefix slab */}
            <Slab position={[0, 0.5, 0]} size={[3.6, 1.0, 0.14]} color={P.teal} fill={0.22} />
            <Tag position={[0, 1.45, 0.15]} tone="teal">{t.stable_prefix}</Tag>
            {/* identical request hits */}
            <Ribbon points={[[-2.7, 0.5, 0], [-1.8, 0.5, 0]]} color={P.amber} radius={0.04} opacity={0.85} />
            <Slab position={[-2.7, 0.5, 0]} size={[1.2, 0.5, 0.1]} color={P.amber} fill={0.28} />
            <Tag position={[-2.7, 1.05, 0.15]} tone="amber" size="xs">{t.hit}</Tag>
            <Wire points={[[-2.9, -0.25, 0], [2.9, -0.25, 0]]} color={P.lineStrong} opacity={0.5} />
            {/* a second request lands on the same bytes */}
            <Ribbon points={[[2.7, 0.5, 0], [1.8, 0.5, 0]]} color={P.amber} radius={0.04} opacity={0.85} />
            <Slab position={[2.7, 0.5, 0]} size={[1.2, 0.5, 0.1]} color={P.amber} fill={0.28} />
            <Tag position={[2.7, 1.05, 0.15]} tone="amber" size="xs">{t.hit}</Tag>
          </>
        )}

        {mode === "evict" && (
          <>
            {/* three cache entries; the oldest slides out */}
            {[P.teal, P.violet, P.rose].map((col, i) => (
              <group key={i}>
                <Slab
                  position={[-1.4 + i * 1.4, 0.4, 0]}
                  size={[1.2, 1.0, 0.14]}
                  color={col}
                  fill={0.24 - i * 0.04}
                />
                <Tag position={[-1.4 + i * 1.4, 1.05, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "rose"} size="xs">
                  e{i + 1}
                </Tag>
              </group>
            ))}
            {/* eviction arrow for the oldest one */}
            <Ribbon points={[[1.0, 0.4, 0], [2.4, -0.4, 0]]} color={P.rose} radius={0.04} opacity={0.85} />
            <Tag position={[2.5, -0.85, 0.15]} tone="rose">{t.lru}</Tag>
            <Tag position={[0, -0.85, 0.15]} tone="muted" size="xs">capacity · LRU</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
