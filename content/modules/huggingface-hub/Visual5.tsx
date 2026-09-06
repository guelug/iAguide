"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Flow,
  Halo,
  Lattice,
  Motes,
  Node3D,
  PointerTilt,
  Slab,
  Tag,
  Wire,
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

type RepoType = "model" | "dataset" | "space";

const COPY = {
  en: {
    title: "three repo types, one Git contract",
    hint: "model · dataset · Space · Xet",
    model: "model",
    dataset: "dataset",
    space: "Space",
    repo: "repo",
    git: "Git",
    xet: "Xet",
    weights: "weights",
    card: "card",
    config: "config",
    widget: "widget",
    rows: "rows",
    data: "data",
    stream: "stream",
    code: "code",
    sdk: "SDK",
    gpu: "GPU",
    app: "app",
    modelNote:
      "A model repo keeps weights, a model card and configs. Its inference widget is a demo on the page; the commit history remains the contract.",
    datasetNote:
      "A dataset repo keeps rows and a Dataset Card. Data Studio can preview it, while the datasets client can stream data that does not fit in RAM.",
    spaceNote:
      "A Space is a Git repo that runs. Gradio, Streamlit, Docker or static HTML supply the app surface; compute is the extra dimension.",
  },
  es: {
    title: "tres tipos de repo, un contrato Git",
    hint: "modelo · dataset · Space · Xet",
    model: "modelo",
    dataset: "dataset",
    space: "Space",
    repo: "repo",
    git: "Git",
    xet: "Xet",
    weights: "pesos",
    card: "card",
    config: "config",
    widget: "widget",
    rows: "filas",
    data: "datos",
    stream: "stream",
    code: "código",
    sdk: "SDK",
    gpu: "GPU",
    app: "app",
    modelNote:
      "Un repo de modelo guarda pesos, model card y configs. Su widget de inferencia es una demo de la página; el historial de commits sigue siendo el contrato.",
    datasetNote:
      "Un repo de dataset guarda filas y Dataset Card. Data Studio puede previsualizarlo y el cliente datasets puede hacer streaming sin cargarlo entero en RAM.",
    spaceNote:
      "Un Space es un repo Git que se ejecuta. Gradio, Streamlit, Docker o HTML estático ponen la superficie; el compute es la dimensión extra.",
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

function RepoCore({ type, t }: { type: RepoType; t: Copy }) {
  const color = type === "model" ? P.teal : type === "dataset" ? P.amber : P.violet;
  const tone = type === "model" ? "teal" : type === "dataset" ? "amber" : "violet";
  const name = t[type];

  return (
    <>
      <GroundTrace points={[[-5.7, 3.7], [-2.4, 3.7], [-2.4, 1.95], [0, 1.95]]} y={-0.03} color={color} opacity={0.5} />
      <GroundTrace points={[[0, -1.5], [2.3, -1.5], [2.3, -3.65], [5.6, -3.65]]} y={-0.03} color={P.lineStrong} opacity={0.38} />

      <IsoFloat amount={0.035} speed={0.42} seed={0.5}>
        <group>
          <Sheet position={[0.04, 0.32, 0.12]} size={[2.48, 1.62]} color={P.surface} fill={0.9} marks={5} markColor={color} />
          <Sheet position={[0.08, 0.44, 0.06]} size={[2.48, 1.62]} color={P.surface} fill={0.82} marks={4} markColor={color} />
          <Slab position={[0, 1.75, 0]} size={[2.7, 2.15, 0.2]} color={color} fill={0.72} rim={0.98} />
          <Slab position={[0, 1.78, 0.17]} size={[1.2, 1.2, 0.28]} color={color} fill={0.76} rim={0.9} />
          <Tag position={[0, 3.02, 0.24]} tone={tone} size="xs" center>
            {name}
          </Tag>
          <Tag position={[0, 0.02, 0.45]} tone="ink" size="xs" center>
            {t.repo}
          </Tag>
        </group>
      </IsoFloat>

      <Slab position={[-0.05, -0.7, 0.24]} size={[1.1, 0.48, 0.12]} color={P.inkSoft} fill={0.76} />
      <Tag position={[-0.05, -0.7, 0.46]} tone="ink" size="xs" center>
        {t.git}
      </Tag>
      <Wire points={[[-1.28, 0.62, 0.18], [-0.65, 0.32, 0.2], [-0.05, -0.42, 0.22]]} color={P.lineStrong} width={1.2} dashed />

      <group position={[3.08, 0.98, 0.04]}>
        <Slab position={[0, 0.42, 0]} size={[1.68, 1.5, 0.14]} color={P.amberWash} fill={0.72} rim={0.72} />
        <Lattice
          cells={Array.from({ length: 12 }, (_, i) => ({
            position: [-0.62 + (i % 4) * 0.42, -0.26 + Math.floor(i / 4) * 0.42, 0.18] as [number, number, number],
            color: i % 3 === 0 ? P.amber : i % 3 === 1 ? P.teal : P.violet,
          }))}
          size={0.16}
          opacity={0.88}
          matte
        />
        <Tag position={[0, 1.38, 0.2]} tone="amber" size="xs" center>
          {t.xet}
        </Tag>
        <Node3D position={[0.76, 0.45, 0.28]} color={P.amber} radius={0.09} pulse={0.9} matte />
      </group>
      <Duct from={[1.18, 1.62, 0.14]} to={[2.38, 1.18, 0.18]} color={P.amber} radius={0.055} bend={0.5} />
      <Flow points={[[1.2, 1.63, 0.16], [1.85, 1.39, 0.17], [2.4, 1.18, 0.18]]} color={P.amber} count={3} speed={0.22} size={0.045} lineOpacity={0} />
      <IsoDust count={28} center={[1.7, 1.2, 0.2]} spread={[1.2, 0.8, 0.8]} color={P.faint} size={0.024} />
    </>
  );
}

function DataPlate({
  position,
  label,
  color,
  tone,
  active,
}: {
  position: [number, number, number];
  label: string;
  color: string;
  tone: "teal" | "amber" | "violet";
  active: boolean;
}) {
  return (
    <group position={position}>
      <Slab position={[0, 0, 0]} size={[1.68, 0.76, 0.15]} color={color} fill={active ? 0.82 : 0.3} rim={active ? 0.98 : 0.62} />
      <Tag position={[0, 0.02, 0.25]} tone={active ? tone : "muted"} size="xs" center>
        {label}
      </Tag>
      <Node3D position={[0.62, 0.04, 0.19]} color={color} radius={0.075} pulse={active ? 1.3 : 0} matte />
    </group>
  );
}

function TypeDetails({ type, t }: { type: RepoType; t: Copy }) {
  const color = type === "model" ? P.teal : type === "dataset" ? P.amber : P.violet;
  const tone = type === "model" ? "teal" : type === "dataset" ? "amber" : "violet";
  const labels =
    type === "model"
      ? [t.weights, t.card, t.config, t.widget]
      : type === "dataset"
        ? [t.rows, t.card, t.data, t.stream]
        : [t.code, t.sdk, t.gpu, t.app];

  return (
    <>
      <group position={[-3.45, 0, 0.35]}>
        <DataPlate position={[0, 1.62, 0]} label={labels[0]} color={color} tone={tone} active />
        <DataPlate position={[0, 0.35, 0]} label={labels[1]} color={color} tone={tone} active />
      </group>
      <group position={[3.98, 0, -0.25]}>
        <DataPlate position={[0, 1.62, 0]} label={labels[2]} color={color} tone={tone} active />
        <DataPlate position={[0, 0.35, 0]} label={labels[3]} color={color} tone={tone} active />
      </group>
      <Duct from={[-2.6, 1.52, 0.45]} to={[-1.18, 1.78, 0.16]} color={color} radius={0.055} bend={0.46} />
      <Duct from={[1.18, 1.58, 0.16]} to={[3.12, 1.55, -0.1]} color={color} radius={0.055} bend={0.54} />
      <Flow points={[[-2.55, 1.53, 0.45], [-1.86, 1.67, 0.3], [-1.2, 1.78, 0.17]]} color={color} count={2} size={0.045} lineOpacity={0} />
      <Flow points={[[1.2, 1.58, 0.17], [2.18, 1.57, 0.02], [3.12, 1.55, -0.1]]} color={color} count={2} size={0.045} lineOpacity={0} />
      <Halo position={[0, 1.72, 0.12]} radius={1.05} color={color} opacity={0.16} spin={0.1} />
    </>
  );
}

export default function Visual5() {
  const t = useCopy(COPY);
  const [type, setType] = useState<RepoType>("model");
  const note = type === "model" ? t.modelNote : type === "dataset" ? t.datasetNote : t.spaceNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.model },
        { color: P.amber, label: t.dataset },
        { color: P.violet, label: t.space },
        { color: P.inkSoft, label: t.git },
      ]}
      controls={
        <Switcher
          value={type}
          onChange={setType}
          options={[
            { value: "model", label: t.model, tone: P.teal },
            { value: "dataset", label: t.dataset, tone: P.amber },
            { value: "space", label: t.space, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      note={note}
      height="h-[410px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={14} depth={11.3} y={-0.04} />
        <Motes count={42} radius={7} opacity={0.2} />
        <PointerTilt amount={0.055}>
          <RepoCore type={type} t={t} />
          <TypeDetails type={type} t={t} />
        </PointerTilt>
      </Stage>
    </Figure>
  );
}
