"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
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
 * Two failure classes that look identical from the chat window.
 *
 * The section's most useful paragraph is a diagnosis, not a definition:
 * if `start` fails, debug CDP readiness; if `start` and `tabs` both come
 * back and `open` is the one that fails, the control plane is up and what
 * you are looking at is navigation policy. A probe walking three
 * checkpoints says that in one glance.
 */

type Mode = "ok" | "cdp" | "policy";

/** The three checks, in the order the runtime performs them. */
const CHECKS = ["start", "tabs", "open"] as const;
const X = [-2.6, 0, 2.6];

const COPY = {
  en: {
    title: "where the browser broke",
    hint: "the probe stops at the first check that fails",
    ok: "All green",
    cdp: "start fails",
    policy: "open fails",
    legendPass: "passed",
    legendFail: "failed here",
    legendPlane: "control plane",
    plane: "control plane up",
    verdict: "class",
    cdpClass: "CDP readiness",
    policyClass: "navigation policy",
    okClass: "none",
    fix: "look at",
    okNote:
      "control plane up and navigation allowed. Refs are only valid for their own target and the most recent snapshot, so take a fresh one after an MCP subprocess restart.",
    cdpNote:
      "the control plane never came up. This is a startup problem — debug CDP readiness. Nothing downstream of it means anything yet, which is why the other two checks are not even attempted.",
    policyNote:
      "start and tabs both answered, so the control plane is up. A failure that appears only at open is navigation policy — an SSRF block, not a broken browser. Debugging the launch here wastes an afternoon.",
    attachOnly: "attachOnly: true",
    attachNote: "never launch a local browser; attach only if one is already running",
    launch: "local browser",
  },
  es: {
    title: "dónde se rompió el browser",
    hint: "la sonda se para en el primer check que falla",
    ok: "Todo verde",
    cdp: "falla start",
    policy: "falla open",
    legendPass: "pasa",
    legendFail: "falla aquí",
    legendPlane: "plano de control",
    plane: "plano de control arriba",
    verdict: "clase",
    cdpClass: "readiness CDP",
    policyClass: "política de navegación",
    okClass: "ninguna",
    fix: "mira",
    okNote:
      "plano de control arriba y navegación permitida. Las refs solo valen para su propio target y el snapshot más reciente, así que toma uno nuevo tras un restart del subproceso MCP.",
    cdpNote:
      "el plano de control nunca subió. Es un problema de arranque — depura readiness CDP. Nada de lo que va detrás significa aún nada, y por eso los otros dos checks ni se intentan.",
    policyNote:
      "start y tabs contestaron, así que el plano de control está arriba. Un fallo que solo aparece en open es política de navegación — un bloqueo SSRF, no un browser roto. Depurar el lanzamiento aquí te cuesta una tarde.",
    attachOnly: "attachOnly: true",
    attachNote: "nunca lanzar un browser local; solo adjuntar si ya hay uno corriendo",
    launch: "browser local",
  },
};

/** A checkpoint the probe has to get through. */
function Checkpoint({
  position,
  label,
  state,
}: {
  position: V3;
  label: string;
  state: "pass" | "fail" | "unreached";
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = MathUtils.damp(g.position.y, state === "fail" ? 0.2 : 0, 6, dt);
  });

  const color =
    state === "pass" ? P.teal : state === "fail" ? P.rose : P.line;

  return (
    <group ref={ref} position={position}>
      {/* Two posts and a lintel: a gate you either get through or do not. */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.55, 0]} castShadow>
          <boxGeometry args={[0.14, 1.1, 0.14]} />
          <meshStandardMaterial
            color={color}
            roughness={0.4}
            metalness={0.06}
            transparent={state === "unreached"}
            opacity={state === "unreached" ? 0.4 : 1}
          />
        </mesh>
      ))}
      <RoundedBox args={[1.35, 0.2, 0.22]} radius={0.05} smoothness={3} position={[0, 1.18, 0]} castShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.36}
          metalness={0.08}
          transparent={state === "unreached"}
          opacity={state === "unreached" ? 0.4 : 1}
        />
      </RoundedBox>

      {state === "fail" ? (
        <>
          <Halo position={[0, 0.6, 0]} radius={0.95} color={P.rose} opacity={0.8} spin={0.5} />
          {/* A closed bar across the gap: this is where it stops. */}
          <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <boxGeometry args={[0.12, 1.1, 0.12]} />
            <meshStandardMaterial color={P.rose} roughness={0.4} />
          </mesh>
        </>
      ) : null}

      <Tag position={[0, 1.55, 0]} tone={state === "fail" ? "rose" : state === "pass" ? "teal" : "muted"} size="xs" center>
        {label}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("cdp");

  /** Index of the check that fails, or -1 when everything passes. */
  const failAt = mode === "cdp" ? 0 : mode === "policy" ? 2 : -1;
  const stateOf = (i: number): "pass" | "fail" | "unreached" =>
    failAt === -1 || i < failAt ? "pass" : i === failAt ? "fail" : "unreached";

  // The control plane is up as soon as start and tabs answer. That is the
  // distinction the section is making, so the scene states it directly.
  const planeUp = failAt !== 0;
  const verdict = mode === "cdp" ? t.cdpClass : mode === "policy" ? t.policyClass : t.okClass;
  const note = mode === "cdp" ? t.cdpNote : mode === "policy" ? t.policyNote : t.okNote;

  /** The probe rides to the failing gate and waits there. */
  const target = failAt === -1 ? X[2] + 1.8 : X[failAt] - 0.8;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendPass },
        { color: P.rose, label: t.legendFail },
        { color: P.violet, label: t.legendPlane },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "ok", label: t.ok, tone: P.teal },
            { value: "cdp", label: t.cdp, tone: P.rose },
            { value: "policy", label: t.policy, tone: P.amber },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout
              items={[
                {
                  label: t.verdict,
                  value: verdict,
                  tone: failAt === -1 ? "var(--teal)" : "var(--rose)",
                },
                {
                  label: t.legendPlane,
                  value: planeUp ? t.plane : "—",
                  tone: planeUp ? "var(--violet)" : "var(--muted)",
                },
              ]}
            />
          </div>
        </>
      }
      height="h-[380px] md:h-[470px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={13} depth={8} y={-0.04} />

        {/* The rail the probe runs along. */}
        <RoundedBox
          args={[9, 0.16, 0.8]}
          radius={0.05}
          smoothness={3}
          position={[0, 0.08, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={P.sunken} roughness={0.5} metalness={0.03} />
        </RoundedBox>

        <PlanTrace
          points={[
            [-4.8, 2],
            [4.8, 2],
          ]}
          y={-0.02}
          color={P.line}
          opacity={0.6}
        />

        {CHECKS.map((c, i) => (
          <Checkpoint key={c} position={[X[i], 0.16, 0]} label={c} state={stateOf(i)} />
        ))}

        {/* A probe, parked wherever it got stuck. */}
        <Probe target={target} color={failAt === -1 ? P.teal : P.rose} />

        {/* The control plane, lit once start and tabs have answered. */}
        <group position={[0, 0, -2.3]}>
          <RoundedBox args={[5.6, 0.42, 1.1]} radius={0.06} smoothness={3} position={[0, 0.21, 0]} castShadow receiveShadow>
            <meshStandardMaterial
              color={planeUp ? P.violet : P.sunken}
              transparent
              opacity={planeUp ? 0.5 : 1}
              roughness={0.4}
              metalness={0.05}
              envMapIntensity={0.9}
            />
          </RoundedBox>
          <Tag position={[0, 0.75, 0]} tone={planeUp ? "violet" : "muted"} size="xs" center>
            {planeUp ? t.plane : t.legendPlane}
          </Tag>
          {[0, 1].map((i) => (
            <AxisLine
              key={i}
              from={[X[i], 0.3, 0]}
              to={[X[i], 0.3, 1.9]}
              overrun={0}
              color={stateOf(i) === "pass" ? P.violet : P.line}
              opacity={stateOf(i) === "pass" ? 0.6 : 0.25}
            />
          ))}
        </group>

        {/* attachOnly removes the launch step entirely, which is why it is
            drawn as a missing box rather than a flag in a list. */}
        <group position={[-4.6, 0, 2.4]}>
          <RoundedBox args={[2, 0.5, 1]} radius={0.06} smoothness={3} position={[0, 0.25, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={P.sunken} transparent opacity={0.45} roughness={0.5} />
          </RoundedBox>
          <Tag position={[0, 0.72, 0]} tone="muted" size="xs" center>
            {t.launch}
          </Tag>
          <Tag position={[0, 0.3, 0.85]} tone="amber" size="xs" center>
            {t.attachOnly}
          </Tag>
        </group>

        <IsoDust count={24} center={[0, 1.1, 0]} spread={[4.4, 0.6, 1.4]} />
      </Stage>
    </Figure>
  );
}

/** The request, riding the rail until something stops it. */
function Probe({
  target,
  color,
}: {
  target: number;
  color: string;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.x = MathUtils.damp(g.position.x, target, 3.5, dt);
  });
  return (
    <group ref={ref} position={[-4.2, 0.42, 0]}>
      <Node3D position={[0, 0, 0]} color={color} radius={0.17} faceted pulse={0.2} />
      <Halo radius={0.32} color={color} opacity={0.6} spin={0.8} />
    </group>
  );
}
