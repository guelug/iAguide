"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BufferAttribute,
  Color,
  Group,
  PlaneGeometry,
  type Mesh,
} from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Bars,
  Halo,
  Node3D,
  PointerTilt,
  Ribbon,
  Tag,
  type V3,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * The loss landscape, walked for real.
 *
 * The surface is an actual function, the contour rings come from its
 * height in the fragment shader, and each optimizer's path is produced by
 * running that optimizer on that function's analytic gradient. Nothing
 * here is drawn by hand, so the shapes you see — SGD rattling across the
 * valley, momentum overshooting and coming back, Adam cutting a short
 * diagonal — are the algorithms' actual behaviour, not an illustration
 * of someone's memory of it.
 */

type Mode = "sgd" | "momentum" | "adam";

const COPY = {
  en: {
    title: "three optimizers, one landscape",
    hint: "contours are the loss; each path is that optimizer actually run on it",
    sgd: "SGD",
    momentum: "Momentum",
    adam: "Adam",
    legendLow: "low loss",
    legendHigh: "high loss",
    legendPath: "path taken",
    start: "start",
    steps: "steps to settle",
    final: "final loss",
    wander: "wander ×",
    never: "never",
    sgdNote:
      "a plain step follows the steepest direction, so a narrow valley makes it zig-zag across the walls instead of running down them — 150 steps in, it still has not settled",
    momentumNote:
      "carrying velocity smooths the zig-zag and crosses flat ground fast — at the price of sailing past the minimum before it turns",
    adamNote:
      "a per-parameter step size lets flat directions move as fast as steep ones, so it walks barely twice the straight-line distance where SGD walks five times it",
  },
  es: {
    title: "tres optimizadores, un paisaje",
    hint: "las curvas de nivel son la pérdida; cada camino es ese optimizador ejecutado de verdad",
    sgd: "SGD",
    momentum: "Momento",
    adam: "Adam",
    legendLow: "pérdida baja",
    legendHigh: "pérdida alta",
    legendPath: "camino recorrido",
    start: "inicio",
    steps: "pasos hasta asentarse",
    final: "pérdida final",
    wander: "vagabundeo ×",
    never: "nunca",
    sgdNote:
      "un paso simple sigue la dirección más empinada, así que un valle estrecho le hace zigzaguear entre las paredes en vez de bajar por él — a los 150 pasos aún no se ha asentado",
    momentumNote:
      "llevar velocidad suaviza el zigzag y cruza rápido lo llano — a cambio de pasarse del mínimo antes de girar",
    adamNote:
      "un paso por parámetro deja que las direcciones llanas avancen como las empinadas: recorre apenas el doble de la línea recta donde SGD recorre cinco veces",
  },
};

/* ----------------------------------------------------------- the function */

const A = 0.055;
const B = 2.6; // anisotropy: the valley is much steeper across than along
const C = 0.42;
const PX = 1.15;
const QZ = 0.95;
const D = 0.06;

/** Loss at a point on the plane. */
function loss(x: number, z: number) {
  return A * (x * x + B * z * z) + C * Math.sin(PX * x) * Math.cos(QZ * z) + D * x;
}

/** Its analytic gradient — the thing every optimizer below is handed. */
function grad(x: number, z: number): [number, number] {
  return [
    2 * A * x + C * PX * Math.cos(PX * x) * Math.cos(QZ * z) + D,
    2 * A * B * z - C * QZ * Math.sin(PX * x) * Math.sin(QZ * z),
  ];
}

const START: [number, number] = [-3.05, 2.05];
const STEPS = 150;
const HEIGHT = 1.35; // vertical exaggeration, so the terrain reads at all

type Run = { path: [number, number][]; settledAt: number; travelled: number };

/** Deterministic jitter: SGD is noisy because a batch is a sample. */
function noise(i: number, salt: number) {
  const v = Math.sin(i * 91.7 + salt * 47.3) * 43758.5453;
  return (v - Math.floor(v)) * 2 - 1;
}

function run(mode: Mode): Run {
  let [x, z] = START;
  const path: [number, number][] = [[x, z]];
  let vx = 0;
  let vz = 0;
  let mx = 0;
  let mz = 0;
  let sx = 0;
  let sz = 0;
  let travelled = 0;
  let settledAt = STEPS;

  for (let i = 1; i <= STEPS; i++) {
    const [gx, gz] = grad(x, z);
    let dx = 0;
    let dz = 0;

    if (mode === "sgd") {
      // Mini-batch noise, and a step small enough to survive the steep wall.
      const lr = 0.55;
      dx = -lr * (gx + noise(i, 1) * 0.18);
      dz = -lr * (gz + noise(i, 2) * 0.18);
    } else if (mode === "momentum") {
      const lr = 0.32;
      const beta = 0.86;
      vx = beta * vx - lr * gx;
      vz = beta * vz - lr * gz;
      dx = vx;
      dz = vz;
    } else {
      // Adam: first and second moment, bias-corrected.
      const lr = 0.16;
      const b1 = 0.9;
      const b2 = 0.999;
      const eps = 1e-8;
      mx = b1 * mx + (1 - b1) * gx;
      mz = b1 * mz + (1 - b1) * gz;
      sx = b2 * sx + (1 - b2) * gx * gx;
      sz = b2 * sz + (1 - b2) * gz * gz;
      const mhx = mx / (1 - Math.pow(b1, i));
      const mhz = mz / (1 - Math.pow(b1, i));
      const shx = sx / (1 - Math.pow(b2, i));
      const shz = sz / (1 - Math.pow(b2, i));
      dx = (-lr * mhx) / (Math.sqrt(shx) + eps);
      dz = (-lr * mhz) / (Math.sqrt(shz) + eps);
    }

    const nx = Math.max(-4, Math.min(4, x + dx));
    const nz = Math.max(-3, Math.min(3, z + dz));
    travelled += Math.hypot(nx - x, nz - z);
    x = nx;
    z = nz;
    path.push([x, z]);

    // "Settled" = the last 8 steps all moved less than a hair.
    if (settledAt === STEPS && i > 10) {
      let quiet = true;
      for (let k = 0; k < 8 && quiet; k++) {
        const a = path[i - k];
        const b = path[i - k - 1];
        if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 0.02) quiet = false;
      }
      if (quiet) settledAt = i;
    }
  }

  return { path, settledAt, travelled };
}

/* ------------------------------------------------------------- the terrain */

/**
 * Contour rings drawn from height in the fragment shader, so they stay
 * crisp at any tessellation and any zoom. Typed structurally because the
 * exact onBeforeCompile parameter type moves between three releases.
 */
function contourShader(shader: { vertexShader: string; fragmentShader: string }) {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying float vH;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvH = position.z;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying float vH;")
    .replace(
      "#include <dithering_fragment>",
      `float band = abs(fract(vH * 3.2) - 0.5);
       float ring = smoothstep(0.42, 0.5, band);
       gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.62, ring * 0.9);
       #include <dithering_fragment>`,
    );
}

function Terrain() {
  const geo = useMemo(() => {
    const g = new PlaneGeometry(8.4, 6.2, 128, 96);
    const pos = g.attributes.position as BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const low = new Color(P.tealWash);
    const mid = new Color(P.teal);
    const high = new Color(P.amber);
    const c = new Color();

    let min = Infinity;
    let max = -Infinity;
    const heights = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const h = loss(pos.getX(i), pos.getY(i));
      heights[i] = h;
      if (h < min) min = h;
      if (h > max) max = h;
    }
    for (let i = 0; i < pos.count; i++) {
      const h = heights[i];
      pos.setZ(i, (h - min) * HEIGHT);
      const t = (h - min) / (max - min);
      c.copy(t < 0.5 ? low.clone().lerp(mid, t * 2) : mid.clone().lerp(high, (t - 0.5) * 2));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  const mesh = useRef<Mesh>(null);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (m) m.geometry.computeBoundingBox();
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={mesh} geometry={geo}>
        <meshStandardMaterial
          vertexColors
          roughness={0.72}
          metalness={0.02}
          onBeforeCompile={contourShader}
        />
      </mesh>
      {/* A faint mesh over the surface: reads as a survey, not a blob. */}
      <mesh geometry={geo} userData={{ noFit: true }}>
        <meshBasicMaterial color={P.ink} wireframe transparent opacity={0.055} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- the walk */

const MIN_H = (() => {
  let m = Infinity;
  for (let x = -4.2; x <= 4.2; x += 0.05) {
    for (let z = -3.1; z <= 3.1; z += 0.05) m = Math.min(m, loss(x, z));
  }
  return m;
})();

/** Lift a plane coordinate onto the surface, plus a little clearance. */
function onSurface([x, z]: [number, number], lift = 0.09): V3 {
  return [x, (loss(x, z) - MIN_H) * HEIGHT + lift, z];
}

function Walker({ path, color }: { path: [number, number][]; color: string }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = (clock.elapsedTime * 0.18) % 1.25; // pause at the end
    const i = Math.min(path.length - 1, Math.floor(t * path.length));
    const p = onSurface(path[i], 0.14);
    g.position.set(p[0], p[1], p[2]);
  });
  return (
    <group ref={ref}>
      <Node3D position={[0, 0, 0]} color={color} radius={0.13} />
      <Halo radius={0.26} color={color} opacity={0.75} spin={0.9} />
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("sgd");

  const runs = useMemo(
    () => ({ sgd: run("sgd"), momentum: run("momentum"), adam: run("adam") }),
    [],
  );
  const active = runs[mode];
  const color = mode === "sgd" ? P.rose : mode === "momentum" ? P.amber : P.violet;
  const note = mode === "sgd" ? t.sgdNote : mode === "momentum" ? t.momentumNote : t.adamNote;

  // Thin the path for the tube: 150 segments of geometry is wasteful and
  // the shape is identical at a third of them.
  const ribbon = useMemo(
    () => active.path.filter((_, i) => i % 3 === 0 || i === active.path.length - 1).map((p) => onSurface(p)),
    [active],
  );

  const end = active.path[active.path.length - 1];
  const finalLoss = Math.max(0, loss(end[0], end[1]) - MIN_H);
  // How far it walked against how far it had to: 1.0 is a straight line.
  const direct = Math.hypot(end[0] - START[0], end[1] - START[1]) || 1;
  const wander = active.travelled / direct;
  const settled = active.settledAt < STEPS;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.tealWash, label: t.legendLow },
        { color: P.amber, label: t.legendHigh },
        { color, label: t.legendPath },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "sgd", label: t.sgd, tone: P.rose },
            { value: "momentum", label: t.momentum, tone: P.amber },
            { value: "adam", label: t.adam, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage
        className="h-full w-full"
        camera={{ position: [3.4, 4.6, 6.2], fov: 38 }}
        background={P.paper}
        fit={1.1}
      >
        <PointerTilt amount={0.06}>
          <group position={[0, -0.6, 0]}>
            <Terrain />
            <Ribbon points={ribbon} color={color} radius={0.035} />
            <Walker path={active.path} color={color} />
            <group position={onSurface(START, 0.16)}>
              <Node3D position={[0, 0, 0]} color={P.ink} radius={0.08} matte />
              <Tag position={[0, 0.34, 0]} tone="ink" size="xs" center>
                {t.start}
              </Tag>
            </group>
          </group>
        </PointerTilt>

        {/* What the three runs cost, measured off the walks above. */}
        <group position={[0, -2.35, 0]}>
          <Bars
            bars={[
              {
                label: t.steps,
                value: active.settledAt / STEPS,
                color,
                note: settled ? `${active.settledAt}` : t.never,
              },
              {
                label: t.wander,
                value: Math.min(1, wander / 5.5),
                color: P.inkSoft,
                note: `${wander.toFixed(2)}×`,
              },
              {
                label: t.final,
                value: Math.min(1, finalLoss / 1.2),
                color: P.teal,
                note: finalLoss.toFixed(3),
              },
            ]}
            height={0.62}
            width={0.4}
            gap={0.55}
            depth={0.28}
          />
        </group>

        <Tag position={[0, -3.35, 0]} tone="muted" size="xs" center>
          {note}
        </Tag>
      </Stage>
    </Figure>
  );
}
