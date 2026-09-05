"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag, hash, type V3 } from "@/components/three/atoms";
import { AxisLine, ISO_CAMERA, IsoDust, IsoFrame } from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * The three named failure modes, on one bench.
 *
 * The section lists them as prose, and each is really a shape you can
 * recognise in a profiler: a stack on every wire, one cache read again
 * per layer, a single allocation that eats the card. So each is drawn as
 * its shape, with the fix as the same shape rearranged — which is the
 * point the prose makes and a paragraph cannot show.
 *
 * Every number here is the section's own. 15 GB for a 128K sequence at
 * N = 8 blocks, 1.9 GB per device once tensor parallel splits it eight
 * ways, O(L·d) live activations for Full, O(L·N) accesses per token for
 * the naive loop. L is not given, so it is a labelled assumption.
 */

type Mode = "full" | "loop" | "alloc";

/** Blocks, as the recipe fixes it. */
const N_BLOCKS = 8;
/** Not stated in the paper section, so it is shown as an assumption. */
const LAYERS = 48;
/** The section's figure for a 128K sequence held on one device. */
const GB_ONE_DEVICE = 15;

const COPY = {
  en: {
    title: "three ways to make AttnRes look expensive",
    hint: "each failure is a shape · switch to the fix and watch it rearrange",
    full: "Full, then pipeline",
    loop: "a Python loop over layers",
    alloc: "the whole cache on one GPU",
    broken: "the symptom",
    fixed: "the fix",
    legendBad: "what the profiler shows",
    legendGood: "after the fix",
    legendCache: "block cache",
    stage: "stage",
    device: "device",
    cost: "cost",
    fix: "fix",
    assumed: "assumed",
    perToken: "per token",
    perDevice: "per device",
    fullBroken:
      "Full AttnRes needs every earlier v_i during the forward of later layers, so those tensors cannot be freed. Activations and comm grow as O(L·d), and the trace shows every stage shipping a stack of hidden states rather than one tensor.",
    fullFixed:
      "train Block. Adding a cache to Full does not rescue it — the cache helps Block precisely because N is small. Full is the ablation that proves the mixer, not the thing you put in a production pipeline-parallel job.",
    loopBroken:
      "scoring w_l against every previous block summary once per layer re-reads the same cache L times. That is O(L·N) memory accesses per token, and it is the tax that makes depth attention look inherently slow.",
    loopFixed:
      "w_l is a parameter, not a function of h, so the S = L/N queries inside a block are known before the block runs. Batch them and the cache is read once per block instead of once per layer. If your engine cannot batch w_l, it is not running Algorithm 1.",
    allocBroken:
      "block representations in prefill are N·T·d elements. Held whole on one device for a 128K sequence that is a real 15 GB allocation, the allocator dies, and AttnRes takes the blame for a placement decision.",
    allocFixed:
      "tensor parallel already splits the sequence for the big matmuls. Split the block cache the same way — N·(T/P)·d — and Phase 1 then runs independently on local shards. The fusion already wants to live in the all-reduce.",
  },
  es: {
    title: "tres formas de hacer que AttnRes parezca caro",
    hint: "cada fallo es una forma · cambia al arreglo y mírala recolocarse",
    full: "Full, y luego pipeline",
    loop: "un bucle Python sobre capas",
    alloc: "toda la caché en una GPU",
    broken: "el síntoma",
    fixed: "el arreglo",
    legendBad: "lo que muestra el profiler",
    legendGood: "después del arreglo",
    legendCache: "caché de bloques",
    stage: "etapa",
    device: "dispositivo",
    cost: "coste",
    fix: "arreglo",
    assumed: "supuesto",
    perToken: "por token",
    perDevice: "por dispositivo",
    fullBroken:
      "Full AttnRes necesita cada v_i previo durante el forward de las capas posteriores, así que esos tensores no se pueden liberar. Activaciones y comunicación crecen como O(L·d), y la traza muestra cada etapa enviando una pila de estados ocultos en vez de un tensor.",
    fullFixed:
      "entrena Block. Añadirle caché a Full no lo rescata — la caché ayuda a Block justo porque N es pequeño. Full es la ablación que demuestra el mezclador, no lo que pones en un trabajo pipeline-parallel de producción.",
    loopBroken:
      "puntuar w_l contra todos los resúmenes de bloque previos una vez por capa relee la misma caché L veces. Son O(L·N) accesos de memoria por token, y es el impuesto que hace parecer que la atención de profundidad es lenta por naturaleza.",
    loopFixed:
      "w_l es un parámetro, no una función de h, así que las S = L/N queries dentro de un bloque se conocen antes de que el bloque corra. Agrúpalas y la caché se lee una vez por bloque en vez de una vez por capa. Si tu motor no puede agrupar w_l, no está corriendo el Algoritmo 1.",
    allocBroken:
      "las representaciones de bloque en prefill son N·T·d elementos. Guardadas enteras en un dispositivo para una secuencia de 128K son 15 GB reales, el allocator muere, y AttnRes carga con la culpa de una decisión de colocación.",
    allocFixed:
      "el tensor parallel ya parte la secuencia para los matmuls grandes. Parte la caché de bloques igual — N·(T/P)·d — y la Fase 1 corre entonces independiente en shards locales. La fusión ya quiere vivir en el all-reduce.",
  },
};

/** A stack of hidden states riding the wire between two pipeline stages. */
function Stack({ position, height, tone }: { position: V3; height: number; tone: string }) {
  return (
    <group position={position}>
      {Array.from({ length: height }, (_, i) => (
        <RoundedBox
          key={i}
          args={[0.5, 0.11, 0.5]}
          radius={0.02}
          smoothness={2}
          position={[0, 0.09 + i * 0.13, 0]}
          castShadow
        >
          <meshStandardMaterial color={tone} roughness={0.36} metalness={0.05} envMapIntensity={0.9} />
        </RoundedBox>
      ))}
    </group>
  );
}

/** One read arrow into the cache. Many of these is the whole problem. */
function Read({ from, to, color, delay }: { from: V3; to: V3; color: string; delay: number }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = (clock.elapsedTime * 0.5 + delay) % 1;
    g.position.x = MathUtils.lerp(from[0], to[0], t);
    g.position.y = MathUtils.lerp(from[1], to[1], t);
    g.position.z = MathUtils.lerp(from[2], to[2], t);
  });
  return (
    <group>
      <AxisLine from={from} to={to} overrun={0} color={color} opacity={0.22} />
      <group ref={ref} position={from}>
        <mesh castShadow>
          <octahedronGeometry args={[0.07]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("full");
  const [ok, setOk] = useState(false);
  const [ranks, setRanks] = useState(8);

  const accent = ok ? P.teal : P.rose;

  /* The section's own arithmetic, recomputed rather than quoted. */
  const naiveReads = LAYERS * N_BLOCKS;
  const batchedReads = N_BLOCKS * N_BLOCKS;
  const perDeviceGb = GB_ONE_DEVICE / ranks;

  const note =
    mode === "full"
      ? ok
        ? t.fullFixed
        : t.fullBroken
      : mode === "loop"
        ? ok
          ? t.loopFixed
          : t.loopBroken
        : ok
          ? t.allocFixed
          : t.allocBroken;

  const readout =
    mode === "full"
      ? [
          {
            label: t.cost,
            value: ok ? "O(N) · N = 8" : `O(L·d) · L = ${LAYERS}`,
            tone: ok ? "var(--teal)" : "var(--rose)",
          },
          { label: t.fix, value: ok ? "Block" : "Full", tone: ok ? "var(--teal)" : "var(--rose)" },
          { label: t.assumed, value: `L = ${LAYERS}`, tone: "var(--muted)" },
        ]
      : mode === "loop"
        ? [
            {
              label: `${t.cost} · ${t.perToken}`,
              value: ok ? `${batchedReads}` : `${naiveReads}`,
              tone: ok ? "var(--teal)" : "var(--rose)",
            },
            { label: "S = L/N", value: `${LAYERS / N_BLOCKS}×`, tone: "var(--violet)" },
            { label: t.assumed, value: `L = ${LAYERS}, N = ${N_BLOCKS}`, tone: "var(--muted)" },
          ]
        : [
            {
              label: `${t.cost} · ${t.perDevice}`,
              value: ok ? `${perDeviceGb.toFixed(1)} GB` : `${GB_ONE_DEVICE} GB`,
              tone: ok ? "var(--teal)" : "var(--rose)",
            },
            { label: "N · (T/P) · d", value: ok ? `P = ${ranks}` : "P = 1", tone: "var(--violet)" },
            { label: t.assumed, value: `T = 128K, N = ${N_BLOCKS}`, tone: "var(--muted)" },
          ];

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.rose, label: t.legendBad },
        { color: P.teal, label: t.legendGood },
        { color: P.line, label: t.legendCache },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "full", label: t.full, tone: P.rose },
              { value: "loop", label: t.loop, tone: P.amber },
              { value: "alloc", label: t.alloc, tone: P.violet },
            ]}
            ariaLabel={t.title}
          />
          <Switcher
            value={ok ? "fixed" : "broken"}
            onChange={(v) => setOk(v === "fixed")}
            options={[
              { value: "broken", label: t.broken, tone: P.rose },
              { value: "fixed", label: t.fixed, tone: P.teal },
            ]}
            ariaLabel={t.fix}
          />
          {mode === "alloc" ? (
            <Knob label="P" value={ranks} min={1} max={8} step={1} onChange={setRanks} tone={P.violet} />
          ) : null}
        </>
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout items={readout} />
          </div>
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.16}>
        <IsoFrame width={13} depth={10} y={-0.05} />

        {/* 1 — Full, then pipeline: every stage ships a stack. */}
        {mode === "full" ? (
          <group>
            {Array.from({ length: 4 }, (_, i) => {
              const x = -4 + i * 2.7;
              return (
                <group key={i} position={[x, 0, 0]}>
                  <RoundedBox
                    args={[1.5, 0.24, 3.2]}
                    radius={0.05}
                    smoothness={3}
                    position={[0, 0.12, 0]}
                    receiveShadow
                  >
                    <meshStandardMaterial color={P.sunken} roughness={0.5} />
                  </RoundedBox>
                  <Tag position={[0, 0.32, -2]} tone="muted" size="xs" center>
                    {t.stage} {i + 1}
                  </Tag>
                  {i < 3 ? (
                    <Stack
                      position={[1.35, 0.24, 0]}
                      height={ok ? 1 : 6}
                      tone={ok ? P.teal : P.rose}
                    />
                  ) : null}
                </group>
              );
            })}
            <AxisLine
              from={[-4.9, 0.14, 2.3]}
              to={[4.5, 0.14, 2.3]}
              overrun={0.3}
              color={accent}
              opacity={0.45}
            />
          </group>
        ) : null}

        {/* 2 — the loop: one read per layer, or one per block. */}
        {mode === "loop" ? (
          <group>
            {/* the cache every read lands on */}
            <group position={[3.4, 0, 0]}>
              <RoundedBox args={[1.5, 0.9, 3.4]} radius={0.07} smoothness={3} position={[0, 0.45, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={P.surface} roughness={0.4} metalness={0.05} envMapIntensity={0.95} />
              </RoundedBox>
              <Tag position={[0, 1.25, 0]} tone="ink" size="xs" center>
                {t.legendCache} · N = {N_BLOCKS}
              </Tag>
            </group>
            {/* one reader per layer when naive, one per block when batched */}
            {Array.from({ length: ok ? N_BLOCKS : 24 }, (_, i) => {
              const count = ok ? N_BLOCKS : 24;
              const z = -2.7 + (i * 5.4) / Math.max(1, count - 1);
              return (
                <Read
                  key={i}
                  from={[-4, 0.45 + hash(i, 3) * 0.5, z]}
                  to={[2.6, 0.45, z * 0.55]}
                  color={ok ? P.teal : P.rose}
                  delay={hash(i, 9)}
                />
              );
            })}
            <Tag position={[-4.3, 1.5, 0]} tone={ok ? "teal" : "rose"} size="xs" center>
              {ok ? `${N_BLOCKS}×` : `L·N = ${naiveReads}`}
            </Tag>
          </group>
        ) : null}

        {/* 3 — the allocation: one column, or P of them. */}
        {mode === "alloc" ? (
          <group>
            {Array.from({ length: ok ? ranks : 1 }, (_, i) => {
              const n = ok ? ranks : 1;
              const x = n === 1 ? 0 : -4.2 + (i * 8.4) / Math.max(1, n - 1);
              const gb = ok ? perDeviceGb : GB_ONE_DEVICE;
              const h = Math.max(0.25, gb * 0.28);
              return (
                <group key={i} position={[x, 0, 0]}>
                  <RoundedBox
                    args={[n === 1 ? 1.8 : 0.85, h, n === 1 ? 1.8 : 0.85]}
                    radius={0.05}
                    smoothness={3}
                    position={[0, h / 2, 0]}
                    castShadow
                    receiveShadow
                  >
                    <meshStandardMaterial
                      color={ok ? P.teal : P.rose}
                      roughness={0.36}
                      metalness={0.05}
                      envMapIntensity={0.9}
                    />
                  </RoundedBox>
                  {n === 1 ? (
                    <>
                      <Halo position={[0, 0.1, 0]} radius={1.5} color={P.rose} opacity={0.6} spin={0.35} />
                      <Tag position={[0, h + 0.4, 0]} tone="rose" size="xs" center>
                        {gb.toFixed(1)} GB
                      </Tag>
                    </>
                  ) : null}
                </group>
              );
            })}
            {/* One label for the row, not one per column: eight copies of
                the same number collide below tablet width, and repeating
                it says nothing the first one did not. */}
            {ok ? (
              <Tag position={[0, Math.max(0.25, perDeviceGb * 0.28) + 0.75, 0]} tone="teal" size="xs" center>
                {ranks} × {perDeviceGb.toFixed(1)} GB
              </Tag>
            ) : null}
            <Tag position={[0, 0.2, 2.9]} tone="muted" size="xs" center>
              {ok ? `${ranks} × ${t.device}` : `1 × ${t.device} · T = 128K`}
            </Tag>
          </group>
        ) : null}

        <Node3D
          position={[0, mode === "alloc" ? 4.4 : 2.6, -3.4]}
          color={accent}
          radius={0.15}
          faceted
          pulse={ok ? 0.2 : 0}
        />
        <Tag position={[0, mode === "alloc" ? 4.9 : 3.1, -3.4]} tone={ok ? "teal" : "rose"} size="xs" center>
          {ok ? t.fixed : t.broken}
        </Tag>

        <IsoDust count={20} center={[0, 1.4, 0]} spread={[4, 0.8, 2.4]} />
      </Stage>
    </Figure>
  );
}
