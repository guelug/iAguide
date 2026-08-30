"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * The hyperparameter section as the control desk it describes.
 *
 * Six hundred words of knobs, and two of them are the ones people
 * actually get wrong: the effective batch is a *product* of two dials on
 * opposite banks, and when you hit OOM there is an order to what you cut
 * — with one control you must not touch at all. Both are arrangements in
 * space, so the desk says them better than the paragraph does.
 *
 * Every value and band is from the Unsloth hyperparameter guide as cited
 * in the lesson: alpha/rank at least 1, effective batch 4-16, dropout 0
 * by default, checkpointing "unsloth", lr 2e-4, seed 3407.
 */

type Mode = "start" | "oom" | "overfit";

const COPY = {
  en: {
    title: "the desk, and the two dials that multiply",
    hint: "turn r, alpha, batch and accumulation · the plates above are computed",
    start: "Starting point",
    oom: "Out of memory",
    overfit: "Loss heading to 0",
    legendCapacity: "capacity",
    legendMemory: "VRAM",
    legendTime: "time",
    legendLocked: "do not touch",
    capacity: "capacity",
    memory: "VRAM",
    time: "time",
    ratio: "alpha / r",
    effective: "effective batch",
    healthy: "in band",
    underOne: "under 1",
    outOfBand: "outside 4-16",
    seqLen: "max_seq_length",
    ckpt: 'checkpointing "unsloth"',
    dropout: "lora_dropout",
    lr: "learning rate",
    seed: "seed",
    startNote:
      "r 16 with alpha 16 or 32, batch 1 on a 24GB card, accumulate 4 to 8, lr 2e-4, seed 3407. The defaults exist as a starting point, not as a reason to skip the sentence that says what the knob does.",
    oomNote:
      "cut max_seq_length first, leave the batch at 1, and leave gradient checkpointing on — it is the control that is buying you the memory, so it is the last thing to give up.",
    overfitNote:
      "one to three epochs on an instruction set; past three is where memorisation starts. A training loss falling toward 0 is overfitting, not a prize — the cited healthy band is 0.5 to 1.0.",
  },
  es: {
    title: "la mesa, y los dos mandos que se multiplican",
    hint: "gira r, alpha, batch y acumulación · las placas de arriba se calculan",
    start: "Punto de partida",
    oom: "Sin memoria",
    overfit: "Pérdida hacia 0",
    legendCapacity: "capacidad",
    legendMemory: "VRAM",
    legendTime: "tiempo",
    legendLocked: "no tocar",
    capacity: "capacidad",
    memory: "VRAM",
    time: "tiempo",
    ratio: "alpha / r",
    effective: "batch efectivo",
    healthy: "en banda",
    underOne: "por debajo de 1",
    outOfBand: "fuera de 4-16",
    seqLen: "max_seq_length",
    ckpt: 'checkpointing "unsloth"',
    dropout: "lora_dropout",
    lr: "learning rate",
    seed: "semilla",
    startNote:
      "r 16 con alpha 16 o 32, batch 1 en una tarjeta de 24GB, acumula 4 u 8, lr 2e-4, semilla 3407. Los valores por defecto son un punto de partida, no una excusa para saltarte la frase que dice qué hace el mando.",
    oomNote:
      "recorta max_seq_length primero, deja el batch en 1, y deja encendido el gradient checkpointing — es el mando que te está comprando la memoria, así que es lo último que se suelta.",
    overfitNote:
      "de una a tres epochs en un conjunto de instrucciones; pasadas las tres empieza la memorización. Una pérdida de entrenamiento cayendo hacia 0 es sobreajuste, no un premio — la banda sana que citan es 0.5 a 1.0.",
  },
};

/** A dial on the desk: a base, a pointer, and its printed name. */
function Dial({
  position,
  value,
  min,
  max,
  color,
  label,
  reading,
  dim = false,
  locked = false,
  order,
}: {
  position: V3;
  value: number;
  min: number;
  max: number;
  color: string;
  label: string;
  reading: string;
  dim?: boolean;
  locked?: boolean;
  /** Step number when the scene is showing a procedure. */
  order?: number;
}) {
  const needle = useRef<Group>(null);
  const t = (value - min) / Math.max(1e-6, max - min);
  useFrame((_, dt) => {
    const g = needle.current;
    if (!g) return;
    // Three quarters of a turn, like a real panel dial.
    const target = Math.PI * 0.75 - t * Math.PI * 1.5;
    g.rotation.y = MathUtils.damp(g.rotation.y, target, 7, dt);
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.38, 0.18, 28]} />
        <meshStandardMaterial
          color={dim ? P.sunken : P.surface}
          roughness={0.34}
          metalness={0.06}
          envMapIntensity={0.9}
        />
      </mesh>
      <group ref={needle} position={[0, 0.19, 0]}>
        <mesh position={[0, 0, 0.16]} castShadow>
          <boxGeometry args={[0.05, 0.05, 0.3]} />
          <meshStandardMaterial color={dim ? P.line : color} roughness={0.35} metalness={0.1} />
        </mesh>
      </group>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.05, 20]} />
        <meshStandardMaterial color={dim ? P.line : color} roughness={0.3} metalness={0.15} />
      </mesh>

      {locked ? <Halo position={[0, 0.2, 0]} radius={0.5} color={P.rose} opacity={0.8} spin={0.4} /> : null}

      <Tag position={[0, 0.62, 0]} tone={dim ? "muted" : "ink"} size="xs" center>
        {label}
      </Tag>
      <Tag position={[0, 0.32, 0.62]} tone={dim ? "muted" : "ink"} size="xs" center>
        {reading}
      </Tag>
      {order ? (
        <group position={[0.45, 0.42, -0.3]}>
          <Node3D position={[0, 0, 0]} color={color} radius={0.13} matte />
          <Tag position={[0, 0, 0.02]} tone="ink" size="xs" center>
            {order}
          </Tag>
        </group>
      ) : null}
    </group>
  );
}

/** A computed plate floating over the desk. */
function Plate({
  position,
  label,
  value,
  ok,
  okText,
  badText,
}: {
  position: V3;
  label: string;
  value: string;
  ok: boolean;
  okText: string;
  badText: string;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[2.3, 0.14, 0.95]} radius={0.05} smoothness={3} castShadow>
        <meshStandardMaterial
          color={ok ? P.surface : P.roseWash}
          roughness={0.3}
          metalness={0.05}
          envMapIntensity={0.95}
        />
      </RoundedBox>
      <mesh position={[-1.0, 0.09, 0]}>
        <boxGeometry args={[0.12, 0.03, 0.6]} />
        <meshStandardMaterial color={ok ? P.teal : P.rose} roughness={0.4} />
      </mesh>
      <Tag position={[0, 0.28, -0.2]} tone="muted" size="xs" center>
        {label}
      </Tag>
      <Tag position={[0, 0.28, 0.35]} tone={ok ? "ink" : "rose"} size="sm" center>
        {value}
      </Tag>
      <Tag position={[0, -0.28, 0.6]} tone={ok ? "teal" : "rose"} size="xs" center>
        {ok ? okText : badText}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("start");
  const [r, setR] = useState(16);
  const [alpha, setAlpha] = useState(16);
  const [batch, setBatch] = useState(1);
  const [accum, setAccum] = useState(8);

  /* The two claims the section makes numerically. */
  const ratio = alpha / r;
  const effective = batch * accum;
  const ratioOk = ratio >= 1;
  const batchOk = effective >= 4 && effective <= 16;

  const note = mode === "oom" ? t.oomNote : mode === "overfit" ? t.overfitNote : t.startNote;

  // In the OOM procedure the desk stops being a set of options and
  // becomes an order: cut this, leave that, never touch the third.
  const oom = mode === "oom";
  const overfit = mode === "overfit";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendCapacity },
        { color: P.violet, label: t.legendMemory },
        { color: P.amber, label: t.legendTime },
        { color: P.rose, label: t.legendLocked },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "start", label: t.start, tone: P.teal },
              { value: "oom", label: t.oom, tone: P.rose },
              { value: "overfit", label: t.overfit, tone: P.amber },
            ]}
            ariaLabel={t.title}
          />
          <Knob label="r" value={r} min={8} max={128} step={8} onChange={setR} tone={P.teal} />
          <Knob
            label="alpha"
            value={alpha}
            min={8}
            max={128}
            step={8}
            onChange={setAlpha}
            tone={P.teal}
          />
          <Knob
            label="batch"
            value={batch}
            min={1}
            max={8}
            step={1}
            onChange={setBatch}
            tone={P.violet}
          />
          <Knob
            label="accum"
            value={accum}
            min={1}
            max={16}
            step={1}
            onChange={setAccum}
            tone={P.amber}
          />
        </>
      }
      note={
        <>
          {note}
          <span className="mt-2 block">
            <Readout
              items={[
                {
                  label: t.ratio,
                  value: ratio.toFixed(2),
                  tone: ratioOk ? "var(--teal)" : "var(--rose)",
                },
                {
                  label: t.effective,
                  value: `${batch} × ${accum} = ${effective}`,
                  tone: batchOk ? "var(--teal)" : "var(--rose)",
                },
                { label: t.lr, value: "2e-4", tone: "var(--ink-soft)" },
                { label: t.seed, value: "3407", tone: "var(--ink-soft)" },
              ]}
            />
          </span>
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
        <IsoFrame width={14} depth={10} y={-0.04} />

        {/* The desk. Three banks, because the knobs really do fall into
            three jobs: how much it can learn, what it costs in VRAM, and
            what it costs in time. */}
        <RoundedBox
          args={[10.4, 0.22, 3.4]}
          radius={0.08}
          smoothness={3}
          position={[0, 0.11, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={P.sunken} roughness={0.5} metalness={0.03} />
        </RoundedBox>

        <PlanTrace
          points={[
            [-4.9, 1.9],
            [4.9, 1.9],
          ]}
          y={0.23}
          color={P.line}
          opacity={0.8}
        />

        {/* Bank names, printed on the desk edge. */}
        <Tag position={[-3.4, 0.3, 2.15]} tone="teal" size="xs" center>
          {t.capacity}
        </Tag>
        <Tag position={[0, 0.3, 2.15]} tone="violet" size="xs" center>
          {t.memory}
        </Tag>
        <Tag position={[3.4, 0.3, 2.15]} tone="amber" size="xs" center>
          {t.time}
        </Tag>

        {/* Capacity: the LoRA pair's inner dimension and its scale. */}
        <Dial
          position={[-4.1, 0.22, 0]}
          value={r}
          min={8}
          max={128}
          color={P.teal}
          label="r"
          reading={String(r)}
          dim={oom}
          order={overfit ? 3 : undefined}
        />
        <Dial
          position={[-2.7, 0.22, 0]}
          value={alpha}
          min={8}
          max={128}
          color={P.teal}
          label="lora_alpha"
          reading={String(alpha)}
          dim={oom}
        />

        {/* VRAM: the batch, the sequence length, and the one that stays on. */}
        <Dial
          position={[-1.0, 0.22, 0]}
          value={batch}
          min={1}
          max={8}
          color={P.violet}
          label="batch"
          reading={String(batch)}
          order={oom ? 2 : undefined}
        />
        <Dial
          position={[0.4, 0.22, 0]}
          value={2048}
          min={512}
          max={8192}
          color={P.violet}
          label={t.seqLen}
          reading="2048"
          order={oom ? 1 : undefined}
        />
        <Dial
          position={[1.8, 0.22, 0]}
          value={1}
          min={0}
          max={1}
          color={P.violet}
          label={t.ckpt}
          reading="on"
          locked={oom}
        />

        {/* Time: accumulation and warmup. */}
        <Dial
          position={[3.2, 0.22, 0]}
          value={accum}
          min={1}
          max={16}
          color={P.amber}
          label="accum"
          reading={String(accum)}
          dim={oom}
        />
        <Dial
          position={[4.5, 0.22, 0]}
          value={overfit ? 2 : 10}
          min={0}
          max={16}
          color={P.amber}
          label={overfit ? "epochs" : "warmup"}
          reading={overfit ? "1-3" : "5-10%"}
          order={overfit ? 1 : undefined}
        />

        {/* The product, drawn as a link between the two banks it spans. */}
        <AxisLine
          from={[-1.0, 0.5, -0.6]}
          to={[3.2, 0.5, -0.6]}
          overrun={0.2}
          color={batchOk ? P.teal : P.rose}
          opacity={0.6}
        />

        <Plate
          position={[-2.1, 1.95, -1.1]}
          label={t.ratio}
          value={`${alpha} / ${r} = ${ratio.toFixed(2)}`}
          ok={ratioOk}
          okText={t.healthy}
          badText={t.underOne}
        />
        <Plate
          position={[2.1, 1.95, -1.1]}
          label={t.effective}
          value={`${batch} × ${accum} = ${effective}`}
          ok={batchOk}
          okText={t.healthy}
          badText={t.outOfBand}
        />

        {overfit ? (
          <group position={[0, 1.95, 1.6]}>
            <Node3D position={[0, 0, 0]} color={P.amber} radius={0.14} />
            <Tag position={[0, 0.42, 0]} tone="amber" size="xs" center>
              {t.dropout} 0 → 0.1
            </Tag>
          </group>
        ) : null}

        <IsoDust count={30} center={[0, 1.5, 0]} spread={[4.8, 0.8, 1.2]} />
      </Stage>
    </Figure>
  );
}
