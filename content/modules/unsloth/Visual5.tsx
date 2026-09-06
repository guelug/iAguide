"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Arrow,
  Flow,
  Halo,
  Marker,
  Motes,
  Node3D,
  PointerTilt,
  Slab,
  Tag,
  Wire,
  type V3,
} from "@/components/three/atoms";
import {
  Duct,
  ISO_CAMERA,
  IsoDust,
  IsoFloat,
  IsoFrame,
  PlanTrace,
  Sheet,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type View = "preflight" | "chat" | "export";

const COPY = {
  en: {
    title: "what to remember before an Unsloth run",
    hint: "base · chat template · method · length · export",
    preflight: "preflight",
    chat: "chat",
    export: "export",
    base: "base",
    template: "chat",
    method: "method",
    length: "length",
    output: "export",
    safetensors: "safe",
    gguf: "GGUF",
    qlora: "QLoRA",
    lora: "LoRA",
    full: "full",
    train: "train",
    serve: "serve",
    user: "user",
    assistant: "assistant",
    roles: "roles",
    eos: "EOS",
    adapter: "adapter",
    merged: "16-bit",
    vllm: "vLLM",
    local: "local",
    preflightNote:
      "Before training, write five lines: a safetensors or unsloth-bnb-4bit base, one chat template, one VRAM method, a defensible max_seq_length, and the export you will serve. GGUF is an output, not a training base.",
    chatNote:
      "Render each row with the model's chat template and keep the same template and EOS in training and serving. A smooth Unsloth preview can still loop in Ollama or vLLM when the wrapper differs.",
    exportNote:
      "After SFT, adapters stay small and reload on the same base, GGUF q4_k_m is the local path, and merged 16-bit is the vLLM path. Pick one destination before the run.",
  },
  es: {
    title: "qué conviene recordar antes de Unsloth",
    hint: "base · plantilla · método · longitud · salida",
    preflight: "preflight",
    chat: "chat",
    export: "salida",
    base: "base",
    template: "chat",
    method: "modo",
    length: "len",
    output: "salida",
    safetensors: "safe",
    gguf: "GGUF",
    qlora: "QLoRA",
    lora: "LoRA",
    full: "full",
    train: "train",
    serve: "serve",
    user: "user",
    assistant: "assistant",
    roles: "roles",
    eos: "EOS",
    adapter: "adapter",
    merged: "16-bit",
    vllm: "vLLM",
    local: "local",
    preflightNote:
      "Antes de entrenar, escribe cinco líneas: una base safetensors o unsloth-bnb-4bit, una plantilla de chat, un método de VRAM, un max_seq_length defendible y la salida que vas a servir. GGUF es una salida, no una base de entrenamiento.",
    chatNote:
      "Renderiza cada fila con la plantilla de chat del modelo y conserva la misma plantilla y EOS al entrenar y al servir. Una preview fluida en Unsloth puede entrar en bucle en Ollama o vLLM si cambia el envoltorio.",
    exportNote:
      "Después de SFT, los adapters siguen siendo pequeños y se recargan sobre la misma base, GGUF q4_k_m es la ruta local y 16-bit fusionado es la ruta vLLM. Elige destino antes de arrancar.",
  },
};

type Copy = (typeof COPY)["es"];

function GroundTrace({
  points,
  y,
  color,
  opacity,
}: {
  points: [number, number][];
  y?: number;
  color: string;
  opacity?: number;
}) {
  return (
    <group userData={{ noFit: true }}>
      <PlanTrace points={points} y={y} color={color} opacity={opacity} />
    </group>
  );
}

const GATES: { key: keyof Pick<Copy, "base" | "template" | "method" | "length" | "output">; color: string; tone: "teal" | "amber" | "violet" | "rose"; position: V3 }[] = [
  { key: "base", color: P.teal, tone: "teal", position: [-4.8, 0.75, 0.45] },
  { key: "template", color: P.amber, tone: "amber", position: [-2.4, 1.35, -0.25] },
  { key: "method", color: P.violet, tone: "violet", position: [0, 1.9, 0.45] },
  { key: "length", color: P.amber, tone: "amber", position: [2.4, 1.35, -0.25] },
  { key: "output", color: P.teal, tone: "teal", position: [4.8, 0.75, 0.45] },
];

function Gate({
  gate,
  index,
  t,
}: {
  gate: (typeof GATES)[number];
  index: number;
  t: Copy;
}) {
  return (
    <group position={gate.position}>
      <Slab position={[0, 0, 0]} size={[1.65, 0.78, 0.16]} color={gate.color} fill={0.78} rim={0.98} />
      <Marker position={[-0.62, 0.34, 0.2]} n={index + 1} color={gate.color} />
      <Tag position={[0.12, 0.02, 0.27]} tone={gate.tone} size="xs" center>
        {t[gate.key]}
      </Tag>
      <Node3D position={[0.62, 0.06, 0.18]} color={gate.color} radius={0.08} pulse={0.8 + index * 0.18} matte />
    </group>
  );
}

function PreflightView({ t }: { t: Copy }) {
  return (
    <>
      <GroundTrace points={[[-5.7, 3.7], [-4.8, 3.7], [-4.8, 1.45], [4.8, 1.45], [4.8, 3.7], [5.7, 3.7]]} y={-0.03} color={P.lineStrong} opacity={0.45} />
      {GATES.map((gate, i) => (
        <Gate key={gate.key} gate={gate} index={i} t={t} />
      ))}
      {GATES.slice(0, -1).map((gate, i) => (
        <Arrow
          key={gate.key}
          from={[gate.position[0] + 0.82, gate.position[1] + 0.03, gate.position[2] + 0.12]}
          to={[GATES[i + 1].position[0] - 0.82, GATES[i + 1].position[1] - 0.03, GATES[i + 1].position[2] + 0.12]}
          color={P.inkSoft}
          width={1.35}
          opacity={0.72}
          head={0.1}
          bow={0.15}
        />
      ))}
      <group position={[-4.8, -0.45, 0.46]}>
        <Slab position={[0, 0, 0]} size={[1.48, 0.5, 0.13]} color={P.rose} fill={0.72} rim={0.9} />
        <Tag position={[0, 0.02, 0.22]} tone="rose" size="xs" center>
          {t.gguf}
        </Tag>
        <Wire points={[[0.08, 0.24, 0.22], [0.52, 0.58, 0.22]]} color={P.rose} width={1.8} dashed />
      </group>
      <Tag position={[0, -1.08, 0.38]} tone="muted" size="xs" center>
        {t.safetensors} · {t.method}
      </Tag>
      <Halo position={[0, 1.85, 0.44]} radius={0.95} color={P.violet} opacity={0.16} spin={0.1} />
    </>
  );
}

function ChatLane({
  position,
  color,
  label,
  t,
}: {
  position: V3;
  color: string;
  label: string;
  t: Copy;
}) {
  return (
    <group position={position}>
      <Slab position={[0, 1.32, 0]} size={[2.22, 2.35, 0.18]} color={color} fill={0.68} rim={0.94} />
      <Sheet position={[0, 0.3, 0.09]} size={[1.75, 1.14]} color={color} fill={0.82} marks={3} markColor={color} />
      <Tag position={[0, 2.48, 0.2]} tone={color === P.teal ? "teal" : "violet"} size="xs" center>
        {label}
      </Tag>
      <Tag position={[0, 0.8, 0.38]} tone="ink" size="xs" center>
        {t.template}
      </Tag>
      <Tag position={[0, 0.28, 0.38]} tone="muted" size="xs" center>
        {t.roles}
      </Tag>
      <Node3D position={[0.63, 0.05, 0.2]} color={color} radius={0.08} pulse={0.75} matte />
    </group>
  );
}

function ChatView({ t }: { t: Copy }) {
  return (
    <>
      <GroundTrace points={[[-5.5, 3.7], [-3.1, 3.7], [-3.1, 1.45], [3.1, 1.45], [3.1, 3.7], [5.5, 3.7]]} y={-0.03} color={P.lineStrong} opacity={0.4} />
      <ChatLane position={[-3.2, 0, 0.55]} color={P.teal} label={t.train} t={t} />
      <ChatLane position={[3.2, 0, -0.35]} color={P.violet} label={t.serve} t={t} />
      <Slab position={[0, 1.52, 0.1]} size={[1.55, 0.72, 0.14]} color={P.amber} fill={0.78} rim={0.96} />
      <Tag position={[0, 1.53, 0.36]} tone="amber" size="xs" center>
        {t.eos}
      </Tag>
      <Duct from={[-1.98, 1.36, 0.55]} to={[-0.84, 1.52, 0.17]} color={P.amber} radius={0.055} bend={0.42} />
      <Duct from={[0.84, 1.52, 0.17]} to={[1.98, 1.36, -0.35]} color={P.amber} radius={0.055} bend={0.58} />
      <Flow points={[[-1.95, 1.38, 0.56], [-0.82, 1.53, 0.18], [1.98, 1.37, -0.34]]} color={P.amber} count={3} speed={0.2} size={0.045} lineOpacity={0} />
      <Wire points={[[-2.3, 0.72, 0.55], [0, -0.6, 0.16], [2.3, 0.72, -0.35]]} color={P.teal} width={1.1} dashed />
      <Tag position={[0, -0.92, 0.36]} tone="muted" size="xs" center>
        {t.eos}
      </Tag>
      <IsoDust count={26} center={[0, 1.2, 0.18]} spread={[2.9, 1.1, 1.1]} color={P.faint} size={0.024} />
    </>
  );
}

function ExportArtifact({
  position,
  label,
  destination,
  color,
  tone,
  sublabel,
}: {
  position: V3;
  label: string;
  destination: string;
  color: string;
  tone: "teal" | "amber" | "violet";
  sublabel?: string;
}) {
  return (
    <group position={position}>
      <Sheet position={[0, 0.3, 0.08]} size={[1.95, 1.28]} color={color} fill={0.82} marks={4} markColor={color} />
      <Slab position={[0, 1.14, 0]} size={[1.9, 0.7, 0.14]} color={color} fill={0.78} rim={0.98} />
      <Tag position={[0, 1.14, 0.28]} tone={tone} size="xs" center>
        {label}
      </Tag>
      <Tag position={[0, -0.5, 0.27]} tone="muted" size="xs" center>
        {destination}
      </Tag>
      {sublabel ? (
        <Tag position={[0, -0.76, 0.27]} tone={tone} size="xs" center>
          {sublabel}
        </Tag>
      ) : null}
      <Node3D position={[0.72, 0.35, 0.2]} color={color} radius={0.08} pulse={0.95} matte />
    </group>
  );
}

function ExportView({ t }: { t: Copy }) {
  return (
    <>
      <GroundTrace points={[[-5.7, 3.7], [-2.8, 3.7], [-2.8, 2.0], [0, 2.0], [2.8, 2.0], [2.8, 3.7], [5.7, 3.7]]} y={-0.03} color={P.lineStrong} opacity={0.42} />
      <IsoFloat amount={0.035} speed={0.42} seed={1.1}>
        <group>
          <Slab position={[0, 2.25, 0.12]} size={[2.0, 0.88, 0.18]} color={P.violetDeep} fill={0.8} rim={0.98} />
          <Node3D position={[-0.54, 2.25, 0.32]} color={P.violet} radius={0.08} pulse={0.7} matte />
          <Node3D position={[0, 2.25, 0.32]} color={P.violet} radius={0.08} pulse={1.1} matte />
          <Node3D position={[0.54, 2.25, 0.32]} color={P.violet} radius={0.08} pulse={1.5} matte />
          <Tag position={[0, 2.25, 0.55]} tone="violet" size="xs" center>
            SFT
          </Tag>
        </group>
      </IsoFloat>
      <ExportArtifact position={[-3.25, 0.1, 0.55]} label={t.adapter} destination={t.train} color={P.teal} tone="teal" />
      <ExportArtifact position={[0, -0.05, -0.45]} label={t.gguf} destination={t.local} color={P.amber} tone="amber" sublabel="q4_k_m" />
      <ExportArtifact position={[3.25, 0.1, 0.55]} label={t.merged} destination={t.vllm} color={P.violet} tone="violet" />
      <Duct from={[-0.82, 2.05, 0.28]} to={[-2.25, 1.2, 0.63]} color={P.teal} radius={0.058} bend={0.38} />
      <Duct from={[0, 1.82, 0.24]} to={[0, 0.75, -0.24]} color={P.amber} radius={0.058} bend={0.5} />
      <Duct from={[0.82, 2.05, 0.28]} to={[2.25, 1.2, 0.63]} color={P.violet} radius={0.058} bend={0.62} />
      <Flow points={[[-0.82, 2.05, 0.3], [-1.6, 1.62, 0.46], [-2.26, 1.2, 0.63]]} color={P.teal} count={2} speed={0.2} size={0.045} lineOpacity={0} />
      <Flow points={[[0.82, 2.05, 0.3], [1.6, 1.62, 0.47], [2.26, 1.2, 0.63]]} color={P.violet} count={2} speed={0.19} size={0.045} lineOpacity={0} />
      <Halo position={[0, 2.25, 0.25]} radius={1.1} color={P.violet} opacity={0.17} spin={0.1} />
    </>
  );
}

export default function Visual5() {
  const t = useCopy(COPY);
  const [view, setView] = useState<View>("preflight");
  const note = view === "preflight" ? t.preflightNote : view === "chat" ? t.chatNote : t.exportNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.base },
        { color: P.amber, label: t.template },
        { color: P.violet, label: t.method },
        { color: P.rose, label: t.gguf },
      ]}
      controls={
        <Switcher
          value={view}
          onChange={setView}
          options={[
            { value: "preflight", label: t.preflight, tone: P.teal },
            { value: "chat", label: t.chat, tone: P.amber },
            { value: "export", label: t.export, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      note={note}
      height="h-[410px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={14} depth={11.2} y={-0.04} />
        <Motes count={42} radius={7} opacity={0.2} />
        <PointerTilt amount={0.055}>
          {view === "preflight" ? <PreflightView t={t} /> : null}
          {view === "chat" ? <ChatView t={t} /> : null}
          {view === "export" ? <ExportView t={t} /> : null}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}
