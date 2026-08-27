"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* Skills in Hermes: SKILL.md anatomy, discovery through skills_list/skill_view,
   the trigger moment when a prompt lights one skill. */
type Mode = "anatomy" | "discovery" | "trigger";

const COPY = {
  en: {
    when_instructions_are_enough: "when instructions are enough",
    an_md_a_search_a_match: "an .md, a search, a match",
    anatomy: "anatomy",
    discovery: "discovery",
    trigger: "trigger",
    frontmatter: "frontmatter",
    body: "body",
    scripts: "scripts/",
    refs: "references/",
    skills_list: "skills_list",
    skill_view: "skill_view",
    orbit: "orbit",
    prompt_in: "prompt in",
    lights_one: "lights one",
    others_stay_dark: "others stay dark",
  },
  es: {
    when_instructions_are_enough: "cuando bastan instrucciones",
    an_md_a_search_a_match: "un .md, una búsqueda, un match",
    anatomy: "anatomía",
    discovery: "descubrimiento",
    trigger: "gatillo",
    frontmatter: "frontmatter",
    body: "cuerpo",
    scripts: "scripts/",
    refs: "references/",
    skills_list: "skills_list",
    skill_view: "skill_view",
    orbit: "órbita",
    prompt_in: "prompt entra",
    lights_one: "enciende una",
    others_stay_dark: "las demás se apagan",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("anatomy");

  return (
    <Figure
      label={t.when_instructions_are_enough}
      hint={t.an_md_a_search_a_match}
      legend={[
        { color: P.teal, label: "skill" },
        { color: P.amber, label: t.trigger },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "anatomy", label: t.anatomy, tone: P.teal },
            { value: "discovery", label: t.discovery, tone: P.violet },
            { value: "trigger", label: t.trigger, tone: P.amber },
          ]}
          ariaLabel={t.when_instructions_are_enough}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "anatomy" && (
          <>
            {/* SKILL.md exploded into sections */}
            <Slab position={[-2.0, 0.9, 0]} size={[1.9, 0.5, 0.1]} color={P.violet} fill={0.26} />
            <Tag position={[-2.0, 1.3, 0.15]} tone="violet" size="xs">{t.frontmatter}</Tag>
            <Slab position={[-2.0, 0.1, 0]} size={[1.9, 1.0, 0.1]} color={P.teal} fill={0.18} />
            <Tag position={[-2.0, 0.1, 0.15]} tone="teal" size="xs">{t.body}</Tag>
            <Slab position={[0.6, 0.65, 0]} size={[1.5, 0.55, 0.1]} color={P.amber} fill={0.2} />
            <Tag position={[0.6, 1.1, 0.15]} tone="amber" size="xs">{t.scripts}</Tag>
            <Slab position={[0.6, -0.15, 0]} size={[1.5, 0.55, 0.1]} color={P.amber} fill={0.2} />
            <Tag position={[0.6, -0.6, 0.15]} tone="amber" size="xs">{t.refs}</Tag>
            <Wire points={[[-1.0, 0.7, 0], [-0.2, 0.5, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            <Wire points={[[-1.0, 0.0, 0], [-0.2, -0.05, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            <Tag position={[2.5, 0.2, 0.15]} tone="muted" size="xs">yaml + md</Tag>
          </>
        )}

        {mode === "discovery" && (
          <>
            {/* agent in the middle searching */}
            <Halo position={[0, 0.4, 0]} radius={0.55} color={P.violet} opacity={0.55} spin={0.2} />
            <Node3D position={[0, 0.4, 0]} color={P.violet} radius={0.18} pulse={0.3} />
            <Tag position={[0, 1.05, 0.15]} tone="violet">{t.skills_list}</Tag>
            {/* orbiting skills */}
            {Array.from({ length: 7 }, (_, i) => {
              const a = (i / 7) * Math.PI * 2;
              return (
                <group key={i}>
                  <Node3D
                    position={[Math.cos(a) * 2.3, 0.4 + Math.sin(a) * 1.3, 0]}
                    color={i === 2 ? P.teal : P.muted}
                    radius={0.11}
                    matte
                  />
                  {i === 2 && (
                    <Tag position={[Math.cos(a) * 2.3, 0.4 + Math.sin(a) * 1.3 + 0.35, 0.15]} tone="teal" size="xs">
                      {t.skill_view}
                    </Tag>
                  )}
                </group>
              );
            })}
            <Flow points={[[0.5, 0.4, 0], [1.5, -0.55, 0]]} color={P.teal} count={2} size={0.045} />
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">{t.orbit}</Tag>
          </>
        )}

        {mode === "trigger" && (
          <>
            {/* prompt text lands */}
            <Slab position={[-2.4, 0.5, 0]} size={[1.9, 0.8, 0.12]} color={P.teal} fill={0.2} />
            <Tag position={[-2.4, 1.1, 0.15]} tone="teal" size="xs">{t.prompt_in}</Tag>
            {/* it travels across a skill grid — one lights */}
            <Flow points={[[-1.4, 0.5, 0], [-0.2, 0.5, 0]]} color={P.teal} count={3} />
            {Array.from({ length: 6 }, (_, i) => {
              const x = 0.4 + (i % 3) * 1.05;
              const y = 0.85 - Math.floor(i / 3) * 0.85;
              const lit = i === 4;
              return (
                <group key={i}>
                  <Slab
                    position={[x, y, 0]}
                    size={[0.85, 0.6, 0.1]}
                    color={lit ? P.amber : P.muted}
                    fill={lit ? 0.38 : 0.08}
                  />
                  {lit && <Halo position={[x, y, 0]} radius={0.55} color={P.amber} opacity={0.6} spin={0.3} />}
                </group>
              );
            })}
            <Tag position={[2.05, -0.85, 0.15]} tone="amber" size="xs">{t.lights_one}</Tag>
            <Tag position={[0.4, -1.05, 0.15]} tone="muted" size="xs">{t.others_stay_dark}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
