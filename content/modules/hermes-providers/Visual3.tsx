"use client";

import { useReducer, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import type { Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, Flow, PointerTilt, ShadowBlob, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  Duct,
  GlassPanel,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
  Sheet,
} from "@/components/three/iso";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Credential pools versus fallback.
 *
 * Inner ring: several keys for the SAME provider. A 429 rotates to the
 * next healthy key. Outer ring: a different provider, only after the
 * pool is exhausted. Rotation resets the prompt cache.
 */

type Mode = "pool" | "fallback" | "cache";

const COPY = {
  en: {
    title: "same provider, next key",
    hint: "pool first · fallback later · rotation resets the cache",
    pool: "pool",
    fallback: "fallback",
    cache: "cache reset",
    legendKeys: "keys of one provider",
    legendNext: "next provider",
    legendCache: "prompt cache",
    provider: "provider",
    other: "fallback provider",
    cachePlate: "prompt cache",
    notes: {
      pool: "Several API keys or OAuth tokens for the same provider. On 429 Hermes retries once, then rotates. On 402 it rotates immediately. This is not fallback — the model host does not change.",
      fallback:
        "When every key in the pool is exhausted, then the fallback chain runs: a different provider-plus-model. Subagents inherit the live provider, not the leftover fallback list.",
      cache:
        "Key rotation resets the prompt cache. Provider-side caches are bound to the account that made the request. The next call rereads the whole history at undiscounted input price.",
    },
  },
  es: {
    title: "mismo proveedor, siguiente clave",
    hint: "pool primero · fallback después · la rotación resetea la caché",
    pool: "pool",
    fallback: "fallback",
    cache: "caché reset",
    legendKeys: "claves de un proveedor",
    legendNext: "otro proveedor",
    legendCache: "prompt caché",
    provider: "proveedor",
    other: "proveedor fallback",
    cachePlate: "prompt caché",
    notes: {
      pool: "Varias claves API o tokens OAuth para el mismo proveedor. Ante 429 Hermes reintenta una vez y luego rota. Ante 402 rota al momento. No es fallback: el host del modelo no cambia.",
      fallback:
        "Cuando se agotan todas las claves del pool, entonces corre la cadena de fallback: otro par proveedor-más-modelo. Los subagentes heredan el proveedor vivo, no la lista de fallback sobrante.",
      cache:
        "La rotación de clave resetea la prompt caché. Las cachés del lado del proveedor están acotadas a la cuenta que hizo la petición. La siguiente llamada relee el historial entero a precio de input sin descuento.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("pool");
  const poolOn = mode === "pool" || mode === "cache";
  const fallOn = mode === "fallback";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.amber, label: t.legendKeys },
        { color: P.violet, label: t.legendNext },
        { color: P.teal, label: t.legendCache },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "pool", label: t.pool, tone: P.amber },
            { value: "fallback", label: t.fallback, tone: P.violet },
            { value: "cache", label: t.cache, tone: P.teal },
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
        <IsoFrame width={13.2} depth={11.5} y={-0.04} />
        <PlanTrace
          points={[[-5.5, 3.3], [-1.8, 3.3], [-1.8, 0.3]]}
          y={-0.03}
          color={P.amber}
          opacity={poolOn ? 0.7 : 0.3}
        />
        <PlanTrace
          points={[[5.4, 3.4], [2.4, 3.4], [2.4, 0.8]]}
          y={-0.03}
          color={P.violet}
          opacity={fallOn ? 0.7 : 0.22}
        />
        <AxisLine from={[-4.6, 0, 2.2]} to={[4.7, 0, 2.2]} />
        <IsoDust count={44} center={[0, 0.55, 0]} spread={[5.0, 1.0, 3.5]} />

        <GlassPanel
          position={[-2.15, 1.4, 0.85]}
          rotation={ISO}
          size={[3.4, 2.3]}
          color={P.teal}
          opacity={0.18}
        />
        <Tag position={[-2.15, 2.8, 0.85]} tone="teal">
          {t.provider}
        </Tag>
        {[0, 1, 2].map((i) => {
          const active = mode === "pool" ? i === 1 : mode === "cache" ? i === 2 : i === 0;
          const dead = mode !== "pool" && i < 2;
          return (
            <Sheet
              key={i}
              position={[-3.15 + i * 1.05, 0.06, 0.95]}
              size={[0.85, 1.15]}
              color={dead ? P.roseWash : P.amberWash}
              fill={active ? 0.95 : dead ? 0.2 : 0.7}
              marks={dead ? 0 : 4}
              markColor={dead ? P.rose : P.amber}
            />
          );
        })}

        <GlassPanel
          position={[3.05, 1.3, -0.85]}
          rotation={ISO}
          size={[2.35, 2.1]}
          color={P.violet}
          opacity={fallOn ? 0.3 : 0.08}
        />
        <Tag position={[3.05, 2.6, -0.85]} tone="violet">
          {t.other}
        </Tag>
        <Sheet
          position={[3.15, 0.08, -0.75]}
          size={[1.35, 1.05]}
          color={P.violetWash}
          fill={fallOn ? 0.9 : 0.12}
          marks={fallOn ? 4 : 0}
          markColor={P.violet}
        />

        {mode === "cache" ? (
          <>
            <GlassPanel
              position={[2.85, 1.15, 1.65]}
              rotation={ISO}
              size={[2.15, 1.55]}
              color={P.teal}
              opacity={0.12}
            />
            <Tag position={[2.85, 2.15, 1.65]} tone="teal" size="xs">
              {t.cachePlate}
            </Tag>
            <Sheet
              position={[2.95, 0.08, 1.7]}
              size={[1.25, 0.9]}
              color={P.tealWash}
              fill={0.18}
              marks={0}
              markColor={P.teal}
            />
          </>
        ) : null}

        {fallOn ? (
          <>
            <Duct from={[-0.4, 0.25, 0.7]} to={[2.05, 0.4, -0.55]} color={P.violet} radius={0.1} bend={0.5} />
            <Flow
              points={[
                [-0.25, 0.28, 0.65],
                [1.9, 0.42, -0.5],
              ]}
              color={P.violet}
              count={3}
            />
          </>
        ) : (
          <Flow
            points={[
              [-3.1, 0.25, 0.95],
              [-1.05, 0.25, 0.95],
            ]}
            color={P.amber}
            count={3}
          />
        )}
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Pool de credenciales como máquina de estados. Tres claves del MISMO
 * proveedor en un carrusel; la activa mira al frente. Reglas de la tabla de
 * la lección: 429 reintenta una vez y el segundo 429 seguido rota (1 h);
 * 402 rota al momento (1 h); 401 refresca y solo rota si el refresh falla
 * (5 min). Sin claves sanas se activa el fallback (otro proveedor). Cada
 * rotación o fallback deja la caché de prompt fría: la siguiente petición
 * relee el historial entero. Estrategia fill_first (la de defecto).
 */

type KeyState = "sana" | "enfriando";
type PoolEvent = "200" | "429" | "402" | "401ok" | "401ko" | "reset";
type PoolState = {
  keys: { state: KeyState; cooldown: string; uses: number }[];
  active: number;
  pending429: boolean;
  fallback: boolean;
  cacheWarm: boolean;
  rereads: number;
  log: string[];
};

const HISTORY_TOKENS = 40_000; // didáctico
const KEY_NAMES = ["clave A", "clave B", "clave C"];
const fmt = (n: number) => new Intl.NumberFormat("es-ES").format(n);

function initialPool(): PoolState {
  return {
    keys: KEY_NAMES.map(() => ({ state: "sana" as KeyState, cooldown: "", uses: 0 })),
    active: 0,
    pending429: false,
    fallback: false,
    cacheWarm: true,
    rereads: 0,
    log: ["Sesión en curso con la clave A y la caché caliente."],
  };
}

function rotate(s: PoolState, cooldown: string, why: string): PoolState {
  const keys = s.keys.map((k, i) => (i === s.active ? { ...k, state: "enfriando" as KeyState, cooldown } : k));
  const next = keys.findIndex((k) => k.state === "sana");
  if (next < 0) {
    return { ...s, keys, pending429: false, fallback: true, cacheWarm: false, log: [...s.log, `${why}: no quedan claves sanas → fallback a otro proveedor.`] };
  }
  return { ...s, keys, active: next, pending429: false, cacheWarm: false, log: [...s.log, `${why}: ${KEY_NAMES[s.active]} enfría ${cooldown} → rota a ${KEY_NAMES[next]}.`] };
}

function poolReducer(s: PoolState, e: PoolEvent): PoolState {
  if (e === "reset") return initialPool();
  if (s.fallback) {
    if (e !== "200") return { ...s, log: [...s.log, "Ya en fallback: el pool de este proveedor está agotado."] };
  }
  switch (e) {
    case "200": {
      const cold = !s.cacheWarm;
      const keys = s.fallback ? s.keys : s.keys.map((k, i) => (i === s.active ? { ...k, uses: k.uses + 1 } : k));
      return {
        ...s,
        keys,
        pending429: false,
        cacheWarm: true,
        rereads: s.rereads + (cold ? HISTORY_TOKENS : 0),
        log: [...s.log, cold ? `200 OK con caché fría: se releen ${fmt(HISTORY_TOKENS)} tokens sin descuento.` : "200 OK: acierto de caché en el prefijo."],
      };
    }
    case "429":
      if (!s.pending429) return { ...s, pending429: true, log: [...s.log, `429 en ${KEY_NAMES[s.active]}: se reintenta la misma clave una vez.`] };
      return rotate(s, "1 h", "Segundo 429 seguido");
    case "402":
      return rotate(s, "1 h", "402 cuota");
    case "401ok":
      return { ...s, pending429: false, log: [...s.log, `401 en ${KEY_NAMES[s.active]}: el refresh OAuth funciona, no rota.`] };
    case "401ko":
      return rotate(s, "5 min", "401 y refresh fallido");
    default:
      return s;
  }
}

const CP = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };

function CMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

const RING_R = 1.25;
const angleOf = (i: number) => (i / 3) * Math.PI * 2;

/* Carrusel: gira para que la clave activa quede al frente (+z). */
function KeyCarousel({ pool }: { pool: PoolState }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const target = -angleOf(pool.active);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = still ? 1 : Math.min(1, dt * 3);
    g.rotation.y += (target - g.rotation.y) * k;
  });
  return (
    <group position={[-0.4, 0, 0]}>
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.85, 1.95, 0.16, 64]} />
        <CMat color={CP.ceramic} rough={0.55} clear={0.3} />
      </mesh>
      {/* indicador fijo al frente: la clave en uso */}
      <mesh position={[0, -0.38, 1.95]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.22, 3]} />
        <meshStandardMaterial color={pool.fallback ? CP.steel : P.amber} />
      </mesh>
      <group ref={ref}>
        <mesh position={[0, -0.05, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.62, 0.75, 40]} />
          <CMat color={pool.fallback ? "#8E8A82" : mixHex(P.paper, P.amber, 0.45)} clear={0.6} />
        </mesh>
        {pool.keys.map((k, i) => {
          const a = angleOf(i);
          const on = i === pool.active && !pool.fallback;
          const cool = k.state === "enfriando";
          const color = cool ? mixHex(P.paper, P.rose, 0.5) : on ? mixHex(P.paper, P.amber, 0.7) : mixHex(P.paper, P.amber, 0.25);
          return (
            <group key={i} position={[Math.sin(a) * RING_R, 0, Math.cos(a) * RING_R]} rotation={[0, a, 0]}>
              <RoundedBox position={[0, -0.05, 0]} args={[0.62, 0.72, 0.28]} radius={0.06} smoothness={3} castShadow receiveShadow>
                <CMat color={color} clear={0.55} />
              </RoundedBox>
              <mesh position={[0, 0.05, 0.16]}>
                <torusGeometry args={[0.14, 0.035, 10, 28]} />
                <meshStandardMaterial color={cool ? P.roseDeep : CP.brass} metalness={0.6} roughness={0.3} />
              </mesh>
              {cool ? (
                <mesh position={[0, -0.05, 0.2]}>
                  <torusGeometry args={[0.3, 0.025, 8, 40, Math.PI * (k.cooldown === "1 h" ? 1.7 : 0.4)]} />
                  <meshStandardMaterial color={P.rose} emissive={P.rose} emissiveIntensity={0.3} />
                </mesh>
              ) : null}
              <Tag position={[0, 0.48, 0]} tone={cool ? "rose" : "amber"} size="xs" center>{"ABC"[i]}</Tag>
              <mesh position={[0, -0.36, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
                <meshStandardMaterial color={CP.steel} metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          );
        })}
      </group>
      <Tag position={[0, 0.75, 0]} tone="amber" center>{pool.fallback ? "pool agotado" : "pool · un proveedor"}</Tag>
      <Tag position={[0, -0.25, 2.25]} tone={pool.fallback ? "muted" : "amber"} size="xs" center>{pool.fallback ? "sin clave activa" : KEY_NAMES[pool.active]}</Tag>
    </group>
  );
}

/* Anillo exterior: otro proveedor, solo cuando el pool se agota. */
function FallbackStation({ on }: { on: boolean }) {
  return (
    <group position={[3.3, 0, -0.9]}>
      <RoundedBox position={[0, -0.5, 0]} args={[1.5, 0.16, 1.3]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <CMat color={CP.ceramic} rough={0.55} clear={0.3} />
      </RoundedBox>
      <RoundedBox position={[0, 0.05, -0.2]} args={[1.15, 0.95, 0.7]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <CMat color={on ? mixHex(P.paper, P.violet, 0.55) : "#D5D1C8"} clear={on ? 0.6 : 0.15} />
      </RoundedBox>
      <Tag position={[0, 0.85, -0.2]} tone={on ? "violet" : "muted"} center>fallback</Tag>
    </group>
  );
}

/* Caché de prompt: pila de historial bajo vidrio; fría = hueca y ámbar. */
function CacheCase({ warm }: { warm: boolean }) {
  return (
    <group position={[-3.8, 0, 0.4]}>
      <RoundedBox position={[0, -0.5, 0]} args={[1.3, 0.16, 1.2]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <CMat color={CP.ceramic} rough={0.55} clear={0.3} />
      </RoundedBox>
      {Array.from({ length: 6 }, (_, i) => (
        <RoundedBox key={i} position={[0, -0.33 + i * 0.16, 0]} args={[0.85, 0.11, 0.7]} radius={0.03} smoothness={2} castShadow>
          <meshPhysicalMaterial color={warm ? mixHex(P.paper, P.teal, 0.3 + i * 0.07) : mixHex(P.paper, P.amber, 0.25)} roughness={0.4} clearcoat={0.4} transparent={!warm} opacity={warm ? 1 : 0.55} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.05, 1.25, 0.9]} />
        <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.14} roughness={0.05} depthWrite={false} />
      </mesh>
      <Tag position={[0, 1.05, 0]} tone={warm ? "teal" : "amber"} center>{warm ? "caché caliente" : "caché fría"}</Tag>
    </group>
  );
}
const EVENTS: { id: Exclude<PoolEvent, "reset">; label: string; tone: string }[] = [
  { id: "200", label: "200 OK", tone: "var(--teal)" },
  { id: "429", label: "429", tone: "var(--rose)" },
  { id: "402", label: "402", tone: "var(--rose)" },
  { id: "401ok", label: "401 · refresh ok", tone: "var(--amber)" },
  { id: "401ko", label: "401 · refresh falla", tone: "var(--rose)" },
];

function PoolBench({ pool }: { pool: PoolState }) {
  const front: V3 = pool.fallback ? [3.3, 0.1, 0.2] : [-0.4, 0.05, RING_R + 0.2];
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0.25, 0]}>
        <ShadowBlob position={[0, -0.95, 0.2]} scale={10} opacity={0.12} />
        <RoundedBox position={[0, -0.8, 0]} args={[9.6, 0.36, 4.3]} radius={0.17} smoothness={4} castShadow receiveShadow>
          <CMat color={CP.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.6, 0]} args={[9.25, 0.08, 4.0]} radius={0.04} smoothness={3} receiveShadow>
          <CMat color={CP.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        <CacheCase warm={pool.cacheWarm} />
        <KeyCarousel pool={pool} />
        <FallbackStation on={pool.fallback} />
        {/* la petición entra por delante hacia la clave activa o el fallback */}
        <Flow points={[[1.6, 0.05, 2.0], [0.6, 0.05, 1.9], front]} color={pool.fallback ? P.violet : P.amber} count={3} size={0.04} speed={0.3} lineOpacity={0.35} />
        <Arrow from={[1.35, -0.1, -0.6]} to={[2.45, -0.1, -0.85]} color={P.violet} width={pool.fallback ? 2 : 1} opacity={pool.fallback ? 0.9 : 0.3} dashed={!pool.fallback} head={0.1} />
        <Arrow from={[-1.9, 0.1, 0.4]} to={[-3.0, 0.1, 0.4]} color={pool.cacheWarm ? P.teal : P.amber} width={1.3} head={0.08} bow={0.2} opacity={0.7} dashed={!pool.cacheWarm} />
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [pool, send] = useReducer(poolReducer, undefined, initialPool);
  const last = pool.log[pool.log.length - 1];
  const cooling = pool.keys.filter((k) => k.state === "enfriando").length;
  return (
    <Figure
      label="Pool de credenciales · mismo proveedor, siguiente clave"
      hint="envía respuestas del proveedor y mira qué rota"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.amber, label: "claves del pool" },
        { color: P.rose, label: "enfriando" },
        { color: P.violet, label: "fallback: otro proveedor" },
        { color: P.teal, label: "caché de prompt" },
      ]}
      controls={
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Respuesta del proveedor a la siguiente petición">
          {EVENTS.map((e) => (
            <button key={e.id} type="button" className="chip" style={{ color: e.tone }} onClick={() => send(e.id)}>{e.label}</button>
          ))}
          <button type="button" className="chip" onClick={() => send("reset")}>Reiniciar</button>
        </div>
      }
      note={
        <div className="space-y-3">
          <p><strong>{last}</strong></p>
          <Readout
            items={[
              { label: "en uso", value: pool.fallback ? "proveedor fallback" : KEY_NAMES[pool.active], tone: pool.fallback ? "var(--violet)" : "var(--amber)" },
              { label: "enfriando", value: cooling + " / 3", tone: "var(--rose)" },
              { label: "429 pendiente", value: pool.pending429 ? "sí" : "no", tone: "var(--rose)" },
              { label: "releído sin descuento", value: fmt(pool.rereads) + " tokens", tone: "var(--amber)" },
            ]}
          />
          <ol className="max-h-28 list-decimal overflow-y-auto pl-5 font-mono text-xs text-muted">
            {pool.log.map((line, i) => <li key={i}>{line}</li>)}
          </ol>
          <p className="text-xs text-muted">Cada rotación mantiene viva la sesión, pero la caché del proveedor está acotada a la cuenta que hizo la petición: la siguiente llamada relee el historial ({fmt(HISTORY_TOKENS)} tokens en esta maqueta) a precio de input. Enfriamientos por defecto de la lección (1 h, 5 min); un reset_at del proveedor los pisa. Estrategia fill_first.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.8, 5.2, 9.6], fov: 34 }} fit={1.08}>
        <PoolBench pool={pool} />
      </Stage>
    </Figure>
  );
}
