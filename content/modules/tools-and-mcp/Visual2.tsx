"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* A tool, a plugin, an MCP server: three shapes of the same contract. Plus
   the tool_call in detail. */
type Mode = "anatomy" | "perm" | "mcp";

const COPY = {
  en: {
    a_tool_you_execute: "a tool you execute",
    name_schema_code_permissions_mcp: "name, schema, code · permissions · MCP",
    anatomy: "anatomy",
    permissions: "permissions",
    mcp: "mcp",
    name: "name",
    schema: "schema",
    code: "code",
    allow: "allow",
    deny: "deny",
    tool_call: "tool_call",
    tool_result: "tool_result",
    host: "host",
    client: "client",
    server: "server",
    stdio: "stdio",
    http: "http",
  },
  es: {
    a_tool_you_execute: "una tool que ejecutas tú",
    name_schema_code_permissions_mcp: "nombre, esquema, código · permisos · MCP",
    anatomy: "anatomía",
    permissions: "permisos",
    mcp: "mcp",
    name: "nombre",
    schema: "esquema",
    code: "código",
    allow: "permite",
    deny: "niega",
    tool_call: "tool_call",
    tool_result: "tool_result",
    host: "host",
    client: "client",
    server: "server",
    stdio: "stdio",
    http: "http",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("anatomy");

  return (
    <Figure
      label={t.a_tool_you_execute}
      hint={t.name_schema_code_permissions_mcp}
      legend={[
        { color: P.teal, label: t.tool_call },
        { color: P.amber, label: t.tool_result },
        { color: P.rose, label: t.deny },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "anatomy", label: t.anatomy, tone: P.teal },
            { value: "perm", label: t.permissions, tone: P.amber },
            { value: "mcp", label: t.mcp, tone: P.violet },
          ]}
          ariaLabel={t.a_tool_you_execute}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "anatomy" && (
          <>
            {/* three slabs wired into one tool */}
            <Slab position={[-2.3, 0.9, 0]} size={[1.5, 0.55, 0.12]} color={P.teal} fill={0.24} />
            <Tag position={[-2.3, 1.35, 0.15]} tone="teal" size="xs">{t.name}</Tag>
            <Slab position={[-2.3, 0.1, 0]} size={[1.5, 0.55, 0.12]} color={P.violet} fill={0.24} />
            <Tag position={[-2.3, 0.55, 0.15]} tone="violet" size="xs">{t.schema} · json</Tag>
            <Slab position={[-2.3, -0.7, 0]} size={[1.5, 0.55, 0.12]} color={P.amber} fill={0.24} />
            <Tag position={[-2.3, -0.25, 0.15]} tone="amber" size="xs">{t.code}</Tag>
            {/* they converge on the tool node */}
            {[0.9, 0.1, -0.7].map((y, i) => (
              <Wire key={i} points={[[-1.55, y, 0], [0.0, 0.1, 0]]} color={P.lineStrong} opacity={0.5} />
            ))}
            <Node3D position={[0.5, 0.1, 0]} color={P.teal} radius={0.22} pulse={0.3} />
            <Tag position={[0.5, 0.7, 0.15]} tone="teal">search(query)</Tag>
            {/* the model only sees name+schema */}
            <Slab position={[2.5, 0.65, 0]} size={[1.5, 0.9, 0.1]} color={P.muted} fill={0.12} />
            <Tag position={[2.5, 1.25, 0.15]} tone="muted" size="xs">model sees: {t.name}+{t.schema}</Tag>
            <Wire points={[[0.85, 0.35, 0], [1.7, 0.55, 0]]} color={P.lineStrong} dashed opacity={0.5} />
          </>
        )}

        {mode === "perm" && (
          <>
            <Node3D position={[-2.6, 0.5, 0]} color={P.violet} radius={0.16} pulse={0.3} />
            <Tag position={[-2.6, 1.0, 0.15]} tone="violet" size="xs">{t.tool_call}</Tag>
            {/* allow ring vs deny ring */}
            <Flow points={[[-2.4, 0.6, 0], [-0.6, 0.95, 0]]} color={P.teal} count={2} size={0.05} />
            <Flow points={[[-2.4, 0.35, 0], [-0.6, -0.35, 0]]} color={P.rose} count={2} size={0.05} />
            <Halo position={[0, 1.0, 0]} radius={0.55} color={P.teal} opacity={0.7} spin={0.25} />
            <Tag position={[0, 1.7, 0.15]} tone="teal" size="xs">{t.allow}</Tag>
            <Slab position={[1.7, 1.0, 0]} size={[1.6, 0.55, 0.12]} color={P.amber} fill={0.22} />
            <Tag position={[1.7, 1.45, 0.15]} tone="amber" size="xs">{t.tool_result}</Tag>
            <Flow points={[[0.55, 1.0, 0], [0.9, 1.0, 0]]} color={P.teal} count={2} />
            <Halo position={[0, -0.4, 0]} radius={0.55} color={P.rose} opacity={0.7} spin={-0.2} />
            <Tag position={[0, -1.05, 0.15]} tone="rose" size="xs">{t.deny}</Tag>
            <Wire points={[[0.55, -0.4, 0], [1.7, -0.4, 0]]} color={P.rose} dashed opacity={0.8} />
            <Tag position={[1.7, -0.85, 0.15]} tone="rose" size="xs">error: permission</Tag>
          </>
        )}

        {mode === "mcp" && (
          <>
            {/* host / client / server */}
            <Slab position={[-2.4, 0.5, 0]} size={[1.6, 1.1, 0.14]} color={P.teal} fill={0.2} />
            <Tag position={[-2.4, 1.25, 0.15]} tone="teal">{t.host}</Tag>
            <Slab position={[0, 0.5, 0]} size={[1.4, 0.9, 0.12]} color={P.violet} fill={0.22} />
            <Tag position={[0, 1.15, 0.15]} tone="violet">{t.client}</Tag>
            <Slab position={[2.4, 0.5, 0]} size={[1.6, 1.1, 0.14]} color={P.amber} fill={0.2} />
            <Tag position={[2.4, 1.25, 0.15]} tone="amber">{t.server}</Tag>
            <Flow points={[[-1.6, 0.5, 0], [-0.7, 0.5, 0]]} color={P.teal} count={2} size={0.05} />
            <Flow points={[[0.7, 0.5, 0], [1.6, 0.5, 0]]} color={P.amber} count={2} size={0.05} />
            <Tag position={[-1.15, -0.05, 0.15]} tone="muted" size="xs">{t.stdio}</Tag>
            <Tag position={[1.15, -0.05, 0.15]} tone="muted" size="xs">{t.stdio} / {t.http}</Tag>
            {/* tools registered on the server */}
            {[0, 1, 2].map((i) => (
              <Node3D key={i} position={[2.15 + i * 0.25, 0.3 + i * 0.2, 0.15]} color={P.amber} radius={0.07} matte />
            ))}
            <Tag position={[2.4, -0.35, 0.15]} tone="muted" size="xs">tools · resources · prompts</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
