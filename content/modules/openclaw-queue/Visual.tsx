"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { type Group } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, Flow, Node3D, PointerTilt, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "a" | "b" | "c" | "d" | "e";



export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "steer": "steer",
      "followup": "followup",
      "collect": "collect",
      "interrupt": "interrupt",
      "lanes": "lanes",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "steer": "dirige",
      "followup": "seguimiento",
      "collect": "recoge",
      "interrupt": "interrumpe",
      "lanes": "carriles",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: t.steer, tone: "var(--teal)" },
    { value: "b" as const, label: t.followup, tone: "var(--teal)" },
    { value: "c" as const, label: t.collect, tone: "var(--amber)" },
    { value: "d" as const, label: t.interrupt, tone: "var(--violet)" },
    { value: "e" as const, label: t.lanes, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="OpenClaw: session lanes and queue modes"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-queue diagram steps"
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
        color={active === "a" ? P.teal : P.lineStrong}
        fill={active === "a" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.steer}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.followup}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.collect}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.interrupt}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.lanes}</Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Cronógrafo de una lane de sesión. Una corrida activa (modelo → snapshot
 * → dos tools secuenciales → modelo) recibe una ráfaga de mensajes. El
 * planificador schedule() aplica las reglas de cada modo de /queue con el
 * debounce integrado de 500 ms; el banco solo dibuja lo que devuelve.
 * Duraciones didácticas en milisegundos.
 */

type QMode = "steer" | "followup" | "collect" | "interrupt";
type BlockKind = "model" | "tool";
type BlockState = "done" | "skipped" | "aborted" | "steered" | "turn";
type Block = { kind: BlockKind; name: string; s: number; e: number; state: BlockState; lane: number };

const DEBOUNCE = 500;
const TURN_MS = 1200;
const RUN: Omit<Block, "state" | "lane">[] = [
  { kind: "model", name: "modelo", s: 0, e: 1200 },
  { kind: "tool", name: "snapshot", s: 1200, e: 3200 },
  { kind: "tool", name: "leer", s: 3200, e: 3800 },
  { kind: "tool", name: "escribir", s: 3800, e: 4400 },
  { kind: "model", name: "modelo", s: 4400, e: 5600 },
];
const RUN_END = 5600;

function schedule(mode: QMode, t: number, burst: number) {
  const arrivals = [t, t + 250, t + 600].slice(0, burst);
  const last = arrivals[arrivals.length - 1];
  const blocks: Block[] = [];
  let runs = 0;
  let synthetic = 0;
  let aborted = 0;
  const consumed: number[] = [];
  let fallback = false;

  if (mode === "interrupt") {
    // Each arrival aborts whatever is running on the lane and starts the newest.
    const cut = arrivals[0];
    for (const b of RUN) {
      if (b.s >= cut) continue;
      const e = Math.min(b.e, cut);
      if (b.e > cut) aborted += 1;
      blocks.push({ ...b, e, state: b.e > cut ? "aborted" : "done", lane: 0 });
    }
    arrivals.forEach((a, i) => {
      const next = arrivals[i + 1];
      const end = a + TURN_MS;
      const cutAt = next !== undefined && next < end ? next : end;
      if (cutAt < end) aborted += 1;
      blocks.push({ kind: "model", name: `msg ${i + 2}`, s: a, e: cutAt, state: cutAt < end ? "aborted" : "turn", lane: 0 });
      runs += 1;
      consumed.push(a);
    });
  } else {
    let boundary: number | null = null;
    if (mode === "steer") {
      const ready = last + DEBOUNCE;
      boundary = RUN.slice(1).find((b) => b.s >= ready)?.s ?? null;
      if (boundary === null) fallback = true; // run already past its last checkpoint
    }
    for (const b of RUN) {
      if (boundary !== null && b.s >= boundary) {
        if (b.kind === "tool") {
          synthetic += 1;
          blocks.push({ ...b, s: boundary, e: boundary, state: "skipped", lane: 0 });
        }
        continue;
      }
      blocks.push({ ...b, state: "done", lane: 0 });
    }
    if (boundary !== null) {
      blocks.push({ kind: "model", name: "con steer", s: boundary, e: boundary + TURN_MS, state: "steered", lane: 0 });
      arrivals.forEach(() => consumed.push(boundary as number));
    } else if (mode === "collect" || (mode === "steer" && fallback)) {
      const s = Math.max(RUN_END, last + DEBOUNCE);
      blocks.push({ kind: "model", name: mode === "collect" ? `lote de ${burst}` : "steer tardío", s, e: s + TURN_MS, state: "turn", lane: 0 });
      runs += 1;
      arrivals.forEach(() => consumed.push(s));
    } else {
      let prev = RUN_END;
      arrivals.forEach((a, i) => {
        const s = Math.max(prev, a + DEBOUNCE);
        blocks.push({ kind: "model", name: `msg ${i + 2}`, s, e: s + TURN_MS, state: "turn", lane: 0 });
        runs += 1;
        consumed.push(s);
        prev = s + TURN_MS;
      });
    }
  }
  const end = Math.max(...blocks.map((b) => b.e));
  return { arrivals, blocks, runs, synthetic, aborted, end, consumed, fallback };
}

const NFQ = new Intl.NumberFormat("es-ES");
const MS_X = 0.00085;
const X0 = -4.5;
const tx = (ms: number) => X0 + ms * MS_X;

function QM({ color, rough = 0.45, coat = 0.4, metal = 0, opacity = 1 }: { color: string; rough?: number; coat?: number; metal?: number; opacity?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} transparent={opacity < 1} opacity={opacity} />;
}

function blockColor(b: Block) {
  if (b.state === "aborted") return mixHex(P.paper, P.rose, 0.55);
  if (b.state === "steered") return P.violet;
  if (b.state === "turn") return mixHex(P.paper, P.violet, 0.55);
  return b.kind === "tool" ? mixHex(P.paper, P.teal, 0.6) : mixHex(P.paper, P.violet, 0.75);
}

function RunBlock({ b, skippedIndex }: { b: Block; skippedIndex: number }) {
  const w = Math.max(0.04, (b.e - b.s) * MS_X - 0.04);
  const cx = tx((b.s + b.e) / 2);
  if (b.state === "skipped") {
    // Zero-length: a synthetic paired error result stacked at the checkpoint.
    return (
      <group position={[tx(b.s) + 0.18, 0.06 + skippedIndex * 0.2, 0]}>
        <RoundedBox args={[0.24, 0.16, 0.24]} radius={0.03} smoothness={2} castShadow>
          <QM color={mixHex(P.paper, P.rose, 0.25)} rough={0.5} />
        </RoundedBox>
        <Wire points={[[-0.13, -0.09, 0.13], [0.13, -0.09, 0.13], [0.13, 0.09, 0.13], [-0.13, 0.09, 0.13], [-0.13, -0.09, 0.13]]} color={P.rose} width={1.5} dashed />
      </group>
    );
  }
  const h = b.kind === "tool" ? 0.5 : 0.78;
  return (
    <group position={[cx, -0.82 + h / 2, 0]}>
      <RoundedBox args={[w, h, 0.9]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <QM color={blockColor(b)} rough={0.38} coat={0.55} />
      </RoundedBox>
      {b.state === "steered" ? (
        <mesh position={[-w / 2 + 0.08, 0, 0.405]}>
          <planeGeometry args={[0.12, h * 0.8]} />
          <meshBasicMaterial color={P.amber} />
        </mesh>
      ) : null}
      {b.state === "aborted" ? (
        <mesh position={[w / 2 + 0.01, 0, 0]}>
          <boxGeometry args={[0.03, h + 0.1, 0.9]} />
          <meshBasicMaterial color={P.rose} />
        </mesh>
      ) : null}
      {w > 0.42 ? (
        <Tag position={(b.kind === "tool" || b.state === "steered") && b.state !== "aborted" ? [0, -h / 2 - 0.05, 0.75] : [0, h / 2 + 0.2, 0.1]} tone={b.state === "aborted" ? "rose" : b.kind === "tool" ? "teal" : "violet"} size="xs" center>{b.state === "aborted" ? "abortado" : b.name}</Tag>
      ) : null}
    </group>
  );
}

function Playhead({ end }: { end: number }) {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (still) {
      g.position.x = tx(end);
      return;
    }
    // Real time slowed 1.6×, then a short rest.
    const span = (end / 1000) * 1.6;
    t.current = (t.current + dt) % (span + 1);
    g.position.x = tx(Math.min(end, (t.current / span) * end));
  });
  return (
    <group ref={ref} position={[tx(0), 0, 0]}>
      <mesh position={[0, -0.2, 0.2]}>
        <boxGeometry args={[0.02, 1.6, 1.8]} />
        <meshPhysicalMaterial color={P.amber} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.65, 0.2]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.08, 0.16, 16]} />
        <QM color={P.amber} />
      </mesh>
    </group>
  );
}

function Envelope({ at, to, i }: { at: number; to: number; i: number }) {
  const p: V3 = [tx(at), 0.75 + i * 0.36, 0.2];
  return (
    <group>
      <group position={p}>
        <RoundedBox args={[0.44, 0.3, 0.1]} radius={0.03} smoothness={2} castShadow>
          <QM color={P.surface} rough={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.02, 0.045]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.2, 0.2]} />
          <meshBasicMaterial color={P.amber} transparent opacity={0.6} />
        </mesh>
      </group>
      <Arrow from={[p[0], p[1] - 0.14, p[2]]} to={[tx(to) + 0.05, 0.02, 0.2]} color={P.amber} width={1.4} head={0.1} bow={0.12} />
    </group>
  );
}

function QueueBench({ mode, t, burst }: { mode: QMode; t: number; burst: number }) {
  const sc = useMemo(() => schedule(mode, t, burst), [mode, t, burst]);
  let skipped = 0;
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -1.5, 0.2]} scale={10.5} opacity={0.12} />
        <RoundedBox args={[10.4, 0.34, 3.4]} position={[0, -1.3, 0.3]} radius={0.16} smoothness={4} castShadow receiveShadow>
          <QM color="#3a3f44" rough={0.6} coat={0.2} />
        </RoundedBox>
        {/* the session lane: one writer, so blocks never overlap */}
        <RoundedBox args={[9.2, 0.16, 1.1]} position={[tx(5000), -0.98, 0]} radius={0.05} smoothness={3} receiveShadow castShadow>
          <QM color={mixHex(P.paper, P.teal, 0.12)} rough={0.5} />
        </RoundedBox>
        {[-0.52, 0.52].map((z) => (
          <mesh key={z} position={[tx(5000), -0.86, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 9.2, 10]} />
            <QM color="#b68442" metal={0.7} rough={0.3} coat={0} />
          </mesh>
        ))}
        {Array.from({ length: 11 }, (_, s) => (
          <group key={s} position={[tx(s * 1000), -1.1, 0.75]}>
            <mesh>
              <boxGeometry args={[0.02, 0.04, 0.22]} />
              <meshBasicMaterial color={P.paper} />
            </mesh>
            {s % 2 === 0 ? <Tag position={[0, -0.02, 0.3]} tone="muted" size="xs" center>{`${s} s`}</Tag> : null}
          </group>
        ))}
        <Tag position={[tx(0) - 0.5, -0.62, 0]} tone="teal" size="xs" center>lane de sesión</Tag>
        {sc.blocks.map((b, i) => {
          const idx = b.state === "skipped" ? skipped++ : 0;
          return <RunBlock key={`${i}-${b.s}-${b.name}`} b={b} skippedIndex={idx} />;
        })}
        {skipped > 0 ? <Tag position={[sc.blocks.find((b) => b.state === "skipped") ? tx(sc.blocks.find((b) => b.state === "skipped")!.s) - 0.45 : 0, 0.15 + skipped * 0.2, 0]} tone="rose" size="xs" center>sintéticos</Tag> : null}
        {sc.arrivals.map((a, i) => (
          <Envelope key={i} at={a} to={sc.consumed[i] ?? a} i={i} />
        ))}
        <Tag position={[tx(sc.arrivals[0]) - 0.1, 0.95 + sc.arrivals.length * 0.36, 0.2]} tone="amber" size="xs" center>entrantes</Tag>
        <Playhead key={`${mode}-${t}-${burst}`} end={sc.end} />
      </group>
    </PointerTilt>
  );
}

const MODE_TEXT: Record<QMode, string> = {
  steer: "Inyecta en la corrida activa. El tool en marcha termina; las llamadas secuenciales que no han arrancado se saltan con resultados de error emparejados sintéticos, y el steer se ve antes de la siguiente decisión del modelo. No se arranca una segunda corrida.",
  followup: "No hace steer. Cada mensaje espera a que acabe la corrida y se convierte en su propio turno posterior.",
  collect: "No hace steer. Tras la ventana de silencio, los mensajes encolados se funden en un único turno followup (si van a hilos distintos, drenan por separado).",
  interrupt: "Aborta la corrida activa de la sesión y corre el mensaje más nuevo. Es el único modo que mata trabajo en vuelo: cada corrección cuesta una llamada tirada.",
};

function SpanishVisual() {
  const [mode, setMode] = useState<QMode>("steer");
  const [t, setT] = useState(1800);
  const [burst, setBurst] = useState(1);
  const sc = schedule(mode, t, burst);
  return (
    <Figure
      label="Cronógrafo de la cola · un mensaje llega a mitad de corrida"
      hint="steer · followup · collect · interrupt"
      legend={[
        { color: P.violet, label: "llamada al modelo" },
        { color: P.teal, label: "tool" },
        { color: P.amber, label: "mensaje entrante" },
        { color: P.rose, label: "abortado / sintético" },
      ]}
      note={
        <div className="space-y-2">
          <p><strong>{mode}.</strong> {MODE_TEXT[mode]}{sc.fallback ? " Aquí el mensaje llega cuando ya no quedan puntos de control: el steer no cabe y el prompt arranca tras la corrida." : ""}</p>
          <Readout items={[
            { label: "llegadas", value: sc.arrivals.map((a) => `${NFQ.format(a)} ms`).join(" · "), tone: "var(--amber)" },
            { label: "corridas nuevas", value: String(sc.runs), tone: "var(--violet)" },
            { label: "resultados sintéticos", value: String(sc.synthetic), tone: "var(--rose)" },
            { label: "trabajo abortado", value: String(sc.aborted), tone: "var(--rose)" },
            { label: "lane libre en", value: `${NFQ.format(sc.end)} ms`, tone: "var(--ink)" },
          ]} />
          <p className="text-xs text-muted">Debounce integrado de 500 ms (steer, followup, collect) y reglas de los modos: <em>Command queue</em> de OpenClaw. Duraciones de la corrida y de cada turno (1,2 s): didácticas. En ningún modo hay dos corridas escribiendo a la vez en la misma sesión.</p>
        </div>
      }
      controls={
        <>
          <Switcher value={mode} onChange={setMode} options={[{ value: "steer", label: "steer", tone: P.teal }, { value: "followup", label: "followup", tone: P.violet }, { value: "collect", label: "collect", tone: P.amber }, { value: "interrupt", label: "interrupt", tone: P.rose }]} ariaLabel="Modo de cola" />
          <Knob label="llega en" min={200} max={5000} step={100} value={t} onChange={setT} format={(v) => `${NFQ.format(v)} ms`} tone={P.amber} />
          <Knob label="ráfaga" min={1} max={3} value={burst} onChange={setBurst} tone={P.amber} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 5.2, 9.6], fov: 34 }} fit={1.02}>
        <QueueBench mode={mode} t={t} burst={burst} />
      </Stage>
    </Figure>
  );
}
