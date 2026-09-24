"use client";

import { useMemo, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire, hash, type V3 } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Step = "repos" | "tokens" | "cli" | "cache";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "cache": "cache",
      "git_xet_repo": "Git + Xet repo",
      "cli_cache": "CLI / cache",
      "fine_grained": "fine-grained",
      "hub_cache": "hub cache",
      "prune": "prune"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "cache": "caché",
      "git_xet_repo": "repo Git + Xet",
      "cli_cache": "CLI / caché",
      "fine_grained": "fino",
      "hub_cache": "caché del hub",
      "prune": "purga"
    },
  });

  const OPTIONS = [
    { value: "repos" as const, label: "repos", tone: "var(--teal)" },
    { value: "tokens" as const, label: "tokens", tone: "var(--amber)" },
    { value: "cli" as const, label: "hf cli", tone: "var(--violet)" },
    { value: "cache" as const, label: t.cache, tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("repos");

  return (
    <Figure
      label="Hugging Face Hub"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.git_xet_repo },
        { color: P.amber, label: "token / scope" },
        { color: P.violet, label: t.cli_cache },
      ]}
      controls={
        <Switcher
          ariaLabel="huggingface hub diagram steps"
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
      {active === "repos" ? <ReposScene /> : null}
      {active === "tokens" ? <TokensScene t={t} /> : null}
      {active === "cli" ? <CliScene /> : null}
      {active === "cache" ? <CacheScene t={t} /> : null}
    </group>
  );
}

function ReposScene() {
  return (
    <group>
      <Wire points={[[-2.6, -0.15, 0], [2.6, -0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, -0.15, 0], [2.6, -0.15, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[-2.1, 0.55, 0]} size={[1.7, 1.05, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[-2.1, 1.32, 0]} tone="teal" center>
        Models
      </Tag>
      <Tag position={[-2.1, -0.9, 0]} tone="teal" center>
        2M+
      </Tag>
      <Slab position={[0, 0.55, 0]} size={[1.7, 1.05, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[0, 1.32, 0]} tone="amber" center>
        Datasets
      </Tag>
      <Tag position={[0, -0.9, 0]} tone="amber" center>
        1.5M
      </Tag>
      <Slab position={[2.1, 0.55, 0]} size={[1.7, 1.05, 0.14]} color={P.violet} fill={0.48} />
      <Tag position={[2.1, 1.32, 0]} tone="violet" center>
        Spaces
      </Tag>
      <Tag position={[2.1, -0.9, 0]} tone="violet" center>
        1.5M
      </Tag>
      <Node3D position={[0, -0.15, 0]} color={P.teal} radius={0.14} pulse={0.35} />
    </group>
  );
}

function TokensScene({ t }: { t: Record<string, string> }) {
  const bars = [
    { x: -2.1, h: 0.9, label: t.fine_grained, color: P.teal, tone: "teal" as const, fill: 0.55 },
    { x: 0.0, h: 1.35, label: "read", color: P.amber, tone: "amber" as const, fill: 0.5 },
    { x: 2.1, h: 1.85, label: "write", color: P.violet, tone: "violet" as const, fill: 0.42 },
  ];
  return (
    <group>
      <Wire points={[[-2.8, -0.95, 0], [2.8, -0.95, 0]]} color={P.line} opacity={0.45} />
      {bars.map((b) => (
        <group key={b.label}>
          <Slab
            position={[b.x, -0.95 + b.h / 2, 0]}
            size={[1.5, b.h, 0.14]}
            color={b.color}
            fill={b.fill}
          />
          <Tag position={[b.x, -0.95 + b.h + 0.38, 0]} tone={b.tone} center>
            {b.label}
          </Tag>
        </group>
      ))}
    </group>
  );
}

function CliScene() {
  return (
    <group>
      <Wire points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.violet} count={3} speed={0.28} />
      <Slab position={[-1.85, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[-1.85, 1.55, 0]} tone="teal" center>
        hf auth
      </Tag>
      <Tag position={[-1.85, -0.85, 0]} tone="teal" center>
        whoami
      </Tag>
      <Node3D position={[0.05, 0.1, 0]} color={P.violet} radius={0.14} pulse={0.35} />
      <Slab position={[1.9, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.violet} fill={0.48} />
      <Tag position={[1.9, 1.55, 0]} tone="violet" center>
        download
      </Tag>
      <Tag position={[1.9, -0.85, 0]} tone="violet" center>
        --dry-run
      </Tag>
    </group>
  );
}

function CacheScene({ t }: { t: Record<string, string> }) {
  const items: { x: number; label: string; tone: "teal" | "amber" | "violet"; color: string }[] = [
    { x: -2.15, label: "HF_HOME", tone: "teal", color: P.teal },
    { x: 0.0, label: t.hub_cache, tone: "amber", color: P.amber },
    { x: 2.15, label: t.prune, tone: "violet", color: P.violet },
  ];
  return (
    <group>
      <Wire points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[0, 1.35, 0]} size={[1.9, 0.55, 0.12]} color={P.lineStrong} fill={0.22} />
      <Tag position={[0, 1.85, 0]} tone="teal" center>
        ~/.cache/huggingface
      </Tag>
      {items.map((it) => (
        <group key={it.label}>
          <Slab position={[it.x, 0.35, 0]} size={[1.55, 0.85, 0.14]} color={it.color} fill={0.52} />
          <Tag position={[it.x, -0.85, 0]} tone={it.tone} center>
            {it.label}
          </Tag>
        </group>
      ))}
    </group>
  );
}

/* ======================================================================
 * Versión española: un repo Git cuyos ficheros grandes viven en Xet.
 *
 * Un shard safetensors de 5 GB se dibuja como 48 bloques (cada uno
 * agrupa muchos chunks reales para poder contarlos). Un fine-tune toca
 * una fracción de los bloques. Xet solo mueve los bloques que el otro
 * lado no tiene; un LFS ingenuo vuelve a mover el fichero entero.
 * ==================================================================== */

type XetStep = "v1" | "v2" | "pull";
type Backend = "xet" | "lfs";

const BLOCKS = 48;
const SHARD_GB = 5;
const BLOCK_GB = SHARD_GB / BLOCKS;
const gb = (n: number) => `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n)} GB`;

/** Which blocks a fine-tune rewrites: a fixed pseudo-random order, first p% of it. */
function changedBlocks(percent: number) {
  const order = Array.from({ length: BLOCKS }, (_, k) => k).sort((a, b) => hash(a, 7) - hash(b, 7));
  return new Set(order.slice(0, Math.round((percent / 100) * BLOCKS)));
}

function xetModel(step: XetStep, backend: Backend, changed: Set<number>) {
  const moved = step === "v1" ? BLOCKS : backend === "lfs" ? BLOCKS : changed.size;
  const stored = step === "v1" ? BLOCKS : BLOCKS + (backend === "lfs" ? BLOCKS : changed.size);
  return { moved, movedGb: moved * BLOCK_GB, stored, storedGb: stored * BLOCK_GB, commits: step === "v1" ? 1 : 2 };
}

function SpanishVisual() {
  const [step, setStep] = useState<XetStep>("v2");
  const [backend, setBackend] = useState<Backend>("xet");
  const [percent, setPercent] = useState(25);
  const changed = useMemo(() => changedBlocks(percent), [percent]);
  const m = xetModel(step, backend, changed);

  const notes: Record<XetStep, string> = {
    v1: `Primer commit: el Hub no tiene nada, así que se suben los ${BLOCKS} bloques (${gb(SHARD_GB)}). En Git solo queda un puntero pequeño; los bytes van al almacén Xet.`,
    v2: backend === "xet"
      ? `El fine-tune reescribió ${changed.size} de ${BLOCKS} bloques. Xet compara por contenido y sube solo esos: ${gb(m.movedGb)}. El commit 2 apunta a ${BLOCKS - changed.size} bloques viejos y ${changed.size} nuevos.`
      : `Con LFS ingenuo el fichero cambiado es un objeto nuevo entero: se vuelven a subir ${gb(SHARD_GB)} aunque solo cambiara el ${percent} %, y el almacén guarda las dos copias completas.`,
    pull: backend === "xet"
      ? `Tu caché ya tiene v1. Al bajar v2 solo viajan los ${changed.size} bloques que no tienes: ${gb(m.movedGb)} en lugar de ${gb(SHARD_GB)}.`
      : `Sin deduplicación por contenido, bajar v2 descarga el fichero completo otra vez: ${gb(SHARD_GB)}.`,
  };

  return (
    <Figure
      label="El Hub es Git más Xet: solo viajan los bytes nuevos"
      hint={`shard de ${gb(SHARD_GB)} · ${BLOCKS} bloques · ${percent} % reescrito`}
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "Bloque de v1" },
        { color: P.amber, label: "Bloque nuevo de v2" },
        { color: P.violet, label: "Commit Git" },
        { color: P.rose, label: "Copia repetida" },
      ]}
      controls={
        <>
          <Switcher ariaLabel="Operación" value={step} onChange={setStep} options={[{ value: "v1", label: "Subir v1", tone: P.teal }, { value: "v2", label: "Subir v2", tone: P.amber }, { value: "pull", label: "Bajar v2", tone: P.violet }]} />
          <Switcher ariaLabel="Almacenamiento" value={backend} onChange={setBackend} options={[{ value: "xet", label: "Xet", tone: P.teal }, { value: "lfs", label: "LFS ingenuo", tone: P.rose }]} />
          <Knob label="Reescrito" value={percent} min={0} max={100} step={5} onChange={setPercent} format={(v) => `${v} %`} tone={P.amber} />
        </>
      }
      note={
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
            {[
              ["Transferido", gb(m.movedGb)],
              ["Guardado en el Hub", gb(m.storedGb)],
              ["Commits Git", String(m.commits)],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="block text-xs text-muted">{label}</span>
                <strong className="mt-1 block font-display text-2xl text-ink">{value}</strong>
              </div>
            ))}
          </div>
          <p>{notes[step]}</p>
          <p className="text-xs text-muted">
            Bloques didácticos: Xet trabaja con chunks mucho más pequeños y definidos por contenido. Sigues haciendo git clone; la cifra del catálogo (más de 2 millones de modelos, 1,5 millones de datasets y 1,5 millones de Spaces) es la del índice del Hub consultado el 26-08-2026. Tokens, CLI y caché tienen sus propias secciones en la lección.
          </p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3, 6.5, 10.5], fov: 34 }} fit={1.05}>
        <XetBench step={step} backend={backend} changed={changed} />
      </Stage>
    </Figure>
  );
}

/* BENCH */
function Brick({ p, s, color, coat = 0.4, rough = 0.42, metal = 0.05 }: { p: V3; s: V3; color: string; coat?: number; rough?: number; metal?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(0.04, Math.min(s[0], s[1], s[2]) / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} />
    </RoundedBox>
  );
}

const COLS = 8;
const PITCH_B = 0.3;

function XetBench({ step, backend, changed }: { step: XetStep; backend: Backend; changed: Set<number> }) {
  const m = xetModel(step, backend, changed);
  const upload = step !== "pull";
  const moving = (k: number) => step === "v1" || backend === "lfs" || changed.has(k);
  const blockColor = (k: number) => {
    if (step === "v1") return P.teal;
    if (changed.has(k)) return P.amber;
    return backend === "lfs" ? P.rose : P.teal;
  };
  const flowColor = step === "v1" ? P.teal : backend === "lfs" ? P.rose : P.amber;
  const particles = Math.max(1, Math.min(8, Math.ceil(m.moved / 6)));
  const storeColor = (k: number) => (k < BLOCKS ? P.teal : backend === "lfs" && !changed.has(k - BLOCKS) ? P.rose : P.amber);
  return (
    <group>
      <Brick p={[0, -0.13, 0]} s={[10.2, 0.22, 4.2]} color="#40362D" rough={0.6} coat={0.3} />
      <Brick p={[0, 0.0, 0]} s={[9.9, 0.05, 3.9]} color="#6B513A" rough={0.55} coat={0} />

      {/* Your machine: the shard as an ingot of blocks. */}
      <group position={[-3.2, 0, 0]}>
        <Brick p={[0, 0.12, 0]} s={[2.9, 0.14, 2.3]} color="#2E3438" metal={0.3} />
        <Brick p={[0, 0.2, 0]} s={[2.7, 0.03, 2.1]} color="#3B4247" metal={0.2} coat={0.1} />
        {Array.from({ length: BLOCKS }, (_, k) => {
          const lift = moving(k) && (upload || changed.has(k) || backend === "lfs") ? 0.14 : 0;
          return (
            <Brick key={k} p={[(k % COLS - (COLS - 1) / 2) * PITCH_B, 0.33 + lift, (Math.floor(k / COLS) - 2.5) * PITCH_B]} s={[0.24, 0.2, 0.24]} color={blockColor(k)} />
          );
        })}
        <Tag position={[0, 0.25, 1.45]} tone="ink" size="xs" center>Tu máquina</Tag>
        <Tag position={[0, 0.85, -1.2]} tone="muted" size="xs" center>model.safetensors</Tag>
      </group>

      {/* Transfer lane. */}
      <Flow
        points={upload ? [[-1.5, 0.6, 0], [0, 1.3, 0], [1.4, 0.8, 0.2]] : [[1.4, 0.8, 0.2], [0, 1.3, 0], [-1.5, 0.6, 0]]}
        color={flowColor}
        count={particles}
        size={0.06}
        speed={0.3}
        lineOpacity={0.4}
        width={1.8}
      />
      <Tag position={[0, 1.6, 0]} tone={backend === "lfs" && step !== "v1" ? "rose" : "amber"} size="xs" center>{gb(m.movedGb)}</Tag>

      {/* The Hub: Git keeps pointers, Xet keeps unique blocks. */}
      <group position={[3.1, 0, 0]}>
        <Brick p={[0, 0.12, 0]} s={[3.2, 0.14, 3.4]} color="#263532" metal={0.3} />
        <Brick p={[0, 0.22, -0.45]} s={[3.0, 0.06, 2.1]} color="#C9C2B2" rough={0.5} coat={0.2} />
        {Array.from({ length: BLOCKS * 2 }, (_, k) => {
          const pos: V3 = [((k % 12) - 5.5) * 0.24, 0, (Math.floor(k / 12) - 3.5) * 0.24 - 0.45];
          return k < m.stored ? (
            <Brick key={k} p={[pos[0], 0.34, pos[2]]} s={[0.19, 0.18, 0.19]} color={storeColor(k)} />
          ) : (
            <mesh key={k} position={[pos[0], 0.255, pos[2]]}>
              <boxGeometry args={[0.18, 0.01, 0.18]} />
              <meshStandardMaterial color="#B3AB99" roughness={0.7} />
            </mesh>
          );
        })}
        <Tag position={[0, 0.75, -1.65]} tone="teal" size="xs" center>Almacén Xet</Tag>
        {/* Git: a rail of commits, each holding a small pointer card. */}
        <mesh position={[0, 0.3, 1.15]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 2.6, 12]} />
          <meshStandardMaterial color={P.violet} roughness={0.4} />
        </mesh>
        {Array.from({ length: m.commits }, (_, c) => (
          <group key={c} position={[-0.7 + c * 1.1, 0.3, 1.15]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.16, 0.16, 0.12, 24]} />
              <meshPhysicalMaterial color={P.violet} roughness={0.35} clearcoat={0.5} />
            </mesh>
            <Brick p={[0, 0.3, 0]} s={[0.34, 0.4, 0.04]} color="#F2EEE4" rough={0.6} coat={0} />
            <Tag position={[0, 0.72, 0]} tone="violet" size="xs" center>{`commit ${c + 1}`}</Tag>
          </group>
        ))}
        <Tag position={[1.35, 0.3, 1.5]} tone="violet" size="xs">Git · punteros</Tag>
      </group>
    </group>
  );
}
