"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Knob, Readout } from "@/components/three/Figure";
import { Arrow, ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, Node3D, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* LlamaIndex: load → index → QueryEngine, then the engine as one tool in a
   ReAct loop, and workflows as an event graph. */
type Mode = "etl" | "engine" | "workflow";

const COPY = {
  en: {
    shaped_like_retrieval: "shaped like retrieval",
    five_stages_then_the_engine: "five stages, then an engine",
    etl: "load+index",
    engine: "query engine",
    workflow: "workflow",
    load: "load",
    chunk: "chunk",
    embed: "embed",
    store: "store",
    retrieve: "retrieve",
    query_engine: "query engine",
    as_a_tool: "as a tool",
    event_graph: "events, not an agent",
    step: "step",
  },
  es: {
    shaped_like_retrieval: "con forma de recuperación",
    five_stages_then_the_engine: "cinco etapas, luego el engine",
    etl: "carga+índice",
    engine: "query engine",
    workflow: "workflow",
    load: "carga",
    chunk: "trocea",
    embed: "embebe",
    store: "guarda",
    retrieve: "recupera",
    query_engine: "query engine",
    as_a_tool: "como tool",
    event_graph: "eventos, no un agente",
    step: "paso",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("etl");

  const chunkCells = Array.from({ length: 12 }, (_, i) => ({
    position: [-0.9 + (i % 6) * 0.36, -0.3 + Math.floor(i / 6) * 0.36, 0] as [number, number, number],
    color: P.violet,
  }));

  return (
    <Figure
      label={t.shaped_like_retrieval}
      hint={t.five_stages_then_the_engine}
      legend={[
        { color: P.teal, label: t.etl },
        { color: P.violet, label: t.engine },
        { color: P.amber, label: t.workflow },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "etl", label: t.etl, tone: P.teal },
            { value: "engine", label: t.engine, tone: P.violet },
            { value: "workflow", label: t.workflow, tone: P.amber },
          ]}
          ariaLabel={t.five_stages_then_the_engine}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "etl" && (
          <>
            <Slab position={[-2.4, 0.9, 0]} size={[1.4, 1.3, 0.12]} color={P.teal} fill={0.18} />
            <Tag position={[-2.4, 1.75, 0.15]} tone="teal">{t.load}</Tag>
            <Flow points={[[-1.7, 0.9, 0], [-1.0, 0.9, 0]]} color={P.teal} count={2} size={0.05} />
            <Lattice cells={chunkCells} size={0.17} opacity={0.9} />
            <Tag position={[0, 0.4, 0.15]} tone="violet" size="xs">{t.chunk}</Tag>
            <Flow points={[[1.0, -0.1, 0], [1.9, 0.4, 0]]} color={P.violet} count={3} size={0.05} />
            <Slab position={[2.5, 0.5, 0]} size={[1.1, 1.2, 0.14]} color={P.amber} fill={0.2} />
            <Tag position={[2.5, 1.35, 0.15]} tone="amber">{t.embed}</Tag>
            <Flow points={[[2.5, -0.15, 0], [2.5, -0.9, 0]]} color={P.amber} count={2} size={0.05} />
            <Slab position={[2.5, -1.35, 0]} size={[1.1, 0.5, 0.12]} color={P.teal} fill={0.26} />
            <Tag position={[2.5, -1.85, 0.15]} tone="teal">{t.store}</Tag>
            <Tag position={[-0.4, -1.4, 0.15]} tone="muted" size="xs">llamahub → vector store</Tag>
          </>
        )}

        {mode === "engine" && (
          <>
            {/* the ReAct loop on the left, QueryEngine as a tool on the right */}
            <Node3D position={[-2.0, 0.5, 0]} color={P.teal} radius={0.17} pulse={0.2} />
            <Node3D position={[-0.9, 0.5, 0]} color={P.amber} radius={0.17} />
            <Node3D position={[-2.0, -0.55, 0]} color={P.violet} radius={0.17} />
            <Tag position={[-2.0, 0.95, 0.15]} tone="teal" size="xs">think</Tag>
            <Tag position={[-0.9, 0.95, 0.15]} tone="amber" size="xs">act</Tag>
            <Tag position={[-2.0, -1.0, 0.15]} tone="violet" size="xs">observe</Tag>
            <Flow points={[[-1.8, 0.5, 0], [-1.1, 0.5, 0]]} color={P.teal} count={2} size={0.045} />
            <Flow points={[[-0.9, 0.3, 0], [-2.0, -0.35, 0]]} color={P.amber} count={2} size={0.045} />
            {/* the tool call to QueryEngine */}
            <Flow points={[[-0.65, 0.5, 0], [0.7, 0.5, 0]]} color={P.violet} count={3} />
            <Slab position={[1.6, 0.5, 0]} size={[1.6, 1.3, 0.14]} color={P.violet} fill={0.2} />
            <Tag position={[1.6, 1.4, 0.15]} tone="violet">{t.query_engine}</Tag>
            <Tag position={[1.6, -0.35, 0.15]} tone="violet" size="xs">{t.as_a_tool}</Tag>
            <Wire points={[[1.2, 0.2, 0], [1.0, 0.45, 0]]} color={P.violet} dashed opacity={0.5} />
          </>
        )}

        {mode === "workflow" && (
          <>
            {[
              [-2.3, 0.7, P.teal, "start"],
              [-0.7, 0.7, P.amber, "retrieve"],
              [0.9, 0.7, P.violet, "reason"],
              [2.4, 0.7, P.teal, "stop"],
            ].map(([x, y, col, lab], i) => (
              <group key={i}>
                <Node3D position={[x as number, y as number, 0]} color={col as string} radius={0.16} pulse={i * 0.3} />
                <Tag position={[x as number, (y as number) + 0.45, 0.15]} tone={col === P.teal ? "teal" : col === P.amber ? "amber" : "violet"} size="xs">{lab as string}</Tag>
              </group>
            ))}
            <Flow points={[[-2.1, 0.7, 0], [-0.9, 0.7, 0]]} color={P.teal} count={2} size={0.045} />
            <Flow points={[[-0.5, 0.7, 0], [0.7, 0.7, 0]]} color={P.amber} count={2} size={0.045} />
            <Flow points={[[1.1, 0.7, 0], [2.2, 0.7, 0]]} color={P.violet} count={2} size={0.045} />
            {/* event bus ribbon above */}
            <Wire points={[[-2.3, 1.6, 0], [2.4, 1.6, 0]]} color={P.lineStrong} dashed opacity={0.6} />
            <Tag position={[0, 2.0, 0.15]} tone="muted" size="xs">{t.event_graph}</Tag>
            {[-2.3, -0.7, 0.9, 2.4].map((x, i) => (
              <Wire key={i} points={[[x, 1.0, 0], [x, 1.55, 0]]} color={P.lineStrong} dashed opacity={0.5} />
            ))}
            <Tag position={[0, -0.5, 0.15]} tone="muted">{t.step} · event · {t.step}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Tres vistas de LlamaIndex. Ingesta: un documento de 240 tokens se trocea
   con SentenceSplitter (chunk_size y chunk_overlap), cada Node se embebe
   (bge-small-en-v1.5 da 384 dimensiones) y se guarda en Chroma. Tool: el
   QueryEngine envuelto como QueryEngineTool y el efecto de return_direct.
   Workflow: pasos disparados por eventos tipados, de StartEvent a StopEvent. */

type LiMode = "ingest" | "tool" | "workflow";
const DOC_TOKENS = 240;
const EMBED_DIM = 384;

function chunking(size: number, overlap: number) {
  const stride = Math.max(1, size - overlap);
  const chunks: { start: number; end: number }[] = [];
  for (let start = 0; start < DOC_TOKENS; start += stride) {
    chunks.push({ start, end: Math.min(DOC_TOKENS, start + size) });
    if (start + size >= DOC_TOKENS) break;
  }
  const stored = chunks.reduce((s, c) => s + (c.end - c.start), 0);
  return { chunks, nodes: chunks.length, stored, dup: stored - DOC_TOKENS, bytes: chunks.length * EMBED_DIM * 4 };
}

const W = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
};
const fmtI = (n: number) => n.toLocaleString("es-ES");

function Block({ position, size, color, clear = 0.4, glow }: { position: V3; size: V3; color: string; clear?: number; glow?: string }) {
  return (
    <RoundedBox args={size} position={position} radius={Math.min(0.07, size[1] / 3, size[0] / 3)} smoothness={3} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.42} clearcoat={clear} emissive={glow ?? "#000"} emissiveIntensity={glow ? 0.25 : 0} />
    </RoundedBox>
  );
}

function Plinth({ w, d }: { w: number; d: number }) {
  return (
    <group>
      <ShadowBlob position={[0, -0.28, 0]} scale={w + 1} opacity={0.12} />
      <RoundedBox args={[w, 0.3, d]} position={[0, -0.13, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={W.base} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[w - 0.35, 0.06, d - 0.35]} position={[0, 0.05, 0]} radius={0.03} smoothness={3} receiveShadow>
        <meshStandardMaterial color={W.baseTop} roughness={0.45} metalness={0.22} />
      </RoundedBox>
    </group>
  );
}

/* Documento → nodos → vectores → Chroma. Escala: 1 token = 0,02 unidades. */
const TOK = 0.02;
function IngestScene({ size, overlap }: { size: number; overlap: number }) {
  const c = chunking(size, overlap);
  const docW = DOC_TOKENS * TOK;
  const x0 = -docW / 2;
  return (
    <group>
      <Plinth w={docW + 2.6} d={5.2} />
      {/* documento: una tira de 240 tokens */}
      <group position={[0, 0.1, -1.7]}>
        <Block position={[0, 0.1, 0]} size={[docW, 0.18, 0.55]} color={P.paper} />
        {Array.from({ length: 24 }, (_, i) => (
          <mesh key={i} position={[x0 + (i + 0.5) * (docW / 24), 0.2, 0]}>
            <boxGeometry args={[0.012, 0.01, 0.45]} />
            <meshStandardMaterial color={W.steel} />
          </mesh>
        ))}
        <Tag position={[x0 - 0.2, 0.25, 0]} tone="teal" size="xs" center>Document</Tag>
      </group>
      {/* nodos: cada trozo en su carril, desplazado para ver el solape */}
      {c.chunks.map((ch, i) => {
        const w = (ch.end - ch.start) * TOK;
        const x = x0 + ch.start * TOK + w / 2;
        const z = -0.75 + (i % 2) * 0.45;
        const ov = i > 0 ? Math.min(overlap, ch.end - ch.start) * TOK : 0;
        return (
          <group key={i}>
            <Block position={[x, 0.22, z]} size={[w - 0.02, 0.16, 0.36]} color={mixHex(W.deck, P.violet, 0.22)} />
            {ov > 0 ? <Block position={[x0 + ch.start * TOK + ov / 2, 0.32, z]} size={[ov, 0.04, 0.37]} color={P.amber} clear={0.2} /> : null}
            {/* vector del nodo */}
            <group position={[x, 0.15, 0.7]}>
              {Array.from({ length: 6 }, (_, k) => (
                <mesh key={k} position={[0, 0.08 + k * 0.07, 0]} castShadow>
                  <boxGeometry args={[Math.min(0.3, w * 0.7), 0.05, 0.3]} />
                  <meshStandardMaterial color={mixHex(P.teal, P.violet, ((i * 7 + k * 3) % 10) / 10)} roughness={0.4} />
                </mesh>
              ))}
            </group>
          </group>
        );
      })}
      {/* Chroma: persistencia en disco */}
      <group position={[docW / 2 + 0.2, 0.08, 1.75]}>
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[0, 0.12 + k * 0.22, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.19, 40]} />
            <meshPhysicalMaterial color={mixHex(W.deck, P.teal, 0.3 + k * 0.1)} roughness={0.4} clearcoat={0.5} />
          </mesh>
        ))}
        <Tag position={[0, 0.95, 0]} tone="teal" size="xs" center>{`Chroma · ${c.nodes} vectores`}</Tag>
      </group>
      <Flow points={[[0, 0.6, 1.0], [docW / 4, 0.8, 1.5], [docW / 2 - 0.2, 0.5, 1.75]]} color={P.teal} count={3} speed={0.35} />
      <Tag position={[x0 - 0.2, 0.4, -0.5]} tone="violet" size="xs" center>{`${c.nodes} nodos`}</Tag>
      <Tag position={[x0 - 0.2, 0.4, 0.8]} tone="teal" size="xs" center>embeddings</Tag>
    </group>
  );
}

function Station({ position, label, tone, color, active = true, w = 1.2 }: { position: V3; label: string; tone: "teal" | "violet" | "amber" | "ink" | "muted"; color: string; active?: boolean; w?: number }) {
  return (
    <group position={position}>
      <Block position={[0, 0.08, 0]} size={[w + 0.3, 0.16, 1.1]} color={W.charcoal} />
      <Block position={[0, 0.45, 0]} size={[w, 0.55, 0.75]} color={active ? mixHex(W.deck, color, 0.25) : W.deck} glow={active ? color : undefined} />
      <mesh position={[0, 0.45, 0.38]}>
        <boxGeometry args={[w * 0.6, 0.08, 0.01]} />
        <meshStandardMaterial color={active ? color : W.steel} />
      </mesh>
      <Tag position={[0, 1.05, 0]} tone={active ? tone : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

function ToolScene({ direct }: { direct: boolean }) {
  return (
    <group>
      <Plinth w={10} d={4.2} />
      <Station position={[-3.4, 0.08, 0]} label="AgentWorkflow" tone="violet" color={P.violet} w={1.4} />
      <Station position={[0, 0.08, -1.2]} label="QueryEngineTool" tone="violet" color={P.violet} w={1.4} />
      <Station position={[0, 0.08, 1.35]} label="calculadora" tone="muted" color={P.amber} active={false} />
      <Station position={[3.4, 0.08, 0]} label="usuario" tone="amber" color={P.amber} />
      {/* Action: el agente llama a la herramienta */}
      <Flow points={[[-2.6, 0.7, -0.2], [-1.4, 0.95, -1.0], [-0.8, 0.6, -1.2]]} color={P.violet} count={3} speed={0.4} />
      {direct ? (
        <>
          <Flow points={[[0.8, 0.6, -1.2], [2.0, 0.95, -0.7], [2.7, 0.6, -0.1]]} color={P.teal} count={3} speed={0.4} />
          <Arrow from={[-0.8, 0.35, -0.35]} to={[-2.6, 0.35, -0.05]} color={P.faint} dashed head={0.08} />
          <Tag position={[1.9, 1.25, -0.6]} tone="teal" size="xs" center>directo al usuario</Tag>
        </>
      ) : (
        <>
          <Flow points={[[-0.8, 0.35, -0.85], [-1.8, 0.3, -0.3], [-2.6, 0.35, 0.1]]} color={P.teal} count={3} speed={0.4} offset={0.5} />
          <Flow points={[[-2.6, 0.55, 0.4], [0, 0.45, 0.2], [2.7, 0.55, 0.25]]} color={P.amber} count={3} speed={0.35} />
          <Tag position={[-1.7, 0.2, -0.45]} tone="teal" size="xs" center>Observation</Tag>
        </>
      )}
    </group>
  );
}

type Input = "pdf" | "table";
function WorkflowScene({ input }: { input: Input }) {
  const pdf = input === "pdf";
  return (
    <group>
      <Plinth w={11} d={4.4} />
      <Station position={[-4.2, 0.08, 0]} label="StartEvent" tone="teal" color={P.teal} w={1.0} />
      <Station position={[-2.1, 0.08, 0]} label="@step detecta" tone="ink" color={P.inkSoft} w={1.0} />
      <Station position={[0, 0.08, -1.0]} label="@step PDF" tone="violet" color={P.violet} active={pdf} w={1.0} />
      <Station position={[0, 0.08, 1.0]} label="@step tabla" tone="violet" color={P.violet} active={!pdf} w={1.0} />
      <Station position={[2.1, 0.08, 0]} label="@step responde" tone="ink" color={P.inkSoft} w={1.0} />
      <Station position={[4.2, 0.08, 0]} label="StopEvent" tone="teal" color={P.teal} w={1.0} />
      <Flow points={[[-3.6, 0.6, 0], [-2.7, 0.6, 0]]} color={P.teal} count={2} speed={0.4} />
      <Flow points={pdf ? [[-1.5, 0.6, -0.1], [-0.9, 0.7, -0.8], [-0.6, 0.6, -1.0]] : [[-1.5, 0.6, 0.1], [-0.9, 0.7, 0.8], [-0.6, 0.6, 1.0]]} color={P.amber} count={2} speed={0.4} />
      <Flow points={pdf ? [[0.6, 0.6, -1.0], [1.1, 0.7, -0.6], [1.5, 0.6, -0.1]] : [[0.6, 0.6, 1.0], [1.1, 0.7, 0.6], [1.5, 0.6, 0.1]]} color={P.violet} count={2} speed={0.4} />
      <Flow points={[[2.7, 0.6, 0], [3.6, 0.6, 0]]} color={P.teal} count={2} speed={0.4} />
      <Arrow from={[-1.5, 0.3, pdf ? 0.3 : -0.3]} to={[-0.6, 0.3, pdf ? 0.9 : -0.9]} color={P.faint} dashed head={0.07} />
      <Tag position={[-1.0, 0.3, 0]} tone="amber" size="xs" center>{pdf ? "PdfEvent" : "TableEvent"}</Tag>
      <Tag position={[1.05, 0.3, 0]} tone="violet" size="xs" center>AnswerEvent</Tag>
    </group>
  );
}

function IngestNote({ size, overlap }: { size: number; overlap: number }) {
  const c = chunking(size, overlap);
  return (
    <div className="space-y-3">
      <p><strong>Carga → trocea → embebe → guarda.</strong> SimpleDirectoryReader entrega Documents; un IngestionPipeline con SentenceSplitter los parte en Nodes que siguen apuntando al documento padre; HuggingFaceEmbedding los convierte en vectores y Chroma los persiste para no re-embeber en cada arranque. El ámbar marca el solape repetido entre nodos vecinos.</p>
      <Readout items={[
        { label: "nodos", value: String(c.nodes), tone: "var(--violet)" },
        { label: "tokens embebidos", value: `${fmtI(c.stored)} (${fmtI(c.dup)} repetidos)`, tone: "var(--amber)" },
        { label: "vectores en Chroma", value: `${c.nodes} × ${EMBED_DIM} × 4 B = ${fmtI(c.bytes)} B`, tone: "var(--teal)" },
      ]} />
      <p className="text-xs text-muted">Documento didáctico de {DOC_TOKENS} tokens; paso = chunk_size − chunk_overlap = {Math.max(1, size - overlap)}. El chunk_size = 25 del curso es pedagógico: tus PDFs quieren un tamaño medido. Usa el mismo modelo de embeddings al consultar.</p>
    </div>
  );
}

function ToolNote({ direct }: { direct: boolean }) {
  return (
    <div className="space-y-2">
      <p><strong>El QueryEngine como herramienta.</strong> QueryEngineTool lo envuelve con nombre y descripción para que el LLM decida cuándo usarlo; la calculadora es la segunda herramienta que da a dónde saltar. {direct ? "Con return_direct=True la salida de la herramienta va directa al usuario: el agente no la ve ni puede continuar." : "Con return_direct=False el agente recibe la recuperación como Observation y puede razonar, llamar otra herramienta o responder."}</p>
      <Readout items={[{ label: "return_direct", value: direct ? "True" : "False", tone: "var(--teal)" }, { label: "vueltas del agente tras la tool", value: direct ? "0" : "≥ 1", tone: "var(--violet)" }]} />
      <p className="text-xs text-muted">AgentWorkflow usa function calling si el LLM lo tiene y, si no, ReAct. Es stateless por defecto: pasa un Context para conservar memoria entre run.</p>
    </div>
  );
}

function WorkflowNote({ input }: { input: Input }) {
  return (
    <div className="space-y-2">
      <p><strong>Eventos, no un agente escondido.</strong> Cada @step es un método async que recibe un evento tipado y emite otro. StartEvent entra, StopEvent sale. Aquí hay una horquilla real: el paso de detección emite {input === "pdf" ? "PdfEvent" : "TableEvent"} y solo el paso que escucha ese tipo se ejecuta.</p>
      <Readout items={[{ label: "pasos ejecutados", value: "3 de 4", tone: "var(--violet)" }, { label: "timeout", value: "10 s (constructor)", tone: "var(--amber)" }]} />
      <p className="text-xs text-muted">Un workflow de un solo paso que llama a un query engine es un query engine con ceremonia: añade eventos cuando hay una bifurcación real.</p>
    </div>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<LiMode>("ingest");
  const [size, setSize] = useState(60);
  const [overlap, setOverlap] = useState(10);
  const [direct, setDirect] = useState(false);
  const [input, setInput] = useState<Input>("pdf");
  const safeOverlap = Math.min(overlap, size - 5);
  return (
    <Figure
      label="LlamaIndex · ingesta, herramienta y workflow"
      hint="Document → Node → vector → Chroma · QueryEngineTool · eventos"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "datos y vectores" },
        { color: P.violet, label: "nodos / agente" },
        { color: P.amber, label: "solape / evento" },
      ]}
      note={mode === "ingest" ? <IngestNote size={size} overlap={safeOverlap} /> : mode === "tool" ? <ToolNote direct={direct} /> : <WorkflowNote input={input} />}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Vista" options={[
            { value: "ingest", label: "Ingesta", tone: P.teal },
            { value: "tool", label: "Como herramienta", tone: P.violet },
            { value: "workflow", label: "Workflow", tone: P.amber },
          ]} />
          {mode === "ingest" ? (
            <>
              <Knob label="chunk_size" value={size} min={25} max={120} step={5} onChange={setSize} tone="var(--violet)" />
              <Knob label="overlap" value={safeOverlap} min={0} max={20} step={5} onChange={setOverlap} tone="var(--amber)" />
            </>
          ) : mode === "tool" ? (
            <Switcher value={direct ? "t" : "f"} onChange={(v) => setDirect(v === "t")} ariaLabel="return_direct" options={[
              { value: "f", label: "return_direct=False", tone: P.teal },
              { value: "t", label: "return_direct=True", tone: P.amber },
            ]} />
          ) : (
            <Switcher value={input} onChange={setInput} ariaLabel="Entrada" options={[
              { value: "pdf", label: "Entrada PDF", tone: P.violet },
              { value: "table", label: "Entrada tabla", tone: P.violet },
            ]} />
          )}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.5, 6, 9.5], fov: 34 }} fit={1.08}>
        <PointerTilt amount={0.04}>
          {mode === "ingest" ? <IngestScene size={size} overlap={safeOverlap} /> : mode === "tool" ? <ToolScene direct={direct} /> : <WorkflowScene input={input} />}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}
