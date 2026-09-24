"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group } from "three";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { PointerTilt, ShadowBlob } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

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
 * Export is the same template and the same EOS, or a silent quality bug.
 *
 * Three artefacts — adapters, GGUF, merged 16-bit — are honest only when
 * they keep the Qwen chat template you trained with. A second wrapper at
 * serve time is the loop the previous lesson already named.
 */

type Mode = "match" | "three" | "mismatch";

const COPY = {
  en: {
    title: "same template, same EOS",
    hint: "adapter · GGUF · merged 16-bit · mismatch is a silent bug",
    match: "match",
    three: "three artefacts",
    mismatch: "mismatch",
    legendTpl: "trained template",
    legendShip: "exported artefact",
    legendWrap: "second wrapper",
    template: "Qwen template",
    eos: "EOS",
    adapters: "adapters",
    gguf: "GGUF",
    merged: "merged 16-bit",
    serve: "serve wrapper",
    notes: {
      match:
        "Whatever you ship must use the same chat template and EOS you trained with. The collator saw a completed turn. The engine will add the generation prompt at serve time — do not bake that header into the rows.",
      three:
        "Three honest artefacts: adapters you reload on the same base, GGUF q4_k_m for llama.cpp / Desktop, merged 16-bit for vLLM. Pick from the job. All three keep one template plate.",
      mismatch:
        "A second wrapper at serve time — Ollama's template around a model that never saw it — is the silent loop. The GGUF troubleshooting page is the same story, now with a Qwen template attached.",
    },
  },
  es: {
    title: "misma plantilla, mismo EOS",
    hint: "adapter · GGUF · 16-bit fusionado · el desajuste es un bug silencioso",
    match: "coincide",
    three: "tres artefactos",
    mismatch: "desajuste",
    legendTpl: "plantilla entrenada",
    legendShip: "artefacto exportado",
    legendWrap: "segundo envoltorio",
    template: "plantilla Qwen",
    eos: "EOS",
    adapters: "adapters",
    gguf: "GGUF",
    merged: "16-bit fusionado",
    serve: "envoltorio al servir",
    notes: {
      match:
        "Lo que envíes debe usar la misma plantilla de chat y el mismo EOS con los que entrenaste. El collator vio un turno completado. El motor añadirá el prompt de generación al servir — no metas esa cabecera en las filas.",
      three:
        "Tres artefactos honestos: adapters que recargas sobre la misma base, GGUF q4_k_m para llama.cpp / Desktop, 16-bit fusionado para vLLM. Elige por el trabajo. Los tres conservan una placa de plantilla.",
      mismatch:
        "Un segundo envoltorio al servir — la plantilla de Ollama alrededor de un modelo que nunca la vio — es el bucle silencioso. La página de problemas GGUF es la misma historia, ahora con una plantilla Qwen enganchada.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("match");
  const broken = mode === "mismatch";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendTpl },
        { color: P.amber, label: t.legendShip },
        { color: P.rose, label: t.legendWrap },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "match", label: t.match, tone: P.teal },
            { value: "three", label: t.three, tone: P.amber },
            { value: "mismatch", label: t.mismatch, tone: P.rose },
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
        <IsoFrame width={13.2} depth={11.4} y={-0.04} />
        <PlanTrace
          points={[[-5.4, 3.2], [-1.5, 3.2], [-1.5, 0.3]]}
          y={-0.03}
          color={broken ? P.rose : P.teal}
          opacity={0.65}
        />
        <AxisLine from={[-4.6, 0, 2.1]} to={[4.7, 0, 2.1]} />
        <IsoDust count={40} center={[0, 0.5, 0]} spread={[5.0, 0.9, 3.4]} />

        <GlassPanel
          position={[-2.55, 1.35, 0.85]}
          rotation={ISO}
          size={[2.45, 2.15]}
          color={P.teal}
          opacity={0.28}
        />
        <Tag position={[-2.55, 2.65, 0.85]} tone="teal">
          {t.template}
        </Tag>
        <Sheet
          position={[-2.45, 0.08, 0.95]}
          size={[1.45, 1.05]}
          color={P.tealWash}
          fill={0.9}
          marks={4}
          markColor={P.teal}
        />
        <Tag position={[-2.55, 1.55, -0.55]} tone="teal" size="xs">
          {t.eos}
        </Tag>

        {[
          { x: 2.05, z: 1.45, label: t.adapters, wash: P.amberWash, color: P.amber },
          { x: 2.55, z: 0.05, label: t.gguf, wash: P.violetWash, color: P.violet },
          { x: 2.15, z: -1.35, label: t.merged, wash: P.tealWash, color: P.teal },
        ].map((a) => (
          <group key={a.label}>
            <Sheet
              position={[a.x, 0.06, a.z]}
              size={[1.55, 1.0]}
              color={broken && a.label === t.gguf ? P.roseWash : a.wash}
              fill={mode === "three" || !broken ? 0.88 : a.label === t.gguf ? 0.35 : 0.7}
              marks={4}
              markColor={broken && a.label === t.gguf ? P.rose : a.color}
            />
            <Tag
              position={[a.x, 1.25, a.z]}
              tone={broken && a.label === t.gguf ? "rose" : a.color === P.amber ? "amber" : a.color === P.violet ? "violet" : "teal"}
              size="xs"
            >
              {a.label}
            </Tag>
          </group>
        ))}

        {broken ? (
          <>
            <GlassPanel
              position={[3.55, 1.55, 1.65]}
              rotation={ISO}
              size={[1.85, 1.45]}
              color={P.rose}
              opacity={0.22}
            />
            <Tag position={[3.55, 2.45, 1.65]} tone="rose" size="xs">
              {t.serve}
            </Tag>
            <Duct from={[2.7, 0.35, 0.15]} to={[3.3, 0.7, 1.35]} color={P.rose} radius={0.09} bend={0.5} />
          </>
        ) : (
          <Duct from={[-1.4, 0.3, 0.7]} to={[1.35, 0.25, 0.2]} color={P.teal} radius={0.1} bend={0.45} />
        )}
        <Flow
          points={
            broken
              ? [
                  [2.55, 0.3, 0.1],
                  [3.2, 0.65, 1.25],
                ]
              : [
                  [-1.25, 0.32, 0.65],
                  [1.2, 0.28, 0.2],
                ]
          }
          color={broken ? P.rose : P.teal}
          count={3}
        />
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Art = "adapter" | "gguf" | "merged";
type Serve = "misma" | "otra" | "doble";

const ARTS: Record<Art, { label: string; call: string; gb: number; engine: string; color: string }> = {
  adapter: { label: "adapter LoRA", call: 'model.save_pretrained("qwen38_lora")', gb: 0.3, engine: "Transformers / PEFT", color: P.teal },
  gguf: { label: "GGUF q4_k_m", call: 'save_pretrained_gguf(..., quantization_method="q4_k_m")', gb: (27e9 * 4.85) / 8 / 1e9, engine: "llama.cpp / Desktop", color: P.amber },
  merged: { label: "16-bit fusionado", call: 'save_pretrained_merged(..., save_method="merged_16bit")', gb: (27e9 * 16) / 8 / 1e9, engine: "vLLM", color: P.violet },
};

const USER = "Hola";
function render(serve: Serve) {
  const qwen = (body: string) => `<|im_start|>user\n${body}<|im_end|>\n<|im_start|>assistant\n`;
  if (serve === "misma") return { text: qwen(USER), frames: 1, foreign: false, stops: true };
  if (serve === "otra") return { text: `[INST] ${USER} [/INST]`, frames: 1, foreign: true, stops: false };
  return { text: qwen(qwen(USER)), frames: 2, foreign: false, stops: false };
}

const SERVE_TEXT: Record<Serve, string> = {
  misma: "El servidor usa la plantilla Qwen que viajó con el tokenizer: el modelo ve el formato con el que entrenó y termina en <|im_end|>, su EOS.",
  otra: "El servidor impone otra plantilla. El modelo recibe delimitadores que nunca vio en el ajuste y no emite el EOS esperado: sigue generando o mezcla turnos. Nada falla con un error; baja la calidad en silencio.",
  doble: "El texto ya viene renderizado con la plantilla y el servidor la aplica otra vez: dos envoltorios. Es el bucle silencioso de la leyenda: el modelo ve un turno de usuario dentro de otro.",
};

const gbf = (n: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(n);

function SpanishVisual() {
  const [art, setArt] = useState<Art>("gguf");
  const [serve, setServe] = useState<Serve>("doble");
  const r = useMemo(() => render(serve), [serve]);
  const a = ARTS[art];
  const note = (
    <div className="space-y-3">
      <p><strong>{a.label}: {gbf(a.gb)} GB para {a.engine}.</strong> Los tres artefactos guardan el tokenizer con la plantilla de chat y el EOS del entrenamiento. {SERVE_TEXT[serve]}</p>
      <Readout
        items={[
          { label: "artefacto", value: a.label, tone: "var(--ink)" },
          { label: "tamaño", value: `${gbf(a.gb)} GB`, tone: "var(--amber)" },
          { label: "envoltorios", value: String(r.frames), tone: r.frames > 1 ? "var(--rose)" : "var(--teal)" },
          { label: "¿para en EOS?", value: r.stops ? "sí" : "no", tone: r.stops ? "var(--teal)" : "var(--rose)" },
        ]}
      />
      <div>
        <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">lo que recibe el modelo</p>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-line bg-paper p-2 font-mono text-xs">{r.text.replace(/\\n/g, "\n")}</pre>
      </div>
      <p className="text-xs text-muted"><code>{a.call}</code>. Tamaños: GGUF ≈ 27·10⁹ × 4,85 bits; fusionado = 27·10⁹ × 2 bytes; el adapter depende del rango y los módulos (≈0,3 GB es orientativo para rango 16).</p>
    </div>
  );
  return (
    <Figure
      label="Exportar Qwen3.8 · misma plantilla, mismo EOS"
      hint="adapter · GGUF · 16-bit fusionado"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.violet, label: "plantilla + EOS" },
        { color: P.teal, label: "un envoltorio" },
        { color: P.rose, label: "doble / ajeno" },
        { color: P.amber, label: "GGUF" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={art} onChange={setArt} ariaLabel="Artefacto" options={(Object.keys(ARTS) as Art[]).map((k) => ({ value: k, label: ARTS[k].label, tone: ARTS[k].color }))} />
          <Switcher value={serve} onChange={setServe} ariaLabel="Plantilla al servir" options={[{ value: "misma", label: "Misma plantilla", tone: P.teal }, { value: "otra", label: "Otra plantilla", tone: P.rose }, { value: "doble", label: "Doble envoltorio", tone: P.rose }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.4, 2.6, 11], fov: 35 }} fit={1.05}>
        <ExportScene art={art} r={r} />
      </Stage>
    </Figure>
  );
}

type R = ReturnType<typeof render>;
const CRATE_X: Record<Art, number> = { adapter: -4.2, gguf: -3.2, merged: -1.6 };
const side = (g: number) => 0.3 * Math.cbrt(g) + 0.18; // volume grows with size

function Crate({ id, active }: { id: Art; active: boolean }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const a = ARTS[id];
  const w = side(a.gb);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const tz = active ? 0.6 : -0.4;
    const k = still ? 1 : 1 - Math.exp(-dt * 5);
    ref.current.position.z += (tz - ref.current.position.z) * k;
  });
  return (
    <group ref={ref} position={[CRATE_X[id], -0.9 + w / 2, active ? 0.6 : -0.4]}>
      <RoundedBox args={[w, w, w]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixHex("#B08A5E", a.color, 0.25)} roughness={0.6} clearcoat={0.2} />
      </RoundedBox>
      {[-0.3, 0, 0.3].map((f) => (
        <mesh key={f} position={[0, f * w, w / 2 + 0.005]}>
          <boxGeometry args={[w * 0.98, 0.03, 0.02]} />
          <meshStandardMaterial color="#6B513A" roughness={0.7} />
        </mesh>
      ))}
      {/* tokenizer card: chat template + EOS travels inside every artefact */}
      <RoundedBox position={[w / 2 - 0.12, -w / 2 + 0.14, w / 2 + 0.03]} args={[0.18, 0.14, 0.03]} radius={0.01} smoothness={2}>
        <meshPhysicalMaterial color={P.violet} roughness={0.35} clearcoat={0.5} />
      </RoundedBox>
      <Tag position={[0, w / 2 + 0.22, 0]} tone={active ? "ink" : "muted"} size="xs" center>{a.label}</Tag>
    </group>
  );
}

function Frame({ w, h, color, z }: { w: number; h: number; color: string; z: number }) {
  const t = 0.04;
  return (
    <group position={[0, 0, z]}>
      {[[0, h / 2, w, t], [0, -h / 2, w, t], [-w / 2, 0, t, h], [w / 2, 0, t, h]].map(([x, y, bw, bh], i) => (
        <mesh key={i} position={[x, y, 0]} castShadow>
          <boxGeometry args={[bw, bh, 0.05]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function ExportScene({ art, r }: { art: Art; r: R }) {
  const len = r.stops ? 2.4 : 3.2;
  const ribbonX = 1.9;
  return (
    <PointerTilt amount={0.05}>
      <group>
        <ShadowBlob position={[0, -1.25, 0.1]} scale={9.5} opacity={0.1} />
        <RoundedBox position={[0, -1.1, 0.1]} args={[9.8, 0.22, 2.6]} radius={0.1} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#2D3436" roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <RoundedBox position={[-2.6, -0.95, 0.2]} args={[4.0, 0.1, 2.0]} radius={0.04} smoothness={2} receiveShadow>
          <meshStandardMaterial color="#4E5A59" metalness={0.4} roughness={0.4} />
        </RoundedBox>
        {(Object.keys(ARTS) as Art[]).map((k) => <Crate key={k} id={k} active={k === art} />)}
        <Flow points={[[CRATE_X[art] + side(ARTS[art].gb) / 2, -0.6, 0.6], [-0.6, 0.75, 0.7], [0.45, -0.3, 0.3]]} color={ARTS[art].color} count={2} size={0.05} speed={0.3} lineOpacity={0.45} />
        {/* serving engine */}
        <group position={[0.95, -0.5, 0]}>
          <RoundedBox args={[1.0, 0.9, 1.0]} radius={0.08} smoothness={3} castShadow receiveShadow>
            <meshPhysicalMaterial color="#1F2528" roughness={0.35} clearcoat={0.6} />
          </RoundedBox>
          <mesh position={[0, 0.2, 0.51]}><planeGeometry args={[0.7, 0.18]} /><meshBasicMaterial color={r.frames === 1 && !r.foreign ? P.teal : P.rose} /></mesh>
          <Tag position={[0, 0.75, 0]} tone="ink" size="xs" center>{ARTS[art].engine}</Tag>
        </group>
        {/* the rendered prompt, printed as a ribbon; frames = template wrappers */}
        <group position={[ribbonX + len / 2, -0.55, 0.1]}>
          <RoundedBox args={[len, 0.5, 0.04]} radius={0.015} smoothness={2} castShadow>
            <meshStandardMaterial color="#F6F1E6" roughness={0.8} />
          </RoundedBox>
          <group position={[-len / 2 + 0.9, 0, 0]}>
            {Array.from({ length: r.frames }, (_, k) => (
              <Frame key={k} w={1.5 - k * 0.3} h={0.44 - k * 0.12} color={r.foreign ? P.rose : r.frames > 1 ? (k === 0 ? P.rose : P.violet) : P.violet} z={0.05 + k * 0.03} />
            ))}
            <mesh position={[0, 0, 0.06]}><boxGeometry args={[0.36, 0.08, 0.02]} /><meshBasicMaterial color={P.inkSoft} /></mesh>
          </group>
          {r.stops ? (
            <mesh position={[len / 2 - 0.35, 0, 0.06]} castShadow>
              <boxGeometry args={[0.4, 0.3, 0.1]} />
              <meshPhysicalMaterial color={P.teal} roughness={0.35} clearcoat={0.5} />
            </mesh>
          ) : (
            [0, 1, 2].map((k) => (
              <mesh key={k} position={[len / 2 - 0.9 + k * 0.3, 0, 0.05]}><boxGeometry args={[0.2, 0.08, 0.02]} /><meshBasicMaterial color={P.rose} transparent opacity={1 - k * 0.3} /></mesh>
            ))
          )}
          <Tag position={[0, 0.5, 0]} tone={r.stops ? "teal" : "rose"} size="xs" center>{r.stops ? "para en <|im_end|>" : r.frames > 1 ? "doble envoltorio" : "EOS ajeno"}</Tag>
        </group>
      </group>
    </PointerTilt>
  );
}
