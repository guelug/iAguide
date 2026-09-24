"use client";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group, MathUtils } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { ShadowBlob, hash } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "model" | "vram" | "export";
const COPY = {
  en: { title: "27B dense: train the adapter, not the world", hint: "model · VRAM · export", model: "model", vram: "VRAM", export: "export", dense: "dense 27B", vision: "vision + video", qlora: "QLoRA", lora: "LoRA", full: "full fine-tune", gguf: "GGUF", safe: "safetensors", dynamic: "Dynamic V3.0" },
  es: { title: "27B denso: ajusta el adapter, no el mundo", hint: "modelo · VRAM · exportación", model: "modelo", vram: "VRAM", export: "exporta", dense: "27B denso", vision: "visión + vídeo", qlora: "QLoRA", lora: "LoRA", full: "ajuste completo", gguf: "GGUF", safe: "safetensors", dynamic: "Dynamic V3.0" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("model");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.dense }, { color: P.violet, label: t.qlora }, { color: P.amber, label: t.export }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "model", label: t.model, tone: P.teal }, { value: "vram", label: t.vram, tone: P.violet }, { value: "export", label: t.export, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "model" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.dense}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.vision}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">262k contexto · Gated DeltaNet</Tag></>}
        {mode === "vram" && <>{[[t.qlora, P.teal, 1.0], [t.lora, P.violet, 1.45], [t.full, P.rose, 2.15]].map(([label, color, h], i) => <group key={label as string}><Slab position={[-1.6 + i * 1.6, -0.65 + (h as number) / 2, 0]} size={[1.15, h as number, 0.12]} color={color as string} fill={0.24} /><Tag position={[-1.6 + i * 1.6, 0.82, 0.15]} tone={(["teal", "violet", "rose"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.95, 0.15]} tone="muted" size="xs">24GB · &gt;36GB · 4× más</Tag></>}
        {mode === "export" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">adapter</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Node3D position={[1.7, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.3} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.gguf}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">→ {t.safe} · {t.dynamic}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Parser = "todos" | "numerico";

/* One question, G sampled answers. Whether an answer is correct and whether
   it is written as a bare number are fixed pseudo-random draws, so moving a
   control changes the outcome, never the dice. */
function grpo(G: number, p: number, parser: Parser) {
  const rows = Array.from({ length: G }, (_, i) => {
    const correct = hash(i, 21) < p;
    const freeform = hash(i, 22) < 0.5;
    const parsed = parser === "todos" || !freeform;
    return { correct, freeform, reward: correct && parsed ? 1 : 0, lost: correct && !parsed };
  });
  const mean = rows.reduce((a, r) => a + r.reward, 0) / G;
  const std = Math.sqrt(rows.reduce((a, r) => a + (r.reward - mean) ** 2, 0) / G);
  const adv = rows.map((r) => (std > 0 ? (r.reward - mean) / std : 0));
  return { rows, mean, std, adv, correct: rows.filter((r) => r.correct).length, lost: rows.filter((r) => r.lost).length };
}

const n2 = (x: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(x);

function SpanishVisual() {
  const [G, setG] = useState(8);
  const [p, setP] = useState(0.4);
  const [parser, setParser] = useState<Parser>("numerico");
  const m = useMemo(() => grpo(G, p, parser), [G, p, parser]);
  const silent = m.std === 0;
  const note = (
    <div className="space-y-3">
      <p>
        <strong>{silent ? "Sin señal: todas las ventajas son cero." : "Hay señal: las respuestas mejores que la media se refuerzan."}</strong>{" "}
        GRPO muestrea {G} respuestas, las puntúa y normaliza cada recompensa con la media y la desviación del grupo (Z-score); no hay modelo de valor. {m.correct} respuestas son correctas{m.lost ? `, pero el parser solo numérico deja ${m.lost} a 0 porque están en texto libre` : ""}. {silent ? (m.mean === 0 ? "Si todas valen 0, la varianza es nula y el gradiente también: es el caso de la lección, la recompensa clavada en 0,0 durante 800 pasos." : "Si todas valen 1, tampoco hay nada que distinguir.") : `Media ${n2(m.mean)}, desviación ${n2(m.std)}.`}
      </p>
      <Readout
        items={[
          { label: "G", value: String(G), tone: "var(--ink)" },
          { label: "p(correcta)", value: n2(p), tone: "var(--teal)" },
          { label: "media", value: n2(m.mean), tone: "var(--violet)" },
          { label: "desviación", value: n2(m.std), tone: silent ? "var(--rose)" : "var(--teal)" },
        ]}
      />
      <p className="rounded border border-line bg-paper p-2 font-mono text-xs">ventaja_i = (r_i − media) / desviación</p>
      <p className="text-xs text-muted">Arreglos del caso: partir de un checkpoint Instruct (sube p), depurar el reward a mano sobre 20 ejemplos (parser «todos») y recortar el dataset a lo que el reward sabe puntuar. Qué respuestas salen correctas es un sorteo fijo didáctico; la tasa de aprendizaje GRPO recomendada ronda 5e-6.</p>
    </div>
  );
  return (
    <Figure
      label="GRPO · ventajas de grupo y la recompensa que no llega"
      hint="G muestras → recompensa → Z-score"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.teal, label: "recompensa 1 / ventaja +" },
        { color: P.rose, label: "ventaja −" },
        { color: P.amber, label: "correcta, no parseada" },
        { color: P.violet, label: "media del grupo" },
      ]}
      note={note}
      controls={
        <>
          <Knob label="G" value={G} min={4} max={16} onChange={setG} tone="var(--ink)" />
          <Knob label="p(correcta)" value={p} min={0} max={1} step={0.05} onChange={setP} format={n2} tone="var(--teal)" />
          <Switcher value={parser} onChange={setParser} ariaLabel="Parser del reward" options={[{ value: "numerico", label: "Parser solo numérico", tone: P.amber }, { value: "todos", label: "Parser todos", tone: P.teal }]} />
          <button type="button" className="chip" onClick={() => { setP(0); setParser("numerico"); }}>Caso: p ≈ 0</button>
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.4, 2.8, 11], fov: 35 }} fit={1.05}>
        <GroupScene m={m} />
      </Stage>
    </Figure>
  );
}

type GM = ReturnType<typeof grpo>;
const PITCH = 0.5;
const REWARD_Z = -0.6;
const ADV_Z = 0.7;
const Y0 = -0.4;
const H = 1.1; // height of reward 1
const AH = 0.4; // height per unit of advantage
const AMAX = 2.5; // advantages are drawn clamped to ±2.5

function Column({ x, z, value, unit, color }: { x: number; z: number; value: number; unit: number; color: string }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = value * unit;
    const h = still ? target : MathUtils.damp(g.scale.y, target, 6, dt);
    g.scale.y = Math.abs(h) < 0.004 ? 0.004 : h;
    g.position.y = Y0 + g.scale.y / 2;
  });
  return (
    <group ref={ref} position={[x, Y0, z]}>
      <mesh castShadow>
        <boxGeometry args={[0.34, 1, 0.34]} />
        <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.55} />
      </mesh>
    </group>
  );
}

function GroupScene({ m }: { m: GM }) {
  const G = m.rows.length;
  const x = (i: number) => (i - (G - 1) / 2) * PITCH;
  const span = 16 * PITCH;
  return (
    <group>
      <ShadowBlob position={[0, Y0 - 1.35, 0.1]} scale={9} opacity={0.1} />
      {[-1, 1].flatMap((sg) => [REWARD_Z, ADV_Z].map((z) => (
        <mesh key={sg + ":" + z} position={[sg * (span / 2 - 0.15), Y0 - 0.57, z]} castShadow>
          <boxGeometry args={[0.14, 1.06, 0.3]} />
          <meshStandardMaterial color="#8C9895" metalness={0.55} roughness={0.34} />
        </mesh>
      )))}
      <RoundedBox position={[0, Y0 - 1.21, 0]} args={[span + 0.8, 0.22, 2.9]} radius={0.1} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#2D3436" roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {/* reward row */}
      <RoundedBox position={[0, Y0 - 0.04, REWARD_Z]} args={[span, 0.06, 0.7]} radius={0.02} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#D9D3C5" roughness={0.55} />
      </RoundedBox>
      {m.rows.map((r, i) => (
        <group key={"r" + i}>
          <Column x={x(i)} z={REWARD_Z} value={r.reward} unit={H} color={r.reward ? P.teal : "#9AA0A3"} />
          {r.lost ? (
            <mesh position={[x(i), Y0 + 0.12, REWARD_Z + 0.3]} castShadow>
              <boxGeometry args={[0.2, 0.2, 0.06]} />
              <meshStandardMaterial color={P.amber} roughness={0.4} />
            </mesh>
          ) : null}
        </group>
      ))}
      {/* the group mean as a glass plane across the reward row */}
      <mesh position={[0, Y0 + m.mean * H, REWARD_Z]}>
        <boxGeometry args={[G * PITCH + 0.3, 0.02, 0.8]} />
        <meshBasicMaterial color={P.violet} transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <Tag position={[-(G * PITCH) / 2 - 0.5, Y0 + m.mean * H, REWARD_Z]} tone="violet" size="xs" center>{"media " + n2(m.mean)}</Tag>
      <Tag position={[0, Y0 + H + 0.4, REWARD_Z]} tone="teal" size="xs" center>recompensa</Tag>
      {/* advantage row: zero plane, bars up and down */}
      <RoundedBox position={[0, Y0 - 0.04, ADV_Z]} args={[span, 0.06, 0.7]} radius={0.02} smoothness={2} receiveShadow>
        <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.12)} roughness={0.5} transparent opacity={0.8} />
      </RoundedBox>
      {m.adv.map((a, i) => (
        <Column key={"a" + i} x={x(i)} z={ADV_Z} value={Math.max(-AMAX, Math.min(AMAX, a))} unit={AH} color={a >= 0 ? P.teal : P.rose} />
      ))}
      <Tag position={[(G * PITCH) / 2 + 0.7, Y0, ADV_Z + 0.3]} tone={m.std === 0 ? "rose" : "ink"} size="xs" center>{m.std === 0 ? "ventaja 0 · sin señal" : "ventaja Z"}</Tag>
    </group>
  );
}
