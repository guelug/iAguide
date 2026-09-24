"use client";

import { useState, useRef } from "react";
import { Figure, Switcher, Knob, Readout } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, ShadowBlob, Arrow } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type Group } from "three";
import { useLocale } from "next-intl";

type Mode="tiers"|"meter"|"cache";
const COPY={en:{label:"quotas make economics visible",hint:"tiers · token meter · cache discount",tiers:"tiers",meter:"token meter",cache:"cache discount",free:"free",pro:"pro",credits:"credits",tokens:"tokens/min",full:"full price",cached:"cached prefix"},es:{label:"las cuotas hacen visible la economía",hint:"niveles · medidor · descuento caché",tiers:"niveles",meter:"medidor",cache:"descuento caché",free:"free",pro:"pro",credits:"créditos",tokens:"tokens/min",full:"precio completo",cached:"prefijo en caché"}};
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("tiers");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.free},{color:P.violet,label:t.pro},{color:P.amber,label:t.credits}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"tiers",label:t.tiers,tone:P.teal},{value:"meter",label:t.meter,tone:P.amber},{value:"cache",label:t.cache,tone:P.violet}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="tiers"&&<>{[[t.free,P.teal,.8],[t.pro,P.violet,1.4],[t.credits,P.amber,2.2]].map(([lab,col,h],i)=><group key={lab as string}><Slab position={[-2+i*2,-.7+(h as number)/2,0]} size={[1.4,h as number,.14]} color={col as string} fill={.25}/><Tag position={[-2+i*2,1.55,.15]} tone={(["teal","violet","amber"] as const)[i]} size="xs">{lab as string}</Tag></group>)}</>}
{mode==="meter"&&<><Slab position={[0,.5,0]} size={[4,.65,.14]} color={P.muted} fill={.12}/><Slab position={[-.7,.5,.1]} size={[2.4,.65,.06]} color={P.amber} fill={.45}/><Tag position={[0,1.15,.15]} tone="amber">{t.tokens}</Tag><Node3D position={[1.25,.5,.2]} color={P.rose} radius={.12} pulse={.5}/><Tag position={[1.2,-.15,.15]} tone="rose" size="xs">limit</Tag></>}
{mode==="cache"&&<><Slab position={[-1.6,.5,0]} size={[2.1,.8,.14]} color={P.rose} fill={.25}/><Tag position={[-1.6,1.05,.15]} tone="rose">{t.full}</Tag><Ribbon points={[[-.4,.5,0],[.4,.5,0]]} color={P.teal} radius={.05} opacity={.85}/><Slab position={[1.6,.5,0]} size={[2.1,.8,.14]} color={P.teal} fill={.3}/><Halo position={[1.6,.5,0]} radius={.8} color={P.teal} opacity={.35} spin={.15}/><Tag position={[1.6,1.05,.15]} tone="teal">{t.cached}</Tag><Tag position={[0,-.5,.15]} tone="muted" size="xs">reuse prefix → menor coste</Tag></>}
</PointerTilt></Stage></Figure>}

/* ------------------------------------------------------------------ ES */

/*
 * Rotación y fallback, con las reglas publicadas que cita la lección.
 *  - Pool de credenciales de Hermes: 429 transitorio reintenta la misma
 *    clave una vez y rota al segundo consecutivo (enfriamiento 1 h); 429
 *    «usage limit reached» y 402 rotan al momento (1 h); 401 intenta
 *    refresh OAuth y sólo rota si falla (5 min). La caché de prompt es por
 *    clave: rotar significa pagar el prefijo a precio completo.
 *  - OpenClaw: enfriamientos de fallos regulares 30 s, 1 min y tope 5 min;
 *    primero rota perfiles del mismo proveedor y luego cae al fallback de
 *    modelo, salvo que el usuario eligiera /model: entonces es estricto y
 *    reporta el fallo.
 */

type Q2Mode = "pool" | "openclaw";
type Err = "429" | "429x2" | "limit" | "402" | "401ok" | "401bad";

const ERR_LABEL: Record<Err, string> = {
  "429": "429",
  "429x2": "429 ×2",
  limit: "usage limit",
  "402": "402",
  "401ok": "401 + refresh",
  "401bad": "401 sin refresh",
};

function poolRule(e: Err) {
  switch (e) {
    case "429": return { rotates: false, cooldown: "—", action: "reintenta la misma clave una vez" };
    case "429x2": return { rotates: true, cooldown: "1 h", action: "segundo 429 seguido: rota" };
    case "limit": return { rotates: true, cooldown: "1 h", action: "«usage limit reached»: rota al momento" };
    case "402": return { rotates: true, cooldown: "1 h", action: "billing: rota al momento" };
    case "401ok": return { rotates: false, cooldown: "—", action: "refresh OAuth correcto: sigue la misma clave" };
    case "401bad": return { rotates: true, cooldown: "5 min", action: "refresh falla: rota" };
  }
}

/** OpenClaw cooldown for the n-th consecutive regular failure, in seconds. */
function openclawCooldown(n: number) {
  return n <= 1 ? 30 : n === 2 ? 60 : 300;
}

const Q2 = { base: "#2d3336", baseTop: "#42494d", brass: "#b68442", steel: "#a3aaad", ceramic: "#efebe2" };
const KEYS = ["clave A", "clave B", "clave C"];

function KeyCarousel({ rotated, cooldown }: { rotated: boolean; cooldown: string }) {
  const table = useRef<Group>(null);
  const { still } = useStage();
  const goal = rotated ? -(Math.PI * 2) / 3 : 0;
  useFrame((_, dt) => {
    if (!table.current) return;
    table.current.rotation.y += (goal - table.current.rotation.y) * (still ? 1 : Math.min(1, dt * 2.5));
  });
  return (
    <group position={[-1.6, 0, 0]}>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.9, 2.0, 0.16, 64]} />
        <meshStandardMaterial color={Q2.ceramic} roughness={0.55} />
      </mesh>
      <group ref={table} rotation={[0, goal, 0]}>
        {KEYS.map((k, i) => {
          const a = (i / 3) * Math.PI * 2;
          const active = rotated ? i === 1 : i === 0;
          const cooling = rotated && i === 0;
          const x = Math.sin(a) * 1.25;
          const z = Math.cos(a) * 1.25;
          return (
            <group key={k} position={[x, 0.16, z]} rotation={[0, a, 0]}>
              <RoundedBox args={[0.9, 0.36, 0.55]} position={[0, 0.18, 0]} radius={0.07} smoothness={3} castShadow>
                <meshPhysicalMaterial color={active ? mixHex(P.paper, P.amber, 0.5) : cooling ? mixHex(P.paper, P.rose, 0.35) : "#d8d4ca"} roughness={0.4} clearcoat={0.5} />
              </RoundedBox>
              {/* Per-key prompt cache: warm only on the key that has been serving. */}
              <RoundedBox args={[0.7, 0.18, 0.4]} position={[0, 0.46, 0]} radius={0.05} smoothness={2} castShadow>
                <meshPhysicalMaterial color={i === 0 ? mixHex(P.paper, P.violet, 0.55) : "#c9c5bb"} roughness={0.4} clearcoat={0.4} />
              </RoundedBox>
              <Tag position={[0, 0.85, 0]} tone={active ? "amber" : cooling ? "rose" : "muted"} size="xs" center>{cooling ? k + " · " + cooldown : k}</Tag>
            </group>
          );
        })}
      </group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.8, 16]} />
        <meshStandardMaterial color={Q2.brass} metalness={0.8} roughness={0.25} />
      </mesh>
      <Tag position={[0, -0.05, 2.25]} tone="amber" size="xs" center>pool · mismo proveedor</Tag>
    </group>
  );
}

function ProviderBlock({ position, label, lit, tone, w = 1.5 }: { position: [number, number, number]; label: string; lit: boolean; tone: string; w?: number }) {
  return (
    <group position={position}>
      <RoundedBox args={[w, 0.6, 1.0]} position={[0, 0.3, 0]} radius={0.1} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={lit ? mixHex(P.paper, tone, 0.45) : "#d8d4ca"} roughness={0.4} clearcoat={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[w - 0.3, 0.02, 0.7]} />
        <meshStandardMaterial color={lit ? tone : Q2.steel} />
      </mesh>
      <Tag position={[0, 0.95, 0]} tone={lit ? "ink" : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

function PoolScene({ err }: { err: Err }) {
  const rule = poolRule(err);
  return (
    <group>
      <KeyCarousel rotated={rule.rotates} cooldown={rule.cooldown} />
      <ProviderBlock position={[2.6, 0, -0.6]} label="fallback: otro proveedor" lit={false} tone={P.teal} />
      <Arrow from={[0.5, 0.5, -0.6]} to={[1.75, 0.5, -0.6]} color={P.lineStrong} width={1.4} head={0.09} dashed />
      <group position={[2.6, 0, 1.2]}>
        <RoundedBox args={[1.9, 0.3, 0.9]} position={[0, 0.15, 0]} radius={0.06} smoothness={3} castShadow>
          <meshPhysicalMaterial color={rule.rotates ? mixHex(P.paper, P.rose, 0.4) : mixHex(P.paper, P.violet, 0.4)} roughness={0.4} clearcoat={0.45} />
        </RoundedBox>
        <Tag position={[0, 0.55, 0]} tone={rule.rotates ? "rose" : "violet"} size="xs" center>{rule.rotates ? "caché fría: prefijo completo" : "caché caliente"}</Tag>
      </group>
    </group>
  );
}

function CooldownDial({ seconds, position }: { seconds: number; position: [number, number, number] }) {
  const frac = seconds / 300;
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.8, 0.12, 48]} />
        <meshStandardMaterial color={Q2.ceramic} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <ringGeometry args={[0.4, 0.65, 48, 1, 0, Math.PI * 2 * frac]} />
        <meshStandardMaterial color={P.rose} side={2} />
      </mesh>
      {[0, 0.1, 0.2, 1].map((f) => (
        <mesh key={f} position={[Math.sin(f * Math.PI * 2) * 0.7, 0.14, -Math.cos(f * Math.PI * 2) * 0.7]}>
          <boxGeometry args={[0.04, 0.03, 0.04]} />
          <meshStandardMaterial color={P.inkSoft} />
        </mesh>
      ))}
      <Tag position={[0, 0.5, 0]} tone="rose" size="xs" center>{seconds < 60 ? seconds + " s" : seconds / 60 + " min"}</Tag>
    </group>
  );
}

function OpenclawScene({ failures, strict }: { failures: number; strict: boolean }) {
  const cd = openclawCooldown(failures);
  return (
    <group>
      {/* Stage 1: auth profiles inside the current provider. */}
      <RoundedBox args={[3.6, 0.12, 2.0]} position={[-2.2, 0.06, -0.4]} radius={0.05} smoothness={2} receiveShadow>
        <meshStandardMaterial color={mixHex(P.paper, P.amber, 0.18)} roughness={0.55} />
      </RoundedBox>
      <Tag position={[-3.9, 0.25, 0.5]} tone="amber" size="xs">1 · perfiles del proveedor</Tag>
      {[0, 1, 2].map((i) => (
        <ProviderBlock key={i} position={[-3.3 + i * 1.1, 0.12, -0.5]} label={"perfil " + (i + 1)} lit={i === Math.min(2, failures - 1)} tone={P.amber} w={0.85} />
      ))}
      <CooldownDial seconds={cd} position={[-2.2, 0, 1.55]} />
      {/* Stage 2: model fallback, unless the user picked /model. */}
      <ProviderBlock position={[2.4, 0, -0.5]} label={strict ? "fallback bloqueado" : "fallback de modelo"} lit={!strict && failures >= 3} tone={P.teal} />
      <Arrow from={[-0.3, 0.55, -0.5]} to={[1.55, 0.55, -0.5]} color={strict ? P.rose : failures >= 3 ? P.teal : P.lineStrong} width={2} head={0.12} dashed={strict} />
      <Tag position={[0.6, 0.85, -0.5]} tone={strict ? "rose" : "teal"} size="xs" center>{strict ? "/model: estricto" : "2 · fallback"}</Tag>
      {strict ? <Tag position={[2.4, 0.2, 0.55]} tone="rose" size="xs" center>reporta el fallo</Tag> : null}
    </group>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<Q2Mode>("pool");
  const [err, setErr] = useState<Err>("429x2");
  const [failures, setFailures] = useState(1);
  const [strict, setStrict] = useState(false);
  const rule = poolRule(err);
  const cd = openclawCooldown(failures);
  return (
    <Figure
      label="Rotar no es gratis y un pool no es un fallback"
      hint="429 · 402 · 401 · enfriamientos · /model estricto"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.amber, label: "claves / perfiles" },
        { color: P.violet, label: "caché de prompt" },
        { color: P.teal, label: "fallback de modelo" },
        { color: P.rose, label: "enfriamiento / fallo" },
      ]}
      note={
        mode === "pool" ? (
          <div className="space-y-3">
            <p><strong>{ERR_LABEL[err]}: {rule.action}.</strong> {rule.rotates ? "La clave nueva no tiene la caché de prompt de la anterior (la caché es por clave), así que el primer turno tras rotar paga el prefijo completo. Los pools son disponibilidad, no un descuento." : "Sin rotación, la caché de prompt de la clave sigue caliente."} Un fallback es otra cosa: saltar a otro proveedor.</p>
            <Readout items={[
              { label: "rota", value: rule.rotates ? "sí" : "no", tone: rule.rotates ? "var(--rose)" : "var(--teal)" },
              { label: "enfriamiento", value: rule.cooldown, tone: "var(--rose)" },
              { label: "caché", value: rule.rotates ? "fría" : "caliente", tone: "var(--violet)" },
            ]} />
            <p className="text-xs text-muted">Reglas de Hermes, «Credential Pools». Los subagentes heredan el pool del padre.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p><strong>Fallo regular n.º {failures}: enfriamiento de {cd < 60 ? cd + " s" : cd / 60 + " min"}.</strong> OpenClaw primero rota perfiles de auth del mismo proveedor y después cae al siguiente modelo de fallback. {strict ? "Con una selección explícita /model es estricto: reporta el fallo en lugar de responder en silencio desde otro modelo." : "Cron y defaults configurados sí pueden usar fallbacks."}</p>
            <Readout items={[
              { label: "enfriamiento", value: cd < 60 ? cd + " s" : cd / 60 + " min", tone: "var(--rose)" },
              { label: "tope", value: "5 min", tone: "var(--rose)" },
              { label: "fallback", value: strict ? "bloqueado" : "permitido", tone: strict ? "var(--rose)" : "var(--teal)" },
            ]} />
            <p className="text-xs text-muted">Números de OpenClaw, «Model failover»: 30 s, 1 min, 5 min tope para fallos que no son de billing. Los disable de billing usan un backoff más largo que no se dibuja aquí. En la lámina el fallback se enciende a partir del tercer fallo para visualizar la segunda etapa.</p>
          </div>
        )
      }
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Vista" options={[{ value: "pool", label: "Pool Hermes", tone: P.amber }, { value: "openclaw", label: "Failover OpenClaw", tone: P.teal }]} />
          {mode === "pool" ? (
            <Switcher value={err} onChange={setErr} ariaLabel="Error recibido" options={(Object.keys(ERR_LABEL) as Err[]).map((k) => ({ value: k, label: ERR_LABEL[k], tone: k === "402" ? P.violet : P.rose }))} />
          ) : (
            <>
              <Knob label="fallos seguidos" value={failures} min={1} max={5} onChange={setFailures} tone="var(--rose)" />
              <Switcher value={strict ? "strict" : "default"} onChange={(v) => setStrict(v === "strict")} ariaLabel="Selección de modelo" options={[{ value: "default", label: "Default", tone: P.teal }, { value: "strict", label: "/model", tone: P.rose }]} />
            </>
          )}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.6, 5.8, 8.8], fov: 32 }} fit={1.04}>
        <ShadowBlob position={[0, -0.38, 0.2]} scale={10} opacity={0.12} />
        <RoundedBox args={[9.2, 0.3, 5.4]} position={[0, -0.2, 0.2]} radius={0.15} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={Q2.base} roughness={0.55} metalness={0.15} />
        </RoundedBox>
        {mode === "pool" ? <PoolScene err={err} /> : <OpenclawScene failures={failures} strict={strict} />}
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}
