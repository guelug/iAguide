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
 * Why a write token still cannot write.
 *
 * The section is four hundred words about three roles, and the sentence
 * readers skim is the one that matters most: in an organisation the
 * token's role *and* your membership both apply. That is two gates in
 * series, which a drawing can say in one glance and a paragraph cannot
 * say at all.
 *
 * Roles, scoping and the one-token-per-app practice are from the Hub
 * security-tokens documentation as cited in the lesson.
 */

type Role = "fine" | "read" | "write";

type Door = {
  key: string;
  /** What the operation needs. */
  needs: "read" | "write";
  /** Lives in an organisation, so membership is a second gate. */
  org: boolean;
  /** Your membership lets you write there. */
  memberWrite: boolean;
  /** Inside a fine-grained token's resource list. */
  inScope: boolean;
};

const DOORS: Door[] = [
  { key: "public", needs: "read", org: false, memberWrite: false, inScope: true },
  { key: "private", needs: "read", org: false, memberWrite: false, inScope: true },
  { key: "push", needs: "write", org: false, memberWrite: false, inScope: false },
  { key: "orgRead", needs: "read", org: true, memberWrite: false, inScope: false },
  { key: "orgPush", needs: "write", org: true, memberWrite: false, inScope: false },
];

/** Both gates must open. This is the whole lesson, in one function. */
function opens(role: Role, d: Door) {
  const roleOk =
    d.needs === "read" ? true : role === "write" || (role === "fine" && d.inScope);
  const scopeOk = role === "fine" ? d.inScope : true;
  const memberOk = d.org && d.needs === "write" ? d.memberWrite : true;
  return { roleOk: roleOk && scopeOk, memberOk, open: roleOk && scopeOk && memberOk };
}

const COPY = {
  en: {
    title: "two gates, not one key",
    hint: "pick a token role · a door opens only if both gates do",
    fine: "fine-grained",
    read: "read",
    write: "write",
    legendOpen: "opens",
    legendRole: "blocked by role",
    legendMember: "blocked by membership",
    gateRole: "token role",
    gateMember: "membership",
    doors: {
      public: "public repo",
      private: "your private repo",
      push: "push to your repo",
      orgRead: "org repo · read",
      orgPush: "org repo · push",
    },
    opened: "doors open",
    fineNote:
      "scoped to named resources, so the blast radius of a leak is a list rather than the whole account. Hugging Face recommends this shape in production.",
    readNote:
      "enough to download and to call Inference Providers. Not enough to push — a public notebook has no business holding more than this.",
    writeNote:
      "creates and pushes where you can already write. It is not a master key: in an org where you are a read-only member, the second gate still refuses.",
    oneEach: "one token per app: laptop, CI, Colab, inference server — four tokens, revoked one at a time",
  },
  es: {
    title: "dos puertas, no una llave",
    hint: "elige un rol de token · una puerta se abre solo si se abren las dos",
    fine: "fine-grained",
    read: "read",
    write: "write",
    legendOpen: "abre",
    legendRole: "bloquea el rol",
    legendMember: "bloquea la pertenencia",
    gateRole: "rol del token",
    gateMember: "pertenencia",
    doors: {
      public: "repo público",
      private: "tu repo privado",
      push: "push a tu repo",
      orgRead: "repo de org · leer",
      orgPush: "repo de org · push",
    },
    opened: "puertas abiertas",
    fineNote:
      "acotado a recursos concretos, así el radio de un leak es una lista y no la cuenta entera. Hugging Face recomienda esta forma en producción.",
    readNote:
      "basta para descargar y para Inference Providers. No basta para hacer push — un notebook público no tiene por qué llevar más que esto.",
    writeNote:
      "crea y sube donde ya puedes escribir. No es una llave maestra: en una org donde eres miembro de solo lectura, la segunda puerta sigue diciendo que no.",
    oneEach: "un token por app: portátil, CI, Colab, servidor de inferencia — cuatro tokens, se revocan de uno en uno",
  },
};

/** A gate that swings open or stays shut. */
function Gate({
  position,
  open,
  color,
  label,
}: {
  position: V3;
  open: boolean;
  color: string;
  label: string;
}) {
  const leaf = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = leaf.current;
    if (!g) return;
    g.rotation.y = MathUtils.damp(g.rotation.y, open ? -Math.PI / 2.3 : 0, 6, dt);
  });
  return (
    <group position={position}>
      {/* Hinge post, so the leaf visibly swings from somewhere. */}
      <mesh position={[-0.42, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.62, 12]} />
        <meshStandardMaterial color={P.lineStrong} roughness={0.5} metalness={0.1} />
      </mesh>
      <group ref={leaf} position={[-0.42, 0.3, 0]}>
        <RoundedBox args={[0.8, 0.55, 0.07]} radius={0.03} smoothness={3} position={[0.4, 0, 0]} castShadow>
          <meshStandardMaterial
            color={open ? color : P.sunken}
            transparent
            opacity={open ? 0.45 : 1}
            roughness={0.36}
            metalness={0.05}
            envMapIntensity={0.9}
          />
        </RoundedBox>
      </group>
      <Tag position={[0, -0.18, 0.4]} tone="muted" size="xs" center>
        {label}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [role, setRole] = useState<Role>("read");

  const results = DOORS.map((d) => ({ d, ...opens(role, d) }));
  const nOpen = results.filter((r) => r.open).length;
  const note = role === "fine" ? t.fineNote : role === "read" ? t.readNote : t.writeNote;
  const roleColor = role === "fine" ? P.teal : role === "read" ? P.amber : P.violet;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendOpen },
        { color: P.line, label: t.legendRole },
        { color: P.rose, label: t.legendMember },
      ]}
      controls={
        <Switcher
          value={role}
          onChange={setRole}
          options={[
            { value: "fine", label: t.fine, tone: P.teal },
            { value: "read", label: t.read, tone: P.amber },
            { value: "write", label: t.write, tone: P.violet },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          <strong className="text-ink">{t[role]}</strong> — {note}
          <span className="mt-2 block">
            <Readout
              items={[
                { label: t.opened, value: `${nOpen} / ${DOORS.length}`, tone: roleColor },
                { label: "", value: t.oneEach, tone: "var(--muted)" },
              ]}
            />
          </span>
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
        <IsoFrame width={13} depth={11} y={-0.04} />

        {/* The key you are holding. */}
        <group position={[-4.8, 0, 0]}>
          <RoundedBox args={[1.5, 0.2, 1.5]} radius={0.06} smoothness={3} position={[0, 0.1, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={roleColor} roughness={0.4} metalness={0.06} envMapIntensity={0.9} />
          </RoundedBox>
          <mesh position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.26, 0.44, 20]} />
            <meshStandardMaterial color={P.surface} roughness={0.3} metalness={0.08} envMapIntensity={0.95} />
          </mesh>
          {/* Teeth: a fine-grained token carries a short, explicit list. */}
          {(role === "fine" ? [0, 1] : role === "read" ? [0, 1, 2] : [0, 1, 2, 3]).map((i) => (
            <mesh key={i} position={[0.34, 0.32 + i * 0.11, 0]} castShadow>
              <boxGeometry args={[0.22, 0.06, 0.1]} />
              <meshStandardMaterial color={roleColor} roughness={0.35} metalness={0.1} />
            </mesh>
          ))}
          <Halo position={[0, 0.22, 0]} radius={1.05} color={roleColor} opacity={0.5} spin={0.2} />
          <Tag position={[0, 1.15, 0]} tone="ink" size="sm" center>
            {t[role]}
          </Tag>
        </group>

        <PlanTrace
          points={[
            [-3.9, 0],
            [-2.4, 0],
          ]}
          y={0.02}
          color={roleColor}
          opacity={0.7}
        />

        {/* One lane per operation: role gate, membership gate, the repo. */}
        {results.map((r, i) => {
          const z = -3.4 + i * 1.7;
          return (
            <group key={r.d.key} position={[0, 0, z]}>
              <Gate position={[-1.5, 0, 0]} open={r.roleOk} color={roleColor} label={i === 0 ? t.gateRole : ""} />
              {r.d.org ? (
                <Gate
                  position={[0.3, 0, 0]}
                  open={r.memberOk}
                  color={r.memberOk ? P.teal : P.rose}
                  label={i === 3 ? t.gateMember : ""}
                />
              ) : (
                <AxisLine from={[-0.4, 0.3, 0]} to={[1.0, 0.3, 0]} overrun={0} color={P.line} opacity={0.4} />
              )}

              {/* The repo door itself. */}
              <group position={[2.4, 0, 0]}>
                <RoundedBox args={[1.5, 0.72, 0.5]} radius={0.06} smoothness={3} position={[0, 0.36, 0]} castShadow receiveShadow>
                  <meshStandardMaterial
                    color={r.open ? P.teal : r.memberOk ? P.sunken : P.roseWash}
                    transparent
                    opacity={r.open ? 0.9 : 1}
                    roughness={0.42}
                    metalness={0.04}
                    envMapIntensity={0.9}
                  />
                </RoundedBox>
                <Node3D
                  position={[0, 0.36, 0.3]}
                  color={r.open ? P.teal : r.memberOk ? P.line : P.rose}
                  radius={0.09}
                  matte
                />
                <Tag position={[1.5, 0.36, 0]} tone={r.open ? "ink" : "muted"} size="xs">
                  {t.doors[r.d.key as keyof typeof t.doors]}
                </Tag>
              </group>

              {/* The path only continues where it is allowed to. */}
              <AxisLine
                from={[-2.4, 0.3, 0]}
                to={[r.open ? 1.6 : r.roleOk ? 0.2 : -1.9, 0.3, 0]}
                overrun={0}
                color={r.open ? roleColor : P.rose}
                opacity={r.open ? 0.75 : 0.5}
                dashed={!r.open}
              />
            </group>
          );
        })}

        <IsoDust count={26} center={[0, 1.1, 0]} spread={[3.6, 0.6, 3.4]} />
      </Stage>
    </Figure>
  );
}
