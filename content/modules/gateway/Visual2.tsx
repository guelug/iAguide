"use client";
import { useMemo, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import type { Group } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, useCycle, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
type Mode="surfaces"|"session"|"stream";
const COPY={en:{label:"a gateway turns surfaces into sessions",hint:"surfaces · session · stream",surfaces:"surfaces",session:"session",stream:"stream",web:"web",mobile:"mobile",telegram:"telegram",whatsapp:"whatsapp",id:"session id",chunks:"chunks"},es:{label:"un gateway convierte superficies en sesiones",hint:"superficies · sesión · stream",surfaces:"superficies",session:"sesión",stream:"stream",web:"web",mobile:"móvil",telegram:"telegram",whatsapp:"whatsapp",id:"id de sesión",chunks:"trozos"}};
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("surfaces");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.web},{color:P.violet,label:t.session},{color:P.amber,label:t.stream}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"surfaces",label:t.surfaces,tone:P.teal},{value:"session",label:t.session,tone:P.violet},{value:"stream",label:t.stream,tone:P.amber}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="surfaces"&&<>{[[t.web,P.teal,-2],[t.mobile,P.violet,-.7],[t.telegram,P.amber,.7],[t.whatsapp,P.rose,2]].map(([lab,col,x],i)=><group key={lab as string}><Node3D position={[x as number,1,0]} color={col as string} radius={.17} pulse={.2}/><Tag position={[x as number,1.45,.15]} tone={(["teal","violet","amber","rose"] as const)[i]} size="xs">{lab as string}</Tag><Ribbon points={[[x as number,.7,0],[0,.1,0]]} color={col as string} radius={.03} opacity={.7}/></group>)}<Slab position={[0,-.5,0]} size={[2.2,.8,.14]} color={P.teal} fill={.25} rim={.7}/><Tag position={[0,-1.05,.15]} tone="teal">gateway</Tag></>}
{mode==="session"&&<><Slab position={[-2,.5,0]} size={[1.8,.8,.12]} color={P.teal} fill={.22}/><Tag position={[-2,1.05,.15]} tone="teal">message</Tag><Ribbon points={[[-1,.5,0],[.3,.5,0]]} color={P.violet} radius={.05} opacity={.85}/><Node3D position={[1.1,.5,0]} color={P.violet} radius={.23} pulse={.35}/><Tag position={[1.1,1.05,.15]} tone="violet">{t.id}</Tag><Ribbon points={[[1.35,.5,0],[2.5,.5,0]]} color={P.lineStrong} radius={.04} opacity={.8}/></>}
{mode==="stream"&&<><Slab position={[-2,.5,0]} size={[1.5,.8,.12]} color={P.violet} fill={.22}/><Tag position={[-2,1.05,.15]} tone="violet">gateway</Tag>{[0,1,2,3].map(i=><Ribbon key={i} points={[[-1.2,.8-i*.2,0],[2.2,.8-i*.2,0]]} color={P.amber} radius={.035} opacity={.8}/>) }<Slab position={[2.5,.5,0]} size={[1.2,.8,.12]} color={P.teal} fill={.22}/><Tag position={[2.5,1.05,.15]} tone="teal">surface</Tag><Tag position={[.5,-.6,.15]} tone="amber" size="xs">SSE · {t.chunks}</Tag></>}
</PointerTilt></Stage></Figure>}


export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * Entrega con reintentos. La plataforma cae D segundos; el gateway intenta
 * en t = 0 y luego espera 1, 4, 16, 64 s (×4, el ejemplo de la lección) o
 * 1, 2, 4… (×2). Un intento tiene éxito si ocurre con la plataforma ya
 * arriba (t ≥ D). Todo lo que se dibuja sale de attemptsFor().
 */

type Policy = "none" | "x2" | "x4";
const POLICY_LABEL: Record<Policy, string> = { none: "Sin reintentos", x2: "Backoff ×2", x4: "Backoff ×4" };
const T_MAX = 130;
const RX = (t: number) => -4.3 + (t / T_MAX) * 8.6;

const RB = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };

function attemptsFor(policy: Policy) {
  if (policy === "none") return [0];
  const factor = policy === "x2" ? 2 : 4;
  const retries = policy === "x2" ? 6 : 4;
  const times = [0];
  let wait = 1;
  for (let i = 0; i < retries; i++) {
    times.push(times[times.length - 1] + wait);
    wait *= factor;
  }
  return times;
}

function outcome(policy: Policy, outage: number) {
  const times = attemptsFor(policy);
  const index = times.findIndex((t) => t >= outage);
  return { times, index, delivered: index >= 0, at: index >= 0 ? times[index] : null };
}

function RMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

/* Un intento: poste con cabeza. Caído si golpeó la caída, erguido si entregó. */
function AttemptPin({ t, state, n }: { t: number; state: "fail" | "ok" | "unused"; n: number }) {
  const color = state === "ok" ? P.teal : state === "fail" ? P.rose : RB.steel;
  return (
    <group position={[RX(t), -0.35, 0.35]} rotation={[0, 0, state === "fail" ? -0.5 : 0]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.7, 12]} />
        <meshStandardMaterial color={RB.graphite} metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.11, 22, 16]} />
        <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.6} emissive={color} emissiveIntensity={state === "ok" ? 0.35 : 0} transparent={state === "unused"} opacity={state === "unused" ? 0.45 : 1} />
      </mesh>
      {state === "ok" ? <Tag position={[0, 1.08, 0]} tone="teal" size="xs" center>{"#" + n + " · " + t + " s"}</Tag> : null}
    </group>
  );
}

/* El mensaje salta de intento en intento hasta el que entrega. */
function Courier({ stops }: { stops: V3[] }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const [i] = useCycle(stops.length + 1, 1.1);
  const target = still ? stops[stops.length - 1] : stops[Math.min(i, stops.length - 1)];
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (still || g.position.x - target[0] > 0.5) {
      g.position.set(...target);
      return;
    }
    const k = Math.min(1, dt * 5);
    g.position.x += (target[0] - g.position.x) * k;
    g.position.y += (target[1] - g.position.y) * k;
    g.position.z += (target[2] - g.position.z) * k;
  });
  return (
    <group ref={ref} position={stops[0]}>
      <RoundedBox args={[0.36, 0.24, 0.06]} radius={0.02} smoothness={2} castShadow>
        <RMat color={RB.ceramic} clear={0.6} />
      </RoundedBox>
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[0.24, 0.03, 0.01]} />
        <meshStandardMaterial color={P.amber} />
      </mesh>
    </group>
  );
}

function RetryRail({ policy, outage }: { policy: Policy; outage: number }) {
  const res = useMemo(() => outcome(policy, outage), [policy, outage]);
  const shown = res.times.filter((t) => t <= T_MAX);
  const lastUsed = res.delivered ? res.index : res.times.length - 1;
  const stops: V3[] = res.times.slice(0, lastUsed + 1).filter((t) => t <= T_MAX).map((t, i) => [RX(t), 0.62 + (i === res.index ? 0 : 0), 0.35] as V3);
  const outW = Math.max(0.02, RX(Math.min(outage, T_MAX)) - RX(0));
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, 0.1, 0]}>
        <ShadowBlob position={[0, -1.02, 0.2]} scale={11} opacity={0.12} />
        <RoundedBox position={[0, -0.82, 0]} args={[10.8, 0.36, 2.4]} radius={0.16} smoothness={4} castShadow receiveShadow>
          <RMat color={RB.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.6, 0]} args={[10.4, 0.1, 2.1]} radius={0.05} smoothness={3} receiveShadow>
          <RMat color={RB.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        {/* eje de tiempo: regla de latón con marcas cada 10 s */}
        <RoundedBox position={[0, -0.48, 0.35]} args={[8.9, 0.12, 0.34]} radius={0.04} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={RB.brass} metalness={0.7} roughness={0.3} />
        </RoundedBox>
        {Array.from({ length: 14 }, (_, k) => k * 10).map((t) => (
          <mesh key={t} position={[RX(t), -0.4, 0.52]}>
            <boxGeometry args={[0.02, 0.03, t % 30 === 0 ? 0.2 : 0.1]} />
            <meshStandardMaterial color={RB.graphite} />
          </mesh>
        ))}
        {[0, 30, 60, 90, 120].map((t) => (
          <Tag key={t} position={[RX(t), -0.5, 0.95]} tone="muted" size="xs" center>{t + " s"}</Tag>
        ))}
        {/* caída de la plataforma: bloque translúcido de 0 a D */}
        {outage > 0 ? (
          <group>
            <mesh position={[RX(0) + outW / 2, 0.25, -0.15]} castShadow>
              <boxGeometry args={[outW, 1.35, 0.5]} />
              <meshPhysicalMaterial color={P.rose} transparent opacity={0.28} roughness={0.2} transmission={0.2} depthWrite={false} />
            </mesh>
            <mesh position={[RX(Math.min(outage, T_MAX)), 0.25, -0.15]}>
              <boxGeometry args={[0.03, 1.4, 0.52]} />
              <meshStandardMaterial color={P.roseDeep} />
            </mesh>
            <Tag position={[RX(0) + Math.max(outW / 2, 0.55), 1.15, -0.15]} tone="rose" center>{"caída " + outage + " s"}</Tag>
            {res.index !== 0 ? <Tag position={[RX(0) + Math.max(outW / 2, 0.55), -0.05, 0.75]} tone="rose" size="xs" center>{(res.delivered ? res.index : res.times.length) + " fallidos"}</Tag> : null}
          </group>
        ) : null}
        {/* extremos: gateway a la izquierda, usuario a la derecha */}
        <RoundedBox position={[-4.95, -0.05, 0.35]} args={[0.6, 0.8, 0.8]} radius={0.1} smoothness={3} castShadow>
          <RMat color={mixHex(P.paper, P.violet, 0.35)} />
        </RoundedBox>
        <Tag position={[-4.95, 0.6, 0.35]} tone="violet" center>gateway</Tag>
        <RoundedBox position={[4.95, -0.05, 0.35]} args={[0.45, 0.85, 0.12]} radius={0.06} smoothness={3} castShadow>
          <RMat color={res.delivered ? mixHex(P.paper, P.teal, 0.45) : RB.graphite} clear={0.7} />
        </RoundedBox>
        <Tag position={[4.95, 0.6, 0.35]} tone={res.delivered ? "teal" : "rose"} center>{res.delivered ? "recibido" : "perdido"}</Tag>
        {shown.map((t, i) => (
          <AttemptPin key={policy + i} t={t} n={i + 1} state={res.delivered ? (i < res.index ? "fail" : i === res.index ? "ok" : "unused") : "fail"} />
        ))}
        {/* esperas entre intentos: el arco crece con el backoff */}
        {shown.slice(1).map((t, i) => {
          const a = shown[i];
          if (i + 1 > lastUsed) return null;
          return <Arrow key={"w" + i} from={[RX(a), 0.62, 0.35]} to={[RX(t), 0.62, 0.35]} color={P.amber} width={1.3} head={0.07} bow={Math.min(0.9, 0.12 + (t - a) / 60)} opacity={0.75} />;
        })}
        <Courier key={policy + ":" + outage} stops={stops.length ? stops : [[RX(0), 0.62, 0.35]]} />
        {res.delivered && stops.length ? <Arrow from={[RX(res.at!) + 0.15, 0.3, 0.35]} to={[4.62, 0.05, 0.35]} color={P.teal} width={1.6} head={0.1} dashed /> : null}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [policy, setPolicy] = useState<Policy>("x4");
  const [outage, setOutage] = useState(30);
  const res = outcome(policy, outage);
  const fails = res.delivered ? res.index : res.times.length;
  const waits = res.times.slice(1).map((t, i) => t - res.times[i]);
  return (
    <Figure
      label="Entrega con reintentos · la plataforma cae y vuelve"
      hint="backoff exponencial frente a un solo intento"
      height="h-[420px] md:h-[500px]"
      legend={[
        { color: P.rose, label: "plataforma caída / intento fallido" },
        { color: P.amber, label: "espera de backoff" },
        { color: P.teal, label: "intento que entrega" },
      ]}
      controls={
        <>
          <Switcher value={policy} onChange={setPolicy} ariaLabel="Política de entrega" options={(["none", "x2", "x4"] as Policy[]).map((v) => ({ value: v, label: POLICY_LABEL[v], tone: v === "none" ? P.rose : P.amber }))} />
          <Knob label="caída" value={outage} min={0} max={120} step={5} onChange={setOutage} format={(v) => v + " s"} tone="var(--rose)" />
        </>
      }
      note={
        <div className="space-y-3">
          <p>
            {res.delivered ? (
              <><strong>Entregado en el intento {res.index + 1}, a los {res.at} s.</strong> {fails === 0 ? "La plataforma estaba arriba: el primer envío basta." : `Los ${fails} intentos anteriores cayeron dentro de la caída; el gateway esperó y volvió a probar sin intervención del usuario.`}</>
            ) : policy === "none" ? (
              <><strong>Mensaje perdido.</strong> Un solo envío en t = 0 golpea la caída. El usuario reenvía, el agente vuelve a correr y contesta dos veces.</>
            ) : (
              <><strong>Se agotan los reintentos.</strong> El último intento sale a los {res.times[res.times.length - 1]} s y la plataforma sigue caída: hace falta una cola persistente o más reintentos.</>
            )}
          </p>
          <Readout
            items={[
              { label: "intentos en", value: res.times.map((t) => t + " s").join(" · "), tone: "var(--amber)" },
              { label: "esperas", value: waits.length ? waits.join(", ") + " s" : "ninguna", tone: "var(--amber)" },
              { label: "fallidos", value: String(fails), tone: "var(--rose)" },
            ]}
          />
          <p className="text-xs text-muted">Modelo didáctico: un intento tiene éxito si sale con la plataforma ya recuperada (t ≥ caída); no se modela latencia de red ni jitter. La serie ×4 (1, 4, 16, 64 s) es la de la lección. En todos los casos la entrega es saliente: la respuesta no se espeja en el transcript como si fuera un mensaje del usuario.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 3.0, 10.8], fov: 34 }} fit={1.06}>
        <RetryRail policy={policy} outage={outage} />
      </Stage>
    </Figure>
  );
}
