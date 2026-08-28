"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Arrow,
  Flow,
  Halo,
  Lattice,
  Marker,
  Node3D,
  PointerTilt,
  ShadowBlob,
  Tag,
  useCycle,
  type Cell,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "model" | "harness" | "metal";

const COPY = {
  en: {
    title: "which layer failed",
    hint: "same symptom, three different bills — probe one floor at a time",
    model: "Model",
    harness: "Harness",
    metal: "Metal",
    legendModel: "model",
    legendHarness: "harness",
    legendMetal: "metal",
    floors: ["harness", "model", "metal"],
    modelSymptoms: [
      "confident nonsense that survives a retry",
      "ignores an instruction that is genuinely in context",
      "quality drops when you swap the checkpoint, nothing else",
    ],
    harnessSymptoms: [
      "the tool never ran — check permissions, not the prompt",
      "context vanished after compaction",
      "cache misses on every turn: the prefix is not stable",
    ],
    metalSymptoms: [
      "first token is fast, the rest crawls — you are bandwidth bound",
      "it dies at long context: KV cache outgrew the memory",
      "swap thrash: the weights do not fit and never did",
    ],
    test: "cheapest test",
    modelTest: "same prompt, different model. Changes? model.",
    harnessTest: "replay the exact request by hand. Works? harness.",
    metalTest: "shrink context to 1k. Speeds up? metal.",
    probe: "probe",
  },
  es: {
    title: "qué capa falló",
    hint: "el mismo síntoma, tres facturas distintas — sondea un piso cada vez",
    model: "Modelo",
    harness: "Arnés",
    metal: "Metal",
    legendModel: "modelo",
    legendHarness: "arnés",
    legendMetal: "metal",
    floors: ["arnés", "modelo", "metal"],
    modelSymptoms: [
      "disparates con aplomo que sobreviven a un reintento",
      "ignora una instrucción que sí está en el contexto",
      "la calidad cae al cambiar el checkpoint y nada más",
    ],
    harnessSymptoms: [
      "la herramienta nunca se ejecutó — mira permisos, no el prompt",
      "el contexto desapareció tras la compactación",
      "fallos de caché en cada turno: el prefijo no es estable",
    ],
    metalSymptoms: [
      "el primer token vuela y el resto se arrastra — te limita el ancho de banda",
      "muere con contexto largo: la caché KV se comió la memoria",
      "swap sin parar: los pesos no caben, ni cabían",
    ],
    test: "prueba más barata",
    modelTest: "mismo prompt, otro modelo. ¿Cambia? modelo.",
    harnessTest: "repite la petición exacta a mano. ¿Funciona? arnés.",
    metalTest: "baja el contexto a 1k. ¿Acelera? metal.",
    probe: "sonda",
  },
};

/** Floors, top to bottom: the order a request actually travels. */
const FLOORS: { id: Mode; y: number; color: string }[] = [
  { id: "harness", y: 0.95, color: P.amber },
  { id: "model", y: 0, color: P.teal },
  { id: "metal", y: -0.95, color: P.violet },
];

function Floor({
  color,
  active,
  index,
}: {
  color: string;
  active: boolean;
  index: number;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    // The faulted floor slides out of the stack, like a drawer being pulled.
    g.position.z = MathUtils.damp(g.position.z, active ? 0.42 : 0, 6, dt);
    g.scale.setScalar(MathUtils.damp(g.scale.x, active ? 1.04 : 1, 6, dt));
  });

  return (
    <group ref={ref}>
      <RoundedBox args={[3.5, 0.7, 1.5]} radius={0.07} smoothness={3}>
        <meshStandardMaterial
          color={active ? color : P.surface}
          transparent
          opacity={active ? 0.32 : 0.94}
          roughness={0.52}
          metalness={0.02}
        />
      </RoundedBox>
      <FloorGuts index={index} color={color} active={active} />
      {active ? (
        <Halo position={[0, -0.4, 0]} radius={1.35} color={color} opacity={0.55} spin={0.2} />
      ) : null}
    </group>
  );
}

/** Each floor shows its own machinery, so the stack is legible frozen. */
function FloorGuts({ index, color, active }: { index: number; color: string; active: boolean }) {
  const tone = active ? color : P.line;
  if (index === 0) {
    // Harness: boxes wired in a row.
    return (
      <group position={[0, 0, 0.78]}>
        {[-1.1, -0.37, 0.37, 1.1].map((x, i) => (
          <group key={x}>
            <RoundedBox position={[x, 0, 0]} args={[0.4, 0.28, 0.1]} radius={0.05} smoothness={3}>
              <meshStandardMaterial color={i === 1 ? tone : P.sunken} roughness={0.45} />
            </RoundedBox>
            {i < 3 ? (
              <Arrow
                from={[x + 0.22, 0, 0]}
                to={[x + 0.51, 0, 0]}
                color={tone}
                width={1.2}
                head={0.07}
                opacity={active ? 0.9 : 0.4}
              />
            ) : null}
          </group>
        ))}
      </group>
    );
  }
  if (index === 1) {
    // Model: a dense block of weights.
    const cells: Cell[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 14; c++) {
        cells.push({
          position: [(c - 6.5) * 0.2, (r - 1) * 0.17, 0.78],
          scale: 1,
          color: active ? (r === 1 && c % 5 === 0 ? P.tealDeep : color) : P.line,
        });
      }
    }
    return <Lattice cells={cells} size={0.13} />;
  }
  // Metal: memory bank plus a bus that keeps moving.
  return (
    <group position={[0, 0, 0.78]}>
      {[-1.2, -0.72, -0.24, 0.24, 0.72, 1.2].map((x, i) => (
        <RoundedBox key={x} position={[x, 0.08, 0]} args={[0.34, 0.36, 0.08]} radius={0.03} smoothness={2}>
          <meshStandardMaterial color={active && i < 4 ? tone : P.sunken} roughness={0.42} metalness={0.1} />
        </RoundedBox>
      ))}
      <Flow
        points={[
          [-1.45, -0.24, 0],
          [1.45, -0.24, 0],
        ]}
        color={active ? color : P.line}
        count={4}
        speed={0.55}
        size={0.045}
        lineOpacity={active ? 0.5 : 0.2}
      />
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("model");
  const [line] = useCycle(3, 2.4);

  const symptoms =
    mode === "model" ? t.modelSymptoms : mode === "harness" ? t.harnessSymptoms : t.metalSymptoms;
  const test = mode === "model" ? t.modelTest : mode === "harness" ? t.harnessTest : t.metalTest;
  const accent = mode === "model" ? P.teal : mode === "harness" ? P.amber : P.violet;
  const activeIndex = FLOORS.findIndex((f) => f.id === mode);

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.amber, label: t.legendHarness },
        { color: P.teal, label: t.legendModel },
        { color: P.violet, label: t.legendMetal },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "harness", label: t.harness, tone: P.amber },
            { value: "model", label: t.model, tone: P.teal },
            { value: "metal", label: t.metal, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      height="h-[380px] md:h-[470px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.7, 7.6], fov: 40 }} background={P.paper} fit={1.1}>
        <PointerTilt amount={0.08}>
          <group rotation={[-0.14, 0.42, 0]} position={[-0.7, 0.35, 0]}>
            <ShadowBlob position={[0, -1.55, 0]} scale={5.4} opacity={0.06} />
            {FLOORS.map((f, i) => (
              <group key={f.id} position={[0, f.y, 0]} onClick={() => setMode(f.id)}>
                <Floor color={f.color} active={f.id === mode} index={i} />
                <Marker position={[-2.05, 0, 0.5]} n={i + 1} color={f.id === mode ? f.color : P.faint} />
                <Tag position={[-2.05, 0.32, 0.5]} tone={f.id === mode ? "ink" : "muted"} size="xs" center>
                  {t.floors[i]}
                </Tag>
              </group>
            ))}

            {/* The probe: one measurement, pointed at one floor. */}
            <group position={[2.55, FLOORS[activeIndex].y, 0.6]}>
              <Node3D position={[0, 0, 0]} color={accent} radius={0.13} pulse={0.2} />
              <Arrow from={[0, 0, 0]} to={[-0.62, 0, 0]} color={accent} width={1.8} head={0.11} />
              <Tag position={[0.5, 0, 0]} tone="ink" size="xs">
                {t.probe}
              </Tag>
            </group>
          </group>
        </PointerTilt>

        {/* Symptoms cycle: what this floor's failure actually looks like. */}
        <group position={[0, -1.95, 0]}>
          <Tag position={[0, 0.3, 0]} tone="ink" size="xs" center>
            {symptoms[line]}
          </Tag>
          <Tag position={[0, -0.02, 0]} tone={mode === "model" ? "teal" : mode === "harness" ? "amber" : "violet"} size="xs" center>
            {t.test}: {test}
          </Tag>
        </group>
      </Stage>
    </Figure>
  );
}
