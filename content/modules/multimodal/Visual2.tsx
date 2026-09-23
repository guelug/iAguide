"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { MathUtils, type Mesh } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Lattice, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, type Cell, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "tower" | "ocr" | "audio";
const COPY = {
  en: { label: "one model, many modalities", hint: "vision · ocr · audio", tower: "tower", ocr: "ocr", audio: "audio", image: "image", encoder: "encoder", projector: "projector", tokens: "tokens", waveform: "waveform", spectrogram: "spectrogram" },
  es: { label: "un modelo, muchas modalidades", hint: "visión · ocr · audio", tower: "torre", ocr: "ocr", audio: "audio", image: "imagen", encoder: "encoder", projector: "proyector", tokens: "tokens", waveform: "onda", spectrogram: "espectrograma" },
};
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("tower");
  return <Figure label={t.label} hint={t.hint} legend={[{ color: P.teal, label: t.image }, { color: P.violet, label: t.encoder }, { color: P.amber, label: t.tokens }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "tower", label: t.tower, tone: P.teal }, { value: "ocr", label: t.ocr, tone: P.violet }, { value: "audio", label: t.audio, tone: P.amber }]} ariaLabel={t.label} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
      {mode === "tower" && <>
        <Slab position={[-2.4, 0.5, 0]} size={[1.5, 1.4, 0.14]} color={P.teal} fill={0.2} /><Tag position={[-2.4, 1.45, 0.15]} tone="teal">{t.image}</Tag>
        <Ribbon points={[[-1.6, 0.5, 0], [-0.5, 0.5, 0]]} color={P.teal} radius={0.05} opacity={0.85} />
        <Slab position={[0, 0.5, 0]} size={[1.5, 1.4, 0.14]} color={P.violet} fill={0.22} /><Tag position={[0, 1.45, 0.15]} tone="violet">{t.encoder}</Tag>
        <Ribbon points={[[0.8, 0.5, 0], [1.5, 0.5, 0]]} color={P.amber} radius={0.05} opacity={0.85} />
        <Lattice cells={Array.from({ length: 12 }, (_, i) => ({ position: [1.5 + (i % 4) * 0.35, 0.95 - Math.floor(i / 4) * 0.4, 0] as [number, number, number], color: P.amber }))} size={0.13} opacity={0.9} matte /><Tag position={[2.2, -0.1, 0.15]} tone="amber">{t.tokens}</Tag>
      </>}
      {mode === "ocr" && <>
        <Slab position={[-2, 0.4, 0]} size={[2.0, 1.5, 0.14]} color={P.teal} fill={0.18} /><Tag position={[-2, 1.35, 0.15]} tone="teal">pixels</Tag>
        <Lattice cells={Array.from({ length: 25 }, (_, i) => ({ position: [-2.7 + (i % 5) * 0.35, 0.9 - Math.floor(i / 5) * 0.35, 0.15] as [number, number, number], color: i % 3 === 0 ? P.amber : P.teal }))} size={0.13} opacity={0.9} matte />
        <Ribbon points={[[-0.9, 0.4, 0], [0.3, 0.4, 0]]} color={P.violet} radius={0.05} opacity={0.9} /><Node3D position={[1.2, 0.4, 0]} color={P.violet} radius={0.22} pulse={0.3} /><Tag position={[1.2, 0.95, 0.15]} tone="violet">text tokens</Tag>
        <Tag position={[0, -1.1, 0.15]} tone="muted" size="xs">pixels → features → texto</Tag>
      </>}
      {mode === "audio" && <>
        <Ribbon points={[[-2.8, 0.4, 0], [-2, 0.8, 0], [-1.2, 0.1, 0], [-0.4, 0.7, 0]]} color={P.amber} radius={0.05} opacity={0.9} /><Tag position={[-2, 1.25, 0.15]} tone="amber">{t.waveform}</Tag>
        <Slab position={[0.5, 0.4, 0]} size={[1.8, 1.5, 0.14]} color={P.violet} fill={0.18} /><Lattice cells={Array.from({ length: 20 }, (_, i) => ({ position: [-0.2 + (i % 5) * 0.3, 0.85 - Math.floor(i / 5) * 0.3, 0.15] as [number, number, number], color: i % 2 ? P.violet : P.amber }))} size={0.11} opacity={0.9} matte /><Tag position={[0.5, 1.35, 0.15]} tone="violet">{t.spectrogram}</Tag>
        <Ribbon points={[[1.5, 0.4, 0], [2.4, 0.4, 0]]} color={P.teal} radius={0.05} opacity={0.85} /><Node3D position={[2.6, 0.4, 0]} color={P.teal} radius={0.2} pulse={0.3} /><Tag position={[2.6, 0.95, 0.15]} tone="teal">{t.tokens}</Tag>
      </>}
    </PointerTilt></Stage>
  </Figure>;
}

/* ------------------------------------------------------------------ ES */

/*
 * Dos presupuestos de entrada no textual, calculados.
 * «Capturas»: el caso AtlasBrowse. Cada paso del agente añade una captura
 * (1280×800 → ancho×alto/750 tokens) y un texto de acción. Guardarlas todas
 * llena la ventana; tirar las de más de dos pasos la mantiene estable.
 * «Audio»: Whisper corta en tramos de 30 s; cada tramo es un log-mel de
 * 80 × 3000 (salto de 10 ms) y el encoder lo reduce a 1500 posiciones.
 */

type AMode = "shots" | "audio";
type Policy = "all" | "drop";

const SHOT = { w: 1280, h: 800 };
const SHOT_TOKENS = Math.round((SHOT.w * SHOT.h) / 750);
const STEP_TEXT = 300;
const SUMMARY = 60;
const SYS = 2_000;
const AGENT_WINDOW = 32_000;
const KEEP = 2;
const NF = new Intl.NumberFormat("es-ES");

function shotsModel(steps: number, policy: Policy) {
  let used = SYS;
  let firstOverflow: number | null = null;
  const perStep: { step: number; kept: boolean; used: number }[] = [];
  for (let s = 1; s <= steps; s += 1) {
    const images = policy === "all" ? s : Math.min(s, KEEP);
    const summaries = policy === "all" ? 0 : Math.max(0, s - KEEP);
    used = SYS + s * STEP_TEXT + images * SHOT_TOKENS + summaries * SUMMARY;
    if (used > AGENT_WINDOW && firstOverflow === null) firstOverflow = s;
    perStep.push({ step: s, kept: false, used });
  }
  const keptFrom = policy === "all" ? 1 : Math.max(1, steps - KEEP + 1);
  perStep.forEach((p) => (p.kept = p.step >= keptFrom));
  return { used, firstOverflow, perStep, images: policy === "all" ? steps : Math.min(steps, KEEP) };
}

const WHISPER = { chunk: 30, melBins: 80, framesPerChunk: 3000, encoderPositions: 1500 };

function audioModel(seconds: number) {
  const chunks = Math.ceil(seconds / WHISPER.chunk);
  const padding = chunks * WHISPER.chunk - seconds;
  return { chunks, padding, melFrames: chunks * WHISPER.framesPerChunk, positions: chunks * WHISPER.encoderPositions };
}

function M({ color, rough = 0.45, coat = 0.4, metal = 0 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} />;
}

function Plinth({ w = 10.4 }: { w?: number }) {
  return (
    <group>
      <ShadowBlob position={[0, -1.5, 0.1]} scale={w} opacity={0.12} />
      <RoundedBox args={[w, 0.34, 3.8]} position={[0, -1.3, 0.1]} radius={0.16} smoothness={4} castShadow receiveShadow>
        <M color="#3a3f44" rough={0.6} coat={0.2} />
      </RoundedBox>
      <RoundedBox args={[w - 0.3, 0.06, 3.5]} position={[0, -1.11, 0.1]} radius={0.03} smoothness={2} receiveShadow>
        <M color="#50565c" rough={0.55} coat={0.25} />
      </RoundedBox>
    </group>
  );
}

function Column({ x, z, y0, h, color, w = 0.9 }: { x: number; z: number; y0: number; h: number; color: string; w?: number }) {
  const ref = useRef<Mesh>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const n = still ? h : MathUtils.damp(m.scale.y, h, 5, dt);
    m.scale.y = Math.max(0.001, n);
    m.position.y = y0 + m.scale.y / 2;
  });
  return (
    <mesh ref={ref} position={[x, y0 + h / 2, z]} scale={[1, Math.max(0.001, h), 1]} castShadow>
      <boxGeometry args={[w, 1, w]} />
      <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.5} />
    </mesh>
  );
}

const SLOT = { x0: -4.35, pitch: 0.56, z: [-0.45, 0.65] };
const GAUGE_H = 2.6; // one 32k window

function StepSlot({ index, active, kept }: { index: number; active: boolean; kept: boolean }) {
  const row = index < 10 ? 0 : 1;
  const x = SLOT.x0 + (index % 10) * SLOT.pitch;
  const z = SLOT.z[row];
  return (
    <group position={[x, -1.06, z]}>
      <RoundedBox args={[0.48, 0.06, 0.5]} radius={0.02} smoothness={2} receiveShadow>
        <M color={active ? mixHex(P.paper, P.inkSoft, 0.25) : mixHex(P.paper, P.inkSoft, 0.08)} rough={0.6} coat={0.1} />
      </RoundedBox>
      {active ? (
        <mesh position={[0, 0.05, 0.14]} castShadow>
          <boxGeometry args={[0.38, 0.04, 0.12]} />
          <M color={P.teal} rough={0.4} />
        </mesh>
      ) : null}
      {active && kept ? (
        <group position={[0, 0.25, -0.08]} rotation={[-0.2, 0, 0]}>
          <RoundedBox args={[0.42, 0.3, 0.04]} radius={0.015} smoothness={2} castShadow>
            <M color="#2a2e33" rough={0.4} />
          </RoundedBox>
          <mesh position={[0, -0.01, 0.022]}>
            <planeGeometry args={[0.36, 0.22]} />
            <meshStandardMaterial color={mixHex(P.amberWash, P.amber, (index % 3) * 0.15)} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.05, 0.024]}>
            <planeGeometry args={[0.3, 0.05]} />
            <meshBasicMaterial color={P.rose} transparent opacity={0.55} />
          </mesh>
        </group>
      ) : null}
      {active && !kept ? (
        <mesh position={[0, 0.06, -0.08]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[0.3, 0.015, 0.2]} />
          <M color={P.surface} rough={0.7} coat={0.1} />
        </mesh>
      ) : null}
    </group>
  );
}

function ShotsScene({ steps, policy }: { steps: number; policy: Policy }) {
  const m = useMemo(() => shotsModel(steps, policy), [steps, policy]);
  const s = GAUGE_H / AGENT_WINDOW;
  const x = 2.9;
  const y0 = -1.03;
  const texts = steps * STEP_TEXT;
  const summaries = policy === "all" ? 0 : Math.max(0, steps - KEEP) * SUMMARY;
  const images = m.images * SHOT_TOKENS;
  const segs = [
    { h: SYS * s, color: P.teal },
    { h: texts * s, color: mixHex(P.paper, P.inkSoft, 0.4) },
    { h: summaries * s, color: P.surface },
    { h: images * s, color: P.amber },
  ];
  let acc = y0;
  const over = m.used > AGENT_WINDOW;
  return (
    <PointerTilt amount={0.045}>
      <group>
        <Plinth />
        {Array.from({ length: 20 }, (_, i) => (
          <StepSlot key={i} index={i} active={i < steps} kept={m.perStep[i]?.kept ?? false} />
        ))}
        <Tag position={[SLOT.x0 + 2.5, -0.35, -1.0]} tone="ink" center>pasos del agente</Tag>
        <RoundedBox args={[1.5, 0.12, 1.5]} position={[x, y0 - 0.02, 0.1]} radius={0.05} smoothness={3} castShadow receiveShadow>
          <M color="#b68442" rough={0.32} metal={0.55} coat={0.2} />
        </RoundedBox>
        {segs.map((g, i) => {
          const el = <Column key={i} x={x} z={0.1} y0={acc} h={Math.max(0.001, g.h)} color={g.color} />;
          acc += g.h;
          return el;
        })}
        <mesh position={[x, y0 + GAUGE_H / 2, 0.1]}>
          <boxGeometry args={[1.25, GAUGE_H, 1.25]} />
          <meshPhysicalMaterial color={P.paper} transparent opacity={0.14} roughness={0.1} clearcoat={1} depthWrite={false} />
        </mesh>
        <Wire points={[[x - 0.63, y0 + GAUGE_H, -0.53], [x + 0.63, y0 + GAUGE_H, -0.53], [x + 0.63, y0 + GAUGE_H, 0.73], [x - 0.63, y0 + GAUGE_H, 0.73], [x - 0.63, y0 + GAUGE_H, -0.53]]} color={over ? P.rose : P.ink} width={2} />
        <Tag position={[x + 1.25, y0 + GAUGE_H, 0.73]} tone="ink" size="xs" center>ventana 32k</Tag>
        <Tag position={[x, Math.max(acc, y0 + GAUGE_H) + 0.4, 0.1]} tone={over ? "rose" : "amber"} center>{`${NF.format(m.used)} tokens`}</Tag>
        <Flow points={[[SLOT.x0 + 5.3, -0.7, 0.1], [1.4, -0.3, 0.2], [x - 0.6, -0.2, 0.1]]} color={P.amber} count={3} speed={0.4} size={0.045} lineOpacity={0.35} />
      </group>
    </PointerTilt>
  );
}

const WAVE = { x0: -4.4, perSec: 0.038, y: -0.2, z: -0.7 };

function AudioScene({ seconds }: { seconds: number }) {
  const m = audioModel(seconds);
  const wave = useMemo<V3[]>(() => {
    const pts: V3[] = [];
    const end = m.chunks * WHISPER.chunk;
    for (let t = 0; t <= end; t += 0.5) {
      const speech = t <= seconds;
      const amp = speech ? 0.22 * (0.45 + 0.55 * Math.abs(Math.sin(t * 0.37))) : 0;
      pts.push([WAVE.x0 + t * WAVE.perSec, WAVE.y + amp * Math.sin(t * 5.3), WAVE.z]);
    }
    return pts;
  }, [seconds, m.chunks]);
  const chunkW = WHISPER.chunk * WAVE.perSec;
  const spectro = useMemo(() => {
    const cells: Cell[] = [];
    for (let c = 0; c < m.chunks; c += 1) {
      for (let tx = 0; tx < 15; tx += 1) {
        for (let b = 0; b < 8; b += 1) {
          const t = c * WHISPER.chunk + (tx + 0.5) * 2;
          const speech = t <= seconds;
          const e = speech ? 0.25 + 0.75 * Math.abs(Math.sin(t * 0.37 + b * 0.8)) * (1 - b / 10) : 0.05;
          cells.push({
            position: [WAVE.x0 + c * chunkW + (tx + 0.5) * (chunkW / 15), -1.0 + e * 0.12, 0.25 + b * 0.11],
            scale: [chunkW / 15 - 0.01, 0.04 + e * 0.24, 0.1],
            color: speech ? mixHex(P.violetWash, P.violet, e) : P.line,
          });
        }
      }
    }
    return cells;
  }, [m.chunks, seconds, chunkW]);
  return (
    <PointerTilt amount={0.045}>
      <group>
        <Plinth />
        <Ribbon points={wave} color={P.amber} radius={0.02} />
        {Array.from({ length: m.chunks + 1 }, (_, i) => (
          <group key={i} position={[WAVE.x0 + i * chunkW, 0, 0]}>
            <mesh position={[0, -0.55, WAVE.z - 0.12]} castShadow>
              <boxGeometry args={[0.04, 1.0, 0.04]} />
              <M color="#b68442" metal={0.6} rough={0.3} coat={0.1} />
            </mesh>
            <mesh position={[0, -1.06, 0.2]}>
              <boxGeometry args={[0.025, 0.02, 1.9]} />
              <M color="#b68442" metal={0.6} rough={0.3} coat={0.1} />
            </mesh>
          </group>
        ))}
        {m.padding > 0 ? (
          <mesh position={[WAVE.x0 + (seconds + m.padding / 2) * WAVE.perSec, -1.05, 0]}>
            <boxGeometry args={[m.padding * WAVE.perSec, 0.02, 1.8]} />
            <meshBasicMaterial color={P.lineStrong} transparent opacity={0.5} />
          </mesh>
        ) : null}
        <Lattice cells={spectro} size={1} />
        <Tag position={[WAVE.x0 + 0.6, 0.35, WAVE.z]} tone="amber" size="xs" center>onda</Tag>
        <Tag position={[WAVE.x0 + 0.6, -0.55, 1.35]} tone="violet" size="xs" center>log-mel 80</Tag>
        {m.padding > 0 ? <Tag position={[WAVE.x0 + (seconds + m.padding / 2) * WAVE.perSec, 0.2, WAVE.z]} tone="muted" size="xs" center>relleno</Tag> : null}
        {/* encoder */}
        <group position={[1.35, -0.35, 0.1]}>
          <RoundedBox args={[1.1, 1.4, 1.2]} radius={0.1} smoothness={3} castShadow receiveShadow>
            <M color={mixHex(P.paper, P.violet, 0.3)} rough={0.4} coat={0.5} />
          </RoundedBox>
          {[-0.4, -0.13, 0.13, 0.4].map((y) => (
            <mesh key={y} position={[0, y, 0.61]}>
              <boxGeometry args={[0.8, 0.12, 0.01]} />
              <meshBasicMaterial color={P.violetDeep} transparent opacity={0.4} />
            </mesh>
          ))}
          <Tag position={[0, 1.0, 0]} tone="violet" center>encoder</Tag>
        </group>
        <Flow points={[[WAVE.x0 + m.chunks * chunkW, -0.8, 0.6], [0.4, -0.5, 0.5], [0.8, -0.4, 0.3]]} color={P.violet} count={3} speed={0.4} size={0.045} lineOpacity={0.35} />
        {/* output positions: one block of 1500 per chunk */}
        {Array.from({ length: m.chunks }, (_, i) => (
          <RoundedBox key={i} args={[1.0, 0.36, 1.0]} position={[3.2, -0.86 + i * 0.4, 0.1]} radius={0.05} smoothness={2} castShadow receiveShadow>
            <M color={mixHex(P.paper, P.teal, 0.45 + i * 0.08)} rough={0.4} coat={0.5} />
          </RoundedBox>
        ))}
        <Tag position={[3.2, -0.86 + m.chunks * 0.4 + 0.2, 0.1]} tone="teal" center>{`${NF.format(m.positions)} posiciones`}</Tag>
        <Flow points={[[1.95, -0.4, 0.3], [2.5, -0.5, 0.3], [2.7, -0.6, 0.2]]} color={P.teal} count={2} speed={0.4} size={0.045} lineOpacity={0.35} />
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<AMode>("shots");
  const [steps, setSteps] = useState(20);
  const [policy, setPolicy] = useState<Policy>("all");
  const [seconds, setSeconds] = useState(75);
  const sm = shotsModel(steps, policy);
  const am = audioModel(seconds);
  const note =
    mode === "shots" ? (
      <div className="space-y-2">
        <p>
          <strong>{policy === "all" ? "Guardar todas las capturas." : `Tirar las capturas de más de ${KEEP} pasos.`}</strong>{" "}
          {policy === "all"
            ? sm.firstOverflow
              ? `En el paso ${sm.firstOverflow} la ventana ya no alcanza: es el bucle de AtlasBrowse, cuatro imágenes casi iguales de un banner que no se cerraba.`
              : "De momento cabe, pero cada paso suma una imagen entera."
            : `Solo quedan ${sm.images} imágenes; las anteriores se sustituyen por un resumen de ${SUMMARY} tokens. Una imagen es una observación, no una personalidad.`}
        </p>
        <Readout items={[
          { label: "tokens por captura", value: `${NF.format(SHOT_TOKENS)} (${SHOT.w}×${SHOT.h} / 750)`, tone: "var(--amber)" },
          { label: "imágenes en contexto", value: String(sm.images), tone: "var(--amber)" },
          { label: "contexto", value: `${NF.format(sm.used)} / ${NF.format(AGENT_WINDOW)}`, tone: sm.used > AGENT_WINDOW ? "var(--rose)" : "var(--ink)" },
          { label: "desborda en", value: sm.firstOverflow ? `paso ${sm.firstOverflow}` : "no desborda", tone: sm.firstOverflow ? "var(--rose)" : "var(--teal)" },
        ]} />
        <p className="text-xs text-muted">Modelo didáctico: system de {NF.format(SYS)} tokens, {STEP_TEXT} tokens de texto por paso, ventana de 32k y la regla práctica ancho × alto / 750 para imágenes.</p>
      </div>
    ) : (
      <div className="space-y-2">
        <p><strong>{seconds} s de audio → {am.chunks} tramos de 30 s.</strong> Whisper no lee la onda: la convierte en un espectrograma log-mel de {WHISPER.melBins} bandas × {NF.format(WHISPER.framesPerChunk)} fotogramas por tramo (un fotograma cada 10 ms). {am.padding > 0 ? `El último tramo se rellena con ${am.padding} s de silencio.` : "Los tramos encajan sin relleno."} El encoder reduce cada tramo a {NF.format(WHISPER.encoderPositions)} posiciones y el decoder escribe la transcripción.</p>
        <Readout items={[
          { label: "tramos", value: String(am.chunks), tone: "var(--amber)" },
          { label: "relleno", value: `${am.padding} s`, tone: "var(--muted)" },
          { label: "fotogramas mel", value: NF.format(am.melFrames), tone: "var(--violet)" },
          { label: "posiciones del encoder", value: NF.format(am.positions), tone: "var(--teal)" },
        ]} />
        <p className="text-xs text-muted">Cifras de la arquitectura de Whisper (Radford et al., 2023). La onda y el espectrograma de la lámina son procedurales; el espectrograma dibuja 8 de las 80 bandas.</p>
      </div>
    );
  return (
    <Figure
      label={mode === "shots" ? "Presupuesto de observaciones · capturas en el contexto" : "Whisper · de la onda a posiciones del encoder"}
      hint={mode === "shots" ? "cada paso suma una imagen" : "tramos de 30 s, log-mel, encoder"}
      legend={mode === "shots"
        ? [{ color: P.amber, label: "captura" }, { color: P.inkSoft, label: "texto de acción" }, { color: P.teal, label: "system" }, { color: P.rose, label: "desborde" }]
        : [{ color: P.amber, label: "onda" }, { color: P.violet, label: "log-mel / encoder" }, { color: P.teal, label: "posiciones" }]}
      note={note}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} options={[{ value: "shots", label: "Capturas", tone: P.amber }, { value: "audio", label: "Audio", tone: P.violet }]} ariaLabel="Vista" />
          {mode === "shots" ? (
            <>
              <Knob label="pasos" min={1} max={20} value={steps} onChange={setSteps} tone={P.amber} />
              <Switcher value={policy} onChange={setPolicy} options={[{ value: "all", label: "Guardar todas", tone: P.rose }, { value: "drop", label: "Tirar > 2 pasos", tone: P.teal }]} ariaLabel="Política de capturas" />
            </>
          ) : (
            <Knob label="duración" min={10} max={120} step={5} value={seconds} onChange={setSeconds} format={(v) => `${v} s`} tone={P.violet} />
          )}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.0, 3.0, 10.5], fov: 34 }} fit={1.04}>
        {mode === "shots" ? <ShotsScene steps={steps} policy={policy} /> : <AudioScene seconds={seconds} />}
      </Stage>
    </Figure>
  );
}
