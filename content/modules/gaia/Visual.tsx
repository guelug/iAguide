"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useRef, useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Halo, Node3D, Ribbon, ShadowBlob, Slab, Tag, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "quiz" | "gaia" | "product";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "quiz_vs_gaia": "quiz vs GAIA",
      "easy_for_people_hard_for_loops": "easy for people, hard for loops",
      "product": "product",
      "product_2": "Product"
    },
    es: {
      "quiz_vs_gaia": "quiz vs GAIA",
      "easy_for_people_hard_for_loops": "fácil para personas, difícil para bucles",
      "product": "producto",
      "product_2": "Producto"
    },
  });
  const [mode, setMode] = useState<Mode>("quiz");
  return (
    <Figure
      label={t.quiz_vs_gaia}
      hint={t.easy_for_people_hard_for_loops}
      legend={[
          { color: P.amber, label: "quiz" },
          { color: P.teal, label: "gaia" },
          { color: P.violet, label: t.product }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "quiz", label: "Quiz", tone: P.amber },
            { value: "gaia", label: "GAIA", tone: P.teal },
            { value: "product", label: t.product_2, tone: P.violet }
          ]}
          ariaLabel={t.easy_for_people_hard_for_loops}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.1, 0.2, 0]} size={[2.0, 1.8, 0.12]} color={P.amber} fill={mode === "quiz" ? 0.32 : 0.12} />
        <Tag position={[-2.1, 1.25, 0.2]} tone="amber">multiple choice</Tag>
        <Slab position={[2.1, 0.2, 0]} size={[2.0, 1.8, 0.12]} color={P.teal} fill={mode !== "quiz" ? 0.32 : 0.12} />
        <Tag position={[2.1, 1.25, 0.2]} tone="teal">multi-hop tools</Tag>
        <Node3D position={[0, 0.2, 0]} color={mode === "product" ? P.violet : P.lineStrong} radius={0.2} />
        <Tag position={[0, -0.4, 0.2]} tone="violet">{mode === "product" ? "your users" : "not equal"}</Tag>
        <Wire points={[[-1.05, 0.2, 0], [-0.25, 0.2, 0]]} dashed={mode !== "product"} />
        <Wire points={[[0.25, 0.2, 0], [1.05, 0.2, 0]]} dashed={mode !== "product"} />
    
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: un quiz de opción múltiple frente a una tarea con forma GAIA.
 * Cada estación del raíl es un paso que el bucle debe ejecutar. La columna
 * junto a cada estación es la probabilidad de seguir en pie: p^k tras k
 * pasos (modelo didáctico de pasos independientes). La compuerta final es
 * el exact match: con el envoltorio «FINAL ANSWER» la respuesta vale cero.
 */

type Exam = "quiz" | "gaia" | "users";
type Output = "clean" | "wrapped";
type StationKind = "options" | "painting" | "fruit" | "film" | "liner" | "menu" | "order" | "pdf" | "calendar" | "calculator";

const EXAMS: Record<Exam, { title: string; stations: { kind: StationKind; label: string }[] }> = {
  quiz: { title: "Quiz del glosario", stations: [{ kind: "options", label: "elige A–D" }] },
  gaia: {
    title: "Pregunta del bordado",
    stations: [
      { kind: "painting", label: "cuadro 2008" },
      { kind: "fruit", label: "frutas" },
      { kind: "film", label: "película" },
      { kind: "liner", label: "transatlántico" },
      { kind: "menu", label: "menú 1949" },
      { kind: "order", label: "orden horario" },
    ],
  },
  users: {
    title: "Tarea de soporte",
    stations: [
      { kind: "pdf", label: "leer PDF" },
      { kind: "calendar", label: "calendario" },
      { kind: "calculator", label: "calculadora" },
    ],
  },
};

const esPct = new Intl.NumberFormat("es-ES", { style: "percent", maximumFractionDigits: 1 });
const es2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const es1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

function Mat({ color, rough = 0.4 }: { color: string; rough?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} clearcoat={0.4} clearcoatRoughness={0.3} />;
}

/** Pequeño objeto que identifica qué hace cada paso. Todos caben en ~0,6 m. */
function StationProp({ kind, lit }: { kind: StationKind; lit: boolean }) {
  const k = lit ? 1 : 0.55;
  const c = (hex: string) => mixHex(P.paper, hex, k);
  switch (kind) {
    case "options":
      return (
        <group>
          {[0, 1, 2, 3].map((i) => (
            <RoundedBox key={i} args={[0.5, 0.05, 0.1]} position={[0, 0.06 + i * 0.001, -0.2 + i * 0.13]} radius={0.02} smoothness={2} castShadow>
              <Mat color={i === 2 ? c(P.amber) : "#E7E1D4"} />
            </RoundedBox>
          ))}
        </group>
      );
    case "painting":
      return (
        <group position={[0, 0.3, 0]} rotation={[-0.25, 0, 0]}>
          <RoundedBox args={[0.56, 0.44, 0.05]} radius={0.015} smoothness={2} castShadow>
            <Mat color="#8A6A3E" />
          </RoundedBox>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.46, 0.34]} />
            <meshStandardMaterial color={c("#C9B98E")} roughness={0.8} />
          </mesh>
          {[[-0.1, 0.03, P.rose], [0.08, -0.05, P.amber], [0.12, 0.08, P.teal]].map(([x, y, col]) => (
            <mesh key={String(x)} position={[x as number, y as number, 0.05]}>
              <sphereGeometry args={[0.05, 16, 12]} />
              <meshStandardMaterial color={c(col as string)} roughness={0.5} />
            </mesh>
          ))}
        </group>
      );
    case "fruit":
      return (
        <group>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.2, 0.08, 28]} />
            <Mat color="#E7E1D4" />
          </mesh>
          {[P.rose, P.amber, "#7A9A3A", P.violet].map((col, i) => (
            <mesh key={i} position={[Math.cos(i * 1.6) * 0.12, 0.16, Math.sin(i * 1.6) * 0.12]} castShadow>
              <sphereGeometry args={[0.075, 18, 14]} />
              <Mat color={c(col)} rough={0.35} />
            </mesh>
          ))}
        </group>
      );
    case "film":
      return (
        <group position={[0, 0.27, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.24, 0.24, 0.08, 32]} />
            <Mat color={c("#2C3332")} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.256) * 0.13, 0.045, Math.sin(i * 1.256) * 0.13]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.01, 16]} />
              <meshStandardMaterial color="#B9B09E" />
            </mesh>
          ))}
        </group>
      );
    case "liner":
      return (
        <group position={[0, 0.08, 0]}>
          <RoundedBox args={[0.62, 0.12, 0.2]} radius={0.05} smoothness={3} castShadow>
            <Mat color={c("#2C3332")} />
          </RoundedBox>
          <RoundedBox args={[0.4, 0.08, 0.16]} position={[0, 0.1, 0]} radius={0.02} smoothness={2} castShadow>
            <Mat color="#EFEAE0" />
          </RoundedBox>
          {[-0.1, 0.06].map((x) => (
            <mesh key={x} position={[x, 0.21, 0]} castShadow>
              <cylinderGeometry args={[0.035, 0.04, 0.12, 14]} />
              <Mat color={c(P.rose)} />
            </mesh>
          ))}
        </group>
      );
    case "menu":
    case "pdf":
      return (
        <group>
          {[0, 1, 2].map((i) => (
            <RoundedBox key={i} args={[0.4, 0.02, 0.52]} position={[i * 0.02, 0.03 + i * 0.03, -i * 0.02]} rotation={[0, 0.1 * i, 0]} radius={0.008} smoothness={2} castShadow>
              <Mat color={i === 2 ? c(kind === "pdf" ? P.rose : P.amber) : "#EFEAE0"} rough={0.6} />
            </RoundedBox>
          ))}
        </group>
      );
    case "order":
      return (
        <group position={[0, 0.03, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.18, 0.24, 40]} />
            <meshStandardMaterial color={c(P.teal)} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.sin(i * 1.57) * 0.21, 0.05, -Math.cos(i * 1.57) * 0.21]} castShadow>
              <boxGeometry args={[0.07, 0.07, 0.07]} />
              <Mat color={i === 0 ? c(P.rose) : "#E7E1D4"} />
            </mesh>
          ))}
        </group>
      );
    case "calendar":
      return (
        <group position={[0, 0.03, 0]}>
          <RoundedBox args={[0.5, 0.04, 0.46]} radius={0.015} smoothness={2} castShadow>
            <Mat color="#EFEAE0" />
          </RoundedBox>
          {Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} position={[-0.17 + (i % 4) * 0.115, 0.03, -0.12 + Math.floor(i / 4) * 0.12]}>
              <boxGeometry args={[0.08, 0.02, 0.08]} />
              <meshStandardMaterial color={i === 6 ? c(P.teal) : "#D2CABB"} />
            </mesh>
          ))}
        </group>
      );
    case "calculator":
      return (
        <group position={[0, 0.05, 0]}>
          <RoundedBox args={[0.36, 0.08, 0.5]} radius={0.025} smoothness={2} castShadow>
            <Mat color={c("#2C3332")} />
          </RoundedBox>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[-0.1 + (i % 3) * 0.1, 0.05, -0.05 + Math.floor(i / 3) * 0.09]}>
              <boxGeometry args={[0.07, 0.03, 0.07]} />
              <meshStandardMaterial color={i === 8 ? c(P.amber) : "#B9B09E"} />
            </mesh>
          ))}
        </group>
      );
  }
}

const COL_H = 1.7;
const BASE_Y = 0.3;

/** Avanza un contador desde dentro del Stage: respeta pausa y movimiento reducido. */
function Ticker({ seconds, onTick }: { seconds: number; onTick: () => void }) {
  const { still } = useStage();
  const elapsed = useRef(0);
  useFrame((_, dt) => {
    if (still) {
      elapsed.current = 0;
      return;
    }
    elapsed.current += dt;
    if (elapsed.current >= seconds) {
      elapsed.current = 0;
      onTick();
    }
  });
  return null;
}

function Traveller({ target }: { target: V3 }) {
  const ref = useRef<import("three").Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = still ? 1 : 1 - Math.exp(-6 * dt);
    g.position.x += (target[0] - g.position.x) * k;
    g.position.y += (target[1] - g.position.y) * k;
    g.position.z += (target[2] - g.position.z) * k;
  });
  return (
    <group ref={ref} position={target}>
      <Node3D position={[0, 0, 0]} color={P.violet} radius={0.13} />
      <Halo position={[0, -0.12, 0]} radius={0.2} thickness={0.01} color={P.violet} />
    </group>
  );
}

function ExamBench({ exam, p, output, cursor }: { exam: Exam; p: number; output: Output; cursor: number }) {
  const stations = EXAMS[exam].stations;
  const count = stations.length;
  const pitch = count > 1 ? Math.min(1.25, 6 / count) : 1.2;
  const x0 = -((count + 1) * pitch) / 2;
  const sx = (i: number) => x0 + (i + 1) * pitch;
  const gateX = sx(count) + 0.1;
  const survival = (k: number) => Math.pow(p, k);
  const final = output === "wrapped" ? 0 : survival(count);
  const width = (count + 2.4) * pitch + 0.6;
  const rail: V3[] = [[x0 + 0.1, BASE_Y + 0.16, 0.25], [gateX + 0.9, BASE_Y + 0.16, 0.25]];
  const atGate = cursor >= count;
  const target: V3 = atGate ? [gateX + 0.75, BASE_Y + 0.35, 0.25] : [sx(cursor), BASE_Y + 0.62, 0.25];
  return (
    <group>
      <ShadowBlob position={[(x0 + gateX + 0.9) / 2, 0.004, 0]} scale={width * 0.8} opacity={0.1} />
      <RoundedBox args={[width, 0.24, 2.6]} position={[(x0 + gateX + 0.9) / 2, 0.12, -0.05]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
      </RoundedBox>
      <Ribbon points={rail} color="#8C9895" radius={0.025} />
      <Ribbon points={rail.map(([x, y, z]) => [x, y, z + 0.12] as V3)} color="#8C9895" radius={0.025} />

      {/* columna inicial: el bucle empieza con probabilidad 1 */}
      <DampedColumn x={x0 + 0.1} height={COL_H} color={mixHex(P.paper, P.teal, 0.5)} />
      {stations.map((s, i) => {
        const lit = cursor >= i;
        return (
          <group key={`${exam}-${i}`}>
            <RoundedBox args={[0.78, 0.1, 0.78]} position={[sx(i), BASE_Y + 0.05, 0.25]} radius={0.04} smoothness={2} castShadow receiveShadow>
              <meshStandardMaterial color={cursor === i ? "#2C3332" : "#9DA5A0"} roughness={0.4} metalness={0.25} />
            </RoundedBox>
            <group position={[sx(i), BASE_Y + 0.1, 0.25]}>
              <StationProp kind={s.kind} lit={lit} />
            </group>
            <DampedColumn x={sx(i)} height={survival(i + 1) * COL_H} color={lit ? P.teal : mixHex(P.paper, P.teal, 0.35)} />
            <Tag position={[sx(i), BASE_Y, 0.95]} tone={cursor === i ? "ink" : "muted"} size="xs" center plate={cursor === i}>
              {s.label}
            </Tag>
          </group>
        );
      })}

      {/* compuerta de exact match */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.14, 0.62, 0.34]}
          position={[gateX + 0.4, BASE_Y + 0.31, 0.25 + side * (output === "wrapped" ? 0.17 : 0.34)]}
          radius={0.03}
          smoothness={2}
          castShadow
        >
          <meshPhysicalMaterial color={output === "wrapped" ? P.rose : "#2C3332"} roughness={0.4} clearcoat={0.4} />
        </RoundedBox>
      ))}
      <DampedColumn x={gateX + 0.9} height={final * COL_H} color={output === "wrapped" ? P.rose : P.violet} />
      <Tag position={[gateX + 0.4, BASE_Y, 0.95]} tone={output === "wrapped" ? "rose" : "ink"} size="xs" center>
        exact match
      </Tag>
      <Tag position={[x0 + 0.1, BASE_Y + COL_H + 0.3, -0.7]} tone="teal" size="xs" center>
        sigue en pie
      </Tag>
      <Tag position={[gateX + 0.9, BASE_Y + Math.max(final, 0.02) * COL_H + 0.3, -0.7]} tone={output === "wrapped" ? "rose" : "violet"} size="xs" center>
        {esPct.format(final)}
      </Tag>
      <Traveller target={target} />
    </group>
  );
}

function DampedColumn({ x, height, color }: { x: number; height: number; color: string }) {
  const ref = useRef<import("three").Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const t = Math.max(0.002, height);
    g.scale.y = still ? t : g.scale.y + (t - g.scale.y) * (1 - Math.exp(-5 * dt));
  });
  return (
    <group position={[x, BASE_Y, -0.7]}>
      <RoundedBox args={[0.42, 0.06, 0.42]} position={[0, 0.03, 0]} radius={0.02} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#8C9895" metalness={0.5} roughness={0.35} />
      </RoundedBox>
      <group ref={ref} position={[0, 0.06, 0]} scale={[1, Math.max(0.002, height), 1]}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 1, 0.3]} />
          <meshPhysicalMaterial color={color} roughness={0.34} clearcoat={0.5} clearcoatRoughness={0.22} />
        </mesh>
      </group>
    </group>
  );
}

function SpanishVisual() {
  const [exam, setExam] = useState<Exam>("gaia");
  const [p, setP] = useState(0.85);
  const [output, setOutput] = useState<Output>("clean");
  const [cursor, setCursor] = useState(0);
  const steps = EXAMS[exam].stations.length;
  const pos = Math.min(cursor, steps);
  const success = output === "wrapped" ? 0 : Math.pow(p, steps);
  const quiz = p;
  const rows = 20;

  const lead: Record<Exam, string> = {
    quiz: "Un quiz de opción múltiple es un solo paso sin tools: reconocer la palabra correcta. Mide vocabulario, no el bucle.",
    gaia: "La pregunta del bordado (parafraseada) exige seis pasos encadenados: mirar el cuadro, nombrar las frutas, identificar la película, el transatlántico, su menú de octubre de 1949 y devolver la lista en sentido horario y en plural. Un paso fallido tira todo lo demás.",
    users: "Quizly, con forma GAIA en su dominio: leer un PDF, consultar un calendario, calcular y devolver solo la cifra. Es el tipo de tarea que hacen tus usuarios, no un glosario.",
  };

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
        {[
          ["Pasos del bucle", String(steps)],
          ["P(acierto) = p^pasos", esPct.format(success)],
          [`Esperado en ${rows} filas`, `${es1.format(success * rows)} / ${rows}`],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className="mt-1 block font-display text-xl text-ink">{value}</strong>
          </div>
        ))}
      </div>
      <p>{lead[exam]}</p>
      <p>
        Con fiabilidad p = {es2.format(p)} por paso, el quiz acierta el {esPct.format(quiz)} y esta tarea el {esPct.format(success)}
        {exam === "quiz" ? "" : `: la columna de cada estación es p^k y cae a ${esPct.format(Math.pow(p, steps))} tras ${steps} pasos`}.{" "}
        {output === "wrapped"
          ? "Con el envoltorio «FINAL ANSWER: …» la compuerta de exact match se cierra: la respuesta puede ser correcta y puntúa cero."
          : "La compuerta de exact match compara la cadena tal cual: «apples, bananas» no es «apple, banana»."}
      </p>
      <p className="text-xs text-muted">
        Modelo didáctico: pasos independientes con la misma fiabilidad. Las cifras reales del curso son otras: humanos ~92 %, GPT-4 con plugins ~15 %,
        barra del certificado 30 % en 20 preguntas de Nivel 1. Esos números miden su agente, no tu producto.
      </p>
    </div>
  );

  return (
    <Figure
      label="Quiz frente a tarea con forma GAIA"
      hint="cada estación es un paso del bucle · la columna, lo que sigue en pie"
      height="h-[500px] md:h-[580px]"
      legend={[
        { color: P.teal, label: "probabilidad p^k" },
        { color: P.violet, label: "respuesta que puntúa" },
        { color: P.rose, label: "anulada por formato" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            ariaLabel="Examen"
            value={exam}
            onChange={(v) => {
              setExam(v);
              setCursor(0);
            }}
            options={[
              { value: "quiz", label: "Quiz", tone: P.amber },
              { value: "gaia", label: "GAIA", tone: P.teal },
              { value: "users", label: "Tus usuarios", tone: P.violet },
            ]}
          />
          <Switcher
            ariaLabel="Formato de salida"
            value={output}
            onChange={setOutput}
            options={[
              { value: "clean", label: "Solo respuesta", tone: P.inkSoft },
              { value: "wrapped", label: "FINAL ANSWER", tone: P.rose },
            ]}
          />
          <Knob label="Fiabilidad p" min={0.5} max={0.99} step={0.01} value={p} onChange={setP} format={(v) => es2.format(v)} tone={P.teal} />
          <Readout items={[{ label: "paso", value: pos >= steps ? "compuerta" : `${pos + 1}/${steps}`, tone: P.violet }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-3.5, 5, 9.5], fov: 34 }} fit={1.08}>
        <ExamBench exam={exam} p={p} output={output} cursor={pos} />
        <Ticker seconds={1.3} onTick={() => setCursor((c) => (Math.min(c, steps) + 1) % (steps + 1))} />
      </Stage>
    </Figure>
  );
}
