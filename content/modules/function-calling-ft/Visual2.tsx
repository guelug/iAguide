"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* function-calling fine-tune: prompt schemas vs trained tokens vs failure. */
type Mode = "prompt" | "trained" | "failure";

const COPY = {
  en: {
    schema_in_prompt_or_a_learned_call: "schema in prompt or a learned call",
    three_ways_to_get_a_tool_call: "three ways to get a tool call",
    prompt: "in prompt",
    trained: "trained",
    failure: "failure",
    json_blob: "json blob",
    eats_context: "eats context",
    special_token: "special token",
    trained_call: "trained call",
    malformed: "malformed",
    parser_breaks: "parser breaks",
    valid: "valid",
  },
  es: {
    schema_in_prompt_or_a_learned_call: "esquema en el prompt o llamada aprendida",
    three_ways_to_get_a_tool_call: "tres formas de sacar un tool call",
    prompt: "en el prompt",
    trained: "entrenado",
    failure: "fallo",
    json_blob: "json en el prompt",
    eats_context: "come contexto",
    special_token: "token especial",
    trained_call: "llamada entrenada",
    malformed: "malformado",
    parser_breaks: "el parser rompe",
    valid: "válido",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("prompt");

  return (
    <Figure
      label={t.schema_in_prompt_or_a_learned_call}
      hint={t.three_ways_to_get_a_tool_call}
      legend={[
        { color: P.teal, label: t.prompt },
        { color: P.violet, label: t.trained },
        { color: P.rose, label: t.failure },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "prompt", label: t.prompt, tone: P.teal },
            { value: "trained", label: t.trained, tone: P.violet },
            { value: "failure", label: t.failure, tone: P.rose },
          ]}
          ariaLabel={t.schema_in_prompt_or_a_learned_call}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "prompt" && (
          <>
            {/* context window with a giant JSON schema slab taking half */}
            <Slab position={[0, 0.4, 0]} size={[5.4, 2.4, 0.12]} color={P.muted} fill={0.06} rim={0.7} />
            <Tag position={[0, 1.85, 0.15]} tone="muted" size="xs">context</Tag>
            <Slab position={[-1.3, 0.4, 0.1]} size={[2.6, 2.0, 0.1]} color={P.amber} fill={0.24} />
            <Tag position={[-1.3, 1.65, 0.2]} tone="amber" size="xs">{t.json_blob}</Tag>
            <Slab position={[1.4, 0.4, 0.1]} size={[2.4, 2.0, 0.1]} color={P.teal} fill={0.14} />
            <Tag position={[1.4, 1.65, 0.2]} tone="teal" size="xs">system + thread</Tag>
            <Tag position={[0, -0.95, 0.15]} tone="amber" size="xs">{t.eats_context}</Tag>
          </>
        )}

        {mode === "trained" && (
          <>
            <Node3D position={[-2.2, 0.6, 0]} color={P.violet} radius={0.2} pulse={0.2} />
            <Tag position={[-2.2, 1.1, 0.15]} tone="violet" size="xs">model</Tag>
            {/* emits a special token rose */}
            <Flow points={[[-2.0, 0.6, 0], [-0.5, 0.6, 0]]} color={P.violet} count={3} />
            <Halo position={[0.2, 0.6, 0]} radius={0.55} color={P.rose} opacity={0.7} spin={0.3} />
            <Node3D position={[0.2, 0.6, 0]} color={P.rose} radius={0.16} faceted />
            <Tag position={[0.2, 1.25, 0.15]} tone="rose" size="xs">{t.special_token}</Tag>
            <Flow points={[[0.8, 0.6, 0], [2.0, 0.6, 0]]} color={P.teal} count={2} />
            <Slab position={[2.4, 0.6, 0]} size={[1.3, 0.7, 0.12]} color={P.teal} fill={0.22} />
            <Tag position={[2.4, 1.15, 0.15]} tone="teal" size="xs">{t.trained_call}</Tag>
            <Tag position={[0, -0.65, 0.15]} tone="muted" size="xs">{t.valid}</Tag>
          </>
        )}

        {mode === "failure" && (
          <>
            <Node3D position={[-2.2, 0.6, 0]} color={P.violet} radius={0.2} pulse={0.2} />
            <Flow points={[[-2.0, 0.6, 0], [-0.7, 0.6, 0]]} color={P.violet} count={2} size={0.05} />
            {/* malformed json slab */}
            <Slab position={[0.2, 0.6, 0]} size={[1.8, 0.8, 0.12]} color={P.rose} fill={0.24} />
            <Tag position={[0.2, 1.15, 0.15]} tone="rose" size="xs">{t.malformed}</Tag>
            <Tag position={[0.2, 0.6, 0.15]} tone="rose" size="xs">{"{ name: search, args: …"}</Tag>
            <Flow points={[[1.1, 0.6, 0], [2.1, 0.6, 0]]} color={P.rose} count={2} size={0.05} />
            {/* parser breaks */}
            <Node3D position={[2.6, 0.6, 0]} color={P.rose} radius={0.18} pulse={0.5} />
            <Tag position={[2.6, 1.15, 0.15]} tone="rose" size="xs">{t.parser_breaks}</Tag>
            {/* loop aborts */}
            <Ribbon points={[[2.6, 0.2, 0], [1.0, -0.9, 0], [-1.0, -0.9, 0], [-2.2, 0.2, 0]]} color={P.rose} radius={0.02} opacity={0.7} />
            <Tag position={[0, -1.35, 0.15]} tone="rose" size="xs">error</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
