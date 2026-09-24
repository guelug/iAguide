"use client";

import {
  SurfaceCompare,
  type Surface,
} from "@/components/three/scenes/SurfaceCompare";
import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Tag, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/*
 * The "Comparar, sin mezclar knobs" section runs about 1,200 words and
 * asks the reader to keep two schedulers and a hook endpoint apart. Every
 * fact below is from that section: who owns the jobs, which knob disables
 * what, and the paste the docs warn against.
 */

const EN: Surface[] = [
  {
    name: "Hermes cron",
    role: "server",
    note: "a Hermes scheduler, living inside the Hermes loop",
    knobs: ["crontab line"],
    color: P.violet,
  },
  {
    name: "OpenClaw automations",
    role: "server",
    note: "sqlite jobs owned by the Gateway; one-shots self-delete only when they succeed",
    knobs: ["cron.enabled", "OPENCLAW_SKIP_CRON", "cron.triggers.enabled"],
    color: P.teal,
  },
  {
    name: "Gateway hooks",
    role: "client",
    note: "HTTP wake endpoints that need their own dedicated token — never a gateway auth token",
    knobs: ["hooks.enabled", "hook token"],
    color: P.amber,
  },
];

const ES: Surface[] = [
  {
    name: "Hermes cron",
    role: "server",
    note: "un scheduler de Hermes, dentro del bucle Hermes",
    knobs: ["línea crontab"],
    color: P.violet,
  },
  {
    name: "Automations OpenClaw",
    role: "server",
    note: "jobs sqlite del Gateway; los one-shot se autoborran solo si terminan bien",
    knobs: ["cron.enabled", "OPENCLAW_SKIP_CRON", "cron.triggers.enabled"],
    color: P.teal,
  },
  {
    name: "Hooks del Gateway",
    role: "client",
    note: "endpoints HTTP de wake con su propio token dedicado — nunca un token de auth del gateway",
    knobs: ["hooks.enabled", "hook token"],
    color: P.amber,
  },
];

function LegacyVisual() {
  const t = useCopy({
    en: {
      surfaces: EN,
      copy: {
        title: "two schedulers and a doorbell",
        hint: "click a plinth · the arrow is the direction calls travel",
        note: "A crontab line is not a session knob. Recurring failures back off 30s, 60s, 5m, 15m, 60m, and a time-based job disables itself after ten consecutive failures.",
        roles: { server: "server", client: "inbound", bridge: "bridge" },
        knobsLabel: "knobs",
        hazard: { text: "no crontab line in session.reset", from: 0, to: 1 },
      },
    },
    es: {
      surfaces: ES,
      copy: {
        title: "dos schedulers y un timbre",
        hint: "pulsa una peana · la flecha es la dirección de las llamadas",
        note: "Una línea de crontab no es un mando de sesión. Los fallos recurrentes hacen backoff 30s, 60s, 5m, 15m, 60m, y un job por tiempo se autodeshabilita tras diez fallos seguidos.",
        roles: { server: "servidor", client: "entrante", bridge: "puente" },
        knobsLabel: "mandos",
        hazard: { text: "no pegar crontab en session.reset", from: 0, to: 1 },
      },
    },
  });

  return <SurfaceCompare surfaces={t.surfaces} copy={t.copy} />;
}

/* ======================================================================
 * Versión española: dos schedulers, un timbre y sus interruptores.
 *
 * Cada mando apaga una cosa concreta y ninguna de Hermes: cron.enabled y
 * OPENCLAW_SKIP_CRON apagan las automations del Gateway;
 * cron.triggers.enabled es el paro duro de triggers y scripts
 * (corren con la política de tools completa, exec incluido);
 * hooks.enabled cierra /hooks/wake y /hooks/agent. El segundo modo
 * calcula la escalera de backoff y el autodeshabilitado a los 10 fallos.
 * ==================================================================== */

type PanelMode = "switches" | "retries";
type Knobs = { cronEnabled: boolean; skip: boolean; triggers: boolean; hooks: boolean };

const BACKOFF = [30, 60, 300, 900, 3600];
const DISABLE_AT = 10;
const secs = (n: number) => (n < 60 ? `${n} s` : n < 3600 ? `${n / 60} min` : `${n / 3600} h`);

function lanes(k: Knobs) {
  const jobs = k.cronEnabled && !k.skip;
  return [
    { id: "hermes", label: "Hermes cron", color: P.violet, on: true },
    { id: "jobs", label: "Automations", color: P.teal, on: jobs },
    { id: "triggers", label: "Triggers y scripts", color: P.amber, on: jobs && k.triggers },
    { id: "hooks", label: "Hooks HTTP", color: P.inkSoft, on: k.hooks },
  ];
}

function retryModel(failures: number) {
  const disabled = failures >= DISABLE_AT;
  const step = failures === 0 ? -1 : Math.min(failures - 1, BACKOFF.length - 1);
  return { disabled, step, next: disabled || step < 0 ? 0 : BACKOFF[step] };
}

function SpanishVisual() {
  const [mode, setMode] = useState<PanelMode>("switches");
  const [knobs, setKnobs] = useState<Knobs>({ cronEnabled: true, skip: false, triggers: true, hooks: true });
  const [failures, setFailures] = useState(3);
  const ls = lanes(knobs);
  const r = retryModel(failures);
  const flip = (key: keyof Knobs) => setKnobs({ ...knobs, [key]: !knobs[key] });
  const running = ls.filter((l) => l.on).map((l) => l.label);

  const switchNote = `En marcha: ${running.join(", ")}. ${!knobs.cronEnabled || knobs.skip ? `${!knobs.cronEnabled ? "cron.enabled: false" : "OPENCLAW_SKIP_CRON=1"} apaga las automations del Gateway y, con ellas, sus triggers. ` : ""}${knobs.cronEnabled && !knobs.skip && !knobs.triggers ? "cron.triggers.enabled: false para los scripts de condición y los payloads script, que corren sin nadie delante con exec incluido; los jobs normales siguen. " : ""}${!knobs.hooks ? "hooks.enabled: false cierra /hooks/wake y /hooks/agent. " : ""}Hermes cron no se toca con ningún mando de OpenClaw: es otro scheduler, dentro del bucle de Hermes. No pegues una línea de crontab en session.reset.`;
  const retryNote = r.disabled
    ? `Diez fallos seguidos: un job recurrente por tiempo se deshabilita solo. openclaw automations enable limpia la racha una vez arreglada la causa.`
    : failures === 0
      ? "Sin fallos, el job corre a su hora. Un one-shot se autoborra solo si termina con completionStatus succeeded."
      : `Tras ${failures} ${failures === 1 ? "fallo" : "fallos"} seguidos el siguiente intento espera ${secs(r.next)}. La escalera es 30 s, 60 s, 5 min, 15 min y 60 min; a partir del quinto se queda en 60 min. Quedan ${DISABLE_AT - failures} fallos para el autodeshabilitado.`;

  return (
    <Figure
      label="Dos schedulers y un timbre: cada mando apaga lo suyo"
      hint={mode === "switches" ? `${running.length} de 4 superficies en marcha` : `${failures} fallos seguidos`}
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.violet, label: "Hermes cron" },
        { color: P.teal, label: "Automations del Gateway" },
        { color: P.amber, label: "Triggers y scripts" },
        { color: P.inkSoft, label: "Hooks HTTP" },
        { color: P.rose, label: "Apagado o fallo" },
      ]}
      controls={
        <>
          <Switcher ariaLabel="Vista" value={mode} onChange={setMode} options={[{ value: "switches", label: "Interruptores", tone: P.teal }, { value: "retries", label: "Reintentos", tone: P.rose }]} />
          {mode === "switches" ? (
            <>
              <button type="button" className="chip" aria-pressed={!knobs.cronEnabled} onClick={() => flip("cronEnabled")}>{`cron.enabled: ${knobs.cronEnabled}`}</button>
              <button type="button" className="chip" aria-pressed={knobs.skip} onClick={() => flip("skip")}>{`OPENCLAW_SKIP_CRON=${knobs.skip ? 1 : 0}`}</button>
              <button type="button" className="chip" aria-pressed={!knobs.triggers} onClick={() => flip("triggers")}>{`cron.triggers.enabled: ${knobs.triggers}`}</button>
              <button type="button" className="chip" aria-pressed={!knobs.hooks} onClick={() => flip("hooks")}>{`hooks.enabled: ${knobs.hooks}`}</button>
            </>
          ) : (
            <Knob label="Fallos seguidos" value={failures} min={0} max={DISABLE_AT} onChange={setFailures} tone={P.rose} />
          )}
        </>
      }
      note={
        <div className="space-y-2">
          <p>{mode === "switches" ? switchNote : retryNote}</p>
          <p className="text-xs text-muted">Los hooks necesitan su propio token dedicado (Authorization: Bearer o x-openclaw-token), nunca un token de auth del Gateway; los tokens en query string se rechazan. Fuente: OpenClaw, Automations; Nous Research, Agent Loop Internals.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.5, 7.5, 9.5], fov: 34 }} fit={1.04}>
        {mode === "switches" ? <SwitchBench knobs={knobs} /> : <RetryBench failures={failures} />}
      </Stage>
    </Figure>
  );
}

/* BENCH */
function Blk({ p, s, color, coat = 0.4, rough = 0.42, metal = 0.05 }: { p: V3; s: V3; color: string; coat?: number; rough?: number; metal?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(0.05, Math.min(s[0], s[1], s[2]) / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} />
    </RoundedBox>
  );
}

const LANE_Z: Record<string, number> = { hermes: -1.0, jobs: -0.9, triggers: 0.1, hooks: 1.1 };

function Lever({ x, on, label }: { x: number; on: boolean; label: string }) {
  return (
    <group position={[x, 0, 2.15]}>
      <Blk p={[0, 0.12, 0]} s={[0.5, 0.12, 0.4]} color="#2E3438" metal={0.3} />
      <group position={[0, 0.2, 0]} rotation={[on ? -0.5 : 0.5, 0, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.4, 10]} />
          <meshStandardMaterial color="#8C9296" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.07, 14, 10]} />
          <meshStandardMaterial color={on ? P.teal : P.rose} />
        </mesh>
      </group>
      <Tag position={[0, 0.2, 0.45]} tone={on ? "muted" : "rose"} size="xs" center>{label}</Tag>
    </group>
  );
}

function SwitchBench({ knobs }: { knobs: Knobs }) {
  const ls = lanes(knobs);
  return (
    <group>
      {/* Hermes: another process on its own island. */}
      <Blk p={[-3.6, -0.13, -1.0]} s={[2.2, 0.22, 1.6]} color="#40362D" rough={0.6} coat={0.3} />
      <Blk p={[-3.6, 0.0, -1.0]} s={[2.0, 0.05, 1.4]} color="#6B513A" rough={0.55} coat={0} />
      {/* The OpenClaw Gateway plinth. */}
      <Blk p={[1.1, -0.13, 0.35]} s={[5.8, 0.22, 4.3]} color="#263532" metal={0.3} coat={0.35} />
      <Blk p={[1.1, 0.0, 0.35]} s={[5.5, 0.05, 4.0]} color={mixHex(P.paper, P.sunken, 0.7)} rough={0.6} coat={0} />
      <Tag position={[2.6, 0.95, -1.75]} tone="ink" center>Gateway OpenClaw</Tag>
      {ls.map((l) => {
        const hermes = l.id === "hermes";
        const x0 = hermes ? -4.4 : -1.5;
        const x1 = hermes ? -2.9 : 3.3;
        const z = LANE_Z[l.id];
        const col = l.on ? l.color : "#B9B5A9";
        return (
          <group key={l.id}>
            <mesh position={[(x0 + x1) / 2, 0.12, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, x1 - x0, 12]} />
              <meshStandardMaterial color={col} roughness={0.4} />
            </mesh>
            <Blk p={[x1, 0.35, z]} s={[0.7, 0.55, 0.6]} color={mixHex(P.paper, col, l.on ? 0.55 : 0.2)} />
            {l.on ? <Flow points={[[x0, 0.3, z], [x1 - 0.4, 0.3, z]]} color={l.color} count={3} size={0.05} speed={0.35} lineOpacity={0.3} /> : null}
            <Tag position={[x0 + (hermes ? 0.55 : 0.9), 0.55, z]} tone={l.on ? (hermes ? "violet" : l.id === "jobs" ? "teal" : l.id === "triggers" ? "amber" : "ink") : "rose"} size="xs" center>{l.on ? l.label : `${l.label} · parado`}</Tag>
          </group>
        );
      })}
      <Tag position={[-3.6, 0.2, -0.1]} tone="muted" size="xs" center>otro proceso</Tag>
      <Lever x={-1.0} on={knobs.cronEnabled} label="cron.enabled" />
      <Lever x={0.4} on={!knobs.skip} label="SKIP_CRON" />
      <Lever x={1.8} on={knobs.triggers} label="triggers" />
      <Lever x={3.2} on={knobs.hooks} label="hooks" />
    </group>
  );
}

function RetryBench({ failures }: { failures: number }) {
  const r = retryModel(failures);
  const stepH = (sec: number) => 0.2 + (Math.log10(sec) - 1) * 0.55;
  return (
    <group>
      <Blk p={[0, -0.13, 0]} s={[9, 0.22, 4.2]} color="#263532" metal={0.3} coat={0.35} />
      <Blk p={[0, 0.0, 0]} s={[8.7, 0.05, 3.9]} color={mixHex(P.paper, P.sunken, 0.7)} rough={0.6} coat={0} />
      {BACKOFF.map((sec, k) => {
        const h = stepH(sec);
        const on = k === r.step && !r.disabled;
        return (
          <group key={sec} position={[-3 + k * 1.3, 0, -0.5]}>
            <Blk p={[0, h / 2 + 0.03, 0]} s={[1.1, h, 1.4]} color={on ? P.rose : k < r.step || (r.disabled && k <= 4) ? mixHex(P.paper, P.rose, 0.3) : "#E6E0D2"} />
            <Tag position={[0, h + 0.3, 0.5]} tone={on ? "rose" : "muted"} size="xs" center>{secs(sec)}</Tag>
            {on ? (
              <mesh position={[0, h + 0.2, -0.2]} castShadow>
                <sphereGeometry args={[0.16, 20, 14]} />
                <meshStandardMaterial color={P.ink} roughness={0.3} metalness={0.3} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      <Tag position={[-3.9, 0.3, -1.5]} tone="ink" size="xs">espera antes del reintento</Tag>
      {/* One lamp per consecutive failure. */}
      {Array.from({ length: DISABLE_AT }, (_, k) => (
        <group key={k} position={[-2.7 + k * 0.6, 0, 1.3]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.12, 20]} />
            <meshStandardMaterial color="#2E3438" metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.22, 0]} castShadow>
            <sphereGeometry args={[0.14, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={k < failures ? P.rose : "#CFCAC0"} emissive={k < failures ? P.rose : "#000000"} emissiveIntensity={k < failures ? 0.3 : 0} />
          </mesh>
        </group>
      ))}
      <Tag position={[0, 0.15, 2.05]} tone={r.disabled ? "rose" : "muted"} size="xs" center>{r.disabled ? "job deshabilitado" : `${failures} / ${DISABLE_AT} fallos`}</Tag>
      {r.disabled ? <Blk p={[0.2, 1.6, -0.5]} s={[6.8, 0.12, 0.12]} color={P.rose} /> : null}
    </group>
  );
}
