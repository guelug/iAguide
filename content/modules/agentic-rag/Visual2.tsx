"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, ShadowBlob, Slab, Tag, Wire, useCycle, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Mesa de despacho de Alfred.
 *
 * Seis preguntas de la gala pasan una a una por el agente. Cada tool tiene
 * una descripción (palabras clave). El modelo de juguete elige la tool con
 * más palabras en común con la pregunta; si ninguna coincide, responde sin
 * herramienta. En modo clásico no hay elección: todo va al índice. En el
 * tercer modo la descripción de guest_bio dice «úsala siempre», y eso pesa
 * +2 en la puntuación: el agente se convierte en RAG clásico con disfraz.
 * Las pilas de fichas cuentan las llamadas acumuladas en la sesión.
 */

type DispatchMode = "classic" | "agentic" | "always";
type ToolId = "guest_bio" | "web_search" | "tiempo" | "hub_stats" | "directa";

type ToolDef = { id: ToolId; label: string; words: string[]; color: string; tone: "teal" | "amber" | "violet" | "rose" | "muted" | "ink" };

const TOOLS: ToolDef[] = [
  { id: "guest_bio", label: "guest_bio", words: ["invitado", "invitada", "bio", "ada", "curie", "tesla", "gusta"], color: P.amber, tone: "amber" },
  { id: "web_search", label: "web_search", words: ["noticias", "hoy", "web", "actual"], color: P.violet, tone: "violet" },
  { id: "tiempo", label: "tiempo", words: ["lloverá", "fuegos", "viento", "tiempo"], color: P.teal, tone: "teal" },
  { id: "hub_stats", label: "hub_stats", words: ["descargas", "modelo", "hub"], color: "#3E6FA8", tone: "ink" },
  { id: "directa", label: "sin tool", words: [], color: P.muted, tone: "muted" },
];

type Q = { text: string; words: string[]; right: ToolId };

const QUEUE: Q[] = [
  { text: "¿Quién es la invitada Curie?", words: ["invitada", "curie", "quién"], right: "guest_bio" },
  { text: "¿Lloverá a las 22 h para los fuegos?", words: ["lloverá", "fuegos", "hora"], right: "tiempo" },
  { text: "¿Cuántas descargas tiene el modelo?", words: ["descargas", "modelo", "cuántas"], right: "hub_stats" },
  { text: "¿Qué noticias de ciencia hay hoy?", words: ["noticias", "ciencia", "hoy"], right: "web_search" },
  { text: "¿Cuánto es 17 × 3?", words: ["cuánto", "17", "3"], right: "directa" },
  { text: "¿Qué le gusta a Ada?", words: ["gusta", "ada"], right: "guest_bio" },
];

function route(q: Q, mode: DispatchMode): { tool: ToolId; scores: number[] } {
  const scores = TOOLS.map((t) => {
    if (t.id === "directa") return 0;
    const overlap = q.words.filter((w) => t.words.includes(w)).length;
    return overlap + (mode === "always" && t.id === "guest_bio" ? 2 : 0);
  });
  if (mode === "classic") return { tool: "guest_bio", scores };
  const best = Math.max(...scores);
  return { tool: best === 0 ? "directa" : TOOLS[scores.indexOf(best)].id, scores };
}

const HUB: V3 = [0.2, 0, 0];
const RADIUS = 2.95;
const ANGLES = [72, 36, 0, -36, -72].map((d) => (d * Math.PI) / 180);
const dockPos = (i: number): V3 => [HUB[0] + Math.cos(ANGLES[i]) * RADIUS, 0, HUB[2] - Math.sin(ANGLES[i]) * RADIUS];

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

/** Rotates the selector arm towards the chosen dock. */
function Arm({ angle, color }: { angle: number; color: string }) {
  const ref = useRef<Group>(null);
  const placed = useRef(false);
  const { still } = useStage();
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    if (!ref.current) return;
    if (!placed.current || still) { ref.current.rotation.y = angle; placed.current = true; invalidate(); }
  }, [angle, still, invalidate]);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g || still) return;
    g.rotation.y += (angle - g.rotation.y) * Math.min(1, dt * 4);
  });
  return (
    <group ref={ref} position={[HUB[0], 0.42, HUB[2]]}>
      <mesh position={[0.85, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.5, 16]} />
        <meshStandardMaterial color="#B68442" metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[1.65, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <coneGeometry args={[0.12, 0.26, 20]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>
    </group>
  );
}

function DockIcon({ id, color }: { id: ToolId; color: string }) {
  if (id === "guest_bio") return (
    <group position={[0, 0.34, 0]}>
      <RoundedBox args={[0.62, 0.3, 0.46]} radius={0.04} smoothness={2} castShadow><Physical color="#4A3A2C" rough={0.6} coat={0.2} /></RoundedBox>
      {[-0.18, -0.06, 0.06, 0.18].map((x) => (
        <mesh key={x} position={[x, 0.24, 0]} castShadow><boxGeometry args={[0.03, 0.22, 0.36]} /><meshStandardMaterial color="#F1EBDD" roughness={0.7} /></mesh>
      ))}
    </group>
  );
  if (id === "web_search") return (
    <group position={[0, 0.5, 0]}>
      <mesh castShadow><sphereGeometry args={[0.28, 28, 20]} /><Physical color={mixHex(P.paper, color, 0.35)} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.29, 0.012, 8, 40]} /><meshStandardMaterial color={color} /></mesh>
      <mesh><torusGeometry args={[0.29, 0.012, 8, 40]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  );
  if (id === "tiempo") return (
    <group position={[0, 0.25, 0]}>
      <mesh position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.07, 0.07, 0.6, 16]} /><meshPhysicalMaterial color="#E9F1F0" transparent opacity={0.5} roughness={0.05} /></mesh>
      <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.045, 0.045, 0.36, 12]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, -0.05, 0]} castShadow><sphereGeometry args={[0.11, 20, 14]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  );
  if (id === "hub_stats") return (
    <group position={[0, 0.12, 0]}>
      {[0.18, 0.34, 0.5].map((h, i) => (
        <RoundedBox key={i} args={[0.14, h, 0.14]} position={[(i - 1) * 0.2, h / 2, 0]} radius={0.03} smoothness={2} castShadow><Physical color={color} /></RoundedBox>
      ))}
    </group>
  );
  return (
    <group position={[0, 0.16, 0]}>
      <RoundedBox args={[0.6, 0.06, 0.42]} radius={0.02} smoothness={2} castShadow><Physical color="#E6E1D4" /></RoundedBox>
    </group>
  );
}

function Dock({ i, tool, calls, active }: { i: number; tool: ToolDef; calls: number; active: boolean }) {
  const pos = dockPos(i);
  return (
    <group position={pos}>
      <RoundedBox args={[1.0, 0.18, 1.0]} position={[0, 0.02, 0]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <Physical color={active ? mixHex(P.paper, tool.color, 0.4) : "#DDD7C9"} rough={0.5} coat={0.3} />
      </RoundedBox>
      <DockIcon id={tool.id} color={tool.color} />
      {/* one coin per call made in this session so far */}
      {Array.from({ length: calls }, (_, k) => (
        <mesh key={k} position={[0.36, 0.14 + k * 0.07, 0.34]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.055, 22]} />
          <meshStandardMaterial color={tool.color} metalness={0.35} roughness={0.35} />
        </mesh>
      ))}
      {active && <Halo position={[0, 0.12, 0]} radius={0.62} color={tool.color} opacity={0.5} spin={0.3} />}
      <Tag position={[0, 1.15, 0]} tone={tool.tone} size="xs" center>{tool.label}</Tag>
    </group>
  );
}

function QueueRail({ index, results }: { index: number; results: { tool: ToolId }[] }) {
  return (
    <group position={[-2.6, 0, 0]}>
      <RoundedBox args={[1.1, 0.12, 4.4]} position={[0, -0.02, 0]} radius={0.04} smoothness={2} receiveShadow castShadow>
        <Physical color="#394844" rough={0.45} coat={0.3} metal={0.3} />
      </RoundedBox>
      {[-0.44, 0.44].map((x) => (
        <mesh key={x} position={[x, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 4.3, 10]} />
          <meshStandardMaterial color="#9C9C94" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {QUEUE.map((q, k) => {
        const done = k < index;
        const now = k === index;
        const z = (k - (QUEUE.length - 1) / 2) * 0.68;
        const tool = TOOLS.find((t) => t.id === results[k].tool)!;
        return (
          <group key={k} position={[now ? 0.35 : 0, now ? 0.3 : 0.13, z]}>
            <RoundedBox args={[0.72, 0.06, 0.5]} radius={0.02} smoothness={2} castShadow>
              <Physical color={now ? P.amberWash : done ? mixHex("#F1EBDD", tool.color, 0.25) : "#F1EBDD"} rough={0.65} coat={0.15} />
            </RoundedBox>
            <mesh position={[-0.27, 0.04, 0]}><boxGeometry args={[0.07, 0.01, 0.4]} /><meshBasicMaterial color={done || now ? tool.color : P.line} /></mesh>
          </group>
        );
      })}
      <Tag position={[0, -0.05, 1.95]} tone="muted" size="xs" center>cola de preguntas</Tag>
    </group>
  );
}

function DispatchScene({ mode, index, results }: { mode: DispatchMode; index: number; results: { tool: ToolId }[] }) {
  const current = results[index].tool;
  const ti = TOOLS.findIndex((t) => t.id === current);
  const tool = TOOLS[ti];
  const calls = TOOLS.map((t) => results.slice(0, index + 1).filter((r) => r.tool === t.id).length);
  const target = dockPos(ti);
  const qz = (index - (QUEUE.length - 1) / 2) * 0.68;
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -0.12, 0]} scale={8.5} opacity={0.08} />
        <RoundedBox args={[8.0, 0.14, 7.0]} position={[0.55, -0.16, 0]} radius={0.06} smoothness={3} receiveShadow>
          <Physical color="#6E5440" rough={0.6} coat={0.15} />
        </RoundedBox>
        <QueueRail index={index} results={results} />
        {/* the agent: a turret that points at one tool per question */}
        <group position={HUB}>
          <mesh position={[0, 0.12, 0]} castShadow receiveShadow><cylinderGeometry args={[0.72, 0.8, 0.24, 40]} /><Physical color="#263532" metal={0.3} coat={0.35} /></mesh>
          <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.46, 0.5, 0.16, 36]} /><Physical color={mode === "classic" ? P.lineStrong : P.violet} coat={0.5} /></mesh>
          {mode === "classic" && (
            <mesh position={[0.62, 0.42, -0.2]} castShadow><boxGeometry args={[0.18, 0.2, 0.18]} /><meshStandardMaterial color="#B68442" metalness={0.7} roughness={0.3} /></mesh>
          )}
          <Tag position={[0, -0.05, 0.95]} tone={mode === "classic" ? "muted" : "violet"} size="xs" center>{mode === "classic" ? "tubería fija" : "agente decide"}</Tag>
        </group>
        <Arm angle={ANGLES[ti]} color={tool.color} />
        {TOOLS.map((t, i) => <Dock key={t.id} i={i} tool={t} calls={calls[i]} active={i === ti} />)}
        <Flow key={`q-${index}`} points={[[-2.25, 0.35, qz], [-1.2, 0.5, qz * 0.5], [HUB[0] - 0.4, 0.45, 0]]} color={P.amber} count={3} size={0.045} speed={0.45} lineOpacity={0.3} />
        <Flow key={`t-${index}-${mode}`} points={[[HUB[0] + 0.5, 0.5, 0], [(HUB[0] + target[0]) / 2, 0.9, target[2] / 2], [target[0], 0.6, target[2]]]} color={tool.color} count={3} size={0.05} speed={0.45} lineOpacity={0.35} />
        {mode === "classic" && current === "guest_bio" && QUEUE[index].right !== "guest_bio" && (
          <Tag position={[target[0], 1.45, target[2]]} tone="rose" size="xs" center>tool equivocada</Tag>
        )}
      </group>
    </PointerTilt>
  );
}

/** Reports the stage's stillness (reduced motion or the viewer's pause) to the plate. */
function StillProbe({ onChange }: { onChange: (still: boolean) => void }) {
  const { still } = useStage();
  useEffect(() => onChange(still), [still, onChange]);
  return null;
}

function SpanishVisual() {
  const [mode, setMode] = useState<DispatchMode>("agentic");
  const [still, setStill] = useState(false);
  const [index, setIndex] = useCycle(QUEUE.length, 2.6, still);
  const results = useMemo(() => QUEUE.map((q) => route(q, mode)), [mode]);
  const q = QUEUE[index];
  const r = results[index];
  const chosen = TOOLS.find((t) => t.id === r.tool)!;
  const indexCalls = results.filter((x) => x.tool === "guest_bio").length;
  const right = results.filter((x, k) => x.tool === QUEUE[k].right).length;
  const summary =
    mode === "classic"
      ? "Retrieve-then-read: cada pregunta pega en el índice de invitados, también la aritmética, el tiempo y las noticias. No hay frontera de decisión."
      : mode === "agentic"
        ? "Retrieve es una tool con nombre. El agente compara la pregunta con la descripción de cada tool y puede saltarse el índice, o no usar ninguna tool si la pregunta es aritmética."
        : "La descripción de guest_bio dice «úsala siempre». En este modelo de juguete eso suma 2 puntos y la tool gana preguntas que no le tocan: es RAG clásico con disfraz. Arregla la descripción antes de hacer fine-tune.";
  return (
    <Figure
      label="Mesa de despacho · ¿cuándo recuperar?"
      hint="6 preguntas · una tool por turno"
      height="h-[460px] md:h-[560px]"
      legend={TOOLS.map((t) => ({ color: t.color, label: t.label }))}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Modo de despacho" options={[
            { value: "classic", label: "Clásico", tone: P.amber },
            { value: "agentic", label: "Agéntico", tone: P.violet },
            { value: "always", label: "Descripción «siempre»", tone: P.rose },
          ]} />
          <div className="flex items-center gap-1 rounded-full border border-line px-1 py-0.5" role="group" aria-label="Pregunta en curso">
            <button type="button" className="chip min-w-8 px-2" aria-label="Pregunta anterior" onClick={() => setIndex((index + QUEUE.length - 1) % QUEUE.length)}>←</button>
            <span className="px-1 font-mono text-[0.6rem] tabular-nums text-muted">pregunta {index + 1}/{QUEUE.length}</span>
            <button type="button" className="chip min-w-8 px-2" aria-label="Pregunta siguiente" onClick={() => setIndex((index + 1) % QUEUE.length)}>→</button>
          </div>
        </>
      }
      note={
        <div className="space-y-3">
          <p><strong>{q.text}</strong> → <code>{chosen.id === "directa" ? "respuesta sin tool" : chosen.id}</code>. {summary}</p>
          <Readout items={[
            { label: "llamadas al índice", value: `${indexCalls} de ${QUEUE.length}`, tone: "var(--amber)" },
            { label: "tool adecuada", value: `${right} de ${QUEUE.length}`, tone: right === QUEUE.length ? "var(--teal)" : "var(--rose)" },
            { label: "puntuación elegida", value: mode === "classic" ? "sin elección" : String(Math.max(...r.scores)) },
          ]} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[26rem] border-collapse text-left text-xs">
              <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><tr><th className="border-b border-line px-2 py-1">#</th><th className="border-b border-line px-2 py-1">pregunta</th><th className="border-b border-line px-2 py-1">elige</th><th className="border-b border-line px-2 py-1">debería</th></tr></thead>
              <tbody>{QUEUE.map((x, k) => <tr key={k} className={k === index ? "text-ink" : "text-muted"}><td className="border-b border-line/60 px-2 py-1 font-mono">{k + 1}</td><td className="border-b border-line/60 px-2 py-1">{x.text}</td><td className="border-b border-line/60 px-2 py-1 font-mono" style={{ color: results[k].tool === x.right ? "var(--teal)" : "var(--rose)" }}>{results[k].tool}</td><td className="border-b border-line/60 px-2 py-1 font-mono">{x.right}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="text-xs text-muted">Modelo de juguete: puntuación = palabras de la pregunta presentes en la descripción de la tool (+2 si la descripción dice «siempre»); con cero coincidencias, responde sin tool. Un LLM real no cuenta palabras, pero se deja guiar por la descripción del mismo modo. Las fichas apiladas cuentan las llamadas acumuladas hasta la pregunta actual.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.5, 6.2, 8.6], fov: 34 }} fit={1.06}>
        <StillProbe onChange={setStill} />
        <DispatchScene mode={mode} index={index} results={results} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

/* Classic RAG vs agentic RAG, and when NOT to retrieve. */
type Mode = "classic" | "agentic" | "when";

const COPY = {
  en: {
    rag_classic_vs_agentic: "rag: classic vs agentic",
    the_agent_decides_to_retrieve: "the agent decides to retrieve",
    classic: "classic",
    agentic: "agentic",
    when_not: "when not",
    retrieve_first: "retrieve first",
    answer: "answer",
    agent_decides: "agent decides",
    query: "query",
    chunks: "chunks",
    cite: "cite",
    direct_answer: "direct answer",
    no_retrieval: "no retrieval",
  },
  es: {
    rag_classic_vs_agentic: "rag: clásico vs agéntico",
    the_agent_decides_to_retrieve: "el agente decide recuperar",
    classic: "clásico",
    agentic: "agéntico",
    when_not: "cuándo no",
    retrieve_first: "recupera primero",
    answer: "respuesta",
    agent_decides: "decide el agente",
    query: "consulta",
    chunks: "chunks",
    cite: "cita",
    direct_answer: "respuesta directa",
    no_retrieval: "sin recuperar",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("agentic");

  return (
    <Figure
      label={t.rag_classic_vs_agentic}
      hint={t.the_agent_decides_to_retrieve}
      legend={[
        { color: P.teal, label: t.classic },
        { color: P.violet, label: t.agentic },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "classic", label: t.classic, tone: P.teal },
            { value: "agentic", label: t.agentic, tone: P.violet },
            { value: "when", label: t.when_not, tone: P.amber },
          ]}
          ariaLabel={t.rag_classic_vs_agentic}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "classic" && (
          <>
            {/* query → retriever → chunks → prompt+answer. No decision. */}
            <Node3D position={[-2.6, 0.7, 0]} color={P.teal} radius={0.15} />
            <Tag position={[-2.6, 1.15, 0.15]} tone="teal" size="xs">{t.query}</Tag>
            <Flow points={[[-2.35, 0.7, 0], [-1.2, 0.7, 0]]} color={P.teal} count={2} size={0.05} />
            <Slab position={[-0.4, 0.7, 0]} size={[1.5, 0.9, 0.14]} color={P.violet} fill={0.2} />
            <Tag position={[-0.4, 1.4, 0.15]} tone="violet" size="xs">{t.retrieve_first}</Tag>
            <Flow points={[[0.35, 0.7, 0], [1.4, 0.7, 0]]} color={P.violet} count={3} size={0.05} />
            {[0, 1, 2].map((i) => (
              <Node3D key={i} position={[1.9, 1.1 - i * 0.4, 0]} color={P.violet} radius={0.11} matte />
            ))}
            <Tag position={[2.4, 0.7, 0.15]} tone="violet" size="xs">{t.chunks}</Tag>
            <Flow points={[[1.9, 0.25, 0], [1.4, -0.8, 0]]} color={P.amber} count={3} />
            <Slab position={[0.6, -1.0, 0]} size={[2.2, 0.5, 0.12]} color={P.amber} fill={0.22} />
            <Tag position={[0.6, -1.5, 0.15]} tone="amber">{t.answer}</Tag>
          </>
        )}

        {mode === "agentic" && (
          <>
            {/* the agent in the middle decides when to pull */}
            <Halo position={[0, 0.5, 0]} radius={0.55} color={P.violet} opacity={0.55} spin={0.2} />
            <Node3D position={[0, 0.5, 0]} color={P.violet} radius={0.18} pulse={0.3} />
            <Tag position={[0, 1.25, 0.15]} tone="violet">{t.agent_decides}</Tag>
            <Node3D position={[-2.6, 0.5, 0]} color={P.teal} radius={0.14} />
            <Tag position={[-2.6, 0.95, 0.15]} tone="teal" size="xs">{t.query}</Tag>
            <Flow points={[[-2.35, 0.5, 0], [-0.6, 0.5, 0]]} color={P.teal} count={2} size={0.05} />
            {/* optional retrieval as a tool call */}
            <Slab position={[0, -1.0, 0]} size={[2.4, 0.55, 0.12]} color={P.amber} fill={0.2} />
            <Tag position={[0, -1.55, 0.15]} tone="amber" size="xs">retrieve(query)</Tag>
            <Flow points={[[0, -0.1, 0], [0, -0.7, 0]]} color={P.amber} count={2} size={0.045} />
            {/* answer with citations back to chunks */}
            {[0, 1, 2].map((i) => (
              <Node3D key={i} position={[2.5, 1.2 - i * 0.55, 0]} color={P.teal} radius={0.1} matte />
            ))}
            <Tag position={[2.5, 1.75, 0.15]} tone="teal" size="xs">{t.chunks}</Tag>
            <Slab position={[2.5, -0.8, 0]} size={[1.6, 0.55, 0.12]} color={P.teal} fill={0.24} />
            <Tag position={[2.5, -1.35, 0.15]} tone="teal">{t.answer}</Tag>
            {[0, 1, 2].map((i) => (
              <Wire key={i} points={[[2.5, 1.05 - i * 0.55, 0], [2.5, -0.5, 0]]} color={P.teal} opacity={0.35} dashed />
            ))}
            <Tag position={[3.2, -0.1, 0.15]} tone="teal" size="xs">{t.cite}</Tag>
          </>
        )}

        {mode === "when" && (
          <>
            <Node3D position={[-2.4, 0.6, 0]} color={P.teal} radius={0.16} />
            <Tag position={[-2.4, 1.1, 0.15]} tone="teal" size="xs">{t.query}</Tag>
            {/* a question the model already knows */}
            <Slab position={[0, 0.6, 0]} size={[2.4, 0.9, 0.14]} color={P.violet} fill={0.14} />
            <Tag position={[0, 1.25, 0.15]} tone="violet" size="xs">«¿capital de Francia?»</Tag>
            <Flow points={[[-2.1, 0.6, 0], [-1.2, 0.6, 0]]} color={P.teal} count={2} size={0.05} />
            <Flow points={[[1.2, 0.6, 0], [2.4, 0.6, 0]]} color={P.teal} count={2} />
            <Slab position={[2.4, 0.6, 0]} size={[1.2, 0.5, 0.12]} color={P.teal} fill={0.22} />
            <Tag position={[2.4, 1.05, 0.15]} tone="teal" size="xs">{t.direct_answer}</Tag>
            {/* retrieval gate closed */}
            <Slab position={[0, -0.95, 0]} size={[2.4, 0.55, 0.12]} color={P.rose} fill={0.08} />
            <Tag position={[0, -1.5, 0.15]} tone="rose" size="xs">{t.no_retrieval}</Tag>
            <Wire points={[[-0.6, -0.3, 0], [0.6, -0.3, 0]]} color={P.rose} dashed opacity={0.6} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
