"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useState, type ReactNode } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * ¿Qué cruza el cable y de quién es la GPU?
 *
 * Una mesa con tu máquina delante a la izquierda y la infraestructura de
 * Hugging Face y sus partners al fondo. Cada modo ilumina solo el camino
 * que existe: shards del Hub a tu caché (local), tokens por HTTPS a través
 * del router (Providers), una URL privada a una GPU dedicada que factura
 * mientras está encendida (Endpoints), o un contenedor por lotes (Jobs).
 * Las cifras se calculan: tamaño FP32 de gpt2 = parámetros × 4 bytes; bytes
 * de una respuesta ≈ tokens × 4 caracteres (estimación didáctica).
 */

type Path = "local" | "providers" | "endpoints" | "jobs";

const GPT2_PARAMS = 124_439_808; // openai-community/gpt2
const BYTES_FP32 = 4;
const gb = (bytes: number) => (bytes / 1e9).toLocaleString("es-ES", { maximumFractionDigits: 2 });
const kb = (bytes: number) => (bytes / 1e3).toLocaleString("es-ES", { maximumFractionDigits: 1 });

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

function Pad({ position, w, d, active, children, label, tone }: { position: V3; w: number; d: number; active: boolean; children: ReactNode; label: string; tone: "teal" | "amber" | "violet" | "rose" | "muted" | "ink" }) {
  return (
    <group position={position}>
      <RoundedBox args={[w, 0.12, d]} position={[0, 0.02, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <Physical color={active ? "#E9E3D5" : "#D2CCBE"} rough={0.55} coat={0.25} />
      </RoundedBox>
      <group scale={1}>{children}</group>
      <Tag position={[0, -0.05, d / 2 + 0.2]} tone={active ? tone : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

function GpuCard({ position, color, dim, rotation = [0, 0, 0] }: { position: V3; color: string; dim?: boolean; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.9, 0.22, 0.5]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <Physical color={dim ? "#9EA39F" : "#2E3B38"} metal={0.35} coat={0.4} />
      </RoundedBox>
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.115, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.02, 24]} />
          <meshStandardMaterial color={dim ? "#B9BDB8" : "#525E5A"} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, -0.05, 0.26]}><boxGeometry args={[0.8, 0.04, 0.02]} /><meshStandardMaterial color={dim ? "#C9C3B5" : color} /></mesh>
    </group>
  );
}

function Shard({ position, color = P.amber }: { position: V3; color?: string }) {
  return (
    <RoundedBox args={[0.34, 0.14, 0.46]} position={position} radius={0.03} smoothness={2} castShadow receiveShadow>
      <Physical color={color} coat={0.5} />
    </RoundedBox>
  );
}

const LAPTOP: V3 = [-2.9, 0, 1.35];
const HUB: V3 = [-2.9, 0, -1.6];
const ROUTER: V3 = [0.2, 0, -0.1];
const PARTNERS: V3 = [3.0, 0, -2.0];
const JOBS: V3 = [3.0, 0, 0];
const ENDPOINT: V3 = [3.0, 0, 2.0];

function Laptop({ active, cached, running }: { active: boolean; cached: boolean; running: boolean }) {
  return (
    <Pad position={LAPTOP} w={2.5} d={1.9} active={active} label="tu máquina" tone="teal">
      <RoundedBox args={[1.2, 0.07, 0.8]} position={[-0.45, 0.12, 0.1]} radius={0.03} smoothness={2} castShadow receiveShadow><Physical color="#C7CBC8" metal={0.5} coat={0.4} /></RoundedBox>
      <group position={[-0.45, 0.16, -0.3]} rotation={[-0.25, 0, 0]}>
        <RoundedBox args={[1.2, 0.78, 0.05]} position={[0, 0.39, 0]} radius={0.03} smoothness={2} castShadow><Physical color="#C7CBC8" metal={0.5} coat={0.4} /></RoundedBox>
        <mesh position={[0, 0.39, 0.03]}><planeGeometry args={[1.06, 0.64]} /><meshBasicMaterial color={running ? mixHex("#1B2624", P.teal, 0.35) : "#1B2624"} /></mesh>
      </group>
      <GpuCard position={[0.72, 0.2, 0.35]} color={P.teal} dim={!running} />
      {/* the Hub cache drawer: ~/.cache/huggingface/hub */}
      <group position={[0.72, 0.13, -0.45]}>
        <RoundedBox args={[0.95, 0.18, 0.62]} radius={0.03} smoothness={2} castShadow receiveShadow><Physical color="#4A3A2C" rough={0.6} coat={0.2} /></RoundedBox>
        {cached && [-0.3, -0.1, 0.1, 0.3].map((x) => <Shard key={x} position={[x, 0.16, 0]} />)}
      </group>
      {running && <Tag position={[0.72, 0.55, -0.45]} tone="amber" size="xs" center>{cached ? "caché del Hub" : "caché vacía"}</Tag>}
    </Pad>
  );
}

function HubShelf({ active }: { active: boolean }) {
  return (
    <Pad position={HUB} w={2.2} d={1.4} active={active} label="repo del Hub" tone="amber">
      <RoundedBox args={[1.7, 0.06, 0.8]} position={[0, 0.45, 0]} radius={0.02} smoothness={2} castShadow><Physical color="#6E5440" coat={0.2} /></RoundedBox>
      {[-0.78, 0.78].map((x) => <mesh key={x} position={[x, 0.24, 0]} castShadow><boxGeometry args={[0.05, 0.42, 0.7]} /><meshStandardMaterial color="#6E5440" /></mesh>)}
      {[-0.54, -0.18, 0.18, 0.54].map((x) => <Shard key={x} position={[x, 0.17, 0]} color={active ? P.amber : mixHex(P.paper, P.amber, 0.5)} />)}
      <RoundedBox args={[0.5, 0.36, 0.04]} position={[0, 0.7, 0.1]} radius={0.02} smoothness={2} castShadow><Physical color="#F1EBDD" rough={0.7} coat={0.1} /></RoundedBox>
    </Pad>
  );
}

function Router({ active }: { active: boolean }) {
  return (
    <Pad position={ROUTER} w={1.6} d={1.4} active={active} label="router HF" tone="violet">
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow><cylinderGeometry args={[0.52, 0.58, 0.24, 40]} /><Physical color={active ? P.violet : "#A7A2BE"} coat={0.55} /></mesh>
      <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.3, 0.3, 0.05, 32]} /><meshStandardMaterial color="#B68442" metalness={0.7} roughness={0.3} /></mesh>
      {[-0.6, 0, 0.6].map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.58, 0.2, -Math.sin(a) * 0.58]} rotation={[0, a, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.12, 14]} />
          <meshStandardMaterial color="#2E3B38" />
        </mesh>
      ))}
    </Pad>
  );
}

function PartnerRack({ active }: { active: boolean }) {
  return (
    <Pad position={PARTNERS} w={2.0} d={1.25} active={active} label="GPU de partners" tone="violet">
      {[0, 1, 2].map((k) => <GpuCard key={k} position={[0, 0.22 + k * 0.3, 0]} color={P.violet} dim={!active} />)}
      {[-0.55, 0.55].map((x) => <mesh key={x} position={[x, 0.55, -0.28]} castShadow><boxGeometry args={[0.05, 1.0, 0.05]} /><meshStandardMaterial color="#8A8F88" metalness={0.7} roughness={0.3} /></mesh>)}
    </Pad>
  );
}

function JobRunner({ active }: { active: boolean }) {
  return (
    <Pad position={JOBS} w={2.0} d={1.25} active={active} label="hf jobs" tone="teal">
      <RoundedBox args={[0.7, 0.5, 0.55]} position={[-0.4, 0.33, 0]} radius={0.04} smoothness={2} castShadow receiveShadow><Physical color={active ? "#3E6FA8" : "#A9B6C4"} coat={0.4} /></RoundedBox>
      {[-0.12, 0.12].map((y) => <mesh key={y} position={[-0.4, 0.33 + y, 0.28]}><boxGeometry args={[0.6, 0.03, 0.01]} /><meshBasicMaterial color="#E8EEF4" /></mesh>)}
      <GpuCard position={[0.45, 0.2, 0]} color={P.teal} dim={!active} rotation={[0, Math.PI / 2, 0]} />
    </Pad>
  );
}

function Endpoint({ active, on }: { active: boolean; on: boolean }) {
  return (
    <Pad position={ENDPOINT} w={2.0} d={1.25} active={active} label="endpoint dedicado" tone="amber">
      <GpuCard position={[-0.25, 0.2, 0]} color={P.amber} dim={!active || !on} />
      {/* cage: this GPU is reserved for one URL */}
      {[-0.8, 0.3].flatMap((x) => [-0.4, 0.4].map((z) => <mesh key={`${x}${z}`} position={[x, 0.4, z]}><boxGeometry args={[0.03, 0.7, 0.03]} /><meshStandardMaterial color="#8A8F88" metalness={0.7} roughness={0.3} /></mesh>))}
      <group position={[0.65, 0.35, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.22, 0.22, 0.1, 28]} /><Physical color="#F1EBDD" coat={0.4} /></mesh>
        <mesh position={[0, 0.06, 0]} rotation={[0, on ? -0.9 : 0.9, 0]}><boxGeometry args={[0.02, 0.02, 0.2]} /><meshBasicMaterial color={on ? P.rose : P.muted} /></mesh>
      </group>
      {active && <Tag position={[0.65, 0.75, 0]} tone={on ? "rose" : "muted"} size="xs" center>{on ? "factura" : "pausado"}</Tag>}
    </Pad>
  );
}

const lift = (p: V3, dx = 0, dz = 0, y = 0.95): V3 => [p[0] + dx, y, p[2] + dz];

function PathsScene({ path, cached, on }: { path: Path; cached: boolean; on: boolean }) {
  const localRun = path === "local";
  return (
    <group>
      <ShadowBlob position={[0, -0.14, 0]} scale={10} opacity={0.08} />
      <RoundedBox args={[9.6, 0.16, 6.2]} position={[0.05, -0.1, 0]} radius={0.06} smoothness={3} receiveShadow>
        <meshPhysicalMaterial color="#6E5440" roughness={0.6} clearcoat={0.15} />
      </RoundedBox>
      {/* the property line: in front of it is your hardware, behind it is somebody else's */}
      <Wire points={[[-4.6, 0.01, 0.2], [-1.4, 0.01, 0.2], [-1.4, 0.01, 2.7]]} color={P.teal} dashed opacity={0.8} width={1.4} />
      <Laptop active cached={localRun ? cached : false} running={localRun} />
      <HubShelf active={localRun && !cached} />
      <Router active={path === "providers"} />
      <PartnerRack active={path === "providers"} />
      <JobRunner active={path === "jobs"} />
      <Endpoint active={path === "endpoints"} on={on} />
      {localRun && !cached && (
        <>
          <Flow points={[lift(HUB, 0.3, 0.3, 0.7), lift(HUB, 0.9, 1.4, 1.3), lift(LAPTOP, 0.72, -0.45, 0.7)]} color={P.amber} count={4} size={0.09} speed={0.25} lineOpacity={0.45} width={2} />
          <Tag position={lift(HUB, 1.5, 1.45, 1.35)} tone="amber" size="xs" center>shards · safetensors</Tag>
        </>
      )}
      {localRun && cached && <Flow points={[lift(LAPTOP, 0.72, -0.35, 0.45), lift(LAPTOP, 0.9, 0, 0.6), lift(LAPTOP, 0.72, 0.35, 0.45)]} color={P.teal} count={3} size={0.05} speed={0.5} lineOpacity={0.4} />}
      {path === "providers" && (
        <>
          <Flow points={[lift(LAPTOP, 0.9, -0.5), lift(ROUTER, -0.9, 0.6, 1.1), lift(ROUTER, 0, 0, 0.7)]} color={P.violet} count={3} size={0.045} speed={0.4} lineOpacity={0.4} />
          <Flow points={[lift(ROUTER, 0.5, -0.3, 0.7), lift(PARTNERS, -1.2, 0.5, 1.1), lift(PARTNERS, -0.4, 0, 0.9)]} color={P.violet} count={3} size={0.045} speed={0.4} lineOpacity={0.4} />
          <Tag position={lift(ROUTER, -1.2, 0.95, 1.45)} tone="violet" size="xs" center>solo tokens</Tag>
          <Tag position={lift(ROUTER, 0, 0, 1.2)} tone="violet" size="xs" center>:fastest</Tag>
        </>
      )}
      {path === "endpoints" && (
        <>
          <Flow points={[lift(LAPTOP, 1.0, 0.2), lift(ROUTER, 0, 2.6, 0.7), lift(ENDPOINT, -0.6, 0, 0.8)]} color={P.amber} count={on ? 3 : 0} size={0.045} speed={0.4} lineOpacity={on ? 0.45 : 0.15} />
          <Tag position={lift(ROUTER, 0, 2.6, 1.05)} tone="amber" size="xs" center>URL privada</Tag>
        </>
      )}
      {path === "jobs" && (
        <>
          <Flow points={[lift(LAPTOP, 1.0, -0.2), lift(ROUTER, 0.2, 0.9, 1.2), lift(JOBS, -0.4, 0, 0.8)]} color="#3E6FA8" count={2} size={0.07} speed={0.3} lineOpacity={0.4} />
          <Tag position={lift(ROUTER, 0.2, 0.9, 1.55)} tone="ink" size="xs" center>contenedor</Tag>
        </>
      )}
    </group>
  );
}

function SpanishVisual() {
  const [path, setPath] = useState<Path>("local");
  const [cached, setCached] = useState(false);
  const [tokens, setTokens] = useState(300);
  const [on, setOn] = useState(true);
  const [hours, setHours] = useState(3);
  const weights = GPT2_PARAMS * BYTES_FP32;
  const reply = 250 + tokens * 4;
  const billed = on ? 24 : 0;
  let body: ReactNode;
  let items: { label: string; value: string; tone?: string }[];
  if (path === "local") {
    body = cached
      ? <p><strong>Segunda llamada a <code>pipeline</code>.</strong> <code>from_pretrained</code> encuentra los shards en <code>~/.cache/huggingface/hub</code>: no cruza nada por la red. Tu GPU (o CPU) genera los tokens. Si el portátil está apagado, nadie responde.</p>
      : <p><strong>Primera llamada a <code>pipeline(&quot;text-generation&quot;, model=&quot;openai-community/gpt2&quot;)</code>.</strong> Los pesos bajan del repo del Hub a tu caché: {GPT2_PARAMS.toLocaleString("es-ES")} parámetros × 4 bytes (FP32) ≈ {gb(weights)} GB. Solo ocurre la primera vez.</p>;
    items = [{ label: "por la red", value: cached ? "0 B" : `≈ ${gb(weights)} GB`, tone: "var(--amber)" }, { label: "GPU", value: "la tuya", tone: "var(--teal)" }, { label: "pesos en disco", value: cached ? "sí" : "descargando" }];
  } else if (path === "providers") {
    body = <p><strong>Inference Providers es un router, no un disco.</strong> Tu <code>HF_TOKEN</code> firma un POST con mensajes; el router elige partner según el sufijo (<code>:fastest</code>) y te devuelve tokens. Nunca ves los safetensors: sin LoRA, sin inspeccionar capas, sin modo offline. Una respuesta de {tokens} tokens pesa ≈ {kb(reply)} kB.</p>;
    items = [{ label: "por la red", value: `≈ ${kb(reply)} kB`, tone: "var(--violet)" }, { label: "GPU", value: "de un partner", tone: "var(--violet)" }, { label: "pesos en disco", value: "no" }];
  } else if (path === "endpoints") {
    body = <p><strong>Inference Endpoints: hardware dedicado.</strong> El mismo <code>InferenceClient</code>, con <code>model=</code> apuntando a una URL privada. Pagas mientras corre, también en reposo: {on ? `encendido 24 h para ${hours} h de uso, ${24 - hours} h facturadas sin tráfico (${Math.round(((24 - hours) / 24) * 100)} %).` : "pausado con hf endpoints pause, no factura ni responde."}</p>;
    items = [{ label: "horas facturadas / día", value: String(billed), tone: "var(--rose)" }, { label: "horas con tráfico", value: on ? String(hours) : "0", tone: "var(--amber)" }, { label: "GPU", value: "reservada para ti" }];
  } else {
    body = <p><strong>Jobs: compute por lotes.</strong> <code>hf jobs run --flavor a10g-small --timeout 2h …</code> lanza un contenedor para un script (fine-tune, datos sintéticos, eval offline) y termina. Necesita créditos prepagados. No sirve para contestar un mensaje de chat.</p>;
    items = [{ label: "unidad", value: "un script", tone: "#3E6FA8" }, { label: "vida", value: "hasta el timeout" }, { label: "GPU", value: "del Hub, alquilada" }];
  }
  return (
    <Figure
      label="Cuatro caminos al siguiente token"
      hint="qué cruza el cable · de quién es la GPU"
      height="h-[460px] md:h-[560px]"
      legend={[{ color: P.teal, label: "tu hardware" }, { color: P.amber, label: "pesos / dedicado" }, { color: P.violet, label: "router y partners" }, { color: "#3E6FA8", label: "jobs" }]}
      controls={
        <>
          <Switcher value={path} onChange={setPath} ariaLabel="Camino de inferencia" options={[
            { value: "local", label: "Local", tone: P.teal },
            { value: "providers", label: "Providers", tone: P.violet },
            { value: "endpoints", label: "Endpoints", tone: P.amber },
            { value: "jobs", label: "Jobs", tone: "#3E6FA8" },
          ]} />
          {path === "local" && <Switcher value={cached ? "2" : "1"} onChange={(v) => setCached(v === "2")} ariaLabel="Llamada" options={[{ value: "1", label: "1.ª llamada", tone: P.amber }, { value: "2", label: "2.ª llamada", tone: P.teal }]} />}
          {path === "providers" && <Knob label="tokens de respuesta" value={tokens} min={50} max={2000} step={50} onChange={setTokens} tone="var(--violet)" />}
          {path === "endpoints" && <><Switcher value={on ? "on" : "off"} onChange={(v) => setOn(v === "on")} ariaLabel="Estado del endpoint" options={[{ value: "on", label: "Encendido", tone: P.rose }, { value: "off", label: "Pausado", tone: P.muted }]} /><Knob label="horas de uso" value={hours} min={1} max={24} onChange={setHours} tone="var(--amber)" /></>}
        </>
      }
      note={
        <div className="space-y-3">
          {body}
          <Readout items={items} />
          <p className="text-xs text-muted">Cifras calculadas: tamaño FP32 = parámetros × 4 bytes (el fichero real añade metadatos); bytes de respuesta ≈ 250 B de JSON + 4 bytes por token, estimación didáctica. No se muestran precios: dependen del partner y del hardware el día que gastes.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.0, 6.4, 8.8], fov: 34 }} fit={1.05}>
        <PathsScene path={path} cached={cached} on={on} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

type Step = "local" | "providers" | "endpoints" | "jobs";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "providers": "providers",
      "serverless_router": "serverless router",
      "dedicated_jobs": "dedicated / jobs"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "providers": "proveedores",
      "serverless_router": "router serverless",
      "dedicated_jobs": "dedicado / jobs"
    },
  });

  const OPTIONS = [
    { value: "local" as const, label: "pipeline", tone: "var(--teal)" },
    { value: "providers" as const, label: t.providers, tone: "var(--amber)" },
    { value: "endpoints" as const, label: "endpoints", tone: "var(--violet)" },
    { value: "jobs" as const, label: "jobs", tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("local");

  return (
    <Figure
      label="HF inference paths"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: "weights on this machine" },
        { color: P.amber, label: t.serverless_router },
        { color: P.violet, label: t.dedicated_jobs },
      ]}
      controls={
        <Switcher
          ariaLabel="huggingface inference diagram steps"
          value={step}
          onChange={setStep}
          options={OPTIONS}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.4], fov: 40 }}>
        <Turntable speed={0.035} tilt={0.1}>
          <Scene active={step} />
        </Turntable>
      </Stage>
    </Figure>
  );
}

function Scene({ active }: { active: Step }) {
  return (
    <group>
      {active === "local" ? <LocalScene /> : null}
      {active === "providers" ? <ProvidersScene /> : null}
      {active === "endpoints" ? <EndpointsScene /> : null}
      {active === "jobs" ? <JobsScene /> : null}
    </group>
  );
}

function LocalScene() {
  return (
    <group>
      <Wire points={[[-2.4, 0.15, 0], [2.4, 0.15, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.4, 0.15, 0], [0.2, 0.15, 0]]} color={P.teal} count={3} speed={0.28} />
      <Slab position={[-1.85, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.teal} fill={0.52} />
      <Tag position={[-1.85, 1.55, 0]} tone="teal" center>
        safetensors
      </Tag>
      <Tag position={[-1.85, -0.85, 0]} tone="teal" center>
        Hub cache
      </Tag>
      <Node3D position={[0.15, 0.15, 0]} color={P.teal} radius={0.14} pulse={0.35} />
      <Slab position={[1.9, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.amber} fill={0.48} />
      <Tag position={[1.9, 1.55, 0]} tone="amber" center>
        pipeline
      </Tag>
      <Tag position={[1.9, -0.85, 0]} tone="amber" center>
        this GPU
      </Tag>
    </group>
  );
}

function ProvidersScene() {
  return (
    <group>
      <Wire points={[[-2.5, -0.2, 0], [2.5, -0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.2, 0], [2.5, -0.2, 0]]} color={P.amber} count={3} speed={0.3} />
      <Slab position={[-1.7, 0.5, 0]} size={[2.2, 1.2, 0.14]} color={P.teal} fill={0.5} />
      <Tag position={[-1.7, 1.32, 0]} tone="teal" center>
        HF_TOKEN
      </Tag>
      <Tag position={[-1.7, -0.95, 0]} tone="teal" center>
        Hermes / curl
      </Tag>
      <Slab position={[1.7, 0.5, 0]} size={[2.2, 1.2, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[1.7, 1.32, 0]} tone="amber" center>
        router
      </Tag>
      <Tag position={[1.7, -0.95, 0]} tone="amber" center>
        :fastest
      </Tag>
      <Node3D position={[0, -0.2, 0]} color={P.amber} radius={0.14} pulse={0.35} />
    </group>
  );
}

function EndpointsScene() {
  return (
    <group>
      <Wire points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, 0.1, 0], [2.5, 0.1, 0]]} color={P.violet} count={3} speed={0.28} />
      <Slab position={[-1.85, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.amber} fill={0.5} />
      <Tag position={[-1.85, 1.55, 0]} tone="amber" center>
        Providers
      </Tag>
      <Tag position={[-1.85, -0.85, 0]} tone="amber" center>
        shared
      </Tag>
      <Node3D position={[0.05, 0.1, 0]} color={P.violet} radius={0.14} pulse={0.35} />
      <Slab position={[1.9, 0.85, 0]} size={[1.7, 0.95, 0.14]} color={P.violet} fill={0.48} />
      <Tag position={[1.9, 1.55, 0]} tone="violet" center>
        Endpoints
      </Tag>
      <Tag position={[1.9, -0.85, 0]} tone="violet" center>
        dedicated
      </Tag>
    </group>
  );
}

function JobsScene() {
  const items: { x: number; label: string; tone: "teal" | "amber" | "violet"; color: string }[] = [
    { x: -2.15, label: "hf jobs", tone: "teal", color: P.teal },
    { x: 0.0, label: "TGI / vLLM", tone: "amber", color: P.amber },
    { x: 2.15, label: "your GPU", tone: "violet", color: P.violet },
  ];
  return (
    <group>
      <Wire points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.5, -0.25, 0], [2.5, -0.25, 0]]} color={P.teal} count={3} speed={0.3} />
      <Slab position={[0, 1.35, 0]} size={[1.9, 0.55, 0.12]} color={P.lineStrong} fill={0.22} />
      <Tag position={[0, 1.85, 0]} tone="teal" center>
        self-host later
      </Tag>
      {items.map((it) => (
        <group key={it.label}>
          <Slab position={[it.x, 0.35, 0]} size={[1.55, 0.85, 0.14]} color={it.color} fill={0.52} />
          <Tag position={[it.x, -0.85, 0]} tone={it.tone} center>
            {it.label}
          </Tag>
        </group>
      ))}
    </group>
  );
}
