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
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * What auto-approval actually requires, as a chain of latches.
 *
 * The sentence people remember is "SSH-verified auto-approval is on by
 * default", and the sentence they forget is every condition attached to
 * it. Drawn as latches in series, the forgetting becomes impossible:
 * flip only reachability and the chain stays shut, because reachability
 * alone never approves.
 */

type Path = "ssh" | "cidr" | "manual";

type Latch = { id: string; required: Record<Path, boolean> };

/** The conditions, and which path each one gates. */
const LATCHES: Latch[] = [
  { id: "firstTime", required: { ssh: true, cidr: true, manual: false } },
  { id: "roleNode", required: { ssh: true, cidr: true, manual: false } },
  { id: "privateAddr", required: { ssh: true, cidr: false, manual: false } },
  { id: "noScopes", required: { ssh: false, cidr: true, manual: false } },
  { id: "sshProof", required: { ssh: true, cidr: false, manual: false } },
  { id: "cidrListed", required: { ssh: false, cidr: true, manual: false } },
];

const COPY = {
  en: {
    title: "what actually opens the latch",
    hint: "toggle a condition · every required latch has to be shut",
    ssh: "SSH-verified",
    cidr: "trusted CIDR",
    manual: "operator · browser · UI",
    legendMet: "condition met",
    legendMissing: "required, missing",
    legendUnused: "not part of this path",
    conditions: {
      firstTime: "first-time pairing",
      roleNode: 'role: "node"',
      privateAddr: "private / CGNAT address",
      noScopes: "request carries no scopes",
      sshProof: "device id + public key match over SSH",
      cidrListed: "address in autoApproveCidrs",
    },
    approved: "auto-approved",
    refused: "stays manual",
    verdict: "outcome",
    defaultOn: "on by default",
    defaultOff: "off unless configured",
    disable: "gateway.nodes.pairing.sshVerify: false",
    sshNote:
      "on by default, and the proof is not reachability. The Gateway connects back, runs openclaw node identity --json, and approves only when the remote device id and public key match exactly. Being reachable proves nothing on its own.",
    cidrNote:
      "off unless you set gateway.nodes.pairing.autoApproveCidrs, and even then only a fresh role: node request carrying no scopes is eligible. There is no blanket auto-approve-the-LAN mode.",
    manualNote:
      "operator, browser, Control UI and WebChat never auto-approve. No latch on this path opens on its own, which is the point: the surfaces that can act on your behalf are the ones a human still has to admit.",
  },
  es: {
    title: "qué abre de verdad el pestillo",
    hint: "activa una condición · todos los pestillos requeridos tienen que cerrar",
    ssh: "Verificado por SSH",
    cidr: "CIDR de confianza",
    manual: "operator · browser · UI",
    legendMet: "condición cumplida",
    legendMissing: "requerida, falta",
    legendUnused: "no entra en esta ruta",
    conditions: {
      firstTime: "pairing por primera vez",
      roleNode: 'role: "node"',
      privateAddr: "dirección privada / CGNAT",
      noScopes: "la petición no lleva scopes",
      sshProof: "device id + clave pública coinciden por SSH",
      cidrListed: "dirección en autoApproveCidrs",
    },
    approved: "auto-aprobado",
    refused: "sigue manual",
    verdict: "resultado",
    defaultOn: "on por defecto",
    defaultOff: "off salvo que lo configures",
    disable: "gateway.nodes.pairing.sshVerify: false",
    sshNote:
      "on por defecto, y la prueba no es la alcanzabilidad. El Gateway conecta de vuelta, corre openclaw node identity --json, y aprueba solo cuando el device id remoto y la clave pública coinciden exacto. Ser alcanzable no prueba nada por sí solo.",
    cidrNote:
      "off salvo que pongas gateway.nodes.pairing.autoApproveCidrs, y aun así solo es elegible una petición role: node fresca y sin scopes. No hay un modo blanket de auto-aprobar la LAN.",
    manualNote:
      "operator, browser, Control UI y WebChat nunca se auto-aprueban. En esta ruta ningún pestillo abre solo, y ese es el punto: las superficies que pueden actuar en tu nombre son las que un humano todavía tiene que admitir.",
  },
};

/** A latch: shut when its condition holds, open and red when it does not. */
function LatchPin({
  position,
  state,
  label,
}: {
  position: V3;
  state: "met" | "missing" | "unused";
  label: string;
}) {
  const bolt = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = bolt.current;
    if (!g) return;
    // A met condition drives its bolt home; a missing one leaves it out.
    g.position.x = MathUtils.damp(g.position.x, state === "met" ? 0 : 0.42, 6, dt);
  });

  const color = state === "met" ? P.teal : state === "missing" ? P.rose : P.line;

  return (
    <group position={position}>
      {/* Keep: the body the bolt slides into. */}
      <RoundedBox args={[0.5, 0.4, 0.7]} radius={0.06} smoothness={3} position={[-0.45, 0.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color={state === "unused" ? P.sunken : P.surface}
          roughness={0.38}
          metalness={0.05}
          envMapIntensity={0.9}
        />
      </RoundedBox>
      <group ref={bolt} position={[0.42, 0.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.16, 0.16]} />
          <meshStandardMaterial color={color} roughness={0.34} metalness={0.12} />
        </mesh>
      </group>
      {state === "missing" ? (
        <Halo position={[0, 0.2, 0]} radius={0.6} color={P.rose} opacity={0.7} spin={0.5} />
      ) : null}
      <Tag position={[0, -0.2, 0.55]} tone={state === "missing" ? "rose" : state === "met" ? "ink" : "muted"} size="xs" center>
        {label}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [path, setPath] = useState<Path>("ssh");
  const [met, setMet] = useState<Record<string, boolean>>({
    firstTime: true,
    roleNode: true,
    privateAddr: true,
    noScopes: false,
    sshProof: false,
    cidrListed: false,
  });

  /* Approval needs every latch this path requires. The manual path has no
     latches at all, which is why it can never open by itself. */
  const required = LATCHES.filter((l) => l.required[path]);
  const approved = path !== "manual" && required.every((l) => met[l.id]);

  const note = path === "ssh" ? t.sshNote : path === "cidr" ? t.cidrNote : t.manualNote;
  const accent = path === "ssh" ? P.teal : path === "cidr" ? P.amber : P.violet;

  const toggle = (id: string) => setMet((m) => ({ ...m, [id]: !m[id] }));

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendMet },
        { color: P.rose, label: t.legendMissing },
        { color: P.line, label: t.legendUnused },
      ]}
      controls={
        <Switcher
          value={path}
          onChange={setPath}
          options={[
            { value: "ssh", label: t.ssh, tone: P.teal },
            { value: "cidr", label: t.cidr, tone: P.amber },
            { value: "manual", label: t.manual, tone: P.violet },
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
                  value: approved ? t.approved : t.refused,
                  tone: approved ? "var(--teal)" : "var(--rose)",
                },
                {
                  label: t[path],
                  value: path === "ssh" ? t.defaultOn : t.defaultOff,
                  tone: "var(--muted)",
                },
                { label: "", value: t.disable, tone: "var(--muted)" },
              ]}
            />
          </div>
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
        <IsoFrame width={13} depth={11} y={-0.05} />

        {/* The latches, in a column, each one clickable. */}
        {LATCHES.map((l, i) => {
          const need = l.required[path];
          const state = !need ? "unused" : met[l.id] ? "met" : "missing";
          return (
            <group
              key={l.id}
              onClick={(e) => {
                e.stopPropagation();
                toggle(l.id);
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <LatchPin
                position={[-2.2, 0, -3.4 + i * 1.35]}
                state={state}
                label={t.conditions[l.id as keyof typeof t.conditions]}
              />
            </group>
          );
        })}

        {/* The bar the latches hold shut. */}
        <group position={[1.4, 0, 0]}>
          <RoundedBox args={[0.5, 0.6, 7.4]} radius={0.07} smoothness={3} position={[0, 0.3, 0]} castShadow receiveShadow>
            <meshStandardMaterial
              color={approved ? accent : P.sunken}
              transparent
              opacity={approved ? 0.55 : 1}
              roughness={0.4}
              metalness={0.06}
              envMapIntensity={0.9}
            />
          </RoundedBox>
          <Tag position={[0, 0.95, 0]} tone={approved ? "teal" : "rose"} size="sm" center>
            {approved ? t.approved : t.refused}
          </Tag>
        </group>

        {/* Each required latch draws its own line to the bar. */}
        {LATCHES.map((l, i) => {
          if (!l.required[path]) return null;
          return (
            <AxisLine
              key={l.id}
              from={[-1.7, 0.25, -3.4 + i * 1.35]}
              to={[1.1, 0.25, -3.4 + i * 1.35]}
              overrun={0}
              color={met[l.id] ? P.teal : P.rose}
              opacity={met[l.id] ? 0.7 : 0.45}
              dashed={!met[l.id]}
            />
          );
        })}

        {/* The device asking to be let in. */}
        <group position={[3.6, 0, 0]}>
          <RoundedBox args={[1.4, 0.7, 1.4]} radius={0.08} smoothness={3} position={[0, 0.35, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={P.surface} roughness={0.36} metalness={0.05} envMapIntensity={0.95} />
          </RoundedBox>
          <Node3D position={[0, 0.9, 0]} color={approved ? P.teal : P.line} radius={0.16} faceted pulse={approved ? 0.2 : 0} />
          {approved ? <Halo position={[0, 0.9, 0]} radius={0.44} color={P.teal} opacity={0.7} spin={0.4} /> : null}
        </group>

        <IsoDust count={22} center={[0, 1.2, 0]} spread={[3, 0.6, 3.4]} />
      </Stage>
    </Figure>
  );
}
