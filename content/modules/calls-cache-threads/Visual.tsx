"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "hit" | "bust" | "nested";

export default function Visual() {
  const t = useCopy({
    en: {
      "prefix_cache_nested_threads": "prefix cache · nested threads",
      "one_character_busts_the_prefix": "one character busts the prefix",
      "cache_hit": "cache hit",
      "bust": "bust",
      "nested_thread": "nested thread",
      "cache_hit_2": "Cache hit",
      "bust_2": "Bust",
      "nested_thread_2": "Nested thread"
    },
    es: {
      "prefix_cache_nested_threads": "caché de prefijo · hilos anidados",
      "one_character_busts_the_prefix": "un carácter rompe el prefijo",
      "cache_hit": "caché",
      "bust": "rompe",
      "nested_thread": "hilo anidado",
      "cache_hit_2": "Caché",
      "bust_2": "Rompe",
      "nested_thread_2": "Hilo anidado"
    },
  });
  const [mode, setMode] = useState<Mode>("hit");
  return (
    <Figure
      label={t.prefix_cache_nested_threads}
      hint={t.one_character_busts_the_prefix}
      legend={[
          { color: P.teal, label: t.cache_hit },
          { color: P.rose, label: t.bust },
          { color: P.violet, label: t.nested_thread }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "hit", label: t.cache_hit_2, tone: P.teal },
            { value: "bust", label: t.bust_2, tone: P.rose },
            { value: "nested", label: t.nested_thread_2, tone: P.violet }
          ]}
          ariaLabel={t.one_character_busts_the_prefix}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-1.5, 0.7, 0]} size={[4.4, 0.55, 0.1]} color={mode === "bust" ? P.rose : P.teal} fill={0.28} />
        <Tag position={[-1.5, 1.2, 0.2]} tone={mode === "bust" ? "rose" : "teal"}>{mode === "bust" ? "prefix changed" : "stable prefix"}</Tag>
        <Slab position={[2.4, -0.5, 0]} size={[1.6, 1.4, 0.12]} color={P.violet} fill={mode === "nested" ? 0.3 : 0.12} />
        <Tag position={[2.4, 0.4, 0.2]} tone="violet">sub thread</Tag>
        <Slab position={[-1.5, -0.5, 0]} size={[4.4, 0.7, 0.1]} color={P.amber} fill={0.18} />
        <Tag position={[-1.5, -0.5, 0.2]} tone="amber">this turn</Tag>
        {mode === "nested" ? <Flow points={[[0.7, -0.5, 0], [1.55, -0.5, 0]]} color={P.violet} count={3} /> : null}
    
      </Stage>
    </Figure>
  );
}
