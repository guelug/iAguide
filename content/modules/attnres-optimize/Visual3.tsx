"use client";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, type Cell, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "comm" | "phases" | "io";
const COPY = {
  en: { title: "Block AttnRes makes depth communication shippable", hint: "cached comm · two phases · I/O", comm: "cached comm", phases: "two phases", io: "I/O", naive: "naive O(PV)", cached: "cache O(P)", phase1: "phase 1", phase2: "phase 2", block: "block cache", online: "online softmax", residual: "residual", cheap: "5.5d", full: "Full 24d" },
  es: { title: "Block AttnRes hace enviable la comunicación de profundidad", hint: "comm cacheada · dos fases · I/O", comm: "comm cacheada", phases: "dos fases", io: "I/O", naive: "ingenua O(PV)", cached: "caché O(P)", phase1: "fase 1", phase2: "fase 2", block: "caché bloques", online: "softmax online", residual: "residual", cheap: "5.5d", full: "Full 24d" },
};
function LegacyVisual() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("comm");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.cached }, { color: P.violet, label: t.online }, { color: P.amber, label: t.residual }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "comm", label: t.comm, tone: P.teal }, { value: "phases", label: t.phases, tone: P.violet }, { value: "io", label: t.io, tone: P.amber }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "comm" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.rose} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="rose">{t.naive}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.teal} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="teal">{t.cached}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">solo el bloque incremental cruza el rank</Tag></>}
    {mode === "phases" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="violet">{t.phase1}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.phase2}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">batch K/V previos → fusiona parcial</Tag></>}
    {mode === "io" && <><Node3D position={[-1.7, 0.2, 0]} color={P.teal} radius={0.2} pulse={0.3} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.cheap}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.3} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.full}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">Block reduce lecturas de profundidad</Tag></>}
  </PointerTilt></Stage></Figure>;
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: la factura de I/O por token y por capa (Tabla 1 del paper),
 * construida losa a losa. Cada losa es un vector de ancho d leído o escrito
 * por el mecanismo residual. L = 128 capas fijas; el control N reparte las
 * capas en bloques de S = L/N. Block = (N/S + 5)d, Full dos fases = (S + N)d,
 * residual 3d, mHC con m = 4 ≈ 34d.
 */

type Mech = "residual" | "block" | "full" | "mhc";
type Segment = { key: string; amount: number; color: string; tag: string };

const L_LAYERS = 128;
const N_OPTIONS = [2, 4, 8, 16, 32, 64];
const M_STREAMS = 4;
const D_MODEL = 4096;
const BF16 = 2;
const PITCH = 1.75;
const TRAY_TOP = 0.36;
const TILE_W = 0.95;
const TILE_D = 0.95;

const es1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });
const esInt = new Intl.NumberFormat("es-ES");

const READ1 = P.violet;
const READ2 = P.teal;
const WRITE = P.amber;

function ioModel(n: number) {
  const s = L_LAYERS / n;
  const mech: Record<Mech, { name: string; segments: Segment[] }> = {
    residual: {
      name: "Residual",
      segments: [
        { key: "r", amount: 2, color: READ2, tag: "lee 2d" },
        { key: "w", amount: 1, color: WRITE, tag: "escribe d" },
      ],
    },
    block: {
      name: "Block",
      segments: [
        { key: "r1", amount: n / s, color: READ1, tag: `F1 lee ${es1.format(n / s)}d` },
        { key: "w1", amount: 1, color: WRITE, tag: "F1 escribe d" },
        { key: "r2", amount: 3, color: READ2, tag: "F2 lee 3d" },
        { key: "w2", amount: 1, color: WRITE, tag: "F2 escribe d" },
      ],
    },
    full: {
      name: "Full",
      segments: [
        { key: "r1", amount: n - 1, color: READ1, tag: `F1 lee ${n - 1}d` },
        { key: "w1", amount: 1, color: WRITE, tag: "F1 escribe d" },
        { key: "r2", amount: s - 1, color: READ2, tag: `F2 lee ${s - 1}d` },
        { key: "w2", amount: 1, color: WRITE, tag: "F2 escribe d" },
      ],
    },
    mhc: {
      name: "mHC",
      segments: [{ key: "m", amount: 8 * M_STREAMS + 2, color: P.rose, tag: "(8m+2)d" }],
    },
  };
  const totals = Object.fromEntries(
    (Object.keys(mech) as Mech[]).map((k) => [k, mech[k].segments.reduce((sum, seg) => sum + seg.amount, 0)]),
  ) as Record<Mech, number>;
  return { s, mech, totals };
}

const ORDER: Mech[] = ["residual", "block", "full", "mhc"];

function IoTowers({ n, focus }: { n: number; focus: Mech }) {
  const model = useMemo(() => ioModel(n), [n]);
  const maxTotal = Math.max(...ORDER.map((k) => model.totals[k]));
  const unit = Math.min(0.12, 4.4 / maxTotal);
  const tileH = unit * 0.8;

  const { tiles, labels } = useMemo(() => {
    const cells: Cell[] = [];
    const segTags: { position: V3; text: string; tone: "violet" | "teal" | "amber" | "rose" }[] = [];
    ORDER.forEach((key, i) => {
      const x = (i - 1.5) * PITCH;
      const focused = key === focus;
      const gap = focused ? unit * 1.6 : 0;
      let y = TRAY_TOP + 0.02;
      model.mech[key].segments.forEach((seg, si) => {
        const whole = Math.floor(seg.amount + 1e-9);
        const frac = seg.amount - whole;
        const start = y;
        for (let t = 0; t < whole; t += 1) {
          cells.push({
            position: [x, y + tileH / 2, 0],
            scale: [TILE_W, tileH, TILE_D],
            color: focused ? seg.color : mixHex(P.paper, seg.color, 0.55),
          });
          y += unit;
        }
        if (frac > 1e-6) {
          cells.push({
            position: [x, y + (tileH * frac) / 2, 0],
            scale: [TILE_W, tileH * frac, TILE_D],
            color: focused ? seg.color : mixHex(P.paper, seg.color, 0.55),
          });
          y += unit * frac;
        }
        if (focused) {
          const tone = seg.color === READ1 ? "violet" : seg.color === READ2 ? "teal" : seg.color === WRITE ? "amber" : "rose";
          segTags.push({ position: [x + TILE_W / 2 + 0.12, (start + y) / 2, TILE_D / 2], text: seg.tag, tone });
          if (si < model.mech[key].segments.length - 1) y += gap;
        }
      });
    });
    return { tiles: cells, labels: segTags };
  }, [model, focus, unit, tileH]);

  const heights = ORDER.map((key) => {
    const segs = model.mech[key].segments;
    const extra = key === focus ? unit * 1.6 * (segs.length - 1) : 0;
    return TRAY_TOP + model.totals[key] * unit + extra;
  });
  const ticks = Array.from({ length: Math.floor(maxTotal / 10) + 1 }, (_, i) => i * 10);
  const ruleX = -1.5 * PITCH - 0.95;

  return (
    <group>
      <ShadowBlob position={[0, 0.004, 0.2]} scale={9} opacity={0.12} />
      <RoundedBox args={[PITCH * 4 + 1.2, 0.24, 2.4]} position={[0.2, 0.12, 0.25]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
      </RoundedBox>
      {ORDER.map((key, i) => {
        const x = (i - 1.5) * PITCH;
        const focused = key === focus;
        return (
          <group key={key}>
            <RoundedBox args={[1.3, 0.1, 1.3]} position={[x, TRAY_TOP - 0.06, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
              <meshStandardMaterial color={focused ? "#2C3332" : "#9DA5A0"} roughness={0.4} metalness={0.25} />
            </RoundedBox>
            {[-0.56, 0.56].flatMap((dx) =>
              [-0.56, 0.56].map((dz) => (
                <mesh key={`${dx}:${dz}`} position={[x + dx, TRAY_TOP + 0.005, dz]} castShadow>
                  <cylinderGeometry args={[0.035, 0.035, 0.03, 10]} />
                  <meshStandardMaterial color="#B7833E" metalness={0.75} roughness={0.28} />
                </mesh>
              )),
            )}
            <Tag position={[x, TRAY_TOP - 0.1, 1.02]} tone={focused ? "ink" : "muted"} size="xs" center plate={focused}>
              {model.mech[key].name}
            </Tag>
            <Tag position={[x, heights[i] + 0.28, 0]} tone={key === "mhc" ? "rose" : key === "residual" ? "teal" : focused ? "violet" : "muted"} size="sm" center>
              {`${es1.format(model.totals[key])}d`}
            </Tag>
          </group>
        );
      })}
      <Lattice cells={tiles} size={1} />
      {labels.map((l) => (
        <Tag key={l.text + l.position[1]} position={l.position} tone={l.tone} size="xs">
          {l.text}
        </Tag>
      ))}
      <Wire points={[[ruleX, TRAY_TOP, -0.4], [ruleX, TRAY_TOP + maxTotal * unit, -0.4]]} color={P.inkSoft} width={1.2} opacity={0.6} />
      {ticks.map((t) => (
        <group key={t}>
          <Wire points={[[ruleX, TRAY_TOP + t * unit, -0.4], [ruleX + 0.12, TRAY_TOP + t * unit, -0.4]]} color={P.inkSoft} width={1} opacity={0.6} />
          <Tag position={[ruleX - 0.22, TRAY_TOP + t * unit, -0.4]} tone="muted" size="xs" center plate={false}>
            {`${t}d`}
          </Tag>
        </group>
      ))}
      <Wire
        points={[[ruleX, TRAY_TOP + 3 * unit, -0.45], [1.5 * PITCH + 0.6, TRAY_TOP + 3 * unit, -0.45]]}
        color={P.teal}
        dashed
        width={1.1}
        opacity={0.55}
      />
    </group>
  );
}

function SpanishVisual() {
  const [nIndex, setNIndex] = useState(2);
  const [focus, setFocus] = useState<Mech>("block");
  const n = N_OPTIONS[nIndex];
  const model = ioModel(n);
  const kibOf = (k: Mech) => es1.format((model.totals[k] * D_MODEL * BF16) / 1024);

  const derivation: Record<Mech, string> = {
    residual: "Residual estándar: lee el skip y la rama (2d) y escribe la suma (d). Total 3d, la línea discontinua que sirve de referencia.",
    block: `Block, dos fases: la Fase 1 lee los N = ${n} resúmenes una vez por bloque de S = ${model.s} capas, es decir (N/S)d = ${es1.format(n / model.s)}d por capa, y escribe d. La Fase 2 lee 3d (parcial, skip y rama) y escribe d. Total (N/S + 5)d = ${es1.format(model.totals.block)}d.`,
    full: `Full con el mismo horario en dos fases: la Fase 1 amortizada lee (N−1)d = ${n - 1}d y escribe d; la Fase 2 relee las S−1 = ${model.s - 1} capas del bloque y escribe d. Total (S + N)d = ${model.totals.full}d. Sin agrupar serían unas L = 128 lecturas por capa.`,
    mhc: `mHC con m = ${M_STREAMS} flujos: puertas y mezclas sobre cuatro corrientes, (8m + 2)d = ${model.totals.mhc}d más 2m² + 4m = ${2 * M_STREAMS * M_STREAMS + 4 * M_STREAMS} escalares. No depende de N.`,
  };

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 border-b border-line pb-3 sm:grid-cols-4">
        {ORDER.map((k) => (
          <div key={k}>
            <span className="block text-xs text-muted">{model.mech[k].name}</span>
            <strong className={`mt-1 block font-display text-xl ${k === focus ? "text-ink" : "text-muted"}`}>{es1.format(model.totals[k])}d</strong>
            <span className="block font-mono text-[0.65rem] text-faint">{kibOf(k)} KiB</span>
          </div>
        ))}
      </div>
      <p>{derivation[focus]}</p>
      <p>
        {n === 8
          ? "Con los números típicos del paper (L = 128, N = 8, S = 16), Block cuesta 5,5d frente a 24d de Full y 34d de mHC: por eso es el mezclador de producción."
          : n > 8
            ? `Con más bloques (N = ${n}) la Fase 1 de Block deja de ser barata: N/S = ${es1.format(n / model.s)} lecturas por capa. Comprimir en pocos resúmenes es lo que mantiene la factura cerca de 3d.`
            : `Con pocos bloques (N = ${n}, S = ${model.s}) Block roza 5d, pero Full se dispara por la Fase 2: relee ${model.s - 1} capas intra-bloque.`}
      </p>
      <p className="text-xs text-muted">
        Por token y por capa, solo el mecanismo residual (sin las tripas de f). Cada losa es un vector de ancho d; KiB con d = 4096 en BF16, cifra
        didáctica. L = 128 capas fijas: S = L/N.
      </p>
    </div>
  );

  return (
    <Figure
      label="La factura de I/O: losas de ancho d por token y capa"
      hint="Tabla 1 del paper · L = 128 · lecturas y escrituras"
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: READ1, label: "lectura fase 1" },
        { color: READ2, label: "lectura fase 2 / skip" },
        { color: WRITE, label: "escritura" },
        { color: P.rose, label: "mHC (m = 4)" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            ariaLabel="Mecanismo a desglosar"
            value={focus}
            onChange={setFocus}
            options={[
              { value: "residual", label: "Residual", tone: P.teal },
              { value: "block", label: "Block", tone: P.violet },
              { value: "full", label: "Full", tone: P.violet },
              { value: "mhc", label: "mHC", tone: P.rose },
            ]}
          />
          <Knob label="Bloques N" min={0} max={N_OPTIONS.length - 1} value={nIndex} onChange={setNIndex} format={(i) => `${N_OPTIONS[i]} · S ${L_LAYERS / N_OPTIONS[i]}`} tone={P.violet} />
          <Readout
            items={[
              { label: "Block", value: `${es1.format(model.totals.block)}d`, tone: P.violet },
              { label: "Full", value: `${esInt.format(model.totals.full)}d`, tone: P.inkSoft },
            ]}
          />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-3.5, 5, 10.5], fov: 34 }} fit={1.08}>
        <IoTowers n={n} focus={focus} />
      </Stage>
    </Figure>
  );
}
