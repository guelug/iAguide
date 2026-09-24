"use client";

import { useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import type { Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, useCycle } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "directions" | "bridge" | "binding";
const COPY = {
  en: { title: "ACP has two inverse directions", hint: "bridge · spawn · binding", directions: "directions", bridge: "bridge", binding: "binding", editor: "editor", openclaw: "OpenClaw", harness: "harness", gateway: "Gateway", prompt: "prompt", spawn: "spawn", here: "bind here", thread: "thread", host: "host", sandbox: "sandbox" },
  es: { title: "ACP tiene dos direcciones inversas", hint: "bridge · spawn · binding", directions: "direcciones", bridge: "bridge", binding: "binding", editor: "editor", openclaw: "OpenClaw", harness: "arnés", gateway: "Gateway", prompt: "prompt", spawn: "spawn", here: "bind here", thread: "thread", host: "host", sandbox: "sandbox" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("directions");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.editor }, { color: P.violet, label: t.gateway }, { color: P.amber, label: t.harness }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "directions", label: t.directions, tone: P.teal }, { value: "bridge", label: t.bridge, tone: P.violet }, { value: "binding", label: t.binding, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "directions" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.editor}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.openclaw}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">editor → servidor · OpenClaw → harness</Tag></>}
        {mode === "bridge" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.violet} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[0, 0.78, 0.15]} tone="violet">{t.gateway}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">stdio ACP</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="amber" size="xs">WebSocket</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.prompt} → session key</Tag></>}
        {mode === "binding" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="amber">{t.spawn}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.teal} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="teal">{t.here}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.host} runtime · no {t.sandbox}</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * Resolución del destino de un comando /acp. OpenClaw prueba en orden:
 * clave/id/label explícito, binding del hilo actual, sesión solicitante.
 * La sonda cae por la torre y se detiene en la primera bandeja que tiene
 * sesión; si ninguna la tiene, llega a la bandeja de error.
 */

type SourceId = "explicit" | "binding" | "requester";
const SOURCES: { id: SourceId; label: string; example: string; color: string }[] = [
  { id: "explicit", label: "1 · explícito", example: "--session agent:design:main", color: P.violet },
  { id: "binding", label: "2 · binding del hilo", example: "hilo atado con --bind here", color: P.amber },
  { id: "requester", label: "3 · solicitante", example: "la sesión que escribió el comando", color: P.teal },
];

function resolveTarget(present: Record<SourceId, boolean>) {
  const hit = SOURCES.findIndex((s) => present[s.id]);
  return { hit, source: hit >= 0 ? SOURCES[hit] : null };
}

const T2 = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };
const TRAY_Y = [1.35, 0.55, -0.25];
const ERROR_Y = -1.0;

function TMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

function Probe({ stopY }: { stopY: number }) {
  const ref = useRef<Group>(null);
  const v = useRef(0);
  const { still } = useStage();
  const [drop] = useCycle(2, 2.4);
  const last = useRef(drop);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (still) {
      g.position.y = stopY + 0.22;
      return;
    }
    if (last.current !== drop && drop === 0) {
      g.position.y = 2.3;
      v.current = 0;
    }
    last.current = drop;
    const floor = stopY + 0.22;
    if (g.position.y > floor) {
      v.current += dt * 6;
      g.position.y = Math.max(floor, g.position.y - v.current * dt);
    }
  });
  return (
    <group ref={ref} position={[0, 2.3, 0.1]}>
      <mesh castShadow>
        <sphereGeometry args={[0.16, 28, 20]} />
        <meshPhysicalMaterial color={P.ink} roughness={0.25} clearcoat={0.8} metalness={0.2} />
      </mesh>
    </group>
  );
}

function Tower({ present, hit }: { present: Record<SourceId, boolean>; hit: number }) {
  return (
    <group>
      {/* columnas y bandejas */}
      {[-1.25, 1.25].map((x) => (
        <mesh key={x} position={[x, 0.3, -0.55]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 3.2, 12]} />
          <meshStandardMaterial color={T2.steel} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {SOURCES.map((s, i) => {
        const has = present[s.id];
        const stop = i === hit;
        const skipped = hit < 0 || i < hit;
        return (
          <group key={s.id} position={[0, TRAY_Y[i], 0]}>
            <RoundedBox args={[2.5, 0.1, 1.3]} radius={0.04} smoothness={2} castShadow receiveShadow>
              <TMat color={stop ? mixHex(P.paper, s.color, 0.45) : T2.ceramic} />
            </RoundedBox>
            {/* hueco central: abierto si la fuente no existe */}
            {has ? (
              <RoundedBox position={[0, 0.1, 0.1]} args={[0.7, 0.1, 0.5]} radius={0.03} smoothness={2} castShadow>
                <TMat color={mixHex(P.paper, s.color, 0.6)} clear={0.6} />
              </RoundedBox>
            ) : (
              <mesh position={[0, 0.052, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.24, 32]} />
                <meshStandardMaterial color={T2.graphite} />
              </mesh>
            )}
            <Tag position={[1.45, 0.05, 0.3]} tone={stop ? (s.color === P.violet ? "violet" : s.color === P.amber ? "amber" : "teal") : "muted"} size="xs">{s.label}</Tag>
            {!has && skipped ? <Tag position={[-1.45, 0.05, 0.3]} tone="muted" size="xs">{"vacío"}</Tag> : null}
          </group>
        );
      })}
      <group position={[0, ERROR_Y, 0]}>
        <RoundedBox args={[1.3, 0.3, 1.0]} radius={0.06} smoothness={3} castShadow receiveShadow>
          <TMat color={hit < 0 ? mixHex(P.paper, P.rose, 0.5) : "#D8D4CB"} />
        </RoundedBox>
        <Tag position={[1.0, 0.05, 0.3]} tone={hit < 0 ? "rose" : "muted"} size="xs">sin destino</Tag>
      </group>
      <Probe key={hit} stopY={hit >= 0 ? TRAY_Y[hit] + 0.1 : ERROR_Y + 0.15} />
    </group>
  );
}

function ResolveBench({ present }: { present: Record<SourceId, boolean> }) {
  const { hit } = resolveTarget(present);
  return (
    <PointerTilt amount={0.06}>
      <group>
        <ShadowBlob position={[0, -1.52, 0]} scale={5} opacity={0.14} />
        <RoundedBox position={[0, -1.35, 0]} args={[4.2, 0.3, 2.4]} radius={0.14} smoothness={4} castShadow receiveShadow>
          <TMat color={T2.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -1.17, 0]} args={[3.95, 0.06, 2.15]} radius={0.03} smoothness={3} receiveShadow>
          <TMat color={T2.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        <Tower present={present} hit={hit} />
        <Tag position={[0, 2.55, 0]} tone="ink" center>/acp steer</Tag>
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [present, setPresent] = useState<Record<SourceId, boolean>>({ explicit: false, binding: true, requester: true });
  const r = resolveTarget(present);
  const toggle = (id: SourceId) => setPresent((p) => ({ ...p, [id]: !p[id] }));
  return (
    <Figure
      label="¿A qué sesión va este comando? · resolución del destino"
      hint="explícito → binding del hilo → solicitante"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.violet, label: "clave explícita" },
        { color: P.amber, label: "binding del hilo" },
        { color: P.teal, label: "sesión solicitante" },
        { color: P.rose, label: "sin destino" },
      ]}
      controls={
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Fuentes disponibles">
          {SOURCES.map((s) => (
            <button key={s.id} type="button" className="chip" aria-pressed={present[s.id]} onClick={() => toggle(s.id)} style={present[s.id] ? { borderColor: s.color, color: s.color } : undefined}>
              {s.label.split(" · ")[1]} {present[s.id] ? "✓" : "—"}
            </button>
          ))}
        </div>
      }
      note={
        <div className="space-y-3">
          <p>
            {r.source ? (
              <><strong>Destino: {r.source.label.split(" · ")[1]}.</strong> {r.hit > 0 ? `Las fuentes anteriores no existen, así que la sonda las atraviesa. ` : ""}La primera fuente que existe gana; las de abajo ni se consultan.</>
            ) : (
              <><strong>Sin destino.</strong> OpenClaw devuelve <code>Unable to resolve session target</code>: no hay fallback silencioso a una sesión nueva.</>
            )}
          </p>
          <Readout items={SOURCES.map((s, i) => ({ label: s.label, value: present[s.id] ? (i === r.hit ? "gana" : i < r.hit || r.hit < 0 ? "—" : "no se consulta") : "vacío", tone: i === r.hit ? s.color : "var(--muted)" }))} />
          <p className="text-xs text-muted">Ejemplos: {SOURCES.map((s) => s.example).join(" · ")}. El caso de la lección —un editor en el puente esperando el spawn— se evita igual: di explícitamente la sesión y dibuja la flecha antes de tocar la configuración.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.4, 2.6, 7.6], fov: 34 }} fit={1.1}>
        <ResolveBench present={present} />
      </Stage>
    </Figure>
  );
}
