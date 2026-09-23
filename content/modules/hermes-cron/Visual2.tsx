"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useLayoutEffect, useRef } from "react";
import { Color, InstancedMesh, Object3D } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { Arrow, Flow, ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "tick" | "guard" | "fallback";
const COPY = {
  en: { title: "cron schedules an agent, not shell", hint: "tick · recursion guard · provider fallback", tick: "tick", guard: "recursion guard", fallback: "fallback", jobs: "jobs.json", lock: "lock", agent: "fresh AIAgent", deliver: "deliver", cronTool: "cronjob tool", disabled: "disabled", chronos: "Chronos", builtin: "built-in" },
  es: { title: "cron programa un agente, no shell", hint: "tick · guardia de recursión · fallback", tick: "tick", guard: "guardia recursión", fallback: "fallback", jobs: "jobs.json", lock: "lock", agent: "AIAgent fresco", deliver: "entrega", cronTool: "tool cronjob", disabled: "desactivado", chronos: "Chronos", builtin: "in-process" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("tick");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.jobs }, { color: P.violet, label: t.agent }, { color: P.amber, label: t.deliver }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "tick", label: t.tick, tone: P.teal }, { value: "guard", label: t.guard, tone: P.rose }, { value: "fallback", label: t.fallback, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "tick" && <>{[[t.jobs, P.teal, -2], [t.lock, P.violet, -0.7], [t.agent, P.amber, 0.7], [t.deliver, P.rose, 2]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.25, 0.75, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.7, 0.15]} tone={(["teal", "violet", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag>{i < 3 && <Ribbon points={[[x as number + 0.65, 0.2, 0], [x as number + 0.75, 0.2, 0]]} color={P.lineStrong} radius={0.035} opacity={0.7} />}</group>)}</>}
        {mode === "guard" && <><Halo position={[0, 0.15, 0]} radius={1.35} color={P.rose} opacity={0.4} spin={0.12} /><Node3D position={[0, 0.15, 0]} color={P.rose} radius={0.22} pulse={0.45} /><Tag position={[0, 0.75, 0.15]} tone="rose">{t.cronTool}</Tag><Ribbon points={[[-2, 0.15, 0], [-0.45, 0.15, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">job</Tag><Ribbon points={[[0.45, 0.15, 0], [2, 0.15, 0]]} color={P.rose} radius={0.06} opacity={0.95} /><Tag position={[2, 0.65, 0.15]} tone="rose" size="xs">{t.disabled}</Tag><Tag position={[0, -0.8, 0.15]} tone="muted" size="xs">una corrida no puede crear otra</Tag></>}
        {mode === "fallback" && <><Slab position={[-1.7, 0.2, 0]} size={[1.7, 0.9, 0.12]} color={P.amber} fill={0.24} /><Tag position={[-1.7, 0.75, 0.15]} tone="amber">{t.chronos}</Tag><Ribbon points={[[-0.7, 0.2, 0], [0.7, 0.2, 0]]} color={P.lineStrong} radius={0.05} opacity={0.8} /><Slab position={[1.7, 0.2, 0]} size={[1.7, 0.9, 0.12]} color={P.teal} fill={0.24} /><Tag position={[1.7, 0.75, 0.15]} tone="teal">{t.builtin}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">proveedor roto → ticker seguro</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Dos mecanismos que protegen el cron de Hermes. (1) Guardia de recursión:
   el toolset cronjob está desactivado dentro de las corridas, así que un job
   no puede crear más jobs. Sin ella, si cada corrida crea k jobs, la
   generación n tiene (1 + k)^n jobs. (2) Resolución del disparador:
   resolve_cron_scheduler() usa el proveedor nombrado si está disponible y,
   si no, cae al InProcessCronScheduler built-in con un warning. */

type View = "guard" | "trigger";
type Provider = "empty" | "chronos" | "broken";
const TOKENS_PER_RUN = 20000; // didáctico
const MAX_DRAW = 1400;

function growth(children: number, generations: number, guard: boolean) {
  const gens = Array.from({ length: generations + 1 }, (_, n) => (guard ? 1 : Math.pow(1 + children, n)));
  const runs = gens.reduce((s, g) => s + g, 0);
  return { gens, runs, tokens: runs * TOKENS_PER_RUN, last: gens[gens.length - 1] };
}

function resolveTrigger(provider: Provider) {
  if (provider === "chronos") return { active: "chronos" as const, warning: false, text: "cron.provider: chronos está disponible: Nous arma un one-shot por job en next_run_at y llama POST /api/cron/fire con un JWT acotado. Entre fuegos el gateway puede estar parado (scale-to-zero)." };
  if (provider === "broken") return { active: "builtin" as const, warning: true, text: "Chronos mal configurado (falta, falla al cargar o is_available() == False): el resolver cae al ticker built-in con un warning. El cron nunca se queda sin disparador." };
  return { active: "builtin" as const, warning: false, text: "cron.provider vacío: InProcessCronScheduler, el loop de 60 segundos del núcleo. No vive en plugins/, así que no se puede borrar por accidente." };
}

const R = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
};
const fmtInt = (n: number) => n.toLocaleString("es-ES");

function Plinth({ w, d, x = 0 }: { w: number; d: number; x?: number }) {
  return (
    <group>
      <ShadowBlob position={[x, -0.28, 0]} scale={w + 1} opacity={0.12} />
      <RoundedBox args={[w, 0.3, d]} position={[x, -0.13, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={R.base} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[w - 0.35, 0.06, d - 0.35]} position={[x, 0.05, 0]} radius={0.03} smoothness={3} receiveShadow>
        <meshStandardMaterial color={R.baseTop} roughness={0.45} metalness={0.22} />
      </RoundedBox>
    </group>
  );
}

const TILE = 0.13;
function layoutGenerations(gens: number[]) {
  const pallets: { x: number; side: number; w: number; count: number }[] = [];
  let cursor = 0;
  for (const count of gens) {
    const side = Math.ceil(Math.sqrt(count));
    const w = Math.max(0.55, side * TILE + 0.24);
    pallets.push({ x: cursor + w / 2, side, w, count });
    cursor += w + 0.45;
  }
  const total = cursor - 0.45;
  return { pallets: pallets.map((p) => ({ ...p, x: p.x - total / 2 })), total };
}

function JobTiles({ pallets, guard }: { pallets: ReturnType<typeof layoutGenerations>["pallets"]; guard: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const total = Math.min(MAX_DRAW, pallets.reduce((s, p) => s + p.count, 0));
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new Object3D();
    const c = new Color();
    let i = 0;
    pallets.forEach((p, g) => {
      for (let k = 0; k < p.count && i < MAX_DRAW; k++, i++) {
        const col = k % p.side;
        const row = Math.floor(k / p.side);
        o.position.set(p.x + (col - (p.side - 1) / 2) * TILE, 0.3, (row - (p.side - 1) / 2) * TILE);
        o.scale.set(TILE * 0.8, 0.1, TILE * 0.8);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        c.set(guard ? P.teal : g === 0 ? P.teal : mixHex(P.amber, P.rose, Math.min(1, g / 5)));
        m.setColorAt(i, c);
      }
    });
    m.count = i;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [pallets, guard]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, Math.max(1, total)]} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial roughness={0.4} metalness={0.15} />
    </instancedMesh>
  );
}

function GuardScene({ spawn, generations, guard }: { spawn: number; generations: number; guard: boolean }) {
  const g = growth(spawn, generations, guard);
  const { pallets, total } = layoutGenerations(g.gens);
  const depth = Math.max(2.6, pallets[pallets.length - 1].w + 1.2);
  return (
    <group>
      <Plinth w={total + 1.6} d={depth} />
      {pallets.map((p, i) => (
        <group key={i}>
          <RoundedBox args={[p.w, 0.12, p.w]} position={[p.x, 0.16, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
            <meshPhysicalMaterial color={R.charcoal} roughness={0.4} metalness={0.3} clearcoat={0.3} />
          </RoundedBox>
          <Tag position={[p.x, 0.25, p.w / 2 + 0.3]} tone={guard || i === 0 ? "teal" : "rose"} size="xs" center>{fmtInt(p.count)}</Tag>
          {i > 0 ? <Arrow from={[pallets[i - 1].x + pallets[i - 1].w / 2 + 0.05, 0.3, 0]} to={[p.x - p.w / 2 - 0.05, 0.3, 0]} color={guard ? P.teal : P.rose} head={0.07} /> : null}
          {guard && i < pallets.length - 1 ? (
            <group position={[p.x + p.w / 2 + 0.22, 0.55, -0.35]} rotation={[0.3, 0, 0.4]}>
              <RoundedBox args={[0.22, 0.22, 0.18]} radius={0.03} smoothness={2} castShadow>
                <meshPhysicalMaterial color={P.roseWash} roughness={0.45} clearcoat={0.4} />
              </RoundedBox>
            </group>
          ) : null}
        </group>
      ))}
      <JobTiles pallets={pallets} guard={guard} />
      <Tag position={[pallets[0].x, 0.9, 0]} tone="teal" size="xs" center>job original</Tag>
      {guard ? <Tag position={[0, 1.1, -0.6]} tone="rose" size="xs" center>cronjob desactivado</Tag> : <Tag position={[pallets[pallets.length - 1].x, 0.95, 0]} tone="rose" size="xs" center>{`generación ${generations}`}</Tag>}
    </group>
  );
}

function Block({ position, size, color, clear = 0.4 }: { position: V3; size: V3; color: string; clear?: number }) {
  return (
    <RoundedBox args={size} position={position} radius={Math.min(0.08, size[1] / 3)} smoothness={3} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.4} clearcoat={clear} />
    </RoundedBox>
  );
}

function TriggerScene({ provider }: { provider: Provider }) {
  const r = resolveTrigger(provider);
  const chronosOn = r.active === "chronos";
  const pointer = chronosOn ? -0.9 : 0.9;
  return (
    <group>
      <Plinth w={10} d={4.6} />
      {/* config.yaml */}
      <group position={[-3.9, 0.08, 0]}>
        <Block position={[0, 0.1, 0]} size={[1.5, 0.12, 1.9]} color={R.deck} />
        {[0, 1, 2, 3, 4].map((l) => (
          <mesh key={l} position={[-0.1, 0.18, -0.7 + l * 0.35]}>
            <boxGeometry args={[l === 2 ? 1.1 : 0.8 - (l % 2) * 0.2, 0.012, 0.09]} />
            <meshStandardMaterial color={l === 2 ? (provider === "empty" ? R.steel : provider === "broken" ? P.rose : P.violet) : R.steel} />
          </mesh>
        ))}
        <Tag position={[0, 0.55, -1.2]} tone="muted" size="xs" center>config.yaml</Tag>
        <Tag position={[0, 0.5, 1.25]} tone={provider === "broken" ? "rose" : provider === "chronos" ? "violet" : "muted"} size="xs" center>{provider === "empty" ? "cron.provider: —" : "cron.provider: chronos"}</Tag>
      </group>
      {/* resolver: selector giratorio */}
      <group position={[-1.5, 0.08, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 0.8, 0.3, 48]} />
          <meshPhysicalMaterial color={R.charcoal} roughness={0.35} metalness={0.3} clearcoat={0.5} />
        </mesh>
        <group rotation={[0, Math.atan2(-pointer, 1.6), 0]}>
          <mesh position={[0.45, 0.4, 0]} castShadow>
            <boxGeometry args={[0.9, 0.08, 0.14]} />
            <meshStandardMaterial color={R.brass} metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.1, 20]} />
          <meshStandardMaterial color={R.brass} metalness={0.8} roughness={0.3} />
        </mesh>
        {r.warning ? (
          <mesh position={[0.5, 0.45, 0.6]}>
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshStandardMaterial color={P.amber} emissive={P.amber} emissiveIntensity={0.7} />
          </mesh>
        ) : null}
        <Tag position={[0, 0.95, 0]} tone="ink" size="xs" center>resolver</Tag>
        {r.warning ? <Tag position={[0.5, 0.85, 0.95]} tone="amber" size="xs" center>warning</Tag> : null}
      </group>
      {/* plugins/cron_providers: Chronos */}
      <group position={[0.8, 0.08, -0.9]}>
        <Block position={[0, 0.08, 0]} size={[1.6, 0.14, 1.1]} color={R.charcoal} />
        <group position={[0, 0.45, 0]} rotation={provider === "broken" ? [0.3, 0.2, 0.25] : [0, 0, 0]}>
          <Block position={[0, 0, 0]} size={[0.9, 0.6, 0.6]} color={provider === "broken" ? P.roseWash : chronosOn ? P.violetWash : R.deck} />
        </group>
        <Tag position={[0, 1.05, 0]} tone={provider === "broken" ? "rose" : "violet"} size="xs" center>Chronos</Tag>
      </group>
      {/* núcleo: InProcessCronScheduler, atornillado */}
      <group position={[0.8, 0.08, 0.9]}>
        <Block position={[0, 0.08, 0]} size={[1.6, 0.14, 1.1]} color={R.charcoal} />
        <Block position={[0, 0.42, 0]} size={[1.0, 0.55, 0.7]} color={!chronosOn ? P.tealWash : R.deck} />
        {[-0.62, 0.62].flatMap((x) => [-0.42, 0.42].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 0.17, z]}>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
            <meshStandardMaterial color={R.brass} metalness={0.8} roughness={0.3} />
          </mesh>
        )))}
        <Tag position={[0, 1.0, 0.1]} tone="teal" size="xs" center>built-in 60 s</Tag>
      </group>
      {/* ejecución y entrega: igual con cualquier disparador */}
      <group position={[3.6, 0.08, 0]}>
        <Block position={[0, 0.08, 0]} size={[1.9, 0.14, 1.9]} color={R.deck} />
        <Block position={[0, 0.55, 0]} size={[1.2, 0.8, 1.0]} color={R.charcoal} clear={0.6} />
        <Tag position={[0, 1.25, 0]} tone="ink" size="xs" center>run_job + entrega</Tag>
      </group>
      <Flow points={chronosOn ? [[1.3, 0.6, -0.9], [2.2, 0.8, -0.5], [3.0, 0.6, -0.1]] : [[1.3, 0.55, 0.9], [2.2, 0.75, 0.5], [3.0, 0.6, 0.1]]} color={chronosOn ? P.violet : P.teal} count={3} speed={0.4} />
      {chronosOn ? (
        <group position={[0.8, 1.9, -1.5]}>
          <Block position={[0, 0, 0]} size={[1.3, 0.35, 0.6]} color={P.violetWash} />
          <Tag position={[0, 0.45, 0]} tone="violet" size="xs" center>Nous · one-shot</Tag>
          <Flow points={[[0.6, -0.1, 0.2], [2.2, -0.6, 1.0], [2.8, -1.1, 1.5]]} color={P.violet} count={2} speed={0.3} />
        </group>
      ) : null}
    </group>
  );
}

function GuardNote({ spawn, generations, guard }: { spawn: number; generations: number; guard: boolean }) {
  const on = growth(spawn, generations, true);
  const off = growth(spawn, generations, false);
  const g = guard ? on : off;
  return (
    <div className="space-y-3">
      <p>
        <strong>{guard ? "Con la guardia de recursión." : "Sin guardia (hipotético)."}</strong>{" "}
        {guard
          ? `Dentro de una sesión cron el toolset cronjob no existe: el job pide crear ${spawn} ${spawn === 1 ? "job" : "jobs"} y no hay herramienta que lo haga. Tras ${generations} generaciones sigue habiendo un solo job.`
          : `Cada corrida crea ${spawn} ${spawn === 1 ? "job nuevo" : "jobs nuevos"} y todos vuelven a disparar: la generación n tiene (1 + ${spawn})^n jobs. En la generación ${generations} ya son ${fmtInt(off.last)}.`}
      </p>
      <Readout items={[
        { label: "jobs en la última generación", value: fmtInt(g.last), tone: guard ? "var(--teal)" : "var(--rose)" },
        { label: "corridas acumuladas", value: fmtInt(g.runs), tone: "var(--amber)" },
        { label: "tokens (20 000/corrida)", value: fmtInt(g.tokens), tone: "var(--violet)" },
      ]} />
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs">sin guardia: {off.gens.map(fmtInt).join(" + ")} = {fmtInt(off.runs)} corridas · con guardia: {fmtInt(on.runs)} corridas · factor {(off.runs / on.runs).toLocaleString("es-ES", { maximumFractionDigits: 1 })}×</p>
      <p className="text-xs text-muted">El arreglo documentado es desactivar el toolset, no un prompt que diga «por favor no programes más cron». Tokens por corrida didácticos.</p>
    </div>
  );
}

function TriggerNote({ provider }: { provider: Provider }) {
  const r = resolveTrigger(provider);
  return (
    <div className="space-y-3">
      <p><strong>Un proveedor solo controla el disparador.</strong> {r.text}</p>
      <Readout items={[
        { label: "disparador activo", value: r.active === "chronos" ? "Chronos" : "InProcessCronScheduler", tone: r.active === "chronos" ? "var(--violet)" : "var(--teal)" },
        { label: "warning", value: r.warning ? "sí" : "no", tone: r.warning ? "var(--amber)" : "var(--muted)" },
        { label: "ejecución", value: "run_job() + _deliver_result()", tone: "var(--ink)" },
      ]} />
      <p className="text-xs text-muted">Chronos reclama cada job con compare-and-set (como mucho una vez entre réplicas), corre el mismo run_one_job y rearma. Los jobs repeat-N paran limpio sin one-shot huérfano. En los tres casos, ejecución y entrega son idénticas.</p>
    </div>
  );
}

function SpanishVisual() {
  const [view, setView] = useState<View>("guard");
  const [guard, setGuard] = useState(false);
  const [spawn, setSpawn] = useState(2);
  const [generations, setGenerations] = useState(4);
  const [provider, setProvider] = useState<Provider>("broken");
  return (
    <Figure
      label="Cron de Hermes · guardia de recursión y disparador"
      hint="un job no crea jobs · el cron nunca se queda sin disparador"
      height="h-[440px] md:h-[540px]"
      legend={view === "guard" ? [
        { color: P.teal, label: "job original" },
        { color: P.amber, label: "jobs creados" },
        { color: P.rose, label: "crecimiento descontrolado" },
      ] : [
        { color: P.violet, label: "Chronos" },
        { color: P.teal, label: "built-in" },
        { color: P.amber, label: "warning de fallback" },
      ]}
      note={view === "guard" ? <GuardNote spawn={spawn} generations={generations} guard={guard} /> : <TriggerNote provider={provider} />}
      controls={
        <>
          <Switcher value={view} onChange={setView} ariaLabel="Mecanismo" options={[
            { value: "guard", label: "Guardia de recursión", tone: P.rose },
            { value: "trigger", label: "Disparador", tone: P.violet },
          ]} />
          {view === "guard" ? (
            <>
              <Switcher value={guard ? "on" : "off"} onChange={(v) => setGuard(v === "on")} ariaLabel="Guardia" options={[
                { value: "off", label: "Sin guardia", tone: P.rose },
                { value: "on", label: "Con guardia", tone: P.teal },
              ]} />
              <Knob label="jobs por corrida" value={spawn} min={1} max={3} onChange={setSpawn} tone="var(--amber)" />
              <Knob label="generaciones" value={generations} min={1} max={5} onChange={setGenerations} tone="var(--rose)" />
            </>
          ) : (
            <Switcher value={provider} onChange={setProvider} ariaLabel="cron.provider" options={[
              { value: "empty", label: "Vacío", tone: P.teal },
              { value: "chronos", label: "Chronos correcto", tone: P.violet },
              { value: "broken", label: "Chronos roto", tone: P.rose },
            ]} />
          )}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3, 6.5, 9.5], fov: 34 }} fit={1.08}>
        <PointerTilt amount={0.04}>
          {view === "guard" ? <GuardScene spawn={spawn} generations={generations} guard={guard} /> : <TriggerScene provider={provider} />}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}
