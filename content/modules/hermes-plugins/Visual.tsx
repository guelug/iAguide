"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { MathUtils, type Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Flow, Halo, Node3D, PointerTilt, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "yaml" | "ctx" | "disc" | "cap" | "doc";

const COPY = {
  en: {
    label: "Hermes: plugin context API",
    hint: "step the diagram",
    sources3: "3 sources",
    capabilities: "capabilities",
    corePath: "core path",
    costVolatile: "cost / volatile",
    extension: "extension",
  },
  es: {
    label: "Hermes: API de contexto de plugins",
    hint: "recorre el diagrama",
    sources3: "3 fuentes",
    capabilities: "capacidades",
    corePath: "ruta núcleo",
    costVolatile: "coste / volátil",
    extension: "extensión",
  },
};
type Copy = typeof COPY.en;

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

function LegacyVisual() {
  const t = useCopy(COPY);
  const [step, setStep] = useState<Step>("yaml");

  const options = [
    { value: "yaml" as const, label: "plugin.yaml", tone: "var(--teal)" },
    { value: "ctx" as const, label: "register(ctx)", tone: "var(--teal)" },
    { value: "disc" as const, label: t.sources3, tone: "var(--amber)" },
    { value: "cap" as const, label: t.capabilities, tone: "var(--violet)" },
    { value: "doc" as const, label: "doctor", tone: "var(--amber)" },
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
        color={active === "yaml" ? P.teal : P.lineStrong}
        fill={active === "yaml" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.45, 0.0]} tone="teal" center>
        plugin.yaml
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "ctx" ? P.amber : P.lineStrong}
        fill={active === "ctx" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.45, 0.0]} tone="amber" center>
        register(ctx)
      </Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "disc" ? P.violet : P.lineStrong}
        fill={active === "disc" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.45, 0.0]} tone="violet" center>{t.sources3}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "cap" ? P.teal : P.lineStrong}
        fill={active === "cap" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.45, 0.0]} tone="teal" center>{t.capabilities}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "doc" ? P.amber : P.lineStrong}
        fill={active === "doc" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>
        doctor
      </Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Banco del cargador. Cinco plugins didácticos recorren el mismo camino
 * que usa Hermes al arrancar (y que repite `hermes plugins doctor`):
 * descubrimiento por tres fuentes → plugin.yaml → register(ctx) → registro.
 * El destino de cada cartucho lo calcula loadPlugin(); nada está puesto a mano.
 */

type Source = "usuario" | "proyecto" | "pip";
type RegKind = "tool" | "hook" | "cli";
type Registration = { kind: RegKind; name: string; override?: boolean };
type PluginSpec = {
  id: string;
  source: Source;
  path: string;
  deep?: boolean;
  raises?: boolean;
  capabilities?: string[];
  registers: Registration[];
};
type Outcome = "cargado" | "ignorado" | "deshabilitado";
type LoadResult = { outcome: Outcome; stopAt: "discover" | "manifest" | "register" | "registry"; log: string[]; regs: Registration[] };

const PLUGINS: PluginSpec[] = [
  { id: "bitacora", source: "usuario", path: "~/.hermes/plugins/bitacora/", registers: [{ kind: "hook", name: "post_tool_call" }] },
  { id: "jira-sync", source: "pip", path: "entry point hermes_agent.plugins", registers: [{ kind: "tool", name: "jira_issue" }, { kind: "cli", name: "hermes jira" }] },
  { id: "atajos", source: "proyecto", path: ".hermes/plugins/extra/sub/atajos/", deep: true, registers: [{ kind: "tool", name: "atajo" }] },
  { id: "roto", source: "proyecto", path: ".hermes/plugins/roto/", raises: true, registers: [{ kind: "tool", name: "roto_tool" }] },
  { id: "shell", source: "usuario", path: "~/.hermes/plugins/shell/", capabilities: ["tools.override"], registers: [{ kind: "tool", name: "write_file", override: true }] },
];

const BUILTIN_TOOLS = ["write_file", "terminal"];

function loadPlugin(p: PluginSpec, consent: boolean): LoadResult {
  const log: string[] = [`descubierto en ${p.source}: ${p.path}`];
  if (p.deep) {
    log.push("layout más profundo que un nivel de categoría → se salta");
    return { outcome: "ignorado", stopAt: "discover", log, regs: [] };
  }
  log.push(`plugin.yaml leído: provides ${p.registers.map((r) => r.name).join(", ")}`);
  log.push("import namespaced correcto; se llama register(ctx) una vez");
  if (p.raises) {
    log.push("register(ctx) lanza una excepción → plugin deshabilitado; Hermes continúa");
    return { outcome: "deshabilitado", stopAt: "register", log, regs: [] };
  }
  for (const r of p.registers) {
    const shadows = r.kind === "tool" && BUILTIN_TOOLS.includes(r.name);
    if (shadows && !r.override) {
      log.push(`register_tool("${r.name}") sombrearía una builtin sin override=True → rechazado`);
      return { outcome: "deshabilitado", stopAt: "register", log, regs: [] };
    }
    if (shadows && r.override && !(consent && p.capabilities?.includes("tools.override"))) {
      log.push(`register_tool("${r.name}", override=True) sin consentimiento → PluginToolOverrideError`);
      log.push("el loader captura el error, deshabilita el plugin y Hermes continúa (fail closed)");
      return { outcome: "deshabilitado", stopAt: "register", log, regs: [] };
    }
  }
  for (const r of p.registers) {
    const fn = r.kind === "tool" ? "register_tool" : r.kind === "hook" ? "register_hook" : "register_cli_command";
    log.push(`ctx.${fn}("${r.name}"${r.override ? ", override=True" : ""}) ✓`);
  }
  return { outcome: "cargado", stopAt: "registry", log, regs: p.registers };
}

const SOURCE_Z: Record<Source, number> = { usuario: -1.05, proyecto: 0, pip: 1.05 };
const SOURCE_COLOR: Record<Source, string> = { usuario: P.teal, proyecto: P.violet, pip: P.amber };
const KIND_COLOR: Record<RegKind, string> = { tool: P.teal, hook: P.violet, cli: P.amber };
const KIND_ROW: Record<RegKind, number> = { tool: 0.95, hook: 0.2, cli: -0.55 };

const RAIL_Y = -0.78;
const X = { tray: -4.3, discover: -3.0, manifest: -1.35, register: 0.35, board: 3.2 };
const BIN = { ignorado: [-3.0, -0.98, 1.55] as V3, deshabilitado: [0.35, -0.98, 1.55] as V3 };

function Mat({ color, rough = 0.45, coat = 0.4, metal = 0 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} />;
}

/** Where each registration sits on the board: builtins first, then plugins in discovery order. */
function boardLayout(results: { plugin: PluginSpec; result: LoadResult }[]) {
  const slots: { kind: RegKind; name: string; owner: string; color: string; position: V3; override?: boolean }[] = [];
  const count: Record<RegKind, number> = { tool: 0, hook: 0, cli: 0 };
  const place = (kind: RegKind) => {
    const i = count[kind]++;
    return [X.board - 0.95 + i * 0.63, KIND_ROW[kind], 0.16] as V3;
  };
  for (const name of BUILTIN_TOOLS) slots.push({ kind: "tool", name, owner: "builtin", color: P.inkSoft, position: place("tool") });
  for (const { plugin, result } of results) {
    for (const r of result.regs) {
      if (r.override) {
        const target = slots.find((s) => s.kind === "tool" && s.name === r.name);
        if (target) {
          target.owner = plugin.id;
          target.color = P.rose;
          target.override = true;
          continue;
        }
      }
      slots.push({ kind: r.kind, name: r.name, owner: plugin.id, color: KIND_COLOR[r.kind], position: place(r.kind) });
    }
  }
  return slots;
}

function Cartridge({ color, dim = false }: { color: string; dim?: boolean }) {
  return (
    <group>
      <RoundedBox args={[0.5, 0.3, 0.42]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <Mat color={dim ? mixHex(P.paper, color, 0.3) : mixHex(P.paper, color, 0.75)} rough={0.4} coat={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.03, 0.212]}>
        <planeGeometry args={[0.36, 0.14]} />
        <meshStandardMaterial color={P.paper} roughness={0.7} />
      </mesh>
      {[-0.15, -0.05, 0.05, 0.15].map((x) => (
        <mesh key={x} position={[x, -0.16, 0]}>
          <boxGeometry args={[0.05, 0.03, 0.3]} />
          <Mat color="#b68442" metal={0.7} rough={0.3} coat={0} />
        </mesh>
      ))}
    </group>
  );
}

function pathFor(p: PluginSpec, result: LoadResult, target: V3): V3[] {
  const z0 = SOURCE_Z[p.source];
  const pts: V3[] = [[X.tray, -0.8, z0], [X.discover - 0.4, RAIL_Y + 0.2, z0 * 0.4], [X.discover, RAIL_Y + 0.2, 0]];
  if (result.stopAt === "discover") return [...pts, [X.discover, -0.2, 0.8], BIN.ignorado];
  pts.push([X.manifest, RAIL_Y + 0.2, 0], [X.register, RAIL_Y + 0.2, 0]);
  if (result.stopAt === "register") return [...pts, [X.register, -0.2, 0.8], BIN.deshabilitado];
  return [...pts, [X.register + 1.4, RAIL_Y + 0.35, 0], [target[0], target[1], target[2] + 0.45], target];
}

function Mover({ path, color }: { path: V3[]; color: string }) {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  const { still } = useStage();
  const lengths = useMemo(() => {
    const segs = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1], p[2] - path[i][2]));
    const total = segs.reduce((a, b) => a + b, 0);
    return { segs, total };
  }, [path]);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (still) {
      g.position.set(...path[path.length - 1]);
      return;
    }
    // 1.2 units/s along the path, then rest 1.4 s at the destination.
    const travel = lengths.total / 1.2;
    t.current = (t.current + dt) % (travel + 1.4);
    let d = Math.min(1, t.current / travel) * lengths.total;
    let i = 0;
    while (i < lengths.segs.length - 1 && d > lengths.segs[i]) {
      d -= lengths.segs[i];
      i += 1;
    }
    const a = path[i];
    const b = path[i + 1];
    const k = lengths.segs[i] ? MathUtils.clamp(d / lengths.segs[i], 0, 1) : 1;
    g.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
  });
  return (
    <group ref={ref} position={path[0]}>
      <group scale={1.12}>
        <Cartridge color={color} />
      </group>
      <Halo position={[0, -0.2, 0]} radius={0.42} color={color} opacity={0.7} />
    </group>
  );
}

function Gate({ x, label, tone, color, lit }: { x: number; label: string; tone: "teal" | "violet" | "amber" | "rose" | "ink"; color: string; lit: boolean }) {
  return (
    <group position={[x, 0, 0]}>
      {[-0.6, 0.6].map((z) => (
        <mesh key={z} position={[0, -0.45, z]} castShadow>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <Mat color="#9aa3ab" metal={0.55} rough={0.35} coat={0} />
        </mesh>
      ))}
      <RoundedBox args={[0.3, 0.22, 1.5]} position={[0, 0.2, 0]} radius={0.05} smoothness={3} castShadow>
        <Mat color={lit ? color : mixHex(P.paper, color, 0.35)} rough={0.4} coat={0.5} />
      </RoundedBox>
      <Tag position={[0, 0.6, 0]} tone={tone} center>
        <span className="normal-case">{label}</span>
      </Tag>
    </group>
  );
}

function Bin({ position, label, count }: { position: V3; label: string; count: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.44, 0.32, 36, 1, true]} />
        <meshPhysicalMaterial color={mixHex(P.paper, P.rose, 0.35)} roughness={0.45} clearcoat={0.4} side={2} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.44, 36]} />
        <meshStandardMaterial color={mixHex(P.paper, P.rose, 0.5)} />
      </mesh>
      <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.52, 0.03, 10, 48]} />
        <Mat color={P.rose} rough={0.35} />
      </mesh>
      <Tag position={[0, -0.05, 0.75]} tone="rose" size="xs" center>{`${label} · ${count}`}</Tag>
    </group>
  );
}

function LoaderBench({ selected, consent }: { selected: number; consent: boolean }) {
  const results = useMemo(() => PLUGINS.map((plugin) => ({ plugin, result: loadPlugin(plugin, consent) })), [consent]);
  const slots = useMemo(() => boardLayout(results), [results]);
  const sel = results[selected];
  const selSlot = slots.find((s) => s.owner === sel.plugin.id);
  const target: V3 = sel.result.outcome === "cargado" && selSlot ? selSlot.position : sel.result.stopAt === "discover" ? BIN.ignorado : BIN.deshabilitado;
  const path = useMemo(() => pathFor(sel.plugin, sel.result, [target[0], target[1], target[2] + 0.28]), [sel, target]);
  const binned = (o: Outcome) => results.filter((r) => r.result.outcome === o);
  return (
    <PointerTilt amount={0.045}>
      <group>
        <ShadowBlob position={[0, -1.5, 0.1]} scale={10.5} opacity={0.12} />
        <RoundedBox args={[10.8, 0.34, 4.2]} position={[-0.3, -1.3, 0]} radius={0.16} smoothness={4} castShadow receiveShadow>
          <Mat color="#3a3f44" rough={0.6} coat={0.2} />
        </RoundedBox>
        <RoundedBox args={[10.5, 0.06, 3.9]} position={[-0.3, -1.11, 0]} radius={0.03} smoothness={2} receiveShadow>
          <Mat color="#50565c" rough={0.55} coat={0.25} />
        </RoundedBox>
        {/* source trays */}
        {(Object.keys(SOURCE_Z) as Source[]).map((src) => (
          <group key={src} position={[X.tray, -1.02, SOURCE_Z[src]]}>
            <RoundedBox args={[1.25, 0.14, 0.85]} radius={0.04} smoothness={2} castShadow receiveShadow>
              <Mat color={mixHex(P.paper, SOURCE_COLOR[src], 0.35)} rough={0.5} />
            </RoundedBox>
            <Tag position={[-0.95, 0.1, 0]} tone={src === "usuario" ? "teal" : src === "proyecto" ? "violet" : "amber"} size="xs" center>{src}</Tag>
          </group>
        ))}
        {/* rail */}
        {[-0.14, 0.14].map((z) => (
          <mesh key={z} position={[(X.discover + X.register + 1.6) / 2, RAIL_Y - 0.12, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, X.register + 1.6 - X.discover, 12]} />
            <Mat color="#b68442" metal={0.7} rough={0.3} coat={0} />
          </mesh>
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[X.discover + i * ((X.register + 1.6 - X.discover) / 11), RAIL_Y - 0.17, 0]}>
            <boxGeometry args={[0.06, 0.04, 0.42]} />
            <Mat color="#2a2e33" rough={0.6} />
          </mesh>
        ))}
        <Gate x={X.discover} label="descubrir" tone="ink" color={P.inkSoft} lit={sel.result.stopAt === "discover"} />
        <Gate x={X.manifest} label="plugin.yaml" tone="violet" color={P.violet} lit={false} />
        <Gate x={X.register} label="register(ctx)" tone="teal" color={P.teal} lit={sel.result.stopAt === "register"} />
        {/* consent valve on the register station: only override registrations pass it */}
        <group position={[X.register + 0.55, 0.2, -0.95]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.16, 28]} />
            <Mat color={consent ? P.amber : mixHex(P.paper, P.amber, 0.3)} rough={0.35} />
          </mesh>
          <mesh rotation={[0, 0, consent ? Math.PI / 2 : 0]} position={[0, 0, 0.1]}>
            <boxGeometry args={[0.32, 0.06, 0.04]} />
            <Mat color={P.amberDeep} rough={0.4} />
          </mesh>
          <Tag position={[0, 0.42, 0]} tone="amber" size="xs" center>{consent ? "consentido" : "sin consentir"}</Tag>
        </group>
        <Bin position={BIN.ignorado} label="ignorado" count={binned("ignorado").length} />
        <Bin position={BIN.deshabilitado} label="deshabilitado" count={binned("deshabilitado").length} />
        {/* registry board */}
        <group>
          <RoundedBox args={[2.75, 2.35, 0.22]} position={[X.board, 0.2, -0.05]} radius={0.08} smoothness={3} castShadow receiveShadow>
            <Mat color={mixHex(P.paper, P.inkSoft, 0.12)} rough={0.5} />
          </RoundedBox>
          <mesh position={[X.board, -1.02, -0.05]} castShadow>
            <boxGeometry args={[2.2, 0.16, 0.6]} />
            <Mat color="#2a2e33" rough={0.5} />
          </mesh>
          {(Object.keys(KIND_ROW) as RegKind[]).map((k) => (
            <group key={k}>
              <mesh position={[X.board, KIND_ROW[k], 0.07]}>
                <boxGeometry args={[2.55, 0.5, 0.02]} />
                <meshStandardMaterial color={mixHex(P.paper, KIND_COLOR[k], 0.14)} roughness={0.7} />
              </mesh>
              <Tag position={[X.board - 1.72, KIND_ROW[k], 0.1]} tone={k === "tool" ? "teal" : k === "hook" ? "violet" : "amber"} size="xs" center>{k === "cli" ? "CLI" : k === "tool" ? "tools" : "hooks"}</Tag>
            </group>
          ))}
          {slots.map((s) => (
            <group key={`${s.kind}-${s.name}`} position={s.position}>
              <RoundedBox args={[0.52, 0.36, 0.14]} radius={0.04} smoothness={2} castShadow>
                <Mat color={s.owner === "builtin" ? mixHex(P.paper, P.inkSoft, 0.35) : mixHex(P.paper, s.color, 0.6)} rough={0.4} coat={0.5} />
              </RoundedBox>
              {s.override ? <Wire points={[[-0.28, -0.2, 0.08], [0.28, -0.2, 0.08], [0.28, 0.2, 0.08], [-0.28, 0.2, 0.08], [-0.28, -0.2, 0.08]]} color={P.rose} width={2.2} /> : null}
            </group>
          ))}
          {slots
            .filter((s) => s.owner === sel.plugin.id || (sel.plugin.id === "shell" && s.name === "write_file"))
            .map((s) => (
              <Tag key={`t-${s.name}`} position={[s.position[0], s.position[1] + 0.36, 0.3]} tone={s.override ? "rose" : "ink"} size="xs" center>
                <span className="normal-case">{s.name}</span>
              </Tag>
            ))}
          <Tag position={[X.board, 1.66, 0]} tone="ink" center>registro</Tag>
        </group>
        {/* resting cartridges: each plugin where its load ended (except the one in motion) */}
        {results.map(({ plugin, result }, i) => {
          if (i === selected) return null;
          const bin = result.outcome === "ignorado" ? BIN.ignorado : result.outcome === "deshabilitado" ? BIN.deshabilitado : null;
          const pos: V3 = bin ? [bin[0] + (i % 2 ? 0.14 : -0.14), bin[1] + 0.22, bin[2]] : [X.tray + (i % 2 ? 0.28 : -0.28), -0.8, SOURCE_Z[plugin.source]];
          return (
            <group key={plugin.id} position={pos} rotation={bin ? [0.3, i, 0.2] : [0, 0, 0]} scale={0.85}>
              <Cartridge color={SOURCE_COLOR[plugin.source]} dim />
            </group>
          );
        })}
        <Mover key={`${selected}-${consent}`} path={path} color={SOURCE_COLOR[sel.plugin.source]} />
        <Tag position={[X.tray, -0.25, SOURCE_Z[sel.plugin.source]]} tone="ink" center>
          <span className="normal-case">{sel.plugin.id}</span>
        </Tag>
        <Flow points={[[X.register + 0.3, RAIL_Y + 0.05, 0], [X.register + 1.3, RAIL_Y + 0.2, 0.1], [X.board - 1.3, 0.2, 0.3]]} color={P.teal} count={2} speed={0.3} size={0.04} lineOpacity={0.3} />
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [selected, setSelected] = useState(4);
  const [consent, setConsent] = useState(false);
  const results = PLUGINS.map((plugin) => ({ plugin, result: loadPlugin(plugin, consent) }));
  const sel = results[selected];
  const counts = (o: Outcome) => results.filter((r) => r.result.outcome === o).length;
  const tone = sel.result.outcome === "cargado" ? "var(--teal)" : "var(--rose)";
  return (
    <Figure
      label="Cargador de plugins · register(ctx) como cintura"
      hint="tres fuentes → plugin.yaml → register(ctx) → registro"
      legend={[
        { color: P.teal, label: "usuario / tool" },
        { color: P.violet, label: "proyecto / hook" },
        { color: P.amber, label: "pip / CLI / consentimiento" },
        { color: P.rose, label: "override o descarte" },
      ]}
      note={
        <div className="space-y-3">
          <p>
            <strong>{sel.plugin.id} · {sel.result.outcome}.</strong>{" "}
            {sel.result.outcome === "cargado"
              ? sel.plugin.id === "shell"
                ? "El usuario consintió tools.override: la builtin write_file pasa a ser del plugin. Por eso este permiso se pide una vez y de forma explícita."
                : "register(ctx) corre una vez al arranque y deja sus entradas en el registro."
              : sel.result.outcome === "ignorado"
                ? "La ruta es demasiado profunda: los paquetes nativos son planos o de un nivel de categoría. Con HERMES_PLUGINS_DEBUG=1 verías el motivo."
                : sel.plugin.raises
                  ? "Fail-open de carga: el plugin queda deshabilitado y el agente arranca igual."
                  : "Fail closed: sin consentimiento, un plugin no puede sustituir una builtin en silencio."}
          </p>
          <Readout items={[
            { label: "cargados", value: String(counts("cargado")), tone: "var(--teal)" },
            { label: "deshabilitados", value: String(counts("deshabilitado")), tone: "var(--rose)" },
            { label: "ignorados", value: String(counts("ignorado")), tone: "var(--muted)" },
            { label: "Hermes", value: "arranca en todos los casos", tone: "var(--ink)" },
          ]} />
          <ol className="list-decimal space-y-0.5 pl-5 font-mono text-[0.72rem]" style={{ color: tone }}>
            {sel.result.log.map((line) => <li key={line} className="text-ink-soft">{line}</li>)}
          </ol>
          <p className="text-xs text-muted">Plugins y rutas inventados para la lámina; las reglas (tres fuentes, layout plano, register una vez, override con consentimiento) son las de la guía oficial. <code>hermes plugins doctor</code> ejecuta esta misma cadena con un HERMES_HOME temporal, pero no es un sandbox.</p>
        </div>
      }
      controls={
        <>
          <Switcher
            value={String(selected)}
            onChange={(v) => setSelected(Number(v))}
            options={PLUGINS.map((p, i) => ({ value: String(i), label: p.id, tone: SOURCE_COLOR[p.source] }))}
            ariaLabel="Plugin que se sigue"
          />
          <Switcher
            value={consent ? "si" : "no"}
            onChange={(v) => setConsent(v === "si")}
            options={[{ value: "no", label: "Sin consentir", tone: P.rose }, { value: "si", label: "Consentir override", tone: P.amber }]}
            ariaLabel="Consentimiento de tools.override"
          />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.5, 3.4, 10.5], fov: 34 }} fit={1.04}>
        <LoaderBench selected={selected} consent={consent} />
      </Stage>
    </Figure>
  );
}
