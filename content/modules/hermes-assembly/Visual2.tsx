"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* hermes-assembly: nested system prompt, three token meters, prefix-break halo. */
type Mode = "nest" | "meters" | "prefix";

const COPY = {
  en: {
    the_system_prompt_is_a_sandwich: "the system prompt is a sandwich",
    identity_skills_memory_tools: "identity · skills · memory · tools",
    nest: "nested",
    meters: "meters",
    prefix: "prefix",
    identity: "identity",
    skills: "skills",
    memory: "memory",
    tools: "tools",
    prompt_tokens: "prompt",
    response: "response",
    cache: "cache",
    stable: "stable",
    breaks: "breaks",
  },
  es: {
    the_system_prompt_is_a_sandwich: "el system prompt es un bocadillo",
    identity_skills_memory_tools: "identidad · skills · memoria · tools",
    nest: "anidado",
    meters: "medidores",
    prefix: "prefijo",
    identity: "identidad",
    skills: "skills",
    memory: "memoria",
    tools: "tools",
    prompt_tokens: "prompt",
    response: "respuesta",
    cache: "caché",
    stable: "estable",
    breaks: "rompe",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("nest");

  return (
    <Figure
      label={t.the_system_prompt_is_a_sandwich}
      hint={t.identity_skills_memory_tools}
      legend={[
        { color: P.violet, label: t.identity },
        { color: P.teal, label: t.skills },
        { color: P.amber, label: t.memory },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "nest", label: t.nest, tone: P.violet },
            { value: "meters", label: t.meters, tone: P.teal },
            { value: "prefix", label: t.prefix, tone: P.rose },
          ]}
          ariaLabel={t.the_system_prompt_is_a_sandwich}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "nest" && (
          <>
            {/* nested slabs: identity outer, then skills, memory, tools */}
            <Slab position={[0, 0.3, -0.05]} size={[5.0, 2.3, 0.1]} color={P.violet} fill={0.05} rim={0.7} />
            <Tag position={[0, 1.65, 0.15]} tone="violet" size="xs">{t.identity}</Tag>
            <Slab position={[0, 0.3, 0.05]} size={[4.4, 1.8, 0.1]} color={P.teal} fill={0.08} rim={0.6} />
            <Tag position={[0, 1.3, 0.15]} tone="teal" size="xs">{t.skills}</Tag>
            <Slab position={[0, 0.3, 0.15]} size={[3.8, 1.3, 0.1]} color={P.amber} fill={0.11} rim={0.5} />
            <Tag position={[0, 0.95, 0.15]} tone="amber" size="xs">{t.memory}</Tag>
            <Slab position={[0, 0.3, 0.25]} size={[3.2, 0.9, 0.1]} color={P.rose} fill={0.14} rim={0.4} />
            <Tag position={[0, 0.65, 0.15]} tone="rose" size="xs">{t.tools}</Tag>
            <Tag position={[0, -1.05, 0.15]} tone="muted" size="xs">system → messages</Tag>
          </>
        )}

        {mode === "meters" && (
          <>
            {(
              [
                [t.prompt_tokens, 65, P.teal, -2.0],
                [t.response, 20, P.violet, 0],
                [t.cache, 15, P.amber, 2.0],
              ] as const
            ).map(([lab, pct, col, x]) => (
              <group key={lab}>
                <Slab position={[x, -0.4 + (pct as number) / 100, 0]} size={[1.5, (pct as number) / 50, 0.12]} color={col} fill={0.28} />
                <Tag position={[x, -0.4 + (pct as number) / 50 + 0.2, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "amber"} size="xs">
                  {lab}
                </Tag>
                <Wire points={[[x - 0.9, -0.4, 0], [x - 0.9, 1.6, 0]]} color={P.lineStrong} opacity={0.5} />
              </group>
            ))}
            <Wire points={[[-3.0, -0.4, 0], [3.0, -0.4, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">tokens</Tag>
          </>
        )}

        {mode === "prefix" && (
          <>
            {/* the prefix slab: stable teal, breaks rose */}
            <Slab position={[-1.4, 0.5, 0]} size={[2.6, 0.55, 0.12]} color={P.teal} fill={0.26} />
            <Tag position={[-1.4, 0.95, 0.15]} tone="teal" size="xs">{t.stable}</Tag>
            <Slab position={[1.4, 0.5, 0]} size={[2.6, 0.55, 0.12]} color={P.rose} fill={0.3} />
            <Tag position={[1.4, 0.95, 0.15]} tone="rose" size="xs">{t.breaks}</Tag>
            {/* the ribbon that hits the wrong byte */}
            <Ribbon points={[[-2.7, 0.5, 0], [-0.3, 0.5, 0]]} color={P.teal} radius={0.04} opacity={0.6} />
            <Ribbon points={[[0.2, 0.5, 0], [2.7, 0.5, 0]]} color={P.rose} radius={0.04} opacity={0.85} />
            {/* a tiny change in the middle breaks everything after */}
            <Halo position={[0.35, 0.5, 0]} radius={0.5} color={P.rose} opacity={0.7} spin={0.3} />
            <Tag position={[0, -0.4, 0.15]} tone="muted" size="xs">1 byte changed → whole-cache miss</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
