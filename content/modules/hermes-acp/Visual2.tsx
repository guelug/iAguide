"use client";
import { useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}
type Mode="jsonrpc"|"session"|"permissions";
const COPY={en:{label:"ACP is a narrow bridge, not magic",hint:"json-rpc · session · permissions",jsonrpc:"json-rpc",session:"session",permissions:"permissions",client:"client",server:"server",request:"request",response:"response",init:"initialize",prompt:"prompt",cancel:"cancel",allow:"allow",deny:"deny"},es:{label:"ACP es un puente estrecho, no magia",hint:"json-rpc · sesión · permisos",jsonrpc:"json-rpc",session:"sesión",permissions:"permisos",client:"cliente",server:"servidor",request:"request",response:"response",init:"inicializa",prompt:"prompt",cancel:"cancela",allow:"permite",deny:"deniega"}};
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("jsonrpc");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.request},{color:P.violet,label:t.response},{color:P.rose,label:t.deny}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"jsonrpc",label:t.jsonrpc,tone:P.teal},{value:"session",label:t.session,tone:P.violet},{value:"permissions",label:t.permissions,tone:P.rose}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="jsonrpc"&&<><Slab position={[-1.8,.5,0]} size={[1.5,.8,.12]} color={P.teal} fill={.22}/><Tag position={[-1.8,1.05,.15]} tone="teal">{t.client}</Tag><Ribbon points={[[-.8,.7,0],[.8,.7,0]]} color={P.teal} radius={.04} opacity={.85}/><Ribbon points={[[.8,.3,0],[-.8,.3,0]]} color={P.violet} radius={.04} opacity={.85}/><Slab position={[1.8,.5,0]} size={[1.5,.8,.12]} color={P.violet} fill={.22}/><Tag position={[1.8,1.05,.15]} tone="violet">{t.server}</Tag><Tag position={[0,1.15,.15]} tone="teal" size="xs">{t.request}</Tag><Tag position={[0,-.1,.15]} tone="violet" size="xs">{t.response}</Tag></>}
{mode==="session"&&<>{[[t.init,P.teal,-2],[t.prompt,P.violet,0],[t.cancel,P.rose,2]].map(([lab,col,x],i)=><group key={lab as string}><Slab position={[x as number,.5,0]} size={[1.5,.75,.12]} color={col as string} fill={.24}/><Tag position={[x as number,1.0,.15]} tone={(["teal","violet","rose"] as const)[i]} size="xs">{lab as string}</Tag>{i<2&&<Ribbon points={[[x as number+.75,.5,0],[(x as number)+1,.5,0]]} color={P.lineStrong} radius={.03} opacity={.7}/>}</group>)}</>}
{mode==="permissions"&&<><Slab position={[-1.8,.5,0]} size={[1.7,.8,.12]} color={P.teal} fill={.24}/><Tag position={[-1.8,1.05,.15]} tone="teal">capability map</Tag><Ribbon points={[[-.8,.5,0],[.8,.5,0]]} color={P.rose} radius={.05} opacity={.85}/><Node3D position={[1.6,.5,0]} color={P.rose} radius={.2} pulse={.5}/><Tag position={[1.6,1.0,.15]} tone="rose">{t.deny}</Tag></>}
</PointerTilt></Stage></Figure>}

/* ======================================================================
 * Versión española: el ciclo de vida de un prompt ACP.
 *
 * Siete estaciones, en el orden de la guía: extraer texto, reiniciar
 * cancel_event, instalar callbacks y puente de aprobación, ejecutar
 * AIAgent en el ThreadPoolExecutor, actualizar historial, emitir el
 * mensaje final y restaurar el callback previo de la tool terminal.
 * El caso de la lección es olvidar la última estación.
 * ==================================================================== */

type Content = "mixed" | "image";
type Contract = "restore" | "forget";

const STATIONS = ["Extraer texto", "cancel_event", "Callbacks", "Worker", "Historial", "Mensaje final", "Restaurar"];
const PROMPT_TEXT = "explica este diff";

function lifecycle(step: number, content: Content, contract: Contract, cancelled: boolean) {
  const reached = cancelled ? Math.min(step, 4) : step;
  const text = content === "mixed" ? PROMPT_TEXT : "";
  const installed = reached >= 3 && (reached < 7 || contract === "forget");
  const leftover = reached >= 7 && contract === "forget";
  const history = 4 + (reached >= 5 ? 1 : 0);
  return { reached, text, installed, leftover, history, approvalsNextCli: leftover ? 2 : 1 };
}

function SpanishVisual() {
  const [step, setStep] = useState(4);
  const [content, setContent] = useState<Content>("mixed");
  const [contract, setContract] = useState<Contract>("restore");
  const [cancelled, setCancelled] = useState(false);
  const m = lifecycle(step, content, contract, cancelled);

  const stepNotes = [
    content === "mixed"
      ? `Del prompt solo se extraen los bloques de texto: «${PROMPT_TEXT}» (${PROMPT_TEXT.length} caracteres). La imagen se ignora.`
      : "El prompt solo trae una imagen. Los bloques no texto se ignoran, así que la petición llega como texto vacío (0 caracteres). Es una limitación documentada, no un fallo de visión de AIAgent.",
    "Se reinicia el cancel_event de la sesión, para que un cancel anterior no corte este prompt.",
    "Se instalan los callbacks del puente de eventos y, temporalmente, el callback de aprobación ACP en la tool terminal.",
    cancelled
      ? "cancel(session_id) pone el cancel_event y llama a agent.interrupt(). El prompt responde con stop_reason = cancelled."
      : "AIAgent corre en un ThreadPoolExecutor. Si pide ejecutar algo peligroso, la aprobación viaja al editor como permission request.",
    "Se actualiza el historial de la sesión con el turno nuevo.",
    "Se emite el último chunk del mensaje del agente hacia el editor.",
    contract === "restore"
      ? "Se restaura el callback de aprobación que había antes. La siguiente sesión CLI pide aprobación una sola vez."
      : "Nadie restaura el callback. El de ACP se queda en la tool terminal y la siguiente sesión CLI pide aprobación dos veces: una por el editor y otra por el residuo.",
  ];

  return (
    <Figure
      label="Un prompt ACP instala un callback y debe devolverlo"
      hint={`paso ${m.reached} de 7${cancelled ? " · cancelado" : ""}`}
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "Callback ACP" },
        { color: P.faint, label: "Callback CLI previo" },
        { color: P.amber, label: "Prompt" },
        { color: P.rose, label: "Residuo o cancelación" },
      ]}
      controls={
        <>
          <Knob label="Paso" value={step} min={1} max={7} onChange={setStep} format={(v) => `${v} · ${STATIONS[v - 1]}`} />
          <Switcher ariaLabel="Contenido del prompt" value={content} onChange={setContent} options={[{ value: "mixed", label: "Texto + imagen", tone: P.amber }, { value: "image", label: "Solo imagen", tone: P.rose }]} />
          <Switcher ariaLabel="Contrato de restauración" value={contract} onChange={setContract} options={[{ value: "restore", label: "Restaurar", tone: P.teal }, { value: "forget", label: "Olvidar restaurar", tone: P.rose }]} />
          <button type="button" className="chip" aria-pressed={cancelled} onClick={() => setCancelled(!cancelled)}>{cancelled ? "Quitar cancel" : "Cancelar prompt"}</button>
        </>
      }
      note={
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
            {[
              ["Texto extraído", `${m.text.length} caracteres`, m.text.length === 0],
              ["Callback en terminal", m.installed ? "ACP" : "CLI previo", m.leftover],
              ["Aprobaciones en la próxima CLI", String(m.approvalsNextCli), m.leftover],
            ].map(([label, value, bad]) => (
              <div key={label as string}>
                <span className="block text-xs text-muted">{label}</span>
                <strong className={`mt-1 block font-display text-2xl ${bad ? "text-rose" : "text-ink"}`}>{value}</strong>
              </div>
            ))}
          </div>
          <p><strong className="text-ink">{m.reached}. {STATIONS[m.reached - 1]}.</strong> {stepNotes[m.reached - 1]}</p>
          <p className="text-xs text-muted">Orden tomado del ciclo de vida de session.py en ACP Internals (Nous Research). La cinta es un esquema del orden de llamadas, no una medición de tiempos.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3.5, 6.5, 10], fov: 34 }} fit={1.04}>
        <LifecycleRail reached={m.reached} content={content} installed={m.installed} leftover={m.leftover} history={m.history} cancelled={cancelled} />
      </Stage>
    </Figure>
  );
}

/* BENCH */
const SX = (k: number) => (k - 3) * 1.3;
const SOCKET: V3 = [-0.6, 0, -1.9];

function Piece({ p, s, color, coat = 0.4, rough = 0.42, metal = 0.05 }: { p: V3; s: V3; color: string; coat?: number; rough?: number; metal?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(0.05, Math.min(s[0], s[1], s[2]) / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} />
    </RoundedBox>
  );
}

function Shuttle({ x, content }: { x: number; content: Content }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.position.x = still ? x : MathUtils.damp(ref.current.position.x, x, 4, dt);
  });
  return (
    <group ref={ref} position={[x, 0, 0.05]}>
      <Piece p={[0, 0.72, 0]} s={[0.7, 0.1, 0.5]} color="#8C9296" metal={0.6} />
      {content === "mixed" ? (
        <Piece p={[0, 0.9, 0]} s={[0.5, 0.26, 0.36]} color={P.amber} />
      ) : (
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.5, 0.26, 0.36]} />
          <meshBasicMaterial color={P.rose} wireframe />
        </mesh>
      )}
    </group>
  );
}

function LifecycleRail({ reached, content, installed, leftover, history, cancelled }: { reached: number; content: Content; installed: boolean; leftover: boolean; history: number; cancelled: boolean }) {
  const tone = (k: number) => (k + 1 < reached ? mixHex(P.paper, P.teal, 0.28) : k + 1 === reached ? mixHex(P.paper, P.amber, 0.45) : "#E4DFD3");
  const plug = leftover ? P.rose : installed ? P.teal : P.faint;
  return (
    <group>
      <Piece p={[0, -0.13, -0.55]} s={[10.4, 0.22, 3.9]} color="#263532" metal={0.3} coat={0.35} />
      <Piece p={[0, 0.0, -0.55]} s={[10.1, 0.05, 3.6]} color={mixHex(P.paper, P.sunken, 0.7)} rough={0.6} coat={0} />
      {[-0.28, 0.38].map((z) => (
        <mesh key={z} position={[0, 0.6, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 9, 14]} />
          <meshStandardMaterial color="#B68442" metalness={0.72} roughness={0.28} />
        </mesh>
      ))}
      {STATIONS.map((name, k) => (
        <group key={name} position={[SX(k), 0, 0]}>
          <Piece p={[0, 0.25, 0]} s={[0.95, 0.42, 1.0]} color={tone(k)} />
          <mesh position={[0, 0.47, 0.51]}>
            <boxGeometry args={[0.6, 0.06, 0.01]} />
            <meshStandardMaterial color={k + 1 <= reached ? (cancelled && k === 3 ? P.rose : P.teal) : P.lineStrong} />
          </mesh>
          <Tag position={[0, 0.12, 0.85]} tone={k + 1 === reached ? "amber" : "muted"} size="xs" center>{`${k + 1} · ${name}`}</Tag>
        </group>
      ))}

      {/* 1: the image block drops into the ignored tray. */}
      <group position={[SX(0) - 0.05, 0, 1.45]}>
        <Piece p={[0, 0.06, 0]} s={[0.8, 0.1, 0.5]} color="#D9D3C6" coat={0.1} />
        {reached >= 1 ? <Piece p={[0, 0.2, 0]} s={[0.36, 0.18, 0.3]} color="#9AA3AA" /> : null}
        <Tag position={[0.65, 0.2, 0]} tone="muted" size="xs">imagen ignorada</Tag>
      </group>
      {/* 2: cancel_event latch. */}
      <mesh position={[SX(1), 0.62, -0.05]} rotation={[cancelled && reached >= 4 ? 0.7 : -0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
        <meshStandardMaterial color={cancelled && reached >= 4 ? P.rose : P.teal} roughness={0.4} />
      </mesh>
      {/* 4: the worker thread. */}
      <Piece p={[SX(3), 0.62, -0.05]} s={[0.55, 0.3, 0.35]} color={cancelled ? P.rose : P.violet} />
      {/* 5: history grows by one turn. */}
      {Array.from({ length: history }, (_, k) => (
        <mesh key={k} position={[SX(4), 0.52 + k * 0.06, -0.05]} castShadow>
          <boxGeometry args={[0.55, 0.04, 0.4]} />
          <meshStandardMaterial color={k === 4 ? P.amber : mixHex(P.paper, P.teal, 0.35)} roughness={0.5} />
        </mesh>
      ))}
      {/* 6: final chunk leaves for the editor. */}
      {reached >= 6 && !cancelled ? <><Flow points={[[SX(5), 0.7, 0.2], [SX(5), 1.2, 0.9], [SX(5), 1.1, 1.7]]} color={P.teal} count={2} size={0.045} speed={0.4} /><Tag position={[SX(5), 1.35, 1.7]} tone="teal" size="xs" center>al editor</Tag></> : null}

      <Shuttle x={SX(reached - 1)} content={content} />

      {/* The terminal tool and its approval-callback socket. */}
      <group position={SOCKET}>
        <Piece p={[0, 0.35, 0]} s={[1.3, 0.6, 0.8]} color="#2F3B39" metal={0.3} />
        <mesh position={[0, 0.66, 0.1]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 24]} />
          <meshStandardMaterial color="#1D2523" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.8, 0.1]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, 0.24, 20]} />
          <meshPhysicalMaterial color={plug} roughness={0.35} clearcoat={0.5} />
        </mesh>
        {leftover ? (
          <mesh position={[0, 0.7, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.025, 10, 40]} />
            <meshStandardMaterial color={P.rose} />
          </mesh>
        ) : null}
        <Tag position={[0, 1.2, 0]} tone={leftover ? "rose" : installed ? "teal" : "muted"} size="xs" center>{leftover ? "Callback residual" : installed ? "Callback ACP" : "Callback CLI"}</Tag>
      </group>
      {reached >= 3 ? <Flow points={[[SX(2), 0.6, -0.3], [SX(2) + 0.2, 1.1, -1.2], [SOCKET[0], 0.9, SOCKET[2] + 0.2]]} color={P.teal} count={2} size={0.04} speed={0.35} lineOpacity={0.35} /> : null}
      {reached >= 7 && !leftover ? <Flow points={[[SX(6), 0.6, -0.3], [SX(6) - 1.5, 1.3, -1.5], [SOCKET[0] + 0.3, 0.9, SOCKET[2] + 0.2]]} color={P.faint} count={2} size={0.04} speed={0.35} lineOpacity={0.35} /> : null}

      {/* The next CLI session: one bell per approval prompt. */}
      <group position={[2.4, 0, -1.9]}>
        <Piece p={[0, 0.2, 0]} s={[1.4, 0.3, 0.7]} color="#E6E0D2" />
        {Array.from({ length: leftover ? 2 : 1 }, (_, k) => (
          <mesh key={k} position={[-0.3 + k * 0.6, 0.48, 0]} castShadow>
            <sphereGeometry args={[0.16, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={k === 1 ? P.rose : "#B68442"} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        <Tag position={[0, 0.95, 0]} tone={leftover ? "rose" : "ink"} size="xs" center>{leftover ? "Próxima CLI · 2 avisos" : "Próxima CLI · 1 aviso"}</Tag>
      </group>
    </group>
  );
}
