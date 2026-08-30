"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * What a session tool can see, drawn as the tree it is scoped over.
 *
 * Four visibility modes described in prose all sound like "more or less
 * access". As a tree they are obviously different shapes: self is one
 * node, tree is the caller plus what it spawned, agent is a whole column,
 * all is the field — and the incognito node stays dark in every one of
 * them, because that denial is absolute.
 */

type Vis = "self" | "tree" | "agent" | "all";

type Session = {
  id: string;
  /** Grid position on the plate. */
  x: number;
  z: number;
  agent: "a" | "b";
  /** Who spawned it, if anyone. */
  parent?: string;
  incognito?: boolean;
};

const NODES: Session[] = [
  { id: "main", x: -3.1, z: 0, agent: "a" },
  { id: "sub1", x: -1.3, z: -1.6, agent: "a", parent: "main" },
  { id: "sub2", x: -1.3, z: 1.6, agent: "a", parent: "main" },
  { id: "grand", x: 0.5, z: -2.6, agent: "a", parent: "sub1" },
  { id: "peer", x: 0.5, z: 0.4, agent: "a" },
  { id: "incognito", x: 0.5, z: 2.7, agent: "a", incognito: true },
  { id: "other", x: 3.2, z: -1.2, agent: "b" },
  { id: "other2", x: 3.2, z: 1.2, agent: "b" },
];

const BY_ID = new Map(NODES.map((n) => [n.id, n]));

/** Is `n` the caller or something the caller spawned, at any depth? */
function inSubtree(n: Session, callerId: string): boolean {
  let cur: Session | undefined = n;
  while (cur) {
    if (cur.id === callerId) return true;
    cur = cur.parent ? BY_ID.get(cur.parent) : undefined;
  }
  return false;
}

/**
 * The rule, in one place. `tree` is the caller plus what it spawned —
 * and, *only* when the caller is the canonical main session, every other
 * session of the same agent as well. That main-specific widening is why
 * tree and agent look identical from main and nothing alike from a
 * subagent. Incognito is never visible under any mode.
 */
function visible(mode: Vis, n: Session, callerId: string) {
  if (n.incognito) return false;
  const caller = BY_ID.get(callerId)!;
  if (mode === "self") return n.id === callerId;
  if (mode === "tree") {
    if (inSubtree(n, callerId)) return true;
    return callerId === "main" && n.agent === caller.agent;
  }
  if (mode === "agent") return n.agent === caller.agent;
  return true;
}

const COPY = {
  en: {
    title: "what a session tool can see",
    hint: "switch the caller · tree widens only for canonical main",
    self: "self",
    tree: "tree",
    agent: "agent",
    all: "all",
    legendSeen: "visible",
    legendHidden: "not visible",
    legendDenied: "incognito · always denied",
    caller: "caller · main",
    child: "spawned",
    peer: "same agent",
    other: "other agent",
    incognito: "incognito",
    seen: "sessions visible",
    gate: "tools.agentToAgent",
    gateNote: "cross-agent targeting still needs this, even under all",
    callerLabel: "caller",
    callerMain: "from main",
    callerSub: "from a subagent",
    selfNote:
      "the current session key and nothing else. This is the strict setting, and it stays strict for main.",
    treeNote:
      "the default. Current session plus spawned subagents — and because the caller is the canonical main session, it also covers every session of the same agent for list, history, search, send and status.",
    agentNote:
      "any session belonging to the current agent id. Under per-sender sessions on one agent id, that can include other people's sessions.",
    allNote:
      "any session at all. When the mode is not all, sessions_list carries a compact visibility field and a warning that some sessions may be omitted.",
  },
  es: {
    title: "qué puede ver una session tool",
    hint: "cambia quién llama · tree se ensancha solo para main canónica",
    self: "self",
    tree: "tree",
    agent: "agent",
    all: "all",
    legendSeen: "visible",
    legendHidden: "no visible",
    legendDenied: "incógnito · siempre denegado",
    caller: "llama · main",
    child: "spawned",
    peer: "mismo agente",
    other: "otro agente",
    incognito: "incógnito",
    seen: "sesiones visibles",
    gate: "tools.agentToAgent",
    gateNote: "el targeting cross-agent lo sigue exigiendo, incluso con all",
    callerLabel: "quien llama",
    callerMain: "desde main",
    callerSub: "desde un subagente",
    selfNote:
      "la clave de sesión actual y nada más. Es el ajuste estricto, y sigue siendo estricto para main.",
    treeNote:
      "el default. Sesión actual más subagentes spawned — y como quien llama es la sesión main canónica, cubre además cada sesión del mismo agente para list, history, search, send y status.",
    agentNote:
      "cualquier sesión que pertenezca al agent id actual. Con sesiones per-sender bajo un mismo agent id, eso puede incluir sesiones de otras personas.",
    allNote:
      "cualquier sesión. Cuando el modo no es all, sessions_list lleva un campo compacto de visibility y un aviso de que algunas sesiones pueden omitirse.",
  },
};

function SessionNode({
  node,
  seen,
  label,
  isCaller,
}: {
  node: Session;
  seen: boolean;
  label: string;
  isCaller: boolean;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = MathUtils.damp(g.position.y, seen ? 0.28 : 0, 6, dt);
  });

  const color = node.incognito ? P.rose : seen ? P.teal : P.line;
  const caller = isCaller;

  return (
    <group position={[node.x, 0, node.z]}>
      <RoundedBox
        args={[1.15, 0.24, 0.85]}
        radius={0.05}
        smoothness={3}
        position={[0, 0.12, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={seen ? P.surface : P.sunken}
          roughness={0.4}
          metalness={0.04}
          envMapIntensity={0.9}
        />
      </RoundedBox>
      <group ref={ref}>
        <Node3D
          position={[0, 0.42, 0]}
          color={color}
          radius={caller ? 0.2 : 0.15}
          faceted={caller}
          pulse={caller ? 0.2 : 0}
        />
        {caller ? <Halo position={[0, 0.42, 0]} radius={0.44} color={P.teal} opacity={0.7} spin={0.4} /> : null}
        {node.incognito ? (
          <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.42, 0.06, 0.06]} />
            <meshBasicMaterial color={P.rose} />
          </mesh>
        ) : null}
      </group>
      <Tag
        position={[0, -0.16, 0.62]}
        tone={node.incognito ? "rose" : seen ? "ink" : "muted"}
        size="xs"
        center
      >
        {label}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Vis>("tree");

  const [callerId, setCallerId] = useState<"main" | "sub1">("main");

  const seenOf = (n: Session) => visible(mode, n, callerId);
  const count = NODES.filter(seenOf).length;
  const callerAgent = BY_ID.get(callerId)!.agent;

  const labelFor = (n: Session) =>
    n.id === callerId
      ? t.caller
      : n.incognito
        ? t.incognito
        : n.parent
          ? t.child
          : n.agent === callerAgent
            ? t.peer
            : t.other;

  const note =
    mode === "self" ? t.selfNote : mode === "tree" ? t.treeNote : mode === "agent" ? t.agentNote : t.allNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendSeen },
        { color: P.line, label: t.legendHidden },
        { color: P.rose, label: t.legendDenied },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "self", label: t.self, tone: P.violet },
              { value: "tree", label: t.tree, tone: P.teal },
              { value: "agent", label: t.agent, tone: P.amber },
              { value: "all", label: t.all, tone: P.rose },
            ]}
            ariaLabel={t.title}
          />
          <Switcher
            value={callerId}
            onChange={setCallerId}
            options={[
              { value: "main", label: t.callerMain, tone: P.teal },
              { value: "sub1", label: t.callerSub, tone: P.violet },
            ]}
            ariaLabel={t.callerLabel}
          />
        </>
      }
      note={
        <>
          <strong className="text-ink">{t[mode]}</strong> — {note}
          <div className="mt-2">
            <Readout
              items={[
                { label: t.seen, value: `${count} / ${NODES.length}`, tone: "var(--teal)" },
                { label: t.gate, value: t.gateNote, tone: "var(--muted)" },
              ]}
            />
          </div>
        </>
      }
      height="h-[390px] md:h-[480px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={12} depth={9} y={-0.05} />

        {/* Spawn edges, drawn parent to child wherever one exists. */}
        {NODES.filter((n) => n.parent).map((n) => {
          const parent = BY_ID.get(n.parent!)!;
          return (
            <AxisLine
              key={n.id}
              from={[parent.x, 0.4, parent.z]}
              to={[n.x, 0.4, n.z]}
              overrun={0}
              color={seenOf(n) ? P.teal : P.line}
              opacity={seenOf(n) ? 0.7 : 0.3}
              dashed={false}
            />
          );
        })}

        {/* The agent boundary, and the gate that guards crossing it. */}
        <AxisLine from={[1.95, 0.1, -3.2]} to={[1.95, 0.1, 3.2]} overrun={0.3} color={P.lineStrong} opacity={0.5} />
        <group position={[1.95, 0.6, 2.6]}>
          <Node3D
            position={[0, 0, 0]}
            color={mode === "all" ? P.amber : P.line}
            radius={0.14}
            matte
          />
          <Tag position={[0, 0.42, 0]} tone={mode === "all" ? "amber" : "muted"} size="xs" center>
            {t.gate}
          </Tag>
        </group>

        {NODES.map((n) => (
          <SessionNode key={n.id} node={n} seen={seenOf(n)} label={labelFor(n)} isCaller={n.id === callerId} />
        ))}

        <IsoDust count={22} center={[0, 1, 0]} spread={[3.6, 0.6, 2.6]} />
      </Stage>
    </Figure>
  );
}
