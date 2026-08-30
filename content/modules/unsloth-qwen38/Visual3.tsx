"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Where the adapters actually clip on.
 *
 * The recipe's four booleans are easy to skim as boilerplate, and they
 * are the line that decides what you are training. Drawn as a
 * cross-section of the model, they stop being flags and become a
 * selection: the vision tower left alone, the language layers opened up,
 * attention and MLP each getting their own clip.
 */

type Preset = "recipe" | "attnOnly" | "withVision";

const LAYERS = 6;

/** Which module families the preset attaches adapters to. */
const PRESETS: Record<Preset, { vision: boolean; attn: boolean; mlp: boolean }> = {
  recipe: { vision: false, attn: true, mlp: true },
  attnOnly: { vision: false, attn: true, mlp: false },
  withVision: { vision: true, attn: true, mlp: true },
};

const COPY = {
  en: {
    title: "where the adapters clip on",
    hint: "four booleans in the recipe, drawn as a cross-section",
    recipe: "recipe default",
    attnOnly: "attention only",
    withVision: "vision too",
    legendAdapted: "adapter attached",
    legendFrozen: "frozen 4-bit base",
    legendVision: "vision tower",
    vision: "vision layers",
    language: "language layers",
    attn: "attention modules",
    mlp: "MLP modules",
    adapted: "modules adapted",
    share: "share of drawn modules",
    base: "base stays 4-bit",
    flags: "finetune_* flags",
    recipeNote:
      "the shipped recipe leaves the vision tower alone and opens the language layers, clipping an adapter onto both the attention and the MLP modules. The base weights underneath stay loaded in 4-bit and never move.",
    attnOnlyNote:
      "dropping the MLP modules halves what you are training. It is cheaper and it is a different experiment — not a smaller version of the same one, because the MLP is where a lot of factual capacity sits.",
    withVisionNote:
      "turning the vision layers on only makes sense if your data is actually multimodal. On a text SFT run it adds trainable parameters that see nothing but their own initialisation.",
  },
  es: {
    title: "dónde se enganchan los adaptadores",
    hint: "cuatro booleanos de la receta, dibujados como una sección",
    recipe: "receta por defecto",
    attnOnly: "solo atención",
    withVision: "también visión",
    legendAdapted: "adaptador puesto",
    legendFrozen: "base 4-bit congelada",
    legendVision: "torre de visión",
    vision: "capas de visión",
    language: "capas de lenguaje",
    attn: "módulos de atención",
    mlp: "módulos MLP",
    adapted: "módulos adaptados",
    share: "porción de los módulos dibujados",
    base: "la base sigue en 4-bit",
    flags: "flags finetune_*",
    recipeNote:
      "la receta que viene deja en paz la torre de visión y abre las capas de lenguaje, enganchando un adaptador tanto en los módulos de atención como en los MLP. Los pesos base de debajo siguen cargados en 4-bit y no se mueven.",
    attnOnlyNote:
      "quitar los módulos MLP parte por la mitad lo que entrenas. Sale más barato y es otro experimento — no una versión pequeña del mismo, porque en el MLP vive buena parte de la capacidad factual.",
    withVisionNote:
      "encender las capas de visión solo tiene sentido si tus datos son de verdad multimodales. En un SFT de texto añade parámetros entrenables que no ven nada más que su propia inicialización.",
  },
};

/** A module block, with an adapter clipped on when it is being trained. */
function Module({
  position,
  adapted,
  color,
  width,
}: {
  position: V3;
  adapted: boolean;
  color: string;
  width: number;
}) {
  const clip = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = clip.current;
    if (!g) return;
    g.position.y = MathUtils.damp(g.position.y, adapted ? 0.26 : 0.02, 6, dt);
    g.scale.setScalar(MathUtils.damp(g.scale.x, adapted ? 1 : 0.01, 6, dt));
  });

  return (
    <group position={position}>
      {/* The frozen base: always there, never trained. */}
      <RoundedBox args={[width, 0.2, 0.7]} radius={0.04} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={P.sunken} roughness={0.5} metalness={0.03} />
      </RoundedBox>
      <group ref={clip}>
        <RoundedBox args={[width * 0.85, 0.12, 0.5]} radius={0.03} smoothness={3} castShadow>
          <meshStandardMaterial color={color} roughness={0.32} metalness={0.06} envMapIntensity={0.9} />
        </RoundedBox>
      </group>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [preset, setPreset] = useState<Preset>("recipe");
  const cfg = PRESETS[preset];

  /* Counted off the diagram, which is what the share describes. */
  const visionModules = LAYERS;
  const langModules = LAYERS * 2;
  const totalDrawn = visionModules + langModules;
  const adapted =
    (cfg.vision ? visionModules : 0) +
    (cfg.attn ? LAYERS : 0) +
    (cfg.mlp ? LAYERS : 0);

  const note =
    preset === "recipe"
      ? t.recipeNote
      : preset === "attnOnly"
        ? t.attnOnlyNote
        : t.withVisionNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendAdapted },
        { color: P.sunken, label: t.legendFrozen },
        { color: P.violet, label: t.legendVision },
      ]}
      controls={
        <Switcher
          value={preset}
          onChange={setPreset}
          options={[
            { value: "recipe", label: t.recipe, tone: P.teal },
            { value: "attnOnly", label: t.attnOnly, tone: P.amber },
            { value: "withVision", label: t.withVision, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout
              items={[
                { label: t.adapted, value: `${adapted} / ${totalDrawn}`, tone: "var(--teal)" },
                {
                  label: t.share,
                  value: `${Math.round((adapted / totalDrawn) * 100)}%`,
                  tone: "var(--ink-soft)",
                },
                { label: t.base, value: "load_in_4bit = True", tone: "var(--muted)" },
              ]}
            />
          </div>
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={13} depth={10} y={-0.05} />

        {/* The vision tower, off to one side and usually left alone. */}
        <group position={[-3.9, 0, 0]}>
          {Array.from({ length: visionModules }, (_, i) => (
            <Module
              key={i}
              position={[0, 0.12 + i * 0.42, 0]}
              adapted={cfg.vision}
              color={P.violet}
              width={1.5}
            />
          ))}
          <Tag position={[0, 0.12 + visionModules * 0.42 + 0.4, 0]} tone={cfg.vision ? "violet" : "muted"} size="xs" center>
            {t.vision}
          </Tag>
          {cfg.vision ? (
            <Halo position={[0, 1.2, 0]} radius={1.2} color={P.violet} opacity={0.5} spin={0.25} />
          ) : null}
        </group>

        {/* The language stack: attention and MLP, side by side per layer. */}
        <group position={[1.4, 0, 0]}>
          {Array.from({ length: LAYERS }, (_, i) => (
            <group key={i} position={[0, 0.12 + i * 0.42, 0]}>
              <Module position={[-1.05, 0, 0]} adapted={cfg.attn} color={P.teal} width={1.7} />
              <Module position={[1.05, 0, 0]} adapted={cfg.mlp} color={P.amber} width={1.7} />
            </group>
          ))}
          <Tag position={[-1.05, 0.12 + LAYERS * 0.42 + 0.4, 0]} tone={cfg.attn ? "teal" : "muted"} size="xs" center>
            {t.attn}
          </Tag>
          <Tag position={[1.05, 0.12 + LAYERS * 0.42 + 0.4, 0]} tone={cfg.mlp ? "amber" : "muted"} size="xs" center>
            {t.mlp}
          </Tag>
          <Tag position={[0, -0.55, 1.1]} tone="ink" size="xs" center>
            {t.language}
          </Tag>
        </group>

        {/* The flags that decided all of it. */}
        <group position={[0, 0, -3.2]}>
          <AxisLine from={[-4.6, 0.1, 0]} to={[3.2, 0.1, 0]} overrun={0.3} color={P.lineStrong} opacity={0.4} />
          <Tag position={[-0.7, 0.35, 0]} tone="muted" size="xs" center>
            {t.flags}
          </Tag>
        </group>

        <Node3D position={[3.9, 0.4, 2.6]} color={P.teal} radius={0.14} faceted pulse={0.2} />
        <Tag position={[3.9, 0.9, 2.6]} tone="teal" size="xs" center>
          r 16 · alpha 16
        </Tag>

        <IsoDust count={22} center={[0, 1.4, 0]} spread={[3.6, 1.2, 1.6]} />
      </Stage>
    </Figure>
  );
}
