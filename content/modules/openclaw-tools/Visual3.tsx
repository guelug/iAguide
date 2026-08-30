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
 * What reaches the model is what survived four sieves, in order.
 *
 * The section says the order out loud — base profile, then provider
 * profile, then allow/deny, then sandbox — and then spends a thousand
 * words on the consequences. Stacked sieves say the order without saying
 * anything, and the count that falls out of the bottom is the answer to
 * "why can it not call that tool".
 */

type Stage = "profile" | "provider" | "allow" | "sandbox";

/** How many of the twelve registered tools each sieve takes away. */
const STAGES: { id: Stage; removes: number; color: string }[] = [
  { id: "profile", removes: 2, color: P.teal },
  { id: "provider", removes: 1, color: P.amber },
  { id: "allow", removes: 3, color: P.violet },
  { id: "sandbox", removes: 2, color: P.rose },
];

const REGISTERED = 12;

const COPY = {
  en: {
    title: "four sieves, in this order",
    hint: "chips fall through · a sieve can only remove what reached it",
    profile: "base profile",
    provider: "provider profile",
    allow: "allow / deny",
    sandbox: "sandbox",
    legendKept: "reaches the model",
    legendCut: "removed here",
    legendOrder: "order matters",
    registered: "registered",
    delivered: "sent to the model",
    removedBy: "removed by",
    audit: "agents/tool-policy",
    auditNote: "openclaw logs names the rule label, the config key and the tools affected",
    profileNote:
      "the base profile is the first cut, so everything after it is working on a smaller list. A tool the profile already removed cannot be re-added by an allow further down.",
    providerNote:
      "tools.byProvider narrows again for one provider id or a provider/model key. It runs after the base profile and before allow/deny.",
    allowNote:
      "allow and deny run on what is left. Deny wins. toolsBySender layers on top as defence in depth, and its sender values have to come from the channel adapter, never from message text.",
    sandboxNote:
      "the sandbox is a separate layer, not a name in the same list. Pasting a Hermes tool name into tools.deny does nothing here — different owner, different shorthands.",
  },
  es: {
    title: "cuatro cribas, en este orden",
    hint: "las fichas caen · una criba solo puede quitar lo que le llegó",
    profile: "perfil base",
    provider: "perfil de proveedor",
    allow: "allow / deny",
    sandbox: "sandbox",
    legendKept: "llega al modelo",
    legendCut: "quitada aquí",
    legendOrder: "el orden importa",
    registered: "registradas",
    delivered: "enviadas al modelo",
    removedBy: "quitadas por",
    audit: "agents/tool-policy",
    auditNote: "openclaw logs nombra la etiqueta de regla, la clave de config y las tools afectadas",
    profileNote:
      "el perfil base es el primer corte, así que todo lo que viene después trabaja sobre una lista más corta. Una tool que el perfil ya quitó no la devuelve un allow de más abajo.",
    providerNote:
      "tools.byProvider restringe otra vez para un provider id o una clave provider/model. Corre después del perfil base y antes de allow/deny.",
    allowNote:
      "allow y deny corren sobre lo que queda. Deny gana. toolsBySender se apila encima como defensa en profundidad, y sus valores de sender tienen que venir del adapter de canal, nunca del texto del mensaje.",
    sandboxNote:
      "el sandbox es una capa aparte, no un nombre en la misma lista. Pegar un nombre de tool de Hermes en tools.deny no hace nada aquí — otro dueño, otros atajos.",
  },
};

/** A sieve plate: what arrives, what it takes, what falls through. */
function Sieve({
  y,
  arriving,
  removes,
  color,
  label,
  order,
  active,
}: {
  y: number;
  arriving: number;
  removes: number;
  color: string;
  label: string;
  order: number;
  active: boolean;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = MathUtils.damp(g.position.y, active ? y + 0.22 : y, 6, dt);
  });

  const kept = Math.max(0, arriving - removes);

  return (
    <group ref={ref} position={[0, y, 0]}>
      <RoundedBox args={[3.6, 0.14, 2.4]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial
          color={active ? color : P.sunken}
          transparent
          opacity={active ? 0.75 : 0.95}
          roughness={0.4}
          metalness={0.05}
          envMapIntensity={0.9}
        />
      </RoundedBox>

      {/* The holes: one per tool that gets through this plate. */}
      {Array.from({ length: kept }, (_, i) => (
        <mesh key={i} position={[-1.5 + (i % 6) * 0.6, 0.09, -0.45 + Math.floor(i / 6) * 0.75]}>
          <cylinderGeometry args={[0.11, 0.11, 0.06, 14]} />
          <meshBasicMaterial color={P.paper} />
        </mesh>
      ))}

      <Tag position={[-2.55, 0.1, 0]} tone={active ? "ink" : "muted"} size="xs" center>
        {order}. {label}
      </Tag>

      {/* What this plate takes away, slid off to one side. */}
      {removes > 0 ? (
        <group position={[2.55, 0.1, 0]}>
          {Array.from({ length: removes }, (_, i) => (
            <Node3D
              key={i}
              position={[i * 0.28, 0, 0]}
              color={active ? P.rose : P.line}
              radius={0.1}
              matte
            />
          ))}
          <Tag position={[(removes - 1) * 0.14, 0.34, 0]} tone={active ? "rose" : "muted"} size="xs" center>
            −{removes}
          </Tag>
        </group>
      ) : null}

      {active ? <Halo position={[0, 0.1, 0]} radius={2.1} color={color} opacity={0.5} spin={0.2} /> : null}
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [stage, setStage] = useState<Stage>("profile");

  /* Each sieve works on what the one above it left, folded rather than
     accumulated into an outer variable so the render stays pure. */
  const rows = STAGES.reduce<
    { id: Stage; removes: number; color: string; arriving: number; kept: number }[]
  >((acc, s) => {
    const arriving = acc.length ? acc[acc.length - 1].kept : REGISTERED;
    acc.push({ ...s, arriving, kept: Math.max(0, arriving - s.removes) });
    return acc;
  }, []);
  const delivered = rows[rows.length - 1].kept;
  const activeRow = rows.find((r) => r.id === stage)!;

  const note =
    stage === "profile"
      ? t.profileNote
      : stage === "provider"
        ? t.providerNote
        : stage === "allow"
          ? t.allowNote
          : t.sandboxNote;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendKept },
        { color: P.rose, label: t.legendCut },
        { color: P.lineStrong, label: t.legendOrder },
      ]}
      controls={
        <Switcher
          value={stage}
          onChange={setStage}
          options={STAGES.map((s) => ({
            value: s.id,
            label: t[s.id],
            tone: s.color,
          }))}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout
              items={[
                { label: t.registered, value: String(REGISTERED), tone: "var(--ink-soft)" },
                {
                  label: t.removedBy + " " + t[stage],
                  value: `−${activeRow.removes}`,
                  tone: "var(--rose)",
                },
                { label: t.delivered, value: String(delivered), tone: "var(--teal)" },
                { label: t.audit, value: t.auditNote, tone: "var(--muted)" },
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
        fit={1.14}
      >
        <IsoFrame width={12} depth={9} y={-0.06} />

        {/* Everything the Gateway registered, before any of it is filtered. */}
        <group position={[0, 4.4, 0]}>
          {Array.from({ length: REGISTERED }, (_, i) => (
            <Node3D
              key={i}
              position={[-1.5 + (i % 6) * 0.6, 0, -0.35 + Math.floor(i / 6) * 0.7]}
              color={P.teal}
              radius={0.11}
            />
          ))}
          <Tag position={[-2.55, 0, 0]} tone="ink" size="xs" center>
            {t.registered} {REGISTERED}
          </Tag>
        </group>

        {rows.map((r, i) => (
          <Sieve
            key={r.id}
            y={3.4 - i * 0.95}
            arriving={r.arriving}
            removes={r.removes}
            color={r.color}
            label={t[r.id]}
            order={i + 1}
            active={r.id === stage}
          />
        ))}

        {/* The order, drawn as the axis the whole stack hangs on. */}
        <AxisLine from={[0, 4.6, 0]} to={[0, -0.6, 0]} overrun={0.3} color={P.lineStrong} opacity={0.4} />

        {/* What the model is actually offered. */}
        <group position={[0, -0.55, 0]}>
          <RoundedBox args={[3.2, 0.3, 2]} radius={0.06} smoothness={3} position={[0, 0.15, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={P.teal} transparent opacity={0.35} roughness={0.4} envMapIntensity={0.9} />
          </RoundedBox>
          {Array.from({ length: delivered }, (_, i) => (
            <Node3D
              key={i}
              position={[-1.1 + (i % 5) * 0.55, 0.42, -0.3 + Math.floor(i / 5) * 0.6]}
              color={P.teal}
              radius={0.12}
            />
          ))}
          <Tag position={[0, -0.28, 1.2]} tone="teal" size="sm" center>
            {t.delivered}: {delivered}
          </Tag>
        </group>

        <IsoDust count={26} center={[0, 2, 0]} spread={[2.2, 2.2, 1.4]} />
      </Stage>
    </Figure>
  );
}
