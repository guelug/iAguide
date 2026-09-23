"use client";
import { useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import type { Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, useCycle } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
type Mode = "resolver" | "fallback" | "modes";
const COPY = { en: { label: "a model string is a routing decision", hint: "resolver · fallback · modes", resolver: "resolver", fallback: "fallback", modes: "modes", model: "model", provider: "provider", url: "url", primary: "primary", backup: "backup", api: "api", chat: "chat", completions: "completions" }, es: { label: "un modelo es una decisión de routing", hint: "resolver · fallback · modos", resolver: "resuelve", fallback: "fallback", modes: "modos", model: "modelo", provider: "proveedor", url: "url", primary: "primario", backup: "reserva", api: "api", chat: "chat", completions: "completions" } };
function LegacyVisual() { const t = useCopy(COPY); const [mode,setMode]=useState<Mode>("resolver"); return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.model},{color:P.violet,label:t.provider},{color:P.amber,label:t.url}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"resolver",label:t.resolver,tone:P.teal},{value:"fallback",label:t.fallback,tone:P.rose},{value:"modes",label:t.modes,tone:P.amber}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="resolver"&&<>{[[t.model,P.teal,-2],[t.provider,P.violet,0],[t.url,P.amber,2]].map(([lab,col,x],i)=><group key={lab as string}><Slab position={[x as number,.5,0]} size={[1.5,.8,.12]} color={col as string} fill={.22}/><Tag position={[x as number,1.05,.15]} tone={(i===0?"teal":i===1?"violet":"amber")} size="xs">{lab as string}</Tag>{i<2&&<Ribbon points={[[x as number,.5,0], [(x as number)+.8,.5,0]]} color={col as string} radius={.04} opacity={.8}/>}</group>)}</>}
{mode==="fallback"&&<><Slab position={[-1.8,.5,0]} size={[1.7,1,.14]} color={P.rose} fill={.25}/><Tag position={[-1.8,1.15,.15]} tone="rose">{t.primary}</Tag><Ribbon points={[[-.8,.5,0],[.5,.5,0]]} color={P.violet} radius={.05} opacity={.85}/><Slab position={[1.5,.5,0]} size={[1.7,1,.14]} color={P.violet} fill={.25}/><Tag position={[1.5,1.15,.15]} tone="violet">{t.backup}</Tag><Halo position={[0,.5,0]} radius={.55} color={P.amber} opacity={.55} spin={.2}/><Tag position={[0,-.35,.15]} tone="amber" size="xs">retry → next provider</Tag></>}
{mode==="modes"&&<>{[t.api,t.chat,t.completions].map((lab,i)=><group key={lab}><Slab position={[-2+i*2,.5,0]} size={[1.5,1,.12]} color={[P.teal,P.violet,P.amber][i]} fill={.24}/><Tag position={[-2+i*2,1.15,.15]} tone={(["teal","violet","amber"] as const)[i]} size="xs">{lab}</Tag></group>)}<Node3D position={[0,-.8,0]} color={P.teal} radius={.2} pulse={.3}/><Tag position={[0,-1.3,.15]} tone="muted" size="xs">same intent · different protocol</Tag></>}
</PointerTilt></Stage></Figure> }


export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * Cadena de fallback y subagentes. Vía de arriba: la sesión padre, con su
 * lista fallback_providers enlazada entre estaciones. Vía de abajo: un hijo
 * creado con delegate_task, que arranca en el proveedor vivo del padre pero
 * sin la cadena. El estado sale de simulate(); los reintentos son didácticos.
 */

type PrimaryError = "none" | "429" | "401";
type ChildCase = "none" | "spawn" | "child429";

const FB = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };
const CHAIN = [
  { id: "anthropic", label: "anthropic", role: "primario", color: P.amber },
  { id: "openrouter", label: "openrouter", role: "fallback 1", color: P.teal },
  { id: "nous", label: "nous", role: "fallback 2", color: P.violet },
];
const SX = [-3.0, 0.1, 3.2];
const MAX_RETRIES = 3; // didáctico: el número real depende de la configuración del bucle
const Z_PARENT = -0.75;
const Z_CHILD = 1.25;

function simulate(err: PrimaryError, child: ChildCase) {
  const activated = err !== "none";
  const parentAt = activated ? 1 : 0;
  const retries = err === "429" ? MAX_RETRIES : 0;
  const spawned = child !== "none";
  const childAt = parentAt;
  const childFails = child === "child429";
  return { activated, parentAt, retries, spawned, childAt, childFails };
}

function FMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

function Station({ i, z, ghost, down, low = false }: { i: number; z: number; ghost: boolean; down: boolean; low?: boolean }) {
  const c = CHAIN[i];
  return (
    <group position={[SX[i], 0, z]}>
      <RoundedBox position={[0, -0.45, 0]} args={[1.5, 0.18, 1.0]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <FMat color={ghost ? "#D7D3CA" : FB.ceramic} rough={0.55} clear={0.25} />
      </RoundedBox>
      {ghost ? null : (
        <RoundedBox position={[0, low ? -0.12 : 0.0, -0.36]} args={[1.3, low ? 0.46 : 0.72, 0.14]} radius={0.05} smoothness={3} castShadow receiveShadow>
          <FMat color={down ? mixHex(P.paper, P.rose, 0.4) : mixHex(P.paper, c.color, 0.38)} clear={0.55} />
        </RoundedBox>
      )}
      {!ghost ? <Tag position={[0, low ? 0.28 : 0.55, -0.36]} tone={down ? "rose" : c.color === P.amber ? "amber" : c.color === P.teal ? "teal" : "violet"} size="xs" center>{c.label}</Tag> : null}
    </group>
  );
}

function Carriage({ x, z, color, failed }: { x: number; z: number; color: string; failed: boolean }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = still ? 1 : Math.min(1, dt * 2.6);
    g.position.x += (x - g.position.x) * k;
    g.position.z += (z - g.position.z) * k;
    g.rotation.z = failed ? -0.22 : 0;
  });
  return (
    <group ref={ref} position={[x, -0.12, z]}>
      <RoundedBox args={[0.8, 0.42, 0.55]} radius={0.1} smoothness={3} castShadow>
        <FMat color={failed ? P.rose : color} clear={0.6} />
      </RoundedBox>
      {[-0.26, 0.26].map((wx) => (
        <mesh key={wx} position={[wx, -0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
          <meshStandardMaterial color={FB.graphite} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function RetryDots({ count }: { count: number }) {
  const [i] = useCycle(count + 2, 0.7);
  const { still } = useStage();
  const lit = still ? count : Math.min(i, count);
  return (
    <group position={[SX[0] - 0.28, -0.3, Z_PARENT + 0.45]}>
      {Array.from({ length: count }, (_, k) => (
        <mesh key={k} position={[k * 0.28, 0, 0]}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshStandardMaterial color={k < lit ? P.rose : FB.steel} emissive={k < lit ? P.rose : "#000"} emissiveIntensity={k < lit ? 0.4 : 0} />
        </mesh>
      ))}
    </group>
  );
}

function FallbackBench({ err, child }: { err: PrimaryError; child: ChildCase }) {
  const st = simulate(err, child);
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0.2, 0]}>
        <ShadowBlob position={[0, -0.98, 0.3]} scale={10} opacity={0.12} />
        <RoundedBox position={[0, -0.78, 0.25]} args={[9.6, 0.38, 3.5]} radius={0.17} smoothness={4} castShadow receiveShadow>
          <FMat color={FB.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.55, 0.25]} args={[9.25, 0.1, 3.2]} radius={0.05} smoothness={3} receiveShadow>
          <FMat color={FB.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        {/* raíles */}
        {[Z_PARENT, Z_CHILD].map((z) => [-0.22, 0.22].map((dz) => (
          <mesh key={z + ":" + dz} position={[0, -0.33, z + dz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 8.6, 10]} />
            <meshStandardMaterial color={FB.steel} metalness={0.8} roughness={0.3} />
          </mesh>
        )))}
        {CHAIN.map((_, i) => (
          <Station key={"p" + i} i={i} z={Z_PARENT} ghost={false} down={i === 0 && st.activated} />
        ))}
        {/* la cadena del padre: eslabones de latón entre estaciones */}
        {[0, 1].map((i) => (
          <mesh key={"l" + i} position={[(SX[i] + SX[i + 1]) / 2, 0.15, Z_PARENT - 0.36]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, SX[i + 1] - SX[i] - 1.3, 12]} />
            <meshStandardMaterial color={FB.brass} metalness={0.75} roughness={0.28} />
          </mesh>
        ))}
        <Tag position={[-4.55, 0.6, Z_PARENT]} tone="violet" center>padre</Tag>
        {st.retries ? <RetryDots count={st.retries} /> : null}
        <Carriage x={SX[st.parentAt]} z={Z_PARENT + 0.2} color={mixHex(P.paper, P.violet, 0.55)} failed={false} />
        {st.activated ? <Arrow from={[SX[0] + 0.5, 0.35, Z_PARENT + 0.25]} to={[SX[1] - 0.5, 0.35, Z_PARENT + 0.25]} color={P.violet} width={1.8} head={0.1} bow={0.35} /> : null}
        {st.activated ? <Tag position={[(SX[0] + SX[1]) / 2, 1.0, Z_PARENT]} tone="violet" size="xs" center>un disparo</Tag> : null}

        {st.spawned ? (
          <>
            {CHAIN.map((_, i) => (
              <Station key={"c" + i} i={i} z={Z_CHILD} ghost={i !== st.childAt} down={false} low />
            ))}
            <Tag position={[-4.55, 0.35, Z_CHILD]} tone="amber" center>hijo</Tag>
            <Arrow from={[SX[st.parentAt] - 0.55, 0.0, Z_PARENT + 0.5]} to={[SX[st.childAt] - 0.55, 0.0, Z_CHILD - 0.3]} color={P.amber} width={1.5} head={0.09} dashed />
            <Carriage x={SX[st.childAt] + (st.childFails ? 0.2 : 0)} z={Z_CHILD + 0.2} color={mixHex(P.paper, P.amber, 0.55)} failed={st.childFails} />
            {st.childFails ? <Tag position={[SX[st.childAt] + 1.3, 0.3, Z_CHILD + 0.3]} tone="rose" size="xs">429 · sin cadena</Tag> : <Tag position={[SX[st.childAt] + 1.2, 0.3, Z_CHILD + 0.3]} tone="amber" size="xs">proveedor heredado</Tag>}
          </>
        ) : null}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [err, setErr] = useState<PrimaryError>("429");
  const [child, setChild] = useState<ChildCase>("child429");
  const st = simulate(err, child);
  const live = CHAIN[st.parentAt].label;
  return (
    <Figure
      label="Fallback y subagentes · la cadena no se hereda"
      hint="padre con fallback_providers · hijo con el proveedor vivo"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.violet, label: "sesión padre" },
        { color: P.amber, label: "subagente (delegate_task)" },
        { color: FB.brass, label: "cadena fallback_providers" },
        { color: P.rose, label: "error" },
      ]}
      controls={
        <>
          <Switcher value={err} onChange={setErr} ariaLabel="Error del primario" options={[{ value: "none", label: "Sin error", tone: P.teal }, { value: "429", label: "429 persistente", tone: P.rose }, { value: "401", label: "401", tone: P.rose }]} />
          <Switcher value={child} onChange={setChild} ariaLabel="Subagente" options={[{ value: "none", label: "Sin hijo", tone: P.inkSoft }, { value: "spawn", label: "delegate_task", tone: P.amber }, { value: "child429", label: "Hijo recibe 429", tone: P.rose }]} />
        </>
      }
      note={
        <div className="space-y-3">
          <p>
            {err === "none" ? (
              <><strong>El padre sigue en anthropic.</strong> Sin errores no hay fallback: la lista existe, pero nadie la recorre.</>
            ) : err === "429" ? (
              <><strong>429 transitorio:</strong> el bucle reintenta hasta el máximo ({MAX_RETRIES} en esta maqueta) y entonces <code>_try_activate_fallback()</code> intercambia model, provider, base_url, api_mode y cliente in situ: el padre pasa a {live}. La activación es de un disparo por sesión.</>
            ) : (
              <><strong>401 no es reintentable:</strong> el fallback dispara sin agotar reintentos y el padre pasa a {live}. La caché de prompt se reevalúa: otra cuenta, otra clave de caché.</>
            )}
          </p>
          <p>
            {child === "none"
              ? "Sin subagentes, la cadena solo afecta a esta sesión."
              : child === "spawn"
                ? `delegate_task crea un hijo que arranca en ${live}, el proveedor vivo del padre, pero sin fallback_providers.`
                : `El hijo arranca en ${live} y recibe su propio 429: no recorre la lista del padre y el error sube como resultado de la delegación. El aislamiento es la feature.`}
          </p>
          <Readout items={[{ label: "padre en", value: live, tone: "var(--violet)" }, { label: "_fallback_activated", value: st.activated ? "true" : "false", tone: "var(--violet)" }, { label: "cadena del hijo", value: st.spawned ? "vacía" : "—", tone: "var(--amber)" }]} />
          <p className="text-xs text-muted">Proveedores de la cadena y número de reintentos son de ejemplo. Los jobs de cron sí leen fallback_providers; las tareas auxiliares usan su propia auto-detección. No lo “arregles” copiando _fallback_activated al hijo.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.0, 6.0, 9.2], fov: 34 }} fit={1.08}>
        <FallbackBench err={err} child={child} />
      </Stage>
    </Figure>
  );
}
