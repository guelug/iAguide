"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Knob, Readout } from "@/components/three/Figure";
import { Arrow, PointerTilt, ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "two" | "view" | "tree" | "api";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "agent_view": "agent view",
      "working": "Working",
      "needs_input": "Needs input",
      "completed": "Completed"
    },
    es: {
      "agent_view": "vista del agente",
      "working": "Trabajando",
      "needs_input": "Pide input",
      "completed": "Completado"
    },
  });

  const OPTIONS = [
    { value: "two" as const, label: "dos productos", tone: "var(--teal)" },
    { value: "view" as const, label: t.agent_view, tone: "var(--amber)" },
    { value: "tree" as const, label: "worktree", tone: "var(--violet)" },
    { value: "api" as const, label: "API / CLI", tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("two");

  return (
    <Figure
      label="Claude Code y Codex"
      hint="recorre el diagrama"
      legend={[
        { color: P.teal, label: "Claude Code" },
        { color: P.amber, label: "Codex / API" },
        { color: P.violet, label: "aislamiento git" },
      ]}
      controls={
        <Switcher
          ariaLabel="claude-code-and-codex diagram steps"
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
      {active === "two" ? <TwoScene /> : null}
      {active === "view" ? <ViewScene t={t} /> : null}
      {active === "tree" ? <TreeScene /> : null}
      {active === "api" ? <ApiScene /> : null}
    </group>
  );
}

function TwoScene() {
  return (
    <group>
      <Wire points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[-1.7, 1.35, 0]} tone="teal" center>
        Claude Code
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="teal" center>
        claude agents
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[1.7, 1.35, 0]} tone="amber" center>
        Codex
      </Tag>
      <Tag position={[1.7, -0.95, 0]} tone="amber" center>
        CLI + API
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.violet} radius={0.14} pulse={0.35} />
    </group>
  );
}

function ViewScene({ t }: { t: Record<string, string> }) {
  const rows = [
    { x: -2.1, label: t.working, tone: "teal" as const, color: P.teal },
    { x: 0.0, label: t.needs_input, tone: "amber" as const, color: P.amber },
    { x: 2.1, label: t.completed, tone: "violet" as const, color: P.violet },
  ];
  return (
    <group>
      <Wire points={[[-2.6, 0.1, 0], [2.6, 0.1, 0]]} color={P.line} opacity={0.45} />
      <Flow points={[[-2.6, 0.1, 0], [2.6, 0.1, 0]]} color={P.amber} count={3} speed={0.28} />
      {rows.map((r) => (
        <group key={r.label}>
          <Slab position={[r.x, 0.85, 0]} size={[1.5, 0.7, 0.12]} color={r.color} fill={0.52} />
          <Tag position={[r.x, 1.45, 0]} tone={r.tone} center>
            {r.label}
          </Tag>
        </group>
      ))}
      <Tag position={[0, -0.9, 0]} tone="amber" center>
        supervisor vivo
      </Tag>
    </group>
  );
}

function TreeScene() {
  return (
    <group>
      <Slab position={[0, 1.05, 0]} size={[2.6, 0.75, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[0, 1.65, 0]} tone="teal" center>
        repo
      </Tag>
      <Slab position={[-1.8, -0.45, 0]} size={[1.7, 0.7, 0.12]} color={P.violet} fill={0.45} />
      <Tag position={[-1.8, -1.05, 0]} tone="violet" center>
        worktree A
      </Tag>
      <Slab position={[1.8, -0.45, 0]} size={[1.7, 0.7, 0.12]} color={P.violet} fill={0.45} />
      <Tag position={[1.8, -1.05, 0]} tone="violet" center>
        worktree B
      </Tag>
      <Wire points={[[-1.8, -0.1, 0], [0, 0.65, 0], [1.8, -0.1, 0]]} color={P.line} opacity={0.5} />
      <Node3D position={[0, 0.65, 0]} color={P.violet} radius={0.12} pulse={0.4} />
    </group>
  );
}

function ApiScene() {
  return (
    <group>
      <Wire points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, -0.15, 0], [2.4, -0.15, 0]]} color={P.amber} count={3} speed={0.3} />
      <Slab position={[-1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[-1.7, 1.35, 0]} tone="amber" center>
        Codex CLI
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="amber" center>
        edita el repo
      </Tag>
      <Slab position={[1.7, 0.55, 0]} size={[2.2, 1.15, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[1.7, 1.35, 0]} tone="teal" center>
        gpt-5.6
      </Tag>
      <Tag position={[1.7, -0.95, 0]} tone="teal" center>
        solo texto
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.amber} radius={0.14} pulse={0.35} />
    </group>
  );
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Quién escribe en disco. Tres tickets del caso de la lección tocan
   ficheros concretos; los conflictos se calculan como ficheros tocados por
   más de una sesión. Con worktree cada sesión edita su copia y el choque
   aparece al fusionar, bajo tu control; con bgIsolation "none" se pisan en
   el mismo working copy. */

type Mode = "two" | "trees" | "api";
type Isolation = "worktree" | "none";

const FILES = ["package.json", "auth/index.ts", "imports.ts", "parser.ts", "parser.test.ts", "README.md"];
const TICKETS = [
  { id: "A", name: "arregla el flaky test", files: ["package.json", "parser.test.ts"], color: P.teal },
  { id: "B", name: "renombra el módulo de auth", files: ["auth/index.ts", "package.json", "imports.ts"], color: P.violet },
  { id: "C", name: "sube la cobertura del parser", files: ["parser.test.ts", "parser.ts", "imports.ts"], color: P.amber },
];

function analyse(sessions: number) {
  const active = TICKETS.slice(0, sessions);
  const touches = new Map<string, string[]>();
  for (const t of active) for (const f of t.files) touches.set(f, [...(touches.get(f) ?? []), t.id]);
  const shared = FILES.filter((f) => (touches.get(f)?.length ?? 0) > 1);
  const edits = active.reduce((sum, t) => sum + t.files.length, 0);
  return { active, touches, shared, edits };
}

const C = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
};

function Plinth({ w = 10.5, d = 4.4 }: { w?: number; d?: number }) {
  return (
    <group>
      <ShadowBlob position={[0, -0.3, 0]} scale={w + 1} opacity={0.12} />
      <RoundedBox args={[w, 0.3, d]} position={[0, -0.13, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={C.base} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[w - 0.35, 0.06, d - 0.35]} position={[0, 0.05, 0]} radius={0.03} smoothness={3} receiveShadow>
        <meshStandardMaterial color={C.baseTop} roughness={0.45} metalness={0.22} />
      </RoundedBox>
    </group>
  );
}

/* Un árbol de trabajo: bandeja con una ficha por fichero. `marks` da el
   color de cada fichero editado; `clash` los que dos sesiones pisan. */
function FileTray({ position, label, tone, marks, clash = [], clashColor = P.rose, scale = 1, lift = 0 }: { position: V3; label: string; tone: "teal" | "violet" | "amber" | "ink"; marks: Record<string, string>; clash?: string[]; clashColor?: string; scale?: number; lift?: number }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[2.3, 0.14, 1.6]} position={[0, 0.07, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={C.charcoal} roughness={0.4} metalness={0.3} clearcoat={0.3} />
      </RoundedBox>
      {FILES.map((file, i) => {
        const x = -0.72 + (i % 3) * 0.72;
        const z = -0.35 + Math.floor(i / 3) * 0.7;
        const color = marks[file];
        const bad = clash.includes(file);
        const up = color ? lift : 0;
        return (
          <group key={file} position={[x, 0.2 + up, z]}>
            <RoundedBox args={[0.6, 0.1, 0.56]} radius={0.03} smoothness={2} castShadow receiveShadow>
              <meshPhysicalMaterial color={bad ? mixHex(C.deck, clashColor, 0.25) : color ? mixHex(C.deck, color, 0.3) : C.deck} roughness={0.5} clearcoat={0.35} />
            </RoundedBox>
            {[0, 1, 2].map((l) => (
              <mesh key={l} position={[-0.08 + l * 0.02, 0.055, -0.16 + l * 0.12]}>
                <boxGeometry args={[0.36 - l * 0.08, 0.008, 0.035]} />
                <meshStandardMaterial color={bad ? clashColor : color ?? C.steel} roughness={0.5} />
              </mesh>
            ))}
          </group>
        );
      })}
      <Tag position={[0, 0.62 + lift, -0.8]} tone={tone} size="xs" center>{label}</Tag>
    </group>
  );
}

function Harness({ position, label, sub, color, tone }: { position: V3; label: string; sub: string; color: string; tone: "teal" | "amber" | "violet" }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.7, 0.14, 1.3]} position={[0, 0.07, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={C.deck} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[1.25, 0.8, 0.75]} position={[0, 0.56, -0.1]} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color={C.charcoal} roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0.62, 0.28]}>
        <boxGeometry args={[1.0, 0.46, 0.01]} />
        <meshStandardMaterial color="#12171A" roughness={0.3} />
      </mesh>
      {[0, 1, 2, 3].map((l) => (
        <mesh key={l} position={[-0.2 + (l % 2) * 0.08, 0.78 - l * 0.1, 0.29]}>
          <boxGeometry args={[0.5 - l * 0.08, 0.025, 0.005]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      ))}
      <Tag position={[0, 1.2, -0.1]} tone={tone} size="xs" center>{label}</Tag>
      <Tag position={[0, 0.2, 0.85]} tone="muted" size="xs" center>{sub}</Tag>
    </group>
  );
}

function SessionPuck({ position, color, id }: { position: V3; color: string; id: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.3, 0.2, 28]} />
        <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.6} />
      </mesh>
      <Tag position={[0, 0.5, 0]} tone="ink" size="xs" center>{`sesión ${id}`}</Tag>
    </group>
  );
}

function TreesScene({ sessions, isolation }: { sessions: number; isolation: Isolation }) {
  const a = analyse(sessions);
  const mainMarks: Record<string, string> = {};
  if (isolation === "none") for (const t of a.active) for (const f of t.files) mainMarks[f] = t.color;
  const xs = [-3.2, 0, 3.2];
  return (
    <group>
      <FileTray position={[0, 0.08, 1.05]} label={isolation === "none" ? "working copy" : "repo principal"} tone="ink" marks={mainMarks} clash={a.shared} clashColor={isolation === "none" ? P.rose : P.amber} />
      {a.active.map((t, i) => {
        const marks = Object.fromEntries(t.files.map((f) => [f, t.color]));
        const x = xs[i];
        return (
          <group key={t.id}>
            <SessionPuck position={[x + (isolation === "worktree" ? -1.45 : 0), 0.08, -1.25]} color={t.color} id={t.id} />
            {isolation === "worktree" ? (
              <>
                {[-0.9, 0.9].map((dx) => (
                  <mesh key={dx} position={[x + dx * 0.8, 0.45, -1.25]} castShadow>
                    <cylinderGeometry args={[0.035, 0.035, 0.75, 10]} />
                    <meshStandardMaterial color={C.steel} metalness={0.8} roughness={0.3} />
                  </mesh>
                ))}
                <FileTray position={[x, 0.78, -1.25]} label={`worktree ${t.id}`} tone="violet" marks={marks} scale={0.8} lift={0.06} />
                <Arrow from={[x * 0.55, 0.95, -0.55]} to={[x * 0.25, 0.55, 0.3]} color={t.color} dashed head={0.08} />
              </>
            ) : (
              <Flow points={[[x, 0.4, -1.0], [x * 0.5, 0.9, 0.0], [x * 0.15, 0.45, 0.8]]} color={t.color} count={3} speed={0.4} />
            )}
          </group>
        );
      })}
      {isolation === "worktree" && a.shared.length > 0 ? <Tag position={[0, 0.25, 2.25]} tone="amber" size="xs" center>{`${a.shared.length} a fusionar por ti`}</Tag> : null}
      {isolation === "none" && a.shared.length > 0 ? <Tag position={[0, 0.25, 2.25]} tone="rose" size="xs" center>{`${a.shared.length} ficheros pisados`}</Tag> : null}
    </group>
  );
}

function EsTwoScene() {
  return (
    <group>
      <FileTray position={[0, 0.08, 0.4]} label="tu repo" tone="ink" marks={{ "parser.ts": P.teal, "imports.ts": P.amber }} />
      <Harness position={[-3.4, 0.08, 0.2]} label="Claude Code" sub="claude agents" color={P.teal} tone="teal" />
      <Harness position={[3.4, 0.08, 0.2]} label="Codex" sub="codex · codex exec" color={P.amber} tone="amber" />
      <Flow points={[[-2.6, 0.7, 0.2], [-1.6, 0.9, 0.3], [-0.72, 0.4, 0.4]]} color={P.teal} count={3} speed={0.35} />
      <Flow points={[[2.6, 0.7, 0.2], [1.6, 0.9, 0.3], [0.72, 0.4, 0.4]]} color={P.amber} count={3} speed={0.35} />
      <Tag position={[0, 1.25, 0.4]} tone="muted" size="xs" center>ambos editan disco</Tag>
    </group>
  );
}

function EsApiScene() {
  return (
    <group>
      <FileTray position={[-1.4, 0.08, 0.6]} label="tu repo" tone="ink" marks={{ "parser.ts": P.amber }} />
      <Harness position={[-4.3, 0.08, 0.3]} label="Codex CLI" sub="sandbox + permisos" color={P.amber} tone="amber" />
      <Flow points={[[-3.5, 0.7, 0.3], [-2.9, 0.85, 0.45], [-2.1, 0.4, 0.6]]} color={P.amber} count={3} speed={0.35} />
      <Harness position={[3.3, 0.08, -0.4]} label="Responses API" sub="gpt-5.6 · HTTP" color={P.teal} tone="teal" />
      {/* output_text: una hoja que no toca el repo */}
      <group position={[2.0, 0.1, 1.25]} rotation={[0, -0.25, 0]}>
        <RoundedBox args={[1.25, 0.06, 0.9]} radius={0.03} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={P.tealWash} roughness={0.6} />
        </RoundedBox>
        {[0, 1, 2, 3].map((l) => (
          <mesh key={l} position={[-0.1, 0.035, -0.28 + l * 0.18]}>
            <boxGeometry args={[0.85 - (l % 2) * 0.25, 0.006, 0.05]} />
            <meshStandardMaterial color={P.teal} />
          </mesh>
        ))}
        <Tag position={[0, 0.35, 0]} tone="teal" size="xs" center>output_text</Tag>
      </group>
      <Flow points={[[3.2, 0.6, 0.1], [2.8, 0.7, 0.7], [2.2, 0.25, 1.15]]} color={P.teal} count={3} speed={0.35} />
      <Arrow from={[1.3, 0.35, 1.2]} to={[-0.1, 0.35, 0.9]} color={P.inkSoft} dashed head={0.08} />
      <Tag position={[0.6, 0.75, 1.35]} tone="muted" size="xs" center>el apply es tuyo</Tag>
    </group>
  );
}

function CodeNote({ mode, sessions, isolation }: { mode: Mode; sessions: number; isolation: Isolation }) {
  const a = analyse(sessions);
  if (mode === "two") {
    return (
      <div className="space-y-2">
        <p><strong>Dos harnesses de vendedor.</strong> Claude Code (Anthropic) y Codex (OpenAI) leen el repo, proponen cambios y los escriben en disco si los permisos lo dejan. No son Hermes ni OpenClaw: esos llaman a un modelo; estos <em>son</em> el arnés del vendedor.</p>
        <p className="text-xs text-muted">Agent View (<code>claude agents</code>) despacha sesiones de segundo plano; Codex tiene <code>codex exec</code> para CI y un modo review que no modifica el working tree.</p>
      </div>
    );
  }
  if (mode === "api") {
    return (
      <div className="space-y-2">
        <p><strong>El CLI edita; la API no.</strong> Codex CLI tiene sandbox, raíces escribibles y diffs. Un <code>responses.create</code> con <code>gpt-5.6</code> devuelve <code>output_text</code>: no hay worktree, ni supervisor, ni git. Si quieres que el texto llegue al repo, el bucle y el apply van en tu código.</p>
        <p className="text-xs text-muted"><code>gpt-5.3-codex</code> es un modelo para agentes de código, no el producto Codex.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p>
        <strong>{isolation === "worktree" ? "Worktree por sesión." : "bgIsolation: \"none\"."}</strong>{" "}
        {isolation === "worktree"
          ? `Cada sesión de Agent View edita su propia copia bajo .claude/worktrees/. Los ${a.shared.length} ficheros que comparten los tickets no se pisan: el choque aparece al fusionar, cuando tú lo decides.`
          : `Las ${sessions} sesiones escriben en el mismo working copy. ${a.shared.length > 0 ? `${a.shared.join(", ")} reciben escrituras de más de una sesión: el último en escribir gana y el árbol puede dejar de compilar.` : "Con una sola sesión no hay nadie a quien pisar."}`}
      </p>
      <Readout items={[
        { label: "sesiones", value: String(sessions), tone: "var(--violet)" },
        { label: "ficheros editados", value: String(a.edits), tone: "var(--teal)" },
        { label: "compartidos", value: String(a.shared.length), tone: a.shared.length ? "var(--rose)" : "var(--teal)" },
        { label: "cuota", value: `≈ ${sessions} × una sesión`, tone: "var(--amber)" },
      ]} />
      <ul className="grid gap-1 text-xs sm:grid-cols-3">
        {a.active.map((t) => <li key={t.id} className="rounded border border-line bg-paper px-2 py-1"><strong style={{ color: t.color }}>{t.id}</strong> · {t.name}: <span className="font-mono">{t.files.join(", ")}</span></li>)}
      </ul>
      <p className="text-xs text-muted">Tickets del caso de la lección; qué ficheros toca cada uno es ilustrativo. Claude omite el worktree si ya estás en uno, si el directorio no es git (sin hook WorktreeCreate) o si la escritura cae fuera del cwd. Borrar una fila de Agent View elimina su worktree con los cambios sin commit.</p>
    </div>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<Mode>("trees");
  const [sessions, setSessions] = useState(3);
  const [isolation, setIsolation] = useState<Isolation>("worktree");
  return (
    <Figure
      label="Claude Code y Codex · quién escribe en disco"
      hint="dos productos · worktrees · API frente a CLI"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "sesión A / Claude Code" },
        { color: P.violet, label: "sesión B / worktree" },
        { color: P.amber, label: "sesión C / Codex" },
        { color: P.rose, label: "fichero pisado" },
      ]}
      note={<CodeNote mode={mode} sessions={sessions} isolation={isolation} />}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Vista" options={[
            { value: "two", label: "Dos productos", tone: P.teal },
            { value: "trees", label: "Worktrees", tone: P.violet },
            { value: "api", label: "API / CLI", tone: P.amber },
          ]} />
          {mode === "trees" ? (
            <>
              <Switcher value={isolation} onChange={setIsolation} ariaLabel="Aislamiento" options={[
                { value: "worktree", label: "Con worktree", tone: P.violet },
                { value: "none", label: "Sin aislamiento", tone: P.rose },
              ]} />
              <Knob label="sesiones" value={sessions} min={1} max={3} onChange={setSessions} tone="var(--violet)" />
            </>
          ) : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3.5, 6, 10], fov: 34 }} fit={1.08}>
        <PointerTilt amount={0.04}>
          <group>
            <Plinth />
            {mode === "two" ? <EsTwoScene /> : mode === "api" ? <EsApiScene /> : <TreesScene sessions={sessions} isolation={isolation} />}
          </group>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}
