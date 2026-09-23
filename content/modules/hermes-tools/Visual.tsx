"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState, type RefObject } from "react";
import { Group, MathUtils, type MeshStandardMaterial } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Node3D, PointerTilt, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "reg" | "disc" | "sets" | "path" | "term";

const COPY = {
  en: {
    label: "Hermes: toolsets and registry",
    hint: "step the diagram",
    astDiscover: "AST discover",
    dispatchPath: "dispatch path",
    backends7: "7 backends",
    corePath: "core path",
    costVolatile: "cost / volatile",
    extension: "extension",
  },
  es: {
    label: "Hermes: toolsets y registro",
    hint: "recorre el diagrama",
    astDiscover: "descubrimiento por AST",
    dispatchPath: "ruta de dispatch",
    backends7: "7 backends",
    corePath: "ruta núcleo",
    costVolatile: "coste / volátil",
    extension: "extensión",
  },
};
type Copy = typeof COPY.en;

function LegacyVisual() {
  const t = useCopy(COPY);
  const [step, setStep] = useState<Step>("reg");

  const options = [
    { value: "reg" as const, label: "register()", tone: "var(--teal)" },
    { value: "disc" as const, label: t.astDiscover, tone: "var(--teal)" },
    { value: "sets" as const, label: "toolsets.py", tone: "var(--amber)" },
    { value: "path" as const, label: t.dispatchPath, tone: "var(--violet)" },
    { value: "term" as const, label: t.backends7, tone: "var(--amber)" },
  ];

  return (
    <Figure
      label={t.label}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.corePath },
        { color: P.amber, label: t.costVolatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel={t.hint}
          value={step}
          onChange={setStep}
          options={options}
        />
      }
    >
      <Stage className="h-full w-full" maxDpr={1.75} camera={{ position: [0, 0.35, 7.4], fov: 40 }}>
        <Turntable speed={0.035} tilt={0.1}>
          <Scene active={step} t={t} />
        </Turntable>
      </Stage>
    </Figure>
  );
}

function Scene({ active, t }: { active: Step; t: Copy }) {
  return (
    <group>
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "reg" ? P.teal : P.lineStrong}
        fill={active === "reg" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.45, 0.0]} tone="teal" center>
        register()
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "disc" ? P.amber : P.lineStrong}
        fill={active === "disc" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.45, 0.0]} tone="amber" center>{t.astDiscover}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "sets" ? P.violet : P.lineStrong}
        fill={active === "sets" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.45, 0.0]} tone="violet" center>
        toolsets.py
      </Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "path" ? P.teal : P.lineStrong}
        fill={active === "path" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.45, 0.0]} tone="teal" center>{t.dispatchPath}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "term" ? P.amber : P.lineStrong}
        fill={active === "term" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.backends7}</Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Phase = "ast" | "registro" | "filtro";
type FileKind = "skip" | "noreg" | "reg" | "error";
type Toolset = "web" | "terminal" | "file" | "weather";
type Selection = "todos" | "enabled" | "disabled";
type Key = "SERP" | "WEATHER";

/* Didactic repository: the file names follow the lesson (skips, helper
   without top-level register, optional import that fails). The tool list is
   a reduced example, not an inventory of Hermes' real tools/ directory. */
const FILES: { file: string; kind: FileKind; why: string }[] = [
  { file: "__init__.py", kind: "skip", why: "excluido por nombre" },
  { file: "registry.py", kind: "skip", why: "excluido por nombre" },
  { file: "mcp_tool.py", kind: "skip", why: "MCP se descubre después" },
  { file: "helpers.py", kind: "noreg", why: "sin register() de nivel superior" },
  { file: "web_tools.py", kind: "reg", why: "register() arriba" },
  { file: "terminal_tool.py", kind: "reg", why: "register() arriba" },
  { file: "file_tools.py", kind: "reg", why: "register() arriba" },
  { file: "weather_tool.py", kind: "reg", why: "register() arriba" },
  { file: "image_tool.py", kind: "error", why: "falta fal_client: error registrado" },
];

const TOOLS: { name: string; toolset: Toolset; file: string; needs?: Key }[] = [
  { name: "web_search", toolset: "web", file: "web_tools.py", needs: "SERP" },
  { name: "terminal", toolset: "terminal", file: "terminal_tool.py" },
  { name: "read_file", toolset: "file", file: "file_tools.py" },
  { name: "write_file", toolset: "file", file: "file_tools.py" },
  { name: "weather", toolset: "weather", file: "weather_tool.py", needs: "WEATHER" },
];

const TOOLSET_COLOR: Record<Toolset, string> = {
  web: P.teal,
  terminal: P.amber,
  file: P.violet,
  weather: "#2F7FA8",
};

const SELECTIONS: Record<Selection, { label: string; code: string; test: (t: Toolset) => boolean }> = {
  todos: { label: "Todos", code: "sin listas → todos los toolsets", test: () => true },
  enabled: { label: "enabled: web, file", code: "enabled_toolsets=[\"web\", \"file\"]", test: (t) => t === "web" || t === "file" },
  disabled: { label: "disabled: terminal", code: "disabled_toolsets=[\"terminal\"]", test: (t) => t !== "terminal" },
};

const M = {
  base: "#263532",
  baseTop: "#34473F",
  steel: "#8C9895",
  steelDark: "#4E5A59",
  brass: "#B7833E",
  card: "#EFEBE1",
};

const FILE_Y = (i: number) => 1.62 - i * 0.405;
const SLOT_Y = (i: number) => 1.12 - i * 0.56;
const FILE_X = -3.75;
const RACK_X = 0;
const STACK_X = 3.55;

function fileColors(kind: FileKind) {
  if (kind === "reg") return { fill: mixHex(P.paper, P.teal, 0.2), edge: P.teal, tone: "teal" as const };
  if (kind === "error") return { fill: mixHex(P.paper, P.rose, 0.2), edge: P.rose, tone: "rose" as const };
  if (kind === "noreg") return { fill: mixHex(P.paper, P.amber, 0.12), edge: P.amber, tone: "amber" as const };
  return { fill: "#D9D6CD", edge: P.faint, tone: "muted" as const };
}

function FileCard({ index, kind, file, phase, scanRef }: { index: number; kind: FileKind; file: string; phase: Phase; scanRef: RefObject<number> }) {
  const body = useRef<MeshStandardMaterial>(null);
  const strip = useRef<MeshStandardMaterial>(null);
  const y = FILE_Y(index);
  const c = fileColors(kind);
  useFrame(() => {
    // In the AST pass a card is classified once the scanner has read it.
    const read = phase !== "ast" || scanRef.current < y - 0.05;
    body.current?.color.set(read ? c.fill : M.card);
    strip.current?.color.set(read ? c.edge : P.lineStrong);
  });
  return (
    <group position={[FILE_X, y, 0.1]}>
      <RoundedBox args={[1.62, 0.32, 0.12]} radius={0.04} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial ref={body} color={c.fill} roughness={0.6} />
      </RoundedBox>
      <mesh position={[-0.76, 0, 0.065]}>
        <boxGeometry args={[0.06, 0.22, 0.02]} />
        <meshStandardMaterial ref={strip} color={c.edge} roughness={0.4} />
      </mesh>
      <Tag position={[0.02, 0, 0.09]} tone={phase === "ast" ? "ink" : c.tone} size="xs" center>
        <span className="normal-case">{file}</span>
      </Tag>
    </group>
  );
}

function Scanner({ active, scanRef }: { active: boolean; scanRef: RefObject<number> }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const top = FILE_Y(0) + 0.3;
  const bottom = FILE_Y(FILES.length - 1) - 0.3;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (!active) {
      scanRef.current = bottom - 1;
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    const t = still ? 0.62 : (clock.elapsedTime * 0.22) % 1;
    const y = top + (bottom - top) * t;
    scanRef.current = y;
    ref.current.position.y = y;
  });
  return (
    <group ref={ref} position={[FILE_X, top, 0.1]}>
      <RoundedBox args={[1.9, 0.07, 0.42]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color={P.violet} transparent opacity={0.55} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0, 0.22]}>
        <boxGeometry args={[1.86, 0.012, 0.01]} />
        <meshBasicMaterial color={P.violet} />
      </mesh>
    </group>
  );
}

function FileTray() {
  const top = FILE_Y(0) + 0.32;
  const bottom = FILE_Y(FILES.length - 1) - 0.32;
  const h = top - bottom;
  return (
    <group>
      <RoundedBox position={[FILE_X, (top + bottom) / 2, -0.06]} args={[1.95, h, 0.12]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color="#DCD6C8" roughness={0.55} clearcoat={0.3} />
      </RoundedBox>
      {[-0.9, 0.9].map((dx) => (
        <mesh key={dx} position={[FILE_X + dx, (top + bottom) / 2, 0.02]} castShadow>
          <boxGeometry args={[0.05, h - 0.06, 0.12]} />
          <meshStandardMaterial color={M.steel} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      <Tag position={[FILE_X, top + 0.28, 0.1]} tone="violet" size="xs" center>tools/*.py</Tag>
    </group>
  );
}

function Drawer({ index, name, toolset, phase, visible, checkOk }: { index: number; name: string; toolset: Toolset; phase: Phase; visible: boolean; checkOk: boolean }) {
  const ref = useRef<Group>(null);
  const lamp = useRef<MeshStandardMaterial>(null);
  const face = useRef<MeshStandardMaterial>(null);
  const { still } = useStage();
  const y = SLOT_Y(index);
  const inRack = phase !== "ast";
  const lit = phase === "filtro" && visible;
  const dim = phase === "filtro" && !visible;
  const targetZ = !inRack ? 1.5 : lit ? 0.22 : 0;
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.z = still ? targetZ : MathUtils.damp(g.position.z, targetZ, 5, dt);
    g.visible = inRack || g.position.z < 1.45;
    const col = TOOLSET_COLOR[toolset];
    lamp.current?.color.set(lit ? "#39B37A" : phase === "filtro" && !checkOk ? P.rose : dim ? "#6B6F6D" : "#B9B5A9");
    lamp.current?.emissive.set(lit ? "#1F8A55" : "#000000");
    face.current?.color.set(dim ? "#CFCBC1" : mixHex(P.paper, col, 0.16));
  });
  return (
    <group ref={ref} position={[RACK_X, y, !inRack ? 1.5 : 0]}>
      <RoundedBox args={[2.2, 0.44, 0.86]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial ref={face as never} color={mixHex(P.paper, TOOLSET_COLOR[toolset], 0.16)} roughness={0.45} clearcoat={0.4} />
      </RoundedBox>
      <mesh position={[-0.98, 0, 0.44]}>
        <boxGeometry args={[0.1, 0.34, 0.02]} />
        <meshStandardMaterial color={TOOLSET_COLOR[toolset]} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.15, 0.44]}>
        <boxGeometry args={[0.5, 0.035, 0.03]} />
        <meshStandardMaterial color={M.steelDark} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.9, 0.02, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.05, 20]} />
        <meshStandardMaterial ref={lamp} color="#B9B5A9" roughness={0.3} emissiveIntensity={0.8} />
      </mesh>
      {inRack ? (
        <Tag position={[-0.08, 0.05, 0.47]} tone={dim ? "muted" : "ink"} size="xs" center>
          <span className="normal-case">{name}</span>
        </Tag>
      ) : null}
    </group>
  );
}

function Rack({ count }: { count: number }) {
  const top = SLOT_Y(0) + 0.42;
  const bottom = SLOT_Y(count - 1) - 0.42;
  const h = top - bottom;
  const mid = (top + bottom) / 2;
  return (
    <group position={[RACK_X, 0, 0]}>
      <RoundedBox position={[0, mid, -0.52]} args={[2.62, h, 0.1]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={M.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>
      {[-1.24, 1.24].map((x) => (
        <RoundedBox key={x} position={[x, mid, 0]} args={[0.14, h, 1.04]} radius={0.04} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={M.steel} metalness={0.55} roughness={0.34} />
        </RoundedBox>
      ))}
      {[top, bottom].map((y) => (
        <RoundedBox key={y} position={[0, y, 0]} args={[2.66, 0.12, 1.08]} radius={0.04} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={M.steelDark} metalness={0.5} roughness={0.36} />
        </RoundedBox>
      ))}
      {Array.from({ length: count }, (_, i) => (
        <group key={i}>
          {[-1.15, 1.15].map((x) => (
            <mesh key={x} position={[x, SLOT_Y(i) - 0.24, 0]}>
              <boxGeometry args={[0.06, 0.03, 0.96]} />
              <meshStandardMaterial color={M.brass} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {[-1.24, 1.24].map((x) => (
            <mesh key={"r" + x} position={[x, SLOT_Y(i), 0.53]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
              <meshStandardMaterial color={M.brass} metalness={0.75} roughness={0.28} />
            </mesh>
          ))}
        </group>
      ))}
      <Tag position={[0, top + 0.3, 0.3]} tone="ink" size="xs" center>registro</Tag>
    </group>
  );
}

function SchemaStack({ count, active }: { count: number; active: boolean }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  const sheets = TOOLS.length;
  useFrame((_, dt) => {
    ref.current?.children.forEach((child, k) => {
      const on = active && k < count;
      const target = on ? 1 : 0.001;
      const s = still ? target : MathUtils.damp(child.scale.x, target, 6, dt);
      child.scale.set(s, s, s);
      child.visible = s > 0.01;
    });
  });
  return (
    <group position={[STACK_X, -1.25, 0]}>
      <RoundedBox args={[1.7, 0.14, 1.2]} radius={0.05} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={M.steelDark} metalness={0.45} roughness={0.38} />
      </RoundedBox>
      <group ref={ref}>
        {Array.from({ length: sheets }, (_, k) => (
          <RoundedBox key={k} position={[0, 0.13 + k * 0.1, 0]} args={[1.46, 0.07, 1.0]} radius={0.025} smoothness={2} castShadow receiveShadow>
            <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.12 + k * 0.04)} roughness={0.5} clearcoat={0.35} />
          </RoundedBox>
        ))}
      </group>
      <Tag position={[0, 0.95, 0.2]} tone="teal" size="xs" center>{active ? count + " schemas" : "sin filtrar"}</Tag>
      <Tag position={[0, -0.36, 0.62]} tone="muted" size="xs" center>lo que ve el modelo</Tag>
    </group>
  );
}

function RegistryScene({ phase, visible, checkOk }: { phase: Phase; visible: boolean[]; checkOk: boolean[] }) {
  const scanRef = useRef(-10);
  const visibleCount = visible.filter(Boolean).length;
  const stackTop: V3 = [STACK_X, -0.6, 0.3];
  return (
    <PointerTilt amount={0.05}>
      <group>
        <ShadowBlob position={[0, -2.28, 0.1]} scale={8.6} opacity={0.1} />
        <RoundedBox position={[0, -2.12, 0]} args={[10.4, 0.3, 2.4]} radius={0.14} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={M.base} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <RoundedBox position={[0, -1.94, 0.02]} args={[10.1, 0.08, 2.1]} radius={0.04} smoothness={2} receiveShadow>
          <meshStandardMaterial color={M.baseTop} roughness={0.45} metalness={0.2} />
        </RoundedBox>
        {/* posts that hold the file board and the stack off the plinth */}
        <mesh position={[FILE_X, -1.85, -0.06]}>
          <boxGeometry args={[0.5, 0.2, 0.3]} />
          <meshStandardMaterial color={M.steelDark} metalness={0.5} roughness={0.4} />
        </mesh>
        <FileTray />
        <Scanner active={phase === "ast"} scanRef={scanRef} />
        {FILES.map((f, i) => (
          <FileCard key={f.file} index={i} kind={f.kind} file={f.file} phase={phase} scanRef={scanRef} />
        ))}
        <Rack count={TOOLS.length} />
        {TOOLS.map((tool, i) => (
          <Drawer key={tool.name} index={i} name={tool.name} toolset={tool.toolset} phase={phase} visible={visible[i]} checkOk={checkOk[i]} />
        ))}
        {phase !== "ast" &&
          TOOLS.map((tool, i) => {
            const fi = FILES.findIndex((f) => f.file === tool.file);
            const from: V3 = [FILE_X + 0.82, FILE_Y(fi), 0.16];
            const to: V3 = [RACK_X - 1.3, SLOT_Y(i), 0.3];
            const mid: V3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0.45];
            return phase === "registro" ? (
              <Flow key={tool.name} points={[from, mid, to]} color={TOOLSET_COLOR[tool.toolset]} count={2} size={0.04} speed={0.32} offset={i * 0.17} lineOpacity={0.55} />
            ) : (
              <Wire key={tool.name} points={[from, mid, to]} color={TOOLSET_COLOR[tool.toolset]} opacity={0.35} width={1} />
            );
          })}
        {phase === "filtro" &&
          TOOLS.map((tool, i) =>
            visible[i] ? (
              <Flow key={"out-" + tool.name} points={[[RACK_X + 1.3, SLOT_Y(i), 0.55], [2.2, (SLOT_Y(i) + stackTop[1]) / 2, 0.5], stackTop]} color={P.teal} count={2} size={0.04} speed={0.3} offset={i * 0.21} lineOpacity={0.5} />
            ) : null,
          )}
        <SchemaStack count={visibleCount} active={phase === "filtro"} />
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [phase, setPhase] = useState<Phase>("filtro");
  const [selection, setSelection] = useState<Selection>("todos");
  const [keys, setKeys] = useState<Record<Key, boolean>>({ SERP: true, WEATHER: false });

  const model = useMemo(() => {
    const imported = FILES.filter((f) => f.kind === "reg").length;
    const inSet = TOOLS.map((t) => SELECTIONS[selection].test(t.toolset));
    const checkOk = TOOLS.map((t) => (t.needs ? keys[t.needs] : true));
    const visible = TOOLS.map((_, i) => inSet[i] && checkOk[i]);
    return {
      scanned: FILES.length,
      skipped: FILES.filter((f) => f.kind === "skip").length,
      imported,
      failed: FILES.filter((f) => f.kind === "error").length,
      registered: TOOLS.length,
      inSet,
      checkOk,
      visible,
      visibleCount: visible.filter(Boolean).length,
    };
  }, [selection, keys]);

  const hiddenByCheck = TOOLS.filter((_, i) => model.inSet[i] && !model.checkOk[i]).map((t) => t.name);
  const toggle = (k: Key) => setKeys((prev) => ({ ...prev, [k]: !prev[k] }));

  const note = (
    <div className="space-y-3">
      {phase === "ast" ? (
        <p>
          <strong>Primero se lee, luego se importa.</strong> <code>discover_builtin_tools()</code> recorre cada fichero de <code>tools/</code> con un parseo AST y solo importa los que contienen un <code>registry.register()</code> de nivel superior. De {model.scanned} ficheros, {model.skipped} se saltan por nombre, <code>helpers.py</code> no se importa y <code>image_tool.py</code> falla al importar (falta <code>fal_client</code>): el error se registra y los demás cargan igual.
        </p>
      ) : phase === "registro" ? (
        <p>
          <strong>El import ejecuta <code>register()</code>.</strong> Los {model.imported} ficheros importados meten {model.registered} entradas en el registro, cada una con <code>name</code>, <code>toolset</code>, <code>schema</code>, <code>handler</code> y un <code>check_fn</code> opcional. Después llegan las tools MCP y las de plugins; un nombre que sombree otra tool se rechaza salvo <code>override=True</code>.
        </p>
      ) : (
        <p>
          <strong>El modelo solo ve lo que sobrevive a dos filtros.</strong> La selección de toolsets deja {model.inSet.filter(Boolean).length} de {model.registered} tools; después <code>get_definitions()</code> ejecuta cada <code>check_fn</code> y quedan <strong>{model.visibleCount} schemas</strong>. {hiddenByCheck.length ? hiddenByCheck.length === 1 ? `${hiddenByCheck[0]} no falla con un 401 en runtime: su check_fn devuelve False y sencillamente no existe para el modelo.` : `${hiddenByCheck.join(" y ")} no fallan con un 401 en runtime: sus check_fn devuelven False y sencillamente no existen para el modelo.` : "Todos los check_fn de la selección devuelven True."}
        </p>
      )}
      <Readout
        items={[
          { label: "ficheros leídos", value: String(model.scanned), tone: "var(--violet)" },
          { label: "importados", value: String(model.imported), tone: "var(--teal)" },
          { label: "registradas", value: String(model.registered), tone: "var(--ink)" },
          { label: "schemas visibles", value: phase === "filtro" ? String(model.visibleCount) : "—", tone: "var(--teal)" },
        ]}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] border-collapse text-left text-xs">
          <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted">
            <tr>
              <th className="border-b border-line px-2 py-1">tool</th>
              <th className="border-b border-line px-2 py-1">toolset</th>
              <th className="border-b border-line px-2 py-1">en la selección</th>
              <th className="border-b border-line px-2 py-1">check_fn</th>
              <th className="border-b border-line px-2 py-1">el modelo la ve</th>
            </tr>
          </thead>
          <tbody>
            {TOOLS.map((t, i) => (
              <tr key={t.name} className={model.visible[i] ? "" : "text-muted"}>
                <td className="border-b border-line/60 px-2 py-1 font-mono">{t.name}</td>
                <td className="border-b border-line/60 px-2 py-1 font-mono">{t.toolset}</td>
                <td className="border-b border-line/60 px-2 py-1">{model.inSet[i] ? "sí" : "no"}</td>
                <td className="border-b border-line/60 px-2 py-1">{t.needs ? (model.checkOk[i] ? `True (${t.needs}_API_KEY)` : `False (sin ${t.needs}_API_KEY)`) : "no tiene: True"}</td>
                <td className="border-b border-line/60 px-2 py-1">{model.visible[i] ? "sí" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Selección aplicada: <code>{SELECTIONS[selection].code}</code>. Repositorio didáctico reducido: los nombres de fichero siguen las reglas de la lección, pero no son el inventario real de <code>tools/</code> en Hermes.
      </p>
    </div>
  );

  return (
    <Figure
      label="Registro de Hermes · del fichero al schema"
      hint="AST → register() → toolsets → check_fn"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.violet, label: "parseo AST" },
        { color: P.teal, label: "importado / visible" },
        { color: P.rose, label: "import fallido" },
        { color: "#39B37A", label: "check_fn True" },
        { color: P.rose, label: "check_fn False" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            value={phase}
            onChange={setPhase}
            ariaLabel="Fase del registro"
            options={[
              { value: "ast", label: "1 · AST", tone: P.violet },
              { value: "registro", label: "2 · register()", tone: P.inkSoft },
              { value: "filtro", label: "3 · filtro", tone: P.teal },
            ]}
          />
          <Switcher
            value={selection}
            onChange={(v) => {
              setSelection(v);
              setPhase("filtro");
            }}
            ariaLabel="Selección de toolsets"
            options={(Object.keys(SELECTIONS) as Selection[]).map((k) => ({ value: k, label: SELECTIONS[k].label, tone: P.amber }))}
          />
          {(["SERP", "WEATHER"] as Key[]).map((k) => (
            <button
              key={k}
              type="button"
              className="chip"
              aria-pressed={keys[k]}
              style={keys[k] ? { background: "var(--teal-wash)", borderColor: "var(--teal)" } : undefined}
              onClick={() => {
                toggle(k);
                setPhase("filtro");
              }}
            >
              {k}_API_KEY: {keys[k] ? "sí" : "no"}
            </button>
          ))}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.2, 2.2, 11.5], fov: 35 }} fit={1.08}>
        <RegistryScene phase={phase} visible={model.visible} checkOk={model.checkOk} />
      </Stage>
    </Figure>
  );
}
