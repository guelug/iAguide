"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group, MathUtils } from "three";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Flow, ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
type Mode="registry"|"execution"|"errors";
const COPY={en:{label:"a tool is a typed side effect",hint:"registry · execution · errors",registry:"registry",execution:"execution",errors:"errors",definition:"definition",call:"call",result:"result",timeout:"timeout",retry:"retry"},es:{label:"una tool es un efecto lateral tipado",hint:"registro · ejecución · errores",registry:"registro",execution:"ejecución",errors:"errores",definition:"definición",call:"llamada",result:"resultado",timeout:"timeout",retry:"reintenta"}};
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("registry");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.definition},{color:P.violet,label:t.result},{color:P.rose,label:t.errors}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"registry",label:t.registry,tone:P.teal},{value:"execution",label:t.execution,tone:P.violet},{value:"errors",label:t.errors,tone:P.rose}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="registry"&&<><Slab position={[-1.7,.5,0]} size={[1.8,1.1,.14]} color={P.teal} fill={.22}/><Tag position={[-1.7,1.2,.15]} tone="teal">{t.definition}</Tag>{[[-1.7,.3],[ -1.7,.0]].map(([x,y],i)=><Tag key={i} position={[x,y,.15]} tone="muted" size="xs">{i===0?"name + schema":"handler"}</Tag>)}<Ribbon points={[[-.7,.5,0],[.5,.5,0]]} color={P.lineStrong} radius={.04} opacity={.8}/><Node3D position={[1.5,.5,0]} color={P.violet} radius={.2} pulse={.3}/><Tag position={[1.5,1.05,.15]} tone="violet">agent</Tag></>}
{mode==="execution"&&<><Slab position={[-1.8,.5,0]} size={[1.4,.7,.12]} color={P.teal} fill={.24}/><Tag position={[-1.8,1.0,.15]} tone="teal">{t.call}</Tag><Ribbon points={[[-1,.5,0],[.5,.5,0]]} color={P.violet} radius={.05} opacity={.85}/><Slab position={[1.5,.5,0]} size={[1.5,.7,.12]} color={P.violet} fill={.24}/><Tag position={[1.5,1.0,.15]} tone="violet">{t.result}</Tag><Ribbon points={[[1.5,-.1,0],[1.5,-.8,0],[-1.8,-.8,0],[-1.8,-.1,0]]} color={P.lineStrong} radius={.03} opacity={.65}/></>}
{mode==="errors"&&<><Slab position={[-1.7,.5,0]} size={[1.6,.7,.12]} color={P.teal} fill={.2}/><Tag position={[-1.7,1.0,.15]} tone="teal">{t.call}</Tag><Ribbon points={[[-.8,.5,0],[.5,.5,0]]} color={P.rose} radius={.05} opacity={.9}/><Node3D position={[1.4,.5,0]} color={P.rose} radius={.22} pulse={.5}/><Tag position={[1.4,1.0,.15]} tone="rose">{t.timeout}</Tag><Ribbon points={[[1.4,-.1,0],[-.2,-.9,0]]} color={P.amber} radius={.04} opacity={.8}/><Tag position={[0,-1.2,.15]} tone="amber" size="xs">{t.retry}</Tag></>}
</PointerTilt></Stage></Figure>}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Rule = "ultimo" | "rechaza" | "override";
type Order = "AB" | "BA";
type PluginId = "A" | "B";

const PLUGINS: Record<PluginId, { name: string; impl: string; color: string }> = {
  A: { name: "search_pro", impl: "DuckDuckGo", color: P.teal },
  B: { name: "goosearch", impl: "GooSearch", color: P.amber },
};

function resolve(rule: Rule, order: Order) {
  const first: PluginId = order === "AB" ? "A" : "B";
  const second: PluginId = order === "AB" ? "B" : "A";
  if (rule === "ultimo")
    return { winner: second, loser: first, loserFate: "desplazado" as const, log: null as string | null,
      text: `Sin sistema de override, ${PLUGINS[second].name} se registra después y pisa a ${PLUGINS[first].name}. Nadie avisa: si cambias el orden de carga, cambia la implementación que responde a web_search.` };
  if (rule === "rechaza")
    return { winner: first, loser: second, loserFate: "rechazado" as const, log: `ERROR: web_search ya registrada por ${PLUGINS[first].name}; ${PLUGINS[second].name} rechazada (falta override=True)`,
      text: `Como Hermes: sombrear un nombre existente se rechaza con un error en el log. Gana el primero (${PLUGINS[first].name}) y el conflicto queda escrito.` };
  return { winner: "B" as PluginId, loser: "A" as PluginId, loserFate: "sustituido" as const, log: "override: web_search → goosearch (override=True + allow_tool_override)",
    text: "goosearch registra con override=True y el operador lo permite explícitamente en la config: gana en cualquier orden de carga, y el log dice quién ganó. Dos llaves, ninguna implícita." };
}

function SpanishVisual() {
  const [rule, setRule] = useState<Rule>("ultimo");
  const [order, setOrder] = useState<Order>("AB");
  const r = useMemo(() => resolve(rule, order), [rule, order]);
  const note = (
    <div className="space-y-3">
      <p><strong>Dos plugins, un nombre.</strong> {r.text}</p>
      <Readout
        items={[
          { label: "orden de carga", value: order === "AB" ? "search_pro → goosearch" : "goosearch → search_pro", tone: "var(--ink)" },
          { label: "responde a web_search", value: `${PLUGINS[r.winner].name} (${PLUGINS[r.winner].impl})`, tone: r.winner === "A" ? "var(--teal)" : "var(--amber)" },
          { label: "el otro", value: r.loserFate, tone: "var(--rose)" },
          { label: "¿queda en el log?", value: r.log ? "sí" : "no", tone: r.log ? "var(--teal)" : "var(--rose)" },
        ]}
      />
      {r.log ? <pre className="overflow-x-auto rounded border border-line bg-paper p-2 font-mono text-xs">{r.log}</pre> : null}
      <p className="text-xs text-muted">Caso GooSearch de la lección. Lo correcto: nombres únicos, override explícito con consentimiento y registro del ganador. Del mismo modo, una tool nueva se registra como plugin (<code>ctx.register_tool</code>) en vez de parchear el bucle.</p>
    </div>
  );
  return (
    <Figure
      label="Colisión de nombres · quién responde a web_search"
      hint="orden de carga, rechazo y override explícito"
      height="h-[420px] md:h-[500px]"
      legend={[
        { color: P.teal, label: "search_pro" },
        { color: P.amber, label: "goosearch" },
        { color: P.rose, label: "rechazo / pérdida" },
        { color: P.violet, label: "llamada del modelo" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={rule} onChange={setRule} ariaLabel="Regla del registro" options={[{ value: "ultimo", label: "El último gana", tone: P.rose }, { value: "rechaza", label: "Rechaza sombreado", tone: P.teal }, { value: "override", label: "override=True", tone: P.amber }]} />
          <Switcher value={order} onChange={setOrder} ariaLabel="Orden de carga" options={[{ value: "AB", label: "carga A → B", tone: P.inkSoft }, { value: "BA", label: "carga B → A", tone: P.inkSoft }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1, 2.6, 11], fov: 35 }} fit={1.05}>
        <SlotScene r={r} order={order} />
      </Stage>
    </Figure>
  );
}

type Res = ReturnType<typeof resolve>;
const SLOT_TOP = 0.35;

function Cartridge({ id, target, rot, faded, rank }: { id: PluginId; target: V3; rot: number; faded: boolean; rank: number }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = still ? 1 : 1 - Math.exp(-dt * 4);
    g.position.x += (target[0] - g.position.x) * k;
    g.position.y += (target[1] - g.position.y) * k;
    g.position.z += (target[2] - g.position.z) * k;
    g.rotation.z = still ? rot : MathUtils.damp(g.rotation.z, rot, 4, dt);
  });
  const pl = PLUGINS[id];
  const col = faded ? "#B9B5A9" : pl.color;
  return (
    <group ref={ref} position={target}>
      <RoundedBox args={[0.9, 0.7, 0.34]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixHex(P.paper, col, faded ? 0.3 : 0.4)} roughness={0.4} clearcoat={0.5} transparent={faded} opacity={faded ? 0.7 : 1} />
      </RoundedBox>
      <mesh position={[0, -0.42, 0]} castShadow>
        <boxGeometry args={[0.5, 0.16, 0.2]} />
        <meshStandardMaterial color="#B7833E" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0.175]}><planeGeometry args={[0.7, 0.12]} /><meshBasicMaterial color={col} /></mesh>
      <Tag position={[0, 0.02, 0.2]} tone={faded ? "muted" : id === "A" ? "teal" : "amber"} size="xs" center>
        <span className="normal-case">{pl.name}</span>
      </Tag>
      {rot === 0 ? <Tag position={[0, 0.6, 0]} tone="muted" size="xs" center>{rank + "º en cargar"}</Tag> : null}
    </group>
  );
}

function SlotScene({ r, order }: { r: Res; order: Order }) {
  const firstId: PluginId = order === "AB" ? "A" : "B";
  const home = (id: PluginId): V3 => (id === "A" ? [-2.6, SLOT_TOP + 0.55, 0] : [2.6, SLOT_TOP + 0.55, 0]);
  const seated: V3 = [0, SLOT_TOP + 0.55, 0];
  const loserPos: V3 = r.loserFate === "rechazado" ? home(r.loser) : [r.loser === "A" ? -3.2 : 3.2, -0.42, 0.75];
  const loserRot = r.loserFate === "rechazado" ? 0 : r.loser === "A" ? Math.PI / 2 : -Math.PI / 2;
  return (
    <group>
      <ShadowBlob position={[0, -0.95, 0.1]} scale={8.5} opacity={0.1} />
      <RoundedBox position={[0, -0.82, 0]} args={[8.2, 0.22, 2.6]} radius={0.1} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#2D3436" roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {/* registry cabinet: one socket per tool name */}
      <RoundedBox position={[0, -0.22, 0]} args={[3.0, 1.0, 1.2]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD7C9" roughness={0.5} clearcoat={0.3} />
      </RoundedBox>
      {[-1.0, 0, 1.0].map((x) => (
        <mesh key={x} position={[x, SLOT_TOP - 0.05, 0]}>
          <boxGeometry args={[x === 0 ? 0.6 : 0.5, 0.06, 0.26]} />
          <meshStandardMaterial color="#1F2528" roughness={0.5} />
        </mesh>
      ))}
      <Tag position={[0, -0.3, 0.65]} tone="ink" size="xs" center>web_search</Tag>
      <Tag position={[-1.0, -0.3, 0.65]} tone="muted" size="xs" center>read_file</Tag>
      <Tag position={[1.0, -0.3, 0.65]} tone="muted" size="xs" center>terminal</Tag>
      {/* loading rails from each side */}
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} position={[sgn * 2.3, SLOT_TOP - 0.06, 0]} castShadow>
          <boxGeometry args={[1.6, 0.05, 0.3]} />
          <meshStandardMaterial color="#8C9895" metalness={0.55} roughness={0.34} />
        </mesh>
      ))}
      <Cartridge id={r.winner} target={seated} rot={0} faded={false} rank={r.winner === firstId ? 1 : 2} />
      <Cartridge id={r.loser} target={loserPos} rot={loserRot} faded rank={r.loser === firstId ? 1 : 2} />
      {r.loserFate === "rechazado" ? (
        <group position={[home(r.loser)[0], SLOT_TOP + 0.55, 0.3]}>
          {[1, -1].map((sg) => (
            <mesh key={sg} rotation={[0, 0, sg * Math.PI / 4]}><boxGeometry args={[1.0, 0.07, 0.04]} /><meshBasicMaterial color={P.rose} /></mesh>
          ))}
        </group>
      ) : null}
      {/* model's call goes into the socket and reaches whoever sits there */}
      <Node3D position={[0, 2.2, -0.6]} color={P.violet} radius={0.22} />
      <Tag position={[0.55, 2.25, -0.6]} tone="violet" size="xs">modelo</Tag>
      <Flow points={[[0, 1.95, -0.5], [0, 1.4, -0.2], [0, SLOT_TOP + 0.95, 0]]} color={P.violet} count={2} size={0.04} speed={0.3} lineOpacity={0.45} />
      {/* log printer */}
      <group position={[2.9, -0.5, -0.85]}>
        <RoundedBox args={[0.8, 0.4, 0.5]} radius={0.05} smoothness={2} castShadow>
          <meshPhysicalMaterial color="#1F2528" roughness={0.35} clearcoat={0.6} />
        </RoundedBox>
        {r.log ? (
          <mesh position={[0, 0.2, 0.32]} rotation={[-0.5, 0, 0]}><planeGeometry args={[0.6, 0.5]} /><meshStandardMaterial color="#F6F1E6" roughness={0.8} side={2} /></mesh>
        ) : null}
        <Tag position={[0, -0.42, 0.3]} tone={r.log ? "teal" : "rose"} size="xs" center>{r.log ? "log escrito" : "log vacío"}</Tag>
      </group>
    </group>
  );
}
