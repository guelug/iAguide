"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* safety: injection ribbon overriding system slab; defense rings; pii fan-out. */
type Mode = "inject" | "defense" | "pii";

const COPY = {
  en: {
    untrusted_text_is_a_payload: "untrusted text is a payload",
    injection_defense_pii: "injection · defense · pii",
    injection: "injection",
    defense: "defense",
    pii: "pii",
    system: "system",
    user_msg: "user message",
    override: "override",
    delimiters: "delimiters",
    model_gate: "model gate",
    filter: "output filter",
    blocked: "blocked",
    allowed: "allowed",
  },
  es: {
    untrusted_text_is_a_payload: "el texto no fiable es una carga útil",
    injection_defense_pii: "inyección · defensa · datos personales",
    injection: "inyección",
    defense: "defensa",
    pii: "pii",
    system: "sistema",
    user_msg: "mensaje usuario",
    override: "anula",
    delimiters: "delimitadores",
    model_gate: "puerta del modelo",
    filter: "filtro de salida",
    blocked: "bloqueado",
    allowed: "permitido",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("inject");

  return (
    <Figure
      label={t.untrusted_text_is_a_payload}
      hint={t.injection_defense_pii}
      legend={[
        { color: P.teal, label: t.system },
        { color: P.rose, label: t.injection },
        { color: P.violet, label: t.defense },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "inject", label: t.injection, tone: P.rose },
            { value: "defense", label: t.defense, tone: P.teal },
            { value: "pii", label: t.pii, tone: P.violet },
          ]}
          ariaLabel={t.untrusted_text_is_a_payload}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "inject" && (
          <>
            <Slab position={[-1.7, 0.6, 0]} size={[2.0, 1.0, 0.14]} color={P.teal} fill={0.22} />
            <Tag position={[-1.7, 1.3, 0.15]} tone="teal" size="xs">{t.system}</Tag>
            <Ribbon points={[[2.3, 0.6, 0], [0.6, 0.6, 0]]} color={P.rose} radius={0.05} opacity={0.9} />
            <Slab position={[2.3, 0.6, 0]} size={[1.8, 0.6, 0.1]} color={P.rose} fill={0.32} />
            <Tag position={[2.3, 1.15, 0.15]} tone="rose" size="xs">{t.user_msg} · «ignore instructions…»</Tag>
            {/* the override lands */}
            <Ribbon points={[[0.4, 0.6, 0], [-0.2, 0.6, 0]]} color={P.rose} radius={0.05} opacity={0.95} />
            <Tag position={[0.3, 0.15, 0.15]} tone="rose" size="xs">{t.override}</Tag>
            {/* exfil to a tool */}
            <Slab position={[1.5, -0.85, 0]} size={[1.4, 0.55, 0.1]} color={P.amber} fill={0.2} />
            <Tag position={[1.5, -0.45, 0.15]} tone="amber" size="xs">tool</Tag>
            <Ribbon points={[[-0.5, 0.3, 0], [1.5, -0.5, 0]]} color={P.rose} radius={0.03} opacity={0.6} />
          </>
        )}

        {mode === "defense" && (
          <>
            {/* three rings around the model */}
            <Halo position={[0, 0.4, 0]} radius={0.5} color={P.amber} opacity={0.6} spin={0.2} />
            <Halo position={[0, 0.4, 0]} radius={0.9} color={P.teal} opacity={0.55} spin={-0.15} />
            <Halo position={[0, 0.4, 0]} radius={1.3} color={P.violet} opacity={0.45} spin={0.1} />
            <Node3D position={[0, 0.4, 0]} color={P.violet} radius={0.18} pulse={0.3} />
            <Tag position={[-2.4, 0.4, 0.15]} tone="violet" size="xs">{t.delimiters}</Tag>
            <Tag position={[0, 1.75, 0.15]} tone="teal" size="xs">{t.model_gate}</Tag>
            <Tag position={[2.4, 0.4, 0.15]} tone="amber" size="xs">{t.filter}</Tag>
            {/* user message with rose payload arriving */}
            <Slab position={[-2.4, -0.85, 0]} size={[1.7, 0.55, 0.1]} color={P.rose} fill={0.28} />
            <Ribbon points={[[-1.5, -0.75, 0], [-0.8, 0.4, 0]]} color={P.rose} radius={0.03} opacity={0.6} />
            <Tag position={[-2.4, -1.3, 0.15]} tone="rose" size="xs">{t.user_msg}</Tag>
          </>
        )}

        {mode === "pii" && (
          <>
            <Slab position={[-2.4, 0.5, 0]} size={[1.7, 0.8, 0.12]} color={P.teal} fill={0.2} />
            <Tag position={[-2.4, 1.05, 0.15]} tone="teal" size="xs">{t.user_msg}</Tag>
            {/* fan-out to three destinations */}
            {[P.teal, P.amber, P.rose].map((col, i) => (
              <group key={i}>
                <Ribbon
                  points={[[-1.5, 0.5, 0], [-0.5 + i * 0.3, 0.2 - i * 0.35, 0]]}
                  color={col}
                  radius={0.035}
                  opacity={0.85}
                />
                <Slab position={[1.0 + i * 0.4, 0.2 - i * 0.35, 0]} size={[0.9, 0.5, 0.1]} color={col} fill={0.3} />
                <Tag position={[1.0 + i * 0.4, 0.62 - i * 0.35, 0.15]} tone={col === P.teal ? "teal" : col === P.amber ? "amber" : "rose"} size="xs">
                  {i === 0 ? "logs" : i === 1 ? "cache" : "external api"}
                </Tag>
              </group>
            ))}
            {/* rose path blocked */}
            <Ribbon
              points={[[-1.5, 0.5, 0], [0.8, -0.9, 0]]}
              color={P.rose}
              radius={0.02}
              opacity={0.4}
            />
            <Slab position={[0.85, -1.0, 0]} size={[0.35, 0.5, 0.1]} color={P.rose} fill={0.5} />
            <Tag position={[1.3, -1.0, 0.15]} tone="rose" size="xs">{t.blocked}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
