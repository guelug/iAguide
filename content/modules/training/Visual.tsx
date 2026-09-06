"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  MathUtils,
  type Group,
} from "three";
import { Figure, Knob, Readout } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, Halo, Motes, Node3D, Tag, Wire } from "@/components/three/atoms";
import type { V3 } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import VisualLegacy from "./VisualLegacy";

type Weights = [number, number];

type DatasetRow = {
  x: number;
  y: number;
};

type SurfaceSample = {
  weights: Weights;
  loss: number;
  point: V3;
};

const COPY = {
  es: {
    label: "Laboratorio de descenso por gradiente",
    hint: "ajusta η y mueve los pesos por la superficie MSE",
    surface: "superficie MSE",
    trajectory: "trayectoria",
    weights: "pesos",
    loss: "pérdida",
    steps: "pasos",
    rate: "tasa η",
    step: "Paso",
    train: "Entrenar",
    stop: "Pausar entrenamiento",
    reset: "Reiniciar",
    formulaTitle: "La función que estamos minimizando",
    formulaNote: "Cada paso calcula el gradiente sobre los cinco ejemplos y desplaza el punto hacia una pérdida menor.",
    tableTitle: "Predicciones del punto actual",
    input: "x",
    target: "objetivo y",
    prediction: "predicción ŷ",
    squaredError: "error²",
    intercept: "w₀ · sesgo",
    slope: "w₁ · pendiente",
    mseAxis: "MSE · pérdida",
    dataset: "dataset fijo · regresión lineal",
    current: "punto actual",
  },
} as const;

type Labels = { [K in keyof typeof COPY.es]: string };

const ES_NUMBER_2 = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const ES_NUMBER_3 = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const DATASET: DatasetRow[] = [
  { x: -2, y: -1.9 },
  { x: -1, y: -0.4 },
  { x: 0, y: 0.8 },
  { x: 1, y: 2.1 },
  { x: 2, y: 3.4 },
];

const INITIAL_WEIGHTS: Weights = [2.4, -0.8];
const MAX_PATH_LENGTH = 120;
const GRID_SIZE = 29;
const DOMAIN = {
  w0Min: -2.4,
  w0Max: 3.4,
  w1Min: -1.8,
  w1Max: 3.6,
  width: 6.8,
  depth: 4.9,
  baseY: 0.32,
  height: 2.35,
  maxLoss: 30,
};

function predictionFor(weights: Weights, x: number) {
  return weights[0] + weights[1] * x;
}

function lossFor(weights: Weights) {
  return DATASET.reduce((sum, row) => {
    const error = predictionFor(weights, row.x) - row.y;
    return sum + error * error;
  }, 0) / DATASET.length;
}

function gradientFor(weights: Weights): Weights {
  const [dw0, dw1] = DATASET.reduce(
    ([intercept, slope], row) => {
      const error = predictionFor(weights, row.x) - row.y;
      return [intercept + error, slope + error * row.x];
    },
    [0, 0] as Weights,
  );

  return [(2 * dw0) / DATASET.length, (2 * dw1) / DATASET.length];
}

function descentStep(weights: Weights, learningRate: number): Weights {
  const [dw0, dw1] = gradientFor(weights);
  return [
    weights[0] - learningRate * dw0,
    weights[1] - learningRate * dw1,
  ];
}

function mapWeightToWorld(weight: number, min: number, max: number, size: number) {
  return ((weight - min) / (max - min) - 0.5) * size;
}

function surfaceHeight(loss: number, lift = 0) {
  const normalized = MathUtils.clamp(loss / DOMAIN.maxLoss, 0, 1);
  return DOMAIN.baseY + 0.08 + normalized * DOMAIN.height + lift;
}

function surfacePoint(weights: Weights, lift = 0): V3 {
  return [
    mapWeightToWorld(weights[0], DOMAIN.w0Min, DOMAIN.w0Max, DOMAIN.width),
    surfaceHeight(lossFor(weights), lift),
    mapWeightToWorld(weights[1], DOMAIN.w1Min, DOMAIN.w1Max, DOMAIN.depth),
  ];
}

function makeSurfaceGrid(): SurfaceSample[][] {
  return Array.from({ length: GRID_SIZE }, (_, rowIndex) => {
    const w1 = MathUtils.lerp(DOMAIN.w1Min, DOMAIN.w1Max, rowIndex / (GRID_SIZE - 1));
    return Array.from({ length: GRID_SIZE }, (_, columnIndex) => {
      const w0 = MathUtils.lerp(DOMAIN.w0Min, DOMAIN.w0Max, columnIndex / (GRID_SIZE - 1));
      const weights: Weights = [w0, w1];
      return { weights, loss: lossFor(weights), point: surfacePoint(weights) };
    });
  });
}

const SURFACE_GRID = makeSurfaceGrid();

function makeSurfaceGeometry() {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const teal = new Color("#4CA69A");
  const amber = new Color("#D7A258");

  for (const row of SURFACE_GRID) {
    for (const sample of row) {
      positions.push(...sample.point);
      const tone = MathUtils.clamp(sample.loss / DOMAIN.maxLoss, 0, 1);
      const color = teal.clone().lerp(amber, tone * 0.92);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let row = 0; row < GRID_SIZE - 1; row += 1) {
    for (let column = 0; column < GRID_SIZE - 1; column += 1) {
      const a = row * GRID_SIZE + column;
      const b = a + 1;
      const c = a + GRID_SIZE;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeMeshLines() {
  const lines: V3[][] = [];

  for (const row of SURFACE_GRID) {
    lines.push(row.map((sample) => [sample.point[0], sample.point[1] + 0.012, sample.point[2]] as V3));
  }

  for (let column = 0; column < GRID_SIZE; column += 1) {
    lines.push(
      SURFACE_GRID.map(
        (row) => [row[column].point[0], row[column].point[1] + 0.012, row[column].point[2]] as V3,
      ),
    );
  }

  return lines;
}

function makeContourSegments(level: number) {
  const segments: V3[][] = [];

  const interpolate = (a: SurfaceSample, b: SurfaceSample): V3 => {
    const denominator = b.loss - a.loss;
    const ratio = Math.abs(denominator) < 1e-8 ? 0.5 : MathUtils.clamp((level - a.loss) / denominator, 0, 1);
    return [
      MathUtils.lerp(a.point[0], b.point[0], ratio),
      surfaceHeight(level, 0.028),
      MathUtils.lerp(a.point[2], b.point[2], ratio),
    ];
  };

  for (let row = 0; row < GRID_SIZE - 1; row += 1) {
    for (let column = 0; column < GRID_SIZE - 1; column += 1) {
      const p00 = SURFACE_GRID[row][column];
      const p10 = SURFACE_GRID[row][column + 1];
      const p11 = SURFACE_GRID[row + 1][column + 1];
      const p01 = SURFACE_GRID[row + 1][column];
      const intersections: V3[] = [];

      if ((p00.loss < level) !== (p10.loss < level)) intersections.push(interpolate(p00, p10));
      if ((p10.loss < level) !== (p11.loss < level)) intersections.push(interpolate(p10, p11));
      if ((p11.loss < level) !== (p01.loss < level)) intersections.push(interpolate(p11, p01));
      if ((p01.loss < level) !== (p00.loss < level)) intersections.push(interpolate(p01, p00));

      for (let index = 0; index + 1 < intersections.length; index += 2) {
        segments.push([intersections[index], intersections[index + 1]]);
      }
    }
  }

  return segments;
}

const MESH_LINES = makeMeshLines();
const CONTOUR_LEVELS = [0.05, 0.15, 0.35, 0.7, 1.3, 2.4, 4.2, 7, 12, 20];
const CONTOURS = CONTOUR_LEVELS.flatMap((level) =>
  makeContourSegments(level).map((points) => ({ level, points })),
);

function BaseInstrument() {
  return (
    <group>
      <RoundedBox
        args={[8.1, 0.28, 6.15]}
        position={[0, 0.08, 0]}
        radius={0.18}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#DED6C7" roughness={0.34} metalness={0.04} envMapIntensity={0.95} />
      </RoundedBox>
      <RoundedBox
        args={[7.72, 0.13, 5.78]}
        position={[0, 0.27, 0]}
        radius={0.1}
        smoothness={3}
        receiveShadow
      >
        <meshStandardMaterial color="#C9BFAD" roughness={0.52} metalness={0.01} />
      </RoundedBox>
      <Wire
        points={[
          [-3.78, 0.35, -2.78],
          [3.78, 0.35, -2.78],
          [3.78, 0.35, 2.78],
          [-3.78, 0.35, 2.78],
          [-3.78, 0.35, -2.78],
        ]}
        color={P.lineStrong}
        width={1.4}
        opacity={0.82}
      />
    </group>
  );
}

function SurfaceAndScales({ labels }: { labels: Labels }) {
  const geometry = useMemo(() => makeSurfaceGeometry(), []);
  const xMin = -DOMAIN.width / 2;
  const xMax = DOMAIN.width / 2;
  const zMin = -DOMAIN.depth / 2;
  const zMax = DOMAIN.depth / 2;
  const axisY = DOMAIN.baseY + 0.03;
  const xTicks = [-2, 0, 2];
  const zTicks = [-1, 1, 3];

  return (
    <>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          vertexColors
          side={DoubleSide}
          roughness={0.48}
          metalness={0.015}
          envMapIntensity={0.78}
        />
      </mesh>

      {MESH_LINES.map((points, index) => (
        <Wire
          key={`mesh-${index}`}
          points={points}
          color={P.lineStrong}
          opacity={index < GRID_SIZE || index % 4 === 0 ? 0.46 : 0.35}
          width={index < GRID_SIZE || index % 4 === 0 ? 0.85 : 0.6}
        />
      ))}

      {CONTOURS.map(({ level, points }, index) => (
        <Wire
          key={`contour-${level}-${index}`}
          points={points}
          color={level <= 0.7 ? P.tealDeep : P.amberDeep}
          opacity={level <= 0.7 ? 0.5 : 0.4}
          width={level <= 0.7 ? 1.6 : 1.05}
        />
      ))}

      <Wire
        points={[
          [xMin, surfaceHeight(lossFor([DOMAIN.w0Min, DOMAIN.w1Min]), 0.035), zMin],
          [xMax, surfaceHeight(lossFor([DOMAIN.w0Max, DOMAIN.w1Min]), 0.035), zMin],
          [xMax, surfaceHeight(lossFor([DOMAIN.w0Max, DOMAIN.w1Max]), 0.035), zMax],
          [xMin, surfaceHeight(lossFor([DOMAIN.w0Min, DOMAIN.w1Max]), 0.035), zMax],
          [xMin, surfaceHeight(lossFor([DOMAIN.w0Min, DOMAIN.w1Min]), 0.035), zMin],
        ]}
        color={P.lineStrong}
        opacity={0.5}
        width={1.65}
      />

      <Arrow
        from={[xMin - 0.08, axisY, zMax + 0.12]}
        to={[xMax + 0.32, axisY, zMax + 0.12]}
        color={P.tealDeep}
        width={1.2}
        head={0.12}
      />
      <Arrow
        from={[xMin - 0.08, axisY, zMin - 0.08]}
        to={[xMin - 0.08, axisY, zMax + 0.28]}
        color={P.violetDeep}
        width={1.2}
        head={0.12}
      />
      <Tag position={[0, axisY + 0.04, zMax + 0.52]} tone="teal" size="xs" center plate={false}>
        {labels.intercept}
      </Tag>
      <Tag position={[xMin - 0.47, axisY + 0.04, 0]} tone="violet" size="xs" center plate={false}>
        {labels.slope}
      </Tag>
      <Tag position={[xMax - 0.25, surfaceHeight(DOMAIN.maxLoss, 0.18), zMin - 0.18]} tone="amber" size="xs" center plate={false}>
        {labels.mseAxis}
      </Tag>

      {xTicks.map((tick) => (
        <group key={`x-tick-${tick}`}>
          <Wire
            points={[
              [mapWeightToWorld(tick, DOMAIN.w0Min, DOMAIN.w0Max, DOMAIN.width), axisY, zMax + 0.12],
              [mapWeightToWorld(tick, DOMAIN.w0Min, DOMAIN.w0Max, DOMAIN.width), axisY + 0.09, zMax + 0.12],
            ]}
            color={P.tealDeep}
            opacity={0.74}
            width={1}
          />
          <Tag
            position={[mapWeightToWorld(tick, DOMAIN.w0Min, DOMAIN.w0Max, DOMAIN.width), axisY - 0.03, zMax + 0.42]}
            tone="muted"
            size="xs"
            center
            plate={false}
          >
            {String(tick)}
          </Tag>
        </group>
      ))}

      {zTicks.map((tick) => (
        <group key={`z-tick-${tick}`}>
          <Wire
            points={[
              [xMin - 0.08, axisY, mapWeightToWorld(tick, DOMAIN.w1Min, DOMAIN.w1Max, DOMAIN.depth)],
              [xMin - 0.08, axisY + 0.09, mapWeightToWorld(tick, DOMAIN.w1Min, DOMAIN.w1Max, DOMAIN.depth)],
            ]}
            color={P.violetDeep}
            opacity={0.74}
            width={1}
          />
          <Tag
            position={[xMin - 0.38, axisY - 0.03, mapWeightToWorld(tick, DOMAIN.w1Min, DOMAIN.w1Max, DOMAIN.depth)]}
            tone="muted"
            size="xs"
            center
            plate={false}
          >
            {String(tick)}
          </Tag>
        </group>
      ))}
    </>
  );
}

function AnimatedWeightMarker({ weights, labels }: { weights: Weights; labels: Labels }) {
  const ref = useRef<Group>(null);
  const target = useMemo(() => surfacePoint(weights, 0.16), [weights]);
  const positioned = useRef(false);
  const { still } = useStage();

  useFrame((_, delta) => {
    const marker = ref.current;
    if (!marker) return;
    if (!positioned.current) {
      marker.position.set(...target);
      positioned.current = true;
      return;
    }
    if (still) {
      marker.position.set(...target);
      return;
    }
    marker.position.x = MathUtils.damp(marker.position.x, target[0], 8, delta);
    marker.position.y = MathUtils.damp(marker.position.y, target[1], 8, delta);
    marker.position.z = MathUtils.damp(marker.position.z, target[2], 8, delta);
  });

  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.19, 0]} />
        <meshStandardMaterial color={P.rose} roughness={0.3} metalness={0.08} envMapIntensity={0.95} />
      </mesh>
      <mesh position={[0, -0.12, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.2, 12]} />
        <meshStandardMaterial color={P.roseDeep} roughness={0.4} metalness={0.04} />
      </mesh>
      <Halo position={[0, -0.2, 0]} radius={0.28} thickness={0.018} color={P.rose} opacity={0.72} />
      <Tag position={[0, 0.36, 0.12]} tone="rose" size="xs" center>
        {labels.current}
      </Tag>
    </group>
  );
}

function TrainingDriver({ active, onStep }: { active: boolean; onStep: () => void }) {
  const { still } = useStage();
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!active || still) {
      elapsed.current = 0;
      return;
    }

    elapsed.current += delta;
    if (elapsed.current >= 0.28) {
      elapsed.current = 0;
      onStep();
    }
  });

  return null;
}

function SpanishVisual() {
  const labels = COPY.es;
  const [learningRate, setLearningRate] = useState(0.12);
  const [weights, setWeights] = useState<Weights>(() => [...INITIAL_WEIGHTS]);
  const [trajectory, setTrajectory] = useState<Weights[]>(() => [[...INITIAL_WEIGHTS] as Weights]);
  const [stepCount, setStepCount] = useState(0);
  const [training, setTraining] = useState(false);
  const weightsRef = useRef<Weights>([...INITIAL_WEIGHTS]);

  const currentLoss = lossFor(weights);

  const handleStep = useCallback(() => {
    const next = descentStep(weightsRef.current, learningRate);
    weightsRef.current = next;
    setWeights(next);
    setTrajectory((path) => [...path, next].slice(-MAX_PATH_LENGTH));
    setStepCount((count) => count + 1);
  }, [learningRate]);

  const handleReset = useCallback(() => {
    const initial = [...INITIAL_WEIGHTS] as Weights;
    weightsRef.current = initial;
    setWeights(initial);
    setTrajectory([initial]);
    setStepCount(0);
    setTraining(false);
  }, []);

  const pathPoints = useMemo(() => trajectory.map((point) => surfacePoint(point, 0.045)), [trajectory]);

  const note = (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
      <div className="min-w-0">
        <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">{labels.formulaTitle}</p>
        <code className="block rounded-sm border border-line bg-sunken px-3 py-2 font-mono text-[0.78rem] leading-relaxed text-ink">
          MSE(w₀,w₁) = (1/n) Σᵢ (yᵢ − (w₀ + w₁ · xᵢ))²
        </code>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{labels.formulaNote}</p>
        <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint">{labels.dataset}</p>
      </div>
      <div className="min-w-0 overflow-x-auto">
        <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted">{labels.tableTitle}</p>
        <table className="w-full min-w-[470px] border-collapse text-right text-xs tabular-nums">
          <thead>
            <tr className="border-b border-line text-[0.62rem] uppercase tracking-[0.08em] text-muted">
              <th className="px-2 py-1 text-left font-medium">{labels.input}</th>
              <th className="px-2 py-1 font-medium">{labels.target}</th>
              <th className="px-2 py-1 font-medium">{labels.prediction}</th>
              <th className="px-2 py-1 font-medium">{labels.squaredError}</th>
            </tr>
          </thead>
          <tbody>
            {DATASET.map((row) => {
              const prediction = predictionFor(weights, row.x);
              const squaredError = (prediction - row.y) ** 2;
              return (
                <tr key={row.x} className="border-b border-line/60 last:border-0">
                  <th className="px-2 py-1.5 text-left font-medium text-ink">{String(row.x)}</th>
                  <td className="px-2 py-1.5 text-ink-soft">{ES_NUMBER_2.format(row.y)}</td>
                  <td className="px-2 py-1.5 text-teal">{ES_NUMBER_2.format(prediction)}</td>
                  <td className="px-2 py-1.5 text-rose">{ES_NUMBER_2.format(squaredError)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Figure
      label={labels.label}
      hint={labels.hint}
      height="h-[540px] md:h-[540px]"
      legend={[
        { color: P.teal, label: labels.surface },
        { color: P.violet, label: labels.trajectory },
        { color: P.rose, label: labels.weights },
      ]}
      note={note}
      controls={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Knob
            label={labels.rate}
            min={0.01}
            max={0.24}
            step={0.01}
            value={learningRate}
            onChange={setLearningRate}
            format={(value) => ES_NUMBER_2.format(value)}
            tone={P.teal}
          />
          <button type="button" className="chip" onClick={handleStep}>{labels.step}</button>
          <button type="button" className="chip" aria-pressed={training} onClick={() => setTraining((running) => !running)}>
            {training ? labels.stop : labels.train}
          </button>
          <button type="button" className="chip" onClick={handleReset}>{labels.reset}</button>
          <Readout
            items={[
              { label: "w₀", value: ES_NUMBER_2.format(weights[0]), tone: P.teal },
              { label: "w₁", value: ES_NUMBER_2.format(weights[1]), tone: P.violet },
              { label: labels.loss, value: ES_NUMBER_3.format(currentLoss), tone: P.rose },
              { label: labels.steps, value: String(stepCount), tone: P.muted },
            ]}
          />
        </div>
      }
    >
      <Stage fit={1.05} className="h-full w-full" camera={{ position: [8.4, 6.8, 9.4], fov: 38 }}>
        <Motes count={72} radius={8} color={P.lineStrong} size={0.022} opacity={0.15} />
        <BaseInstrument />
        <SurfaceAndScales labels={labels} />
        {pathPoints.length > 1 && <Wire points={pathPoints} color={P.violet} opacity={0.94} width={2.3} />}
        {trajectory.filter((_, index) => index > 0 && index % 4 === 0).map((point, index) => (
          <Node3D key={`path-${index}`} position={surfacePoint(point, 0.07)} color={P.violet} radius={0.045} matte />
        ))}
        <AnimatedWeightMarker weights={weights} labels={labels} />
        <TrainingDriver active={training} onStep={handleStep} />
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  const locale = useLocale();
  return locale === "es" ? <SpanishVisual /> : <VisualLegacy />;
}
