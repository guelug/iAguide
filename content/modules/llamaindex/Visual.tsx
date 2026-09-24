"use client";
/* es-imports */
import { Line, RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Knob, Readout } from "@/components/three/Figure";
import { Arrow, PointerTilt, ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "index" | "query" | "agent";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "index_retriever_agent": "index → retriever → agent",
      "index": "index",
      "agent": "agent",
      "index_2": "Index",
      "agent_2": "Agent"
    },
    es: {
      "index_retriever_agent": "índice → retriever → agente",
      "index": "índice",
      "agent": "agente",
      "index_2": "Índice",
      "agent_2": "Agente"
    },
  });
  const [mode, setMode] = useState<Mode>("index");
  return (
    <Figure
      label={t.index_retriever_agent}
      hint="LlamaIndex is retrieval-shaped"
      legend={[
          { color: P.teal, label: t.index },
          { color: P.amber, label: "queryengine" },
          { color: P.violet, label: t.agent }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "index", label: t.index_2, tone: P.teal },
            { value: "query", label: "QueryEngine", tone: P.amber },
            { value: "agent", label: t.agent_2, tone: P.violet }
          ]}
          ariaLabel="LlamaIndex is retrieval-shaped"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.4, 0.2, 0]} size={[1.7, 1.8, 0.12]} color={P.teal} fill={mode === "index" ? 0.32 : 0.14} />
        <Tag position={[-2.4, 1.25, 0.2]} tone="teal">LlamaHub</Tag>
        <Slab position={[0, 0.2, 0]} size={[1.7, 1.8, 0.12]} color={P.amber} fill={mode === "query" ? 0.32 : 0.14} />
        <Tag position={[0, 1.25, 0.2]} tone="amber">retriever</Tag>
        <Slab position={[2.4, 0.2, 0]} size={[1.7, 1.8, 0.12]} color={P.violet} fill={mode === "agent" ? 0.32 : 0.14} />
        <Tag position={[2.4, 1.25, 0.2]} tone="violet">workflow</Tag>
        <Flow points={[[-1.5, 0.2, 0], [-0.9, 0.2, 0]]} color={P.teal} count={3} />
        <Flow points={[[0.9, 0.2, 0], [1.5, 0.2, 0]]} color={mode === "agent" ? P.violet : P.amber} count={3} />
    
      </Stage>
    </Figure>
  );
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* LlamaIndex con forma de recuperación: readers de LlamaHub → índice
   vectorial → retriever top-k → QueryEngine o agente. Los vectores son
   didácticos (3 dimensiones para poder dibujarlos sobre una semiesfera);
   la similitud coseno y el top-k se calculan aquí. */

type Question = "gala" | "math";
type Engine = "engine" | "agent";

const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const NODES = [
  { id: "menu", text: "menú gala", v: norm([0.9, 0.5, 0.2]) },
  { id: "guests", text: "invitados", v: norm([0.7, 0.6, -0.4]) },
  { id: "music", text: "orquesta", v: norm([0.5, 0.8, 0.1]) },
  { id: "inv3", text: "factura marzo", v: norm([-0.8, 0.45, 0.3]) },
  { id: "inv4", text: "factura abril", v: norm([-0.75, 0.5, 0.45]) },
  { id: "train", text: "horario tren", v: norm([-0.2, 0.6, -0.8]) },
  { id: "recipe", text: "receta tarta", v: norm([0.6, 0.35, 0.72]) },
  { id: "wifi", text: "clave wifi", v: norm([-0.3, 0.9, 0.3]) },
];
const QUESTIONS: Record<Question, { text: string; v: V3; needsCorpus: boolean }> = {
  gala: { text: "¿Qué se sirve en la gala?", v: norm([0.85, 0.45, 0.35]), needsCorpus: true },
  math: { text: "¿Cuánto es 3 × 4?", v: norm([0.15, 0.2, -0.95]), needsCorpus: false },
};

function retrieve(question: Question, engine: Engine, k: number) {
  const q = QUESTIONS[question];
  const scored = NODES.map((n) => ({ ...n, score: n.v[0] * q.v[0] + n.v[1] * q.v[1] + n.v[2] * q.v[2] })).sort((a, b) => b.score - a.score);
  /* El agente decide: si la pregunta no va del corpus, usa la calculadora. */
  const skips = engine === "agent" && !q.needsCorpus;
  const top = skips ? [] : scored.slice(0, k);
  return { q, scored, top, skips, tool: skips ? "calculadora" : engine === "agent" ? "QueryEngineTool" : "QueryEngine" };
}

const L = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
  glass: "#DCE8E5",
};
const DOME_C: V3 = [0, 0.3, 0];
const DOME_R = 1.8;
const onDome = (v: V3, r = DOME_R): V3 => [DOME_C[0] + v[0] * r, DOME_C[1] + v[1] * r, DOME_C[2] + v[2] * r];
const fmt2 = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Block({ position, size, color, clear = 0.4 }: { position: V3; size: V3; color: string; clear?: number }) {
  return (
    <RoundedBox args={size} position={position} radius={Math.min(0.07, size[1] / 3)} smoothness={3} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.42} clearcoat={clear} />
    </RoundedBox>
  );
}

function LlamaHubRack() {
  const readers = ["SimpleDirectoryReader", "LlamaParse", "reader web"];
  return (
    <group position={[-4.3, 0.08, 0]}>
      <Block position={[0, 0.08, 0]} size={[1.6, 0.16, 2.2]} color={L.charcoal} />
      {readers.map((r, i) => (
        <group key={r} position={[0, 0.45, -0.65 + i * 0.65]}>
          <Block position={[0, 0, 0]} size={[1.1, 0.55, 0.42]} color={i === 0 ? P.tealWash : L.deck} />
          <mesh position={[0, 0.1, 0.215]}>
            <boxGeometry args={[0.7, 0.05, 0.01]} />
            <meshStandardMaterial color={i === 1 ? P.amber : P.teal} />
          </mesh>
        </group>
      ))}
      <Tag position={[0, 1.2, -0.3]} tone="teal" size="xs" center>LlamaHub</Tag>
    </group>
  );
}

function VectorDome({ question, engine, k }: { question: Question; engine: Engine; k: number }) {
  const r = retrieve(question, engine, k);
  const topIds = new Set(r.top.map((n) => n.id));
  const qTip = onDome(r.q.v, DOME_R * 1.08);
  return (
    <group>
      {/* base del índice */}
      <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[DOME_R + 0.3, DOME_R + 0.4, 0.28, 64]} />
        <meshPhysicalMaterial color={L.charcoal} roughness={0.35} metalness={0.3} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[DOME_R, 0.03, 10, 96]} />
        <meshStandardMaterial color={L.brass} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.305, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[DOME_R, 64]} />
        <meshStandardMaterial color={mixHex(L.charcoal, P.teal, 0.2)} roughness={0.6} />
      </mesh>
      {/* cúpula de cristal: cada nodo es un vector unitario */}
      <mesh position={DOME_C}>
        <sphereGeometry args={[DOME_R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color={L.glass} roughness={0.05} transmission={0.6} transparent opacity={0.16} depthWrite={false} />
      </mesh>
      {NODES.map((n) => {
        const p = onDome(n.v);
        const hit = topIds.has(n.id);
        return (
          <group key={n.id}>
            <Line points={[DOME_C, p]} color={hit ? P.violet : L.steel} lineWidth={hit ? 1.6 : 0.8} transparent opacity={hit ? 0.9 : 0.35} />
            <mesh position={p} castShadow>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshPhysicalMaterial color={hit ? P.violet : L.deck} roughness={0.4} clearcoat={0.5} emissive={hit ? P.violet : "#000"} emissiveIntensity={hit ? 0.25 : 0} />
            </mesh>
          </group>
        );
      })}
      {/* vector de la pregunta */}
      <Arrow from={DOME_C} to={qTip} color={P.amber} width={2.4} head={0.12} />
      {r.top.slice(0, 3).map((n, i) => (
        <Tag key={n.id} position={onDome(n.v, DOME_R + 0.35 + i * 0.02)} tone="violet" size="xs" center>{`${n.text} ${fmt2(n.score)}`}</Tag>
      ))}
      <Tag position={[0, 0.35, DOME_R + 0.65]} tone="teal" size="xs" center>VectorStoreIndex</Tag>
    </group>
  );
}

function Router({ question, engine, k }: { question: Question; engine: Engine; k: number }) {
  const r = retrieve(question, engine, k);
  const calc = r.tool === "calculadora";
  return (
    <group position={[4.1, 0.08, 0]}>
      <Block position={[0, 0.08, 0]} size={[2.0, 0.16, 2.4]} color={L.deck} />
      <Block position={[0, 0.6, -0.35]} size={[1.2, 0.85, 0.9]} color={L.charcoal} clear={0.6} />
      <mesh position={[0, 0.65, 0.11]}>
        <boxGeometry args={[0.8, 0.3, 0.01]} />
        <meshStandardMaterial color={engine === "agent" ? P.violet : P.amber} emissive={engine === "agent" ? P.violet : P.amber} emissiveIntensity={0.4} />
      </mesh>
      {/* herramientas: solo el agente tiene dónde saltar */}
      <group position={[-0.45, 0.35, 0.75]}>
        <Block position={[0, 0, 0]} size={[0.6, 0.4, 0.4]} color={!calc ? P.violetWash : L.deck} />
      </group>
      {engine === "agent" ? (
        <group position={[0.45, 0.35 + (calc ? 0.15 : 0), 0.75]}>
          <Block position={[0, 0, 0]} size={[0.6, 0.4, 0.4]} color={calc ? P.amberWash : L.deck} />
        </group>
      ) : null}
      <Tag position={[0, 1.35, -0.35]} tone={engine === "agent" ? "violet" : "amber"} size="xs" center>{engine === "agent" ? "AgentWorkflow" : "QueryEngine"}</Tag>
      <Tag position={[0, 0.95, 1.2]} tone={calc ? "amber" : "violet"} size="xs" center>{engine === "engine" ? "siempre recupera" : r.tool}</Tag>
    </group>
  );
}

function RetrievalScene({ question, engine, k }: { question: Question; engine: Engine; k: number }) {
  const r = retrieve(question, engine, k);
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -0.28, 0]} scale={11} opacity={0.12} />
        <RoundedBox args={[11, 0.3, 4.6]} position={[0, -0.13, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={L.base} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[10.65, 0.06, 4.25]} position={[0, 0.05, 0]} radius={0.03} smoothness={3} receiveShadow>
          <meshStandardMaterial color={L.baseTop} roughness={0.45} metalness={0.22} />
        </RoundedBox>
        <LlamaHubRack />
        <Flow points={[[-3.5, 0.6, 0], [-2.8, 0.75, 0], [-2.2, 0.45, 0]]} color={P.teal} count={3} speed={0.35} />
        <VectorDome question={question} engine={engine} k={k} />
        {r.skips ? (
          <Arrow from={[2.8, 1.6, 1.0]} to={[1.9, 1.3, 0.6]} color={P.faint} dashed head={0.08} />
        ) : (
          <Flow points={[[2.1, 0.9, 0], [2.6, 1.1, 0.2], [3.2, 0.7, 0.4]]} color={P.violet} count={Math.max(1, r.top.length)} speed={0.4} />
        )}
        <Router question={question} engine={engine} k={k} />
        {r.skips ? <Tag position={[2.4, 1.95, 1.0]} tone="muted" size="xs" center>índice sin tocar</Tag> : null}
      </group>
    </PointerTilt>
  );
}

function RetrievalNote({ question, engine, k }: { question: Question; engine: Engine; k: number }) {
  const r = retrieve(question, engine, k);
  const lead = r.skips
    ? "El agente tiene dos herramientas y elige la calculadora: la pregunta no va del corpus y el índice ni se consulta. Ese permiso de saltar la recuperación es todo el RAG agéntico."
    : engine === "engine" && !r.q.needsCorpus
      ? `as_query_engine siempre recupera: para «3 × 4» trae igualmente ${k} ${k === 1 ? "nodo" : "nodos"} (el mejor con similitud ${fmt2(r.top[0].score)}) y se los pasa al modelo. Buscador, no agente.`
      : `El retriever compara el vector de la pregunta con cada nodo (coseno) y devuelve los ${k} más cercanos a ${r.tool}, que los lee y responde.`;
  return (
    <div className="space-y-3">
      <p><strong>{r.q.text}</strong> {lead}</p>
      <Readout items={[
        { label: "herramienta", value: r.tool, tone: r.skips ? "var(--amber)" : "var(--violet)" },
        { label: "nodos recuperados", value: String(r.top.length), tone: "var(--violet)" },
        { label: "similitud máxima", value: r.top.length ? fmt2(r.top[0].score) : "—", tone: "var(--teal)" },
      ]} />
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">cos(pregunta, nodo): {r.scored.map((n) => `${n.text} ${fmt2(n.score)}`).join(" · ")}</p>
      <p className="text-xs text-muted">Vectores didácticos de tres dimensiones para poder dibujarlos; un embedder real (p. ej. bge-small-en-v1.5) usa cientos. Usa el mismo modelo de embeddings al indexar y al consultar. similarity_top_k se defiende con evaluación, no por costumbre.</p>
    </div>
  );
}

function SpanishVisual() {
  const [question, setQuestion] = useState<Question>("gala");
  const [engine, setEngine] = useState<Engine>("engine");
  const [k, setK] = useState(3);
  return (
    <Figure
      label="LlamaIndex tiene forma de recuperación"
      hint="LlamaHub → índice → retriever → QueryEngine o agente"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "carga e índice" },
        { color: P.amber, label: "vector de la pregunta" },
        { color: P.violet, label: "nodos top-k" },
      ]}
      note={<RetrievalNote question={question} engine={engine} k={k} />}
      controls={
        <>
          <Switcher value={question} onChange={setQuestion} ariaLabel="Pregunta" options={[
            { value: "gala", label: "Pregunta del corpus", tone: P.violet },
            { value: "math", label: "3 × 4", tone: P.amber },
          ]} />
          <Switcher value={engine} onChange={setEngine} ariaLabel="Motor" options={[
            { value: "engine", label: "QueryEngine siempre", tone: P.amber },
            { value: "agent", label: "Agente con tools", tone: P.violet },
          ]} />
          <Knob label="top_k" value={k} min={1} max={5} onChange={setK} tone="var(--violet)" />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.5, 5.5, 9.5], fov: 34 }} fit={1.08}>
        <RetrievalScene question={question} engine={engine} k={k} />
      </Stage>
    </Figure>
  );
}
