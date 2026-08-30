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
 * Which workspace files end up in the prompt, and which only answer when
 * asked.
 *
 * Every file in the section sounds equally important read aloud. What
 * actually separates them is delivery: standing orders are injected into
 * every session, MEMORY.md is injected only into the private main one,
 * and the daily log is never injected — memory tools fetch it on demand.
 * Switch the context and watch which arrows survive.
 */

type Ctx = "main" | "group" | "flush";

type File = {
  id: string;
  /** Injected into the prompt in this context? */
  injected: (ctx: Ctx) => boolean;
  color: string;
  z: number;
};

const FILES: File[] = [
  { id: "agents", injected: () => true, color: P.violet, z: -2.4 },
  { id: "memory", injected: (c) => c === "main", color: P.teal, z: -0.8 },
  { id: "daily", injected: () => false, color: P.amber, z: 0.8 },
  { id: "heartbeat", injected: () => false, color: P.line, z: 2.4 },
];

const COPY = {
  en: {
    title: "what actually reaches the prompt",
    hint: "switch the context · injected is not the same as available",
    main: "private main",
    group: "shared / group",
    flush: "flush before compaction",
    legendInjected: "injected every turn",
    legendOnDemand: "fetched on demand",
    legendNever: "not a schedule",
    files: {
      agents: "AGENTS.md · standing orders",
      memory: "MEMORY.md · curated long term",
      daily: "memory/YYYY-MM-DD.md · daily log",
      heartbeat: "HEARTBEAT.md · optional checklist",
    },
    prompt: "prompt",
    disk: "workspace on disk",
    injected: "injected",
    onDemand: "on demand",
    count: "files in the prompt",
    mainNote:
      "MEMORY.md loads only here. Standing orders in AGENTS.md are injected into every session, which is also why a standing order cannot restore a tool that tools.deny removed — personality is not policy.",
    groupNote:
      "the same agent in a shared or group context does not get MEMORY.md. Keep durable facts there and detailed logs in the daily file, and the group prompt stays small without losing anything you can still fetch.",
    flushNote:
      "before compacting, a silent memory flush writes durable notes to disk. That is why these files belong to the compaction lesson too: summarise first and lose the process, and the mid-thread facts are gone unless they already lived in MEMORY.md or today's daily file.",
  },
  es: {
    title: "qué llega de verdad al prompt",
    hint: "cambia el contexto · inyectado no es lo mismo que disponible",
    main: "main privada",
    group: "compartido / grupo",
    flush: "flush antes de compactar",
    legendInjected: "inyectado cada turno",
    legendOnDemand: "se busca a demanda",
    legendNever: "no es un schedule",
    files: {
      agents: "AGENTS.md · standing orders",
      memory: "MEMORY.md · largo plazo curado",
      daily: "memory/YYYY-MM-DD.md · log diario",
      heartbeat: "HEARTBEAT.md · checklist opcional",
    },
    prompt: "prompt",
    disk: "workspace en disco",
    injected: "inyectado",
    onDemand: "a demanda",
    count: "archivos en el prompt",
    mainNote:
      "MEMORY.md se carga solo aquí. Las standing orders de AGENTS.md se inyectan en cada sesión, y por eso mismo una standing order no puede devolver una tool que tools.deny quitó — la personalidad no es política.",
    groupNote:
      "el mismo agente en un contexto compartido o de grupo no recibe MEMORY.md. Guarda los hechos durables ahí y los logs detallados en el archivo diario, y el prompt de grupo se queda pequeño sin perder nada que puedas seguir buscando.",
    flushNote:
      "antes de compactar, un turno silencioso de memory flush escribe las notas durables a disco. Por eso estos archivos también son de la lección de compaction: resume primero y pierde el proceso, y los hechos de mitad de hilo se van salvo que ya vivieran en MEMORY.md o en el diario de hoy.",
  },
};

/** A file on the shelf, lifting when it is going into the prompt. */
function FileCard({
  file,
  injected,
  label,
  flushing,
}: {
  file: File;
  injected: boolean;
  label: string;
  flushing: boolean;
}) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    const base = injected ? 0.5 : 0.1;
    const pulse = flushing ? Math.sin(clock.elapsedTime * 2.4) * 0.06 : 0;
    g.position.y = MathUtils.damp(g.position.y, base + pulse, 6, dt);
  });

  return (
    <group position={[-3.6, 0, file.z]}>
      <RoundedBox args={[2.4, 0.16, 1]} radius={0.05} smoothness={3} position={[0, 0.08, 0]} receiveShadow>
        <meshStandardMaterial color={P.sunken} roughness={0.5} />
      </RoundedBox>
      <group ref={ref}>
        <RoundedBox args={[2.2, 0.2, 0.9]} radius={0.05} smoothness={3} castShadow>
          <meshStandardMaterial
            color={injected ? file.color : P.surface}
            roughness={0.36}
            metalness={0.04}
            envMapIntensity={0.9}
          />
        </RoundedBox>
      </group>
      <Tag position={[0, -0.16, 0.75]} tone={injected ? "ink" : "muted"} size="xs" center>
        {label}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [ctx, setCtx] = useState<Ctx>("main");

  const injectedOf = (f: File) => f.injected(ctx);
  const count = FILES.filter(injectedOf).length;
  const note = ctx === "main" ? t.mainNote : ctx === "group" ? t.groupNote : t.flushNote;
  const accent = ctx === "group" ? P.amber : ctx === "flush" ? P.rose : P.teal;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.violet, label: t.legendInjected },
        { color: P.amber, label: t.legendOnDemand },
        { color: P.line, label: t.legendNever },
      ]}
      controls={
        <Switcher
          value={ctx}
          onChange={setCtx}
          options={[
            { value: "main", label: t.main, tone: P.teal },
            { value: "group", label: t.group, tone: P.amber },
            { value: "flush", label: t.flush, tone: P.rose },
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
                { label: t.count, value: `${count} / ${FILES.length}`, tone: accent },
                { label: t.onDemand, value: t.files.daily, tone: "var(--muted)" },
              ]}
            />
          </div>
        </>
      }
      height="h-[400px] md:h-[490px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={13} depth={10} y={-0.05} />

        <Tag position={[-3.6, 0.1, -3.5]} tone="muted" size="xs" center>
          {t.disk}
        </Tag>

        {FILES.map((f) => (
          <FileCard
            key={f.id}
            file={f}
            injected={injectedOf(f)}
            label={t.files[f.id as keyof typeof t.files]}
            flushing={ctx === "flush" && (f.id === "memory" || f.id === "daily")}
          />
        ))}

        {/* The prompt: only what was injected is inside it. */}
        <group position={[3.2, 0, 0]}>
          <RoundedBox args={[2.4, 0.3, 5.4]} radius={0.08} smoothness={3} position={[0, 0.15, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={P.surface} roughness={0.36} metalness={0.04} envMapIntensity={0.95} />
          </RoundedBox>
          {FILES.filter(injectedOf).map((f, i) => (
            <RoundedBox
              key={f.id}
              args={[2, 0.18, 0.8]}
              radius={0.04}
              smoothness={3}
              position={[0, 0.42 + i * 0.24, -1.6 + i * 1.1]}
              castShadow
            >
              <meshStandardMaterial color={f.color} roughness={0.34} metalness={0.05} envMapIntensity={0.9} />
            </RoundedBox>
          ))}
          <Tag position={[0, 1.5, 0]} tone="ink" size="sm" center>
            {t.prompt}
          </Tag>
        </group>

        {/* Injection lines survive; on-demand ones stay dashed and idle. */}
        {FILES.map((f) => (
          <AxisLine
            key={f.id}
            from={[-2.3, 0.35, f.z]}
            to={[1.9, 0.35, f.z * 0.5]}
            overrun={0}
            color={injectedOf(f) ? f.color : P.line}
            opacity={injectedOf(f) ? 0.7 : 0.3}
            dashed={!injectedOf(f)}
          />
        ))}

        {/* The flush: durable notes written back before the summary runs. */}
        {ctx === "flush" ? (
          <group position={[-0.2, 1.5, 1.6]}>
            <Node3D position={[0, 0, 0]} color={P.rose} radius={0.16} />
            <Halo radius={0.46} color={P.rose} opacity={0.75} spin={0.5} />
            <Tag position={[0, 0.55, 0]} tone="rose" size="xs" center>
              {t.flush}
            </Tag>
            <AxisLine from={[0, -0.2, 0]} to={[-3, -1.1, 0.4]} overrun={0} color={P.rose} opacity={0.5} />
          </group>
        ) : null}

        <IsoDust count={22} center={[0, 1.2, 0]} spread={[3.6, 0.6, 2.6]} />
      </Stage>
    </Figure>
  );
}
