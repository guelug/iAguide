"use client";

import { useState } from "react";
import { Figure, Switcher, Knob, Readout } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Tag, type V3, ShadowBlob, Arrow } from "@/components/three/atoms";
import { AxisLine, Duct, GlassPanel, ISO_CAMERA, IsoDust, IsoFrame, PlanTrace, Sheet } from "@/components/three/iso";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";

/*
 * Bootstrap files as a pipeline of iso sheets into Project Context.
 *
 * Injected on the first turn of a new session. Blank files are skipped.
 * BOOTSTRAP.md is a one-time ritual sheet that is not recreated later.
 */

type Mode = "inject" | "skip" | "ritual";

const COPY = {
  en: {
    title: "bootstrap files, injected",
    hint: "sheets into Project Context · blanks skipped · BOOTSTRAP.md once",
    inject: "inject",
    skip: "skip blanks",
    ritual: "BOOTSTRAP.md",
    legendLive: "injected this turn",
    legendSkip: "blank / missing",
    legendOnce: "one-time ritual",
    context: "Project Context",
    files: "workspace",
    notes: {
      inject:
        "On the first turn of a new session, OpenClaw injects AGENTS, SOUL, IDENTITY, USER, and MEMORY when they exist at the workspace root. They land in Project Context, not as a user message.",
      skip: "Blank files are skipped. A missing file other than MEMORY.md injects a one-line marker. USER.md and MEMORY.md are omitted when absent. Large files are truncated.",
      ritual:
        "BOOTSTRAP.md is created only for a brand-new workspace. After the ritual it is deleted and is not reseeded on later restarts. Attestation lives in SQLite, not a sidecar.",
    },
  },
  es: {
    title: "archivos bootstrap, inyectados",
    hint: "hojas al Project Context · vacíos se saltan · BOOTSTRAP.md una vez",
    inject: "inyectar",
    skip: "saltar vacíos",
    ritual: "BOOTSTRAP.md",
    legendLive: "inyectado este turno",
    legendSkip: "vacío / faltante",
    legendOnce: "ritual de un tiro",
    context: "Project Context",
    files: "workspace",
    notes: {
      inject:
        "En el primer turno de una sesión nueva, OpenClaw inyecta AGENTS, SOUL, IDENTITY, USER y MEMORY cuando existen en la raíz del workspace. Caen en Project Context, no como mensaje de usuario.",
      skip: "Los archivos en blanco se saltan. Un archivo faltante distinto de MEMORY.md inyecta una línea marcador. USER.md y MEMORY.md se omiten si faltan. Los grandes se recortan.",
      ritual:
        "BOOTSTRAP.md solo se crea para un workspace nuevo. Tras el ritual se borra y no se vuelve a sembrar. La atestación vive en SQLite, no en un sidecar.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

const FILES = [
  { name: "AGENTS.md", color: P.teal, wash: P.tealWash },
  { name: "SOUL.md", color: P.teal, wash: P.tealWash },
  { name: "IDENTITY.md", color: P.amber, wash: P.amberWash },
  { name: "USER.md", color: P.amber, wash: P.amberWash },
  { name: "MEMORY.md", color: P.violet, wash: P.violetWash },
  { name: "BOOTSTRAP.md", color: P.violet, wash: P.violetWash },
];

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("inject");

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendLive },
        { color: P.rose, label: t.legendSkip },
        { color: P.violet, label: t.legendOnce },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "inject", label: t.inject, tone: P.teal },
            { value: "skip", label: t.skip, tone: P.rose },
            { value: "ritual", label: t.ritual, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          <strong className="text-ink">{t[mode]}</strong>
          {" — "}
          {t.notes[mode]}
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={13.4} depth={11.6} y={-0.04} />
        <PlanTrace
          points={[[-5.6, 3.4], [0.2, 3.4], [0.2, 0.4]]}
          y={-0.03}
          color={mode === "skip" ? P.rose : mode === "ritual" ? P.violet : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.8, 0, 2.3]} to={[4.8, 0, 2.3]} />
        <IsoDust count={46} center={[0, 0.55, 0]} spread={[5.2, 1.0, 3.6]} />

        <Tag position={[-2.6, 1.85, 1.55]} tone="muted" size="xs">
          {t.files}
        </Tag>
        {FILES.map((f, i) => {
          const blank = mode === "skip" && (i === 3 || i === 4);
          const ritualOnly = f.name === "BOOTSTRAP.md";
          const show = mode === "ritual" ? ritualOnly : !ritualOnly || mode === "inject";
          const fill = blank ? 0.12 : mode === "ritual" && ritualOnly ? 0.95 : show ? 0.85 : 0.08;
          return (
            <Sheet
              key={f.name}
              position={[-3.6 + i * 0.85, 0.05, 1.15 - (i % 2) * 0.25]}
              size={[0.72, 1.05]}
              color={blank ? P.roseWash : f.wash}
              fill={fill}
              marks={blank || !show ? 0 : 3}
              markColor={blank ? P.rose : f.color}
            />
          );
        })}

        <GlassPanel
          position={[3.15, 1.45, -0.35]}
          rotation={ISO}
          size={[2.55, 2.35]}
          color={mode === "ritual" ? P.violet : P.teal}
          opacity={0.26}
        />
        <Tag position={[3.15, 2.85, -0.35]} tone={mode === "ritual" ? "violet" : "teal"}>
          {t.context}
        </Tag>
        {[0, 1, 2].map((i) => (
          <Sheet
            key={`ctx-${i}`}
            position={[3.25, 0.55 + i * 0.08, -0.25]}
            size={[1.55, 1.05]}
            color={mode === "skip" ? P.roseWash : mode === "ritual" ? P.violetWash : P.tealWash}
            fill={mode === "skip" ? 0.35 : 0.7}
            marks={mode === "skip" ? 1 : 4}
            markColor={mode === "skip" ? P.rose : mode === "ritual" ? P.violet : P.teal}
          />
        ))}

        <Duct
          from={[-0.4, 0.22, 0.9]}
          to={[2.05, 0.7, -0.1]}
          color={mode === "skip" ? P.rose : mode === "ritual" ? P.violet : P.teal}
          radius={0.1}
          bend={0.55}
        />
        <Flow
          points={[
            [-0.2, 0.25, 0.85],
            [1.9, 0.72, -0.05],
          ]}
          color={mode === "skip" ? P.rose : mode === "ritual" ? P.violet : P.teal}
          count={4}
        />
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Inyección de bootstrap con sus presupuestos. Cada archivo del workspace
 * es una hoja cuya altura es su tamaño en caracteres; la cuchilla de
 * bootstrapMaxChars (20 000) corta lo que sobra de cada archivo, USER.md
 * tiene un presupuesto aparte de 4 000, y la columna de Project Context
 * tiene el tope bootstrapTotalMaxChars (60 000). Vacíos se saltan; un
 * faltante distinto de MEMORY.md inyecta un marcador de una línea; USER.md
 * y MEMORY.md se omiten si faltan. BOOTSTRAP.md sólo existe en un
 * workspace nuevo. Los tamaños de los archivos son de ejemplo; el orden
 * de recorte cuando se supera el total es una suposición de la maqueta.
 */

type OwScenario = "session" | "blanks" | "fresh";
type FileName = "AGENTS.md" | "SOUL.md" | "IDENTITY.md" | "USER.md" | "MEMORY.md" | "BOOTSTRAP.md";

const PER_FILE = 20000;
const TOTAL = 60000;
const USER_CAP = 4000;
const MARKER = 32; // una línea «missing file»
const OW_FILES: FileName[] = ["AGENTS.md", "SOUL.md", "IDENTITY.md", "USER.md", "MEMORY.md", "BOOTSTRAP.md"];

/** raw size in chars; null = file absent, 0 = blank. */
function scenarioSizes(s: OwScenario, soul: number): Record<FileName, number | null> {
  if (s === "session") return { "AGENTS.md": 19800, "SOUL.md": soul, "IDENTITY.md": 420, "USER.md": 5100, "MEMORY.md": 24000, "BOOTSTRAP.md": null };
  if (s === "blanks") return { "AGENTS.md": 6200, "SOUL.md": null, "IDENTITY.md": 0, "USER.md": null, "MEMORY.md": null, "BOOTSTRAP.md": null };
  return { "AGENTS.md": 2400, "SOUL.md": 1800, "IDENTITY.md": 0, "USER.md": 600, "MEMORY.md": null, "BOOTSTRAP.md": 1500 };
}

type Row = { name: FileName; raw: number | null; injected: number; status: "ok" | "cut" | "skip" | "marker" | "omit" | "ritual"; budget: "total" | "user" };

function inject(s: OwScenario, soul: number) {
  const sizes = scenarioSizes(s, soul);
  let used = 0;
  const rows: Row[] = OW_FILES.map((name) => {
    const raw = sizes[name];
    const budget = name === "USER.md" ? "user" : "total";
    if (raw === null) {
      if (name === "USER.md" || name === "MEMORY.md" || name === "BOOTSTRAP.md") return { name, raw, injected: 0, status: "omit", budget };
      used += MARKER;
      return { name, raw, injected: MARKER, status: "marker", budget };
    }
    if (raw === 0) return { name, raw, injected: 0, status: "skip", budget };
    if (budget === "user") {
      const inj = Math.min(raw, USER_CAP);
      return { name, raw, injected: inj, status: inj < raw ? "cut" : "ok", budget };
    }
    const perFile = Math.min(raw, PER_FILE);
    const inj = Math.max(0, Math.min(perFile, TOTAL - used));
    used += inj;
    return { name, raw, injected: inj, status: name === "BOOTSTRAP.md" ? "ritual" : inj < raw ? "cut" : "ok", budget };
  });
  const totalUsed = rows.filter((r) => r.budget === "total").reduce((a, r) => a + r.injected, 0);
  const userUsed = rows.filter((r) => r.budget === "user").reduce((a, r) => a + r.injected, 0);
  const cutChars = rows.reduce((a, r) => a + (r.raw ? r.raw - r.injected : 0), 0);
  return { rows, totalUsed, userUsed, cutChars };
}

const U = 1 / 16000; // world units per character
const W4 = { base: "#2d3336", baseTop: "#42494d", brass: "#b68442", steel: "#a3aaad", ceramic: "#efebe2" };

function fileTint(name: FileName) {
  if (name === "AGENTS.md" || name === "SOUL.md") return P.teal;
  if (name === "IDENTITY.md" || name === "USER.md") return P.amber;
  return P.violet;
}

function Sheet3({ x, row }: { x: number; row: Row }) {
  const raw = row.raw ?? 0;
  const tint = fileTint(row.name);
  const hRaw = Math.max(0.04, raw * U);
  const hInj = row.injected * U;
  const absent = row.raw === null;
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox args={[0.7, 0.1, 0.5]} position={[0, 0.05, 0]} radius={0.03} smoothness={2} receiveShadow>
        <meshStandardMaterial color={W4.ceramic} roughness={0.6} />
      </RoundedBox>
      {absent ? (
        <>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.56, 0.5, 0.06]} />
            <meshStandardMaterial color={P.lineStrong} transparent opacity={0.25} depthWrite={false} />
          </mesh>
          {row.status === "marker" ? (
            <mesh position={[0, 0.14, 0.06]}>
              <boxGeometry args={[0.56, 0.05, 0.14]} />
              <meshStandardMaterial color={P.amber} />
            </mesh>
          ) : null}
        </>
      ) : (
        <>
          {/* Injected part. */}
          {hInj > 0 ? (
            <RoundedBox args={[0.56, hInj, 0.14]} position={[0, 0.1 + hInj / 2, 0]} radius={Math.min(0.03, hInj / 2.2)} smoothness={2} castShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, tint, 0.5)} roughness={0.4} clearcoat={0.45} />
            </RoundedBox>
          ) : null}
          {/* Cut part: what the budget throws away. */}
          {hRaw - hInj > 0.01 ? (
            <mesh position={[0, 0.1 + hInj + (hRaw - hInj) / 2, 0]}>
              <boxGeometry args={[0.56, hRaw - hInj, 0.14]} />
              <meshStandardMaterial color={P.rose} transparent opacity={0.28} depthWrite={false} />
            </mesh>
          ) : null}
          {row.status === "skip" ? (
            <mesh position={[0, 0.13, 0]}>
              <boxGeometry args={[0.56, 0.04, 0.14]} />
              <meshStandardMaterial color={P.lineStrong} />
            </mesh>
          ) : null}
        </>
      )}
      <Tag position={[0, -0.05, 0.42]} tone={absent || row.status === "skip" ? "muted" : "ink"} size="xs" center>
        <span className="normal-case">{row.name.replace(".md", "")}</span>
      </Tag>
    </group>
  );
}

function stackSegments(segments: { name: FileName; chars: number }[]) {
  let y = 0.12;
  return segments.filter((s) => s.chars > 0).map((s) => {
    const bh = s.chars * U;
    const b = { ...s, y: y + bh / 2, bh };
    y += bh;
    return b;
  });
}

function Column({ x, cap, segments, label, tone }: { x: number; cap: number; segments: { name: FileName; chars: number }[]; label: string; tone: "teal" | "amber" }) {
  const h = cap * U;
  const blocks = stackSegments(segments);
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.62, 0.68, 0.12, 40]} />
        <meshStandardMaterial color={W4.ceramic} roughness={0.55} />
      </mesh>
      {blocks.map((b) => (
        <mesh key={b.name} position={[0, b.y, 0]} castShadow>
          <cylinderGeometry args={[0.44, 0.44, Math.max(0.01, b.bh - 0.012), 40]} />
          <meshPhysicalMaterial color={mixHex(P.paper, fileTint(b.name), 0.5)} roughness={0.38} clearcoat={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.12 + h / 2, 0]}>
        <cylinderGeometry args={[0.52, 0.52, h, 40, 1, true]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.16} roughness={0.05} clearcoat={1} side={2} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.12 + h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.53, 0.025, 10, 40]} />
        <meshStandardMaterial color={P.rose} />
      </mesh>
      <Tag position={[0, 0.35 + h, 0]} tone={tone} size="xs" center>{label}</Tag>
    </group>
  );
}

function InjectScene({ scenario, soul }: { scenario: OwScenario; soul: number }) {
  const res = inject(scenario, soul);
  const pitch = 0.85;
  const x0 = -4.1;
  const bladeY = 0.1 + PER_FILE * U;
  const totalRows = res.rows.filter((r) => r.budget === "total");
  return (
    <group>
      <ShadowBlob position={[0, -0.38, 0]} scale={10} opacity={0.12} />
      <RoundedBox args={[9.4, 0.3, 3.4]} position={[-0.3, -0.2, 0]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={W4.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[9.0, 0.07, 3.0]} position={[-0.3, -0.02, 0]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={W4.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {res.rows.map((r, i) => <Sheet3 key={r.name} x={x0 + i * pitch} row={r} />)}
      {/* bootstrapMaxChars blade across the rack (USER.md has its own). */}
      <mesh position={[x0 + 2.5 * pitch, bladeY, 0.12]}>
        <boxGeometry args={[6 * pitch, 0.025, 0.04]} />
        <meshStandardMaterial color={W4.brass} metalness={0.8} roughness={0.25} />
      </mesh>
      {[0, 5].map((k) => (
        <mesh key={k} position={[x0 + (k === 0 ? -0.45 : 5 * pitch + 0.45), bladeY / 2 + 0.05, 0.12]}>
          <boxGeometry args={[0.04, bladeY, 0.04]} />
          <meshStandardMaterial color={W4.steel} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      <Tag position={[x0 - 0.5, bladeY + 0.2, 0.12]} tone="amber" size="xs" center>20 000</Tag>
      <mesh position={[x0 + 3 * pitch, 0.1 + USER_CAP * U, 0.12]}>
        <boxGeometry args={[0.7, 0.02, 0.04]} />
        <meshStandardMaterial color={P.amber} />
      </mesh>
      <Arrow from={[x0 + 5 * pitch + 0.6, 0.8, 0]} to={[1.35, 0.8, 0]} color={P.teal} width={2.2} head={0.12} />
      <Column x={2.1} cap={TOTAL} segments={totalRows.map((r) => ({ name: r.name, chars: r.injected }))} label="Project Context · 60 000" tone="teal" />
      <Column x={3.55} cap={USER_CAP} segments={[{ name: "USER.md", chars: res.userUsed }]} label="USER · 4 000" tone="amber" />
    </group>
  );
}

const fmtN = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");

const STATUS_TEXT: Record<Row["status"], string> = {
  ok: "entero",
  cut: "recortado",
  skip: "vacío: se salta",
  marker: "falta: marcador",
  omit: "falta: se omite",
  ritual: "ritual pendiente",
};

function SpanishVisual() {
  const [scenario, setScenario] = useState<OwScenario>("session");
  const [soul, setSoul] = useState(26000);
  const res = inject(scenario, soul);
  return (
    <Figure
      label="Archivos bootstrap, inyectados con presupuesto"
      hint="primer turno · 20 000 por archivo · 60 000 en total · USER aparte"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.teal, label: "AGENTS · SOUL" },
        { color: P.amber, label: "IDENTITY · USER" },
        { color: P.violet, label: "MEMORY · BOOTSTRAP" },
        { color: P.rose, label: "recortado / tope" },
      ]}
      note={
        <div className="space-y-3">
          <p>
            <strong>{scenario === "session" ? "Sesión nueva en un workspace ya atestado." : scenario === "blanks" ? "Archivos vacíos y faltantes." : "Workspace recién creado: ritual de primer arranque."}</strong>{" "}
            {scenario === "session"
              ? "En el primer turno los archivos entran en el Project Context del system prompt, no como mensaje de usuario. Cada archivo se corta en 20 000 caracteres, USER.md en su tope aparte de 4 000, y el conjunto no pasa de 60 000."
              : scenario === "blanks"
                ? "IDENTITY.md en blanco se salta. SOUL.md falta: se inyecta una línea marcador «missing file». USER.md y MEMORY.md, opcionales, se omiten sin marcador."
                : "BOOTSTRAP.md sólo existe en un workspace nuevo. Mientras está pendiente se queda en Project Context con guía de bootstrap; tras el ritual se borra y no se vuelve a sembrar."}
          </p>
          <Readout items={[
            { label: "Project Context", value: fmtN(res.totalUsed) + " / 60 000", tone: "var(--teal)" },
            { label: "USER.md", value: fmtN(res.userUsed) + " / 4 000", tone: "var(--amber)" },
            { label: "caracteres recortados", value: fmtN(res.cutChars), tone: "var(--rose)" },
          ]} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[22rem] border-collapse text-left text-xs">
              <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><tr><th className="border-b border-line px-2 py-1">archivo</th><th className="border-b border-line px-2 py-1">en disco</th><th className="border-b border-line px-2 py-1">inyectado</th><th className="border-b border-line px-2 py-1">estado</th></tr></thead>
              <tbody>{res.rows.map((r) => <tr key={r.name}><td className="border-b border-line/60 px-2 py-1 font-mono">{r.name}</td><td className="border-b border-line/60 px-2 py-1 font-mono tabular-nums">{r.raw === null ? "—" : fmtN(r.raw)}</td><td className="border-b border-line/60 px-2 py-1 font-mono tabular-nums">{fmtN(r.injected)}</td><td className="border-b border-line/60 px-2 py-1">{STATUS_TEXT[r.status]}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="text-xs text-muted">Tamaños en disco de ejemplo. Topes de la lección: bootstrapMaxChars 20 000, bootstrapTotalMaxChars 60 000, USER.md 4 000 aparte; marcador de ~{MARKER} caracteres. Si el total se supera, la maqueta recorta el último archivo en orden; el orden real de recorte no lo detalla la lección. Usa /context para ver tamaños brutos frente a inyectados.</p>
        </div>
      }
      controls={
        <>
          <Switcher value={scenario} onChange={setScenario} ariaLabel="Escenario del workspace" options={[{ value: "session", label: "Sesión nueva", tone: P.teal }, { value: "blanks", label: "Vacíos y faltantes", tone: P.rose }, { value: "fresh", label: "BOOTSTRAP.md", tone: P.violet }]} />
          {scenario === "session" ? <Knob label="SOUL.md" value={soul} min={2000} max={40000} step={1000} onChange={setSoul} format={(v) => fmtN(v)} tone="var(--teal)" /> : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.8, 4.6, 9.6], fov: 32 }} fit={1.04}>
        <InjectScene scenario={scenario} soul={soul} />
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}
