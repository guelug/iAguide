"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Arrow,
  Flow,
  Halo,
  Marker,
  Node3D,
  Panel,
  PointerTilt,
  Ribbon,
  ShadowBlob,
  Tag,
  useCycle,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

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
    toolNote: "permission check → execute → append result → prefill again",
    subPanel: "child loop",
    subNote: "own prompt, own tools, returns a summary — not a second brain",
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
    toolNote: "permisos → ejecutar → añadir resultado → volver a prefill",
    subPanel: "bucle hijo",
    subNote: "prompt propio, herramientas propias, devuelve un resumen",
  },
};

const RX = 2.85;
const RZ = 1.25;
const N = 6;

/** Station positions on a ring, starting at the front and going clockwise. */
const RING = Array.from({ length: N }, (_, i) => {
  const a = Math.PI / 2 + (i / N) * Math.PI * 2;
  return [Math.cos(a) * RX, 0, Math.sin(a) * RZ] as [number, number, number];
});

const PATH = [...RING, RING[0]];

function Station({
  index,
  active,
  color,
  label,
}: {
  index: number;
  active: boolean;
  color: string;
  label: string;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = MathUtils.damp(g.position.y, active ? 0.28 : 0, 6, dt);
    const s = MathUtils.damp(g.scale.x, active ? 1.18 : 1, 6, dt);
    g.scale.setScalar(s);
  });

  return (
    <group position={RING[index]}>
      <ShadowBlob position={[0, -0.19, 0]} scale={0.95} opacity={active ? 0.14 : 0.08} />
      <mesh position={[0, -0.14, 0]}>
        <cylinderGeometry args={[0.34, 0.42, 0.1, 40]} />
        <meshStandardMaterial color={active ? color : P.sunken} roughness={0.5} metalness={0.03} />
      </mesh>
      <group ref={ref}>
        <StationIcon index={index} color={color} active={active} />
      </group>
      {active ? <Halo position={[0, -0.08, 0]} radius={0.5} color={color} opacity={0.6} spin={0.3} /> : null}
      <Marker position={[0.34, 0.52, 0.2]} n={index + 1} color={active ? color : P.faint} />
      <Tag position={[0, 0.78, 0.16]} tone={active ? "ink" : "muted"} size="xs" center>
        {label}
      </Tag>
    </group>
  );
}

/** Each station gets its own silhouette, so the ring is readable frozen. */
function StationIcon({ index, color, active }: { index: number; color: string; active: boolean }) {
  const dim = active ? color : P.lineStrong;
  if (index === 0) {
    return (
      <RoundedBox args={[0.4, 0.26, 0.1]} radius={0.05} smoothness={3}>
        <meshStandardMaterial color={dim} roughness={0.4} metalness={0.04} />
      </RoundedBox>
    );
  }
  if (index === 1) {
    return (
      <group>
        {[0, 1, 2].map((i) => (
          <RoundedBox key={i} args={[0.44 - i * 0.06, 0.06, 0.28]} radius={0.02} position={[0, -0.08 + i * 0.1, 0]}>
            <meshStandardMaterial color={i === 2 ? dim : P.line} roughness={0.5} />
          </RoundedBox>
        ))}
      </group>
    );
  }
  if (index === 2) {
    // Prefill: many chips arriving at once.
    return (
      <group>
        {[-0.14, 0, 0.14].map((y, i) =>
          [-0.13, 0.02, 0.17].map((x, j) => (
            <mesh key={`${i}-${j}`} position={[x, y, 0]}>
              <boxGeometry args={[0.1, 0.07, 0.07]} />
              <meshStandardMaterial color={dim} roughness={0.45} />
            </mesh>
          )),
        )}
      </group>
    );
  }
  if (index === 3) {
    // Decode: one chip leaving at a time.
    return (
      <group>
        <mesh position={[-0.1, 0, 0]}>
          <boxGeometry args={[0.16, 0.16, 0.16]} />
          <meshStandardMaterial color={dim} roughness={0.4} />
        </mesh>
        <Node3D position={[0.18, 0, 0]} color={dim} radius={0.06} matte pulse={active ? 0.2 : 0} />
      </group>
    );
  }
  if (index === 4) {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.1, 6]} />
        <meshStandardMaterial color={dim} roughness={0.35} metalness={0.14} />
      </mesh>
    );
  }
  return (
    <group>
      <RoundedBox args={[0.34, 0.22, 0.12]} radius={0.05} smoothness={3}>
        <meshStandardMaterial color={dim} roughness={0.3} metalness={0.06} />
      </RoundedBox>
      {active ? <Halo radius={0.34} color={color} opacity={0.55} rotation={[0, 0.3, 0]} spin={0.5} /> : null}
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("loop");
  const [step] = useCycle(N, 1.7);

  const accent = mode === "tools" ? P.amber : mode === "sub" ? P.violet : P.teal;
  const station = t.stations[step];

  // The detour hangs off station 4 (act) — the only place a turn can leave.
  const branchFrom = RING[4];
  const branchTo = useMemo<[number, number, number]>(
    () => [branchFrom[0] - 1.5, mode === "sub" ? 1.55 : 1.15, branchFrom[2] - 0.6],
    [branchFrom, mode],
  );

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
      height="h-[360px] md:h-[460px]"
    >
      <Stage className="h-full w-full" camera={{ position: [0, 2.6, 6.4], fov: 40 }} background={P.paper} fit={1.14}>
        <PointerTilt amount={0.07}>
          <group rotation={[-0.5, 0, 0]} position={[0, -0.35, 0]}>
            <ShadowBlob position={[0, -0.2, 0]} scale={7} opacity={0.05} />
            <Ribbon points={PATH} color={P.line} radius={0.022} opacity={0.9} />
            <Flow points={PATH} color={accent} count={4} speed={0.14} size={0.075} lineOpacity={0} />

            {RING.map((_, i) => (
              <Station
                key={i}
                index={i}
                active={i === step}
                color={accent}
                label={t.stations[i].name}
              />
            ))}

            {mode !== "loop" ? (
              <group>
                <Arrow from={[branchFrom[0], 0.15, branchFrom[2]]} to={branchTo} color={accent} bow={0.5} width={1.8} />
                <Arrow
                  from={[branchTo[0] + 0.1, branchTo[1] - 0.35, branchTo[2]]}
                  to={[RING[1][0], 0.2, RING[1][2]]}
                  color={accent}
                  bow={-0.35}
                  width={1.6}
                  dashed
                  opacity={0.7}
                />
                <group position={branchTo} rotation={[0.5, 0, 0]}>
                  <Panel
                    position={[0, 0, 0]}
                    size={[1.5, 0.82]}
                    color={accent}
                    title={mode === "tools" ? t.toolPanel : t.subPanel}
                    active
                    fill={0.12}
                  />
                  {mode === "sub" ? (
                    <group position={[0, -0.06, 0.1]}>
                      <Flow
                        points={[
                          [-0.42, -0.1, 0],
                          [0, 0.16, 0.12],
                          [0.42, -0.1, 0],
                          [0, -0.26, -0.12],
                          [-0.42, -0.1, 0],
                        ]}
                        color={P.violet}
                        count={3}
                        speed={0.4}
                        size={0.045}
                        lineOpacity={0.4}
                      />
                    </group>
                  ) : (
                    <group position={[0, -0.08, 0.12]}>
                      {[-0.34, 0, 0.34].map((x, i) => (
                        <mesh key={x} position={[x, 0, 0]}>
                          <boxGeometry args={[0.16, 0.16, 0.06]} />
                          <meshStandardMaterial
                            color={i === 1 ? P.amber : P.amberWash}
                            roughness={0.42}
                          />
                        </mesh>
                      ))}
                    </group>
                  )}
                </group>
              </group>
            ) : null}
          </group>
        </PointerTilt>

        {/* The caption is part of the diagram: the ring plus this line is
            a complete sentence about what just happened. */}
        <group position={[0, -1.72, 0]}>
          <Tag position={[0, 0.3, 0]} tone="ink" center>
            {step + 1}. {station.name}
          </Tag>
          <Tag position={[0, 0, 0]} tone="muted" size="xs" center>
            {station.note}
          </Tag>
          {mode !== "loop" ? (
            <Tag position={[0, -0.3, 0]} tone={mode === "tools" ? "amber" : "violet"} size="xs" center>
              {mode === "tools" ? t.toolNote : t.subNote}
            </Tag>
          ) : null}
        </group>
      </Stage>
    </Figure>
  );
}
