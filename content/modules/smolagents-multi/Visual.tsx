"use client";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { Knob, Readout } from "@/components/three/Figure";
import { Lattice, PointerTilt, ShadowBlob, type Cell, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "team" | "retrieve" | "vision";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "manager_worker_vision": "manager · worker · vision",
      "nested_loops_narrower_tools": "nested loops, narrower tools",
      "team": "team",
      "retrieve": "retrieve",
      "vision_loop": "vision loop",
      "team_2": "Team",
      "retrieve_2": "Retrieve",
      "vision_loop_2": "Vision loop"
    },
    es: {
      "manager_worker_vision": "manager · worker · visión",
      "nested_loops_narrower_tools": "bucles anidados, tools más estrechas",
      "team": "equipo",
      "retrieve": "recupera",
      "vision_loop": "bucle de visión",
      "team_2": "Equipo",
      "retrieve_2": "Recupera",
      "vision_loop_2": "Bucle de visión"
    },
  });
  const [mode, setMode] = useState<Mode>("team");
  return (
    <Figure
      label={t.manager_worker_vision}
      hint={t.nested_loops_narrower_tools}
      legend={[
          { color: P.teal, label: t.team },
          { color: P.amber, label: t.retrieve },
          { color: P.rose, label: t.vision_loop }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "team", label: t.team_2, tone: P.teal },
            { value: "retrieve", label: t.retrieve_2, tone: P.amber },
            { value: "vision", label: t.vision_loop_2, tone: P.rose }
          ]}
          ariaLabel={t.nested_loops_narrower_tools}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Node3D position={[0, 1.15, 0]} color={P.violet} radius={0.22} pulse={0.3} />
        <Tag position={[0, 1.65, 0.2]} tone="violet">manager</Tag>
        <Node3D position={[-2.2, -0.35, 0]} color={P.teal} radius={0.18} />
        <Node3D position={[0, -0.35, 0]} color={P.amber} radius={0.18} />
        <Node3D position={[2.2, -0.35, 0]} color={mode === "vision" ? P.rose : P.teal} radius={0.18} pulse={mode === "vision" ? 0.5 : 0} />
        <Tag position={[-2.2, -0.85, 0.2]} tone="teal">web</Tag>
        <Tag position={[0, -0.85, 0.2]} tone="amber">retriever</Tag>
        <Tag position={[2.2, -0.85, 0.2]} tone={mode === "vision" ? "rose" : "teal"}>{mode === "vision" ? "screenshot…" : "vision"}</Tag>
        <Flow points={[[0, 1.15, 0], [-2.2, -0.35, 0]]} color={P.teal} count={3} />
        <Flow points={[[0, 1.15, 0], [0, -0.35, 0]]} color={P.amber} count={3} />
        <Flow points={[[0, 1.15, 0], [2.2, -0.35, 0]]} color={mode === "vision" ? P.rose : P.violet} count={mode === "vision" ? 6 : 3} />
        {mode === "vision" ? <Wire points={[[2.2, -0.35, 0], [2.2, -1.45, 0], [2.2, -0.35, 0]]} color={P.rose} /> : null}
    
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Arch = "solo" | "equipo" | "vision";
type Keep = "dos" | "todas";

/* Didactic token sizes (not measured): they only have to be the same for
   every architecture so the comparison is fair. */
const T = { system: 1200, snippet: 1500, managerStep: 200, summary: 300, shot: 1000, shotText: 150 };
const BLOCK = 500; // one cube = 500 tokens

type Seg = { kind: "system" | "snippet" | "summary" | "step" | "shot" | "text"; tokens: number };
type Agent = { name: string; segs: Seg[]; prefills: number[]; pruned: number };

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const size = (segs: Seg[]) => sum(segs.map((s) => s.tokens));

function simulateAgents(arch: Arch, steps: number, keep: Keep): Agent[] {
  if (arch === "solo") {
    const segs: Seg[] = [{ kind: "system", tokens: T.system }];
    const prefills: number[] = [];
    for (let k = 0; k < steps; k++) {
      prefills.push(size(segs));
      segs.push({ kind: "step", tokens: T.managerStep }, { kind: "snippet", tokens: T.snippet });
    }
    return [{ name: "agente único", segs, prefills, pruned: 0 }];
  }
  const worker: Agent = { name: arch === "equipo" ? "web_agent" : "vision_agent", segs: [{ kind: "system", tokens: T.system }], prefills: [], pruned: 0 };
  let shots = 0;
  for (let k = 0; k < steps; k++) {
    worker.prefills.push(size(worker.segs));
    if (arch === "equipo") worker.segs.push({ kind: "snippet", tokens: T.snippet });
    else {
      worker.segs.push({ kind: "text", tokens: T.shotText }, { kind: "shot", tokens: T.shot });
      shots++;
      if (keep === "dos" && shots > 2) {
        const idx = worker.segs.findIndex((s) => s.kind === "shot");
        worker.segs.splice(idx, 1);
        worker.pruned++;
      }
    }
  }
  // The manager only ever sees the worker's summary: one call, one answer.
  const managerSegs: Seg[] = [{ kind: "system", tokens: T.system }];
  const mPrefills = [size(managerSegs)];
  managerSegs.push({ kind: "step", tokens: T.managerStep }, { kind: "summary", tokens: T.summary });
  mPrefills.push(size(managerSegs));
  return [{ name: "manager", segs: managerSegs, prefills: mPrefills, pruned: 0 }, worker];
}

const nfmt = (n: number) => new Intl.NumberFormat("es-ES").format(n);

function SpanishVisual() {
  const [arch, setArch] = useState<Arch>("equipo");
  const [steps, setSteps] = useState(6);
  const [keep, setKeep] = useState<Keep>("dos");
  const agents = useMemo(() => simulateAgents(arch, steps, keep), [arch, steps, keep]);
  const solo = useMemo(() => simulateAgents("solo", steps, keep)[0], [steps, keep]);
  const total = sum(agents.map((a) => sum(a.prefills)));
  const soloTotal = sum(solo.prefills);
  const manager = agents[0];
  const worker = agents[1];
  const note = (
    <div className="space-y-3">
      <p>
        {arch === "solo" ? (
          <><strong>Un solo bucle lo acumula todo.</strong> Cada paso vuelve a leer el prompt entero: tras {steps} pasos la ventana tiene {nfmt(size(manager.segs))} tokens y el agente ha pagado {nfmt(total)} tokens de entrada en prefills.</>
        ) : arch === "equipo" ? (
          <><strong>El worker se queda los snippets; el manager, el resumen.</strong> web_agent hace {steps} saltos en su propia memoria ({nfmt(size(worker!.segs))} tokens al final). El manager solo ve {nfmt(T.summary)} tokens de resumen y su ventana termina en {nfmt(size(manager.segs))}. Entrada total: {nfmt(total)} tokens frente a {nfmt(soloTotal)} del agente único; el impuesto es el prefill extra del sistema del worker.</>
        ) : (
          <><strong>Cada captura son tokens.</strong> vision_agent añade una imagen por paso a <code>observation_images</code>. {keep === "dos" ? `Con la poda a las dos últimas, ${worker!.pruned} capturas salen de la ventana y el worker termina con ${nfmt(size(worker!.segs))} tokens.` : `Sin poda la ventana crece hasta ${nfmt(size(worker!.segs))} tokens: el flipbook del caso Sightline.`} Entrada acumulada del worker: {nfmt(sum(worker!.prefills))} tokens.</>
        )}
      </p>
      <Readout
        items={[
          { label: "pasos del worker", value: String(steps), tone: "var(--ink)" },
          { label: "ventana del manager", value: `${nfmt(size(manager.segs))} tok`, tone: "var(--amber)" },
          { label: "prefills", value: String(sum(agents.map((a) => a.prefills.length))), tone: "var(--violet)" },
          { label: "entrada total", value: `${nfmt(total)} tok`, tone: "var(--teal)" },
        ]}
      />
      <p className="text-xs text-muted">Tamaños didácticos: sistema {nfmt(T.system)}, snippet web {nfmt(T.snippet)}, resumen {nfmt(T.summary)}, captura {nfmt(T.shot)} tokens; cada cubo son {BLOCK} tokens. «Entrada total» suma el prompt releído en cada paso. El curso usa max_steps 10 para el worker y 15 para el manager.</p>
    </div>
  );
  return (
    <Figure
      label="smolagents anidados · memorias separadas"
      hint="lo que cada bucle relee en cada paso"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.amber, label: "sistema + tarea" },
        { color: P.teal, label: "snippets web" },
        { color: P.violet, label: "resumen del worker" },
        { color: P.rose, label: "capturas" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={arch} onChange={setArch} ariaLabel="Arquitectura" options={[{ value: "solo", label: "Agente único", tone: P.inkSoft }, { value: "equipo", label: "Manager + web", tone: P.teal }, { value: "vision", label: "Manager + visión", tone: P.rose }]} />
          <Knob label="pasos" value={steps} min={1} max={10} onChange={setSteps} tone="var(--teal)" />
          {arch === "vision" ? <Switcher value={keep} onChange={setKeep} ariaLabel="Retención de capturas" options={[{ value: "dos", label: "Retener 2", tone: P.teal }, { value: "todas", label: "Retener todas", tone: P.rose }]} /> : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.4, 2.8, 11.5], fov: 35 }} fit={1.05}>
        <TowerScene agents={agents} arch={arch} />
      </Stage>
    </Figure>
  );
}

const SEG_COLOR: Record<Seg["kind"], string> = { system: P.amber, snippet: P.teal, summary: P.violet, step: "#9AA3A8", shot: P.rose, text: mixHex(P.paper, P.rose, 0.45) };
const PITCH = 0.3;
const PER_ROW = 2;

function towerCells(segs: Seg[]): Cell[] {
  const total = size(segs);
  const n = Math.ceil(total / BLOCK);
  const cells: Cell[] = [];
  const bounds: { end: number; kind: Seg["kind"] }[] = [];
  let acc = 0;
  segs.forEach((sg) => { acc += sg.tokens; bounds.push({ end: acc, kind: sg.kind }); });
  for (let j = 0; j < n; j++) {
    const mid = j * BLOCK + BLOCK / 2;
    const kind = (bounds.find((b) => b.end > mid) ?? bounds[bounds.length - 1]).kind;
    const layer = Math.floor(j / (PER_ROW * PER_ROW));
    const r = j % (PER_ROW * PER_ROW);
    cells.push({ position: [((r % PER_ROW) - 0.5) * PITCH, 0.2 + layer * PITCH, (0.5 - Math.floor(r / PER_ROW)) * PITCH], color: SEG_COLOR[kind] });
  }
  return cells;
}

function Tower({ agent, x, big = false }: { agent: Agent; x: number; big?: boolean }) {
  const cells = useMemo(() => towerCells(agent.segs), [agent.segs]);
  const layers = Math.ceil(cells.length / (PER_ROW * PER_ROW));
  const top = 0.2 + layers * PITCH;
  return (
    <group position={[x, -1.2, 0]}>
      <mesh position={[0, -0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[big ? 0.72 : 0.58, big ? 0.8 : 0.64, 0.16, 48]} />
        <meshStandardMaterial color="#4E5A59" metalness={0.5} roughness={0.35} />
      </mesh>
      {big ? (
        <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.025, 10, 64]} />
          <meshStandardMaterial color="#B7833E" metalness={0.7} roughness={0.3} />
        </mesh>
      ) : null}
      {/* glass sleeve: the agent's own context window */}
      <mesh position={[0, top / 2 + 0.05, 0]}>
        <boxGeometry args={[PITCH * 2 + 0.16, top + 0.1, PITCH * 2 + 0.16]} />
        <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.1)} transparent opacity={0.16} roughness={0.2} depthWrite={false} />
      </mesh>
      <Lattice cells={cells} size={0.26} />
      <Tag position={[0, top + 0.35, 0]} tone="ink" size="xs" center>{nfmt(size(agent.segs)) + " tok"}</Tag>
      <Tag position={[0, -0.42, 0.7]} tone={big ? "amber" : "teal"} size="xs" center>
        <span className="normal-case">{agent.name}</span>
      </Tag>
    </group>
  );
}

function TowerScene({ agents, arch }: { agents: Agent[]; arch: Arch }) {
  const solo = arch === "solo";
  const mx = solo ? 0 : -1.9;
  const wx = 1.9;
  const worker = agents[1];
  const discard: Cell[] = useMemo(() => {
    if (!worker || !worker.pruned) return [];
    return Array.from({ length: worker.pruned * 2 }, (_, j) => ({ position: [wx + 1.3 + (j % 4) * 0.22, -1.1 + Math.floor(j / 4) * 0.22, 0.55] as V3, color: mixHex(P.paper, P.rose, 0.4) }));
  }, [worker, wx]);
  return (
    <PointerTilt amount={0.05}>
      <group>
        <ShadowBlob position={[0, -1.58, 0.1]} scale={8} opacity={0.1} />
        <RoundedBox position={[0, -1.45, 0]} args={[7.8, 0.22, 2.4]} radius={0.1} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#2D3436" roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <Tower agent={agents[0]} x={mx} big={!solo} />
        {worker ? <Tower agent={worker} x={wx} /> : null}
        {worker ? (
          <>
            <Flow points={[[mx + 0.45, -0.3, 0.2], [0, 0.3, 0.5], [wx - 0.45, -0.3, 0.2]]} color={P.inkSoft} count={1} size={0.04} speed={0.25} lineOpacity={0.35} />
            <Flow points={[[wx - 0.45, 0.2, -0.2], [0, 0.9, -0.3], [mx + 0.45, 0.2, -0.2]]} color={P.violet} count={2} size={0.05} speed={0.2} lineOpacity={0.5} />
            <Tag position={[0, 1.1, -0.3]} tone="violet" size="xs" center>solo el resumen</Tag>
          </>
        ) : null}
        {discard.length ? (
          <>
            <Lattice cells={discard} size={0.18} opacity={0.55} />
            <Tag position={[wx + 1.63, -1.1 + Math.ceil(discard.length / 4) * 0.22 + 0.2, 0.55]} tone="rose" size="xs" center>podadas</Tag>
          </>
        ) : null}
      </group>
    </PointerTilt>
  );
}
