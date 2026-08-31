"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  Duct,
  GlassPanel,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
  Sheet,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Upload is a write-token operation, and there are three Git families.
 *
 * Model, dataset, space — same Git contract, different payload. A read
 * token stops at the gate with 403. A write token is still not a master
 * key: org membership is a second gate, already drawn in Visual3.
 */

type Mode = "types" | "write" | "read";

const COPY = {
  en: {
    title: "upload needs write, and three repo families",
    hint: "model · dataset · space · read token is a 403",
    types: "three repos",
    write: "write token",
    read: "read = 403",
    legendModel: "model",
    legendData: "dataset",
    legendSpace: "space",
    model: "model",
    dataset: "dataset",
    space: "space",
    gate: "write gate",
    hub: "Hub",
    notes: {
      types:
        "One Git contract, three families. A model holds weights and a card. A dataset holds rows. A Space is a repo that runs. hf upload --repo-type points at the family. Buckets are not repos.",
      write:
        "hf upload is the documented push. If the repo does not exist, the CLI creates it. A write token is required. Unsloth save_pretrained / push_to_hub is this same Hub API with a Python layer.",
      read: "A read token returns 403. Same role table as the tokens section, not a new ACL. Prefer uploading adapters from a machine you control, not from a shared notebook.",
    },
  },
  es: {
    title: "subir pide write, y tres familias de repo",
    hint: "modelo · dataset · space · token read es un 403",
    types: "tres repos",
    write: "token write",
    read: "read = 403",
    legendModel: "modelo",
    legendData: "dataset",
    legendSpace: "space",
    model: "modelo",
    dataset: "dataset",
    space: "space",
    gate: "puerta write",
    hub: "Hub",
    notes: {
      types:
        "Un contrato Git, tres familias. Un modelo guarda pesos y una card. Un dataset guarda filas. Un Space es un repo que se ejecuta. hf upload --repo-type apunta a la familia. Los buckets no son repos.",
      write:
        "hf upload es el push documentado. Si el repo no existe, la CLI lo crea. Hace falta un token write. El export de Unsloth (save_pretrained, push_to_hub) es esta misma API del Hub con una capa Python.",
      read: "Un token read devolverá 403. Es la misma tabla de roles de la página de tokens, no una ACL nueva. Prefiere subir adapters desde una máquina que controlas, no desde un notebook compartido.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("types");
  const pass = mode !== "read";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendModel },
        { color: P.amber, label: t.legendData },
        { color: P.violet, label: t.legendSpace },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "types", label: t.types, tone: P.teal },
            { value: "write", label: t.write, tone: P.amber },
            { value: "read", label: t.read, tone: P.rose },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          <strong className="text-ink">{t[mode]}</strong>
          {" — "}
          {t.notes[mode]}
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={13.2} depth={11.5} y={-0.04} />
        <PlanTrace
          points={[[-5.5, 3.3], [0, 3.3], [0, 0.3]]}
          y={-0.03}
          color={pass ? P.amber : P.rose}
          opacity={0.65}
        />
        <AxisLine from={[-4.6, 0, 2.2]} to={[4.7, 0, 2.2]} />
        <IsoDust count={40} center={[0, 0.55, 0]} spread={[5.0, 1.0, 3.5]} />

        {[
          { x: -3.4, z: 1.15, color: P.teal, wash: P.tealWash, label: t.model, tone: "teal" as const },
          { x: -3.4, z: -0.15, color: P.amber, wash: P.amberWash, label: t.dataset, tone: "amber" as const },
          { x: -3.4, z: -1.45, color: P.violet, wash: P.violetWash, label: t.space, tone: "violet" as const },
        ].map((r) => (
          <group key={r.label}>
            <Sheet
              position={[r.x, 0.06, r.z]}
              size={[1.45, 1.0]}
              color={r.wash}
              fill={0.88}
              marks={4}
              markColor={r.color}
            />
            <Tag position={[r.x, 1.25, r.z]} tone={r.tone} size="xs">
              {r.label}
            </Tag>
          </group>
        ))}

        <GlassPanel
          position={[0.15, 1.35, 0]}
          rotation={ISO}
          size={[1.55, 2.35]}
          color={pass ? P.amber : P.rose}
          opacity={pass ? 0.28 : 0.14}
        />
        <Tag position={[0.15, 2.75, 0]} tone={pass ? "amber" : "rose"} size="xs">
          {t.gate}
        </Tag>

        <GlassPanel
          position={[3.15, 1.4, 0.15]}
          rotation={ISO}
          size={[2.45, 2.3]}
          color={P.teal}
          opacity={pass ? 0.26 : 0.08}
        />
        <Tag position={[3.15, 2.8, 0.15]} tone="teal">
          {t.hub}
        </Tag>
        {pass
          ? [0, 1, 2].map((i) => (
              <Sheet
                key={i}
                position={[3.05, 0.08 + i * 0.09, 0.25 - i * 0.08]}
                size={[1.4, 0.95]}
                color={i === 2 ? P.violetWash : i === 1 ? P.amberWash : P.tealWash}
                fill={0.8}
                marks={3}
                markColor={i === 2 ? P.violet : i === 1 ? P.amber : P.teal}
              />
            ))
          : null}

        <Duct
          from={[-2.4, 0.22, 0]}
          to={[pass ? 2.05 : 0.15, pass ? 0.45 : 0.9, 0.1]}
          color={pass ? P.amber : P.rose}
          radius={0.1}
          bend={0.5}
        />
        <Flow
          points={[
            [-2.25, 0.25, 0],
            [pass ? 1.9 : 0.05, pass ? 0.48 : 0.85, 0.08],
          ]}
          color={pass ? P.amber : P.rose}
          count={3}
        />
      </Stage>
    </Figure>
  );
}
