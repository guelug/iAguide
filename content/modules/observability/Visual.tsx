"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "trace" | "spans" | "errors";

export default function Visual() {
  const t = useCopy({
    en: {
      "trace_spans": "trace · spans",
      "one_turn_many_clocks": "one turn, many clocks",
      "trace": "trace",
      "tool_errors": "tool errors",
      "trace_2": "Trace",
      "spans": "Spans",
      "tool_errors_2": "Tool errors"
    },
    es: {
      "trace_spans": "traza · spans",
      "one_turn_many_clocks": "un turno, muchos relojes",
      "trace": "traza",
      "tool_errors": "errores de tool",
      "trace_2": "Traza",
      "spans": "Spans",
      "tool_errors_2": "Errores de tool"
    },
  });
  const [mode, setMode] = useState<Mode>("trace");
  return (
    <Figure
      label={t.trace_spans}
      hint={t.one_turn_many_clocks}
      legend={[
          { color: P.teal, label: t.trace },
          { color: P.amber, label: "spans" },
          { color: P.rose, label: t.tool_errors }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "trace", label: t.trace_2, tone: P.teal },
            { value: "spans", label: t.spans, tone: P.amber },
            { value: "errors", label: t.tool_errors_2, tone: P.rose }
          ]}
          ariaLabel={t.one_turn_many_clocks}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[0, 0.9, 0]} size={[5.2, 0.45, 0.1]} color={P.teal} fill={0.25} />
        <Tag position={[0, 1.35, 0.2]} tone="teal">turn trace</Tag>
        {[
          [-2.0, "prefill", P.teal],
          [-0.4, "decode", P.amber],
          [1.2, "tool", mode === "errors" ? P.rose : P.violet],
          [2.6, "decode", P.amber],
        ].map(([x, lab, col], i) => (
          <group key={i}>
            <Slab position={[x as number, -0.15, 0]} size={[1.3, 0.7, 0.1]} color={col as string} fill={0.28} />
            <Tag position={[x as number, -0.7, 0.2]} tone="muted" size="xs">{lab as string}</Tag>
          </group>
        ))}
        {mode === "errors" ? <Tag position={[1.2, 0.4, 0.2]} tone="rose">40% fail</Tag> : null}
        <Flow points={[[-2.6, 0.9, 0], [2.6, 0.9, 0]]} color={P.teal} count={4} />
    
      </Stage>
    </Figure>
  );
}
