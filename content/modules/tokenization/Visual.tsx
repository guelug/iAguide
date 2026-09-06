"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useState, type ReactNode } from "react";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Arrow, Flow, PointerTilt, ShadowBlob, Tag, Wire, type V3 } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import VisualLegacy from "./VisualLegacy";

type Mode = "bpe" | "roles" | "template";
type Tone = "teal" | "amber" | "violet" | "ink" | "rose" | "muted";

type Piece = {
  text: string;
  span: [number, number];
  id: number;
};

type PairRule = {
  left: string;
  right: string;
  merged: string;
  rank: number;
};

type BpeStep = {
  pieces: Piece[];
  mergedFrom?: PairRule;
};

const SOURCE_WORD = "gatos";

// IDs and pair ranks are deliberately fixed teaching data. They are not
// copied from a model tokenizer: the scene is a transparent calculation.
const TOKEN_IDS: Record<string, number> = {
  g: 71,
  a: 42,
  t: 12,
  o: 58,
  s: 19,
  ga: 203,
  gat: 314,
  os: 205,
  gatos: 601,
};

const RANKED_PAIRS: PairRule[] = [
  { left: "g", right: "a", merged: "ga", rank: 1 },
  { left: "ga", right: "t", merged: "gat", rank: 2 },
  { left: "o", right: "s", merged: "os", rank: 3 },
  { left: "gat", right: "os", merged: "gatos", rank: 4 },
];

const MATERIAL = {
  wood: "#40362d",
  woodTop: "#6b513a",
  brass: "#b68442",
  brassLight: "#e1bd7e",
  ceramic: "#f5f0e6",
  charcoal: "#25282a",
};

function tokenId(text: string) {
  if (TOKEN_IDS[text] !== undefined) return TOKEN_IDS[text];
  return 900 + Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function makePiece(text: string, span: [number, number]): Piece {
  return { text, span, id: tokenId(text) };
}

function initialPieces(): Piece[] {
  return Array.from(SOURCE_WORD).map((char, index) => makePiece(char, [index, index + 1]));
}

function findMerge(pieces: Piece[]) {
  for (const rule of RANKED_PAIRS) {
    const index = pieces.findIndex(
      (piece, position) => piece.text === rule.left && pieces[position + 1]?.text === rule.right,
    );
    if (index >= 0) return { rule, index };
  }
  return null;
}

function buildBpeSteps(): BpeStep[] {
  const steps: BpeStep[] = [{ pieces: initialPieces() }];
  let pieces = steps[0].pieces;
  let next = findMerge(pieces);
  while (next) {
    const left = pieces[next.index];
    const right = pieces[next.index + 1];
    const merged = makePiece(next.rule.merged, [left.span[0], right.span[1]]);
    pieces = [...pieces.slice(0, next.index), merged, ...pieces.slice(next.index + 2)];
    steps.push({ pieces, mergedFrom: next.rule });
    next = findMerge(pieces);
  }
  return steps;
}

const BPE_STEPS = buildBpeSteps();

function pieceWidth(text: string, withId = false) {
  const base = withId ? 0.37 + text.length * 0.12 : 0.28 + text.length * 0.18;
  return Math.max(withId ? 0.45 : 0.46, Math.min(withId ? 0.98 : 1.24, base));
}

type PositionedPiece = Piece & { width: number; x: number };

function layoutPieces(pieces: Piece[], centerX: number, withId = false): PositionedPiece[] {
  const gap = 0.1;
  const widths = pieces.map((piece) => pieceWidth(piece.text, withId));
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, pieces.length - 1);
  let cursor = centerX - total / 2;
  return pieces.map((piece, index) => {
    const width = widths[index];
    const item = { ...piece, width, x: cursor + width / 2 };
    cursor += width + gap;
    return item;
  });
}

function toneForPiece(piece: Piece, fallback: Tone = "amber"): Tone {
  if (piece.text.length > 1) return fallback;
  return "ink";
}

function CeramicTile({
  piece,
  position,
  width,
  tone = "amber",
  withId = false,
}: {
  piece: Piece;
  position: V3;
  width: number;
  tone?: Tone;
  withId?: boolean;
}) {
  const fill = tone === "teal" ? P.tealWash : tone === "violet" ? P.violetWash : tone === "ink" ? MATERIAL.ceramic : P.amberWash;
  const edge = tone === "teal" ? P.teal : tone === "violet" ? P.violet : tone === "ink" ? P.inkSoft : P.amber;
  return (
    <group position={position}>
      <RoundedBox args={[width, 0.58, 0.3]} radius={0.085} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={fill} roughness={0.55} metalness={0.02} envMapIntensity={0.86} />
      </RoundedBox>
      <mesh position={[0, -0.2, 0.162]}>
        <boxGeometry args={[Math.max(0.16, width - 0.14), 0.035, 0.018]} />
        <meshStandardMaterial color={edge} roughness={0.38} metalness={0.08} />
      </mesh>
      <Tag position={[0, 0.025, 0.19]} tone={tone} size="xs" center>
        <span className="normal-case">{withId ? piece.text + " · " + piece.id : piece.text}</span>
      </Tag>
    </group>
  );
}

function BenchBase() {
  return (
    <group>
      <ShadowBlob position={[0, -1.58, 0.25]} scale={5.25} opacity={0.13} />
      <RoundedBox position={[0, -1.42, 0]} args={[10.2, 0.42, 2.55]} radius={0.2} smoothness={5} castShadow receiveShadow>
        <meshStandardMaterial color={MATERIAL.wood} roughness={0.63} metalness={0.03} />
      </RoundedBox>
      <RoundedBox position={[0, -1.18, 0.02]} args={[9.82, 0.12, 2.25]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={MATERIAL.woodTop} roughness={0.5} metalness={0.03} />
      </RoundedBox>
      <mesh position={[-4.55, -1.13, 0.48]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.72, 20]} />
        <meshStandardMaterial color={MATERIAL.brass} roughness={0.28} metalness={0.7} />
      </mesh>
      <mesh position={[4.55, -1.13, 0.48]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.72, 20]} />
        <meshStandardMaterial color={MATERIAL.brass} roughness={0.28} metalness={0.7} />
      </mesh>
      <mesh position={[-4.55, -1.13, -0.48]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.72, 20]} />
        <meshStandardMaterial color={MATERIAL.brass} roughness={0.28} metalness={0.7} />
      </mesh>
      <mesh position={[4.55, -1.13, -0.48]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.72, 20]} />
        <meshStandardMaterial color={MATERIAL.brass} roughness={0.28} metalness={0.7} />
      </mesh>
    </group>
  );
}

function StationDeck({ centerX, width, label, tone }: { centerX: number; width: number; label: string; tone: Tone }) {
  const color = tone === "teal" ? P.teal : tone === "violet" ? P.violet : P.amber;
  return (
    <group>
      <RoundedBox position={[centerX, -0.95, 0]} args={[width, 0.14, 1.48]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={MATERIAL.ceramic} roughness={0.62} metalness={0.02} />
      </RoundedBox>
      <mesh position={[centerX, -0.79, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, width - 0.22, 16]} />
        <meshStandardMaterial color={MATERIAL.brass} roughness={0.25} metalness={0.74} />
      </mesh>
      <mesh position={[centerX, -0.79, -0.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, width - 0.22, 16]} />
        <meshStandardMaterial color={MATERIAL.brass} roughness={0.25} metalness={0.74} />
      </mesh>
      <mesh position={[centerX - width / 2 + 0.12, -0.82, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.68, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.32} />
      </mesh>
      <mesh position={[centerX + width / 2 - 0.12, -0.82, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.68, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.32} />
      </mesh>
      <Tag position={[centerX, 0.26, 0.42]} tone={tone} center>{label}</Tag>
    </group>
  );
}

function MergeClamp({ layout, rule }: { layout: PositionedPiece[]; rule: PairRule | null }) {
  if (!rule) return null;
  const index = layout.findIndex(
    (piece, position) => piece.text === rule.left && layout[position + 1]?.text === rule.right,
  );
  if (index < 0 || !layout[index + 1]) return null;
  const left = layout[index];
  const right = layout[index + 1];
  const center = (left.x + right.x) / 2;
  const width = right.x - left.x + (left.width + right.width) / 2 + 0.08;
  return (
    <group>
      <RoundedBox position={[center, 0.62, 0.18]} args={[width, 0.09, 0.18]} radius={0.035} smoothness={2} castShadow>
        <meshStandardMaterial color={MATERIAL.brassLight} roughness={0.25} metalness={0.7} />
      </RoundedBox>
      <mesh position={[center - width / 2 + 0.06, 0.41, 0.18]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.34, 14]} />
        <meshStandardMaterial color={MATERIAL.brass} roughness={0.28} metalness={0.76} />
      </mesh>
      <mesh position={[center + width / 2 - 0.06, 0.41, 0.18]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.34, 14]} />
        <meshStandardMaterial color={MATERIAL.brass} roughness={0.28} metalness={0.76} />
      </mesh>
      <Arrow from={[center, 0.92, 0.2]} to={[center, 0.67, 0.2]} color={P.amber} width={1.1} head={0.08} />
    </group>
  );
}

function BpeScene({ step }: { step: number }) {
  const current = BPE_STEPS[step];
  const next = findMerge(current.pieces);
  const rawLayout = layoutPieces(BPE_STEPS[0].pieces, -3.2);
  const fusionLayout = layoutPieces(current.pieces, 0);
  const idLayout = layoutPieces(current.pieces, 3.25, true);
  return (
    <PointerTilt amount={0.055}>
      <group>
        <BenchBase />
        <StationDeck centerX={-3.2} width={3.12} label="caracteres" tone="amber" />
        <StationDeck centerX={0} width={3.12} label="fusiones" tone="amber" />
        <StationDeck centerX={3.25} width={3.12} label="IDs" tone="teal" />
        <Tag position={[0, 1.08, 0.32]} tone="amber" center>ranking BPE fijo</Tag>
        {rawLayout.map((piece) => (
          <CeramicTile key={"raw-" + piece.span[0]} piece={piece} position={[piece.x, -0.34, 0.16]} width={piece.width} tone="ink" />
        ))}
        {fusionLayout.map((piece) => (
          <CeramicTile key={"fusion-" + piece.span[0] + "-" + piece.text} piece={piece} position={[piece.x, -0.34, 0.16]} width={piece.width} tone={toneForPiece(piece)} />
        ))}
        {idLayout.map((piece) => (
          <CeramicTile key={"id-" + piece.span[0] + "-" + piece.text} piece={piece} position={[piece.x, -0.34, 0.16]} width={piece.width} tone="teal" withId />
        ))}
        <MergeClamp layout={fusionLayout} rule={next?.rule ?? null} />
        <Flow points={[[-1.62, -0.34, 0.32], [-1.38, -0.34, 0.32]]} color={P.amber} count={2} size={0.04} speed={0.25} />
        <Flow points={[[1.38, -0.34, 0.32], [1.62, -0.34, 0.32]]} color={P.teal} count={2} size={0.04} speed={0.25} />
        <Wire points={[[-4.55, -0.72, 0.32], [4.55, -0.72, 0.32]]} color={MATERIAL.brass} opacity={0.42} width={1} />
      </group>
    </PointerTilt>
  );
}

type Role = "system" | "user" | "assistant" | "tool";

const ROLE_CONTENT: { role: Role; content: string; tone: Tone }[] = [
  { role: "system", content: "Eres útil.", tone: "teal" },
  { role: "user", content: "Cuenta gatos.", tone: "amber" },
  { role: "assistant", content: "Hay tres.", tone: "violet" },
  { role: "tool", content: "resultado: 3", tone: "rose" },
];

function RoleCard({ role, content, tone, position }: { role: Role; content: string; tone: Tone; position: V3 }) {
  const fill = tone === "teal" ? P.tealWash : tone === "violet" ? P.violetWash : tone === "rose" ? P.roseWash : P.amberWash;
  const edge = tone === "teal" ? P.teal : tone === "violet" ? P.violet : tone === "rose" ? P.rose : P.amber;
  return (
    <group position={position}>
      <RoundedBox args={[2.55, 0.52, 0.28]} radius={0.07} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={fill} roughness={0.56} metalness={0.03} />
      </RoundedBox>
      <mesh position={[-1.08, 0, 0.15]}>
        <boxGeometry args={[0.06, 0.31, 0.02]} />
        <meshStandardMaterial color={edge} roughness={0.4} metalness={0.08} />
      </mesh>
      <Tag position={[0, 0.01, 0.18]} tone={tone} size="xs" center><span className="normal-case">{role + " · " + content}</span></Tag>
    </group>
  );
}

function RolesScene() {
  return (
    <PointerTilt amount={0.045}>
      <group>
        <BenchBase />
        <StationDeck centerX={-2.35} width={3.12} label="roles" tone="teal" />
        <StationDeck centerX={2.2} width={4.05} label="cadena renderizada" tone="violet" />
        {ROLE_CONTENT.map((item, index) => (
          <RoleCard key={item.role} {...item} position={[-2.35, 0.32 - index * 0.43, 0.16]} />
        ))}
        {ROLE_CONTENT.slice(0, 3).map((item, index) => (
          <RoleCard key={"chain-" + item.role} {...item} position={[2.2, 0.32 - index * 0.55, 0.16]} />
        ))}
        <Flow points={[[-0.58, -0.25, 0.34], [0.58, -0.25, 0.34]]} color={P.violet} count={3} size={0.04} speed={0.24} />
        <Arrow from={[-0.63, 0.98, 0.26]} to={[0.62, 0.98, 0.26]} color={P.teal} width={1.2} head={0.09} />
        <Wire points={[[-4.55, -0.72, 0.32], [4.55, -0.72, 0.32]]} color={MATERIAL.brass} opacity={0.42} width={1} />
      </group>
    </PointerTilt>
  );
}

const TEMPLATE_ROWS = [
  { role: "system", text: "Eres útil.", tone: "teal" as Tone },
  { role: "user", text: "Cuenta gatos.", tone: "amber" as Tone },
  { role: "assistant", text: "Hay tres.", tone: "violet" as Tone },
];

function TemplateCard({ role, text, tone, position }: { role: string; text: string; tone: Tone; position: V3 }) {
  const fill = tone === "teal" ? P.tealWash : tone === "violet" ? P.violetWash : P.amberWash;
  return (
    <group position={position}>
      <RoundedBox args={[3.35, 0.55, 0.3]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={fill} roughness={0.58} metalness={0.02} />
      </RoundedBox>
      <mesh position={[-1.47, 0, 0.16]}>
        <boxGeometry args={[0.08, 0.32, 0.02]} />
        <meshStandardMaterial color={P.violet} roughness={0.38} metalness={0.08} />
      </mesh>
      <Tag position={[0, 0.01, 0.19]} tone={tone} size="xs" center><span className="normal-case">{"<|im_start|> " + role + " · " + text + " · <|im_end|>"}</span></Tag>
    </group>
  );
}

function TemplateScene() {
  return (
    <PointerTilt amount={0.045}>
      <group>
        <BenchBase />
        <StationDeck centerX={-1.85} width={4.05} label="plantilla de ejemplo" tone="violet" />
        <StationDeck centerX={2.28} width={3.22} label="cadena" tone="amber" />
        {TEMPLATE_ROWS.map((item, index) => (
          <TemplateCard key={item.role} {...item} position={[-1.85, 0.36 - index * 0.59, 0.16]} />
        ))}
        <RoundedBox position={[2.28, -0.16, 0.15]} args={[2.62, 1.35, 0.44]} radius={0.13} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={MATERIAL.charcoal} roughness={0.42} metalness={0.16} />
        </RoundedBox>
        <Tag position={[2.28, -0.08, 0.4]} tone="amber" size="xs" center><span className="normal-case">roles · contenido · fin</span></Tag>
        <Wire points={[[0.28, -0.28, 0.34], [0.95, -0.28, 0.34]]} color={P.violet} width={1.3} />
        <Flow points={[[0.42, -0.28, 0.38], [0.93, -0.28, 0.38]]} color={P.violet} count={3} size={0.04} speed={0.24} />
      </group>
    </PointerTilt>
  );
}

function StepControls({ step, onStep }: { step: number; onStep: (step: number) => void }) {
  const last = BPE_STEPS.length - 1;
  return (
    <div className="flex items-center gap-1 rounded-full border border-line px-1 py-0.5" role="group" aria-label="Pasos de la fusión BPE">
      <button type="button" className="chip min-w-8 px-2" disabled={step <= 0} aria-label="Paso anterior" onClick={() => onStep(Math.max(0, step - 1))}>←</button>
      <span className="px-1 font-mono text-[0.6rem] tabular-nums text-muted">paso {step}/{last}</span>
      <button type="button" className="chip min-w-8 px-2" disabled={step >= last} aria-label="Paso siguiente" onClick={() => onStep(Math.min(last, step + 1))}>→</button>
    </div>
  );
}

function BpeNote({ step }: { step: number }) {
  const current = BPE_STEPS[step];
  const next = findMerge(current.pieces);
  const action = current.mergedFrom
    ? current.mergedFrom.left + " + " + current.mergedFrom.right + " → " + current.mergedFrom.merged
    : "separación inicial por caracteres";
  return (
    <div className="space-y-3">
      <p><strong>El carro sigue un ranking fijo.</strong> En cada paso busca el par disponible con el número de rango más bajo y lo reemplaza por una sola pieza: aquí <code>gatos</code> termina como un token.</p>
      <Readout items={[
        { label: "operación", value: action, tone: "var(--amber)" },
        { label: "siguiente", value: next ? next.rule.left + " + " + next.rule.right : "final", tone: "var(--teal)" },
        { label: "piezas", value: String(current.pieces.length), tone: "var(--violet)" },
      ]} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="overflow-x-auto">
          <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">tokens e IDs didácticos</p>
          <table className="w-full min-w-[18rem] border-collapse text-left text-xs">
            <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><tr><th className="border-b border-line px-2 py-1">token</th><th className="border-b border-line px-2 py-1">ID</th><th className="border-b border-line px-2 py-1">caracteres</th></tr></thead>
            <tbody>{current.pieces.map((piece) => <tr key={piece.span[0] + "-" + piece.text}><td className="border-b border-line/60 px-2 py-1 font-mono">{piece.text}</td><td className="border-b border-line/60 px-2 py-1 font-mono tabular-nums">{piece.id}</td><td className="border-b border-line/60 px-2 py-1 font-mono tabular-nums">{piece.span[0]}–{piece.span[1] - 1}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="overflow-x-auto">
          <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">ranking aplicado</p>
          <table className="w-full min-w-[18rem] border-collapse text-left text-xs">
            <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><tr><th className="border-b border-line px-2 py-1">rango</th><th className="border-b border-line px-2 py-1">par</th><th className="border-b border-line px-2 py-1">salida</th></tr></thead>
            <tbody>{RANKED_PAIRS.map((rule) => <tr key={rule.rank}><td className="border-b border-line/60 px-2 py-1 font-mono tabular-nums">#{rule.rank}</td><td className="border-b border-line/60 px-2 py-1 font-mono">{rule.left} + {rule.right}</td><td className="border-b border-line/60 px-2 py-1 font-mono">{rule.merged}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted">Modelo didáctico: fusiones e IDs inventados para explicar la operación; no describen el tokenizer real de ningún modelo.</p>
    </div>
  );
}

function RolesNote() {
  return (
    <div className="space-y-2">
      <p><strong>La interfaz muestra roles;</strong> el modelo recibe una cadena renderizada. El banco conserva el contenido para que se vea qué aporta cada mensaje.</p>
      <Readout items={[{ label: "mensajes", value: "3 + herramienta", tone: "var(--teal)" }, { label: "salida", value: "una secuencia", tone: "var(--violet)" }]} />
      <p className="text-xs text-muted">Los nombres de rol son una convención de chat y la forma exacta de serializarlos depende de la plantilla del modelo.</p>
    </div>
  );
}

function TemplateNote() {
  return (
    <div className="space-y-2">
      <p><strong>Una plantilla envuelve contenido real con delimitadores especiales.</strong> Esta maqueta usa <code>&lt;|im_start|&gt;</code> y <code>&lt;|im_end|&gt;</code> como ejemplo visible, no como formato universal.</p>
      <Readout items={[{ label: "plantilla", value: "ilustrativa", tone: "var(--violet)" }, { label: "contenido", value: "system · user · assistant", tone: "var(--amber)" }]} />
      <p className="text-xs text-muted">En producción, usa la plantilla del tokenizer del modelo —por ejemplo, mediante <code>apply_chat_template</code>— en lugar de inventar delimitadores a mano.</p>
    </div>
  );
}

function VisualSpanish() {
  const [mode, setMode] = useState<Mode>("bpe");
  const [step, setStep] = useState(0);
  const note: ReactNode = mode === "bpe" ? <BpeNote step={step} /> : mode === "roles" ? <RolesNote /> : <TemplateNote />;
  return (
    <Figure
      label="Banco tipográfico · tokens, roles y plantilla"
      hint="de caracteres a IDs, paso a paso"
      legend={[{ color: P.amber, label: "fusión BPE" }, { color: P.teal, label: "roles" }, { color: P.violet, label: "envoltura" }]}
      note={note}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={(nextMode) => { setMode(nextMode); if (nextMode !== "bpe") setStep(0); }}
            options={[{ value: "bpe", label: "BPE", tone: P.amber }, { value: "roles", label: "Roles", tone: P.teal }, { value: "template", label: "Plantilla", tone: P.violet }]}
            ariaLabel="Modo de la escena de tokenización"
          />
          {mode === "bpe" ? <StepControls step={step} onStep={setStep} /> : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.45, 2.65, 10.2], fov: 35 }} fit={1.06}>
        {mode === "bpe" ? <BpeScene step={step} /> : mode === "roles" ? <RolesScene /> : <TemplateScene />}
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  const locale = useLocale();
  return locale === "es" ? <VisualSpanish /> : <VisualLegacy />;
}
