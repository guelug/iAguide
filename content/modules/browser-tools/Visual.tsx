"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "tool" | "cdp" | "dialog" | "frames" | "target";



export default function Visual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "browser_tool": "browser tool",
      "cdp_socket": "CDP socket",
      "dialogs": "dialogs",
      "frames": "frames",
      "sandbox_host_node": "sandbox/host/node",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "browser_tool": "herramienta de navegador",
      "cdp_socket": "socket CDP",
      "dialogs": "diálogos",
      "frames": "frames",
      "sandbox_host_node": "sandbox/host/nodo",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "tool" as const, label: t.browser_tool, tone: "var(--teal)" },
    { value: "cdp" as const, label: t.cdp_socket, tone: "var(--teal)" },
    { value: "dialog" as const, label: t.dialogs, tone: "var(--amber)" },
    { value: "frames" as const, label: t.frames, tone: "var(--violet)" },
    { value: "target" as const, label: t.sandbox_host_node, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("tool");

  return (
    <Figure
      label="Browser as a tool backend"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="browser-tools diagram steps"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.4], fov: 40 }}>
        <Turntable speed={0.035} tilt={0.1}>
          <Scene active={step} t={t} />
        </Turntable>
      </Stage>
    </Figure>
  );
}

function Scene({ active, t }: { active: Step; t: Record<string, string> }) {
  return (
    <group>
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "tool" ? P.teal : P.lineStrong}
        fill={active === "tool" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.browser_tool}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "cdp" ? P.amber : P.lineStrong}
        fill={active === "cdp" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.cdp_socket}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "dialog" ? P.violet : P.lineStrong}
        fill={active === "dialog" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.dialogs}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "frames" ? P.teal : P.lineStrong}
        fill={active === "frames" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.frames}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "target" ? P.amber : P.lineStrong}
        fill={active === "target" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.sandbox_host_node}</Tag>
    </group>
  );
}
