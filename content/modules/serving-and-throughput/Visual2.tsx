"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, type Cell } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Dos maneras de desperdiciar una GPU, y cómo se evitan.
 *
 * Batching: 12 peticiones con longitudes de salida distintas (didácticas)
 * en 4 slots. Estático espera a que termine la más larga del lote; continuo
 * mete la siguiente en cuanto se libera un slot. La maqueta es un diagrama
 * de Gantt con volumen: slots en profundidad, pasos de decode a lo ancho.
 * KV: 32 GB de VRAM para caché KV, 1 MB por token (8K de contexto = 8 GB,
 * la cifra de la lección). Contigua reserva 8 GB por petición aunque use
 * unos cientos de tokens; paginada asigna páginas solo para lo usado. Cada
 * celda dibujada son 128 MB (8 páginas de 16 tokens).
 */

type PlateMode = "static" | "continuous" | "contiguous" | "paged";

const SLOTS = 4;
const LENGTHS = [9, 3, 6, 4, 12, 2, 5, 8, 3, 7, 4, 10];
const REQ_COLORS = [P.teal, P.amber, P.violet, "#3E6FA8", P.rose, "#6B8F3C"];

type Gantt = { cells: { slot: number; step: number; req: number }[]; steps: number };

function schedule(continuous: boolean): Gantt {
  const cells: Gantt["cells"] = [];
  if (!continuous) {
    let t = 0;
    for (let b = 0; b < LENGTHS.length; b += SLOTS) {
      const batch = LENGTHS.slice(b, b + SLOTS);
      batch.forEach((len, s) => { for (let k = 0; k < len; k++) cells.push({ slot: s, step: t + k, req: b + s }); });
      t += Math.max(...batch);
    }
    return { cells, steps: t };
  }
  const free = Array(SLOTS).fill(0);
  LENGTHS.forEach((len, r) => {
    const s = free.indexOf(Math.min(...free));
    for (let k = 0; k < len; k++) cells.push({ slot: s, step: free[s] + k, req: r });
    free[s] += len;
  });
  return { cells, steps: Math.max(...free) };
}

const MB_PER_TOKEN = 1;
const CELL_MB = 128;
const GRID = 16; // 16 × 16 cells = 32 GB
const RESERVE_TOKENS = 8192;

function requestTokens(i: number) {
  let x = Math.imul(i + 3, 2654435761) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0;
  return 300 + Math.round((((x ^ (x >>> 13)) >>> 0) / 4294967296) * 2200);
}

function allocate(paged: boolean) {
  const total = GRID * GRID;
  const owner: { req: number; used: boolean }[] = [];
  let r = 0;
  while (true) {
    const used = Math.ceil((requestTokens(r) * MB_PER_TOKEN) / CELL_MB);
    const reserve = paged ? used : (RESERVE_TOKENS * MB_PER_TOKEN) / CELL_MB;
    if (owner.length + reserve > total) break;
    for (let c = 0; c < reserve; c++) owner.push({ req: r, used: c < used });
    r += 1;
  }
  const usedCells = owner.filter((o) => o.used).length;
  return { owner, fit: r, usedGB: (usedCells * CELL_MB) / 1024, reservedGB: (owner.length * CELL_MB) / 1024 };
}

const fmt = (n: number, d = 0) => n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

const STEP_W = 0.27;

function GanttScene({ continuous }: { continuous: boolean }) {
  const g = useMemo(() => schedule(continuous), [continuous]);
  const x0 = -(31 * STEP_W) / 2;
  const cells: Cell[] = useMemo(() => {
    const busy = new Set(g.cells.map((c) => `${c.slot}:${c.step}`));
    const out: Cell[] = g.cells.map((c) => ({ position: [x0 + c.step * STEP_W, 0.24, (c.slot - 1.5) * 0.62], scale: [1, 1.5, 2.2], color: REQ_COLORS[c.req % REQ_COLORS.length] }));
    for (let s = 0; s < SLOTS; s++) for (let t = 0; t < g.steps; t++) if (!busy.has(`${s}:${t}`)) out.push({ position: [x0 + t * STEP_W, 0.1, (s - 1.5) * 0.62], scale: [1, 0.25, 2.2], color: "#C9C3B5" });
    return out;
  }, [g, x0]);
  const endX = x0 + g.steps * STEP_W - STEP_W / 2;
  return (
    <group>
      <RoundedBox args={[31 * STEP_W + 1.2, 0.14, 3.2]} position={[0, 0, 0]} radius={0.05} smoothness={3} castShadow receiveShadow><Physical color="#263532" metal={0.3} coat={0.3} /></RoundedBox>
      {Array.from({ length: SLOTS }, (_, s) => <Tag key={s} position={[x0 - 0.75, 0.1, (s - 1.5) * 0.62]} tone="muted" size="xs" center>{`slot ${s + 1}`}</Tag>)}
      <Lattice cells={cells} size={0.2} />
      {/* the finish line: the step at which the last request completes */}
      <mesh position={[endX + 0.05, 0.5, 0]}><boxGeometry args={[0.03, 0.9, 2.8]} /><meshBasicMaterial color={continuous ? P.teal : P.rose} transparent opacity={0.6} /></mesh>
      <Tag position={[endX + 0.05, 1.15, -1.3]} tone={continuous ? "teal" : "rose"} size="xs" center>{`${g.steps} pasos`}</Tag>
      <Tag position={[0, 0.05, 1.9]} tone="muted" size="xs" center>pasos de decode →</Tag>
    </group>
  );
}

function VramScene({ paged }: { paged: boolean }) {
  const a = useMemo(() => allocate(paged), [paged]);
  const pitch = 0.3;
  const cells: Cell[] = useMemo(() => Array.from({ length: GRID * GRID }, (_, i) => {
    const o = a.owner[i];
    const x = ((i % GRID) - (GRID - 1) / 2) * pitch;
    const z = (Math.floor(i / GRID) - (GRID - 1) / 2) * pitch;
    if (!o) return { position: [x, 0.12, z], scale: [1, 0.3, 1], color: "#D8D2C4" };
    const col = REQ_COLORS[o.req % REQ_COLORS.length];
    return o.used ? { position: [x, 0.2, z], scale: [1, 1, 1], color: col } : { position: [x, 0.12, z], scale: [1, 0.3, 1], color: mixHex(P.paper, col, 0.3) };
  }), [a]);
  return (
    <group>
      <RoundedBox args={[GRID * pitch + 0.5, 0.14, GRID * pitch + 0.5]} position={[0, 0, 0]} radius={0.05} smoothness={3} castShadow receiveShadow><Physical color="#263532" metal={0.3} coat={0.3} /></RoundedBox>
      <Lattice cells={cells} size={0.24} />
      <Tag position={[0, 0.05, (GRID * pitch) / 2 + 0.55]} tone="ink" size="xs" center>VRAM para KV · 32 GB</Tag>
      <Tag position={[(GRID * pitch) / 2 + 0.9, 0.3, 0]} tone={paged ? "teal" : "rose"} size="xs" center>{`${a.fit} peticiones`}</Tag>
    </group>
  );
}

function PlateScene({ mode }: { mode: PlateMode }) {
  return (
    <PointerTilt amount={0.035}>
      <group>
        <ShadowBlob position={[0, -0.1, 0]} scale={9} opacity={0.07} />
        <RoundedBox args={[10, 0.16, 6.4]} position={[0, -0.14, 0]} radius={0.06} smoothness={3} receiveShadow><Physical color="#6E5440" rough={0.6} coat={0.15} /></RoundedBox>
        {mode === "static" || mode === "continuous" ? <GanttScene continuous={mode === "continuous"} /> : <VramScene paged={mode === "paged"} />}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<PlateMode>("static");
  const work = LENGTHS.reduce((a, b) => a + b, 0);
  const st = useMemo(() => schedule(false), []);
  const ct = useMemo(() => schedule(true), []);
  const contig = useMemo(() => allocate(false), []);
  const paged = useMemo(() => allocate(true), []);
  const batching = mode === "static" || mode === "continuous";
  const g = mode === "continuous" ? ct : st;
  const a = mode === "paged" ? paged : contig;
  const body = mode === "static"
    ? <>Batching estático: lotes de {SLOTS} peticiones que esperan a la más larga. Los slots grises son GPU parada: la petición corta terminó y su hueco no se reutiliza hasta el siguiente lote. {LENGTHS.length} peticiones tardan {st.steps} pasos.</>
    : mode === "continuous"
      ? <>Batching continuo: en cuanto una petición termina, la siguiente de la cola entra en su slot a mitad del decode del resto. Las mismas {LENGTHS.length} peticiones terminan en {ct.steps} pasos en lugar de {st.steps} (el estático necesita {fmt(st.steps / ct.steps, 1)}× más); el scheduler decide cada paso quién avanza.</>
      : mode === "contiguous"
        ? <>KV contigua: cada petición reserva el bloque de su contexto máximo ({fmt(RESERVE_TOKENS)} tokens × {MB_PER_TOKEN} MB = 8 GB) aunque use unos cientos de tokens. Caben {contig.fit} peticiones; de los {fmt(contig.reservedGB)} GB reservados solo se usan {fmt(contig.usedGB, 1)} GB. Las celdas pálidas son reserva vacía.</>
        : <>Paged attention: la caché se trocea en páginas de 16 tokens y se asignan solo cuando hacen falta. Con los mismos 32 GB caben {paged.fit} peticiones (se usan {fmt(paged.usedGB, 1)} GB). «No me cabe otro usuario» suele ser KV mal gestionada, no el modelo.</>;
  const util = (work / (SLOTS * g.steps)) * 100;
  return (
    <Figure
      label="Batching continuo y KV paginada · dos huecos que se rellenan"
      hint="slots × pasos · páginas de VRAM"
      height="h-[440px] md:h-[540px]"
      legend={batching ? [{ color: P.teal, label: "una petición por color" }, { color: "#C9C3B5", label: "slot parado" }] : [{ color: P.teal, label: "KV usada (por petición)" }, { color: mixHex(P.paper, P.teal, 0.3), label: "reservada sin usar" }, { color: "#D8D2C4", label: "libre" }]}
      controls={<Switcher value={mode} onChange={setMode} ariaLabel="Vista" options={[{ value: "static", label: "Estático", tone: P.rose }, { value: "continuous", label: "Continuo", tone: P.teal }, { value: "contiguous", label: "KV contigua", tone: P.rose }, { value: "paged", label: "KV paginada", tone: P.violet }]} />}
      note={
        <div className="space-y-3">
          <p>{body}</p>
          {batching ? (
            <Readout items={[
              { label: "pasos totales", value: String(g.steps), tone: mode === "continuous" ? "var(--teal)" : "var(--rose)" },
              { label: "ocupación de slots", value: `${fmt(util)} %`, tone: "var(--amber)" },
              { label: "trabajo útil", value: `${work} tokens` },
            ]} />
          ) : (
            <Readout items={[
              { label: "peticiones que caben", value: String(a.fit), tone: mode === "paged" ? "var(--teal)" : "var(--rose)" },
              { label: "KV usada", value: `${fmt(a.usedGB, 1)} GB`, tone: "var(--amber)" },
              { label: "reservada", value: `${fmt(a.reservedGB, 1)} GB` },
            ]} />
          )}
          <p className="text-xs text-muted">Datos didácticos: longitudes de salida {LENGTHS.join(", ")} (en pasos); peticiones de 300 a 2.500 tokens generadas en el código; 1 MB de KV por token, la cifra implícita en «8K de contexto = 8 GB» de la lección. Cada celda de VRAM son 128 MB. Ignora prefill, prefix caching y la política real del scheduler.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 6.4, 8.4], fov: 34 }} fit={1.06}>
        <PlateScene mode={mode} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

/* serving: batching timeline, KV paging, speculative decoding. */
type Mode = "batching" | "paging" | "spec";

const COPY = {
  en: {
    throughput_is_batching_paged_kv_drafts: "throughput is batching + paged KV + drafts",
    the_trinity_of_fast_inference: "the trinity of fast inference",
    batching: "continuous batching",
    paging: "paged attention",
    spec: "speculative",
    joins: "joins",
    leaves: "leaves",
    draft: "draft",
    verify: "verify",
    accepted: "accepted",
    rejected: "rejected",
    pages: "pages",
  },
  es: {
    throughput_is_batching_paged_kv_drafts: "el throughput es batching + KV paginada + borradores",
    the_trinity_of_fast_inference: "la trinidad de la inferencia rápida",
    batching: "batching continuo",
    paging: "atención paginada",
    spec: "especulativa",
    joins: "entra",
    leaves: "sale",
    draft: "borrador",
    verify: "verifica",
    accepted: "aceptado",
    rejected: "rechazado",
    pages: "páginas",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("batching");

  return (
    <Figure
      label={t.throughput_is_batching_paged_kv_drafts}
      hint={t.throughput_is_batching_paged_kv_drafts}
      legend={[
        { color: P.teal, label: t.batching },
        { color: P.violet, label: t.paging },
        { color: P.amber, label: t.spec },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "batching", label: t.batching, tone: P.teal },
            { value: "paging", label: t.paging, tone: P.violet },
            { value: "spec", label: t.spec, tone: P.amber },
          ]}
          ariaLabel={t.throughput_is_batching_paged_kv_drafts}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "batching" && (
          <>
            {/* requests joining / leaving */}
            <Wire points={[[-2.5, 0.9, 0], [2.5, 0.9, 0]]} color={P.lineStrong} opacity={0.5} />
            {[0, 1, 2, 3, 4].map((i) => (
              <group key={i}>
                <Wire
                  points={[[-2.2 + i * 0.4, 0.9, 0], [1.9 + i * 0.1, 0.9, 0]]}
                  color={i === 4 ? P.rose : P.teal}
                  width={5}
                  opacity={0.8}
                />
                {i < 4 && <Node3D position={[-2.2 + i * 0.4, 0.9, 0]} color={P.teal} radius={0.08} pulse={i * 0.3} />}
              </group>
            ))}
            <Tag position={[-2.5, 1.3, 0.15]} tone="teal" size="xs">{t.joins}</Tag>
            <Tag position={[2.5, 1.3, 0.15]} tone="rose" size="xs">{t.leaves}</Tag>
            {/* decode slab underneath */}
            <Slab position={[0, -0.5, 0]} size={[4.6, 0.95, 0.14]} color={P.violet} fill={0.18} />
            <Tag position={[0, -1.05, 0.15]} tone="violet">decode step</Tag>
            <Tag position={[0, -1.55, 0.15]} tone="muted" size="xs">gpu busy</Tag>
          </>
        )}

        {mode === "paging" && (
          <>
            <Lattice
              cells={Array.from({ length: 24 }, (_, i) => ({
                position: [-2.4 + (i % 8) * 0.62, 0.7 - Math.floor(i / 8) * 0.55, 0] as [number, number, number],
                color: i % 5 === 0 ? P.muted : i % 3 === 0 ? P.violet : P.teal,
              }))}
              size={0.26}
              opacity={0.9}
            />
            <Tag position={[0, 1.4, 0.15]} tone="violet">{t.paging}</Tag>
            <Tag position={[2.5, 0.2, 0.15]} tone="muted" size="xs">{t.pages}</Tag>
            {/* virtual to physical mapping */}
            <Slab position={[-2.6, -0.95, 0]} size={[1.4, 0.5, 0.1]} color={P.amber} fill={0.24} />
            <Tag position={[-2.6, -0.55, 0.15]} tone="amber" size="xs">seq</Tag>
            <Wire points={[[-2.0, -0.85, 0], [-1.8, 0.55, 0]]} color={P.lineStrong} dashed opacity={0.6} />
          </>
        )}

        {mode === "spec" && (
          <>
            {/* draft model small and fast */}
            <Slab position={[-1.9, 0.5, 0]} size={[1.5, 0.7, 0.12]} color={P.teal} fill={0.32} />
            <Tag position={[-1.9, 1.05, 0.15]} tone="teal" size="xs">{t.draft}</Tag>
            {/* big verifier */}
            <Slab position={[0.7, 0.5, 0]} size={[2.6, 1.2, 0.16]} color={P.violet} fill={0.18} />
            <Tag position={[0.7, 1.35, 0.15]} tone="violet">{t.verify}</Tag>
            {/* ribbon from draft → verify */}
            <Ribbon points={[[-1.1, 0.55, 0], [-0.4, 0.55, 0], [-0.4, 0.55, 0]]} color={P.teal} radius={0.04} opacity={0.85} />
            {/* accepted / rejected */}
            <Node3D position={[2.7, 0.9, 0]} color={P.teal} radius={0.14} pulse={0.2} />
            <Tag position={[2.7, 1.3, 0.15]} tone="teal" size="xs">{t.accepted}</Tag>
            <Node3D position={[2.7, 0.1, 0]} color={P.rose} radius={0.14} pulse={0.5} />
            <Tag position={[2.7, -0.4, 0.15]} tone="rose" size="xs">{t.rejected}</Tag>
            {/* the trick: one forward of verifier covers many draft steps */}
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">1 fwd = N tokens</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
