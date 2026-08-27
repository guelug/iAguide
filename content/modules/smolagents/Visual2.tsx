"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* smolagents: CodeAgent writes Python; ToolCallingAgent writes JSON. Both
   ride the same MultiStepAgent loop. */
type Mode = "code" | "json" | "steps";

const COPY = {
  en: {
    two_dialects_one_loop: "two dialects, one loop",
    codeagent_writes_python_toolcallingagent_writes_json: "CodeAgent writes python; ToolCallingAgent writes JSON",
    code: "code agent",
    json: "tool calling",
    steps: "action steps",
    python_block: "python block",
    json_call: "json call",
    runs: "runs",
    parses: "parses",
    same_loop: "same loop",
    allowlist: "allowlist",
    step: "step",
  },
  es: {
    two_dialects_one_loop: "dos dialectos, un bucle",
    codeagent_writes_python_toolcallingagent_writes_json: "CodeAgent escribe python; ToolCallingAgent escribe JSON",
    code: "code agent",
    json: "tool calling",
    steps: "action steps",
    python_block: "bloque python",
    json_call: "llamada json",
    runs: "ejecuta",
    parses: "parsea",
    same_loop: "mismo bucle",
    allowlist: "allowlist",
    step: "paso",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("code");

  const stepCells = Array.from({ length: 4 }, (_, i) => ({
    position: [-2.0 + i * 1.3, 0.6, 0] as [number, number, number],
    color: i < 3 ? P.teal : P.violet,
  }));

  return (
    <Figure
      label={t.two_dialects_one_loop}
      hint={t.codeagent_writes_python_toolcallingagent_writes_json}
      legend={[
        { color: P.teal, label: t.code },
        { color: P.amber, label: t.json },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "code", label: t.code, tone: P.teal },
            { value: "json", label: t.json, tone: P.amber },
            { value: "steps", label: t.steps, tone: P.violet },
          ]}
          ariaLabel={t.two_dialects_one_loop}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "code" && (
          <>
            <Node3D position={[-2.5, 0.6, 0]} color={P.violet} radius={0.18} pulse={0.2} />
            <Tag position={[-2.5, 1.05, 0.15]} tone="violet" size="xs">model</Tag>
            <Flow points={[[-2.3, 0.6, 0], [-0.9, 0.6, 0]]} color={P.violet} count={2} size={0.05} />
            {/* a python block */}
            <Slab position={[0.2, 0.6, 0]} size={[2.1, 1.1, 0.12]} color={P.teal} fill={0.16} />
            <Tag position={[0.2, 1.4, 0.15]} tone="teal">{t.python_block}</Tag>
            <Tag position={[0.2, 0.6, 0.15]} tone="teal" size="xs">{"result = search(q)\nprint(result[:200])"}</Tag>
            <Flow points={[[1.25, 0.6, 0], [2.4, 0.6, 0]]} color={P.teal} count={2} />
            {/* interpreter with an allowlist halo */}
            <Halo position={[2.7, 0.6, 0]} radius={0.55} color={P.amber} opacity={0.55} spin={0.2} />
            <Node3D position={[2.7, 0.6, 0]} color={P.amber} radius={0.15} />
            <Tag position={[2.7, 1.25, 0.15]} tone="amber" size="xs">{t.runs}</Tag>
            <Tag position={[2.7, -0.1, 0.15]} tone="muted" size="xs">{t.allowlist}</Tag>
          </>
        )}

        {mode === "json" && (
          <>
            <Node3D position={[-2.5, 0.6, 0]} color={P.violet} radius={0.18} pulse={0.2} />
            <Tag position={[-2.5, 1.05, 0.15]} tone="violet" size="xs">model</Tag>
            <Flow points={[[-2.3, 0.6, 0], [-0.9, 0.6, 0]]} color={P.violet} count={2} size={0.05} />
            {/* a JSON call */}
            <Slab position={[0.2, 0.6, 0]} size={[2.1, 1.1, 0.12]} color={P.amber} fill={0.16} />
            <Tag position={[0.2, 1.4, 0.15]} tone="amber">{t.json_call}</Tag>
            <Tag position={[0.2, 0.6, 0.15]} tone="amber" size="xs">{'{ "name": "search",\n  "arguments": {…} }'}</Tag>
            <Flow points={[[1.25, 0.6, 0], [2.4, 0.6, 0]]} color={P.amber} count={2} />
            {/* harness parses + dispatches */}
            <Node3D position={[2.7, 0.6, 0]} color={P.teal} radius={0.15} pulse={0.4} />
            <Tag position={[2.7, 1.15, 0.15]} tone="teal" size="xs">{t.parses}</Tag>
            <Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.same_loop}</Tag>
          </>
        )}

        {mode === "steps" && (
          <>
            {/* ActionStep log stack */}
            {stepCells.map((c, i) => (
              <group key={i}>
                <Slab
                  position={[c.position[0], c.position[1], 0]}
                  size={[1.1, 1.1, 0.14]}
                  color={c.color}
                  fill={0.18}
                />
                <Tag position={[c.position[0], c.position[1] + 0.7, 0.15]} tone="muted" size="xs">
                  {t.step} {i + 1}
                </Tag>
                <Tag position={[c.position[0], c.position[1], 0.15]} tone={c.color === P.teal ? "teal" : "violet"} size="xs">
                  {i === 3 ? "final" : "action"}
                </Tag>
              </group>
            ))}
            <Flow points={[[-1.4, 0.6, 0], [-0.95, 0.6, 0]]} color={P.teal} count={1} size={0.05} />
            <Flow points={[[-0.1, 0.6, 0], [0.35, 0.6, 0]]} color={P.teal} count={1} size={0.05} />
            <Flow points={[[1.2, 0.6, 0], [1.65, 0.6, 0]]} color={P.violet} count={1} size={0.05} />
            <Tag position={[0, -0.55, 0.15]} tone="muted" size="xs">ActionStep · log</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
