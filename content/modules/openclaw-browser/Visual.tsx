"use client";

import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Step = "a" | "b" | "c" | "d" | "e";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "chrome_ext": "chrome ext",
      "node_proxy": "node proxy",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "chrome_ext": "ext de chrome",
      "node_proxy": "proxy de nodo",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: "openclaw", tone: "var(--teal)" },
    { value: "b" as const, label: "user", tone: "var(--amber)" },
    { value: "c" as const, label: t.chrome_ext, tone: "var(--violet)" },
    { value: "d" as const, label: "SSRF", tone: "var(--amber)" },
    { value: "e" as const, label: t.node_proxy, tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="OpenClaw: managed browser profiles"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-browser diagram steps"
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
        color={active === "a" ? P.teal : P.lineStrong}
        fill={active === "a" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        openclaw
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>
        user
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.chrome_ext}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        SSRF
      </Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.node_proxy}</Tag>
    </group>
  );
}

/* ======================================================================
 * Versión española: tres perfiles, un plano de control en loopback.
 *
 * La situación decide el perfil (sin sesión → openclaw aislado; humano
 * en el escritorio → user por DevTools MCP con aviso de depuración;
 * humano ausente → chrome por la extensión). Los puertos se derivan de
 * gateway.port. El cierre de sesión del agente solo cierra las pestañas
 * que abrió la herramienta con action: "open".
 * ==================================================================== */

type Situation = "nologin" | "present" | "away";
type Profile = "openclaw" | "user" | "chrome";

const PROFILES: Record<Profile, { color: string; human: number; via: string }> = {
  openclaw: { color: P.amber, human: 0, via: "directorio de datos propio" },
  user: { color: P.teal, human: 3, via: "Chrome DevTools MCP" },
  chrome: { color: P.violet, human: 3, via: "extensión OpenClaw" },
};
const PICK: Record<Situation, Profile> = { nologin: "openclaw", present: "user", away: "chrome" };
const AGENT_TABS = 2;

function ports(gateway: number) {
  const control = gateway + 2;
  return { control, cdpFrom: control + 9, cdpTo: control + 108 };
}

function SpanishVisual() {
  const [situation, setSituation] = useState<Situation>("nologin");
  const [gateway, setGateway] = useState(18789);
  const [cleaned, setCleaned] = useState(false);
  const profile = PICK[situation];
  const pr = ports(gateway);
  const human = PROFILES[profile].human;

  const story: Record<Situation, string> = {
    nologin: "No hacen falta sesiones iniciadas: el agente usa el perfil openclaw, un navegador gestionado con su propio directorio de datos. Nunca toca tu perfil personal.",
    present: "Hacen falta tus sesiones y estás delante: el perfil user se adjunta a tu Chrome real por Chrome DevTools MCP. La primera vez Chrome muestra un aviso bloqueante «Allow remote debugging?» y alguien tiene que aceptarlo.",
    away: "Hacen falta tus sesiones pero escribes desde el móvil: el perfil chrome conduce la misma sesión a través de la extensión, sin aviso de depuración remota.",
  };

  return (
    <Figure
      label="Un navegador solo para el agente, y dos que no lo son"
      hint={`perfil ${profile} · control en 127.0.0.1:${pr.control}`}
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.amber, label: "Perfil openclaw" },
        { color: P.teal, label: "Perfil user" },
        { color: P.violet, label: "Perfil chrome" },
        { color: P.faint, label: "Pestañas del humano" },
      ]}
      controls={
        <>
          <Switcher ariaLabel="Situación" value={situation} onChange={(v) => { setSituation(v); setCleaned(false); }} options={[{ value: "nologin", label: "Sin sesión", tone: P.amber }, { value: "present", label: "Humano presente", tone: P.teal }, { value: "away", label: "Humano ausente", tone: P.violet }]} />
          <Knob label="gateway.port" value={gateway} min={18709} max={18889} step={10} onChange={setGateway} />
          <button type="button" className="chip" aria-pressed={cleaned} onClick={() => setCleaned(!cleaned)}>{cleaned ? "Reabrir pestañas" : "Cerrar sesión del agente"}</button>
        </>
      }
      note={
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
            {[
              ["Servicio de control", `:${pr.control}`],
              ["CDP de perfiles openclaw", `${pr.cdpFrom}–${pr.cdpTo}`],
              ["Pestañas abiertas", cleaned ? `${human} (del humano)` : `${human + AGENT_TABS} (${AGENT_TABS} del agente)`],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="block text-xs text-muted">{label}</span>
                <strong className="mt-1 block font-display text-2xl text-ink">{value}</strong>
              </div>
            ))}
          </div>
          <p>{story[situation]}</p>
          <p>
            Puertos: control = gateway.port + 2 = {pr.control}, solo en loopback; los perfiles openclaw asignan cdpPort desde 9 puertos más arriba ({pr.cdpFrom}–{pr.cdpTo}), lejos del 9222 de los flujos de desarrollo.{" "}
            {cleaned
              ? `Al cerrar la sesión se van las ${AGENT_TABS} pestañas que abrió la herramienta con action: "open". ${human ? `Las ${human} del humano se quedan: OpenClaw no adopta pestañas que ya estaban abiertas.` : ""}`
              : "Pulsa «Cerrar sesión del agente» para ver qué pestañas limpia."}
          </p>
          <p className="text-xs text-muted">OPENCLAW_GATEWAY_PORT tiene prioridad sobre gateway.port. Cambiar la configuración del navegador exige reiniciar el Gateway. Fuente: OpenClaw, Browser.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3, 6, 10.5], fov: 34 }} fit={1.05}>
        <ProfileBench profile={profile} cleaned={cleaned} control={pr.control} />
      </Stage>
    </Figure>
  );
}

/* BENCH */
function Shape({ p, s, color, coat = 0.4, rough = 0.42, metal = 0.05 }: { p: V3; s: V3; color: string; coat?: number; rough?: number; metal?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(0.05, Math.min(s[0], s[1], s[2]) / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} />
    </RoundedBox>
  );
}

const TOWER_X: Record<Profile, number> = { openclaw: -0.7, user: 1.4, chrome: 3.5 };
const GW: V3 = [-3.4, 0, 0.6];

function BrowserTower({ id, active, cleaned }: { id: Profile; active: boolean; cleaned: boolean }) {
  const { color, human } = PROFILES[id];
  const agent = active && !cleaned ? AGENT_TABS : 0;
  const tabs = [...Array.from({ length: human }, () => "#C3C8CC"), ...Array.from({ length: agent }, () => color)];
  return (
    <group position={[TOWER_X[id], 0, -0.3]}>
      <Shape p={[0, 0.12, 0]} s={[1.7, 0.14, 1.2]} color="#2E3438" metal={0.3} />
      <mesh position={[0, 0.4, -0.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.45, 12]} />
        <meshStandardMaterial color="#8C9296" metalness={0.7} roughness={0.3} />
      </mesh>
      <Shape p={[0, 1.15, -0.2]} s={[1.7, 1.15, 0.1]} color={mixHex("#23282C", color, active ? 0.18 : 0.05)} coat={0.6} metal={0.2} />
      <mesh position={[0, 1.08, -0.145]}>
        <planeGeometry args={[1.5, 0.85]} />
        <meshStandardMaterial color={active ? mixHex(P.paper, color, 0.25) : "#E3DED3"} roughness={0.4} />
      </mesh>
      {tabs.map((c, k) => (
        <Shape key={k} p={[-0.6 + k * 0.3, 1.8, -0.2]} s={[0.26, 0.16, 0.14]} color={c} />
      ))}
      {id === "openclaw" ? (
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.0, 0.03, 10, 48]} />
          <meshStandardMaterial color={P.amber} metalness={0.4} roughness={0.35} />
        </mesh>
      ) : null}
      {id === "user" ? (
        <group position={[0.55, 0, 0.9]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.35, 4, 12]} />
            <meshStandardMaterial color={active ? P.inkSoft : "#B9B5A9"} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.82, 0]} castShadow>
            <sphereGeometry args={[0.11, 16, 12]} />
            <meshStandardMaterial color={active ? P.inkSoft : "#B9B5A9"} roughness={0.5} />
          </mesh>
          {active ? <Shape p={[-0.85, 0.75, 0.05]} s={[0.55, 0.35, 0.05]} color={P.amberWash} /> : null}
          {active ? <Tag position={[-0.85, 1.1, 0.05]} tone="amber" size="xs" center>Aviso de depuración</Tag> : null}
        </group>
      ) : null}
      {id === "chrome" ? (
        <group position={[0.95, 1.1, -0.2]}>
          <Shape p={[0, 0, 0]} s={[0.22, 0.3, 0.22]} color={P.violet} />
          <mesh position={[0.13, 0.05, 0]} castShadow>
            <sphereGeometry args={[0.07, 14, 10]} />
            <meshStandardMaterial color={P.violet} roughness={0.4} />
          </mesh>
        </group>
      ) : null}
      <Tag position={[0, 2.2, -0.2]} tone={active ? (id === "openclaw" ? "amber" : id === "user" ? "teal" : "violet") : "muted"} center>{id}</Tag>
      <Tag position={[0, 0.25, 0.75]} tone="muted" size="xs" center>{id === "openclaw" ? "datos propios" : id === "user" ? "DevTools MCP" : "extensión"}</Tag>
    </group>
  );
}

function ProfileBench({ profile, cleaned, control }: { profile: Profile; cleaned: boolean; control: number }) {
  const target = TOWER_X[profile];
  return (
    <group>
      <Shape p={[0, -0.13, 0]} s={[10, 0.22, 3.8]} color="#40362D" rough={0.6} coat={0.3} />
      <Shape p={[0, 0.0, 0]} s={[9.7, 0.05, 3.5]} color="#6B513A" rough={0.55} coat={0} />
      {/* The Gateway with its loopback-only control service. */}
      <group position={GW}>
        <Shape p={[0, 0.5, 0]} s={[1.6, 0.85, 1.4]} color="#263532" metal={0.3} />
        {Array.from({ length: 5 }, (_, k) => (
          <mesh key={k} position={[-0.81, 0.3 + k * 0.1, 0]}>
            <boxGeometry args={[0.02, 0.04, 1.0]} />
            <meshStandardMaterial color="#1B2322" />
          </mesh>
        ))}
        <mesh position={[0.3, 1.02, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.22, 0.05, 12, 36]} />
          <meshStandardMaterial color={P.teal} metalness={0.3} roughness={0.35} />
        </mesh>
        <Tag position={[0, 1.45, 0]} tone="ink" center>Gateway</Tag>
        <Tag position={[0.3, 0.95, 0.75]} tone="teal" size="xs" center>{`loopback :${control}`}</Tag>
      </group>
      {(Object.keys(PROFILES) as Profile[]).map((id) => {
        const on = id === profile;
        const pts: V3[] = [[GW[0] + 0.8, 0.6, GW[2]], [(GW[0] + TOWER_X[id]) / 2, on ? 1.7 : 0.9, 0.6], [TOWER_X[id], 0.45, -0.1]];
        return on ? (
          <Flow key={id} points={pts} color={PROFILES[id].color} count={3} size={0.05} speed={0.35} lineOpacity={0.5} width={1.8} />
        ) : (
          <Wire key={id} points={pts} color={P.lineStrong} opacity={0.4} dashed />
        );
      })}
      {(Object.keys(PROFILES) as Profile[]).map((id) => <BrowserTower key={id} id={id} active={id === profile} cleaned={cleaned} />)}
      {cleaned ? <Tag position={[target, 2.55, -0.3]} tone="rose" size="xs" center>{`${AGENT_TABS} pestañas cerradas`}</Tag> : null}
    </group>
  );
}
