"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { MathUtils, type Mesh } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
type Mode="perceive"|"actions"|"sandbox";
const COPY={en:{label:"browser use is perceive → act",hint:"perceive · actions · sandbox",perceive:"perceive",actions:"actions",sandbox:"sandbox",screenshot:"screenshot",model:"model",click:"click",type:"type",scroll:"scroll",isolated:"isolated"},es:{label:"usar navegador es percibir → actuar",hint:"percibe · acciones · sandbox",perceive:"percibe",actions:"acciones",sandbox:"sandbox",screenshot:"captura",model:"modelo",click:"click",type:"escribe",scroll:"scroll",isolated:"aislado"}};
export default function Visual(){return useLocale()==="es"?<SpanishVisual/>:<LegacyVisual/>;}
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("perceive");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.perceive},{color:P.violet,label:t.actions},{color:P.rose,label:t.sandbox}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"perceive",label:t.perceive,tone:P.teal},{value:"actions",label:t.actions,tone:P.violet},{value:"sandbox",label:t.sandbox,tone:P.rose}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="perceive"&&<><Slab position={[-1.8,.5,0]} size={[2.2,1.3,.14]} color={P.teal} fill={.2}/><Tag position={[-1.8,1.35,.15]} tone="teal">{t.screenshot}</Tag><Ribbon points={[[-.7,.5,0],[.3,.5,0]]} color={P.teal} radius={.05} opacity={.85}/><Node3D position={[1.2,.5,0]} color={P.violet} radius={.22} pulse={.35}/><Tag position={[1.2,1.05,.15]} tone="violet">{t.model}</Tag></>}
{mode==="actions"&&<><Slab position={[0,-.5,0]} size={[3.5,.7,.14]} color={P.muted} fill={.15}/><Tag position={[0,-1,.15]} tone="muted">page</Tag>{[[t.click,P.teal,-1.8],[t.type,P.violet,0],[t.scroll,P.amber,1.8]].map(([lab,col,x],i)=><group key={lab as string}><Node3D position={[x as number,1,0]} color={col as string} radius={.17} pulse={.3}/><Tag position={[x as number,1.45,.15]} tone={(["teal","violet","amber"] as const)[i]} size="xs">{lab as string}</Tag><Ribbon points={[[x as number,.7,0],[x as number,-.1,0]]} color={col as string} radius={.03} opacity={.75}/></group>)}</>}
{mode==="sandbox"&&<><Halo position={[0,.4,0]} radius={1.8} color={P.rose} opacity={.42} spin={.1}/><Slab position={[0,.4,0]} size={[2.8,1.7,.14]} color={P.teal} fill={.16} rim={.7}/><Tag position={[0,1.45,.15]} tone="teal">{t.isolated}</Tag><Node3D position={[0,.4,.2]} color={P.amber} radius={.2} pulse={.3}/><Tag position={[0,-.75,.15]} tone="rose" size="xs">host fuera del halo: deny</Tag></>}
</PointerTilt></Stage></Figure>}

/* ------------------------------------------------------------------ ES */

/*
 * Dos decisiones del supervisor, medidas con la misma regla.
 * «Salida»: qué forma de la página se pega al contexto. La pila de hojas
 * de la izquierda y el depósito de la derecha usan la misma escala
 * (TANK_H unidades = ventana de 128 000 tokens), así que una salida que
 * no cabe se ve rebosar. «Destino»: dónde vive el Chromium; la tarea
 * elegida se resuelve con la regla de la lección.
 */

type SpMode = "output" | "target";
type Format = "html" | "ax" | "text" | "shot";
type Task = "static" | "auth" | "debug";
type Target = "sandbox" | "host" | "node";

const WINDOW_TOKENS = 128_000;
const SYSTEM_TOKENS = 3_000;
const HISTORY_TOKENS = 12_000;
const CHARS_PER_TOKEN = 4;
const TANK_H = 3.0;
const TOK_TO_Y = TANK_H / WINDOW_TOKENS;

/* Didactic page sizes; the caps are the lesson's (4k default, 64k for extract_text). */
const FORMATS: Record<Format, { label: string; tag: string; raw: number; cap: number | null; image?: [number, number] }> = {
  html: { label: "HTML completo", tag: "dump_html", raw: 500_000, cap: null },
  ax: { label: "Árbol a11y", tag: "snapshot", raw: 18_400, cap: 4_000 },
  text: { label: "Texto", tag: "extract_text", raw: 22_000, cap: 64_000 },
  shot: { label: "Captura", tag: "screenshot", raw: 0, cap: null, image: [800, 600] },
};

function formatTokens(f: Format) {
  const spec = FORMATS[f];
  if (spec.image) {
    const [w, h] = spec.image;
    // Rule of thumb for vision tokens: width × height / 750.
    return { chars: 0, tokens: Math.round((w * h) / 750), truncated: false };
  }
  const chars = spec.cap ? Math.min(spec.raw, spec.cap) : spec.raw;
  return { chars, tokens: Math.round(chars / CHARS_PER_TOKEN), truncated: spec.cap !== null && spec.raw > spec.cap };
}

const TARGETS: Record<Target, { label: string; state: string; isolation: string; gatewayRam: string; latency: string; cookies: boolean }> = {
  sandbox: { label: "Sandbox", state: "ninguno entre turnos", isolation: "alto: contenedor efímero", gatewayRam: "sí, mientras vive", latency: "arranque en cada turno", cookies: false },
  host: { label: "Host", state: "perfil local opcional", isolation: "bajo: comparte disco y red", gatewayRam: "sí", latency: "la más baja", cookies: false },
  node: { label: "Node", state: "perfil sembrado persistente", isolation: "medio: otra máquina", gatewayRam: "no", latency: "salto de red (Tailscale)", cookies: true },
};

const TASKS: Record<Task, { label: string; target: Target; why: string }> = {
  static: { label: "Doc con JS", target: "sandbox", why: "No hay login: un contenedor limpio basta y se tira al acabar." },
  auth: { label: "Dashboard con login", target: "node", why: "Hacen falta cookies de sesión: el node ya tiene el perfil sembrado tras un login manual." },
  debug: { label: "Depurar en local", target: "host", why: "Velocidad para depurar; a cambio, el navegador comparte disco y red con el gateway. Headless y teardown al cerrar." },
};

const ES = new Intl.NumberFormat("es-ES");

function Mat({ color, rough = 0.45, coat = 0.4, metal = 0 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} />;
}

function Base({ w, d, x = 0, color = "#3a3f44" }: { w: number; d: number; x?: number; color?: string }) {
  return (
    <group position={[x, 0, 0]}>
      <ShadowBlob position={[0, -1.4, 0.1]} scale={w * 1.02} opacity={0.12} />
      <RoundedBox args={[w, 0.3, d]} position={[0, -1.22, 0]} radius={0.14} smoothness={4} castShadow receiveShadow>
        <Mat color={color} rough={0.6} coat={0.2} />
      </RoundedBox>
      <RoundedBox args={[w - 0.3, 0.06, d - 0.3]} position={[0, -1.05, 0]} radius={0.03} smoothness={2} receiveShadow>
        <Mat color={mixHex(color, P.paper, 0.12)} rough={0.55} coat={0.25} />
      </RoundedBox>
    </group>
  );
}

/** A block whose height eases to `h`, sitting on `y0`. */
function Fill({ x, z, y0, h, w, d, color, opacity = 1 }: { x: number; z: number; y0: number; h: number; w: number; d: number; color: string; opacity?: number }) {
  const ref = useRef<Mesh>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const target = Math.max(0.0001, h);
    const next = still ? target : MathUtils.damp(m.scale.y, target, 5, dt);
    m.scale.y = next;
    m.position.y = y0 + next / 2;
  });
  return (
    <mesh ref={ref} position={[x, y0 + h / 2, z]} scale={[1, Math.max(0.0001, h), 1]} castShadow receiveShadow>
      <boxGeometry args={[w, 1, d]} />
      <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.5} clearcoatRoughness={0.25} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function ContextTank({ tool, format }: { tool: number; format: Format }) {
  const x = 1.75;
  const y0 = -1.0;
  const w = 1.5;
  const d = 1.2;
  const sysH = SYSTEM_TOKENS * TOK_TO_Y;
  const histH = HISTORY_TOKENS * TOK_TO_Y;
  const free = WINDOW_TOKENS - SYSTEM_TOKENS - HISTORY_TOKENS;
  const fits = Math.min(tool, free);
  const spill = Math.max(0, tool - free);
  const toolH = fits * TOK_TO_Y;
  const spillH = spill * TOK_TO_Y;
  const top = y0 + TANK_H;
  const ticks = [0, 32_000, 64_000, 96_000, 128_000];
  return (
    <group>
      {/* pedestal */}
      <RoundedBox args={[w + 0.5, 0.14, d + 0.5]} position={[x, y0 - 0.02, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <Mat color="#b68442" rough={0.32} metal={0.55} coat={0.2} />
      </RoundedBox>
      <Fill x={x} z={0} y0={y0 + 0.05} h={sysH} w={w - 0.08} d={d - 0.08} color={P.teal} />
      <Fill x={x} z={0} y0={y0 + 0.05 + sysH} h={histH} w={w - 0.08} d={d - 0.08} color={mixHex(P.paper, P.inkSoft, 0.45)} />
      <Fill x={x} z={0} y0={y0 + 0.05 + sysH + histH} h={toolH} w={w - 0.08} d={d - 0.08} color={format === "shot" ? P.amber : P.violet} />
      {spill > 0 ? <Fill x={x} z={0} y0={top + 0.05} h={spillH} w={w - 0.08} d={d - 0.08} color={P.rose} opacity={0.85} /> : null}
      {/* glass walls */}
      <mesh position={[x, y0 + TANK_H / 2 + 0.05, 0]}>
        <boxGeometry args={[w, TANK_H, d]} />
        <meshPhysicalMaterial color={P.paper} transparent opacity={0.16} roughness={0.08} clearcoat={1} depthWrite={false} />
      </mesh>
      <Wire points={[[x - w / 2, top + 0.05, d / 2], [x + w / 2, top + 0.05, d / 2], [x + w / 2, top + 0.05, -d / 2], [x - w / 2, top + 0.05, -d / 2], [x - w / 2, top + 0.05, d / 2]]} color={P.inkSoft} width={1.4} opacity={0.8} />
      {[[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[x + (sx * w) / 2, y0 + TANK_H / 2 + 0.05, (sz * d) / 2]}>
          <boxGeometry args={[0.04, TANK_H, 0.04]} />
          <Mat color="#9aa3ab" metal={0.6} rough={0.3} coat={0} />
        </mesh>
      ))}
      {ticks.map((t) => (
        <group key={t}>
          <Wire points={[[x - w / 2 - 0.02, y0 + 0.05 + t * TOK_TO_Y, d / 2], [x - w / 2 - 0.16, y0 + 0.05 + t * TOK_TO_Y, d / 2]]} color={P.inkSoft} width={1.2} />
          {t > 0 && t % 64_000 === 0 ? (
            <Tag position={[x - w / 2 - 0.55, y0 + 0.05 + t * TOK_TO_Y, d / 2]} tone="muted" size="xs" center plate={false}>{`${t / 1000}k`}</Tag>
          ) : null}
        </group>
      ))}
      <Tag position={[x, top + 0.45 + spillH, 0]} tone={spill > 0 ? "rose" : "ink"} center>{spill > 0 ? "no cabe" : "ventana 128k"}</Tag>
      <Tag position={[x + w / 2 + 0.55, y0 + 0.05 + sysH / 2, d / 2]} tone="teal" size="xs" center>system</Tag>
      <Tag position={[x + w / 2 + 0.6, y0 + 0.05 + sysH + histH / 2, d / 2]} tone="muted" size="xs" center>historial</Tag>
      {toolH > 0.12 ? <Tag position={[x + w / 2 + 0.55, y0 + 0.05 + sysH + histH + toolH / 2, d / 2]} tone="violet" size="xs" center>salida</Tag> : null}
    </group>
  );
}

function SourceStack({ format, tokens }: { format: Format; tokens: number }) {
  const x = -2.4;
  const y0 = -1.0;
  const h = tokens * TOK_TO_Y;
  const sheets = format === "shot" ? 0 : Math.max(1, Math.round(h / 0.05));
  const cells = useMemo(
    () =>
      Array.from({ length: sheets }, (_, i) => ({
        position: [x + Math.sin(i * 1.7) * 0.03, y0 + 0.04 + i * 0.05, Math.cos(i * 1.3) * 0.03] as V3,
        scale: [1.35, 0.035, 0.95] as V3,
        color: mixHex(P.paper, format === "html" ? P.rose : P.violet, 0.12 + (i % 5) * 0.03),
      })),
    [sheets, format, x, y0],
  );
  const pixels = useMemo(
    () =>
      format === "shot"
        ? Array.from({ length: 48 }, (_, i) => {
            const cx = i % 8;
            const cy = Math.floor(i / 8);
            const tone = cy === 0 ? P.inkSoft : cx < 2 ? P.tealWash : (cx + cy) % 3 === 0 ? P.amberWash : P.surface;
            return { position: [x - 0.61 + cx * 0.175, y0 + 0.62 + (5 - cy) * 0.14, 0.02] as V3, scale: [0.16, 0.125, 0.03] as V3, color: tone };
          })
        : [],
    [format, x, y0],
  );
  return (
    <group>
      <RoundedBox args={[1.9, 0.12, 1.4]} position={[x, y0 - 0.02, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <Mat color={mixHex(P.paper, P.inkSoft, 0.2)} rough={0.5} />
      </RoundedBox>
      {sheets > 0 ? <Lattice cells={cells} size={1} /> : null}
      {format === "shot" ? (
        <group>
          <RoundedBox args={[1.55, 1.05, 0.08]} position={[x, y0 + 0.97, -0.05]} radius={0.04} smoothness={2} castShadow>
            <Mat color="#2a2e33" rough={0.4} />
          </RoundedBox>
          <Lattice cells={pixels} size={1} />
          <mesh position={[x, y0 + 0.2, -0.3]} rotation={[0.35, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 0.8, 0.08]} />
            <Mat color="#9aa3ab" metal={0.6} rough={0.35} coat={0} />
          </mesh>
        </group>
      ) : null}
      <Tag position={[x, y0 + Math.max(h, format === "shot" ? 1.5 : 0.1) + 0.4, 0]} tone={format === "html" ? "rose" : "violet"} center>
        <span className="normal-case">{FORMATS[format].tag}</span>
      </Tag>
    </group>
  );
}

function OutputScene({ format }: { format: Format }) {
  const { tokens } = formatTokens(format);
  return (
    <PointerTilt amount={0.05}>
      <group>
        <Base w={7.4} d={3.0} x={-0.3} />
        <SourceStack format={format} tokens={tokens} />
        <Flow points={[[-1.3, -0.55, 0.3], [-0.3, -0.25, 0.45], [0.8, -0.55, 0.3]]} color={format === "html" ? P.rose : P.violet} count={3} speed={0.35} size={0.05} lineOpacity={0.35} />
        <ContextTank tool={tokens} format={format} />
      </group>
    </PointerTilt>
  );
}

function MiniChromium({ position, active, color }: { position: V3; active: boolean; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.26, -0.12]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.55, 0.08]} />
        <Mat color="#9aa3ab" metal={0.6} rough={0.35} coat={0} />
      </mesh>
      <group position={[0, 0.62, 0]} rotation={[-0.14, 0, 0]}>
        <RoundedBox args={[1.2, 0.8, 0.1]} radius={0.05} smoothness={3} castShadow receiveShadow>
          <Mat color="#2a2e33" rough={0.4} coat={0.5} />
        </RoundedBox>
        <mesh position={[0, -0.05, 0.052]}>
          <planeGeometry args={[1.08, 0.58]} />
          <meshStandardMaterial color={active ? mixHex(P.paper, color, 0.18) : "#e9e6de"} roughness={0.6} />
        </mesh>
        {[P.rose, P.amber, P.teal].map((c, i) => (
          <mesh key={c} position={[-0.5 + i * 0.07, 0.31, 0.056]}>
            <circleGeometry args={[0.02, 12]} />
            <meshBasicMaterial color={c} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function TargetScene({ task }: { task: Task }) {
  const chosen = TASKS[task].target;
  const gw: V3 = [-3.0, -1.02, 0.1];
  const pods: Record<Target, V3> = { sandbox: [-1.05, -1.02, -0.55], host: [0.75, -1.02, 0.55], node: [3.75, -1.02, 0] };
  const tone = (t: Target) => (t === "sandbox" ? P.teal : t === "host" ? P.amber : P.violet);
  return (
    <PointerTilt amount={0.05}>
      <group>
        <Base w={6.0} d={3.0} x={-1.0} />
        <Base w={2.4} d={2.2} x={3.75} color="#45403a" />
        {/* gateway core */}
        <group position={gw}>
          <RoundedBox args={[1.1, 0.9, 1.1]} position={[0, 0.45, 0]} radius={0.08} smoothness={3} castShadow receiveShadow>
            <Mat color={mixHex(P.paper, P.inkSoft, 0.25)} rough={0.45} />
          </RoundedBox>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.2 + i * 0.22, 0.56]}>
              <boxGeometry args={[0.8, 0.06, 0.01]} />
              <meshBasicMaterial color={i === 1 ? P.teal : P.lineStrong} />
            </mesh>
          ))}
          <Tag position={[0, 1.25, 0]} tone="ink" center>gateway</Tag>
        </group>
        {/* shared disk plate between gateway and host: what "host" shares */}
        <RoundedBox args={[3.2, 0.03, 0.5]} position={[-1.2, -0.99, 1.05]} radius={0.01} smoothness={2} receiveShadow>
          <Mat color={mixHex(P.paper, P.amber, chosen === "host" ? 0.45 : 0.18)} rough={0.6} coat={0.1} />
        </RoundedBox>
        <Tag position={[-1.6, -0.85, 1.35]} tone="amber" size="xs" center>disco y red</Tag>
        {/* sandbox: a glass container around its browser */}
        <group>
          <mesh position={[pods.sandbox[0], pods.sandbox[1] + 0.62, pods.sandbox[2]]}>
            <boxGeometry args={[1.6, 1.24, 1.1]} />
            <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.3)} transparent opacity={chosen === "sandbox" ? 0.26 : 0.14} roughness={0.1} clearcoat={1} depthWrite={false} />
          </mesh>
          <Wire points={[[pods.sandbox[0] - 0.8, pods.sandbox[1] + 1.24, pods.sandbox[2] + 0.55], [pods.sandbox[0] + 0.8, pods.sandbox[1] + 1.24, pods.sandbox[2] + 0.55], [pods.sandbox[0] + 0.8, pods.sandbox[1] + 0.01, pods.sandbox[2] + 0.55], [pods.sandbox[0] - 0.8, pods.sandbox[1] + 0.01, pods.sandbox[2] + 0.55], [pods.sandbox[0] - 0.8, pods.sandbox[1] + 1.24, pods.sandbox[2] + 0.55]]} color={P.teal} width={1.6} opacity={0.8} dashed />
          <MiniChromium position={pods.sandbox} active={chosen === "sandbox"} color={P.teal} />
        </group>
        <MiniChromium position={pods.host} active={chosen === "host"} color={P.amber} />
        {/* node: separate machine with a seeded profile (cookie jar) */}
        <MiniChromium position={[pods.node[0] - 0.3, pods.node[1], pods.node[2]]} active={chosen === "node"} color={P.violet} />
        <group position={[pods.node[0] + 0.7, pods.node[1], pods.node[2] + 0.35]}>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.44, 28]} />
            <meshPhysicalMaterial color={mixHex(P.paper, P.amber, 0.25)} transparent opacity={0.6} roughness={0.1} clearcoat={1} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.sin(i * 2.1) * 0.07, 0.08 + i * 0.1, Math.cos(i * 2.1) * 0.07]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.03, 18]} />
              <Mat color={P.amber} rough={0.6} coat={0.1} />
            </mesh>
          ))}
          <mesh position={[0, 0.47, 0]}>
            <cylinderGeometry args={[0.21, 0.21, 0.06, 28]} />
            <Mat color={P.amberDeep} rough={0.4} />
          </mesh>
          <Tag position={[0, 0.8, 0]} tone="amber" size="xs" center>cookies</Tag>
        </group>
        <Ribbon points={[[-2.9, -0.3, -0.45], [-1.0, 0.85, -1.45], [2.0, 0.7, -1.0], [pods.node[0] - 0.9, -0.8, -0.1]]} color={mixHex(P.inkSoft, P.violet, 0.3)} radius={0.035} />
        <Tag position={[0.5, 1.12, -1.35]} tone="violet" size="xs" center>Tailscale</Tag>
        {/* the live route for the chosen task */}
        <Flow
          points={chosen === "node" ? [[-2.9, -0.17, -0.45], [-1.0, 0.98, -1.45], [2.0, 0.83, -1.0], [pods.node[0] - 0.9, -0.67, -0.1]] : chosen === "sandbox" ? [[-2.45, -0.6, 0.1], [-1.8, -0.35, -0.3], [-1.05, -0.15, -0.55]] : [[-2.45, -0.6, 0.3], [-0.8, -0.4, 0.7], [0.75, -0.2, 0.55]]}
          color={tone(chosen)}
          count={3}
          speed={0.4}
          size={0.05}
          lineOpacity={0.5}
        />
        {(Object.keys(pods) as Target[]).map((t) => (
          <group key={t}>
            <Tag position={[pods[t][0] - (t === "node" ? 0.3 : 0), pods[t][1] + (t === "sandbox" ? 1.6 : 1.4), pods[t][2]]} tone={t === chosen ? (t === "sandbox" ? "teal" : t === "host" ? "amber" : "violet") : "muted"} center>
              {TARGETS[t].label}
            </Tag>
            {t === chosen ? <Halo position={[pods[t][0] - (t === "node" ? 0.3 : 0), pods[t][1] + 0.02, pods[t][2]]} radius={0.85} color={tone(t)} opacity={0.7} spin={0.3} /> : null}
          </group>
        ))}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<SpMode>("output");
  const [format, setFormat] = useState<Format>("ax");
  const [task, setTask] = useState<Task>("auth");
  const out = formatTokens(format);
  const used = SYSTEM_TOKENS + HISTORY_TOKENS + out.tokens;
  const spec = FORMATS[format];
  const chosen = TASKS[task].target;

  const note =
    mode === "output" ? (
      <div className="space-y-2">
        <p>
          <strong>{spec.label}.</strong>{" "}
          {format === "html"
            ? "El DOM completo entra tal cual: medio millón de caracteres no caben junto al system y el historial. Es el tercer error común de la lección."
            : format === "ax"
              ? `El árbol de accesibilidad describe roles y textos sin el marcado. Tiene ${ES.format(spec.raw)} caracteres y se recorta al tope por defecto de ${ES.format(spec.cap ?? 0)}.`
              : format === "text"
                ? `extract_text tiene un tope más alto (${ES.format(spec.cap ?? 0)} caracteres). Esta página cabe entera: ${ES.format(spec.raw)} caracteres.`
                : "Una captura de 800 × 600 cuesta tokens de imagen, no de texto. Acotar el tamaño es uno de los cinco tests del supervisor."}
        </p>
        <Readout items={[
          { label: "salida", value: spec.image ? `${spec.image[0]}×${spec.image[1]} px` : `${ES.format(out.chars)} car.${out.truncated ? " (recortado)" : ""}`, tone: "var(--violet)" },
          { label: "tokens", value: `≈ ${ES.format(out.tokens)}`, tone: "var(--violet)" },
          { label: "ventana usada", value: `${ES.format(used)} / ${ES.format(WINDOW_TOKENS)} (${Math.round((used / WINDOW_TOKENS) * 100)} %)`, tone: used > WINDOW_TOKENS ? "var(--rose)" : "var(--ink)" },
          { label: "exceso", value: used > WINDOW_TOKENS ? `${ES.format(used - WINDOW_TOKENS)} tokens` : "0", tone: used > WINDOW_TOKENS ? "var(--rose)" : "var(--teal)" },
        ]} />
        <p className="text-xs text-muted">Modelo didáctico: system de {ES.format(SYSTEM_TOKENS)} tokens, historial de {ES.format(HISTORY_TOKENS)}, 4 caracteres por token y, para imágenes, ancho × alto / 750. Los tamaños de la página son inventados; los topes (4k y 64k) son los de la lección. La pila y el depósito usan la misma escala vertical.</p>
      </div>
    ) : (
      <div className="space-y-2">
        <p><strong>{TASKS[task].label} → {TARGETS[chosen].label}.</strong> {TASKS[task].why}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-left text-xs">
            <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted">
              <tr><th className="border-b border-line px-2 py-1">destino</th><th className="border-b border-line px-2 py-1">estado</th><th className="border-b border-line px-2 py-1">aislamiento</th><th className="border-b border-line px-2 py-1">RAM del gateway</th><th className="border-b border-line px-2 py-1">latencia</th></tr>
            </thead>
            <tbody>
              {(Object.keys(TARGETS) as Target[]).map((t) => (
                <tr key={t} className={t === chosen ? "text-ink" : "text-muted"}>
                  <td className="border-b border-line/60 px-2 py-1 font-mono">{t === chosen ? "▸ " : ""}{TARGETS[t].label}</td>
                  <td className="border-b border-line/60 px-2 py-1">{TARGETS[t].state}</td>
                  <td className="border-b border-line/60 px-2 py-1">{TARGETS[t].isolation}</td>
                  <td className="border-b border-line/60 px-2 py-1">{TARGETS[t].gatewayRam}</td>
                  <td className="border-b border-line/60 px-2 py-1">{TARGETS[t].latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">OpenClaw lo elige por tool call (<code>target: &quot;sandbox&quot; | &quot;host&quot; | &quot;node:…&quot;</code>); Hermes, por configuración del supervisor. En cualquiera: headless por defecto y teardown tras 5 minutos sin actividad.</p>
      </div>
    );

  return (
    <Figure
      label="Supervisor del navegador · qué entra al contexto y dónde corre"
      hint={mode === "output" ? "misma escala para la salida y la ventana" : "la tarea decide el destino"}
      legend={mode === "output"
        ? [{ color: P.teal, label: "system" }, { color: P.inkSoft, label: "historial" }, { color: P.violet, label: "salida de la tool" }, { color: P.rose, label: "no cabe" }]
        : [{ color: P.teal, label: "sandbox" }, { color: P.amber, label: "host" }, { color: P.violet, label: "node" }]}
      note={note}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} options={[{ value: "output", label: "Salida", tone: P.violet }, { value: "target", label: "Destino", tone: P.teal }]} ariaLabel="Vista de la lámina" />
          {mode === "output" ? (
            <Switcher value={format} onChange={setFormat} options={(Object.keys(FORMATS) as Format[]).map((f) => ({ value: f, label: FORMATS[f].label, tone: f === "html" ? P.rose : P.violet }))} ariaLabel="Formato de salida" />
          ) : (
            <Switcher value={task} onChange={setTask} options={(Object.keys(TASKS) as Task[]).map((k) => ({ value: k, label: TASKS[k].label, tone: P.teal }))} ariaLabel="Tarea del agente" />
          )}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.8, 3.0, 10.5], fov: 34 }} fit={1.06}>
        {mode === "output" ? <OutputScene format={format} /> : <TargetScene task={task} />}
      </Stage>
    </Figure>
  );
}
