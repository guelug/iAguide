"use client";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { Knob, Readout } from "@/components/three/Figure";
import { ShadowBlob, Wire, type Cell } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

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

function LegacyVisual() {
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

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Plan = "none" | "5" | "3";

function budget(managerSteps: number, workerSteps: number, delegations: number, plan: Plan) {
  const d = Math.min(delegations, managerSteps);
  const interval = plan === "none" ? 0 : Number(plan);
  // planning runs at step 1 and then every `interval` steps
  const planningAt = interval ? Array.from({ length: managerSteps }, (_, i) => i).filter((i) => i % interval === 0) : [];
  // delegate on evenly spaced manager steps
  const delegatedAt = Array.from({ length: d }, (_, k) => Math.min(managerSteps - 1, Math.round(((k + 0.5) * managerSteps) / d - 0.5)));
  const calls = managerSteps + d * workerSteps + planningAt.length;
  return { d, planningAt, delegatedAt, calls, workerCalls: d * workerSteps, violated: workerSteps >= managerSteps };
}

function SpanishVisual() {
  const [mSteps, setMSteps] = useState(15);
  const [wSteps, setWSteps] = useState(10);
  const [deleg, setDeleg] = useState(3);
  const [plan, setPlan] = useState<Plan>("5");
  const b = useMemo(() => budget(mSteps, wSteps, deleg, plan), [mSteps, wSteps, deleg, plan]);
  const note = (
    <div className="space-y-3">
      <p>
        <strong>Los presupuestos se multiplican.</strong> Cada paso del manager que delega abre un bucle hijo completo. Con max_steps {mSteps} en el manager, {wSteps} en el worker y {b.d} delegaciones, el peor caso son {mSteps} + {b.d} × {wSteps}{b.planningAt.length ? ` + ${b.planningAt.length} de planificación` : ""} = <strong>{b.calls} llamadas al modelo</strong>. {b.violated ? "El worker puede dar tantos saltos como el manager o más: es exactamente como se descubre la factura. El curso fija 10 / 15; copia la desigualdad." : "El worker tiene menos pasos que el manager, como recomienda el curso (10 / 15)."}
      </p>
      <Readout
        items={[
          { label: "manager", value: String(mSteps), tone: "var(--amber)" },
          { label: "worker", value: `${b.d} × ${wSteps}`, tone: "var(--teal)" },
          { label: "planificación", value: String(b.planningAt.length), tone: "var(--violet)" },
          { label: "peor caso", value: `${b.calls} llamadas`, tone: b.violated ? "var(--rose)" : "var(--ink)" },
        ]}
      />
      <p className="text-xs text-muted">Cota superior: supone que cada bucle agota su max_steps. planning_interval={plan === "none" ? "None" : plan} añade un paso de plan al inicio y cada {plan === "none" ? "—" : plan} pasos. En la práctica un worker bien descrito devuelve antes su resumen.</p>
    </div>
  );
  return (
    <Figure
      label="Presupuesto de saltos · manager y worker"
      hint="max_steps anidados: el peor caso"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.amber, label: "paso del manager" },
        { color: P.teal, label: "paso del worker" },
        { color: P.violet, label: "planificación" },
        { color: P.rose, label: "worker ≥ manager" },
      ]}
      note={note}
      controls={
        <>
          <Knob label="manager" value={mSteps} min={5} max={15} onChange={(v) => { setMSteps(v); setDeleg((d) => Math.min(d, v)); }} tone="var(--amber)" />
          <Knob label="worker" value={wSteps} min={1} max={15} onChange={setWSteps} tone="var(--teal)" />
          <Knob label="delegaciones" value={deleg} min={1} max={6} onChange={setDeleg} tone="var(--ink)" />
          <Switcher value={plan} onChange={setPlan} ariaLabel="planning_interval" options={[{ value: "none", label: "plan: None", tone: P.inkSoft }, { value: "5", label: "plan: 5", tone: P.violet }, { value: "3", label: "plan: 3", tone: P.violet }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [4, 4.5, 10], fov: 35 }} fit={1.05}>
        <LoomScene b={b} m={mSteps} w={wSteps} />
      </Stage>
    </Figure>
  );
}

type B = ReturnType<typeof budget>;
const PX = 0.42;
const RAIL_Z = -1.9;
const WZ = 0.3;

function LoomScene({ b, m, w }: { b: B; m: number; w: number }) {
  const px = (i: number) => (i - 7) * PX; // fixed origin: the rail grows to the right
  const beads = useMemo<Cell[]>(() => {
    const cells: Cell[] = [];
    for (let i = 0; i < m; i++) cells.push({ position: [px(i), 0.28, RAIL_Z], color: P.amber });
    b.delegatedAt.forEach((i) => {
      for (let k = 0; k < w; k++) cells.push({ position: [px(i), 0.22, RAIL_Z + WZ * (k + 1)], color: b.violated ? mixHex(P.teal, P.rose, 0.75) : P.teal, scale: 0.8 });
    });
    return cells;
  }, [b, m, w]);
  const railX0 = px(0) - 0.35;
  const railX1 = px(14) + 0.35;
  return (
    <group>
      <ShadowBlob position={[0, -0.34, RAIL_Z + (WZ * w) / 2 + 0.3]} scale={8} opacity={0.1} />
      <RoundedBox position={[0, -0.2, RAIL_Z + (WZ * w) / 2 + 0.25]} args={[7.4, 0.22, WZ * w + 1.3]} radius={0.1} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#2D3436" roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {/* the manager's rail: fixed length 15, filled up to max_steps */}
      <RoundedBox position={[(railX0 + railX1) / 2, 0.08, RAIL_Z]} args={[railX1 - railX0, 0.1, 0.36]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#8C9895" metalness={0.55} roughness={0.34} />
      </RoundedBox>
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} position={[px(i), 0.15, RAIL_Z]}>
          <cylinderGeometry args={[0.035, 0.035, 0.06, 10]} />
          <meshStandardMaterial color={i < m ? "#B7833E" : "#6E7472"} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* worker trays hanging forward from each delegating step */}
      {b.delegatedAt.map((i) => (
        <group key={i}>
          <RoundedBox position={[px(i), 0.05, RAIL_Z + (WZ * (w + 1)) / 2 + 0.1]} args={[0.3, 0.06, WZ * w + 0.3]} radius={0.025} smoothness={2} receiveShadow>
            <meshStandardMaterial color="#4E5A59" metalness={0.4} roughness={0.4} />
          </RoundedBox>
          <Wire points={[[px(i), 0.4, RAIL_Z], [px(i), 0.4, RAIL_Z + WZ * w]]} color={b.violated ? P.rose : P.teal} opacity={0.5} />
        </group>
      ))}
      <Lattice cells={beads} size={0.24} />
      {b.planningAt.map((i) => (
        <mesh key={"p" + i} position={[px(i), 0.28, RAIL_Z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.03, 10, 32]} />
          <meshStandardMaterial color={P.violet} roughness={0.35} />
        </mesh>
      ))}
      <Tag position={[px(0) - 0.2, 0.75, RAIL_Z]} tone="amber" size="xs">{"manager · " + m + " pasos"}</Tag>
      {b.delegatedAt.length ? (
        <Tag position={[px(b.delegatedAt[b.delegatedAt.length - 1]) + 0.35, 0.3, RAIL_Z + WZ * w]} tone={b.violated ? "rose" : "teal"} size="xs">{"worker · " + w + " pasos"}</Tag>
      ) : null}
      <Tag position={[px(14) + 0.1, 0.85, RAIL_Z]} tone={b.violated ? "rose" : "ink"} size="xs" center>{b.calls + " llamadas"}</Tag>
    </group>
  );
}
