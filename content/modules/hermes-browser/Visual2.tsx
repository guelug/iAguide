"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* hermes-browser: CDP-driven session, AX snapshot reduction, action icons. */
type Mode = "session" | "snapshot" | "actions";

const COPY = {
  en: {
    the_browser_is_a_remote_control: "the browser is a remote control",
    session_snapshot_actions: "session · snapshot · actions",
    session: "session",
    snapshot: "snapshot",
    actions: "actions",
    cdp: "cdp",
    chrome_window: "chrome window",
    ax_tree: "ax tree",
    numbered: "numbered [n]",
    click: "click",
    type: "type",
    scroll: "scroll",
    reduced: "reduced",
  },
  es: {
    the_browser_is_a_remote_control: "el navegador es un mando",
    session_snapshot_actions: "sesión · snapshot · acciones",
    session: "sesión",
    snapshot: "snapshot",
    actions: "acciones",
    cdp: "cdp",
    chrome_window: "ventana chrome",
    ax_tree: "árbol ax",
    numbered: "numerados [n]",
    click: "click",
    type: "escribe",
    scroll: "scroll",
    reduced: "reducidos",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("session");

  return (
    <Figure
      label={t.the_browser_is_a_remote_control}
      hint={t.session_snapshot_actions}
      legend={[
        { color: P.teal, label: t.session },
        { color: P.violet, label: t.snapshot },
        { color: P.amber, label: t.actions },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "session", label: t.session, tone: P.teal },
            { value: "snapshot", label: t.snapshot, tone: P.violet },
            { value: "actions", label: t.actions, tone: P.amber },
          ]}
          ariaLabel={t.the_browser_is_a_remote_control}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "session" && (
          <>
            <Node3D position={[-2.4, 0.5, 0]} color={P.violet} radius={0.2} pulse={0.3} />
            <Tag position={[-2.4, 1.0, 0.15]} tone="violet" size="xs">hermes</Tag>
            {/* CDP ribbons going to chrome */}
            {[0.5, 0.85, 1.2].map((y, i) => (
              <Ribbon
                key={i}
                points={[[-2.2, y, 0], [-0.5, y, 0]]}
                color={P.teal}
                radius={0.03}
                opacity={0.8}
              />
            ))}
            <Tag position={[-1.3, 1.4, 0.15]} tone="muted" size="xs">{t.cdp}</Tag>
            {/* chrome window slab */}
            <Slab position={[0.5, 0.85, 0]} size={[2.4, 1.7, 0.18]} color={P.teal} fill={0.18} rim={0.7} />
            <Tag position={[0.5, 1.95, 0.15]} tone="teal" size="xs">{t.chrome_window}</Tag>
            {/* a page inside */}
            <Slab position={[0.5, 0.85, 0.1]} size={[2.0, 1.3, 0.05]} color={P.amber} fill={0.2} />
            {/* back ribbon */}
            <Ribbon
              points={[[1.7, 0.55, 0], [2.4, 0.1, 0], [-2.4, 0.1, 0]]}
              color={P.lineStrong}
              radius={0.02}
              opacity={0.6}
            />
          </>
        )}

        {mode === "snapshot" && (
          <>
            {/* an AX tree on the left, reduced list on the right */}
            <Lattice
              cells={[
                ...Array.from({ length: 8 }, (_, i) => ({
                  position: [-2.3 + (i % 4) * 0.45, 0.7 - Math.floor(i / 4) * 0.45, 0] as [number, number, number],
                  color: P.violet,
                })),
                ...Array.from({ length: 4 }, (_, i) => ({
                  position: [-2.3 + (i % 2) * 0.45, -0.5 - Math.floor(i / 2) * 0.45, 0] as [number, number, number],
                  color: P.teal,
                })),
              ]}
              size={0.18}
              opacity={0.85}
              matte
            />
            <Tag position={[-2.6, 1.4, 0.15]} tone="violet">{t.ax_tree}</Tag>
            <Flow points={[[-0.9, 0.3, 0], [0.4, 0.3, 0]]} color={P.amber} count={3} />
            {/* numbered list on right */}
            {Array.from({ length: 5 }, (_, i) => (
              <group key={i}>
                <Slab position={[1.5, 1.0 - i * 0.5, 0]} size={[1.6, 0.4, 0.08]} color={P.amber} fill={0.22} />
                <Tag position={[1.5, 1.55 - i * 0.5, 0.15]} tone="amber" size="xs">[{i}] {t.reduced}</Tag>
              </group>
            ))}
            <Tag position={[1.5, -1.0, 0.15]} tone="muted" size="xs">{t.numbered}</Tag>
          </>
        )}

        {mode === "actions" && (
          <>
            {/* three action icons hitting a page slab */}
            {(
              [
                [t.click, P.teal, -1.5, 1.2],
                [t.type, P.violet, 0, 1.2],
                [t.scroll, P.amber, 1.5, 1.2],
              ] as const
            ).map(([lab, col, x, y]) => (
              <group key={lab}>
                <Node3D position={[x, y, 0]} color={col} radius={0.18} pulse={0.3} />
                <Tag position={[x, y + 0.4, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "amber"} size="xs">
                  {lab}
                </Tag>
                <Flow points={[[x, y - 0.3, 0], [x, -0.3, 0]]} color={col} count={2} size={0.04} />
              </group>
            ))}
            <Slab position={[0, -0.55, 0]} size={[3.4, 0.6, 0.14]} color={P.muted} fill={0.14} rim={0.6} />
            <Tag position={[0, -1.05, 0.15]} tone="muted" size="xs">page dom</Tag>
            <Ribbon points={[[-1.7, -0.2, 0], [-1.7, -1.4, 0]]} color={P.teal} radius={0.02} opacity={0.4} />
            <Ribbon points={[[0, -0.2, 0], [0, -1.4, 0]]} color={P.violet} radius={0.02} opacity={0.4} />
            <Ribbon points={[[1.7, -0.2, 0], [1.7, -1.4, 0]]} color={P.amber} radius={0.02} opacity={0.4} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
