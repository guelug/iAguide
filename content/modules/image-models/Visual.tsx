"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import VisualLegacy from "./VisualLegacy";
import { useLocale } from "next-intl";
import { RoundedBox } from "@react-three/drei";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Arrow,
  Flow,
  Halo,
  Lattice,
  Node3D,
  PointerTilt,
  Ribbon,
  ShadowBlob,
  Slab,
  Tag,
  Wire,
  type Cell,
  type V3,
} from "@/components/three/atoms";
import { ISO_CAMERA, IsoFrame } from "@/components/three/iso";
import { P } from "@/lib/palette";
import { DataTexture, LinearFilter, RGBAFormat, UnsignedByteType } from "three";

type Focus = "clip" | "denoiser" | "vae";
type LocaleKey = "en" | "es";

type FocusCopy = {
  label: string;
  title: string;
  body: string;
};

type Copy = {
  title: string;
  hint: string;
  clip: string;
  denoiser: string;
  latent: string;
  vae: string;
  rgb: string;
  noise: string;
  split: string;
  clean: string;
  focusLabel: string;
  focus: Record<Focus, FocusCopy>;
  didactic: string;
};

const COPY: Record<LocaleKey, Copy> = {
  en: {
    title: "optical diffusion bench",
    hint: "prompt · latent · RGB",
    clip: "CLIP",
    denoiser: "denoiser",
    latent: "latent",
    vae: "VAE",
    rgb: "RGB",
    noise: "noise",
    split: "split",
    clean: "denoise",
    focusLabel: "Part to inspect",
    focus: {
      clip: {
        label: "CLIP",
        title: "CLIP translates the prompt",
        body: "It turns prompt tokens into conditioning for the denoiser; it does not produce the latent by itself.",
      },
      denoiser: {
        label: "denoiser",
        title: "The denoiser estimates the next latent",
        body: "MODEL, the noisy latent and CLIP conditioning meet here. The slider only illustrates that gradual change.",
      },
      vae: {
        label: "VAE",
        title: "VAE decodes latent to RGB",
        body: "The cleaned latent enters VAE and the output leaves as RGB pixels. The grid is a didactic, procedural image.",
      },
    },
    didactic: "Didactic simulation: it shows relationships and does not run a model.",
  },
  es: {
    title: "banco óptico de difusión",
    hint: "prompt · latente · RGB",
    clip: "CLIP",
    denoiser: "denoiser",
    latent: "latente",
    vae: "VAE",
    rgb: "RGB",
    noise: "ruido",
    split: "despiece",
    clean: "limpieza",
    focusLabel: "Pieza a inspeccionar",
    focus: {
      clip: {
        label: "CLIP",
        title: "CLIP traduce el prompt",
        body: "Convierte los tokens del prompt en condicionamiento para el denoiser; no produce el latente por sí solo.",
      },
      denoiser: {
        label: "denoiser",
        title: "El denoiser estima el latente siguiente",
        body: "Aquí se encuentran MODEL, el latente ruidoso y el condicionamiento de CLIP. El slider solo ilustra ese cambio gradual.",
      },
      vae: {
        label: "VAE",
        title: "VAE decodifica latente a RGB",
        body: "El latente limpio entra en VAE y la salida sale como píxeles RGB. La rejilla es una imagen procedimental didáctica.",
      },
    },
    didactic: "Simulación didáctica: muestra relaciones y no ejecuta un modelo.",
  },
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** Stable procedural signal: the same slider value always draws the same image. */
function signalAt(row: number, column: number, layer: number) {
  const broad = 0.5 + 0.5 * Math.sin((column + 1) * 0.95 + layer * 0.7) * Math.cos((row + 1) * 0.82 - layer * 0.35);
  const edge = 0.5 + 0.5 * Math.sin((column - row) * 0.74 + layer * 1.9);
  return clamp(broad * 0.68 + edge * 0.32);
}

function grainAt(index: number, layer: number) {
  return 0.5 + 0.5 * Math.sin((index + 1) * 12.9898 + layer * 78.233);
}

function cellColor(value: number) {
  if (value > 0.67) return P.teal;
  if (value > 0.36) return P.violet;
  return P.muted;
}

function buildGrid(
  denoise: number,
  layer: number,
  options: { cols?: number; rows?: number } = {},
): Cell[] {
  const cols = options.cols ?? 8;
  const rows = options.rows ?? 6;
  const noise = 1 - clamp(denoise / 100);
  const width = (cols - 1) * 0.16;
  const height = (rows - 1) * 0.16;

  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols);
    const column = index % cols;
    const stableNoise = grainAt(index, layer);
    const signal = signalAt(row, column, layer);
    const value = clamp(signal * (1 - noise) + stableNoise * noise);
    const drift = (stableNoise - 0.5) * 0.1 * noise;
    const size = 0.68 + value * 0.42;

    return {
      position: [
        -width / 2 + column * 0.16 + drift,
        height / 2 - row * 0.16 + (0.5 - stableNoise) * 0.07 * noise,
        0,
      ],
      scale: [size, size, 0.72 + value * 0.6],
      color: cellColor(value),
    };
  });
}

type Rgb = [number, number, number];

function mixRgb(a: Rgb, b: Rgb, amount: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * amount),
    Math.round(a[1] + (b[1] - a[1]) * amount),
    Math.round(a[2] + (b[2] - a[2]) * amount),
  ];
}

function putPixel(data: Uint8Array, width: number, x: number, y: number, color: Rgb) {
  const index = (y * width + x) * 4;
  data[index] = color[0];
  data[index + 1] = color[1];
  data[index + 2] = color[2];
  data[index + 3] = 255;
}

/** A repeatable 64×48 landscape: clean signal blended with deterministic grain. */
function buildLandscapeTexture(denoise: number) {
  const width = 64;
  const height = 48;
  const clean = clamp(denoise / 100);
  const data = new Uint8Array(width * height * 4);
  const skyTop: Rgb = [78, 133, 164];
  const skyBottom: Rgb = [224, 231, 220];
  const mountain: Rgb = [53, 72, 79];
  const mountainLight: Rgb = [102, 126, 128];
  const ground: Rgb = [76, 105, 80];
  const sun: Rgb = [245, 194, 91];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = x / (width - 1);
      const ny = y / (height - 1);
      const sky = mixRgb(skyTop, skyBottom, clamp(ny / 0.68));
      const sunDistance = Math.hypot(nx - 0.73, ny - 0.23);
      const sunGlow = clamp(1 - sunDistance / 0.22);
      let color = mixRgb(sky, sun, sunGlow * 0.82);
      const ridge = 0.55 + 0.075 * Math.sin(nx * 13.5) + 0.038 * Math.sin(nx * 31.0 + 0.6);
      const nearRidge = 0.67 + 0.055 * Math.sin(nx * 10.5 + 1.3) + 0.028 * Math.cos(nx * 28.0);
      if (ny > ridge && ny < nearRidge) {
        const slope = clamp((ny - ridge) / Math.max(0.02, nearRidge - ridge));
        color = mixRgb(mountainLight, mountain, slope);
      } else if (ny >= nearRidge) {
        color = ground;
      }
      const grain = grainAt(y * width + x, 17);
      const noisy: Rgb = [
        Math.round(52 + grain * 150),
        Math.round(59 + grain * 145),
        Math.round(66 + grain * 135),
      ];
      putPixel(data, width, x, y, mixRgb(noisy, color, clean));
    }
  }

  const texture = new DataTexture(data, width, height, RGBAFormat, UnsignedByteType);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function ProceduralImage({ denoise }: { denoise: number }) {
  const texture = useMemo(() => buildLandscapeTexture(denoise), [denoise]);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0.48, 0.42, 0.39]}>
      <planeGeometry args={[0.58, 0.43]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function LatentLayers({
  denoise,
  separation,
  compact = false,
}: {
  denoise: number;
  separation: number;
  compact?: boolean;
}) {
  const layerCount = 3;
  const cols = compact ? 5 : 8;
  const rows = compact ? 5 : 6;
  const cells = useMemo(
    () => Array.from({ length: layerCount }, (_, layer) => buildGrid(denoise, layer, { cols, rows })),
    [cols, denoise, layerCount, rows],
  );
  const gap = 0.09 + separation * 0.0011;

  return (
    <group>
      {cells.map((layerCells, layer) => (
        <group key={layer} position={[0, 0, (layer - (layerCount - 1) / 2) * gap]}>
          <Lattice cells={layerCells} size={compact ? 0.08 : 0.1} opacity={0.94} matte />
        </group>
      ))}
    </group>
  );
}

function MetalConnector({ position, color = P.inkSoft, rotation = [0, 0, 0] as V3 }: { position: V3; color?: string; rotation?: V3 }) {
  return (
    <RoundedBox args={[0.22, 0.22, 0.16]} radius={0.035} smoothness={3} position={position} rotation={rotation} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.24} metalness={0.78} envMapIntensity={1.05} />
    </RoundedBox>
  );
}

function BenchModule({
  position,
  title,
  accent,
  active,
  onSelect,
  children,
}: {
  position: V3;
  title: string;
  accent: string;
  active: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {active ? <Halo position={[0, 1.08, 0.02]} radius={1.42} color={accent} opacity={0.18} spin={0.08} /> : null}
      <Slab position={[0, -0.1, 0.05]} size={[2.48, 0.28, 1.92]} color={P.inkSoft} fill={0.98} rim={0.96} />
      <RoundedBox args={[2.22, 1.86, 0.52]} radius={0.12} smoothness={5} position={[0, 1.02, 0.08]} castShadow receiveShadow>
        <meshStandardMaterial color={P.surface} roughness={0.3} metalness={0.12} envMapIntensity={0.94} />
      </RoundedBox>
      <Slab position={[0, 1.73, 0.37]} size={[2.02, 0.2, 0.08]} color={accent} fill={0.98} rim={active ? 1 : 0.78} />
      <Slab position={[0, 0.74, 0.37]} size={[1.72, 0.58, 0.08]} color={P.ink} fill={0.96} rim={active ? 1 : 0.72} />
      <Slab position={[0, 0.98, 0.42]} size={[1.76, 0.07, 0.06]} color={accent} fill={0.96} rim={0.96} />
      <Tag position={[0, 2.03, 0.4]} tone={accent === P.violet ? "violet" : accent === P.amber ? "amber" : "teal"} size="xs" center>
        {title}
      </Tag>
      <MetalConnector position={[-1.16, 0.52, 0.16]} color={accent} />
      <MetalConnector position={[1.16, 0.52, 0.16]} color={accent} />
      <MetalConnector position={[-0.84, 0.13, 0.2]} color={P.inkSoft} />
      <MetalConnector position={[0.84, 0.13, 0.2]} color={P.inkSoft} />
      <group position={[0, 0.1, 0.38]}>
        {children}
      </group>
    </group>
  );
}

function Port({
  position,
  color,
  direction = "right",
}: {
  position: V3;
  color: string;
  direction?: "left" | "right";
}) {
  return (
    <group position={position}>
      <MetalConnector position={[0, 0, 0]} color={color} rotation={[0, direction === "right" ? 0 : Math.PI, 0]} />
      <Node3D position={[direction === "right" ? 0.2 : -0.2, 0, 0.14]} color={color} radius={0.065} matte />
    </group>
  );
}

function ClipModule({ t, separation, active, onSelect }: { t: Copy; separation: number; active: boolean; onSelect: () => void }) {
  const split = separation / 100;
  const tokenCells = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        position: [-0.66 + (index % 6) * 0.26, 0.04 - Math.floor(index / 6) * 0.22, 0.2] as V3,
        scale: [0.86, 0.52, 0.72] as V3,
        color: index % 3 === 0 ? P.violet : index % 3 === 1 ? P.amber : P.teal,
      })),
    [],
  );

  return (
    <BenchModule position={[-3.0 - split * 0.82, 0.28, 0.24]} title={t.clip} accent={P.violet} active={active} onSelect={onSelect}>
      <Slab position={[0, 0.26, 0.22]} size={[1.62, 0.42, 0.12]} color={P.violetWash} fill={0.96} rim={0.9} />
      <Wire points={[[-0.72, -0.02, 0.22], [0.72, -0.02, 0.22]]} color={P.lineStrong} width={1.1} />
      <Lattice cells={tokenCells} size={0.08} opacity={0.95} matte />
      <Node3D position={[0.78, 0.24, 0.29]} color={P.violet} radius={0.1} pulse={0.7} />
    </BenchModule>
  );
}

function DenoiserModule({
  t,
  denoise,
  separation,
  active,
  onSelect,
}: {
  t: Copy;
  denoise: number;
  separation: number;
  active: boolean;
  onSelect: () => void;
}) {
  const split = separation / 100;
  return (
    <BenchModule position={[0, 0.3 + split * 0.4, 0.18]} title={t.denoiser} accent={P.teal} active={active} onSelect={onSelect}>
      <Slab position={[0, 0.22, 0.22]} size={[1.68, 1.02, 0.14]} color={P.violetWash} fill={0.94} rim={active ? 1 : 0.86} />
      <group position={[0, 0.35, 0.32]}>
        <LatentLayers denoise={denoise} separation={separation} />
      </group>
      <Node3D position={[-0.82, 0.62, 0.34]} color={P.amber} radius={0.1} pulse={active ? 1.2 : 0} />
    </BenchModule>
  );
}

function VaeModule({ t, denoise, separation, active, onSelect }: { t: Copy; denoise: number; separation: number; active: boolean; onSelect: () => void }) {
  const split = separation / 100;
  return (
    <BenchModule position={[3.0 + split * 0.82, 0.28, -0.02]} title={t.vae} accent={P.amber} active={active} onSelect={onSelect}>
      <Slab position={[-0.48, 0.26, 0.22]} size={[0.76, 0.9, 0.12]} color={P.violetWash} fill={0.96} rim={0.88} />
      <group position={[-0.48, 0.42, 0.32]}>
        <LatentLayers denoise={denoise} separation={separation} compact />
      </group>
      <Slab position={[0.48, 0.26, 0.22]} size={[0.76, 0.9, 0.12]} color={P.tealWash} fill={0.96} rim={0.92} />
      <group position={[0.48, 0.42, 0.32]}>
        <ProceduralImage denoise={denoise} />
      </group>
      <Arrow from={[-0.08, 0.26, 0.38]} to={[0.08, 0.26, 0.38]} color={P.teal} width={1.6} head={0.08} />
      <Tag position={[-0.48, 0.94, 0.38]} tone="violet" size="xs" center>
        {t.latent}
      </Tag>
      <Tag position={[0.48, 0.94, 0.38]} tone="teal" size="xs" center>
        {t.rgb}
      </Tag>
    </BenchModule>
  );
}

function OpticalBench({ t, focus, denoise, separation, onFocus }: { t: Copy; focus: Focus; denoise: number; separation: number; onFocus: (focus: Focus) => void }) {
  const split = separation / 100;
  const clipX = -3.0 - split * 0.82;
  const vaeX = 3.0 + split * 0.82;
  const denoiserY = 0.3 + split * 0.4;
  const denoiserPort: V3 = [-1.28, denoiserY + 1.16, 0.46];
  const latentPort: V3 = [1.28, denoiserY + 0.55, 0.44];
  const vaePort: V3 = [vaeX - 1.28, 1.16, 0.26];

  return (
    <PointerTilt amount={0.045}>
      <group>
        <ShadowBlob position={[0, -0.31, 0.2]} scale={5.15} color={P.ink} opacity={0.12} />
        <Slab position={[0, -0.14, 0.1]} size={[9.25, 0.34, 3.16]} color={P.sunken} fill={0.98} rim={0.96} />
        <Slab position={[0, 0.08, 0.1]} size={[8.92, 0.12, 2.84]} color={P.lineStrong} fill={0.44} rim={0.74} />
        <Slab position={[0, 0.16, -0.94]} size={[8.42, 0.1, 0.14]} color={P.tealDeep} fill={0.96} rim={0.98} />
        <Slab position={[0, 0.16, 1.02]} size={[8.42, 0.1, 0.14]} color={P.inkSoft} fill={0.96} rim={0.88} />
        <Ribbon points={[[-4.15, 0.3, -0.94], [4.15, 0.3, -0.94]]} color={P.tealDeep} radius={0.045} />
        <Ribbon points={[[-4.15, 0.3, 1.02], [4.15, 0.3, 1.02]]} color={P.inkSoft} radius={0.045} />
        {[
          [-4.1, 0.38, -0.94],
          [4.1, 0.38, -0.94],
          [-4.1, 0.38, 1.02],
          [4.1, 0.38, 1.02],
        ].map(([x, y, z], index) => (
          <Node3D key={index} position={[x, y, z]} color={index % 2 ? P.amber : P.teal} radius={0.08} matte />
        ))}
        <IsoFrame width={9.5} depth={3.35} y={0.13} />

        <ClipModule t={t} separation={separation} active={focus === "clip"} onSelect={() => onFocus("clip")} />
        <DenoiserModule t={t} denoise={denoise} separation={separation} active={focus === "denoiser"} onSelect={() => onFocus("denoiser")} />
        <VaeModule t={t} denoise={denoise} separation={separation} active={focus === "vae"} onSelect={() => onFocus("vae")} />

        <Port position={[clipX - 1.2, 1.22, 0.42]} color={P.violet} direction="left" />
        <Port position={[clipX + 1.18, 1.22, 0.48]} color={P.violet} />
        <Port position={denoiserPort} color={P.amber} direction="left" />
        <Port position={latentPort} color={P.teal} />
        <Port position={vaePort} color={P.violet} direction="left" />

        <Arrow from={[clipX + 0.9, 1.22, 0.46]} to={[-1.3, denoiserY + 1.18, 0.46]} color={P.violet} width={1.9} head={0.12} bow={0.16} />
        <Flow points={[[clipX + 0.92, 1.22, 0.5], [-0.85, denoiserY + 1.18, 0.5]]} color={P.violet} count={3} size={0.045} width={1.4} lineOpacity={0} />
        <Arrow from={[-0.92, denoiserY + 1.18, 0.46]} to={[-0.58, denoiserY + 1.18, 0.46]} color={P.amber} width={1.8} head={0.11} />
        <Arrow from={[1.23, denoiserY + 0.55, 0.44]} to={[vaeX - 1.34, 1.16, 0.27]} color={P.teal} width={1.9} head={0.12} bow={0.06} />
        <Flow points={[[1.22, denoiserY + 0.55, 0.48], [vaeX - 1.38, 1.16, 0.3]]} color={P.teal} count={3} size={0.05} width={1.3} lineOpacity={0} />

      </group>
    </PointerTilt>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <VisualLegacy />;
}

function SpanishVisual() {
  const t = COPY.es;
  const [focus, setFocus] = useState<Focus>("denoiser");
  const [denoise, setDenoise] = useState(58);
  const [separation, setSeparation] = useState(36);
  const note = t.focus[focus];

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.violet, label: t.clip },
        { color: P.teal, label: t.denoiser },
        { color: P.amber, label: t.vae },
        { color: P.tealDeep, label: t.rgb },
      ]}
      controls={
        <>
          <Switcher
            value={focus}
            onChange={setFocus}
            options={[
              { value: "clip", label: t.focus.clip.label, tone: P.violet },
              { value: "denoiser", label: t.focus.denoiser.label, tone: P.teal },
              { value: "vae", label: t.focus.vae.label, tone: P.amber },
            ]}
            ariaLabel={t.focusLabel}
          />
          <Knob label={t.clean} value={denoise} min={0} max={100} onChange={setDenoise} format={(value) => `${value}%`} tone={P.teal} />
          <Knob label={t.split} value={separation} min={0} max={100} onChange={setSeparation} format={(value) => `${value}%`} tone={P.amber} />
        </>
      }
      note={
        <div>
          <p>
            <strong>{note.title}.</strong> {note.body}
          </p>
          <p className="mt-1 text-muted">
            {t.didactic} {t.noise}: {100 - denoise}% · {t.split}: {separation}%.
          </p>
        </div>
      }
      height="h-[540px] md:h-[620px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.08}>
        <OpticalBench t={t} focus={focus} denoise={denoise} separation={separation} onFocus={setFocus} />
      </Stage>
    </Figure>
  );
}
