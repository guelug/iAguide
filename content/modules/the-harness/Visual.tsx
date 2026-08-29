"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Flow,
  Halo,
  Node3D,
  Ribbon,
  Tag,
  useCycle,
  type V3,
} from "@/components/three/atoms";
import {
  AxisLine,
  Duct,
  GlassPanel,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * One turn around the harness, drawn isometrically.
 *
 * The ring used to be seen from the front, which flattened it into a line
 * and stacked six labels on top of each other. A circle on the ground
 * plane under parallel projection is a clean ellipse instead, and the
 * station names can fan outwards along their own radius, so no two of
 * them ever meet.
 */

type Mode = "loop" | "tools" | "sub";

const COPY = {
  en: {
    title: "one turn around the harness",
    hint: "the ring is the loop; the bead is a single turn",
    loop: "Plain turn",
    tools: "Tool call",
    sub: "Subagent",
    legendLoop: "loop",
    legendTool: "tool detour",
    legendSub: "child loop",
    stations: [
      { name: "user", note: "a message lands on a thread" },
      { name: "assemble", note: "profile + history + tool schemas" },
      { name: "prefill", note: "the whole prompt, read in parallel" },
      { name: "decode", note: "one token at a time, reusing the KV cache" },
      { name: "act", note: "stop, or ask the harness to run something" },
      { name: "answer", note: "stream out, persist the thread" },
    ],
    toolPanel: "run tool",
    toolNote:
      "the detour hangs off act, the only station a turn can leave from: permission check, execute, append the result, and back to prefill with a longer prompt",
    subPanel: "child loop",
    subNote:
      "a subagent is the same ring again, with its own prompt and its own tools; it returns a summary, not a second brain",
    loopNote:
      "six stations, one bead. Swap the model and the ring is unchanged — that is what makes the harness a separate thing to debug",
  },
  es: {
    title: "un turno alrededor del arnés",
    hint: "el anillo es el bucle; la cuenta es un solo turno",
    loop: "Turno simple",
    tools: "Llamada a herramienta",
    sub: "Subagente",
    legendLoop: "bucle",
    legendTool: "desvío a herramienta",
    legendSub: "bucle hijo",
    stations: [
      { name: "usuario", note: "un mensaje aterriza en un hilo" },
      { name: "montaje", note: "perfil + historial + esquemas de herramientas" },
      { name: "prefill", note: "el prompt entero, leído en paralelo" },
      { name: "decode", note: "un token cada vez, reusando la caché KV" },
      { name: "actuar", note: "parar, o pedir al arnés que ejecute algo" },
      { name: "respuesta", note: "sale en streaming, se guarda el hilo" },
    ],
    toolPanel: "ejecutar",
    toolNote:
      "el desvío cuelga de actuar, la única estación desde la que un turno puede salir: permisos, ejecutar, añadir el resultado y volver a prefill con un prompt más largo",
    subPanel: "bucle hijo",
    subNote:
      "un subagente es el mismo anillo otra vez, con su prompt y sus herramientas; devuelve un resumen, no un segundo cerebro",
    loopNote:
      "seis estaciones, una cuenta. Cambia el modelo y el anillo no cambia — por eso el arnés es algo aparte que depurar",
  },
};

const R = 3.15;
const N = 6;

/** Stations on a circle in the ground plane; iso turns it into an ellipse. */
const ANGLES = Array.from({ length: N }, (_, i) => Math.PI / 2 + (i / N) * Math.PI * 2);
const RING: V3[] = ANGLES.map((a) => [Math.cos(a) * R, 0, Math.sin(a) * R]);
const PATH: V3[] = [...RING, RING[0]];

/** Labels ride their own radius, so six of them fan out instead of stacking. */
const LABELS: V3[] = ANGLES.map((a) => [Math.cos(a) * (R + 1.5), 0.95, Math.sin(a) * (R + 1.5)]);

function Station({
  index,
  active,
  color,
}: {
  index: number;
  active: boolean;
  color: string;
}) {
  const lift = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = lift.current;
    if (!g) return;
    g.position.y = MathUtils.damp(g.position.y, active ? 0.42 : 0.18, 6, dt);
    const s = MathUtils.damp(g.scale.x, active ? 1.15 : 1, 6, dt);
    g.scale.setScalar(s);
  });

  return (
    <group position={RING[index]}>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.54, 0.1, 6]} />
        <meshStandardMaterial
          color={active ? color : P.sunken}
          roughness={0.42}
          metalness={0.05}
          envMapIntensity={0.9}
        />
      </mesh>
      <group ref={lift} position={[0, 0.18, 0]}>
        <StationIcon index={index} color={active ? color : P.lineStrong} active={active} />
      </group>
      {active ? (
        <Halo position={[0, 0.11, 0]} radius={0.72} color={color} opacity={0.7} spin={0.35} />
      ) : null}
      <AxisLine
        from={[0, 0.12, 0]}
        to={[Math.cos(ANGLES[index]) * 1.5, 0.85, Math.sin(ANGLES[index]) * 1.5]}
        overrun={0.1}
        color={active ? color : P.line}
        opacity={active ? 0.5 : 0.25}
      />
    </group>
  );
}

/** Each station gets its own silhouette, so the ring reads frozen. */
function StationIcon({ index, color, active }: { index: number; color: string; active: boolean }) {
  if (index === 0) {
    return (
      <RoundedBox args={[0.5, 0.3, 0.34]} radius={0.06} smoothness={3} castShadow>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
      </RoundedBox>
    );
  }
  if (index === 1) {
    return (
      <group>
        {[0, 1, 2].map((i) => (
          <RoundedBox
            key={i}
            args={[0.5 - i * 0.08, 0.06, 0.36 - i * 0.05]}
            radius={0.02}
            position={[0, i * 0.09, 0]}
            castShadow
          >
            <meshStandardMaterial color={i === 2 ? color : P.line} roughness={0.5} />
          </RoundedBox>
        ))}
      </group>
    );
  }
  if (index === 2) {
    // Prefill: the whole prompt arriving at once.
    return (
      <group>
        {[-0.16, 0, 0.16].map((z) =>
          [-0.16, 0, 0.16].map((x) => (
            <mesh key={`${x}-${z}`} position={[x, 0.06, z]} castShadow>
              <boxGeometry args={[0.11, 0.11, 0.11]} />
              <meshStandardMaterial color={color} roughness={0.4} />
            </mesh>
          )),
        )}
      </group>
    );
  }
  if (index === 3) {
    // Decode: one token leaving at a time.
    return (
      <group>
        <mesh position={[-0.1, 0.09, 0]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.38} />
        </mesh>
        <Node3D position={[0.24, 0.09, 0]} color={color} radius={0.07} pulse={active ? 0.2 : 0} />
      </group>
    );
  }
  if (index === 4) {
    return (
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.16, 6]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.18} />
      </mesh>
    );
  }
  return (
    <RoundedBox
      args={[0.4, 0.26, 0.26]}
      radius={0.06}
      smoothness={3}
      position={[0, 0.08, 0]}
      castShadow
    >
      <meshStandardMaterial color={color} roughness={0.28} metalness={0.08} />
    </RoundedBox>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("loop");
  const [step] = useCycle(N, 1.9);

  const accent = mode === "tools" ? P.amber : mode === "sub" ? P.violet : P.teal;
  const note = mode === "tools" ? t.toolNote : mode === "sub" ? t.subNote : t.loopNote;

  // The detour hangs off station 4 — act — raised above the plate.
  const from = RING[4];
  const branch = useMemo<V3>(() => [from[0] - 2.6, 2.5, from[2] - 1.4], [from]);

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendLoop },
        { color: P.amber, label: t.legendTool },
        { color: P.violet, label: t.legendSub },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "loop", label: t.loop, tone: P.teal },
            { value: "tools", label: t.tools, tone: P.amber },
            { value: "sub", label: t.sub, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          <strong className="text-ink">
            {step + 1}. {t.stations[step].name}
          </strong>{" "}
          — {t.stations[step].note}
          <span className="mt-1.5 block text-muted">{note}</span>
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
        <IsoFrame width={13.5} depth={13.5} y={-0.04} />
        <PlanTrace
          points={[
            [-6, 4.4],
            [-2.4, 4.4],
            [-2.4, 2.2],
          ]}
          y={-0.03}
          color={P.line}
          opacity={0.8}
        />
        <PlanTrace
          points={[
            [6, -4.2],
            [3.2, -4.2],
            [3.2, -1.8],
          ]}
          y={-0.03}
          color={P.line}
          opacity={0.8}
        />

        {/* The ring itself, and the single turn travelling it. */}
        <Ribbon points={PATH} color={P.line} radius={0.03} />
        <Flow points={PATH} color={accent} count={4} speed={0.13} size={0.11} lineOpacity={0} />

        {RING.map((_, i) => (
          <Station key={i} index={i} active={i === step} color={accent} />
        ))}

        {LABELS.map((p, i) => (
          <Tag key={i} position={p} tone={i === step ? "ink" : "muted"} size="xs" center>
            {t.stations[i].name}
          </Tag>
        ))}

        {mode !== "loop" ? (
          <group>
            <Duct
              from={[from[0], 0.3, from[2]]}
              to={[branch[0], branch[1] - 0.5, branch[2]]}
              color={accent}
              radius={0.11}
              bend={0.9}
            />
            <GlassPanel
              position={branch}
              rotation={[0, Math.PI / 4, 0]}
              size={[2.4, 1.5]}
              color={accent}
              opacity={0.2}
            />
            <Tag
              position={[branch[0], branch[1] + 1.05, branch[2]]}
              tone={mode === "tools" ? "amber" : "violet"}
              size="xs"
              center
            >
              {mode === "tools" ? t.toolPanel : t.subPanel}
            </Tag>
            {mode === "sub" ? (
              <group position={[branch[0], branch[1], branch[2] + 0.05]}>
                <Flow
                  points={[
                    [-0.65, -0.3, 0],
                    [0, 0.35, 0.1],
                    [0.65, -0.3, 0],
                    [0, -0.6, -0.1],
                    [-0.65, -0.3, 0],
                  ]}
                  color={P.violet}
                  count={3}
                  speed={0.4}
                  size={0.06}
                  lineOpacity={0.55}
                />
              </group>
            ) : (
              <group position={[branch[0], branch[1], branch[2]]}>
                {[-0.55, 0, 0.55].map((x, i) => (
                  <mesh key={x} position={[x * 0.75, 0, x * -0.75]} castShadow>
                    <boxGeometry args={[0.24, 0.24, 0.24]} />
                    <meshStandardMaterial
                      color={i === 1 ? P.amber : P.amberWash}
                      roughness={0.4}
                    />
                  </mesh>
                ))}
              </group>
            )}
            <AxisLine
              from={[branch[0], branch[1] - 0.8, branch[2]]}
              to={[RING[1][0], 0.3, RING[1][2]]}
              color={accent}
              opacity={0.45}
            />
            <IsoDust
              count={40}
              center={[branch[0], branch[1] - 1.1, branch[2]]}
              spread={[0.8, 0.9, 0.8]}
            />
          </group>
        ) : null}
      </Stage>
    </Figure>
  );
}
