"use client";

import { useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import type { Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Node3D, PointerTilt, ShadowBlob, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "stable" | "context" | "volatile" | "ephemeral" | "cache";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "prompt_assembly": "Prompt assembly",
      "step_the_diagram": "step the diagram",
      "stable": "stable",
      "context": "context",
      "ephemeral": "ephemeral",
      "cache_key": "cache key",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "prompt_assembly": "Montaje del prompt",
      "step_the_diagram": "recorre el diagrama",
      "stable": "estable",
      "context": "contexto",
      "ephemeral": "efímero",
      "cache_key": "clave de caché",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "stable" as const, label: t.stable, tone: "var(--teal)" },
    { value: "context" as const, label: t.context, tone: "var(--teal)" },
    { value: "volatile" as const, label: "volatile", tone: "var(--amber)" },
    { value: "ephemeral" as const, label: t.ephemeral, tone: "var(--violet)" },
    { value: "cache" as const, label: t.cache_key, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("stable");

  return (
    <Figure
      label={t.prompt_assembly}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="prompt-assembly diagram steps"
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
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "stable" ? P.teal : P.lineStrong}
        fill={active === "stable" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.stable}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "context" ? P.amber : P.lineStrong}
        fill={active === "context" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.context}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "volatile" ? P.violet : P.lineStrong}
        fill={active === "volatile" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>
        volatile
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "ephemeral" ? P.teal : P.lineStrong}
        fill={active === "ephemeral" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.ephemeral}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "cache" ? P.amber : P.lineStrong}
        fill={active === "cache" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.cache_key}</Tag>
    </group>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * El prompt como carril de prefijo. Cuatro tramos por vida útil con
 * breakpoints de caché al final de stable, context y volatile; lo efímero
 * va detrás del último. La caché del proveedor acierta hasta el primer
 * tramo que cambió: cacheHit() lo calcula. Tamaños en tokens didácticos.
 */

type Tier = "stable" | "context" | "volatile" | "ephemeral";
type Change = "none" | "clockEphemeral" | "clockStable" | "project" | "session" | "model";

const TIERS: { id: Tier; label: string; tokens: number; color: string; what: string }[] = [
  { id: "stable", label: "stable", tokens: 6000, color: P.teal, what: "SOUL / identidad, esquemas de tools, índice de skills" },
  { id: "context", label: "context", tokens: 2500, color: P.violet, what: "AGENTS.md o bootstrap del workspace" },
  { id: "volatile", label: "volatile", tokens: 800, color: P.amber, what: "snapshot de memoria y perfil, congelado al arrancar" },
  { id: "ephemeral", label: "efímero", tokens: 60, color: P.rose, what: "timestamp, session_id, channel_meta" },
];

const CHANGES: { id: Change; label: string; tier: Tier | "key" | null; text: string }[] = [
  { id: "none", label: "Nada", tier: null, text: "Turno normal: el prefijo congelado es idéntico byte a byte." },
  { id: "clockEphemeral", label: "Hora en efímero", tier: "ephemeral", text: "La hora cambia, pero vive debajo del último breakpoint: el bloque congelado sobrevive." },
  { id: "clockStable", label: "Hora en stable", tier: "stable", text: "timestamp: <now> al inicio del system prompt: cada turno muta el primer byte y la caché muere entera." },
  { id: "project", label: "Otro proyecto", tier: "context", text: "Cambiar de proyecto cambia el tier context: stable sigue acertando, lo demás se relee." },
  { id: "session", label: "Nueva sesión", tier: "volatile", text: "Una sesión nueva recarga el snapshot de memoria: stable y context aciertan, volatile se relee." },
  { id: "model", label: "/model", tier: "key", text: "La identidad del modelo forma parte de la clave de caché: aunque el texto sea igual, no hay acierto." },
];

const TOTAL = TIERS.reduce((a, t) => a + t.tokens, 0);
const fmtN = (n: number) => new Intl.NumberFormat("es-ES").format(n);

function cacheHit(change: Change) {
  const c = CHANGES.find((x) => x.id === change)!;
  const frozen = TIERS.filter((t) => t.id !== "ephemeral").reduce((a, t) => a + t.tokens, 0);
  let cached: number;
  let firstBad: number;
  if (c.tier === "key" || c.tier === "stable") { cached = 0; firstBad = 0; }
  else if (c.tier === null || c.tier === "ephemeral") { cached = frozen; firstBad = 3; }
  else {
    firstBad = TIERS.findIndex((t) => t.id === c.tier);
    cached = TIERS.slice(0, firstBad).reduce((a, t) => a + t.tokens, 0);
  }
  return { ...c, cached, uncached: TOTAL - cached, firstBad, pct: (100 * cached) / TOTAL };
}

const PA = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };
const RAIL = 8.4;
const EPH_W = 0.45; // el efímero se dibuja ampliado para que se vea
const K = (RAIL - EPH_W) / (TOTAL - TIERS[3].tokens);
const LAYOUT = (() => {
  let x = -RAIL / 2;
  return TIERS.map((t) => {
    const w = t.id === "ephemeral" ? EPH_W : t.tokens * K;
    const item = { ...t, w, x0: x, cx: x + w / 2 };
    x += w;
    return item;
  });
})();

function AMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

/* Tramo: bloque con ranuras (una cada ~500 tokens) y su tono. */
function TierBlock({ t, bad }: { t: (typeof LAYOUT)[number]; bad: boolean }) {
  const grooves = Math.max(0, Math.floor(t.tokens / 500) - 1);
  return (
    <group position={[t.cx, 0, 0]}>
      <RoundedBox args={[t.w - 0.06, 0.5, 0.9]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <AMat color={bad ? mixHex(P.paper, P.rose, 0.35) : mixHex(P.paper, t.color, 0.35)} clear={0.55} />
      </RoundedBox>
      {Array.from({ length: grooves }, (_, i) => (
        <mesh key={i} position={[-t.w / 2 + ((i + 1) * t.w) / (grooves + 1), 0.26, 0]}>
          <boxGeometry args={[0.015, 0.02, 0.8]} />
          <meshStandardMaterial color={mixHex(t.color, "#000000", 0.2)} />
        </mesh>
      ))}
      <Tag position={[0, t.id === "ephemeral" ? 0.55 : -0.05, t.id === "ephemeral" ? 0.2 : 0.62]} tone={bad ? "rose" : t.color === P.teal ? "teal" : t.color === P.violet ? "violet" : t.color === P.amber ? "amber" : "rose"} size="xs" center>{t.label}</Tag>
    </group>
  );
}

function Breakpoint({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox position={[0, 0.38, 0]} args={[0.1, 0.16, 1.1]} radius={0.03} smoothness={2} castShadow>
        <meshStandardMaterial color={PA.brass} metalness={0.75} roughness={0.28} />
      </RoundedBox>
      {[-0.52, 0.52].map((z) => (
        <mesh key={z} position={[0, 0.05, z]}>
          <boxGeometry args={[0.08, 0.6, 0.06]} />
          <meshStandardMaterial color={PA.brass} metalness={0.75} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

/* Cabezal que compara byte a byte y se detiene en la primera diferencia. */
function ScanHead({ stopX }: { stopX: number }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const start = -RAIL / 2;
    if (still) { g.position.x = stopX; return; }
    const period = 3.2;
    const t = (clock.elapsedTime % period) / period;
    const travel = Math.min(1, t / 0.7);
    g.position.x = start + (stopX - start) * travel;
  });
  return (
    <group ref={ref} position={[stopX, 0.75, 0]}>
      <RoundedBox args={[0.3, 0.22, 1.2]} radius={0.05} smoothness={2} castShadow>
        <AMat color={PA.graphite} metal={0.35} />
      </RoundedBox>
      <mesh position={[0, -0.2, 0]}>
        <coneGeometry args={[0.07, 0.16, 16]} />
        <meshStandardMaterial color={P.ink} />
      </mesh>
    </group>
  );
}

function PrefixBench({ change }: { change: Change }) {
  const h = cacheHit(change);
  const cachedEnd = h.firstBad === 0 ? -RAIL / 2 : LAYOUT[h.firstBad].x0;
  const coverW = cachedEnd + RAIL / 2;
  const badTiers = new Set(LAYOUT.map((t, i) => (i >= h.firstBad && (h.tier !== null && h.tier !== "ephemeral") ? i : -1)).filter((i) => i >= 0));
  if (h.tier === "ephemeral") badTiers.add(3);
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0, 0]}>
        <ShadowBlob position={[0, -0.72, 0.2]} scale={10} opacity={0.12} />
        <RoundedBox position={[0, -0.55, 0.1]} args={[9.8, 0.32, 2.4]} radius={0.15} smoothness={4} castShadow receiveShadow>
          <AMat color={PA.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.35, 0.1]} args={[9.5, 0.08, 2.1]} radius={0.04} smoothness={3} receiveShadow>
          <AMat color={PA.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        {LAYOUT.map((t, i) => <TierBlock key={t.id} t={t} bad={badTiers.has(i)} />)}
        {[1, 2, 3].map((i) => <Breakpoint key={i} x={LAYOUT[i].x0} />)}
        {coverW > 0.05 ? (
          <mesh position={[-RAIL / 2 + coverW / 2, 0.12, 0]}>
            <boxGeometry args={[coverW, 0.78, 1.15]} />
            <meshPhysicalMaterial color={P.teal} transparent opacity={0.13} roughness={0.08} depthWrite={false} />
          </mesh>
        ) : null}
        <ScanHead key={change} stopX={cachedEnd + (h.firstBad === 0 ? 0.15 : 0)} />
        <Tag position={[-RAIL / 2 + Math.max(coverW, 1.6) / 2, 1.2, 0]} tone={h.cached ? "teal" : "rose"} center>{h.cached ? "prefijo en caché" : "caché fallida"}</Tag>
        {h.tier === "key" ? <Tag position={[-RAIL / 2 - 0.1, 0.6, 0.8]} tone="rose" size="xs" center>clave: modelo</Tag> : null}
        {h.tier && h.tier !== "key" ? (
          <mesh position={[LAYOUT[h.firstBad].x0 + 0.12, 0.3, 0.46]}>
            <sphereGeometry args={[0.07, 18, 14]} />
            <meshStandardMaterial color={P.rose} emissive={P.rose} emissiveIntensity={0.5} />
          </mesh>
        ) : null}
        <Tag position={[LAYOUT[3].x0, -0.35, 1.15]} tone="muted" size="xs" center>último breakpoint</Tag>
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [change, setChange] = useState<Change>("clockEphemeral");
  const h = cacheHit(change);
  return (
    <Figure
      label="El prompt por vida útil · la caché solo quiere la pila congelada"
      hint="stable → context → volatile | efímero"
      height="h-[420px] md:h-[500px]"
      legend={[
        { color: P.teal, label: "stable" },
        { color: P.violet, label: "context" },
        { color: P.amber, label: "volatile" },
        { color: P.rose, label: "efímero / invalidado" },
        { color: PA.brass, label: "breakpoint de caché" },
      ]}
      controls={<Switcher value={change} onChange={setChange} ariaLabel="Qué cambia en este turno" options={CHANGES.map((c) => ({ value: c.id, label: c.label, tone: c.tier === "stable" || c.tier === "key" ? P.rose : P.teal }))} />}
      note={
        <div className="space-y-3">
          <p><strong>{h.label}.</strong> {h.text}</p>
          <Readout
            items={[
              { label: "en caché", value: fmtN(h.cached) + " tokens", tone: "var(--teal)" },
              { label: "a precio completo", value: fmtN(h.uncached) + " tokens", tone: "var(--rose)" },
              { label: "acierto", value: new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(h.pct) + " %", tone: h.pct > 50 ? "var(--teal)" : "var(--rose)" },
            ]}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-left text-xs">
              <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted"><tr><th className="border-b border-line px-2 py-1">tramo</th><th className="border-b border-line px-2 py-1">tokens</th><th className="border-b border-line px-2 py-1">contenido</th></tr></thead>
              <tbody>{TIERS.map((t) => <tr key={t.id}><td className="border-b border-line/60 px-2 py-1 font-mono" style={{ color: t.color }}>{t.label}</td><td className="border-b border-line/60 px-2 py-1 font-mono tabular-nums">{fmtN(t.tokens)}</td><td className="border-b border-line/60 px-2 py-1">{t.what}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="text-xs text-muted">Tamaños didácticos; el ancho de cada tramo es proporcional a sus tokens salvo el efímero, ampliado para que se vea. Lo efímero siempre se relee (y el mensaje nuevo del usuario también), por eso nunca hay un 100 %. La caché del proveedor compara el prefijo: el primer byte distinto invalida todo lo que viene detrás.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 3.8, 9.4], fov: 34 }} fit={1.08}>
        <PrefixBench change={change} />
      </Stage>
    </Figure>
  );
}
