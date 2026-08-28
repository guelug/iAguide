"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Arrow,
  Flow,
  Halo,
  Marker,
  Node3D,
  Panel,
  PointerTilt,
  ShadowBlob,
  Tag,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "schema" | "allow" | "mcp";

const COPY = {
  en: {
    title: "name · schema · your code",
    hint: "the model writes a call; your process runs it",
    schema: "Schema",
    allow: "Allowlist",
    mcp: "MCP",
    legendSchema: "shape check",
    legendAllow: "permission",
    legendMcp: "transport",
    model: "model",
    harness: "harness",
    world: "your machine",
    call: "tool_call",
    ok: "valid",
    bad: "wrong type",
    blocked: "denied",
    allowed: "allowed",
    server: "server",
    schemaNote: "the schema is the contract: bad shapes are rejected before any code runs",
    allowNote: "a tool the model may request is not a tool the harness will execute",
    mcpNote: "MCP standardises the wire between harness and tool server — not the tool itself",
    fields: ["path", "depth", "glob"],
  },
  es: {
    title: "nombre · esquema · tu código",
    hint: "el modelo escribe la llamada; tu proceso la ejecuta",
    schema: "Esquema",
    allow: "Permisos",
    mcp: "MCP",
    legendSchema: "forma",
    legendAllow: "permiso",
    legendMcp: "transporte",
    model: "modelo",
    harness: "arnés",
    world: "tu máquina",
    call: "tool_call",
    ok: "válido",
    bad: "tipo erróneo",
    blocked: "denegado",
    allowed: "permitido",
    server: "servidor",
    schemaNote: "el esquema es el contrato: las formas malas se rechazan antes de ejecutar nada",
    allowNote: "una herramienta que el modelo puede pedir no es una que el arnés vaya a ejecutar",
    mcpNote: "MCP estandariza el cable entre arnés y servidor de herramientas, no la herramienta",
    fields: ["ruta", "profundidad", "glob"],
  },
};

/**
 * Flips a boolean on a fixed period. Lives inside the Canvas because
 * useFrame needs the R3F store, and drives the "watch it get rejected"
 * beat that makes the schema rule concrete.
 */
function Alternator({ period, onChange }: { period: number; onChange: (v: boolean) => void }) {
  const last = useRef(false);
  useFrame(({ clock }) => {
    const next = Math.floor(clock.elapsedTime / period) % 2 === 1;
    if (next !== last.current) {
      last.current = next;
      onChange(next);
    }
  });
  return null;
}

/** A tool_call as an object with three typed slots. */
function CallChip({ bad, color }: { bad: boolean; color: string }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.22;
  });
  return (
    <group ref={ref}>
      <RoundedBox args={[0.72, 0.5, 0.14]} radius={0.05} smoothness={3}>
        <meshStandardMaterial color={P.surface} roughness={0.5} />
      </RoundedBox>
      {[0.14, 0, -0.14].map((y, i) => (
        <mesh key={y} position={[0, y, 0.09]}>
          <boxGeometry args={[0.5, 0.075, 0.02]} />
          <meshStandardMaterial color={bad && i === 1 ? P.rose : color} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

/** The gate the harness closes. Open = the call gets through. */
function Gate({ open, color }: { open: boolean; color: string }) {
  const top = useRef<Group>(null);
  const bottom = useRef<Group>(null);
  useFrame((_, dt) => {
    if (top.current) top.current.position.y = MathUtils.damp(top.current.position.y, open ? 0.52 : 0.16, 6, dt);
    if (bottom.current) bottom.current.position.y = MathUtils.damp(bottom.current.position.y, open ? -0.52 : -0.16, 6, dt);
  });
  return (
    <group>
      <group ref={top} position={[0, 0.52, 0]}>
        <RoundedBox args={[0.9, 0.24, 0.16]} radius={0.05} smoothness={3}>
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.08} />
        </RoundedBox>
      </group>
      <group ref={bottom} position={[0, -0.52, 0]}>
        <RoundedBox args={[0.9, 0.24, 0.16]} radius={0.05} smoothness={3}>
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.08} />
        </RoundedBox>
      </group>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("schema");
  const accent = mode === "allow" ? P.amber : mode === "mcp" ? P.violet : P.teal;
  const note = mode === "allow" ? t.allowNote : mode === "mcp" ? t.mcpNote : t.schemaNote;
  const [bad, setBad] = useState(false);
  const denied = mode === "allow" && bad;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendSchema },
        { color: P.amber, label: t.legendAllow },
        { color: P.violet, label: t.legendMcp },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "schema", label: t.schema, tone: P.teal },
            { value: "allow", label: t.allow, tone: P.amber },
            { value: "mcp", label: t.mcp, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      height="h-[360px] md:h-[450px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 1.1, 7.2], fov: 40 }} background={P.paper} fit={1.12}>
        <Alternator period={2.6} onChange={setBad} />
        <PointerTilt amount={0.08}>
          <group rotation={[-0.16, 0.34, 0]}>
            <ShadowBlob position={[0, -1.5, 0]} scale={8} opacity={0.05} />

            {/* Three planes in depth: who decides what, and in what order. */}
            <Panel position={[-2.5, 0.35, -0.9]} size={[1.7, 1.15]} color={P.teal} title={t.model} fill={0.08} active={mode === "schema"} />
            <Panel position={[0, 0.35, 0]} size={[1.9, 1.5]} color={accent} title={t.harness} fill={0.1} active />
            <Panel position={[2.6, 0.35, 0.9]} size={[1.7, 1.15]} color={P.inkSoft} title={t.world} fill={0.06} active={mode === "mcp"} />

            <Marker position={[-2.5, 1.12, -0.85]} n={1} color={P.teal} />
            <Marker position={[0, 1.28, 0.05]} n={2} color={accent} />
            <Marker position={[2.6, 1.12, 0.95]} n={3} color={P.inkSoft} />

            {/* The call in flight. */}
            <group position={[-1.28, 0.3, -0.45]}>
              <CallChip bad={mode === "schema" && bad} color={P.teal} />
              <Tag position={[0, 0.45, 0.12]} tone="teal" size="xs" center>
                {t.call}
              </Tag>
              {mode === "schema" ? (
                <>
                  {t.fields.map((f, i) => (
                    <Tag key={f} position={[0.62, 0.14 - i * 0.14, 0.1]} tone={bad && i === 1 ? "rose" : "muted"} size="xs">
                      {f}
                    </Tag>
                  ))}
                  <Tag position={[0, -0.46, 0.12]} tone={bad ? "rose" : "teal"} size="xs" center>
                    {bad ? t.bad : t.ok}
                  </Tag>
                </>
              ) : null}
            </group>

            <Arrow from={[-1.6, 0.35, -0.6]} to={[-1.02, 0.35, -0.2]} color={P.teal} width={1.6} head={0.1} />

            {mode === "allow" ? (
              <group position={[0, 0.3, 0.62]}>
                <Gate open={!denied} color={denied ? P.rose : P.amber} />
                <Tag position={[0, -0.95, 0]} tone={denied ? "rose" : "amber"} size="xs" center>
                  {denied ? t.blocked : t.allowed}
                </Tag>
              </group>
            ) : null}

            {/* Harness → world, only when the gate lets it through. */}
            {!denied ? (
              <Flow
                points={[
                  [0.95, 0.3, 0.16],
                  [1.7, 0.24, 0.55],
                  [2.1, 0.3, 0.82],
                ]}
                color={accent}
                count={2}
                speed={0.4}
                size={0.05}
                lineOpacity={0.45}
              />
            ) : (
              <group position={[1.5, 0.3, 0.45]}>
                <Node3D position={[0, 0, 0]} color={P.rose} radius={0.11} matte />
                <Halo radius={0.24} color={P.rose} opacity={0.8} rotation={[0, 0.4, 0]} />
              </group>
            )}

            {/* MCP: one wire format, many servers behind it. */}
            {mode === "mcp" ? (
              <group position={[2.6, -0.95, 0.9]}>
                {[-0.85, 0, 0.85].map((x, i) => (
                  <group key={x} position={[x, 0, 0]}>
                    <RoundedBox args={[0.62, 0.34, 0.2]} radius={0.06} smoothness={3}>
                      <meshStandardMaterial
                        color={i === 1 ? P.violet : P.violetWash}
                        roughness={0.45}
                      />
                    </RoundedBox>
                    <Tag position={[0, -0.35, 0.12]} tone="violet" size="xs" center>
                      {t.server} {i + 1}
                    </Tag>
                    <Arrow
                      from={[0, 0.9, 0]}
                      to={[0, 0.24, 0]}
                      color={P.violet}
                      width={1.3}
                      head={0.08}
                      opacity={0.8}
                      dashed={i !== 1}
                    />
                  </group>
                ))}
              </group>
            ) : null}
          </group>
        </PointerTilt>

        <Tag position={[0, -2.15, 0]} tone={mode === "allow" ? "amber" : mode === "mcp" ? "violet" : "teal"} size="xs" center>
          {note}
        </Tag>
      </Stage>
    </Figure>
  );
}
