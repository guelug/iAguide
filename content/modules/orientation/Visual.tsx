"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, type ReactNode } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Lattice, type Cell, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
import { MODULES, type ModuleMeta } from "@/content/modules";
import { TRACKS as TRACK_DATA, type TrackId } from "@/content/tracks";

type Mode = "foundations" | "harness" | "training" | "metal";
type Tone = "teal" | "violet" | "amber" | "rose";

const COPY = {
  en: {
    title: "four tracks, one route",
    hint: "choose a track to inspect its terrain",
    foundations: "foundations",
    harness: "harness",
    training: "training",
    metal: "metal",
    foundationsNote: "learn the language of models",
    harnessNote: "turn a model into a working system",
    trainingNote: "change what the model has learned",
    metalNote: "make the system fit the machine",
    here: "your route starts here",
  },
  es: {
    title: "cuatro vías, una ruta",
    hint: "elige una vía para explorar su terreno",
    foundations: "fundamentos",
    harness: "arnés",
    training: "entrenamiento",
    metal: "metal",
    foundationsNote: "aprende el lenguaje de los modelos",
    harnessNote: "convierte un modelo en un sistema",
    trainingNote: "cambia lo que el modelo ha aprendido",
    metalNote: "haz que el sistema encaje en la máquina",
    here: "tu ruta empieza aquí",
  },
};

const TRACKS: { id: Mode; color: string; tone: Tone; x: number; z: number }[] = [
  { id: "foundations", color: P.teal, tone: "teal", x: -3.0, z: 0.3 },
  { id: "harness", color: P.violet, tone: "violet", x: -1.0, z: -0.18 },
  { id: "training", color: P.amber, tone: "amber", x: 1.0, z: -0.18 },
  { id: "metal", color: P.rose, tone: "rose", x: 3.0, z: 0.3 },
];

function Focus({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const scale = MathUtils.damp(ref.current.scale.x, active ? 1.22 : 1, 5, dt);
    ref.current.scale.setScalar(scale);
    ref.current.position.y = MathUtils.damp(ref.current.position.y, active ? 0.16 : -0.04, 5, dt);
  });
  return <group ref={ref}>{children}</group>;
}

function Pedestal({ color, active }: { color: string; active: boolean }) {
  return (
    <>
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.56, 0.68, 0.18, 48]} />
        <meshStandardMaterial color={active ? color : P.sunken} roughness={0.46} metalness={0.04} />
      </mesh>
      <mesh position={[0, -0.315, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.035, 48]} />
        <meshStandardMaterial color={P.surface} roughness={0.28} metalness={0.08} />
      </mesh>
      {active ? <Halo position={[0, -0.29, 0]} radius={0.62} color={color} opacity={0.58} spin={0.16} /> : null}
    </>
  );
}

function FoundationsIcon({ active }: { active: boolean }) {
  return (
    <>
      <Node3D position={[0, 0.03, 0]} color={P.teal} radius={0.21} pulse={active ? 0.3 : 0} />
      <Halo position={[0, 0.03, 0]} radius={0.38} color={P.teal} opacity={active ? 0.78 : 0.34} spin={0.22} />
      <Halo position={[0, 0.03, 0]} radius={0.47} color={P.tealDeep} opacity={active ? 0.36 : 0.16} rotation={[0, Math.PI / 2, Math.PI / 5]} spin={-0.12} />
      {[[0.41, 0.22], [-0.36, 0.29], [0.08, -0.42]].map(([x, y], i) => (
        <Node3D key={i} position={[x, y, 0.02]} color={P.tealDeep} radius={0.055} matte />
      ))}
    </>
  );
}

function HarnessIcon({ active }: { active: boolean }) {
  const satellites: [number, number, number][] = [[-0.43, 0.24, 0], [0.43, 0.24, 0], [-0.43, -0.14, 0], [0.43, -0.14, 0]];
  return (
    <>
      <RoundedBox position={[0, 0.05, 0]} args={[0.46, 0.46, 0.34]} radius={0.09} smoothness={4}>
        <meshStandardMaterial color={P.violet} roughness={0.3} metalness={0.12} />
      </RoundedBox>
      {satellites.map((point, i) => (
        <group key={i}>
          <Wire points={[[0, 0.05, 0], point]} color={P.violet} opacity={active ? 0.8 : 0.34} width={1.5} />
          <Node3D position={point} color={i % 2 ? P.teal : P.violetDeep} radius={0.07} pulse={active ? i * 0.35 + 0.2 : 0} matte />
        </group>
      ))}
    </>
  );
}

function TrainingIcon({ active }: { active: boolean }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <RoundedBox key={i} position={[0, -0.17 + i * 0.16, -i * 0.025]} args={[0.78 - i * 0.08, 0.1, 0.48]} radius={0.035} smoothness={3}>
          <meshStandardMaterial color={i === 3 ? P.amber : P.amberWash} roughness={0.4} metalness={i === 3 ? 0.08 : 0} />
        </RoundedBox>
      ))}
      <Flow points={[[0, -0.15, 0.27], [0, 0.16, 0.27], [0, 0.48, 0.08]]} color={P.amber} count={active ? 4 : 2} speed={0.28} size={0.035} lineOpacity={0.3} />
      <Node3D position={[0, 0.5, 0.06]} color={P.amberDeep} radius={0.075} pulse={active ? 0.2 : 0} />
    </>
  );
}

function MetalIcon({ active }: { active: boolean }) {
  const pins = [-0.34, -0.12, 0.12, 0.34];
  return (
    <>
      <RoundedBox position={[0, 0.05, 0]} args={[0.74, 0.54, 0.16]} radius={0.07} smoothness={4}>
        <meshStandardMaterial color={P.inkSoft} roughness={0.3} metalness={0.3} />
      </RoundedBox>
      <RoundedBox position={[0, 0.055, 0.09]} args={[0.38, 0.27, 0.045]} radius={0.04} smoothness={3}>
        <meshStandardMaterial color={P.rose} roughness={0.34} metalness={0.16} />
      </RoundedBox>
      {pins.map((x) => (
        <group key={x}>
          <Ribbon points={[[x, -0.31, 0], [x, -0.22, 0]]} color={P.rose} radius={0.018} />
          <Ribbon points={[[x, 0.32, 0], [x, 0.4, 0]]} color={P.rose} radius={0.018} />
        </group>
      ))}
      {active ? <Halo position={[0, 0.05, 0]} radius={0.5} color={P.rose} opacity={0.34} rotation={[Math.PI / 2.7, 0, 0]} spin={-0.18} /> : null}
    </>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("foundations");
  const note = t[`${mode}Note` as keyof typeof t];

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={TRACKS.map((track) => ({ color: track.color, label: t[track.id] }))}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={TRACKS.map((track) => ({ value: track.id, label: t[track.id], tone: track.color }))}
          ariaLabel={t.title}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 32 }} background={P.paper} maxDpr={2} fit={1.05}>
        <Motes count={150} radius={7} color={P.lineStrong} size={0.025} opacity={0.24} />
        <PointerTilt amount={0.09}>
          <group rotation={[-0.1, 0, 0]} position={[0, 0.18, 0]}>
            <Ribbon
              points={TRACKS.map((track, i) => [track.x, -0.45, track.z + (i % 2 ? -0.08 : 0.08)])}
              color={P.lineStrong}
              radius={0.025}
              opacity={0.72}
            />
            <Flow
              points={TRACKS.map((track, i) => [track.x, -0.43, track.z + (i % 2 ? -0.08 : 0.08)])}
              color={TRACKS.find((track) => track.id === mode)?.color ?? P.teal}
              count={7}
              speed={0.12}
              size={0.042}
              lineOpacity={0}
            />
            {TRACKS.map((track) => {
              const active = track.id === mode;
              return (
                <group
                  key={track.id}
                  position={[track.x, 0, track.z]}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMode(track.id);
                  }}
                  onPointerOver={() => {
                    document.body.style.cursor = "pointer";
                  }}
                  onPointerOut={() => {
                    document.body.style.cursor = "auto";
                  }}
                >
                  <Pedestal color={track.color} active={active} />
                  <ShadowBlob position={[0, -0.53, 0]} scale={1.5} opacity={active ? 0.13 : 0.08} />
                  <Focus active={active}>
                    {track.id === "foundations" ? <FoundationsIcon active={active} /> : null}
                    {track.id === "harness" ? <HarnessIcon active={active} /> : null}
                    {track.id === "training" ? <TrainingIcon active={active} /> : null}
                    {track.id === "metal" ? <MetalIcon active={active} /> : null}
                  </Focus>
                  <Tag position={[0, 0.82, 0.16]} tone={track.tone} size="xs" center>
                    {t[track.id]}
                  </Tag>
                </group>
              );
            })}
            <ShadowBlob position={[0, -0.56, 0]} scale={4.6} opacity={0.06} />
          </group>
          <Slab position={[0, -1.17, 0]} size={[5.4, 0.38, 0.04]} color={TRACKS.find((track) => track.id === mode)?.color ?? P.teal} fill={0.08} rim={0.34} />
          <Tag position={[0, -1.16, 0.08]} tone={TRACKS.find((track) => track.id === mode)?.tone ?? "teal"} size="xs" center>
            {mode === "foundations" ? `${t.here} · ${note}` : note}
          </Tag>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Mesa del mapa. Cada loseta es un módulo real del curso (MODULES), en su
 * orden y su vía; la altura sale de durationMin. Las particularidades de
 * frameworks (Hermes, OpenClaw, smolagents, LlamaIndex, LangGraph) se
 * colocan en una bandeja hundida DENTRO del arnés: no son una quinta vía.
 */

const FRAMEWORK_PREFIX = ["hermes-", "openclaw-", "smolagents", "llamaindex", "langgraph"];
const isFramework = (m: ModuleMeta) => FRAMEWORK_PREFIX.some((p) => m.slug.startsWith(p));

type Group5 = "foundations" | "harness" | "frameworks" | "training" | "metal";
const GROUP_X: Record<Group5, number> = { foundations: -3.7, harness: -2.05, frameworks: -0.35, training: 1.55, metal: 3.25 };
const GROUP_COLS: Record<Group5, number> = { foundations: 3, harness: 3, frameworks: 5, training: 3, metal: 3 };
const PITCH = 0.34;
const Z_FRONT = 1.5;

function mapModel() {
  const byGroup: Record<Group5, ModuleMeta[]> = { foundations: [], harness: [], frameworks: [], training: [], metal: [] };
  for (const m of MODULES) {
    if (m.slug === "orientation") continue;
    const g: Group5 = m.track === "harness" && isFramework(m) ? "frameworks" : m.track;
    byGroup[g].push(m);
  }
  const tiles: { m: ModuleMeta; group: Group5; position: V3; h: number }[] = [];
  (Object.keys(byGroup) as Group5[]).forEach((g) => {
    const cols = GROUP_COLS[g];
    byGroup[g].forEach((m, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const h = 0.05 + (m.durationMin / 45) * 0.32;
      tiles.push({ m, group: g, h, position: [GROUP_X[g] + (c - (cols - 1) / 2) * PITCH, -1.0 + h / 2, Z_FRONT - r * PITCH] });
    });
  });
  const stats = (id: TrackId) => {
    const mods = MODULES.filter((m) => m.track === id && m.slug !== "orientation");
    return { count: mods.length, minutes: mods.reduce((n, m) => n + m.durationMin, 0), frameworks: mods.filter(isFramework).length, first: mods.slice(0, 3) };
  };
  return { byGroup, tiles, stats };
}

const MAP = mapModel();
const trackOf = (g: Group5): TrackId => (g === "frameworks" ? "harness" : g);
const colorOf = (id: TrackId) => TRACK_DATA.find((t) => t.id === id)?.color ?? P.teal;

function OMat({ color, rough = 0.45, coat = 0.4, metal = 0 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} />;
}

function stripSpan(g: Group5) {
  const cols = GROUP_COLS[g];
  const rows = Math.ceil(MAP.byGroup[g].length / cols);
  return { w: cols * PITCH + 0.12, d: rows * PITCH + 0.12, zc: Z_FRONT - ((rows - 1) * PITCH) / 2, rows };
}

function MapTable({ active }: { active: TrackId }) {
  const cells = useMemo<Cell[]>(
    () =>
      MAP.tiles.map((t) => {
        const id = trackOf(t.group);
        const on = id === active;
        const base = colorOf(id);
        const tint = t.group === "frameworks" ? mixHex(base, P.inkSoft, 0.25) : base;
        return { position: [t.position[0], on ? t.position[1] + 0.05 : t.position[1], t.position[2]] as V3, scale: [0.27, t.h, 0.27] as V3, color: mixHex(P.paper, tint, on ? 0.8 : 0.22) };
      }),
    [active],
  );
  const hs = stripSpan("harness");
  const fs = stripSpan("frameworks");
  const harnessX0 = GROUP_X.harness - hs.w / 2 - 0.08;
  const harnessX1 = GROUP_X.frameworks + fs.w / 2 + 0.08;
  const harnessD = Math.max(hs.d, fs.d) + 0.16;
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -1.46, 0.3]} scale={10} opacity={0.12} />
        <RoundedBox args={[9.4, 0.3, 5.6]} position={[-0.2, -1.3, 0.4]} radius={0.16} smoothness={4} castShadow receiveShadow>
          <OMat color="#40362d" rough={0.62} coat={0.2} />
        </RoundedBox>
        <RoundedBox args={[9.1, 0.08, 5.3]} position={[-0.2, -1.12, 0.4]} radius={0.04} smoothness={2} receiveShadow>
          <OMat color="#6b513a" rough={0.5} coat={0.25} />
        </RoundedBox>
        {(["foundations", "training", "metal"] as Group5[]).map((g) => {
          const s = stripSpan(g);
          const id = trackOf(g);
          return (
            <RoundedBox key={g} args={[s.w, 0.06, s.d]} position={[GROUP_X[g], -1.04, s.zc]} radius={0.03} smoothness={2} receiveShadow castShadow>
              <OMat color={mixHex(P.paper, colorOf(id), id === active ? 0.3 : 0.08)} rough={0.5} />
            </RoundedBox>
          );
        })}
        {/* harness plate, with the frameworks bay sunk into it */}
        <RoundedBox args={[harnessX1 - harnessX0, 0.06, harnessD]} position={[(harnessX0 + harnessX1) / 2, -1.04, Z_FRONT - (Math.max(hs.rows, fs.rows) - 1) * PITCH / 2]} radius={0.03} smoothness={2} receiveShadow castShadow>
          <OMat color={mixHex(P.paper, colorOf("harness"), active === "harness" ? 0.3 : 0.08)} rough={0.5} />
        </RoundedBox>
        <RoundedBox args={[fs.w, 0.03, fs.d]} position={[GROUP_X.frameworks, -1.0, fs.zc]} radius={0.02} smoothness={2} receiveShadow>
          <OMat color={mixHex(colorOf("harness"), P.inkSoft, active === "harness" ? 0.35 : 0.6)} rough={0.55} />
        </RoundedBox>
        <Lattice cells={cells} size={1} />
        {/* porch: where every route starts */}
        <group position={[-0.2, -1.0, 2.55]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.42, 0.5, 0.14, 40]} />
            <OMat color="#b68442" metal={0.55} rough={0.3} coat={0.2} />
          </mesh>
          <RoundedBox args={[0.34, 0.42, 0.34]} position={[0, 0.28, 0]} radius={0.04} smoothness={2} castShadow>
            <OMat color={colorOf("foundations")} rough={0.4} coat={0.5} />
          </RoundedBox>
          <Tag position={[0, 0.85, 0]} tone="ink" center>porche</Tag>
        </group>
        {(["foundations", "harness", "training", "metal"] as TrackId[]).map((id) => {
          const x = id === "harness" ? GROUP_X.harness : GROUP_X[id];
          const on = id === active;
          return (
            <group key={id}>
              <Ribbon points={[[-0.2, -0.93, 2.4], [(x - 0.2) / 2, -0.9, 2.2], [x, -0.95, Z_FRONT + 0.3]]} color={on ? colorOf(id) : mixHex(P.paper, colorOf(id), 0.4)} radius={on ? 0.03 : 0.018} />
              {on ? <Flow points={[[-0.2, -0.86, 2.4], [(x - 0.2) / 2, -0.83, 2.2], [x, -0.88, Z_FRONT + 0.3]]} color={colorOf(id)} count={2} speed={0.35} size={0.04} lineOpacity={0} /> : null}
            </group>
          );
        })}
        {(["foundations", "harness", "frameworks", "training", "metal"] as Group5[]).map((g) => {
          const s = stripSpan(g);
          const id = trackOf(g);
          const label = g === "frameworks" ? "frameworks" : TRACK_DATA.find((t) => t.id === id)?.name.es ?? g;
          const tone = id === "foundations" ? "teal" : id === "harness" ? "amber" : id === "training" ? "violet" : "rose";
          return (
            <Tag key={g} position={[GROUP_X[g], -0.62, Z_FRONT - (s.rows - 1) * PITCH - 0.45]} tone={id === active ? tone : "muted"} size={g === "frameworks" ? "xs" : "sm"} center>
              {label}
            </Tag>
          );
        })}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [active, setActive] = useState<TrackId>("foundations");
  const st = MAP.stats(active);
  const track = TRACK_DATA.find((t) => t.id === active)!;
  const all = MODULES.length;
  return (
    <Figure
      label="Mesa del mapa · cuatro vías y un porche"
      hint="cada loseta es un módulo; la altura, su duración"
      legend={TRACK_DATA.map((t) => ({ color: t.color, label: t.name.es }))}
      note={
        <div className="space-y-2">
          <p><strong>{track.numeral} · {track.name.es}.</strong> {track.blurb.es}{active === "harness" ? ` De sus ${st.count} módulos, ${st.frameworks} son particularidades de frameworks y están en la bandeja hundida: viven dentro del arnés, no forman una quinta vía.` : ""}</p>
          <Readout items={[
            { label: "módulos", value: String(st.count), tone: track.color },
            { label: "minutos", value: `${st.minutes} (≈ ${(st.minutes / 60).toLocaleString("es-ES", { maximumFractionDigits: 1 })} h)`, tone: track.color },
            { label: "empieza por", value: st.first.map((m) => m.title.es).join(" · "), tone: "var(--ink)" },
          ]} />
          <p className="text-xs text-muted">Datos leídos del registro del curso ({all} módulos contando este porche). La bandeja de frameworks agrupa los módulos cuyo identificador empieza por hermes-, openclaw-, smolagents, llamaindex o langgraph.</p>
        </div>
      }
      controls={
        <Switcher value={active} onChange={setActive} options={TRACK_DATA.map((t) => ({ value: t.id, label: t.name.es, tone: t.color }))} ariaLabel="Vía del curso" />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 6.2, 8.4], fov: 34 }} fit={1.04}>
        <MapTable active={active} />
      </Stage>
    </Figure>
  );
}
