"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useRef, type ReactNode } from "react";
import { Group } from "three";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { ShadowBlob } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "layer" | "memory" | "route";
const COPY = {
  en: { title: "choose the layer before the tool", hint: "model · harness · metal", layer: "layer", memory: "memory", route: "route", model: "model", harness: "harness", metal: "metal", card: "model card", quant: "quant", local: "local", api: "API", measure: "measure" },
  es: { title: "elige la capa antes que la herramienta", hint: "modelo · arnés · metal", layer: "capa", memory: "memoria", route: "ruta", model: "modelo", harness: "arnés", metal: "metal", card: "ficha", quant: "quant", local: "local", api: "API", measure: "mide" },
};
function LegacyVisual() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("layer");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.model }, { color: P.violet, label: t.harness }, { color: P.amber, label: t.metal }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "layer", label: t.layer, tone: P.teal }, { value: "memory", label: t.memory, tone: P.violet }, { value: "route", label: t.route, tone: P.amber }]} ariaLabel={t.title} />}><Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={90} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
    {mode === "layer" && <>{[[t.model, P.teal, -1.7], [t.harness, P.violet, 0], [t.metal, P.amber, 1.7]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.9, 0.12]} color={color as string} fill={0.22} /><Tag position={[x as number, 0.78, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">primero diagnostica; después eliges comando</Tag></>}
    {mode === "memory" && <><Slab position={[-1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.card}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.quant}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">pesos + KV + contexto real</Tag></>}
    {mode === "route" && <><Node3D position={[-1.7, 0.2, 0]} color={P.teal} radius={0.2} pulse={0.3} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.local}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.55, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.api}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.measure} antes de cambiar de backend</Tag></>}
  </PointerTilt></Stage></Figure>;
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Modelo, arnés y metal como tres capas físicas. Un síntoma levanta la capa
   donde vive el fallo; las otras dos se quedan en su sitio. Los síntomas y
   su diagnóstico salen de los casos de la lección. */

type Layer = "model" | "harness" | "metal";
type Symptom = "oom" | "tools" | "dumb" | "slowfirst" | "decode";
const SYMPTOMS: Record<Symptom, { label: string; layer: Layer; why: string; wrong: string; right: string }> = {
  oom: { label: "OOM a 64k", layer: "metal", why: "La GPU se queda sin memoria para la caché KV al crecer el contexto.", wrong: "reescribir el grafo de LangGraph", right: "menos contexto, otro quant o más memoria" },
  tools: { label: "Ignora las tools", layer: "harness", why: "El perfil no lista las tools y el runtime no parsea tool_calls.", wrong: "cambiar de Hermes a OpenClaw", right: "declarar las tools y parsear tool_calls" },
  dumb: { label: "El instruct «suena tonto»", layer: "model", why: "Se le envía una completion cruda sin su plantilla de chat.", wrong: "descargar un modelo más grande", right: "aplicar la plantilla de la ficha" },
  slowfirst: { label: "Primer token lento", layer: "harness", why: "Cada vuelta paga el prefill de 20k tokens de historial.", wrong: "subir la temperatura", right: "prefijo estable cacheable y compactación" },
  decode: { label: "Decode lento", layer: "metal", why: "Cada token relee los pesos: lo limita el ancho de banda de memoria.", wrong: "reescribir el prompt", right: "quant más pequeño o hardware con más ancho" },
};
const LAYER_INFO: Record<Layer, { label: string; color: string; y: number; tone: "teal" | "violet" | "amber" }> = {
  model: { label: "modelo", color: P.teal, y: 2.2, tone: "teal" },
  harness: { label: "arnés", color: P.violet, y: 1.2, tone: "violet" },
  metal: { label: "metal", color: P.amber, y: 0.2, tone: "amber" },
};

const F = {
  base: "#2C3533",
  deck: "#ECE7DB",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
  pcb: "#1F3B37",
};

function Lift({ lifted, base, children }: { lifted: boolean; base: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (!ref.current) return;
    /* La capa diagnosticada sale como un cajón para verla entera. */
    const k = still ? 1 : Math.min(1, dt * 4);
    ref.current.position.y += (base + (lifted ? 0.08 : 0) - ref.current.position.y) * k;
    ref.current.position.x += ((lifted ? 2.6 : 0) - ref.current.position.x) * k;
  });
  return <group ref={ref} position={[0, base, 0]}>{children}</group>;
}

function MetalLayer({ hot }: { hot: boolean }) {
  return (
    <group>
      <RoundedBox args={[4.2, 0.16, 2.6]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={F.pcb} roughness={0.45} clearcoat={0.4} emissive={hot ? P.amber : "#000"} emissiveIntensity={hot ? 0.12 : 0} />
      </RoundedBox>
      {/* paquete de cómputo y chips de memoria */}
      <RoundedBox args={[1.1, 0.14, 1.1]} position={[0, 0.14, 0]} radius={0.03} smoothness={2} castShadow>
        <meshStandardMaterial color={F.charcoal} metalness={0.5} roughness={0.3} />
      </RoundedBox>
      {Array.from({ length: 8 }, (_, i) => {
        const side = i < 4 ? -1 : 1;
        return (
          <mesh key={i} position={[side * 1.3, 0.13, -0.9 + (i % 4) * 0.6]} castShadow>
            <boxGeometry args={[0.5, 0.1, 0.4]} />
            <meshStandardMaterial color={hot && i % 4 < 3 ? P.amber : "#2E3336"} roughness={0.4} metalness={0.4} />
          </mesh>
        );
      })}
      {[-1.95, 1.95].flatMap((x) => [-1.15, 1.15].map((z) => (
        <mesh key={`${x}:${z}`} position={[x, 0.1, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
          <meshStandardMaterial color={F.brass} metalness={0.8} roughness={0.3} />
        </mesh>
      )))}
    </group>
  );
}

function HarnessLayer({ hot }: { hot: boolean }) {
  return (
    <group>
      <RoundedBox args={[4.2, 0.12, 2.6]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixHex(F.deck, P.violet, hot ? 0.3 : 0.12)} roughness={0.5} clearcoat={0.4} />
      </RoundedBox>
      {/* el bucle y sus piezas: tools, permisos, transcript */}
      <mesh position={[-0.6, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.7, 0.07, 14, 64]} />
        <meshPhysicalMaterial color={P.violet} roughness={0.35} clearcoat={0.5} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <RoundedBox key={i} args={[0.34, 0.3, 0.3]} position={[1.0 + (i % 2) * 0.45, 0.2, -0.6 + i * 0.6]} radius={0.04} smoothness={2} castShadow>
          <meshPhysicalMaterial color={hot && i === 0 ? P.violetWash : F.deck} roughness={0.45} clearcoat={0.4} />
        </RoundedBox>
      ))}
      <mesh position={[1.75, 0.25, 0]}>
        <boxGeometry args={[0.06, 0.4, 2.0]} />
        <meshStandardMaterial color={F.brass} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ModelLayer({ hot }: { hot: boolean }) {
  return (
    <group>
      <RoundedBox args={[4.2, 0.1, 2.6]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixHex(F.deck, P.teal, hot ? 0.3 : 0.1)} roughness={0.5} clearcoat={0.4} />
      </RoundedBox>
      {/* pesos: pila de capas; ficha con la plantilla de chat */}
      {Array.from({ length: 6 }, (_, i) => (
        <RoundedBox key={i} args={[1.6, 0.05, 1.3]} position={[-0.7, 0.1 + i * 0.07, 0]} radius={0.02} smoothness={2} castShadow>
          <meshPhysicalMaterial color={i % 2 ? P.teal : mixHex(P.teal, P.paper, 0.35)} roughness={0.4} clearcoat={0.5} />
        </RoundedBox>
      ))}
      <group position={[1.2, 0.12, 0]} rotation={[0, -0.2, 0]}>
        <RoundedBox args={[1.2, 0.05, 1.5]} radius={0.02} smoothness={2} castShadow>
          <meshStandardMaterial color={P.paper} roughness={0.6} />
        </RoundedBox>
        {[0, 1, 2, 3].map((l) => (
          <mesh key={l} position={[-0.1, 0.03, -0.5 + l * 0.3]}>
            <boxGeometry args={[0.8 - (l % 2) * 0.25, 0.006, 0.06]} />
            <meshStandardMaterial color={hot && l === 2 ? P.rose : P.teal} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function LayerScene({ symptom }: { symptom: Symptom }) {
  const s = SYMPTOMS[symptom];
  const layers: Layer[] = ["metal", "harness", "model"];
  return (
    <PointerTilt amount={0.05}>
      <group>
        <ShadowBlob position={[0, -0.3, 0]} scale={6.5} opacity={0.13} />
        <RoundedBox args={[5, 0.3, 3.3]} position={[0, -0.14, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={F.base} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        {/* separadores entre capas */}
        {[-1.95, 1.95].flatMap((x) => [-1.15, 1.15].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 1.2, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 2.4, 10]} />
            <meshStandardMaterial color={F.steel} metalness={0.8} roughness={0.3} />
          </mesh>
        )))}
        {layers.map((l) => {
          const info = LAYER_INFO[l];
          const hot = s.layer === l;
          return (
            <Lift key={l} lifted={hot} base={info.y}>
              {l === "metal" ? <MetalLayer hot={hot} /> : l === "harness" ? <HarnessLayer hot={hot} /> : <ModelLayer hot={hot} />}
              <Tag position={[-2.55, 0.15, 1.1]} tone={hot ? info.tone : "muted"} size="xs" center>{info.label}</Tag>
            </Lift>
          );
        })}
        <Tag position={[2.6, LAYER_INFO[s.layer].y + 0.8, -0.9]} tone="rose" size="xs" center>{s.label}</Tag>
      </group>
    </PointerTilt>
  );
}

function LayerNote({ symptom }: { symptom: Symptom }) {
  const s = SYMPTOMS[symptom];
  const info = LAYER_INFO[s.layer];
  return (
    <div className="space-y-3">
      <p><strong>{s.label}: capa {info.label}.</strong> {s.why}</p>
      <Readout items={[
        { label: "capa", value: info.label, tone: `var(--${info.tone})` },
        { label: "arreglo en su capa", value: s.right, tone: "var(--teal)" },
        { label: "capa equivocada", value: s.wrong, tone: "var(--rose)" },
      ]} />
      <p className="text-xs text-muted">Orden de diagnóstico: nombra la capa, luego el dialecto (LangGraph, Hermes, llama.cpp…) y solo después la herramienta. Casos de la lección: una semana reescribiendo un grafo que estaba bien por un OOM de KV; un cambio de arnés que no arregló unas tools que nadie había declarado.</p>
    </div>
  );
}

function SpanishVisual() {
  const [symptom, setSymptom] = useState<Symptom>("oom");
  return (
    <Figure
      label="Elige la capa antes que la herramienta"
      hint="modelo · arnés · metal — el síntoma levanta su capa"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "modelo" },
        { color: P.violet, label: "arnés" },
        { color: P.amber, label: "metal" },
      ]}
      note={<LayerNote symptom={symptom} />}
      controls={<Switcher value={symptom} onChange={setSymptom} ariaLabel="Síntoma" options={(Object.keys(SYMPTOMS) as Symptom[]).map((k) => ({ value: k, label: SYMPTOMS[k].label, tone: LAYER_INFO[SYMPTOMS[k].layer].color }))} />}
    >
      <Stage className="h-full w-full" camera={{ position: [3.5, 5, 9], fov: 34 }} fit={1.12}>
        <LayerScene symptom={symptom} />
      </Stage>
    </Figure>
  );
}
