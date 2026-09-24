"use client";
import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Arrow, Flow, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}
type Mode="repo"|"revision"|"widget";
const COPY={en:{label:"a model repo is more than weights",hint:"anatomy · revision · widget",repo:"repo",revision:"revision",widget:"widget",card:"model card",weights:"weights",tokenizer:"tokenizer",config:"config",main:"main",pr:"pull request",tokens:"tokens"},es:{label:"un repo de modelo es más que pesos",hint:"anatomía · revisión · widget",repo:"repo",revision:"revisión",widget:"widget",card:"model card",weights:"pesos",tokenizer:"tokenizador",config:"config",main:"main",pr:"pull request",tokens:"tokens"}};
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("repo");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.card},{color:P.violet,label:t.weights},{color:P.amber,label:t.config}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"repo",label:t.repo,tone:P.teal},{value:"revision",label:t.revision,tone:P.violet},{value:"widget",label:t.widget,tone:P.amber}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="repo"&&<>{[[t.card,P.teal,-2],[t.weights,P.violet,0],[t.tokenizer,P.amber,2],[t.config,P.rose,0]].map(([lab,col,x],i)=><group key={lab as string}><Slab position={[x as number,.85-(i===3?1.3:0),0]} size={[1.5,.7,.12]} color={col as string} fill={.22}/><Tag position={[x as number,1.35-(i===3?1.3:0),.15]} tone={(["teal","violet","amber","rose"] as const)[i]} size="xs">{lab as string}</Tag></group>)}</>}
{mode==="revision"&&<><Slab position={[0,.5,0]} size={[2.4,.8,.14]} color={P.teal} fill={.24}/><Tag position={[0,1.05,.15]} tone="teal">{t.main}</Tag><Ribbon points={[[0,.05,0],[-1.5,-.8,0]]} color={P.violet} radius={.04} opacity={.8}/><Slab position={[-1.8,-1.0,0]} size={[1.3,.55,.1]} color={P.violet} fill={.25}/><Tag position={[-1.8,-.55,.15]} tone="violet" size="xs">v1.1</Tag><Ribbon points={[[0,.05,0],[1.5,-.8,0]]} color={P.amber} radius={.04} opacity={.8}/><Slab position={[1.8,-1.0,0]} size={[1.3,.55,.1]} color={P.amber} fill={.25}/><Tag position={[1.8,-.55,.15]} tone="amber" size="xs">{t.pr}</Tag></>}
{mode==="widget"&&<><Slab position={[-1.7,.5,0]} size={[2.2,1.3,.14]} color={P.teal} fill={.18}/><Tag position={[-1.7,1.35,.15]} tone="teal">input box</Tag><Ribbon points={[[-.5,.5,0],[.5,.5,0]]} color={P.amber} radius={.05} opacity={.85}/>{[0,1,2,3].map(i=><Node3D key={i} position={[1.1+i*.35,.5,0]} color={P.amber} radius={.09} pulse={i*.2}/>)}<Tag position={[1.8,1.05,.15]} tone="amber" size="xs">{t.tokens}</Tag></>}
</PointerTilt></Stage></Figure>}

/* ======================================================================
 * Versión española: la caché del Hub es un presupuesto de disco.
 *
 * Disposición real de ~/.cache/huggingface/hub: refs/main apunta a un
 * snapshot; cada snapshot es una carpeta de enlaces a blobs únicos.
 * Cuando main avanza, el snapshot viejo queda detached y sigue
 * ocupando bytes. hf cache prune borra revisiones detached y ficheros
 * .incomplete; un blob compartido sobrevive. Tamaños redondeados.
 * ==================================================================== */

type CacheStep = 0 | 1 | 2 | 3;
type Blob = { id: string; file: string; mb: number; rev: string; users: string[]; incomplete?: boolean };

const BLOB_LIST: Blob[] = [
  { id: "cfg-a", file: "config.json", mb: 0.001, rev: "a1", users: ["a1"] },
  { id: "tok", file: "tokenizer.json", mb: 1.4, rev: "a1", users: ["a1", "b2"] },
  { id: "model-a", file: "model.safetensors", mb: 548, rev: "a1", users: ["a1"] },
  { id: "cfg-b", file: "config.json", mb: 0.001, rev: "b2", users: ["b2"] },
  { id: "model-b", file: "model.safetensors", mb: 548, rev: "b2", users: ["b2"] },
  { id: "part", file: ".incomplete", mb: 180, rev: "c3", users: [], incomplete: true },
];
const STEP_LABEL = ["Descargar a1", "main avanza a b2", "Descarga cortada", "hf cache prune"];

function cacheState(step: CacheStep, dryRun: boolean) {
  const present = BLOB_LIST.filter((b) => (b.rev === "a1" ? true : b.rev === "b2" ? step >= 1 : step >= 2));
  const detached = step >= 1 ? ["a1"] : [];
  const doomed = step === 3 ? present.filter((b) => b.incomplete || b.users.every((u) => detached.includes(u))) : [];
  const removed = step === 3 && !dryRun ? doomed : [];
  const kept = present.filter((b) => !removed.includes(b));
  const snapshots = step === 0 ? ["a1"] : step === 3 && !dryRun ? ["b2"] : ["a1", "b2"];
  const disk = kept.reduce((s, b) => s + b.mb, 0);
  const reclaim = doomed.reduce((s, b) => s + b.mb, 0);
  return { present, kept, doomed, removed, snapshots, detached: snapshots.filter((s) => detached.includes(s)), main: step === 0 ? "a1" : "b2", disk, reclaim };
}

const mb = (n: number) => (n >= 1000 ? `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n / 1000)} GB` : `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(n)} MB`);

function SpanishVisual() {
  const [step, setStep] = useState<CacheStep>(2);
  const [dryRun, setDryRun] = useState(true);
  const c = cacheState(step, dryRun);

  const notes = [
    `hf download deja un snapshot a1 con tres entradas. Cada entrada es un enlace a un blob único en blobs/. refs/main guarda el hash a1. En disco: ${mb(c.disk)}.`,
    `main avanza a b2: cambian config.json y model.safetensors, tokenizer.json no. b2 reutiliza el blob del tokenizador y añade dos blobs. El snapshot a1 queda detached pero sigue ocupando ${mb(548)}: el disco sube a ${mb(c.disk)}.`,
    `Una descarga interrumpida deja un fichero .incomplete de ${mb(180)} que ningún snapshot usa. Total: ${mb(c.disk)}. hf cache ls --revisions ya mostraría la línea detached.`,
    dryRun
      ? `hf cache prune --dry-run marca lo que borraría: la revisión detached a1 y el .incomplete, ${mb(c.reclaim)}. El blob del tokenizador se queda porque b2 también lo usa. No borra nada todavía.`
      : `hf cache prune recupera ${mb(c.reclaim)}: se van la revisión detached a1 y el .incomplete. Quedan ${mb(c.disk)}. Hazlo en una máquina quieta: es la misma caché que leen transformers y Unsloth a mitad de un entrenamiento.`,
  ];

  return (
    <Figure
      label="La caché es un presupuesto de disco con un comando prune"
      hint="~/.cache/huggingface/hub · models--openai-community--gpt2"
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "Revisión de main" },
        { color: P.faint, label: "Revisión detached" },
        { color: P.amber, label: "Blob compartido" },
        { color: P.rose, label: "Se recupera con prune" },
      ]}
      controls={
        <>
          <Switcher ariaLabel="Paso" value={String(step)} onChange={(v) => setStep(Number(v) as CacheStep)} options={STEP_LABEL.map((label, k) => ({ value: String(k), label, tone: k === 3 ? P.rose : P.teal }))} />
          {step === 3 ? <button type="button" className="chip" aria-pressed={!dryRun} onClick={() => setDryRun(!dryRun)}>{dryRun ? "Ejecutar sin --dry-run" : "Volver a --dry-run"}</button> : null}
        </>
      }
      note={
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
            {[
              ["En disco", mb(c.disk)],
              ["Blobs", String(c.kept.length)],
              [step === 3 && !dryRun ? "Recuperado" : "Recuperable", step === 3 ? mb(c.reclaim) : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="block text-xs text-muted">{label}</span>
                <strong className="mt-1 block font-display text-2xl text-ink">{value}</strong>
              </div>
            ))}
          </div>
          <p>{notes[step]}</p>
          <p className="text-xs text-muted">Tamaños redondeados con fines didácticos (el safetensors de gpt2 ronda 548 MB). La ruta cambia con HF_HOME o --cache-dir; hf env imprime HF_HUB_CACHE.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3, 6.5, 10], fov: 34 }} fit={1.05}>
        <CacheBench step={step} dryRun={dryRun} />
      </Stage>
    </Figure>
  );
}

/* BENCH */
function Solid({ p, s, color, coat = 0.4, rough = 0.42, metal = 0.05, opacity = 1 }: { p: V3; s: V3; color: string; coat?: number; rough?: number; metal?: number; opacity?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(0.05, Math.min(s[0], s[1], s[2]) / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} transparent={opacity < 1} opacity={opacity} />
    </RoundedBox>
  );
}

const BLOB_X = (k: number) => -3 + k * 1.2;
const BLOB_Z = 1.1;
const SNAP_X: Record<string, number> = { a1: -1.9, b2: 1.3 };
const SNAP_FILES = ["config.json", "tokenizer.json", "model.safetensors"];
const blobH = (b: Blob) => 0.12 + 0.9 * Math.sqrt(b.mb / 548);

function blobFor(rev: string, file: string) {
  return BLOB_LIST.find((b) => b.file === file && b.users.includes(rev))!;
}

function CacheBench({ step, dryRun }: { step: CacheStep; dryRun: boolean }) {
  const c = cacheState(step, dryRun);
  const colorOf = (b: Blob) => {
    if (c.doomed.includes(b)) return P.rose;
    if (b.users.length > 1 && step >= 1) return P.amber;
    if (b.users.includes(c.main)) return P.teal;
    return "#A7ADB2";
  };
  return (
    <group>
      <Solid p={[0, -0.13, -0.4]} s={[8.6, 0.22, 4.6]} color="#263532" metal={0.3} coat={0.35} />
      <Solid p={[0, 0.0, -0.4]} s={[8.3, 0.05, 4.3]} color={mixHex(P.paper, P.sunken, 0.7)} rough={0.6} coat={0} />
      {/* Section dividers: blobs/, snapshots/, refs/. */}
      {[0.35, -1.55].map((z) => (
        <mesh key={z} position={[0, 0.04, z]}>
          <boxGeometry args={[8.1, 0.02, 0.03]} />
          <meshStandardMaterial color="#B68442" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <Tag position={[-4.0, 0.2, BLOB_Z]} tone="ink" size="xs" center>blobs/</Tag>
      <Tag position={[-4.0, 0.2, -0.6]} tone="ink" size="xs" center>snapshots/</Tag>
      <Tag position={[-4.0, 0.2, -2.1]} tone="ink" size="xs" center>refs/</Tag>

      {BLOB_LIST.map((b, k) => {
        const on = c.present.includes(b);
        const gone = c.removed.includes(b);
        const h = blobH(b);
        return (
          <group key={b.id} position={[BLOB_X(k), 0, BLOB_Z]}>
            <mesh position={[0, 0.035, 0]}>
              <boxGeometry args={[0.86, 0.01, 0.86]} />
              <meshStandardMaterial color="#CFC8B8" roughness={0.7} />
            </mesh>
            {on && !gone ? (
              b.incomplete ? (
                <>
                  <Solid p={[0, 0.04 + h * 0.3, 0]} s={[0.78, h * 0.6, 0.78]} color={P.rose} opacity={0.75} />
                  <mesh position={[0, 0.04 + h / 2, 0]}>
                    <boxGeometry args={[0.8, h, 0.8]} />
                    <meshBasicMaterial color={P.rose} wireframe />
                  </mesh>
                </>
              ) : (
                <Solid p={[0, 0.04 + h / 2, 0]} s={[0.78, h, 0.78]} color={colorOf(b)} />
              )
            ) : null}
            {on && c.doomed.includes(b) && !gone ? (
              <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.5, 0.56, 40]} />
                <meshBasicMaterial color={P.rose} />
              </mesh>
            ) : null}
            {on && !gone && (b.mb > 100) ? <Tag position={[0, h + 0.3, 0]} tone={c.doomed.includes(b) ? "rose" : "muted"} size="xs" center>{mb(b.mb)}</Tag> : null}
          </group>
        );
      })}

      {c.snapshots.map((rev) => {
        const detached = c.detached.includes(rev);
        const x = SNAP_X[rev];
        const doomed = step === 3 && detached;
        const frame = doomed ? P.rose : detached ? "#9AA1A7" : P.teal;
        return (
          <group key={rev} position={[x, 0, -0.6]}>
            <Solid p={[0, 0.08, 0]} s={[2.2, 0.08, 0.9]} color={mixHex(P.paper, frame, 0.25)} />
            <Solid p={[0, 0.5, -0.4]} s={[2.2, 0.8, 0.06]} color={mixHex(P.paper, frame, 0.4)} />
            {SNAP_FILES.map((file, k) => {
              const blob = blobFor(rev, file);
              const bx = BLOB_X(BLOB_LIST.indexOf(blob)) - x;
              return (
                <group key={file}>
                  <Solid p={[(k - 1) * 0.68, 0.3, 0]} s={[0.5, 0.36, 0.05]} color="#F4F0E6" rough={0.6} coat={0} />
                  <mesh position={[(k - 1) * 0.68, 0.3, 0.03]}>
                    <boxGeometry args={[0.3, 0.05, 0.01]} />
                    <meshBasicMaterial color={frame} />
                  </mesh>
                  <Wire points={[[(k - 1) * 0.68, 0.14, 0.05], [((k - 1) * 0.68 + bx) / 2, 0.35, 0.95], [bx, 0.1, 1.28]]} color={frame} width={1.2} opacity={detached ? 0.5 : 0.8} dashed={detached} />
                </group>
              );
            })}
            <Tag position={[0, 1.15, -0.4]} tone={doomed ? "rose" : detached ? "muted" : "teal"} size="xs" center>{detached ? `${rev} · detached` : `${rev} · main`}</Tag>
          </group>
        );
      })}

      {/* refs/main: one hash, pointing at the current snapshot. */}
      <group position={[0, 0, -2.1]}>
        <Solid p={[3.3, 0.12, 0]} s={[1.3, 0.16, 0.5]} color="#B68442" metal={0.7} rough={0.3} />
        <Tag position={[3.3, 0.45, 0]} tone="amber" size="xs" center>{`main = ${c.main}`}</Tag>
        <Arrow from={[2.6, 0.2, 0]} to={[SNAP_X[c.main] + 1.15, 0.7, 1.1]} color={P.teal} width={2} bow={0.3} />
      </group>
      {step === 1 ? <Flow points={[[5, 1.2, 0.3], [BLOB_X(4) + 0.6, 1.3, BLOB_Z], [BLOB_X(4), 0.9, BLOB_Z]]} color={P.teal} count={2} size={0.05} speed={0.35} lineOpacity={0.3} /> : null}
    </group>
  );
}
