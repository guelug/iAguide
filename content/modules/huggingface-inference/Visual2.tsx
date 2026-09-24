"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useState, type ReactNode } from "react";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Los tres objetos bajo pipeline(): tokenizer, modelo y generate.
 *
 * Una línea de montaje para openai-community/gpt2 (12 capas, vocabulario de
 * 50.257, datos de su config). El prompt del quicktour se trocea en IDs,
 * cruza las 12 capas, generate añade tokens hasta max_length = 30 y el
 * mismo tokenizer decodifica. Dos fallos del texto se pueden provocar: no
 * mover los tensores a model.device y decodificar con otro tokenizer.
 * Los IDs dibujados son didácticos, no los del vocabulario real.
 */

type Station = "tokenize" | "forward" | "generate" | "decode";

const PROMPT = ["The", " secret", " to", " baking", " a", " good", " cake", " is", " "];
const LAYERS = 12;
const VOCAB = 50257;
const MAX_LENGTH = 30;
const NEW_TOKENS = MAX_LENGTH - PROMPT.length;

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

function Chip({ position, color, dim = false }: { position: V3; color: string; dim?: boolean }) {
  return (
    <RoundedBox args={[0.2, 0.14, 0.34]} position={position} radius={0.03} smoothness={2} castShadow>
      <Physical color={dim ? mixHex(P.paper, color, 0.35) : color} coat={0.55} />
    </RoundedBox>
  );
}

function Station3D({ x, label, tone, active, children }: { x: number; label: string; tone: "teal" | "amber" | "violet" | "rose"; active: boolean; children?: ReactNode }) {
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox args={[1.9, 0.16, 2.0]} position={[0, 0.06, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <Physical color={active ? "#E9E3D5" : "#D2CCBE"} rough={0.55} coat={0.25} />
      </RoundedBox>
      {children}
      <Tag position={[0, -0.05, 1.25]} tone={active ? tone : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

const ORDER: Station[] = ["tokenize", "forward", "generate", "decode"];
const SX: Record<Station, number> = { tokenize: -3.3, forward: -1.1, generate: 1.1, decode: 3.3 };

function LineScene({ station, moved, sameTok }: { station: Station; moved: boolean; sameTok: boolean }) {
  const reached = (s: Station) => ORDER.indexOf(s) <= ORDER.indexOf(station) && (moved || s === "tokenize");
  return (
    <PointerTilt amount={0.035}>
      <group>
        <ShadowBlob position={[0, -0.12, 0]} scale={9.5} opacity={0.07} />
        <RoundedBox args={[9.6, 0.16, 3.4]} position={[0, -0.1, 0]} radius={0.06} smoothness={3} receiveShadow><Physical color="#6E5440" rough={0.6} coat={0.15} /></RoundedBox>
        {/* tokenizer: the prompt becomes ids */}
        <Station3D x={SX.tokenize} label="AutoTokenizer" tone="amber" active={station === "tokenize"}>
          {PROMPT.map((_, i) => <Chip key={i} position={[-0.6 + (i % 5) * 0.3, 0.22, -0.3 + Math.floor(i / 5) * 0.5]} color={P.amber} />)}
        </Station3D>
        {/* the model: twelve transformer blocks */}
        <Station3D x={SX.forward} label="AutoModelForCausalLM" tone="teal" active={station === "forward"}>
          {Array.from({ length: LAYERS }, (_, k) => (
            <RoundedBox key={k} args={[1.2, 0.07, 1.2]} position={[0, 0.2 + k * 0.1, 0]} radius={0.02} smoothness={2} castShadow receiveShadow>
              <Physical color={reached("forward") ? mixHex(P.tealWash, P.teal, 0.3 + (k % 2) * 0.25) : "#C9C3B5"} coat={0.5} />
            </RoundedBox>
          ))}
        </Station3D>
        {/* generate: new ids appended until max_length */}
        <Station3D x={SX.generate} label="generate" tone="violet" active={station === "generate"}>
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.72, 0.035, 10, 48]} /><meshStandardMaterial color={P.violet} roughness={0.35} /></mesh>
          {reached("generate") && Array.from({ length: NEW_TOKENS }, (_, i) => {
            const a = (i / NEW_TOKENS) * Math.PI * 2;
            return <Chip key={i} position={[Math.cos(a) * 0.72, 0.3, Math.sin(a) * 0.72]} color={P.violet} />;
          })}
        </Station3D>
        {/* decode: back to text with a tokenizer */}
        <Station3D x={SX.decode} label="batch_decode" tone={sameTok ? "teal" : "rose"} active={station === "decode"}>
          <RoundedBox args={[1.3, 0.04, 0.9]} position={[0, 0.2, 0]} radius={0.01} smoothness={1} castShadow><Physical color={reached("decode") ? (sameTok ? "#F4EFE4" : mixHex(P.paper, P.rose, 0.35)) : "#DAD4C6"} rough={0.8} coat={0.05} /></RoundedBox>
          {reached("decode") && [0.25, 0.08, -0.09, -0.26].map((z, i) => (
            <mesh key={z} position={[-0.05, 0.225, z]}><boxGeometry args={[i === 3 ? 0.6 : 1.0, 0.005, 0.05]} /><meshBasicMaterial color={sameTok ? P.inkSoft : P.rose} /></mesh>
          ))}
        </Station3D>
        <Flow points={[[SX.tokenize + 0.9, 0.5, 0], [SX.forward - 0.9, 0.5, 0]]} color={P.amber} count={2} size={0.045} speed={0.4} lineOpacity={0.35} />
        {moved && <Flow points={[[SX.forward + 0.9, 0.6, 0], [SX.generate - 0.9, 0.5, 0]]} color={P.teal} count={2} size={0.045} speed={0.4} lineOpacity={0.35} />}
        {moved && <Flow points={[[SX.generate + 0.9, 0.5, 0], [SX.decode - 0.9, 0.5, 0]]} color={P.violet} count={2} size={0.045} speed={0.4} lineOpacity={0.35} />}
        {!moved && (
          <group position={[(SX.tokenize + SX.forward) / 2, 0, 0]}>
            <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.08, 0.8, 1.8]} /><Physical color={P.rose} coat={0.4} /></mesh>
            <Tag position={[0, 1.1, 0]} tone="rose" size="xs" center>cpu ≠ cuda</Tag>
          </group>
        )}
      </group>
    </PointerTilt>
  );
}

const STATION_TEXT: Record<Station, string> = {
  tokenize: `AutoTokenizer.from_pretrained("openai-community/gpt2") convierte el prompt del quicktour en ${PROMPT.length} IDs de un vocabulario de ${VOCAB.toLocaleString("es-ES")}.`,
  forward: `AutoModelForCausalLM carga pesos y cabeza causal (dtype="auto", device_map="auto"). Los IDs cruzan las ${LAYERS} capas de gpt2 y salen logits sobre el vocabulario completo.`,
  generate: `model.generate(**inputs, max_length=${MAX_LENGTH}) repite el forward y añade un ID por vuelta: ${MAX_LENGTH} − ${PROMPT.length} = ${NEW_TOKENS} tokens nuevos.`,
  decode: "tok.batch_decode(ids) vuelve a texto. Tiene que ser el mismo tokenizer: los IDs solo significan algo en su vocabulario.",
};

function SpanishVisual() {
  const [station, setStation] = useState<Station>("generate");
  const [moved, setMoved] = useState(true);
  const [sameTok, setSameTok] = useState(true);
  const failure = !moved
    ? "Sin inputs.to(model.device), los tensores siguen en CPU y el modelo está en la GPU: generate falla antes del primer token."
    : !sameTok && station === "decode"
      ? "Decodificar con otro tokenizer asigna cada ID a otra pieza: el texto sale sin sentido aunque el modelo haya funcionado."
      : null;
  return (
    <Figure
      label="Tokenizer, modelo, generate · lo que pipeline() esconde"
      hint="openai-community/gpt2 · local"
      height="h-[420px] md:h-[500px]"
      legend={[{ color: P.amber, label: "IDs del prompt" }, { color: P.teal, label: "12 capas" }, { color: P.violet, label: "IDs generados" }, { color: P.rose, label: "fallo" }]}
      controls={
        <>
          <Switcher value={station} onChange={setStation} ariaLabel="Estación" options={[{ value: "tokenize", label: "Tokenizar", tone: P.amber }, { value: "forward", label: "Forward", tone: P.teal }, { value: "generate", label: "Generate", tone: P.violet }, { value: "decode", label: "Decode", tone: P.teal }]} />
          <Switcher value={moved ? "yes" : "no"} onChange={(v) => setMoved(v === "yes")} ariaLabel="Mover a model.device" options={[{ value: "yes", label: "inputs.to(device)", tone: P.teal }, { value: "no", label: "sin mover", tone: P.rose }]} />
          <Switcher value={sameTok ? "same" : "other"} onChange={(v) => setSameTok(v === "same")} ariaLabel="Tokenizer de decode" options={[{ value: "same", label: "mismo tokenizer", tone: P.teal }, { value: "other", label: "otro tokenizer", tone: P.rose }]} />
        </>
      }
      note={
        <div className="space-y-3">
          <p>{STATION_TEXT[station]} {failure ? <strong className="text-rose">{failure}</strong> : null}</p>
          <Readout items={[
            { label: "IDs del prompt", value: String(PROMPT.length), tone: "var(--amber)" },
            { label: "capas", value: String(LAYERS), tone: "var(--teal)" },
            { label: "tokens nuevos", value: moved ? String(NEW_TOKENS) : "0", tone: "var(--violet)" },
            { label: "vocabulario", value: VOCAB.toLocaleString("es-ES") },
          ]} />
          <p className="text-xs text-muted">Capas y vocabulario proceden de la config pública de gpt2; el recuento de 9 tokens del prompt es aproximado y los IDs dibujados no son los reales. Un curl a Providers nunca pide estos pasos porque el tokenizer es del partner: por eso no puedes depurar una chat template contra el router.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 5.4, 8.6], fov: 34 }} fit={1.06}>
        <LineScene station={station} moved={moved} sameTok={sameTok} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

type Mode="local"|"router"|"endpoint";
const COPY={en:{label:"inference is a placement decision",hint:"local · router · endpoint",local:"local pipeline",router:"router",endpoint:"endpoint",cache:"cache",token:"HF_TOKEN",slug:"model slug",fastest:"fastest",dedicated:"dedicated gpu"},es:{label:"inferir es decidir dónde ejecutar",hint:"local · router · endpoint",local:"pipeline local",router:"router",endpoint:"endpoint",cache:"caché",token:"HF_TOKEN",slug:"slug del modelo",fastest:"fastest",dedicated:"gpu dedicada"}};
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("local");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.local},{color:P.violet,label:t.router},{color:P.amber,label:t.endpoint}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"local",label:t.local,tone:P.teal},{value:"router",label:t.router,tone:P.violet},{value:"endpoint",label:t.endpoint,tone:P.amber}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="local"&&<><Slab position={[-2,.5,0]} size={[1.6,.8,.12]} color={P.teal} fill={.22}/><Tag position={[-2,1.05,.15]} tone="teal">python pipeline</Tag><Ribbon points={[[-1.1,.5,0],[.2,.5,0]]} color={P.teal} radius={.05} opacity={.85}/><Slab position={[1.1,.5,0]} size={[1.7,.8,.12]} color={P.violet} fill={.2}/><Tag position={[1.1,1.05,.15]} tone="violet">{t.cache}</Tag><Tag position={[0,-.5,.15]} tone="muted" size="xs">weights → cache → tokens</Tag></>}
{mode==="router"&&<><Slab position={[-1.7,.5,0]} size={[1.7,.8,.12]} color={P.violet} fill={.22}/><Tag position={[-1.7,1.05,.15]} tone="violet">{t.token}</Tag><Ribbon points={[[-.7,.5,0],[.3,.5,0]]} color={P.amber} radius={.05} opacity={.85}/><Node3D position={[1.1,.5,0]} color={P.amber} radius={.22} pulse={.35}/><Tag position={[1.1,1.05,.15]} tone="amber">{t.router}</Tag><Tag position={[1.1,-.2,.15]} tone="muted" size="xs">{t.slug}:fastest</Tag></>}
{mode==="endpoint"&&<><Slab position={[-1.5,.5,0]} size={[1.7,1,.14]} color={P.violet} fill={.18}/><Tag position={[-1.5,1.15,.15]} tone="violet">serverless pool</Tag><Ribbon points={[[0,.5,0],[.8,.5,0]]} color={P.amber} radius={.05} opacity={.85}/><Slab position={[1.8,.5,0]} size={[1.8,1,.14]} color={P.amber} fill={.24}/><Tag position={[1.8,1.15,.15]} tone="amber">{t.dedicated}</Tag><Tag position={[0,-.55,.15]} tone="muted" size="xs">shared latency vs control</Tag></>}
</PointerTilt></Stage></Figure>}
