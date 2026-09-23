"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { MathUtils, type Group, type Mesh } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "discover" | "register" | "capability";
const COPY = {
  en: { title: "register(ctx) is the plugin waist", hint: "discover · register · consent", discover: "discover", register: "register", capability: "capability", user: "user", project: "project", pip: "pip", tool: "tool", hook: "hook", cli: "CLI", consent: "consent", override: "override", fail: "fail closed", data: "plugin-data" },
  es: { title: "register(ctx) es la cintura del plugin", hint: "descubre · registra · consiente", discover: "descubre", register: "registra", capability: "capability", user: "usuario", project: "proyecto", pip: "pip", tool: "tool", hook: "hook", cli: "CLI", consent: "consentimiento", override: "override", fail: "fail closed", data: "plugin-data" },
};

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("discover");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.tool }, { color: P.violet, label: t.hook }, { color: P.amber, label: t.consent }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "discover", label: t.discover, tone: P.teal }, { value: "register", label: t.register, tone: P.violet }, { value: "capability", label: t.capability, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "discover" && <>{[[t.user, P.teal, -1.8], [t.project, P.violet, 0], [t.pip, P.amber, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.85, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.75, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag>{i < 2 && <Ribbon points={[[x as number + 0.75, 0.2, 0], [x as number + 1.0, 0.2, 0]]} color={P.lineStrong} radius={0.035} opacity={0.75} />}</group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">plugin.yaml + register(ctx)</Tag></>}
        {mode === "register" && <><Slab position={[0, 0.2, 0]} size={[2.1, 1.25, 0.14]} color={P.violet} fill={0.18} rim={0.7} /><Tag position={[0, 0.78, 0.15]} tone="violet">register(ctx)</Tag>{[[t.tool, P.teal, -1.65], [t.hook, P.amber, 0], [t.cli, P.rose, 1.65]].map(([label, color, x], i) => <group key={label as string}><Node3D position={[x as number, -0.85, 0]} color={color as string} radius={0.15} pulse={0.25} /><Tag position={[x as number, -0.4, 0.15]} tone={(["teal", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag><Ribbon points={[[x as number, -0.65, 0], [x as number * 0.45, -0.35, 0]]} color={color as string} radius={0.035} opacity={0.8} /></group>)}</>}
        {mode === "capability" && <><Halo position={[0, 0.2, 0]} radius={1.25} color={P.amber} opacity={0.35} spin={0.12} /><Node3D position={[0, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.4} /><Tag position={[0, 0.78, 0.15]} tone="amber">{t.consent}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Slab position={[-2, 0.2, 0]} size={[1.35, 0.65, 0.1]} color={P.teal} fill={0.24} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">{t.tool}</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.rose} radius={0.06} opacity={0.95} /><Slab position={[2, 0.2, 0]} size={[1.35, 0.65, 0.1]} color={P.rose} fill={0.24} /><Tag position={[2, 0.65, 0.15]} tone="rose" size="xs">{t.fail}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.override} → {t.consent}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

/* ------------------------------------------------------------------ ES */

/*
 * Un turno de Hermes con sus hooks. Casi todos observan; dos dirigen:
 * pre_tool_call puede devolver block/approve y pre_llm_call inyecta
 * contexto en el mensaje de USUARIO (tope 10 000 caracteres por hook;
 * el resto va a $HERMES_HOME/hook_outputs/). La torre de la izquierda es
 * el prompt: el system es el prefijo cacheado y no se toca.
 */

type ToolAction = "none" | "block" | "approve";
type InjectAt = "user" | "system";

const HOOK_CAP = 10_000;
const SYSTEM_TOK = 2_400;
const CPT = 4; // chars per token, rule of thumb
const ES_N = new Intl.NumberFormat("es-ES");

function hookModel(chars: number, action: ToolAction, at: InjectAt) {
  const injected = Math.min(chars, HOOK_CAP);
  const overflow = Math.max(0, chars - HOOK_CAP);
  const cacheIntact = at === "user" || injected === 0;
  const toolRuns = action !== "block";
  return {
    injected,
    overflow,
    injectedTokens: Math.round(injected / CPT),
    cacheIntact,
    cachedTokens: cacheIntact ? SYSTEM_TOK : 0,
    toolRuns,
    approval: action === "approve" ? "aprobada por el hook" : action === "block" ? "no se ejecuta" : "flujo normal de aprobación",
  };
}

function M({ color, rough = 0.45, coat = 0.4, metal = 0 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} />;
}

/** Block that eases its height to h on top of y0. */
function Grow({ x, z, y0, h, w, d, color }: { x: number; z: number; y0: number; h: number; w: number; d: number; color: string }) {
  const ref = useRef<Mesh>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const t = Math.max(0.0001, h);
    const n = still ? t : MathUtils.damp(m.scale.y, t, 5, dt);
    m.scale.y = n;
    m.position.y = y0 + n / 2;
  });
  return (
    <mesh ref={ref} position={[x, y0 + h / 2, z]} scale={[1, Math.max(0.0001, h), 1]} castShadow receiveShadow>
      <boxGeometry args={[w, 1, d]} />
      <meshPhysicalMaterial color={color} roughness={0.38} clearcoat={0.5} clearcoatRoughness={0.25} />
    </mesh>
  );
}

const RAIL_Z = 0.1;
const RAIL_Y2 = -0.72;
const STATIONS = {
  preLlm: -1.3,
  llm: 0.25,
  preTool: 1.75,
  tool: 3.05,
  postTool: 4.3,
};

/** Payload bead that runs the turn along the rail; stops at the gate if blocked. */
function TurnBead({ blocked }: { blocked: boolean }) {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  const { still } = useStage();
  const start = STATIONS.preLlm - 0.9;
  const end = blocked ? STATIONS.preTool - 0.25 : STATIONS.postTool + 0.6;
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (still) {
      g.position.x = end;
      return;
    }
    const travel = (end - start) / 1.3;
    t.current = (t.current + dt) % (travel + 1.2);
    g.position.x = start + Math.min(1, t.current / travel) * (end - start);
  });
  return (
    <group ref={ref} position={[start, RAIL_Y2 + 0.16, RAIL_Z]}>
      <RoundedBox args={[0.36, 0.22, 0.3]} radius={0.06} smoothness={3} castShadow>
        <M color={blocked ? P.rose : P.teal} rough={0.35} coat={0.6} />
      </RoundedBox>
    </group>
  );
}

function PromptTower({ injected, at, cacheIntact }: { injected: number; at: InjectAt; cacheIntact: boolean }) {
  const x = -3.55;
  const y0 = -1.08;
  const w = 1.4;
  const d = 1.1;
  const injH = (injected / HOOK_CAP) * 0.8;
  const sysH = 0.95;
  const histH = 0.6;
  const userH = 0.3;
  // Order in the prompt: system, history, user (+ injection when at === "user").
  const sysY = y0 + 0.08;
  const injIntoSystem = at === "system";
  const histY = sysY + sysH + (injIntoSystem ? injH : 0);
  const userY = histY + histH;
  const top = userY + userH + (injIntoSystem ? 0 : injH);
  return (
    <group>
      <RoundedBox args={[w + 0.45, 0.12, d + 0.45]} position={[x, y0 + 0.02, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <M color="#b68442" rough={0.32} metal={0.55} coat={0.2} />
      </RoundedBox>
      <Grow x={x} z={0} y0={sysY} h={sysH} w={w} d={d} color={cacheIntact ? P.teal : mixHex(P.teal, P.rose, 0.55)} />
      {injIntoSystem ? <Grow x={x} z={0} y0={sysY + sysH} h={injH} w={w} d={d} color={P.amber} /> : null}
      <Grow x={x} z={0} y0={histY} h={histH} w={w} d={d} color={mixHex(P.paper, P.inkSoft, 0.4)} />
      <Grow x={x} z={0} y0={userY} h={userH} w={w} d={d} color={mixHex(P.paper, P.ink, 0.12)} />
      {!injIntoSystem ? <Grow x={x} z={0} y0={userY + userH} h={injH} w={w} d={d} color={P.amber} /> : null}
      {/* cache clamp: brass bands around the cached prefix */}
      {[0.12, sysH - 0.12].map((dy) => (
        <mesh key={dy} position={[x, sysY + dy, 0]}>
          <boxGeometry args={[w + 0.08, 0.05, d + 0.08]} />
          <M color={cacheIntact ? "#b68442" : P.rose} metal={0.6} rough={0.3} coat={0} />
        </mesh>
      ))}
      <Tag position={[x - w / 2 - 0.62, sysY + sysH / 2, d / 2]} tone={cacheIntact ? "teal" : "rose"} size="xs" center>{cacheIntact ? "system · caché" : "caché rota"}</Tag>
      <Tag position={[x + w / 2 + 0.5, histY + histH / 2, d / 2]} tone="muted" size="xs" center>historial</Tag>
      <Tag position={[x - w / 2 - 0.5, userY + userH / 2, d / 2]} tone="ink" size="xs" center>usuario</Tag>
      {injected > 0 ? (
        <Tag position={[x - w / 2 - 0.5, (injIntoSystem ? sysY + sysH : userY + userH) + injH / 2 + 0.12, d / 2]} tone="amber" size="xs" center>inyección</Tag>
      ) : null}
      <Tag position={[x, top + 0.35, 0]} tone="ink" center>prompt del turno</Tag>
    </group>
  );
}

function OverflowDrawer({ overflow }: { overflow: number }) {
  const sheets = Math.ceil(overflow / 2000);
  return (
    <group position={[-1.75, -1.08, 1.4]}>
      <RoundedBox args={[1.1, 0.42, 0.75]} position={[0, 0.21, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <M color={mixHex(P.paper, P.inkSoft, 0.3)} rough={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.25, 0.38]}>
        <boxGeometry args={[0.36, 0.06, 0.03]} />
        <M color="#b68442" metal={0.7} rough={0.3} coat={0} />
      </mesh>
      {Array.from({ length: sheets }, (_, i) => (
        <mesh key={i} position={[0.02 * (i % 2), 0.45 + i * 0.045, 0]} rotation={[0, (i % 2 ? 0.05 : -0.04), 0]} castShadow>
          <boxGeometry args={[0.85, 0.03, 0.55]} />
          <M color={mixHex(P.paper, P.amber, 0.25)} rough={0.7} coat={0.1} />
        </mesh>
      ))}
      <Tag position={[0.95, 0.3 + sheets * 0.045, 0.2]} tone={overflow > 0 ? "amber" : "muted"} size="xs" center>
        <span className="normal-case">hook_outputs/</span>
      </Tag>
    </group>
  );
}

function Post({ x, h = 0.9, color }: { x: number; h?: number; color: string }) {
  return (
    <mesh position={[x, RAIL_Y2 - 0.3 + h / 2, RAIL_Z - 0.55]} castShadow>
      <boxGeometry args={[0.1, h, 0.1]} />
      <M color={color} metal={0.4} rough={0.35} coat={0.2} />
    </mesh>
  );
}

/** Observer clamp: reads the payload, cannot change it. */
function Sensor({ x, label }: { x: number; label: string }) {
  return (
    <group>
      <Post x={x} color="#9aa3ab" />
      <mesh position={[x, RAIL_Y2 + 0.45, RAIL_Z - 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.3, 0.05, 12, 32, Math.PI]} />
        <M color={P.violet} rough={0.35} />
      </mesh>
      <Tag position={[x, RAIL_Y2 + 1.0, RAIL_Z - 0.4]} tone="violet" size="xs" center><span className="normal-case">{label}</span></Tag>
    </group>
  );
}

function Station({ x, label, color, size = [0.9, 0.7, 0.9] as V3, tone }: { x: number; label: string; color: string; size?: V3; tone: "ink" | "teal" | "amber" }) {
  return (
    <group position={[x, RAIL_Y2 - 0.3 + size[1] / 2, RAIL_Z - 0.85]}>
      <RoundedBox args={size} radius={0.08} smoothness={3} castShadow receiveShadow>
        <M color={color} rough={0.45} coat={0.45} />
      </RoundedBox>
      <Tag position={[0, size[1] / 2 + 0.3, 0]} tone={tone} size="xs" center>{label}</Tag>
    </group>
  );
}

function Gate({ action }: { action: ToolAction }) {
  const arm = useRef<Group>(null);
  const { still } = useStage();
  const target = action === "block" ? 0 : action === "approve" ? 1.35 : 0.7;
  useFrame((_, dt) => {
    if (!arm.current) return;
    arm.current.rotation.x = still ? target : MathUtils.damp(arm.current.rotation.x, target, 5, dt);
  });
  const color = action === "block" ? P.rose : action === "approve" ? P.teal : P.amber;
  const x = STATIONS.preTool;
  return (
    <group>
      <Post x={x} h={1.0} color="#9aa3ab" />
      <group ref={arm} position={[x, RAIL_Y2 + 0.55, RAIL_Z - 0.55]}>
        <mesh position={[0, 0, 0.62]} castShadow>
          <boxGeometry args={[0.16, 0.16, 1.3]} />
          <M color={color} rough={0.35} coat={0.5} />
        </mesh>
      </group>
      <mesh position={[x, RAIL_Y2 + 0.55, RAIL_Z - 0.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 20]} />
        <M color="#b68442" metal={0.6} rough={0.3} coat={0} />
      </mesh>
      <Tag position={[x, RAIL_Y2 + 1.25, RAIL_Z - 0.55]} tone={action === "block" ? "rose" : action === "approve" ? "teal" : "amber"} size="xs" center>
        <span className="normal-case">{action === "none" ? "pre_tool_call" : `action: ${action}`}</span>
      </Tag>
    </group>
  );
}

function HookBench({ chars, action, at }: { chars: number; action: ToolAction; at: InjectAt }) {
  const m = useMemo(() => hookModel(chars, action, at), [chars, action, at]);
  return (
    <PointerTilt amount={0.045}>
      <group>
        <ShadowBlob position={[0, -1.52, 0.1]} scale={10.5} opacity={0.12} />
        <RoundedBox args={[10.6, 0.34, 3.9]} position={[0.2, -1.32, 0]} radius={0.16} smoothness={4} castShadow receiveShadow>
          <M color="#3a3f44" rough={0.6} coat={0.2} />
        </RoundedBox>
        <RoundedBox args={[10.3, 0.06, 3.6]} position={[0.2, -1.13, 0]} radius={0.03} smoothness={2} receiveShadow>
          <M color="#50565c" rough={0.55} coat={0.25} />
        </RoundedBox>
        <PromptTower injected={m.injected} at={at} cacheIntact={m.cacheIntact} />
        <OverflowDrawer overflow={m.overflow} />
        {/* turn rail */}
        {[-0.13, 0.13].map((dz) => (
          <mesh key={dz} position={[(STATIONS.preLlm - 1 + STATIONS.postTool + 0.8) / 2, RAIL_Y2, RAIL_Z + dz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, STATIONS.postTool + 0.8 - STATIONS.preLlm + 1, 12]} />
            <M color="#b68442" metal={0.7} rough={0.3} coat={0} />
          </mesh>
        ))}
        {/* pre_llm_call: the injector valve that feeds the user message */}
        <group position={[STATIONS.preLlm, RAIL_Y2 + 0.2, RAIL_Z - 0.55]}>
          <Post x={0} color="#9aa3ab" />
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.3, 28]} />
            <M color={chars > 0 ? P.amber : mixHex(P.paper, P.amber, 0.3)} rough={0.35} coat={0.5} />
          </mesh>
          <Tag position={[0, 0.85, 0]} tone="amber" size="xs" center><span className="normal-case">pre_llm_call</span></Tag>
        </group>
        {chars > 0 ? (
          <Flow points={[[STATIONS.preLlm, RAIL_Y2 + 0.6, RAIL_Z - 0.55], [-2.2, 0.9, -0.2], [-2.75, at === "user" ? 0.95 : 0.1, 0]]} color={P.amber} count={3} speed={0.4} size={0.05} lineOpacity={0.45} />
        ) : null}
        {chars > HOOK_CAP ? <Flow points={[[STATIONS.preLlm, RAIL_Y2 + 0.4, RAIL_Z - 0.4], [-1.6, -0.3, 0.85], [-1.75, -0.45, 1.35]]} color={P.amber} count={2} speed={0.35} size={0.04} lineOpacity={0.35} /> : null}
        <Station x={STATIONS.llm} label="llamada al modelo" color={mixHex(P.paper, P.violet, 0.3)} size={[1.2, 1.0, 1.0]} tone="ink" />
        <Gate action={action} />
        <Station x={STATIONS.tool} label={m.toolRuns ? "tool corre" : "tool no corre"} color={m.toolRuns ? mixHex(P.paper, P.teal, 0.35) : mixHex(P.paper, P.inkSoft, 0.15)} size={[1.0, 0.8, 1.0]} tone={m.toolRuns ? "teal" : "ink"} />
        <Sensor x={STATIONS.postTool} label="post_tool_call" />
        <TurnBead key={action} blocked={!m.toolRuns} />
        {!m.toolRuns ? <Halo position={[STATIONS.preTool, RAIL_Y2 + 0.02, RAIL_Z]} radius={0.5} color={P.rose} opacity={0.7} spin={0.4} /> : null}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [chars, setChars] = useState(6_000);
  const [action, setAction] = useState<ToolAction>("none");
  const [at, setAt] = useState<InjectAt>("user");
  const m = hookModel(chars, action, at);
  return (
    <Figure
      label="Hooks de Hermes · observan casi todos, dirigen dos"
      hint="pre_llm_call inyecta · pre_tool_call decide"
      legend={[
        { color: P.amber, label: "inyección de contexto" },
        { color: P.teal, label: "system cacheado / aprobado" },
        { color: P.violet, label: "observador" },
        { color: P.rose, label: "bloqueo / caché rota" },
      ]}
      note={
        <div className="space-y-2">
          <p>
            <strong>{at === "user" ? "La inyección va al mensaje de usuario." : "Hipótesis: si fuera al system prompt."}</strong>{" "}
            {at === "user"
              ? "El prefijo cacheado (system) queda idéntico entre turnos, así que la caché de prompt sigue sirviendo."
              : "El prefijo cambia en cada turno y la caché ya no coincide. Hermes no lo hace así precisamente por esto."}{" "}
            {m.overflow > 0 ? `El hook devuelve ${ES_N.format(chars)} caracteres: entran ${ES_N.format(HOOK_CAP)} y ${ES_N.format(m.overflow)} van a hook_outputs/.` : ""}{" "}
            {action === "block" ? "pre_tool_call devolvió block: la tool no se ejecuta y el turno sigue sin ella." : action === "approve" ? "pre_tool_call devolvió approve: la llamada se aprueba sin preguntar." : "pre_tool_call no devuelve nada: la llamada sigue el flujo normal de aprobación. post_tool_call solo observa; su retorno se ignora."}
          </p>
          <Readout items={[
            { label: "inyectado", value: `${ES_N.format(m.injected)} car. ≈ ${ES_N.format(m.injectedTokens)} tokens`, tone: "var(--amber)" },
            { label: "a hook_outputs/", value: `${ES_N.format(m.overflow)} car.`, tone: "var(--amber)" },
            { label: "prefijo en caché", value: m.cacheIntact ? `${ES_N.format(SYSTEM_TOK)} tokens reutilizados` : "0 tokens (invalidado)", tone: m.cacheIntact ? "var(--teal)" : "var(--rose)" },
            { label: "tool", value: m.approval, tone: m.toolRuns ? "var(--teal)" : "var(--rose)" },
          ]} />
          <p className="text-xs text-muted">Tope de 10 000 caracteres por hook y destino del overflow: guía oficial. Tamaño del system (2 400 tokens) y 4 caracteres por token: cifras didácticas. Un hook que se estrella se registra y se salta; el resto sigue.</p>
        </div>
      }
      controls={
        <>
          <Knob label="contexto del hook" min={0} max={20_000} step={1_000} value={chars} onChange={setChars} format={(v) => `${ES_N.format(v)} car.`} tone={P.amber} />
          <Switcher value={at} onChange={setAt} options={[{ value: "user", label: "Al usuario", tone: P.teal }, { value: "system", label: "Al system (hipótesis)", tone: P.rose }]} ariaLabel="Destino de la inyección" />
          <Switcher value={action} onChange={setAction} options={[{ value: "none", label: "Sin acción", tone: P.amber }, { value: "block", label: "block", tone: P.rose }, { value: "approve", label: "approve", tone: P.teal }]} ariaLabel="Retorno de pre_tool_call" />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.2, 2.5, 10.5], fov: 34 }} fit={1.0}>
        <HookBench chars={chars} action={action} at={at} />
      </Stage>
    </Figure>
  );
}
