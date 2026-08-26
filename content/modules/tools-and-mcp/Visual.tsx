"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "schema" | "allow" | "mcp";

export default function Visual() {
  const t = useCopy({
    en: {
      "name_schema_your_code": "name · schema · your code",
      "the_model_writes_a_call_you_run_it": "the model writes a call; you run it",
      "schema": "schema"
    },
    es: {
      "name_schema_your_code": "nombre · schema · tu código",
      "the_model_writes_a_call_you_run_it": "el modelo escribe la llamada; tú la ejecutas",
      "schema": "schema"
    },
  });
  const [mode, setMode] = useState<Mode>("schema");
  return (
    <Figure
      label={t.name_schema_your_code}
      hint={t.the_model_writes_a_call_you_run_it}
      legend={[
          { color: P.teal, label: t.schema },
          { color: P.amber, label: "allowlist" },
          { color: P.violet, label: "mcp" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "schema", label: "Schema", tone: P.teal },
            { value: "allow", label: "Allowlist", tone: P.amber },
            { value: "mcp", label: "MCP", tone: P.violet }
          ]}
          ariaLabel={t.the_model_writes_a_call_you_run_it}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.3, 0]} size={[1.9, 1.7, 0.12]} color={P.teal} fill={0.22} />
        <Tag position={[-2.2, 1.3, 0.2]} tone="teal">tool schema</Tag>
        <Node3D position={[-2.2, 0.15, 0.12]} color={P.teal} radius={0.18} />
        <Slab position={[0.15, 0.3, 0]} size={[1.9, 1.7, 0.12]} color={mode === "allow" ? P.amber : P.lineStrong} fill={mode === "allow" ? 0.28 : 0.1} />
        <Tag position={[0.15, 1.3, 0.2]} tone="amber">allowlist</Tag>
        <Slab position={[2.4, 0.3, 0]} size={[1.7, 1.7, 0.12]} color={mode === "mcp" ? P.violet : P.teal} fill={0.18} />
        <Tag position={[2.4, 1.3, 0.2]} tone={mode === "mcp" ? "violet" : "teal"}>{mode === "mcp" ? "MCP server" : "runTool"}</Tag>
        <Flow points={[[-1.2, 0.3, 0], [-0.85, 0.3, 0]]} color={P.teal} count={3} />
        {mode !== "schema" ? <Flow points={[[1.15, 0.3, 0], [1.5, 0.3, 0]]} color={mode === "mcp" ? P.violet : P.amber} count={3} /> : <Wire points={[[1.15, 0.3, 0], [1.5, 0.3, 0]]} dashed />}
    
      </Stage>
    </Figure>
  );
}
