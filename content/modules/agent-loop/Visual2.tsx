"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group } from "three";
import { Knob, Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Arrow, ShadowBlob, useCycle, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* agent-loop: while read→decide→act→observe; interrupt cuts; final-answer halo. */
type Mode = "while" | "interrupt" | "stop";

const COPY = {
  en: {
    the_loop_is_the_brain: "the loop is the brain",
    while_interrupt_final: "while · interrupt · final",
    while_mode: "while",
    interrupt: "interrupt",
    stop: "final",
    read: "read",
    decide: "decide",
    act: "act",
    observe: "observe",
    max_steps: "max steps",
    final_answer: "final answer",
  },
  es: {
    the_loop_is_the_brain: "el bucle es el cerebro",
    while_interrupt_final: "mientras · interrumpe · final",
    while_mode: "mientras",
    interrupt: "interrumpe",
    stop: "final",
    read: "lee",
    decide: "decide",
    act: "actúa",
    observe: "observa",
    max_steps: "max steps",
    final_answer: "respuesta final",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("while");

  return (
    <Figure
      label={t.the_loop_is_the_brain}
      hint={t.while_interrupt_final}
      legend={[
        { color: P.teal, label: t.while_mode },
        { color: P.rose, label: t.interrupt },
        { color: P.amber, label: t.stop },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "while", label: t.while_mode, tone: P.teal },
            { value: "interrupt", label: t.interrupt, tone: P.rose },
            { value: "stop", label: t.stop, tone: P.amber },
          ]}
          ariaLabel={t.the_loop_is_the_brain}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "while" && (
          <>
            {/* the four verbs as a rotating ring */}
            {[t.read, t.decide, t.act, t.observe].map((verb, i) => {
              const a = (i / 4) * Math.PI * 2;
              const x = Math.cos(a) * 1.4;
              const y = 0.4 + Math.sin(a) * 1.4;
              const tones = ["teal", "violet", "amber", "teal"] as const;
              const colors = [P.teal, P.violet, P.amber, P.teal];
              return (
                <group key={verb}>
                  <Node3D position={[x, y, 0]} color={colors[i]} radius={0.2} pulse={i * 0.25} />
                  <Tag position={[x, y + 0.35, 0.15]} tone={tones[i]} size="xs">{verb}</Tag>
                </group>
              );
            })}
            {/* arrows around */}
            {[0, 1, 2, 3].map((i) => {
              const a1 = (i / 4) * Math.PI * 2 + 0.55;
              const a2 = ((i + 1) / 4) * Math.PI * 2 - 0.55;
              return (
                <Ribbon
                  key={i}
                  points={[
                    [Math.cos(a1) * 1.4, 0.4 + Math.sin(a1) * 1.4, 0],
                    [Math.cos(a2) * 1.4, 0.4 + Math.sin(a2) * 1.4, 0],
                  ]}
                  color={P.lineStrong}
                  radius={0.02}
                  opacity={0.6}
                />
              );
            })}
            <Halo position={[0, 0.4, 0]} radius={1.75} color={P.teal} opacity={0.25} spin={0.08} />
          </>
        )}

        {mode === "interrupt" && (
          <>
            {/* the loop running with a rose ribbon slicing through */}
            {[t.read, t.decide, t.act, t.observe].map((verb, i) => {
              const a = (i / 4) * Math.PI * 2;
              return (
                <Node3D
                  key={verb}
                  position={[Math.cos(a) * 1.4, 0.4 + Math.sin(a) * 1.4, 0]}
                  color={P.violet}
                  radius={0.18}
                  matte
                />
              );
            })}
            <Ribbon
              points={[[-2.5, -0.6, 0], [0, 0.4, 0], [2.5, 1.2, 0]]}
              color={P.rose}
              radius={0.05}
              opacity={0.95}
            />
            <Slab position={[2.6, 1.3, 0]} size={[1.6, 0.5, 0.1]} color={P.rose} fill={0.3} />
            <Tag position={[2.6, 1.75, 0.15]} tone="rose" size="xs">{t.interrupt}</Tag>
            <Tag position={[0, -1.5, 0.15]} tone="muted" size="xs">user pressed stop · ctrl+c</Tag>
          </>
        )}

        {mode === "stop" && (
          <>
            <Halo position={[0, 0.4, 0]} radius={1.0} color={P.amber} opacity={0.7} spin={0.3} />
            <Node3D position={[0, 0.4, 0]} color={P.amber} radius={0.25} pulse={0.4} />
            <Tag position={[0, 1.6, 0.15]} tone="amber">{t.final_answer}</Tag>
            {/* the loop has faded behind */}
            {[0, 1, 2, 3].map((i) => {
              const a = (i / 4) * Math.PI * 2;
              return (
                <Node3D
                  key={i}
                  position={[Math.cos(a) * 2.4, 0.4 + Math.sin(a) * 2.4, 0]}
                  color={P.muted}
                  radius={0.1}
                  matte
                />
              );
            })}
            <Tag position={[0, -1.35, 0.15]} tone="muted" size="xs">loop done</Tag>
            <Ribbon points={[[0, -1.55, 0], [0, -2.2, 0]]} color={P.amber} radius={0.04} opacity={0.7} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* El while de Thought → Action → Observation y sus tres salidas: respuesta
   final, presupuesto agotado e interrupción. El transcript se construye en
   código a partir del escenario y se valida la alternancia de roles, que es
   lo que un proveedor rechaza con un 400. */

type Exit = "final" | "budget" | "interrupt";
type Role = "user" | "assistant" | "tool";
type Card = { id: string; role: Role; kind: "user" | "action" | "obs" | "final" | "partial" | "notice" | "user2"; label: string; dropped?: boolean };

function buildTranscript(exit: Exit, maxSteps: number, keepPartial: boolean) {
  const cards: Card[] = [{ id: "u", role: "user", kind: "user", label: "¿Qué tiempo hace en Nueva York?" }];
  let iterations = 0;
  if (exit === "final") {
    cards.push({ id: "a1", role: "assistant", kind: "action", label: "Thought + Action get_weather" });
    cards.push({ id: "o1", role: "tool", kind: "obs", label: "Observation: 15 °C, nubes" });
    cards.push({ id: "f", role: "assistant", kind: "final", label: "Final Answer" });
    iterations = 2;
  } else if (exit === "budget") {
    for (let i = 1; i <= maxSteps; i++) {
      cards.push({ id: `a${i}`, role: "assistant", kind: "action", label: `Action #${i} get_weather` });
      cards.push({ id: `o${i}`, role: "tool", kind: "obs", label: "Observation: 503" });
    }
    cards.push({ id: "n", role: "assistant", kind: "notice", label: "Aviso: presupuesto agotado" });
    iterations = maxSteps;
  } else {
    cards.push({ id: "a1", role: "assistant", kind: "action", label: "Thought + Action get_weather" });
    cards.push({ id: "o1", role: "tool", kind: "obs", label: "Observation: 15 °C, nubes" });
    cards.push({ id: "p", role: "assistant", kind: "partial", label: "«Hoy en Nueva…» (parcial)", dropped: !keepPartial });
    if (keepPartial) cards.push({ id: "a2", role: "assistant", kind: "final", label: "Respuesta al mensaje nuevo" });
    else cards.push({ id: "u2", role: "user", kind: "user2", label: "Mensaje nuevo en cola" });
    iterations = 2;
  }
  const committed = cards.filter((c) => !c.dropped);
  /* Regla de alternancia: nunca dos mensajes del asistente seguidos (los
     resultados de herramienta separan las vueltas). */
  let badAt = -1;
  for (let i = 1; i < committed.length; i++) {
    if (committed[i].role === "assistant" && committed[i - 1].role === "assistant") { badAt = i; break; }
  }
  return { cards, committed, iterations, valid: badAt < 0, badId: badAt >= 0 ? committed[badAt].id : null };
}

const K = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  brass: "#B68442",
  steel: "#9EA5A2",
  charcoal: "#24292B",
};
const ROLE_COLOR: Record<Card["kind"], string> = {
  user: P.amber,
  user2: P.amber,
  action: P.violet,
  obs: P.teal,
  final: P.violet,
  partial: P.rose,
  notice: P.inkSoft,
};

const DIAL_C: V3 = [-2.9, 1.95, -0.2];
const DIAL_R = 1.05;
/* Sectores del while: Thought (arriba), Action (derecha abajo), Observation (izquierda abajo). */
const SECTORS = [
  { name: "Thought", color: P.violet, start: (Math.PI * 5) / 6, len: (Math.PI * 2) / 3 },
  { name: "Action", color: mixHex(P.violet, P.teal, 0.5), start: Math.PI / 6, len: (Math.PI * 2) / 3 },
  { name: "Observation", color: P.teal, start: -Math.PI / 2, len: (Math.PI * 2) / 3 },
];

function Plinth() {
  return (
    <group>
      <ShadowBlob position={[0.4, -0.3, 0]} scale={11} opacity={0.12} />
      <RoundedBox args={[10.4, 0.32, 3.3]} position={[0.5, -0.12, 0]} radius={0.13} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={K.base} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[10.05, 0.07, 2.95]} position={[0.5, 0.07, 0]} radius={0.03} smoothness={3} receiveShadow>
        <meshStandardMaterial color={K.baseTop} roughness={0.45} metalness={0.22} />
      </RoundedBox>
    </group>
  );
}

function WhileDial({ exit, iterations, maxSteps, sector, running }: { exit: Exit; iterations: number; maxSteps: number; sector: number; running: boolean }) {
  const puck = useRef<Group>(null);
  const angle = useRef(SECTORS[0].start - SECTORS[0].len / 2);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (!puck.current) return;
    const s = SECTORS[Math.max(0, sector)];
    const goal = s.start - s.len / 2;
    let diff = goal - angle.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    /* El pulso gira siempre en sentido horario: Thought → Action → Observation. */
    if (diff > 0.02) diff -= Math.PI * 2;
    angle.current += still ? diff : diff * Math.min(1, dt * 4);
    puck.current.position.set(Math.cos(angle.current) * DIAL_R, Math.sin(angle.current) * DIAL_R, 0.02);
  });
  const ticks = Math.max(maxSteps, iterations);
  return (
    <group position={DIAL_C}>
      {/* soporte */}
      <mesh position={[0, -DIAL_R - 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.62, 16]} />
        <meshStandardMaterial color={K.steel} roughness={0.3} metalness={0.8} />
      </mesh>
      <RoundedBox args={[1.2, 0.14, 0.8]} position={[0, -DIAL_R - 0.72, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={K.charcoal} roughness={0.4} metalness={0.3} />
      </RoundedBox>
      {/* anillo base y sectores */}
      <mesh castShadow>
        <torusGeometry args={[DIAL_R, 0.05, 14, 96]} />
        <meshStandardMaterial color={K.deck} roughness={0.5} metalness={0.1} />
      </mesh>
      {SECTORS.map((s, i) => (
        <mesh key={s.name} rotation={[0, 0, s.start - s.len + 0.06]} castShadow>
          <torusGeometry args={[DIAL_R, 0.095, 16, 64, s.len - 0.12]} />
          <meshPhysicalMaterial color={s.color} roughness={0.35} clearcoat={0.5} emissive={s.color} emissiveIntensity={running && sector === i ? 0.35 : 0} />
        </mesh>
      ))}
      {/* disco central: número de vuelta */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.12, 48]} />
        <meshPhysicalMaterial color={K.charcoal} roughness={0.35} clearcoat={0.5} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(-Math.PI / 6 + (i * Math.PI * 2) / 3) * 0.36, Math.sin(-Math.PI / 6 + (i * Math.PI * 2) / 3) * 0.36, 0]} rotation={[0, 0, -Math.PI / 6 + (i * Math.PI * 2) / 3]}>
          <boxGeometry args={[0.72, 0.03, 0.14]} />
          <meshStandardMaterial color={K.steel} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <group ref={puck}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 24, 18]} />
          <meshPhysicalMaterial color={P.amber} roughness={0.25} clearcoat={0.8} metalness={0.2} />
        </mesh>
      </group>
      {/* bandeja de presupuesto: un casquillo por vuelta permitida */}
      <group position={[0, -DIAL_R - 0.72, 1.0]}>
        <RoundedBox args={[Math.max(maxSteps, iterations) * 0.3 + 0.3, 0.1, 0.42]} radius={0.04} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={K.charcoal} roughness={0.4} metalness={0.3} />
        </RoundedBox>
        {Array.from({ length: ticks }, (_, i) => {
          const used = i < iterations;
          const over = i >= maxSteps;
          const x = (i - (ticks - 1) / 2) * 0.3;
          return (
            <mesh key={i} position={[x, used ? 0.1 : 0.06, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, used ? 0.12 : 0.04, 18]} />
              <meshStandardMaterial color={over ? P.rose : used ? (exit === "budget" && i === maxSteps - 1 ? P.rose : P.amber) : "#8C918D"} roughness={0.35} metalness={0.3} />
            </mesh>
          );
        })}
      </group>
      <Tag position={[0, -DIAL_R - 0.5, 1.45]} tone="muted" size="xs" center>{`tope ${maxSteps} pasos`}</Tag>
      <Tag position={[0, DIAL_R + 0.42, 0]} tone="violet" size="xs" center>Thought</Tag>
      <Tag position={[DIAL_R + 0.55, -0.62, 0]} tone="violet" size="xs" center>Action</Tag>
      <Tag position={[-DIAL_R - 0.72, -0.62, 0]} tone="teal" size="xs" center>Observation</Tag>
    </group>
  );
}

const RAIL_X0 = -1.05;
const PITCH = 0.46;

function TranscriptRail({ cards, visible, badId }: { cards: Card[]; visible: number; badId: string | null }) {
  const committedIndex = new Map<string, number>();
  let slot = 0;
  cards.forEach((card) => {
    if (!card.dropped) committedIndex.set(card.id, slot++);
  });
  const railLen = Math.max(4.8, slot * PITCH + 0.6);
  return (
    <group position={[0, 0.12, 0.1]}>
      {/* raíl de fichas */}
      <RoundedBox args={[railLen, 0.12, 1.25]} position={[RAIL_X0 + railLen / 2 - 0.3, 0.02, 0]} radius={0.04} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={K.charcoal} roughness={0.4} metalness={0.3} />
      </RoundedBox>
      {[-0.4, 0.4].map((z) => (
        <mesh key={z} position={[RAIL_X0 + railLen / 2 - 0.3, 0.1, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, railLen - 0.1, 10]} />
          <meshStandardMaterial color={K.brass} roughness={0.28} metalness={0.8} />
        </mesh>
      ))}
      {cards.map((card, i) => {
        if (i >= visible) return null;
        const color = ROLE_COLOR[card.kind];
        const bad = card.id === badId;
        const index = committedIndex.get(card.id);
        const x = card.dropped ? RAIL_X0 + (slot - 0.2) * PITCH : RAIL_X0 + (index ?? 0) * PITCH;
        const pos: V3 = card.dropped ? [x + 0.45, 1.25, -1.05] : [x, 0.63, 0];
        return (
          <group key={card.id} position={pos} rotation={card.dropped ? [0, 0.9, 0.12] : [0, 0, 0]}>
            <RoundedBox args={[0.13, 1.0, 1.0]} radius={0.035} smoothness={2} castShadow receiveShadow>
              <meshPhysicalMaterial color={mixHex(K.deck, color, card.kind === "notice" ? 0.1 : 0.22)} roughness={0.5} clearcoat={0.35} transparent={card.dropped} opacity={card.dropped ? 0.55 : 1} />
            </RoundedBox>
            <mesh position={[0, 0.43, 0]}>
              <boxGeometry args={[0.135, 0.12, 1.02]} />
              <meshStandardMaterial color={bad ? P.rose : color} roughness={0.4} emissive={bad ? P.rose : "#000"} emissiveIntensity={bad ? 0.4 : 0} />
            </mesh>
          </group>
        );
      })}
      {badId ? (
        <mesh position={[RAIL_X0 + ((committedIndex.get(badId) ?? 1) - 0.5) * PITCH, 1.25, 0]}>
          <boxGeometry args={[PITCH + 0.25, 0.05, 1.1]} />
          <meshStandardMaterial color={P.rose} emissive={P.rose} emissiveIntensity={0.3} />
        </mesh>
      ) : null}
    </group>
  );
}

function sectorForCard(card: Card | undefined) {
  if (!card) return 0;
  if (card.kind === "obs") return 2;
  if (card.kind === "action") return 1;
  return 0;
}

function WhileScene({ exit, maxSteps, keepPartial }: { exit: Exit; maxSteps: number; keepPartial: boolean }) {
  const t = useMemo(() => buildTranscript(exit, maxSteps, keepPartial), [exit, maxSteps, keepPartial]);
  /* El transcript se escribe ficha a ficha y se queda completo unos segundos antes de repetir. */
  const [tick] = useCycle(t.cards.length + 6, 0.8);
  const { still } = useStage();
  const visible = still ? t.cards.length : Math.min(t.cards.length, tick + 1);
  const last = t.cards[Math.min(visible, t.cards.length) - 1];
  const done = visible >= t.cards.length;
  const badVisible = done ? t.badId : null;
  const committedCount = t.committed.length;
  const endX = RAIL_X0 + (committedCount - 1) * PITCH;
  return (
    <PointerTilt amount={0.05}>
      <group>
        <Plinth />
        <WhileDial exit={exit} iterations={t.cards.slice(0, visible).filter((c) => c.role === "assistant" && c.kind !== "notice").length} maxSteps={maxSteps} sector={sectorForCard(last)} running={!done} />
        <TranscriptRail cards={t.cards} visible={visible} badId={badVisible} />
        <Arrow from={[-1.75, 1.3, 0]} to={[-1.2, 0.95, 0]} color={P.amber} head={0.08} bow={0.1} />
        <Tag position={[RAIL_X0 + 1.6, -0.15, 0.75]} tone="muted" size="xs" center>transcript</Tag>
        {exit === "interrupt" && !keepPartial && done ? <Tag position={[endX + 1.0, 2.05, -1.05]} tone="rose" size="xs" center>descartado</Tag> : null}
        {badVisible ? <Tag position={[endX, 1.8, 0]} tone="rose" size="xs" center>400 del proveedor</Tag> : null}
        {done && !badVisible ? <Tag position={[endX, 1.55, 0]} tone={exit === "final" ? "violet" : exit === "budget" ? "rose" : "amber"} size="xs" center>{exit === "final" ? "respuesta final" : exit === "budget" ? "tope de pasos" : "alternancia válida"}</Tag> : null}
      </group>
    </PointerTilt>
  );
}

function WhileNote({ exit, maxSteps, keepPartial }: { exit: Exit; maxSteps: number; keepPartial: boolean }) {
  const t = buildTranscript(exit, maxSteps, keepPartial);
  const roles = t.committed.map((c) => (c.role === "user" ? "U" : c.role === "assistant" ? "A" : "T")).join(" → ");
  const lead =
    exit === "final"
      ? "Alfred no sabe el tiempo: emite una Action, el arnés ejecuta get_weather y añade la Observation. En la segunda vuelta ya tiene evidencia y sale con Final Answer. El bucle cierra porque se cumplió el objetivo."
      : exit === "budget"
        ? `La herramienta devuelve 503 en cada vuelta. Sin tope, el while seguiría quemando tokens. Con un presupuesto de ${maxSteps} pasos, el arnés corta tras ${maxSteps} Actions y cierra el turno con un aviso propio, no con texto inventado por el modelo.`
        : keepPartial
          ? "Error reproducido: el arnés interrumpe, pero guarda el fragmento parcial como turno cerrado. La siguiente respuesta queda pegada a otro mensaje del asistente y el proveedor rechaza la llamada con un 400."
          : "Llega un mensaje nuevo a mitad de stream. El arnés abandona la llamada HTTP, descarta el fragmento parcial (no se persiste) y encola el mensaje nuevo: la alternancia sigue siendo válida.";
  return (
    <div className="space-y-3">
      <p>{lead}</p>
      <Readout items={[
        { label: "vueltas del while", value: String(t.iterations), tone: "var(--violet)" },
        { label: "mensajes guardados", value: String(t.committed.length), tone: "var(--teal)" },
        { label: "descartados", value: String(t.cards.length - t.committed.length), tone: "var(--rose)" },
        { label: "alternancia", value: t.valid ? "válida" : "rota → 400", tone: t.valid ? "var(--teal)" : "var(--rose)" },
      ]} />
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">roles guardados: {roles} · (U usuario, A asistente, T resultado de herramienta)</p>
      <p className="text-xs text-muted">La Observation la escribe el arnés tras ejecutar la herramienta; nunca se muestrea. Escenarios didácticos: la regla que se comprueba (no dos mensajes del asistente seguidos) es la que dispara el caso de Telegram de la lección. Test sin GPU: dado este transcript, ¿la siguiente llamada es válida?</p>
    </div>
  );
}

function SpanishVisual() {
  const [exit, setExit] = useState<Exit>("final");
  const [maxSteps, setMaxSteps] = useState(4);
  const [keepPartial, setKeepPartial] = useState(false);
  return (
    <Figure
      label="El while del agente y sus tres salidas"
      hint="Thought → Action → Observation · final, presupuesto o interrupción"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.amber, label: "usuario" },
        { color: P.violet, label: "asistente" },
        { color: P.teal, label: "resultado de herramienta" },
        { color: P.rose, label: "fragmento / error" },
      ]}
      note={<WhileNote exit={exit} maxSteps={maxSteps} keepPartial={keepPartial} />}
      controls={
        <>
          <Switcher
            value={exit}
            onChange={setExit}
            options={[
              { value: "final", label: "Respuesta final", tone: P.violet },
              { value: "budget", label: "Presupuesto", tone: P.rose },
              { value: "interrupt", label: "Interrupción", tone: P.amber },
            ]}
            ariaLabel="Salida del bucle"
          />
          {exit === "budget" ? <Knob label="tope de pasos" value={maxSteps} min={2} max={6} onChange={setMaxSteps} tone="var(--rose)" /> : null}
          {exit === "interrupt" ? (
            <button type="button" className="chip" aria-pressed={keepPartial} onClick={() => setKeepPartial(!keepPartial)}>{keepPartial ? "Descartar fragmento" : "Guardar fragmento (error)"}</button>
          ) : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.6, 4.2, 10.5], fov: 34 }} fit={1.08}>
        <WhileScene key={`${exit}:${maxSteps}:${keepPartial}`} exit={exit} maxSteps={maxSteps} keepPartial={keepPartial} />
      </Stage>
    </Figure>
  );
}
