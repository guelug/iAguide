"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Knob, Readout } from "@/components/three/Figure";
import { Flow, ShadowBlob } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
type Mode="tracks"|"choose"|"tiers";
const COPY={en:{label:"the map is a set of decisions",hint:"tracks · choose · tiers",tracks:"tracks",choose:"choose",tiers:"hardware tiers",foundations:"foundations",harness:"harness",training:"training",metal:"metal",local:"local",cloud:"cloud",vendor:"vendor",m5:"M5 32GB",a100:"A100",h100:"H100"},es:{label:"el mapa es un conjunto de decisiones",hint:"vías · elige · niveles",tracks:"vías",choose:"elige",tiers:"niveles hardware",foundations:"fundamentos",harness:"arnés",training:"entrenamiento",metal:"metal",local:"local",cloud:"nube",vendor:"proveedor",m5:"M5 32GB",a100:"A100",h100:"H100"}};
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("tracks");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.foundations},{color:P.violet,label:t.harness},{color:P.amber,label:t.metal}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"tracks",label:t.tracks,tone:P.teal},{value:"choose",label:t.choose,tone:P.violet},{value:"tiers",label:t.tiers,tone:P.amber}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="tracks"&&<>{[[t.foundations,P.teal,-2.3],[t.harness,P.violet,-.8],[t.training,P.amber,.8],[t.metal,P.rose,2.3]].map(([lab,col,x],i)=><group key={lab as string}><Ribbon points={[[x as number,-1,0],[x as number,1.2,0]]} color={col as string} radius={.07} opacity={.75}/><Tag position={[x as number,1.55,.15]} tone={(["teal","violet","amber","rose"] as const)[i]} size="xs">{lab as string}</Tag></group>)}<Slab position={[0,-1.3,0]} size={[2.4,.45,.1]} color={P.violet} fill={.25}/><Tag position={[0,-1.7,.15]} tone="violet" size="xs">producto útil</Tag></>}
{mode==="choose"&&<><Node3D position={[0,1,0]} color={P.violet} radius={.22} pulse={.3}/><Tag position={[0,1.5,.15]} tone="violet">budget</Tag>{[[t.local,P.teal,-1.8],[t.cloud,P.amber,0],[t.vendor,P.rose,1.8]].map(([lab,col,x])=><group key={lab as string}><Ribbon points={[[0,.7,0],[x as number,.1,0]]} color={col as string} radius={.04} opacity={.8}/><Slab position={[x as number,-.6,0]} size={[1.4,.8,.12]} color={col as string} fill={.23}/><Tag position={[x as number,-.05,.15]} tone={col===P.teal?"teal":col===P.amber?"amber":"rose"} size="xs">{lab as string}</Tag></group>)}</>}
{mode==="tiers"&&<>{[[t.m5,P.teal,1], [t.a100,P.violet,1.8],[t.h100,P.amber,2.8]].map(([lab,col,h],i)=><group key={lab as string}><Slab position={[-1.8+i*1.8,-.6+(h as number)/2,0]} size={[1.2,h as number,.14]} color={col as string} fill={.25}/><Tag position={[-1.8+i*1.8,1.65,.15]} tone={(["teal","violet","amber"] as const)[i]} size="xs">{lab as string}</Tag></group>)}<Tag position={[0,-1.15,.15]} tone="muted" size="xs">memoria · coste · throughput</Tag></>}
</PointerTilt></Stage></Figure>}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* La lista práctica de la lección como un raíl de seis compuertas:
   ficha → memoria → quant → motor → quizá LoRA → arnés con permisos.
   Cada compuerta se pasa o se salta con un motivo calculado. Reglas
   prácticas de la lección: FP16 ≈ 2 B/parámetro, Q8 ≈ 1,06, Q4_K_M ≈ 0,6
   en disco; KV aparte; margen para el sistema en memoria unificada. */

type Scenario = "laptop" | "gpu24" | "server";
const SCEN: Record<Scenario, { label: string; params: number; kvPerTok: number; mem: number; reserve: number; kind: string; engine: string; local: boolean }> = {
  laptop: { label: "8B en Mac 32 GB", params: 8e9, kvPerTok: 131072, mem: 32, reserve: 10, kind: "memoria unificada", engine: "llama.cpp / Ollama (GGUF)", local: true },
  gpu24: { label: "32B en GPU 24 GB", params: 32e9, kvPerTok: 262144, mem: 24, reserve: 2, kind: "VRAM", engine: "llama.cpp / Ollama (GGUF)", local: true },
  server: { label: "32B en servidor 80 GB", params: 32e9, kvPerTok: 262144, mem: 80, reserve: 4, kind: "VRAM de servidor", engine: "vLLM (AWQ / GPTQ / FP8)", local: false },
};
const QUANTS = [
  { name: "FP16", bpp: 2 },
  { name: "Q8_0", bpp: 1.06 },
  { name: "Q4_K_M", bpp: 0.6 },
];
const CTX = [4096, 8192, 16384, 32768, 65536];

type Gate = { key: string; label: string; state: "pass" | "skip" | "fail" | "wait"; reason: string };

function route(sc: Scenario, ctxIndex: number, smokeFails: boolean) {
  const s = SCEN[sc];
  const ctx = CTX[ctxIndex];
  const kv = (s.kvPerTok * ctx) / 1e9;
  const budget = s.mem - s.reserve;
  const options = QUANTS.map((q) => ({ ...q, weights: (s.params * q.bpp) / 1e9 })).map((q) => ({ ...q, total: q.weights + kv, fits: q.weights + kv <= budget }));
  const chosen = options.find((o) => o.fits) ?? null;
  const fp16 = options[0];
  const gates: Gate[] = [
    { key: "card", label: "ficha", state: "pass", reason: "licencia, contexto, plantilla de chat, denso o MoE" },
    { key: "mem", label: "memoria", state: chosen ? "pass" : "fail", reason: chosen ? `${chosen.name}: ${fmt1(chosen.weights)} + KV ${fmt1(kv)} ≤ ${budget} GB` : `ni Q4_K_M cabe: ${fmt1(options[2].total)} > ${budget} GB` },
    { key: "quant", label: "quant", state: !chosen ? "fail" : chosen === fp16 ? "skip" : "pass", reason: !chosen ? "reduce contexto o elige otro modelo" : chosen === fp16 ? "FP16 ya cabe: no hace falta cuantizar" : `baja a ${chosen.name}` },
    { key: "engine", label: "motor", state: chosen ? "pass" : "fail", reason: s.engine },
    { key: "lora", label: "LoRA", state: smokeFails ? "pass" : "skip", reason: smokeFails ? "el humo falla por formato o jerga: el dato lo arregla" : "el humo pasa: no entrenes para «ser más listo»" },
    { key: "harness", label: "arnés", state: chosen ? "pass" : "fail", reason: "tools con permisos, test del bucle, eval de 20 filas" },
  ];
  /* Detrás de la primera compuerta que bloquea, todo queda pendiente. */
  const stop = gates.findIndex((g) => g.state === "fail");
  const staged = gates.map((g, i) => (stop >= 0 && i > stop ? { ...g, state: "wait" as const, reason: "pendiente: antes hay que pasar la memoria" } : g));
  return { s, ctx, kv, budget, options, chosen, gates: staged };
}

const G = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
};
const GATE_COLOR = { pass: P.teal, skip: P.amber, fail: P.rose, wait: P.faint } as const;
const fmt1 = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

const GX = (i: number) => -4 + i * 1.6;

function GateArch({ x, gate }: { x: number; gate: Gate }) {
  const color = GATE_COLOR[gate.state];
  const skip = gate.state === "skip";
  return (
    <group position={[x, 0.08, 0]}>
      <group position={[0, 0, skip ? -0.9 : 0]} rotation={[0, skip ? 0.5 : 0, 0]}>
        {[-0.55, 0.55].map((z) => (
          <mesh key={z} position={[0, 0.6, z]} castShadow>
            <boxGeometry args={[0.14, 1.2, 0.14]} />
            <meshStandardMaterial color={G.charcoal} roughness={0.4} metalness={0.3} />
          </mesh>
        ))}
        <RoundedBox args={[0.26, 0.18, 1.3]} position={[0, 1.25, 0]} radius={0.04} smoothness={2} castShadow>
          <meshPhysicalMaterial color={mixHex(G.deck, color, 0.25)} roughness={0.45} clearcoat={0.4} />
        </RoundedBox>
        <mesh position={[0.14, 1.25, 0]}>
          <sphereGeometry args={[0.08, 16, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>
        {gate.state === "fail" ? (
          <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.1, 12]} />
            <meshStandardMaterial color={P.rose} />
          </mesh>
        ) : null}
      </group>
      <Tag position={[0, 1.7, skip ? -0.9 : 0]} tone={gate.state === "pass" ? "teal" : gate.state === "skip" ? "amber" : gate.state === "wait" ? "muted" : "rose"} size="xs" center>{gate.label}</Tag>
    </group>
  );
}

function RouteScene({ sc, ctxIndex, smokeFails }: { sc: Scenario; ctxIndex: number; smokeFails: boolean }) {
  const r = route(sc, ctxIndex, smokeFails);
  const firstFail = r.gates.findIndex((g) => g.state === "fail");
  const cartX = firstFail >= 0 ? GX(firstFail) - 0.75 : GX(5) + 1.0;
  const scale = 0.045; // unidades por GB en la columna de memoria
  const w = r.chosen ?? r.options[2];
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -0.28, 0]} scale={11} opacity={0.12} />
        <RoundedBox args={[11, 0.3, 3.6]} position={[0.3, -0.13, -0.2]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={G.base} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[10.65, 0.06, 3.25]} position={[0.3, 0.05, -0.2]} radius={0.03} smoothness={3} receiveShadow>
          <meshStandardMaterial color={G.baseTop} roughness={0.45} metalness={0.22} />
        </RoundedBox>
        {[-0.3, 0.3].map((z) => (
          <mesh key={z} position={[0.3, 0.12, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 10.2, 12]} />
            <meshStandardMaterial color={G.brass} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {r.gates.map((g, i) => <GateArch key={g.key} x={GX(i)} gate={g} />)}
        {/* el candidato recorre el raíl */}
        <group position={[cartX, 0.2, 0]}>
          <RoundedBox args={[0.7, 0.22, 0.55]} radius={0.06} smoothness={3} castShadow>
            <meshPhysicalMaterial color={P.violet} roughness={0.3} clearcoat={0.7} />
          </RoundedBox>
        </group>
        <Flow points={[[GX(0) - 0.8, 0.35, 0], [Math.min(cartX, GX(5)), 0.35, 0]]} color={P.violet} count={3} speed={0.3} />
        {/* columna de memoria junto a la compuerta 2 */}
        <group position={[GX(1) + 0.8, 0.08, 1.2]}>
          <RoundedBox args={[0.8, 0.1, 0.6]} position={[0, 0.05, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
            <meshStandardMaterial color={G.charcoal} />
          </RoundedBox>
          <mesh position={[0, 0.1 + (w.weights * scale) / 2, 0]} castShadow>
            <boxGeometry args={[0.5, w.weights * scale, 0.4]} />
            <meshStandardMaterial color={P.teal} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.1 + w.weights * scale + (r.kv * scale) / 2, 0]} castShadow>
            <boxGeometry args={[0.5, r.kv * scale, 0.4]} />
            <meshStandardMaterial color={P.violet} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.1 + r.budget * scale, 0]}>
            <boxGeometry args={[0.75, 0.03, 0.55]} />
            <meshStandardMaterial color={r.chosen ? G.brass : P.rose} metalness={0.6} roughness={0.3} />
          </mesh>
          <Tag position={[0.75, 0.1 + r.budget * scale, 0]} tone="muted" size="xs" center>{`${r.budget} GB útiles`}</Tag>
        </group>
      </group>
    </PointerTilt>
  );
}

function RouteNote({ sc, ctxIndex, smokeFails }: { sc: Scenario; ctxIndex: number; smokeFails: boolean }) {
  const r = route(sc, ctxIndex, smokeFails);
  return (
    <div className="space-y-3">
      <p><strong>{r.s.label}, contexto {Math.round(r.ctx / 1024)}k.</strong> Cada compuerta se pasa o se salta con un motivo, no con una corazonada. {r.chosen ? `El primer formato que cabe es ${r.chosen.name}.` : "Ningún formato cabe: el candidato se para en la memoria y todo lo de detrás espera."}</p>
      <ol className="grid gap-1 text-xs sm:grid-cols-2">
        {r.gates.map((g, i) => (
          <li key={g.key} className="rounded border border-line bg-paper px-2 py-1">
            <strong style={{ color: GATE_COLOR[g.state] }}>{i + 1}. {g.label} · {g.state === "pass" ? "se hace" : g.state === "skip" ? "se salta" : g.state === "wait" ? "pendiente" : "bloquea"}</strong> — {g.reason}
          </li>
        ))}
      </ol>
      <Readout items={r.options.map((o) => ({ label: o.name, value: `${fmt1(o.weights)} + ${fmt1(r.kv)} = ${fmt1(o.total)} GB`, tone: o.fits ? "var(--teal)" : "var(--rose)" }))} />
      <p className="text-xs text-muted">Reglas prácticas de la lección, no mediciones: B/parámetro en disco, KV FP16 de un modelo denso con GQA ({r.s.kvPerTok / 1024} KiB/token), {r.s.reserve} GB de reserva ({r.s.kind}). Después, mide la memoria residente a 4k y a tu contexto objetivo.</p>
    </div>
  );
}

function SpanishVisual() {
  const [sc, setSc] = useState<Scenario>("laptop");
  const [ctxIndex, setCtxIndex] = useState(2);
  const [smokeFails, setSmokeFails] = useState(false);
  return (
    <Figure
      label="El mapa es un conjunto de decisiones"
      hint="ficha → memoria → quant → motor → quizá LoRA → arnés"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "se hace" },
        { color: P.amber, label: "se salta con motivo" },
        { color: P.rose, label: "bloquea" },
        { color: P.violet, label: "caché KV / candidato" },
      ]}
      note={<RouteNote sc={sc} ctxIndex={ctxIndex} smokeFails={smokeFails} />}
      controls={
        <>
          <Switcher value={sc} onChange={setSc} ariaLabel="Escenario" options={(Object.keys(SCEN) as Scenario[]).map((k) => ({ value: k, label: SCEN[k].label, tone: P.inkSoft }))} />
          <Knob label="contexto" value={ctxIndex} min={0} max={CTX.length - 1} onChange={setCtxIndex} format={(i) => `${Math.round(CTX[i] / 1024)}k`} tone="var(--violet)" />
          <button type="button" className="chip" aria-pressed={smokeFails} onClick={() => setSmokeFails(!smokeFails)}>{smokeFails ? "El humo pasa" : "El humo falla por formato"}</button>
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3, 5.5, 9.5], fov: 34 }} fit={1.08}>
        <RouteScene sc={sc} ctxIndex={ctxIndex} smokeFails={smokeFails} />
      </Stage>
    </Figure>
  );
}
