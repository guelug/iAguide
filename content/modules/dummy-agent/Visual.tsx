"use client";

import { useState, useRef } from "react";
import { Figure, Switcher, Readout } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Slab, Tag, ShadowBlob, Wire, useCycle } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type Group } from "three";
import { useLocale } from "next-intl";

type Mode = "hallucinate" | "stop" | "real";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "stop_run_append": "stop · run · append",
      "do_not_let_the_model_invent_the_observation": "do not let the model invent the Observation",
      "hallucinated_obs": "hallucinated obs",
      "stop_token": "stop token",
      "real_tool": "real tool",
      "hallucinated_obs_2": "Hallucinated obs",
      "stop_token_2": "Stop token",
      "real_tool_2": "Real tool"
    },
    es: {
      "stop_run_append": "stop · run · append",
      "do_not_let_the_model_invent_the_observation": "no dejes que el modelo invente la Observation",
      "hallucinated_obs": "obs alucinada",
      "stop_token": "token de stop",
      "real_tool": "tool real",
      "hallucinated_obs_2": "Obs alucinada",
      "stop_token_2": "Token de stop",
      "real_tool_2": "Tool real"
    },
  });
  const [mode, setMode] = useState<Mode>("hallucinate");
  return (
    <Figure
      label={t.stop_run_append}
      hint={t.do_not_let_the_model_invent_the_observation}
      legend={[
          { color: P.rose, label: t.hallucinated_obs },
          { color: P.amber, label: t.stop_token },
          { color: P.teal, label: t.real_tool }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "hallucinate", label: t.hallucinated_obs_2, tone: P.rose },
            { value: "stop", label: t.stop_token_2, tone: P.amber },
            { value: "real", label: t.real_tool_2, tone: P.teal }
          ]}
          ariaLabel={t.do_not_let_the_model_invent_the_observation}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.4, 0]} size={[2.0, 1.6, 0.12]} color={P.violet} fill={0.2} />
        <Tag position={[-2.2, 1.35, 0.2]} tone="violet">model text</Tag>
        <Tag position={[-2.2, 0.5, 0.2]} tone="muted" size="xs">Thought</Tag>
        <Tag position={[-2.2, 0.05, 0.2]} tone="amber" size="xs">Action JSON</Tag>
        <Slab position={[2.0, 0.4, 0]} size={[2.2, 1.6, 0.12]} color={mode === "hallucinate" ? P.rose : P.teal} fill={0.28} />
        <Tag position={[2.0, 1.35, 0.2]} tone={mode === "hallucinate" ? "rose" : "teal"}>
          {mode === "hallucinate" ? "fake Observation" : "get_weather()"}
        </Tag>
        {mode === "stop" ? (
          <Tag position={[0, -1.2, 0.2]} tone="amber">{'stop=["Observation:"]'}</Tag>
        ) : null}
        <Flow points={[[-1.15, 0.4, 0], [0.85, 0.4, 0]]} color={mode === "hallucinate" ? P.rose : P.teal} count={3} paused={mode === "stop"} />
    
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Banco de la completion. La cinta es el texto que vuelve de `chat`, pieza
 * a pieza, en orden de generación. El color dice QUIÉN escribió cada pieza:
 * violeta el modelo, rosa lo que el modelo inventó en el lugar de una
 * herramienta, verde azulado lo que escribió tu código. La secuencia de
 * stop es una compuerta que cae justo antes de «Observation:»: la API
 * corta ahí y no devuelve la cadena de stop.
 *
 * Todas las cifras de la nota salen de estas mismas piezas (caracteres,
 * llamadas a `chat`, ejecuciones de `get_weather`). El texto es didáctico:
 * reproduce la forma del ejemplo de la Unidad 1, no una salida real.
 */

type EsMode = "sin" | "stop" | "real";
type Author = "model" | "fake" | "harness" | "stopseq";

type Piece = { text: string; author: Author; json?: boolean };

const ES_CALL1: Piece[] = [
  { text: "Thought:", author: "model" },
  { text: "consulto el tiempo", author: "model" },
  { text: "Action:", author: "model" },
  { text: "get_weather", author: "model", json: true },
  { text: "London", author: "model", json: true },
];
const ES_STOP: Piece = { text: "Observation:", author: "stopseq" };
const ES_FAKE: Piece[] = [
  { text: "nublado, 12 °C", author: "fake" },
  { text: "Final Answer:", author: "fake" },
  { text: "nublado", author: "fake" },
];
const ES_REAL_OBS: Piece[] = [
  { text: "Observation:", author: "harness" },
  { text: "soleado y frío", author: "harness" },
];
const ES_CALL2: Piece[] = [
  { text: "Final Answer:", author: "model" },
  { text: "soleado y frío", author: "model" },
];

const EM = {
  base: "#2c3134",
  baseTop: "#3d4448",
  rail: "#9aa2a4",
  brass: "#b68442",
  brassLight: "#dcb878",
  ceramic: "#f1ede4",
  steel: "#6f787c",
};

const CHIP_H = 0.5;
const CHIP_D = 0.3;
const GAP = 0.1;

function chipWidth(text: string) {
  return Math.max(0.62, 0.3 + text.length * 0.088);
}

function authorColors(author: Author, ghost: boolean) {
  if (ghost) return { fill: "#dcd9d0", edge: P.lineStrong, tone: "muted" as const };
  if (author === "fake") return { fill: mixHex(P.paper, P.rose, 0.2), edge: P.rose, tone: "rose" as const };
  if (author === "harness") return { fill: mixHex(P.paper, P.teal, 0.2), edge: P.teal, tone: "teal" as const };
  if (author === "stopseq") return { fill: mixHex(P.paper, P.amber, 0.22), edge: P.amber, tone: "amber" as const };
  return { fill: mixHex(P.paper, P.violet, 0.16), edge: P.violet, tone: "violet" as const };
}

type Laid = Piece & { x: number; w: number; key: string };

function layRow(pieces: Piece[], start: number, prefix: string): Laid[] {
  let cursor = start;
  return pieces.map((piece, i) => {
    const w = chipWidth(piece.text);
    const laid = { ...piece, x: cursor + w / 2, w, key: prefix + i };
    cursor += w + GAP;
    return laid;
  });
}

function Chip({ piece, z, ghost, shown, labelGhost = false }: { piece: Laid; z: number; ghost: boolean; shown: boolean; labelGhost?: boolean }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const colors = authorColors(piece.author, ghost);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const goal = shown ? 1 : 0.001;
    const k = still ? 1 : Math.min(1, dt * 9);
    g.scale.y += (goal - g.scale.y) * k;
    g.visible = g.scale.y > 0.01;
  });
  return (
    <group position={[piece.x, 0, z]}>
      <group ref={ref} scale={[1, shown ? 1 : 0.001, 1]}>
        <RoundedBox args={[piece.w, CHIP_H, CHIP_D]} position={[0, CHIP_H / 2, 0]} radius={0.07} smoothness={3} castShadow receiveShadow>
          {ghost ? (
            <meshStandardMaterial color={colors.fill} roughness={0.7} transparent opacity={0.45} />
          ) : (
            <meshPhysicalMaterial color={colors.fill} roughness={0.42} clearcoat={0.45} clearcoatRoughness={0.3} />
          )}
        </RoundedBox>
        <mesh position={[0, 0.06, CHIP_D / 2 + 0.006]}>
          <boxGeometry args={[Math.max(0.2, piece.w - 0.16), 0.04, 0.012]} />
          <meshStandardMaterial color={colors.edge} roughness={0.4} metalness={0.1} />
        </mesh>
      </group>
      {shown || (ghost && labelGhost) ? (
        <Tag position={[0, CHIP_H / 2 + 0.03, CHIP_D / 2 + 0.03]} tone={colors.tone} size="xs" center>
          <span className="normal-case">{piece.text}</span>
        </Tag>
      ) : null}
    </group>
  );
}

/** Brass bracket that frames the Action JSON pieces: the blob the parser reads. */
function JsonBracket({ from, to, z, active }: { from: number; to: number; z: number; active: boolean }) {
  const w = to - from + 0.16;
  const cx = (from + to) / 2;
  const color = active ? EM.brassLight : EM.brass;
  return (
    <group position={[cx, 0, z]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[(side * w) / 2, 0.26, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.05, 0.62, 0.38]} />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.28} />
          </mesh>
          <mesh position={[-side * 0.06, 0.29, 0]} castShadow>
            <boxGeometry args={[0.14, 0.05, 0.38]} />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.28} />
          </mesh>
          <mesh position={[-side * 0.06, -0.29, 0]} castShadow>
            <boxGeometry args={[0.14, 0.05, 0.38]} />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.28} />
          </mesh>
        </group>
      ))}
      <Tag position={[0, 0.82, 0]} tone="amber" size="xs" center>Action JSON</Tag>
    </group>
  );
}

/** The stop sequence as a gate: two posts and a blade that drops when stop is set. */
function StopGate({ x, z, armed }: { x: number; z: number; armed: boolean }) {
  const blade = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const b = blade.current;
    if (!b) return;
    const goal = armed ? 0.34 : 1.18;
    b.position.y += (goal - b.position.y) * (still ? 1 : Math.min(1, dt * 5));
  });
  return (
    <group position={[x, 0, z]}>
      {[-0.32, 0.32].map((dz) => (
        <mesh key={dz} position={[0, 0.72, dz]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 1.44, 14]} />
          <meshStandardMaterial color={EM.rail} metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 1.46, 0]} castShadow>
        <boxGeometry args={[0.1, 0.07, 0.78]} />
        <meshStandardMaterial color={EM.rail} metalness={0.75} roughness={0.25} />
      </mesh>
      <group ref={blade} position={[0, armed ? 0.34 : 1.18, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.035, 0.66, 0.6]} />
          <meshPhysicalMaterial color={armed ? P.amber : "#c9c4b8"} metalness={0.35} roughness={0.3} clearcoat={0.5} />
        </mesh>
      </group>
      <Tag position={[0, 1.78, 0]} tone={armed ? "amber" : "muted"} size="xs" center>
        {armed ? "stop activo" : "sin stop"}
      </Tag>
    </group>
  );
}

/** A station in the harness lane: your Python, not the model. */
function Station({ x, z, w, label, lit, tone, runs }: { x: number; z: number; w: number; label: string; lit: boolean; tone: "teal" | "muted"; runs?: string }) {
  const color = lit ? P.teal : "#b9b6ad";
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[w, 0.5, 0.9]} position={[0, 0.25, 0]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={lit ? mixHex(P.paper, P.teal, 0.14) : "#e4e1d8"} roughness={0.45} clearcoat={0.35} />
      </RoundedBox>
      <mesh position={[0, 0.505, 0]}>
        <boxGeometry args={[w - 0.14, 0.02, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (w - 0.18)) / 2, 0.52, 0.32]}>
          <cylinderGeometry args={[0.03, 0.03, 0.03, 10]} />
          <meshStandardMaterial color={EM.rail} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      <Tag position={[0, 0.72, 0.1]} tone={tone} size="xs" center>
        <span className="normal-case">{label}</span>
      </Tag>
      {runs ? (
        <Tag position={[0, 0.2, 0.5]} tone={lit ? "teal" : "rose"} size="xs" center>
          {runs}
        </Tag>
      ) : null}
    </group>
  );
}

function Bench() {
  return (
    <group>
      <ShadowBlob position={[0, -0.42, 0.6]} scale={13} opacity={0.12} />
      <RoundedBox args={[13.1, 0.34, 5.4]} position={[-0.1, -0.24, 0.35]} radius={0.16} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={EM.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[12.7, 0.08, 5.0]} position={[-0.1, -0.04, 0.35]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={EM.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {/* Two tape rails: one per call to chat. */}
      {[-1.25, 0.45].map((z) => (
        <group key={z}>
          <RoundedBox args={[11.6, 0.06, 0.62]} position={[0, 0.0, z]} radius={0.025} smoothness={2} receiveShadow>
            <meshStandardMaterial color={EM.ceramic} roughness={0.6} />
          </RoundedBox>
          {[-0.34, 0.34].map((dz) => (
            <mesh key={dz} position={[0, 0.03, z + dz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, 11.6, 10]} />
              <meshStandardMaterial color={EM.brass} metalness={0.75} roughness={0.28} />
            </mesh>
          ))}
        </group>
      ))}
      {[-6.3, 6.1].flatMap((x) => [-2.1, 2.8].map((z) => (
        <mesh key={x + ":" + z} position={[x, -0.02, z]}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
          <meshStandardMaterial color={EM.brass} metalness={0.8} roughness={0.25} />
        </mesh>
      )))}
    </group>
  );
}

const X0 = -5.55;

function SpanishScene({ mode }: { mode: EsMode }) {
  const row1 = layRow(ES_CALL1, X0, "a");
  const gateX = row1[row1.length - 1].x + row1[row1.length - 1].w / 2 + GAP / 2 + 0.02;
  const after = gateX + GAP / 2 + 0.02;
  const stopChip = layRow([ES_STOP], after, "s");
  const fake = layRow(ES_FAKE, stopChip[0].x + stopChip[0].w / 2 + GAP, "f");
  // Second call: the whole first completion is re-sent as prefix, then the
  // harness appends Observation and the model continues.
  const prefixW = gateX - X0 - GAP;
  const obs = layRow(ES_REAL_OBS, X0 + prefixW + GAP, "o");
  const call2 = layRow(ES_CALL2, obs[obs.length - 1].x + obs[obs.length - 1].w / 2 + GAP, "c");

  // Reveal order: pieces are generated one at a time.
  const sequence = mode === "sin" ? [...row1, ...stopChip, ...fake] : mode === "stop" ? row1 : [...row1, ...obs, ...call2];
  const [tick] = useCycle(sequence.length + 9, 0.42);
  const { still } = useStage();
  const shownCount = still ? sequence.length : Math.min(sequence.length, tick + 1);
  const isShown = (key: string) => sequence.findIndex((p) => p.key === key) < shownCount;

  const zA = -1.25;
  const zB = 0.45;
  const jsonPieces = row1.filter((p) => p.json);
  const jsonFrom = jsonPieces[0].x - jsonPieces[0].w / 2;
  const jsonTo = jsonPieces[jsonPieces.length - 1].x + jsonPieces[jsonPieces.length - 1].w / 2;
  const toolRan = mode === "real";
  const parserX = (jsonFrom + jsonTo) / 2;
  const toolX = obs[1].x + 0.2;
  const zH = 2.25;
  const done = shownCount >= sequence.length;

  return (
    <group>
      <Bench />
      <Tag position={[X0 - 0.45, 0.25, zA]} tone="muted" size="xs" center>1.ª</Tag>
      {mode === "real" ? <Tag position={[X0 - 0.45, 0.25, zB]} tone="muted" size="xs" center>2.ª</Tag> : null}

      {row1.map((p) => <Chip key={p.key} piece={p} z={zA} ghost={false} shown={isShown(p.key)} />)}
      <JsonBracket from={jsonFrom} to={jsonTo} z={zA} active={toolRan} />

      {/* What happens after the Action depends on the stop sequence. */}
      {mode === "sin" ? (
        <>
          {stopChip.map((p) => <Chip key={p.key} piece={{ ...p, author: "fake" }} z={zA} ghost={false} shown={isShown(p.key)} />)}
          {fake.map((p) => <Chip key={p.key} piece={p} z={zA} ghost={false} shown={isShown(p.key)} />)}
        </>
      ) : (
        <>
          {stopChip.map((p) => <Chip key={p.key} piece={p} z={zA} ghost shown={false} labelGhost={mode === "stop"} />)}
          {mode === "stop" ? fake.map((p) => <Chip key={p.key} piece={p} z={zA} ghost shown={false} />) : null}
        </>
      )}
      <StopGate x={gateX} z={zA} armed={mode !== "sin"} />

      {/* Call 2 only exists when your code appends a real Observation. */}
      {mode === "real" ? (
        <>
          <RoundedBox args={[prefixW, 0.2, 0.26]} position={[X0 + prefixW / 2, 0.1, zB]} radius={0.05} smoothness={2} castShadow receiveShadow>
            <meshStandardMaterial color={mixHex(P.paper, P.violet, 0.1)} roughness={0.6} />
          </RoundedBox>
          <Tag position={[X0 + prefixW / 2, 0.36, zB]} tone="muted" size="xs" center>prefijo reenviado</Tag>
          {obs.map((p) => <Chip key={p.key} piece={p} z={zB} ghost={false} shown={isShown(p.key)} />)}
          {call2.map((p) => <Chip key={p.key} piece={p} z={zB} ghost={false} shown={isShown(p.key)} />)}
        </>
      ) : (
        <Tag position={[-0.3, 0.12, zB]} tone="muted" size="xs" center>sin segunda llamada</Tag>
      )}

      {/* Harness lane: your Python. */}
      <Station x={parserX} z={zH} w={1.9} label="parsear JSON" lit={toolRan} tone={toolRan ? "teal" : "muted"} />
      <Station x={toolX} z={zH} w={2.1} label="get_weather()" lit={toolRan} tone={toolRan ? "teal" : "muted"} runs={toolRan ? "1 ejecución" : "0 ejecuciones"} />
      <Wire points={[[parserX + 0.95, 0.3, zH], [toolX - 1.05, 0.3, zH]]} color={toolRan ? P.teal : P.lineStrong} opacity={0.7} dashed={!toolRan} />
      {toolRan ? (
        <>
          <Flow points={[[parserX, 0.5, zA + 0.2], [parserX, 0.7, 0.9], [parserX, 0.6, zH - 0.4]]} color={P.teal} count={2} size={0.05} speed={0.4} />
          <Flow points={[[parserX + 0.95, 0.3, zH], [toolX - 1.05, 0.3, zH]]} color={P.teal} count={2} size={0.045} speed={0.45} />
          <Flow points={[[toolX, 0.6, zH - 0.4], [toolX, 0.9, 1.7], [obs[1].x, 0.5, zB + 0.2]]} color={P.teal} count={3} size={0.05} speed={0.4} />
        </>
      ) : null}
      {mode === "stop" && done ? (
        <Tag position={[stopChip[0].x + 0.6, 0.95, zA + 0.1]} tone="rose" size="xs" center>nadie añade</Tag>
      ) : null}
      {mode === "sin" ? (
        <Tag position={[fake[0].x, 1.05, zA]} tone="rose" size="xs" center>inventado</Tag>
      ) : null}
    </group>
  );
}

function countChars(pieces: Piece[]) {
  return pieces.reduce((sum, p) => sum + p.text.length, 0);
}

const ES_FACTS: Record<EsMode, { calls: number; runs: number; model: number; harness: number; invented: number; verdict: string }> = {
  sin: {
    calls: 1,
    runs: 0,
    model: countChars(ES_CALL1),
    harness: 0,
    invented: countChars([ES_STOP, ...ES_FAKE]),
    verdict: "Parece un agente terminado y no lo es",
  },
  stop: {
    calls: 1,
    runs: 0,
    model: countChars(ES_CALL1),
    harness: 0,
    invented: 0,
    verdict: "Correcto hasta la compuerta, luego cuelgue",
  },
  real: {
    calls: 2,
    runs: 1,
    model: countChars(ES_CALL1) + countChars(ES_CALL2),
    harness: countChars(ES_REAL_OBS),
    invented: 0,
    verdict: "Agente: stop, parsear, ejecutar, añadir, repetir",
  },
};

function SpanishNote({ mode }: { mode: EsMode }) {
  const f = ES_FACTS[mode];
  return (
    <div className="space-y-3">
      <p>
        <strong>{f.verdict}.</strong>{" "}
        {mode === "sin"
          ? "Sin secuencia de stop, el modelo sigue prediciendo el siguiente token después de la Action. Como el prompt le enseñó la forma de una Observation, la escribe él: «nublado, 12 °C» y un Final Answer. Ninguna función se ejecutó; las piezas rosas son continuación probable, no datos."
          : mode === "stop"
            ? "Con stop=[\"Observation:\"] la generación se corta antes de esa cadena: vuelve Thought + Action JSON y nada más. Si tu código no parsea, no ejecuta get_weather y no añade la Observation, el bucle se queda parado. Es el segundo bug que también parece un agente en una demo."
            : "Tu código lee el JSON, ejecuta get_weather y escribe «Observation:» más el resultado. Luego llama a chat otra vez con todo el prefijo (system + user + la completion cortada + la Observation). El modelo sólo escribe el Final Answer."}
      </p>
      <Readout
        items={[
          { label: "llamadas a chat", value: String(f.calls), tone: "var(--violet)" },
          { label: "get_weather ejecutada", value: f.runs + (f.runs === 1 ? " vez" : " veces"), tone: "var(--teal)" },
          { label: "caracteres del modelo", value: String(f.model), tone: "var(--violet)" },
          { label: "inventados", value: String(f.invented), tone: "var(--rose)" },
          { label: "escritos por tu código", value: String(f.harness), tone: "var(--teal)" },
        ]}
      />
      <p className="text-xs text-muted">
        Recuento de caracteres de las piezas dibujadas, no de tokens de un tokenizer real. El texto imita la traza del curso de Hugging Face (Unidad 1, Dummy Agent Library); los valores meteorológicos son de ejemplo. La API no devuelve la cadena de stop, por eso «Observation:» la vuelve a escribir tu código.
      </p>
    </div>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<EsMode>("sin");
  return (
    <Figure
      label="La secuencia de stop es el gozne"
      hint="quién escribe cada pieza de la completion"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.violet, label: "escrito por el modelo" },
        { color: P.rose, label: "Observation inventada" },
        { color: P.teal, label: "escrito por tu código" },
        { color: P.amber, label: "secuencia de stop" },
      ]}
      note={<SpanishNote mode={mode} />}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "sin", label: "Sin stop", tone: P.rose },
            { value: "stop", label: "Stop sin tool", tone: P.amber },
            { value: "real", label: "Stop + tool real", tone: P.teal },
          ]}
          ariaLabel="Qué hace el bucle después de la Action"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.8, 7.4, 8.6], fov: 32 }} fit={1.0}>
        <SpanishScene mode={mode} />
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}
