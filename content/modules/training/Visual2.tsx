"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { Knob, Readout } from "@/components/three/Figure";
import { Arrow, ShadowBlob, type Cell, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

/* Training: forward/backward, Adam descending a valley, shuffled batches. */
type Mode = "fb" | "opt" | "data";

const COPY = {
  en: {
    one_step_three_views: "one step, three views",
    forward_backward_optimizer_data: "forward+backward · optimizer · data",
    fb: "fwd+bwd",
    optimizer: "optimizer",
    data: "data",
    forward: "forward",
    backward: "backward",
    adam: "adam",
    loss_valley: "loss valley",
    batch: "batch",
    shuffled: "shuffled",
    epoch: "epoch",
  },
  es: {
    one_step_three_views: "un paso, tres vistas",
    forward_backward_optimizer_data: "forward+backward · optimizador · datos",
    fb: "fwd+bwd",
    optimizer: "optimizador",
    data: "datos",
    forward: "forward",
    backward: "backward",
    adam: "adam",
    loss_valley: "valle de pérdida",
    batch: "lote",
    shuffled: "barajado",
    epoch: "época",
  },
};

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("fb");

  // a loss valley
  const valley = Array.from({ length: 60 }, (_, i) => {
    const x = -2.8 + i * 0.095;
    const y = -1.4 + Math.pow(x / 2.4, 2) * 1.6;
    return [x, y, 0] as [number, number, number];
  });

  const dataset = Array.from({ length: 24 }, (_, i) => ({
    position: [-1.7 + (i % 8) * 0.48, 0.95 - Math.floor(i / 8) * 0.5, 0] as [number, number, number],
    color: i % 4 === 0 ? P.amber : P.teal,
  }));

  return (
    <Figure
      label={t.one_step_three_views}
      hint={t.forward_backward_optimizer_data}
      legend={[
        { color: P.teal, label: t.forward },
        { color: P.rose, label: t.backward },
        { color: P.violet, label: t.adam },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "fb", label: t.fb, tone: P.teal },
            { value: "opt", label: t.optimizer, tone: P.violet },
            { value: "data", label: t.data, tone: P.amber },
          ]}
          ariaLabel={t.one_step_three_views}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "fb" && (
          <>
            {/* layer stack, forward teal, backward rose */}
            {[0, 1, 2, 3].map((i) => (
              <Slab
                key={i}
                position={[0, 1.4 - i * 0.85, 0]}
                size={[4.0, 0.5, 0.14]}
                color={i % 2 === 0 ? P.teal : P.violet}
                fill={0.16}
              />
            ))}
            <Flow points={[[-2.0, 1.6, 0], [0, 1.6, 0], [0, -1.0, 0], [2.0, -1.0, 0]]} color={P.teal} count={5} />
            <Tag position={[-2.2, 1.9, 0.15]} tone="teal" size="xs">{t.forward}</Tag>
            <Flow points={[[2.0, -1.0, 0], [0, -1.0, 0], [0, 1.6, 0], [-2.0, 1.6, 0]]} color={P.rose} count={5} size={0.045} />
            <Tag position={[2.2, -1.25, 0.15]} tone="rose" size="xs">{t.backward}</Tag>
            <Tag position={[2.2, 1.9, 0.15]} tone="muted" size="xs">loss</Tag>
          </>
        )}

        {mode === "opt" && (
          <>
            <Ribbon points={valley} color={P.lineStrong} radius={0.02} opacity={0.9} />
            {/* Adam steps descending */}
            {[
              [-2.2, 0.35],
              [-1.6, -0.35],
              [-1.0, -0.8],
              [-0.55, -1.1],
              [-0.2, -1.3],
              [0.0, -1.4],
            ].map(([x, y], i) => (
              <group key={i}>
                <Node3D position={[x, y, 0]} color={P.violet} radius={0.13} pulse={i * 0.3} />
                {i > 0 && (
                  <Wire
                    points={[[[-2.2, 0.35], [-1.6, -0.35], [-1.0, -0.8], [-0.55, -1.1], [-0.2, -1.3], [0.0, -1.4]][i - 1] as [number, number, number], [x, y, 0]]}
                    color={P.violet}
                    opacity={0.6}
                  />
                )}
              </group>
            ))}
            <Halo position={[0.0, -1.4, 0]} radius={0.45} color={P.violet} opacity={0.5} spin={0.2} />
            <Tag position={[0.9, -1.3, 0.15]} tone="violet" size="xs">min</Tag>
            <Tag position={[0, 2.0, 0.15]} tone="muted">{t.loss_valley} · {t.adam}</Tag>
          </>
        )}

        {mode === "data" && (
          <>
            <Lattice cells={dataset} size={0.22} opacity={0.85} />
            <Tag position={[0, 1.6, 0.15]} tone="teal" size="xs">dataset · {t.shuffled}</Tag>
            {/* batches come out 6 at a time */}
            {[0, 1, 2].map((b) => (
              <group key={b}>
                <Slab
                  position={[-1.7 + b * 1.85, -0.95, 0]}
                  size={[1.6, 0.55, 0.12]}
                  color={P.amber}
                  fill={0.22}
                />
                <Tag position={[-1.7 + b * 1.85, -1.5, 0.15]} tone="amber" size="xs">
                  {t.batch} {b + 1}
                </Tag>
              </group>
            ))}
            {[0, 1, 2].map((b) => (
              <Flow
                key={b}
                points={[[-1.7 + b * 1.85, 0.2, 0], [-1.7 + b * 1.85, -0.6, 0]]}
                color={P.amber}
                count={2}
                size={0.045}
              />
            ))}
            <Tag position={[2.7, 0.4, 0.15]} tone="muted" size="xs">{t.epoch}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Un paso de entrenamiento, tres vistas, todo calculado aquí:
 * 1. Forward/backward en una red 2→3→1 (tanh + lineal) con un ejemplo.
 *    El forward produce ŷ y la pérdida ½(ŷ−y)²; el backward aplica la
 *    regla de la cadena capa a capa; «aplicar paso» hace SGD.
 * 2. SGD frente a Adam en un valle alargado f = ½(x² + 25·y²).
 * 3. 24 ejemplos barajados con semilla por época y cortados en lotes.
 */

type TMode = "fb" | "opt" | "data";

const X_IN = [1.0, -0.5];
const Y_T = -0.4;
const W1_0 = [[0.6, -0.4], [-0.3, 0.8], [0.5, 0.2]]; // hidden × input
const W2_0 = [0.7, -0.5, 0.4]; // output × hidden

type Net = { W1: number[][]; W2: number[] };

function forwardBackward(net: Net) {
  const z1 = net.W1.map((row) => row[0] * X_IN[0] + row[1] * X_IN[1]);
  const h = z1.map(Math.tanh);
  const yHat = net.W2.reduce((a, w, j) => a + w * h[j], 0);
  const loss = 0.5 * (yHat - Y_T) ** 2;
  const dY = yHat - Y_T;
  const gW2 = h.map((hj) => dY * hj);
  const dH = net.W2.map((w) => dY * w);
  const dZ1 = dH.map((d, j) => d * (1 - h[j] * h[j]));
  const gW1 = dZ1.map((d) => X_IN.map((x) => d * x));
  return { z1, h, yHat, loss, dY, gW2, dH, dZ1, gW1 };
}

function trainNet(steps: number, lr: number): Net {
  let net: Net = { W1: W1_0.map((r) => [...r]), W2: [...W2_0] };
  for (let s = 0; s < steps; s += 1) {
    const g = forwardBackward(net);
    net = { W1: net.W1.map((r, j) => r.map((w, i) => w - lr * g.gW1[j][i])), W2: net.W2.map((w, j) => w - lr * g.gW2[j]) };
  }
  return net;
}

/* Valley: f = ½(x² + 25 y²). */
const VALLEY_A = 25;
const vf = (x: number, y: number) => 0.5 * (x * x + VALLEY_A * y * y);
function optPaths(lr: number, steps = 40) {
  const start: [number, number] = [-4, 1.2];
  const sgd: [number, number][] = [start];
  let p = [...start] as [number, number];
  for (let t = 0; t < steps; t += 1) {
    p = [p[0] - lr * p[0], p[1] - lr * VALLEY_A * p[1]];
    sgd.push([...p] as [number, number]);
  }
  const adam: [number, number][] = [start];
  const b1 = 0.9, b2 = 0.999, eps = 1e-8, alpha = 0.3;
  const q = [...start] as [number, number];
  const m = [0, 0], v = [0, 0];
  for (let t = 1; t <= steps; t += 1) {
    const g = [q[0], VALLEY_A * q[1]];
    for (let i = 0; i < 2; i += 1) {
      m[i] = b1 * m[i] + (1 - b1) * g[i];
      v[i] = b2 * v[i] + (1 - b2) * g[i] * g[i];
      const mh = m[i] / (1 - b1 ** t);
      const vh = v[i] / (1 - b2 ** t);
      q[i] -= (alpha * mh) / (Math.sqrt(vh) + eps);
    }
    adam.push([...q] as [number, number]);
  }
  return { sgd, adam };
}

/* Dataset shuffling. */
const DATASET_N = 24;
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function epochOrder(epoch: number) {
  const idx = Array.from({ length: DATASET_N }, (_, i) => i);
  const rnd = mulberry(1234 + epoch * 101);
  for (let i = idx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

const NT = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

function TMat({ color, rough = 0.42, coat = 0.5, metal = 0 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.25} />;
}

const LY = { in: -0.75, hid: 0.35, out: 1.45, loss: 2.35 };
const NODE_IN: V3[] = [[-0.8, LY.in + 0.2, 0], [0.8, LY.in + 0.2, 0]];
const NODE_H: V3[] = [[-1.3, LY.hid + 0.2, 0], [0, LY.hid + 0.2, 0], [1.3, LY.hid + 0.2, 0]];
const NODE_O: V3 = [0, LY.out + 0.2, 0];

function FbScene({ net, phase }: { net: Net; phase: "fwd" | "bwd" }) {
  const g = useMemo(() => forwardBackward(net), [net]);
  const fwd = phase === "fwd";
  const plate = (y: number, label: string, tone: "teal" | "violet" | "amber" | "ink") => (
    <group position={[0, y, 0]}>
      <RoundedBox args={[3.8, 0.1, 1.3]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <TMat color={mixHex(P.paper, P.inkSoft, 0.14)} rough={0.5} coat={0.3} />
      </RoundedBox>
      <Tag position={[-2.35, 0.1, 0.4]} tone={tone} size="xs" center>{label}</Tag>
    </group>
  );
  const nodeColor = (v: number) => (v >= 0 ? mixHex(P.tealWash, P.teal, Math.min(1, Math.abs(v))) : mixHex(P.amberWash, P.amber, Math.min(1, Math.abs(v))));
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -1.4, 0.2]} scale={6.5} opacity={0.12} />
        <RoundedBox args={[5.6, 0.3, 2.6]} position={[0, -1.2, 0]} radius={0.14} smoothness={4} castShadow receiveShadow>
          <TMat color="#3a3f44" rough={0.6} coat={0.2} />
        </RoundedBox>
        {[[-1.7, -0.5], [1.7, -0.5], [-1.7, 0.5], [1.7, 0.5]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.65, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 3.6, 12]} />
            <TMat color="#9aa3ab" metal={0.6} rough={0.3} coat={0} />
          </mesh>
        ))}
        {plate(LY.in, "entrada x", "ink")}
        {plate(LY.hid, "oculta tanh", "violet")}
        {plate(LY.out, "salida", "teal")}
        {NODE_IN.map((p, i) => <Node3D key={`i${i}`} position={p} color={nodeColor(X_IN[i])} radius={0.17} />)}
        {NODE_H.map((p, j) => <Node3D key={`h${j}`} position={p} color={nodeColor(fwd ? g.h[j] : -g.dZ1[j] * 4)} radius={0.17} />)}
        <Node3D position={NODE_O} color={nodeColor(fwd ? g.yHat : -g.dY * 2)} radius={0.2} />
        {/* weights as wires: width ∝ |w| */}
        {NODE_H.map((ph, j) => NODE_IN.map((pi, i) => (
          <Wire key={`w1${j}${i}`} points={[pi, ph]} color={net.W1[j][i] >= 0 ? P.teal : P.amber} width={0.6 + Math.abs(net.W1[j][i]) * 4} opacity={0.75} />
        )))}
        {NODE_H.map((ph, j) => <Wire key={`w2${j}`} points={[ph, NODE_O]} color={net.W2[j] >= 0 ? P.teal : P.amber} width={0.6 + Math.abs(net.W2[j]) * 4} opacity={0.75} />)}
        {/* signal: forward goes up, gradients come down */}
        {NODE_H.map((ph, j) => (
          <Flow key={`f${j}`} points={fwd ? [NODE_IN[j % 2], ph, NODE_O] : [NODE_O, ph, NODE_IN[j % 2]]} color={fwd ? P.teal : P.rose} count={2} speed={0.4} size={0.05} lineOpacity={0} offset={j / 3} />
        ))}
        {/* loss gauge on top */}
        <group position={[0, LY.loss, 0]}>
          <RoundedBox args={[1.5, 0.5, 0.6]} radius={0.08} smoothness={3} castShadow>
            <TMat color={mixHex(P.paper, P.rose, 0.35)} />
          </RoundedBox>
          <mesh position={[-0.75 + Math.min(1.4, g.loss * 1.5) / 2 + 0.05, 0, 0.31]}>
            <boxGeometry args={[Math.max(0.02, Math.min(1.4, g.loss * 1.5)), 0.14, 0.02]} />
            <meshBasicMaterial color={P.rose} />
          </mesh>
          <Tag position={[0, 0.5, 0]} tone="rose" center>{`pérdida ${NT.format(g.loss)}`}</Tag>
        </group>
        <Wire points={[NODE_O, [0, LY.loss - 0.25, 0]]} color={P.rose} width={1.4} dashed />
        <Tag position={[2.5, LY.hid + 0.2, 0.5]} tone={fwd ? "teal" : "rose"} size="xs" center>{fwd ? "forward: sube" : "backward: baja"}</Tag>
      </group>
    </PointerTilt>
  );
}

const VX = (x: number) => ((x + 4.5) / 5.5) * 6 - 3;
const VZ = (y: number) => -y * 1.25;
const VH = (x: number, y: number) => -0.95 + 0.04 + Math.sqrt(Math.min(vf(x, y), 40) / 40) * 0.75;

function OptScene({ lr }: { lr: number }) {
  const { sgd, adam } = useMemo(() => optPaths(lr), [lr]);
  const relief = useMemo<Cell[]>(() => {
    const cells: Cell[] = [];
    const nx = 34, ny = 16;
    for (let i = 0; i < nx; i += 1) {
      for (let j = 0; j < ny; j += 1) {
        const x = -4.5 + (i + 0.5) * (5.5 / nx);
        const y = -1.5 + (j + 0.5) * (3 / ny);
        const h = VH(x, y) + 0.95;
        cells.push({ position: [VX(x), -0.95 + h / 2, VZ(y)], scale: [6 / nx - 0.015, h, 3.75 / ny - 0.015], color: mixHex("#4CA69A", "#D7A258", Math.sqrt(Math.min(1, vf(x, y) / 40))) });
      }
    }
    return cells;
  }, []);
  const toPts = (path: [number, number][]) => path.map(([x, y]) => [VX(Math.max(-4.5, Math.min(1, x))), VH(x, y) + 0.12, VZ(Math.max(-1.5, Math.min(1.5, y)))] as V3);
  const sEnd = sgd[sgd.length - 1];
  const aEnd = adam[adam.length - 1];
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -1.4, 0.1]} scale={8} opacity={0.12} />
        <RoundedBox args={[7.0, 0.3, 4.6]} position={[0, -1.12, 0]} radius={0.14} smoothness={4} castShadow receiveShadow>
          <TMat color="#3a3f44" rough={0.6} coat={0.2} />
        </RoundedBox>
        <Lattice cells={relief} size={1} />
        <Wire points={toPts(sgd)} color={P.amberDeep} width={2.4} />
        <Wire points={toPts(adam)} color={P.violet} width={2.4} />
        <Node3D position={toPts([sgd[0]])[0]} color={P.ink} radius={0.1} />
        <Node3D position={toPts([sEnd])[0]} color={P.amber} radius={0.09} />
        <Node3D position={toPts([aEnd])[0]} color={P.violet} radius={0.09} />
        <Node3D position={[VX(0), VH(0, 0) + 0.1, VZ(0)]} color={P.teal} radius={0.07} matte />
        <Tag position={[toPts([sgd[0]])[0][0], toPts([sgd[0]])[0][1] + 0.35, toPts([sgd[0]])[0][2]]} tone="ink" size="xs" center>inicio</Tag>
        <Tag position={[VX(0) + 0.4, VH(0, 0) + 0.55, VZ(0) - 0.9]} tone="teal" size="xs" center>mínimo</Tag>
        <Tag position={[-2.2, 0.6, 1.7]} tone="amber" size="xs" center>SGD</Tag>
        <Tag position={[-2.2, 0.6, -1.5]} tone="violet" size="xs" center>Adam</Tag>
      </group>
    </PointerTilt>
  );
}

const hueOf = (i: number) => mixHex(mixHex(P.teal, P.violet, (i % 8) / 8), P.amber, Math.floor(i / 8) / 3);

function DataScene({ batch, epoch }: { batch: number; epoch: number }) {
  const order = useMemo(() => epochOrder(epoch), [epoch]);
  const nb = DATASET_N / batch;
  const pool = useMemo<Cell[]>(
    () => Array.from({ length: DATASET_N }, (_, i) => ({ position: [-1.5 + (i % 8) * 0.42, -0.78, -1.5 + Math.floor(i / 8) * 0.42] as V3, scale: [0.32, 0.32, 0.32] as V3, color: hueOf(i) })),
    [],
  );
  const trayW = 0.36 * Math.min(batch, 4) + 0.2;
  const rowsPer = Math.ceil(batch / 4);
  const gap = 0.25;
  const totalW = nb * trayW + (nb - 1) * gap;
  const batched = useMemo<Cell[]>(() => {
    const cells: Cell[] = [];
    order.forEach((idx, k) => {
      const b = Math.floor(k / batch);
      const w = k % batch;
      const x = -totalW / 2 + b * (trayW + gap) + 0.28 + (w % 4) * 0.36;
      cells.push({ position: [x, -0.85, 0.9 + Math.floor(w / 4) * 0.36], scale: [0.28, 0.28, 0.28], color: hueOf(idx) });
    });
    return cells;
  }, [order, batch, totalW, trayW]);
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -1.4, 0.3]} scale={9} opacity={0.12} />
        <RoundedBox args={[Math.max(7.5, totalW + 1), 0.3, 4.4]} position={[0, -1.18, 0.1]} radius={0.14} smoothness={4} castShadow receiveShadow>
          <TMat color="#3a3f44" rough={0.6} coat={0.2} />
        </RoundedBox>
        <RoundedBox args={[3.7, 0.12, 1.5]} position={[0, -1.0, -1.08]} radius={0.04} smoothness={2} receiveShadow castShadow>
          <TMat color={mixHex(P.paper, P.inkSoft, 0.2)} rough={0.5} />
        </RoundedBox>
        <Lattice cells={pool} size={1} />
        <Tag position={[0, -0.25, -1.3]} tone="ink" center>dataset · 24 ejemplos</Tag>
        {Array.from({ length: nb }, (_, b) => (
          <group key={b} position={[-totalW / 2 + b * (trayW + gap) + trayW / 2, -1.0, 0.9 + ((rowsPer - 1) * 0.36) / 2]}>
            <RoundedBox args={[trayW, 0.1, rowsPer * 0.36 + 0.2]} radius={0.03} smoothness={2} receiveShadow castShadow>
              <TMat color="#b68442" metal={0.55} rough={0.3} coat={0.2} />
            </RoundedBox>
            {nb <= 6 || b % 2 === 0 ? <Tag position={[0, -0.05, rowsPer * 0.18 + 0.35]} tone="muted" size="xs" center>{`lote ${b + 1}`}</Tag> : null}
          </group>
        ))}
        <Lattice cells={batched} size={1} />
        <Arrow from={[0, -0.55, -0.3]} to={[0, -0.6, 0.45]} color={P.amber} head={0.12} />
        <Tag position={[1.1, -0.55, 0.25]} tone="amber" size="xs" center>{`barajado · época ${epoch}`}</Tag>
      </group>
    </PointerTilt>
  );
}

const FB_LR = 0.5;

function SpanishVisual() {
  const [mode, setMode] = useState<TMode>("fb");
  const [phase, setPhase] = useState<"fwd" | "bwd">("fwd");
  const [steps, setSteps] = useState(0);
  const [lr, setLr] = useState(0.07);
  const [batch, setBatch] = useState(6);
  const [epoch, setEpoch] = useState(1);
  const net = useMemo(() => trainNet(steps, FB_LR), [steps]);
  const g = forwardBackward(net);
  const g0 = forwardBackward(trainNet(0, FB_LR));
  const paths = optPaths(lr);
  const sEnd = paths.sgd[paths.sgd.length - 1];
  const aEnd = paths.adam[paths.adam.length - 1];
  const order = epochOrder(epoch);
  let note;
  if (mode === "fb") {
    note = (
      <div className="space-y-2">
        <p><strong>{phase === "fwd" ? "Forward." : "Backward."}</strong> {phase === "fwd"
          ? `La entrada x = (1; −0,5) sube por las capas: h = tanh(W₁x), ŷ = W₂h = ${NT.format(g.yHat)} frente al objetivo ${Y_T.toLocaleString("es-ES")}.`
          : `El error ŷ − y = ${NT.format(g.dY)} baja capa a capa con la regla de la cadena: ∂L/∂W₂ = (ŷ−y)·h y ∂L/∂W₁ = (ŷ−y)·W₂·(1−h²)·x.`} Tras {steps} pasos de SGD (η = {FB_LR.toLocaleString("es-ES")}) la pérdida pasa de {NT.format(g0.loss)} a {NT.format(g.loss)}.</p>
        <Readout items={[
          { label: "h", value: g.h.map((v) => NT.format(v)).join(" · "), tone: "var(--violet)" },
          { label: "ŷ", value: NT.format(g.yHat), tone: "var(--teal)" },
          { label: "pérdida ½(ŷ−y)²", value: NT.format(g.loss), tone: "var(--rose)" },
          { label: "∂L/∂W₂", value: g.gW2.map((v) => NT.format(v)).join(" · "), tone: "var(--rose)" },
        ]} />
        <p className="text-xs text-muted">Red didáctica 2→3→1 con pesos iniciales fijos y un solo ejemplo; el grosor de cada cable es |w| y su color, el signo. Todas las cifras salen del cálculo en el navegador.</p>
      </div>
    );
  } else if (mode === "opt") {
    note = (
      <div className="space-y-2">
        <p><strong>Un valle alargado: f = ½(x² + 25·y²).</strong> SGD usa el mismo paso en las dos direcciones: en y (empinada) rebota de pared a pared y en x (plana) apenas avanza. Adam divide cada paso por la raíz de su media de gradientes al cuadrado (v_t) y suaviza la dirección con m_t, así que avanza parecido en ambas.</p>
        <Readout items={[
          { label: "η de SGD", value: lr.toLocaleString("es-ES"), tone: "var(--amber)" },
          { label: "SGD tras 40 pasos", value: `f = ${NT.format(vf(sEnd[0], sEnd[1]))}`, tone: "var(--amber)" },
          { label: "Adam tras 40 pasos", value: `f = ${NT.format(vf(aEnd[0], aEnd[1]))}`, tone: "var(--violet)" },
          { label: "inicio", value: `f = ${NT.format(vf(-4, 1.2))}`, tone: "var(--ink)" },
        ]} />
        <p className="text-xs text-muted">Adam con α = 0,3, β₁ = 0,9, β₂ = 0,999 y corrección de sesgo. Con η por encima de 0,08, SGD diverge en y (η·25 &gt; 2).</p>
      </div>
    );
  } else {
    note = (
      <div className="space-y-2">
        <p><strong>Época {epoch}: {DATASET_N} ejemplos en lotes de {batch} → {DATASET_N / batch} pasos por época.</strong> Cada época baraja el orden con otra semilla, así que ningún lote se repite igual y el gradiente de cada paso es una estimación distinta del gradiente total.</p>
        <Readout items={[
          { label: "pasos por época", value: String(DATASET_N / batch), tone: "var(--amber)" },
          { label: "primer lote", value: order.slice(0, batch).map((i) => `#${i + 1}`).join(" "), tone: "var(--teal)" },
          { label: "pasos en 3 épocas", value: String((DATASET_N / batch) * 3), tone: "var(--ink)" },
        ]} />
        <p className="text-xs text-muted">Barajado Fisher-Yates con semilla fija por época; el color de cada cubo identifica el ejemplo en el dataset y en su lote.</p>
      </div>
    );
  }
  return (
    <Figure
      label="Un paso de entrenamiento, tres vistas"
      hint={mode === "fb" ? "forward sube, backward baja" : mode === "opt" ? "SGD frente a Adam en un valle" : "barajar y cortar en lotes"}
      legend={mode === "fb" ? [{ color: P.teal, label: "forward / peso +" }, { color: P.rose, label: "backward / pérdida" }, { color: P.amber, label: "peso −" }] : mode === "opt" ? [{ color: P.amber, label: "SGD" }, { color: P.violet, label: "Adam" }, { color: P.teal, label: "mínimo" }] : [{ color: P.amber, label: "lote" }, { color: P.teal, label: "ejemplo" }]}
      note={note}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} options={[{ value: "fb", label: "Forward y backward", tone: P.teal }, { value: "opt", label: "Optimizador", tone: P.violet }, { value: "data", label: "Datos", tone: P.amber }]} ariaLabel="Vista" />
          {mode === "fb" ? (
            <>
              <Switcher value={phase} onChange={setPhase} options={[{ value: "fwd", label: "Forward", tone: P.teal }, { value: "bwd", label: "Backward", tone: P.rose }]} ariaLabel="Fase" />
              <button type="button" className="chip" onClick={() => setSteps((n) => Math.min(50, n + 1))}>Aplicar paso</button>
              <button type="button" className="chip" onClick={() => setSteps(0)}>Reiniciar</button>
            </>
          ) : mode === "opt" ? (
            <Knob label="η SGD" min={0.01} max={0.078} step={0.001} value={lr} onChange={setLr} format={(v) => v.toLocaleString("es-ES", { maximumFractionDigits: 3 })} tone={P.amber} />
          ) : (
            <>
              <Switcher value={String(batch)} onChange={(v) => setBatch(Number(v))} options={[4, 6, 8].map((b) => ({ value: String(b), label: `lote ${b}`, tone: P.amber }))} ariaLabel="Tamaño de lote" />
              <Knob label="época" min={1} max={3} value={epoch} onChange={setEpoch} tone={P.amber} />
            </>
          )}
        </>
      }
    >
      <Stage className="h-full w-full" camera={mode === "opt" ? { position: [0.8, 7.5, 7.0], fov: 34 } : { position: [1.2, 3.4, 10.5], fov: 34 }} fit={1.06} key={mode === "opt" ? "opt" : "std"}>
        {mode === "fb" ? <FbScene net={net} phase={phase} /> : mode === "opt" ? <OptScene lr={lr} /> : <DataScene batch={batch} epoch={epoch} />}
      </Stage>
    </Figure>
  );
}
