"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { MathUtils, type Mesh } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, Node3D, PointerTilt, ShadowBlob, Slab, Tag, useCycle, Wire, type Cell, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";

type Mode = "text" | "vision" | "browser";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const [mode, setMode] = useState<Mode>("text");

  // Patch grid for vision — 5x5 = 25 patches.
  const patchCells = Array.from({ length: 25 }, (_, i) => {
    const c = i % 5;
    const r = Math.floor(i / 5);
    return {
      position: [-2.0 + c * 0.18, 1.2 - r * 0.18, 0] as [number, number, number],
      scale: 1,
      color: P.amber,
    };
  });

  // Text token strip.
  const tokenCells = Array.from({ length: 10 }, (_, i) => ({
    position: [-2.0 + i * 0.22, 1.2, 0] as [number, number, number],
    scale: 1,
    color: P.teal,
  }));

  return (
    <Figure
      label="text · image · browser"
      hint="tokens are not only words"
      legend={[
        { color: P.teal, label: "text" },
        { color: P.amber, label: "image patches" },
        { color: P.violet, label: "screenshot" },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "text", label: "Text", tone: P.teal },
            { value: "vision", label: "Vision", tone: P.amber },
            { value: "browser", label: "Browser", tone: P.violet },
          ]}
          ariaLabel="tokens are not only words"
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 9.5], fov: 38 }}>
        <Motes count={110} radius={7} color={P.faint} size={0.025} opacity={0.32} />

        {/* The residual stream — central horizontal beam. */}
        <Slab position={[0, -0.2, 0]} size={[8.4, 0.45, 0.1]} color={P.ink} fill={0.16} />
        <Tag position={[0, -0.6, 0.2]} tone="ink">residual stream</Tag>

        {/* Text-only: token strip flowing into the stream. */}
        {mode === "text" && (
          <>
            <Lattice cells={tokenCells} size={0.16} matte />
            <Tag position={[-1.0, 1.7, 0.2]} tone="teal">tokens</Tag>
            <Flow
              points={[
                [-1.0, 1.0, 0],
                [-1.0, 0.0, 0],
                [1.0, 0.0, 0],
              ]}
              color={P.teal}
              count={3}
              speed={0.5}
            />
            {/* Next-token prediction head on the right. */}
            <Node3D position={[3.6, -0.2, 0]} color={P.teal} radius={0.22} pulse={0.4} />
            <Tag position={[3.6, 0.45, 0.2]} tone="teal">next-token head</Tag>
          </>
        )}

        {/* Vision: image split into patches, projected to embeddings, dropped into stream. */}
        {mode === "vision" && (
          <>
            {/* Frame around the patch grid. */}
            <Slab position={[-2.0, 1.2, 0]} size={[1.4, 1.4, 0.08]} color={P.line} fill={0.08} />
            <Lattice cells={patchCells} size={0.13} matte />
            <Tag position={[-2.0, 2.05, 0.2]} tone="amber">image · 14×14 patches</Tag>
            {/* ViT encoder block. */}
            <Slab position={[-0.4, 1.2, 0]} size={[0.7, 1.0, 0.1]} color={P.amber} fill={0.22} />
            <Tag position={[-0.4, 1.85, 0.2]} tone="amber">ViT</Tag>
            {/* Projector. */}
            <Slab position={[0.5, 1.2, 0]} size={[0.5, 1.0, 0.1]} color={P.violet} fill={0.22} />
            <Tag position={[0.5, 1.85, 0.2]} tone="violet">proj.</Tag>
            {/* Embedding dots heading to the stream. */}
            <Lattice
              cells={Array.from({ length: 8 }, (_, i) => ({
                position: [1.4 + i * 0.16, 1.2, 0],
                scale: 1,
                color: P.violet,
              }))}
              size={0.1}
              matte
            />
            <Flow
              points={[
                [1.0, 1.2, 0],
                [2.0, 0.7, 0],
                [2.0, 0.0, 0],
              ]}
              color={P.violet}
              count={3}
              speed={0.4}
            />
            <Tag position={[2.0, -0.95, 0.2]} tone="muted">tokens enter stream</Tag>
          </>
        )}

        {/* Browser: agent + capture loop. */}
        {mode === "browser" && (
          <>
            {/* Browser screenshot frame. */}
            <Slab position={[-2.5, 1.4, 0]} size={[2.4, 1.6, 0.1]} color={P.violet} fill={0.18} />
            <Slab position={[-2.5, 1.4, 0]} size={[2.4, 1.6, 0.08]} color={P.line} fill={0.0} />
            <Tag position={[-2.5, 2.35, 0.2]} tone="violet">screenshot</Tag>
            {/* Old screenshots piling up — representation of "context bloat". */}
            {Array.from({ length: 4 }, (_, i) => (
              <Slab
                key={`old-${i}`}
                position={[-2.5 + (i - 1.5) * 0.05, 0.0 - i * 0.18, -0.1 * i]}
                size={[1.0, 0.6, 0.06]}
                color={P.lineStrong}
                fill={0.18}
              />
            ))}
            <Tag position={[-2.5, -1.05, 0.2]} tone="muted">old captures</Tag>

            {/* Tool call and agent loop. */}
            <Slab position={[1.4, 1.4, 0]} size={[1.6, 0.7, 0.1]} color={P.amber} fill={0.22} />
            <Tag position={[1.4, 1.85, 0.2]} tone="amber">tool: crop</Tag>
            <Slab position={[1.4, 0.4, 0]} size={[1.6, 0.7, 0.1]} color={P.teal} fill={0.22} />
            <Tag position={[1.4, 0.85, 0.2]} tone="teal">think + act</Tag>
            {/* Loop arrow back to the screenshot. */}
            <Flow
              points={[
                [0.5, 1.4, 0],
                [-1.3, 1.4, 0],
              ]}
              color={P.amber}
              count={2}
              speed={0.5}
            />
            <Flow
              points={[
                [-1.3, 1.1, 0],
                [0.5, 0.4, 0],
              ]}
              color={P.teal}
              count={2}
              speed={0.5}
            />
            <Tag position={[1.4, -0.45, 0.2]} tone="muted">act → observe → act</Tag>
          </>
        )}

        {/* Footer — caption per mode. */}
        <Slab position={[0, -2.6, 0]} size={[9.0, 0.4, 0.1]} color={P.line} fill={0.08} />
        <Tag position={[0, -2.6, 0.2]} tone="muted">
          {mode === "text"
            ? "text → tokens → residual stream → next token"
            : mode === "vision"
              ? "image → patches → ViT → projector → tokens → stream"
              : "browser: act → screenshot → think → loop"}
        </Tag>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Troqueladora de parches (ViT). La imagen se corta en una cuadrícula de
 * (res / parche)² parches; cada parche (parche² × 3 valores) pasa por un
 * proyector lineal y sale como un vector que se sienta en la misma fila
 * que los tokens de texto. En vídeo, el mismo recuento se multiplica por
 * fotogramas: 8 s × 24 fps = 192 fotogramas.
 */

type MMode = "image" | "video";
const RESOLUTIONS = [224, 336, 448] as const;
const PATCHES = [14, 16] as const;
const TEXT_TOKENS = 9; // didactic prompt: "Describe la imagen en una frase."
const FPS = 24;
const WINDOW = 128_000;
const NUM = new Intl.NumberFormat("es-ES");

function patchModel(res: number, patch: number, seconds: number) {
  const side = Math.floor(res / patch);
  const imageTokens = side * side;
  const patchValues = patch * patch * 3;
  const frames = seconds * FPS;
  const videoTokens = frames * imageTokens;
  return { side, imageTokens, patchValues, frames, videoTokens, sequence: TEXT_TOKENS + imageTokens };
}

/** Procedural picture: sky, sun and two hills, sampled at a patch centre. */
function pictureColor(u: number, v: number) {
  const sunD = Math.hypot(u - 0.7, v - 0.72);
  if (sunD < 0.11) return "#E3A84A";
  const hill1 = 0.32 + 0.12 * Math.sin(u * 5.2 + 0.4);
  const hill2 = 0.2 + 0.08 * Math.sin(u * 8.5 + 2.1);
  if (v < hill2) return mixHex("#2F6F57", "#1E4F3F", u * 0.6);
  if (v < hill1) return mixHex("#5C9A6E", "#3F7D5E", u);
  return mixHex("#CFE3E6", "#7FB2C8", v);
}

function M({ color, rough = 0.45, coat = 0.4, metal = 0 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} />;
}

const IMG = { x: -3.3, y: 0.35, size: 2.5 };

function patchCells(side: number, liftRow: number): Cell[] {
  const pitch = IMG.size / side;
  const cells: Cell[] = [];
  for (let r = 0; r < side; r += 1) {
    for (let c = 0; c < side; c += 1) {
      const u = (c + 0.5) / side;
      const v = 1 - (r + 0.5) / side;
      const lifted = r === liftRow;
      cells.push({
        position: [IMG.x - IMG.size / 2 + (c + 0.5) * pitch, IMG.y - IMG.size / 2 + (side - r - 0.5) * pitch, lifted ? 0.28 : 0.06],
        scale: [pitch * 0.9, pitch * 0.9, lifted ? 0.08 : 0.04],
        color: lifted ? mixHex(pictureColor(u, v), "#ffffff", 0.15) : pictureColor(u, v),
      });
    }
  }
  return cells;
}

/** Image tokens laid out in rows of COLS on the sequence tray, after the text tokens. */
const SEQ = { x0: 0.9, z0: -0.35, cell: 0.075, cols: 44 };
function sequenceCells(imageTokens: number): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < TEXT_TOKENS; i += 1) {
    cells.push({ position: [SEQ.x0 + i * 0.2, -0.88, SEQ.z0 - 0.3], scale: [0.16, 0.12, 0.16], color: P.teal });
  }
  for (let i = 0; i < imageTokens; i += 1) {
    const c = i % SEQ.cols;
    const r = Math.floor(i / SEQ.cols);
    cells.push({ position: [SEQ.x0 + c * SEQ.cell, -0.92, SEQ.z0 + r * SEQ.cell], scale: [SEQ.cell * 0.82, 0.05, SEQ.cell * 0.82], color: mixHex(P.amber, "#E3A84A", (i % 7) / 7) });
  }
  return cells;
}

function Plinth() {
  return (
    <group>
      <ShadowBlob position={[0, -1.5, 0.1]} scale={10} opacity={0.12} />
      <RoundedBox args={[10.4, 0.34, 3.9]} position={[0.1, -1.3, 0.2]} radius={0.16} smoothness={4} castShadow receiveShadow>
        <M color="#3a3f44" rough={0.6} coat={0.2} />
      </RoundedBox>
      <RoundedBox args={[10.1, 0.06, 3.6]} position={[0.1, -1.11, 0.2]} radius={0.03} smoothness={2} receiveShadow>
        <M color="#50565c" rough={0.55} coat={0.25} />
      </RoundedBox>
    </group>
  );
}

function ImageEasel({ side, liftRow, patch, res }: { side: number; liftRow: number; patch: number; res: number }) {
  const cells = useMemo(() => patchCells(side, liftRow), [side, liftRow]);
  const half = IMG.size / 2 + 0.12;
  return (
    <group>
      <RoundedBox args={[IMG.size + 0.3, IMG.size + 0.3, 0.1]} position={[IMG.x, IMG.y, -0.03]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <M color="#2a2e33" rough={0.45} />
      </RoundedBox>
      <mesh position={[IMG.x, -0.95, -0.2]} castShadow>
        <boxGeometry args={[1.6, 0.18, 0.7]} />
        <M color="#b68442" metal={0.6} rough={0.3} coat={0.1} />
      </mesh>
      {[-0.6, 0.6].map((dx) => (
        <mesh key={dx} position={[IMG.x + dx, -0.72, -0.12]} castShadow>
          <boxGeometry args={[0.08, 0.35, 0.08]} />
          <M color="#9aa3ab" metal={0.6} rough={0.35} coat={0} />
        </mesh>
      ))}
      <Lattice cells={cells} size={1} />
      <Wire points={[[IMG.x - half, IMG.y + half, 0.1], [IMG.x + half, IMG.y + half, 0.1]]} color={P.amber} width={1.4} opacity={0.8} />
      <Tag position={[IMG.x, IMG.y + half + 0.3, 0.1]} tone="ink" center>{`${res} × ${res} px`}</Tag>
      <Tag position={[IMG.x - half - 0.55, IMG.y - IMG.size / 2 + (side - liftRow - 0.5) * (IMG.size / side), 0.3]} tone="amber" size="xs" center>{`parche ${patch}²`}</Tag>
    </group>
  );
}

function Projector() {
  return (
    <group position={[-0.95, -0.3, 0.1]}>
      <RoundedBox args={[1.05, 1.5, 1.05]} radius={0.1} smoothness={3} castShadow receiveShadow>
        <M color={mixHex(P.paper, P.violet, 0.28)} rough={0.4} coat={0.5} />
      </RoundedBox>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={`h${i}`} position={[0, -0.5 + i * 0.25, 0.53]}>
          <boxGeometry args={[0.8, 0.02, 0.01]} />
          <meshBasicMaterial color={P.violetDeep} transparent opacity={0.45} />
        </mesh>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={`v${i}`} position={[-0.4 + i * 0.2, 0, 0.53]}>
          <boxGeometry args={[0.02, 1.0, 0.01]} />
          <meshBasicMaterial color={P.violetDeep} transparent opacity={0.45} />
        </mesh>
      ))}
      <Tag position={[0, 1.05, 0]} tone="violet" center>proyector W</Tag>
    </group>
  );
}

function SequenceTray({ imageTokens }: { imageTokens: number }) {
  const cells = useMemo(() => sequenceCells(imageTokens), [imageTokens]);
  const rows = Math.ceil(imageTokens / SEQ.cols);
  return (
    <group>
      <RoundedBox args={[3.9, 0.1, 2.6]} position={[SEQ.x0 + 1.6, -1.02, 0.35]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <M color={mixHex(P.paper, P.inkSoft, 0.18)} rough={0.5} />
      </RoundedBox>
      <Lattice cells={cells} size={1} />
      <Tag position={[SEQ.x0 + 0.8, -0.55, SEQ.z0 - 0.35]} tone="teal" size="xs" center>texto</Tag>
      <Tag position={[SEQ.x0 + (SEQ.cols * SEQ.cell) / 2, -0.7, SEQ.z0 + rows * SEQ.cell + 0.25]} tone="amber" size="xs" center>{`${NUM.format(imageTokens)} tokens imagen`}</Tag>
      <Tag position={[SEQ.x0 + 1.6, -0.2, -0.95]} tone="ink" center>una secuencia</Tag>
    </group>
  );
}

function VideoStack({ seconds, side }: { seconds: number; side: number }) {
  // One plate per second of clip (24 frames each), with the picture on the front plate.
  const cells = useMemo(() => patchCells(side, -1), [side]);
  return (
    <group>
      {Array.from({ length: seconds }, (_, i) => (
        <RoundedBox key={i} args={[IMG.size + 0.3, IMG.size + 0.3, 0.06]} position={[IMG.x + i * 0.07, IMG.y + i * 0.03, -0.12 - i * 0.22]} radius={0.04} smoothness={2} castShadow receiveShadow>
          <M color={mixHex("#2a2e33", P.amber, i * 0.05)} rough={0.45} />
        </RoundedBox>
      ))}
      <Lattice cells={cells} size={1} />
      <mesh position={[IMG.x, -0.95, -0.9]} castShadow>
        <boxGeometry args={[1.8, 0.18, 2.4]} />
        <M color="#b68442" metal={0.6} rough={0.3} coat={0.1} />
      </mesh>
      <Tag position={[IMG.x, IMG.y + IMG.size / 2 + 0.45, -0.4]} tone="ink" center>{`${seconds} s × ${FPS} fps`}</Tag>
    </group>
  );
}

function WindowGauge({ tokens }: { tokens: number }) {
  const ref = useRef<Mesh>(null);
  const { still } = useStage();
  const H = 2.4; // height of one 128k window
  const ratio = Math.min(tokens / WINDOW, 1.6);
  const h = ratio * H;
  const over = tokens > WINDOW;
  const x = 2.6;
  const y0 = -1.05;
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const n = still ? h : MathUtils.damp(m.scale.y, h, 5, dt);
    m.scale.y = Math.max(0.001, n);
    m.position.y = y0 + m.scale.y / 2;
  });
  return (
    <group>
      <RoundedBox args={[1.6, 0.12, 1.6]} position={[x, y0 - 0.02, 0.2]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <M color="#b68442" rough={0.32} metal={0.55} coat={0.2} />
      </RoundedBox>
      <mesh ref={ref} position={[x, y0 + h / 2, 0.2]} scale={[1, Math.max(0.001, h), 1]} castShadow>
        <boxGeometry args={[1.0, 1, 1.0]} />
        <meshPhysicalMaterial color={over ? P.rose : P.amber} roughness={0.35} clearcoat={0.5} />
      </mesh>
      <mesh position={[x, y0 + H, 0.2]}>
        <boxGeometry args={[1.35, 0.03, 1.35]} />
        <meshBasicMaterial color={P.ink} />
      </mesh>
      <Tag position={[x + 1.25, y0 + H, 0.2]} tone="ink" size="xs" center>ventana 128k</Tag>
      <Tag position={[x, y0 + Math.max(h, H) + 0.4, 0.2]} tone={over ? "rose" : "amber"} center>{`${NUM.format(tokens)} tokens`}</Tag>
    </group>
  );
}

function PatchBench({ mode, res, patch, seconds }: { mode: MMode; res: number; patch: number; seconds: number }) {
  const m = patchModel(res, patch, seconds);
  const [row] = useCycle(Math.min(m.side, 12), 0.7);
  const liftRow = Math.floor((row * m.side) / Math.min(m.side, 12));
  const rowY = IMG.y - IMG.size / 2 + (m.side - liftRow - 0.5) * (IMG.size / m.side);
  return (
    <PointerTilt amount={0.045}>
      <group>
        <Plinth />
        {mode === "image" ? <ImageEasel side={m.side} liftRow={liftRow} patch={patch} res={res} /> : <VideoStack seconds={seconds} side={m.side} />}
        <Projector />
        <Flow points={[[IMG.x + IMG.size / 2 + 0.1, mode === "image" ? rowY : IMG.y, 0.3], [-1.75, 0.1, 0.4], [-1.5, -0.2, 0.5]]} color={P.amber} count={3} speed={0.45} size={0.05} lineOpacity={0.4} />
        <Flow points={[[-0.4, -0.5, 0.5], [0.4, -0.7, 0.4], [SEQ.x0 + 0.3, -0.85, 0.2]]} color={P.violet} count={3} speed={0.45} size={0.05} lineOpacity={0.4} />
        {mode === "image" ? <SequenceTray imageTokens={m.imageTokens} /> : <WindowGauge tokens={m.videoTokens} />}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<MMode>("image");
  const [res, setRes] = useState<number>(224);
  const [patch, setPatch] = useState<number>(16);
  const [seconds, setSeconds] = useState(8);
  const m = patchModel(res, patch, seconds);
  return (
    <Figure
      label="Troqueladora de parches · una imagen hecha tokens"
      hint={mode === "image" ? "cortar → proyectar → concatenar con texto" : "el mismo recuento, por fotograma"}
      legend={[{ color: P.amber, label: "parches / tokens de imagen" }, { color: P.violet, label: "proyector" }, { color: P.teal, label: "tokens de texto" }]}
      note={
        <div className="space-y-2">
          {mode === "image" ? (
            <p><strong>{res} / {patch} = {m.side} parches por lado → {m.side}² = {NUM.format(m.imageTokens)} tokens.</strong> Cada parche son {patch}×{patch}×3 = {NUM.format(m.patchValues)} números; el proyector los convierte en un vector de la dimensión del modelo y se añade su posición. En la bandeja, esos vectores van detrás de los {TEXT_TOKENS} tokens del prompt: el transformer lee una sola secuencia de {NUM.format(m.sequence)} posiciones y no sabe cuáles vinieron de una palabra.</p>
          ) : (
            <p><strong>{seconds} s × {FPS} fps = {NUM.format(m.frames)} fotogramas × {NUM.format(m.imageTokens)} tokens = {NUM.format(m.videoTokens)} tokens.</strong> {m.videoTokens > WINDOW ? "No cabe en una ventana de 128k: por eso los modelos de vídeo comprimen en espacio y tiempo antes de atender." : "Cabe, pero ocupa casi toda la ventana con un solo clip: por eso los modelos de vídeo comprimen en espacio y tiempo."}</p>
          )}
          <Readout items={[
            { label: "parches por lado", value: String(m.side), tone: "var(--amber)" },
            { label: "tokens por imagen", value: NUM.format(m.imageTokens), tone: "var(--amber)" },
            { label: "valores por parche", value: NUM.format(m.patchValues), tone: "var(--violet)" },
            { label: mode === "image" ? "secuencia total" : "tokens del clip", value: NUM.format(mode === "image" ? m.sequence : m.videoTokens), tone: "var(--ink)" },
          ]} />
          <p className="text-xs text-muted">Cifras de la lección: 224/16 → 196 tokens; 336/14 → 576. La cuadrícula de la lámina tiene exactamente {m.side}×{m.side} parches. La imagen es procedural y el prompt de {TEXT_TOKENS} tokens, didáctico.</p>
        </div>
      }
      controls={
        <>
          <Switcher value={mode} onChange={setMode} options={[{ value: "image", label: "Imagen", tone: P.amber }, { value: "video", label: "Vídeo", tone: P.rose }]} ariaLabel="Imagen o vídeo" />
          <Switcher value={String(res)} onChange={(v) => setRes(Number(v))} options={RESOLUTIONS.map((r) => ({ value: String(r), label: `${r} px`, tone: P.inkSoft }))} ariaLabel="Resolución" />
          <Switcher value={String(patch)} onChange={(v) => setPatch(Number(v))} options={PATCHES.map((p) => ({ value: String(p), label: `parche ${p}`, tone: P.amber }))} ariaLabel="Tamaño de parche" />
          {mode === "video" ? (
            <Switcher value={String(seconds)} onChange={(v) => setSeconds(Number(v))} options={[2, 4, 8].map((s) => ({ value: String(s), label: `${s} s`, tone: P.rose }))} ariaLabel="Duración del clip" />
          ) : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.2, 2.6, 10.5], fov: 34 }} fit={1.04}>
        <PatchBench mode={mode} res={res} patch={patch} seconds={seconds} />
      </Stage>
    </Figure>
  );
}
