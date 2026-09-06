"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Flow,
  Halo,
  Motes,
  Node3D,
  PointerTilt,
  Slab,
  Tag,
  Wire,
} from "@/components/three/atoms";
import {
  AxisLine,
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

type View = "outputs" | "families" | "safety";

const COPY = {
  en: {
    title: "checkpoint: the graph's artist brain",
    hint: "outputs · families · file safety",
    outputs: "outputs",
    families: "families",
    safety: "safety",
    checkpoint: "checkpoint",
    model: "MODEL",
    clip: "CLIP",
    vae: "VAE",
    prompt: "prompt",
    latent: "latent",
    rgb: "RGB",
    cond: "cond",
    denoise: "denoise",
    decode: "decode",
    sd15: "SD1.5",
    sdxl: "SDXL",
    flux: "Flux",
    safe: "safe",
    pickle: "pickle",
    custom: "custom",
    outputsNote:
      "Load Checkpoint wakes one weight file and exposes MODEL, CLIP and sometimes VAE. The graph still has to wire each output to the matching node.",
    familiesNote:
      "SD 1.5, SDXL and Flux are families with different latent and text stacks. Treat them as concepts with their own pairing, never as a ranking.",
    safetyNote:
      "safetensors stores tensors without pickle execution. A community checkpoint may still need a custom node and its dependencies; read the card before loading it.",
  },
  es: {
    title: "checkpoint: el cerebro del grafo",
    hint: "salidas · familias · seguridad del fichero",
    outputs: "salidas",
    families: "familias",
    safety: "seguridad",
    checkpoint: "checkpoint",
    model: "MODEL",
    clip: "CLIP",
    vae: "VAE",
    prompt: "prompt",
    latent: "latente",
    rgb: "RGB",
    cond: "cond",
    denoise: "denoise",
    decode: "decode",
    sd15: "SD1.5",
    sdxl: "SDXL",
    flux: "Flux",
    safe: "sin pickle",
    pickle: "pickle",
    custom: "nodos extra",
    outputsNote:
      "Load Checkpoint despierta un fichero de pesos y expone MODEL, CLIP y a veces VAE como salidas paralelas. CLIP convierte el prompt en condicionamiento para el denoiser; el VAE decodifica el latente a RGB.",
    familiesNote:
      "SD 1.5, SDXL y Flux son familias con pilas latentes y de texto distintas. Trátalas como conceptos con su propio emparejamiento, nunca como un ranking.",
    safetyNote:
      "safetensors guarda tensores sin ejecutar pickle. Un checkpoint de comunidad todavía puede necesitar nodos extra y sus dependencias; lee la ficha antes de cargarlo.",
  },
};

function OutputPort({
  position,
  label,
  color,
  active,
}: {
  position: [number, number, number];
  label: string;
  color: string;
  active: boolean;
}) {
  return (
    <group position={position}>
      <Slab
        position={[0, 0, 0]}
        size={[1.55, 0.82, 0.16]}
        color={color}
        fill={active ? 0.78 : 0.26}
        rim={active ? 1 : 0.42}
      />
      <Node3D position={[0, 0, 0.16]} color={color} radius={0.12} pulse={active ? 1.2 : 0} />
      <Tag position={[0, -0.03, 0.28]} tone={active ? "ink" : "muted"} size="xs" center>
        {label}
      </Tag>
    </group>
  );
}

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

function OutputView({ t }: { t: (typeof COPY)["es"] }) {
  return (
    <>
      <GroundTrace
        points={[
          [-5.5, 3.8],
          [-3.5, 3.8],
          [-3.5, 2.35],
          [-1.3, 2.35],
        ]}
        y={-0.03}
        color={P.teal}
        opacity={0.58}
      />
      <GroundTrace
        points={[
          [1.1, 2.45],
          [3.0, 2.45],
          [3.0, 3.8],
          [5.3, 3.8],
        ]}
        y={-0.03}
        color={P.violet}
        opacity={0.45}
      />

      <IsoFloat amount={0.04} speed={0.45} seed={0.3}>
        <group>
          <Sheet position={[-0.04, 0.34, 0.14]} size={[2.1, 1.35]} color={P.violetWash} fill={0.92} marks={5} markColor={P.violet} />
          <Sheet position={[0.02, 0.43, 0.08]} size={[2.1, 1.35]} color={P.violetWash} fill={0.62} marks={4} markColor={P.violet} />
          <Slab position={[0, 1.44, 0]} size={[2.25, 1.42, 0.22]} color={P.violetDeep} fill={0.82} rim={0.98} />
          <Halo position={[0, 1.48, 0.16]} radius={0.9} color={P.violet} opacity={0.23} spin={0.12} />
          <Tag position={[0, 2.55, 0.25]} tone="violet" size="xs" center>
            {t.checkpoint}
          </Tag>
        </group>
      </IsoFloat>

      <Slab position={[-3.38, 1.35, -0.65]} size={[1.8, 1.45, 0.2]} color={P.tealWash} fill={0.9} rim={0.88} />
      <Tag position={[-3.38, 2.2, -0.42]} tone="teal" size="xs" center>
        {t.prompt}
      </Tag>
      <OutputPort position={[2.1, 1.2, 0.86]} label={t.model} color={P.teal} active />
      <OutputPort position={[2.1, 2.38, -0.26]} label={t.clip} color={P.amber} active />
      <OutputPort position={[2.1, 0.18, 1.05]} label={t.vae} color={P.violet} active />
      <Wire points={[[-1.05, 1.58, 0.08], [1.3, 1.2, 0.82]]} color={P.teal} width={1.4} />
      <Wire points={[[1.05, 1.72, 0.08], [1.3, 2.38, -0.22]]} color={P.amber} width={1.4} />
      <Wire points={[[1.05, 1.15, 0.08], [1.3, 0.2, 1.0]]} color={P.violet} width={1.4} />

      <Flow points={[[ -2.45, 1.43, -0.35], [0.2, 1.92, -0.08], [1.3, 2.38, -0.22]]} color={P.amber} count={3} size={0.05} width={1.7} />
      <Tag position={[-3.38, 0.3, -0.42]} tone="muted" size="xs" center>
        {t.prompt}
      </Tag>
      <Slab position={[4.02, 1.2, 0.4]} size={[1.55, 0.82, 0.18]} color={P.tealDeep} fill={0.8} rim={0.96} />
      <Tag position={[4.02, 1.2, 0.68]} tone="teal" size="xs" center>
        {t.denoise}
      </Tag>
      <Flow points={[[2.86, 1.23, 0.84], [3.35, 1.22, 0.62], [3.95, 1.2, 0.48]]} color={P.teal} count={3} size={0.05} lineOpacity={0} />
      <Flow points={[[2.86, 2.38, -0.25], [3.35, 1.74, 0.1], [3.95, 1.28, 0.44]]} color={P.amber} count={3} size={0.045} lineOpacity={0} />
      <Slab position={[4.02, 0.05, 1.18]} size={[1.45, 0.68, 0.16]} color={P.tealWash} fill={0.9} rim={0.9} />
      <Tag position={[4.02, 0.05, 1.43]} tone="teal" size="xs" center>
        {t.latent}
      </Tag>
      <Flow points={[[3.98, 0.86, 0.5], [4.02, 0.5, 0.82], [4.02, 0.16, 1.1]]} color={P.teal} count={2} size={0.04} lineOpacity={0} />
      <Slab position={[4.02, -1.05, 0.18]} size={[1.45, 0.68, 0.16]} color={P.violetWash} fill={0.9} rim={0.9} />
      <Tag position={[4.02, -1.05, 0.43]} tone="violet" size="xs" center>
        {t.decode}
      </Tag>
      <Flow points={[[3.98, -0.7, 1.04], [4.02, -0.82, 0.64], [4.02, -0.98, 0.27]]} color={P.teal} count={2} size={0.04} lineOpacity={0} />
      <Flow points={[[2.86, 0.18, 1.05], [3.45, -0.32, 0.62], [3.98, -0.98, 0.24]]} color={P.violet} count={2} size={0.04} lineOpacity={0} />
      <Slab position={[5.65, -1.05, 0.18]} size={[1.45, 0.68, 0.16]} color={P.tealWash} fill={0.9} rim={0.9} />
      <Tag position={[5.65, -1.05, 0.43]} tone="teal" size="xs" center>
        {t.rgb}
      </Tag>
      <Flow points={[[4.75, -1.05, 0.18], [5.1, -1.05, 0.18], [5.55, -1.05, 0.18]]} color={P.teal} count={2} size={0.04} lineOpacity={0} />
      <IsoDust count={24} center={[0, 1.2, 0]} spread={[3.8, 1.3, 1.2]} color={P.faint} size={0.025} />
    </>
  );
}

function FamilyCard({
  position,
  label,
  color,
  size,
}: {
  position: [number, number, number];
  label: string;
  color: string;
  size: number;
}) {
  return (
    <group position={position}>
      <Slab position={[0, 1.14, 0]} size={[2.18, 2.1, 0.18]} color={color} fill={0.72} rim={0.98} />
      <Sheet position={[0.06, 0.24, 0.08]} size={[1.58, 1.12]} color={color} fill={0.86} marks={4} markColor={color} />
      <Slab position={[0, 1.35, 0.18]} size={[size, size, 0.24]} color={color} fill={0.76} rim={0.9} />
      <Tag position={[0, 2.37, 0.18]} tone={color === P.teal ? "teal" : color === P.amber ? "amber" : "violet"} size="xs" center>
        {label}
      </Tag>
      <Node3D position={[0, 2.08, 0.38]} color={color} radius={0.09} pulse={0.8} matte />
    </group>
  );
}

function FamilyView({ t }: { t: (typeof COPY)["es"] }) {
  return (
    <>
      <GroundTrace points={[[-5.6, 3.7], [5.6, 3.7]]} y={-0.03} color={P.lineStrong} opacity={0.45} />
      <FamilyCard position={[-3.2, 0, 0.65]} label={t.sd15} color={P.teal} size={1.12} />
      <FamilyCard position={[0, 0, 0.65]} label={t.sdxl} color={P.amber} size={1.48} />
      <FamilyCard position={[3.2, 0, 0.65]} label={t.flux} color={P.violet} size={1.34} />
      <Wire points={[[-2.05, 1.22, 0.85], [-1.12, 1.22, 0.85]]} color={P.lineStrong} width={1.4} dashed />
      <Wire points={[[1.12, 1.22, 0.85], [2.05, 1.22, 0.85]]} color={P.lineStrong} width={1.4} dashed />
      <AxisLine from={[-4.8, 0.05, -0.4]} to={[4.8, 0.05, -0.4]} overrun={0.35} color={P.lineStrong} opacity={0.32} />
    </>
  );
}

function SafetyView({ t }: { t: (typeof COPY)["es"] }) {
  return (
    <>
      <GroundTrace points={[[-5.8, 3.7], [-1.4, 3.7], [-1.4, 1.7]]} y={-0.03} color={P.teal} opacity={0.55} />
      <GroundTrace points={[[5.8, -3.7], [1.7, -3.7], [1.7, -1.8]]} y={-0.03} color={P.rose} opacity={0.55} />
      <group position={[-2.75, 0, 0.45]}>
        <IsoFloat amount={0.04} speed={0.5} seed={0.6}>
          <Sheet position={[0, 0.35, 0.08]} size={[2.05, 1.38]} color={P.tealWash} fill={0.8} marks={5} markColor={P.teal} />
          <Sheet position={[0.03, 0.46, 0.03]} size={[2.05, 1.38]} color={P.tealWash} fill={0.48} marks={4} markColor={P.teal} />
          <Slab position={[0, 1.32, 0]} size={[2.12, 1.1, 0.18]} color={P.teal} fill={0.78} rim={0.96} />
          <Tag position={[0, 2.12, 0.2]} tone="teal" size="xs" center>
            {t.safe}
          </Tag>
          <Node3D position={[0.78, 1.57, 0.22]} color={P.teal} radius={0.12} pulse={1} />
        </IsoFloat>
      </group>
      <group position={[2.75, 0, -0.35]}>
        <IsoFloat amount={0.04} speed={0.5} seed={1.8}>
          <Sheet position={[0, 0.35, 0.08]} size={[2.05, 1.38]} color={P.roseWash} fill={0.75} marks={5} markColor={P.rose} />
          <Sheet position={[0.03, 0.46, 0.03]} size={[2.05, 1.38]} color={P.roseWash} fill={0.44} marks={4} markColor={P.rose} />
          <Slab position={[0, 1.32, 0]} size={[2.12, 1.1, 0.18]} color={P.rose} fill={0.78} rim={0.96} />
          <Tag position={[0, 2.12, 0.2]} tone="rose" size="xs" center>
            {t.pickle}
          </Tag>
          <Node3D position={[0.78, 1.57, 0.22]} color={P.rose} radius={0.12} pulse={1.5} />
        </IsoFloat>
      </group>
      <Flow points={[[-1.55, 1.36, 0.54], [0, 1.36, 0.15], [1.55, 1.36, -0.24]]} color={P.lineStrong} count={3} size={0.045} lineOpacity={0.38} />
      <Slab position={[0, -0.25, 0.22]} size={[2.2, 0.62, 0.14]} color={P.amber} fill={0.76} rim={0.94} />
      <Tag position={[0, -0.26, 0.45]} tone="amber" size="xs" center>
        {t.custom}
      </Tag>
      <Duct from={[2.1, 0.7, -0.28]} to={[0.75, 0.02, 0.16]} color={P.rose} radius={0.055} bend={0.35} />
      <Wire points={[[-1.55, 0.7, 0.55], [-0.75, 0.02, 0.16]]} color={P.teal} width={1.8} dashed />
      <Tag position={[0, 1.15, 0.42]} tone="muted" size="xs" center>
        {t.checkpoint}
      </Tag>
      <Halo position={[-2.75, 1.3, 0.48]} radius={1.05} color={P.teal} opacity={0.18} />
      <Halo position={[2.75, 1.3, -0.32]} radius={1.05} color={P.rose} opacity={0.2} />
    </>
  );
}

export default function Visual4() {
  const t = useCopy(COPY);
  const [view, setView] = useState<View>("outputs");
  const note = view === "outputs" ? t.outputsNote : view === "families" ? t.familiesNote : t.safetyNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.model },
        { color: P.amber, label: t.clip },
        { color: P.violet, label: t.vae },
        { color: P.rose, label: t.pickle },
      ]}
      controls={
        <Switcher
          value={view}
          onChange={setView}
          options={[
            { value: "outputs", label: t.outputs, tone: P.teal },
            { value: "families", label: t.families, tone: P.violet },
            { value: "safety", label: t.safety, tone: P.rose },
          ]}
          ariaLabel={t.title}
        />
      }
      note={note}
      height="h-[410px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={13.4} depth={11.3} y={-0.04} />
        <Motes count={42} radius={7} opacity={0.2} />
        <PointerTilt amount={0.055}>
          {view === "outputs" ? <OutputView t={t} /> : null}
          {view === "families" ? <FamilyView t={t} /> : null}
          {view === "safety" ? <SafetyView t={t} /> : null}
        </PointerTilt>
      </Stage>
    </Figure>
  );
}
