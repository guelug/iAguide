"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* smolagents-multi: manager→workers topology, nested spans, vision capture tax. */
type Mode = "manager" | "spans" | "vision";

const COPY = {
  en: {
    one_manager_many_workers: "one manager, many workers",
    topology_spans_vision_tax: "topology · spans · vision tax",
    manager: "manager",
    web: "web",
    retriever: "retriever",
    vision: "vision",
    nested_spans: "nested spans",
    screen: "screen",
    capture: "capture",
    action: "action",
    summary: "summary",
    cost: "cost",
  },
  es: {
    one_manager_many_workers: "un manager, muchos workers",
    topology_spans_vision_tax: "topología · spans · impuesto visión",
    manager: "manager",
    web: "web",
    retriever: "retriever",
    vision: "visión",
    nested_spans: "spans anidados",
    screen: "pantalla",
    capture: "captura",
    action: "acción",
    summary: "resumen",
    cost: "coste",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("manager");

  return (
    <Figure
      label={t.one_manager_many_workers}
      hint={t.topology_spans_vision_tax}
      legend={[
        { color: P.violet, label: t.manager },
        { color: P.teal, label: t.web },
        { color: P.amber, label: t.retriever },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "manager", label: t.manager, tone: P.violet },
            { value: "spans", label: t.nested_spans, tone: P.teal },
            { value: "vision", label: t.vision, tone: P.amber },
          ]}
          ariaLabel={t.one_manager_many_workers}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "manager" && (
          <>
            <Node3D position={[0, 1.1, 0]} color={P.violet} radius={0.22} pulse={0.3} />
            <Tag position={[0, 1.65, 0.15]} tone="violet">{t.manager}</Tag>
            {(
              [
                [t.web, P.teal, -1.8, -0.5],
                [t.retriever, P.amber, 0, -0.7],
                [t.vision, P.violet, 1.8, -0.5],
              ] as const
            ).map(([lab, col, x, y]) => (
              <group key={lab}>
                <Slab position={[x, y, 0]} size={[1.5, 0.85, 0.12]} color={col} fill={0.2} />
                <Tag position={[x, y + 0.55, 0.15]} tone={col === P.teal ? "teal" : col === P.amber ? "amber" : "violet"} size="xs">{lab}</Tag>
                <Flow points={[[0, 0.4, 0], [x, y - 0.35, 0]]} color={col} count={2} size={0.05} />
                {/* summary ribbon back */}
                <Ribbon points={[[x, y + 0.45, 0], [0, 0.55, 0]]} color={P.lineStrong} radius={0.02} opacity={0.6} />
              </group>
            ))}
            <Tag position={[0, -1.4, 0.15]} tone="muted" size="xs">{t.summary} → back to {t.manager}</Tag>
          </>
        )}

        {mode === "spans" && (
          <>
            {/* manager slab enclosing worker slabs */}
            <Slab position={[0, 0.3, 0]} size={[5.0, 2.2, 0.1]} color={P.violet} fill={0.06} rim={0.7} />
            <Tag position={[0, 1.55, 0.15]} tone="violet" size="xs">{t.manager}</Tag>
            {(
              [
                [t.web, P.teal, -1.6, 0.4],
                [t.retriever, P.amber, 0, 0.4],
                [t.vision, P.violet, 1.6, 0.4],
              ] as const
            ).map(([lab, col, x, y]) => (
              <group key={lab}>
                <Slab position={[x, y, 0.05]} size={[1.5, 1.0, 0.08]} color={col} fill={0.18} />
                <Tag position={[x, y + 0.85, 0.2]} tone={col === P.teal ? "teal" : col === P.amber ? "amber" : "violet"} size="xs">{lab}</Tag>
              </group>
            ))}
            <Tag position={[0, -1.0, 0.15]} tone="muted" size="xs">{t.nested_spans} · same trace</Tag>
          </>
        )}

        {mode === "vision" && (
          <>
            <Slab position={[-2.3, 0.5, 0]} size={[1.8, 1.4, 0.14]} color={P.teal} fill={0.16} />
            <Tag position={[-2.3, 1.4, 0.15]} tone="teal">{t.screen}</Tag>
            <Ribbon points={[[-1.4, 0.5, 0], [-0.5, 0.5, 0]]} color={P.teal} radius={0.04} opacity={0.8} />
            <Slab position={[0.1, 0.5, 0]} size={[1.5, 0.85, 0.12]} color={P.amber} fill={0.22} />
            <Tag position={[0.1, 1.05, 0.15]} tone="amber" size="xs">{t.capture}</Tag>
            <Flow points={[[0.9, 0.5, 0], [1.7, 0.5, 0]]} color={P.amber} count={2} size={0.05} />
            <Node3D position={[2.4, 0.5, 0]} color={P.violet} radius={0.2} pulse={0.3} />
            <Tag position={[2.4, 1.0, 0.15]} tone="violet" size="xs">{t.action}</Tag>
            <Ribbon points={[[2.4, 0.05, 0], [0, -0.6, 0], [-2.3, -0.25, 0]]} color={P.lineStrong} radius={0.02} opacity={0.5} />
            <Lattice
              cells={Array.from({ length: 6 }, (_, i) => ({
                position: [1.3 + (i % 2) * 0.35, -0.3 - Math.floor(i / 2) * 0.25, 0.1] as [number, number, number],
                color: P.rose,
              }))}
              size={0.12}
              opacity={0.9}
              matte
            />
            <Tag position={[1.5, -0.95, 0.15]} tone="rose" size="xs">{t.cost}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
