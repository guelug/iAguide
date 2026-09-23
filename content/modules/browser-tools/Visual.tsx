"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { MathUtils, type Group } from "three";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Arrow, Flow, Halo, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Turntable, Wire, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "tool" | "cdp" | "dialog" | "frames" | "target";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "browser_tool": "browser tool",
      "cdp_socket": "CDP socket",
      "dialogs": "dialogs",
      "frames": "frames",
      "sandbox_host_node": "sandbox/host/node",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "browser_tool": "herramienta de navegador",
      "cdp_socket": "socket CDP",
      "dialogs": "diálogos",
      "frames": "frames",
      "sandbox_host_node": "sandbox/host/nodo",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "tool" as const, label: t.browser_tool, tone: "var(--teal)" },
    { value: "cdp" as const, label: t.cdp_socket, tone: "var(--teal)" },
    { value: "dialog" as const, label: t.dialogs, tone: "var(--amber)" },
    { value: "frames" as const, label: t.frames, tone: "var(--violet)" },
    { value: "target" as const, label: t.sandbox_host_node, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("tool");

  return (
    <Figure
      label="Browser as a tool backend"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="browser-tools diagram steps"
          value={step}
          onChange={setStep}
          options={OPTIONS}
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

function Scene({ active, t }: { active: Step; t: Record<string, string> }) {
  return (
    <group>
      <Wire points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.line} opacity={0.5} />
      <Flow points={[[-2.6, 0.2, 0], [2.6, 0.2, 0]]} color={P.teal} count={3} speed={0.3} />
      <Node3D position={[0, 0.2, 0]} color={P.teal} radius={0.18} pulse={0.35} />

      <Slab
        position={[-2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "tool" ? P.teal : P.lineStrong}
        fill={active === "tool" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.browser_tool}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "cdp" ? P.amber : P.lineStrong}
        fill={active === "cdp" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.cdp_socket}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "dialog" ? P.violet : P.lineStrong}
        fill={active === "dialog" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.dialogs}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "frames" ? P.teal : P.lineStrong}
        fill={active === "frames" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.frames}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "target" ? P.amber : P.lineStrong}
        fill={active === "target" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.sandbox_host_node}</Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Banco CDP. Una tool call del arnés viaja por el WebSocket de CDP hasta
 * un Chromium real: navega, pulsa dentro de un iframe (hay que apuntar a
 * su frameId), recibe un diálogo que bloquea la página y devuelve un
 * árbol de accesibilidad acotado. Todo el guion sale de CDP_SCRIPT; los
 * ids, el registro y los caracteres devueltos se calculan a partir de él.
 */

type Route = "cdp" | "extract";
type Handler = "deny" | "none";

type CdpLine = {
  dir: "→" | "←";
  method: string;
  frame: string;
  /** true when the harness sends it (it gets a message id). */
  command: boolean;
};

type CdpStep = {
  key: string;
  tool: string;
  short: string;
  chip: string;
  focus: "main" | "iframe" | "dialog" | "tree";
  lines: (handler: Handler) => CdpLine[];
  blurb: string;
};

const FRAME_MAIN = "F-1 (principal)";
const FRAME_IFRAME = "F-7 (iframe cuenta)";

const CDP_SCRIPT: CdpStep[] = [
  {
    key: "navigate",
    tool: 'browser.navigate("https://app.ejemplo/ajustes")',
    short: "navegar",
    chip: "navigate(url)",
    focus: "main",
    lines: () => [
      { dir: "→", method: "Page.navigate", frame: FRAME_MAIN, command: true },
      { dir: "←", method: "Page.frameNavigated", frame: FRAME_MAIN, command: false },
      { dir: "←", method: "Page.frameAttached", frame: FRAME_IFRAME, command: false },
    ],
    blurb: "La tool se traduce a Page.navigate. Chromium ejecuta el JS de la SPA y adjunta un iframe con su propio frameId.",
  },
  {
    key: "click",
    tool: 'browser.click("Guardar", frame="F-7")',
    short: "pulsar",
    chip: "click(Guardar)",
    focus: "iframe",
    lines: () => [
      { dir: "→", method: "Runtime.evaluate", frame: FRAME_IFRAME, command: true },
      { dir: "→", method: "Input.dispatchMouseEvent", frame: FRAME_IFRAME, command: true },
    ],
    blurb: "El botón vive en el iframe. El arnés tiene que apuntar al frame F-7: buscar en el principal no lo encuentra.",
  },
  {
    key: "dialog",
    tool: "(evento: confirm() en la página)",
    short: "diálogo",
    chip: "evento confirm()",
    focus: "dialog",
    lines: (handler) =>
      handler === "deny"
        ? [
            { dir: "←", method: "Page.javascriptDialogOpening", frame: FRAME_IFRAME, command: false },
            { dir: "→", method: "Page.handleJavaScriptDialog", frame: FRAME_IFRAME, command: true },
            { dir: "←", method: "Page.javascriptDialogClosed", frame: FRAME_IFRAME, command: false },
          ]
        : [{ dir: "←", method: "Page.javascriptDialogOpening", frame: FRAME_IFRAME, command: false }],
    blurb: "El clic dispara confirm(). La página queda congelada hasta que alguien responda al diálogo.",
  },
  {
    key: "snapshot",
    tool: "browser.snapshot()",
    short: "leer",
    chip: "snapshot()",
    focus: "tree",
    lines: () => [{ dir: "→", method: "Accessibility.getFullAXTree", frame: FRAME_MAIN, command: true }],
    blurb: "La lectura pide el árbol de accesibilidad, no el HTML, y lo recorta al tope de salida antes de pegarlo al contexto.",
  },
];

/* Didactic sizes, stated as such in the note. The cap is the lesson's. */
const OUTPUT = {
  domChars: 500_000,
  axTreeChars: 18_400,
  cap: 4_000,
  charsPerToken: 4,
  shellChars: 38,
};

function cdpLog(step: number, handler: Handler) {
  const log: (CdpLine & { id: number | null; stepIndex: number })[] = [];
  let id = 0;
  let blocked = false;
  for (let i = 0; i <= step; i += 1) {
    if (blocked) break;
    for (const line of CDP_SCRIPT[i].lines(handler)) {
      if (line.command) id += 1;
      log.push({ ...line, id: line.command ? id : null, stepIndex: i });
    }
    if (CDP_SCRIPT[i].key === "dialog" && handler === "none") blocked = true;
  }
  const reached = CDP_SCRIPT.findIndex((s) => s.key === "dialog");
  const isBlocked = handler === "none" && step >= reached;
  return { log, commands: id, isBlocked };
}

const ES_INT = new Intl.NumberFormat("es-ES");

const MAT = {
  base: "#3a3f44",
  baseTop: "#50565c",
  chassis: "#2a2e33",
  bezel: "#3d4349",
  page: "#f4f1ea",
  brass: "#b68442",
  steel: "#9aa3ab",
};

function Solid({ color, rough = 0.45, coat = 0.4, metal = 0 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} />;
}

function Plinth() {
  return (
    <group>
      <ShadowBlob position={[0, -1.52, 0.1]} scale={9.5} opacity={0.12} />
      <RoundedBox args={[9.8, 0.34, 3.7]} position={[0, -1.32, 0]} radius={0.16} smoothness={4} castShadow receiveShadow>
        <Solid color={MAT.base} rough={0.6} coat={0.2} />
      </RoundedBox>
      <RoundedBox args={[9.5, 0.08, 3.4]} position={[0, -1.12, 0]} radius={0.04} smoothness={2} receiveShadow>
        <Solid color={MAT.baseTop} rough={0.55} coat={0.25} />
      </RoundedBox>
      {[-4.55, 4.55].flatMap((x) => [-1.55, 1.55].map((z) => (
        <mesh key={`${x}${z}`} position={[x, -1.07, z]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 18]} />
          <Solid color={MAT.brass} rough={0.3} metal={0.7} coat={0} />
        </mesh>
      )))}
    </group>
  );
}

function HarnessConsole({ tool, route }: { tool: string; route: Route }) {
  return (
    <group position={[-3.35, -1.08, 0.35]} scale={1.2}>
      <RoundedBox args={[1.95, 0.62, 1.5]} position={[0, 0.31, 0]} radius={0.1} smoothness={3} castShadow receiveShadow>
        <Solid color={mixHex(P.paper, P.teal, 0.12)} rough={0.5} />
      </RoundedBox>
      {/* slanted screen */}
      <group position={[0, 0.72, -0.18]} rotation={[-0.55, 0, 0]}>
        <RoundedBox args={[1.7, 0.95, 0.1]} radius={0.05} smoothness={3} castShadow receiveShadow>
          <Solid color={MAT.chassis} rough={0.4} />
        </RoundedBox>
        <mesh position={[0, 0, 0.052]}>
          <planeGeometry args={[1.52, 0.78]} />
          <meshStandardMaterial color={mixHex(MAT.chassis, P.teal, 0.25)} roughness={0.3} />
        </mesh>
        {[0.22, 0.06, -0.1, -0.26].map((y, i) => (
          <mesh key={y} position={[-0.62 + (i === 0 ? 0.28 : 0.4) / 2 + 0.02, y, 0.056]}>
            <planeGeometry args={[i === 0 ? 0.28 : 0.4 + (i % 2) * 0.35, 0.05]} />
            <meshBasicMaterial color={i === 0 ? P.tealWash : mixHex(MAT.chassis, P.paper, 0.35)} />
          </mesh>
        ))}
      </group>
      {/* key rows */}
      {[0, 1].map((r) => Array.from({ length: 7 }, (_, c) => (
        <RoundedBox key={`${r}-${c}`} args={[0.19, 0.05, 0.16]} position={[-0.63 + c * 0.21, 0.64, 0.28 + r * 0.2]} radius={0.02} smoothness={2} castShadow>
          <Solid color={P.surface} rough={0.5} />
        </RoundedBox>
      )))}
      <Tag position={[0, 1.55, -0.3]} tone="teal" center>arnés</Tag>
      <Tag position={[0, 0.2, 0.85]} tone="ink" size="xs" center>
        <span className="normal-case">{route === "cdp" ? tool : "web_extract(url)"}</span>
      </Tag>
    </group>
  );
}

/** A page frame drawn as a sheet with skeleton rows; lifted when it is the target. */
function PageSheet({ size, position, color, active, rows, children }: { size: [number, number]; position: V3; color: string; active: boolean; rows: number; children?: ReactNode }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = position[2] + (active ? 0.08 : 0);
    g.position.z = still ? target : MathUtils.damp(g.position.z, target, 6, dt);
  });
  const [w, h] = size;
  return (
    <group ref={ref} position={position}>
      <RoundedBox args={[w, h, 0.05]} radius={0.03} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color={active ? mixHex(P.paper, color, 0.12) : MAT.page} roughness={0.6} clearcoat={0.3} />
      </RoundedBox>
      <Wire
        points={[[-w / 2, -h / 2, 0.03], [w / 2, -h / 2, 0.03], [w / 2, h / 2, 0.03], [-w / 2, h / 2, 0.03], [-w / 2, -h / 2, 0.03]]}
        color={color}
        opacity={active ? 0.95 : 0.4}
        width={active ? 2 : 1}
      />
      {Array.from({ length: rows }, (_, i) => {
        const rw = (w - 0.3) * (0.45 + 0.5 * ((i * 37) % 10) / 10);
        return (
          <mesh key={i} position={[-w / 2 + 0.15 + rw / 2, h / 2 - 0.22 - i * 0.17, 0.028]}>
            <boxGeometry args={[rw, 0.06, 0.01]} />
            <meshStandardMaterial color={mixHex(MAT.page, P.inkSoft, 0.22)} roughness={0.7} />
          </mesh>
        );
      })}
      {children}
    </group>
  );
}

function Cursor({ target }: { target: V3 }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    for (const [i, axis] of (["x", "y", "z"] as const).entries()) {
      g.position[axis] = still ? target[i] : MathUtils.damp(g.position[axis], target[i], 4, dt);
    }
  });
  return (
    <group ref={ref} position={target}>
      <mesh rotation={[0, 0, 0.5]} position={[0.06, -0.1, 0]} castShadow>
        <coneGeometry args={[0.07, 0.22, 3]} />
        <Solid color={P.ink} rough={0.35} />
      </mesh>
    </group>
  );
}

function ChromiumChassis({ focus, route, handler, blocked, showDialog }: { focus: CdpStep["focus"] | null; route: Route; handler: Handler; blocked: boolean; showDialog: boolean }) {
  const extract = route === "extract";
  const buttonPos: V3 = [1.3, -0.8, 0.45];
  const cursorTarget: V3 = focus === "iframe" || focus === "dialog" ? [buttonPos[0] + 0.04, buttonPos[1] - 0.02, 0.62] : [-0.9, 0.55, 0.5];
  return (
    <group position={[2.35, -0.05, -0.35]} rotation={[-0.16, 0, 0]}>
      {/* easel stand */}
      <mesh position={[-1.2, -1.02, -0.35]} rotation={[0.28, 0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.9, 0.12]} />
        <Solid color={MAT.steel} metal={0.6} rough={0.35} coat={0} />
      </mesh>
      <mesh position={[1.2, -1.02, -0.35]} rotation={[0.28, 0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.9, 0.12]} />
        <Solid color={MAT.steel} metal={0.6} rough={0.35} coat={0} />
      </mesh>
      {/* window body */}
      <RoundedBox args={[4.1, 2.75, 0.24]} radius={0.12} smoothness={4} castShadow receiveShadow>
        <Solid color={MAT.chassis} rough={0.42} coat={0.5} />
      </RoundedBox>
      {/* toolbar */}
      <RoundedBox args={[3.9, 0.3, 0.05]} position={[0, 1.18, 0.13]} radius={0.03} smoothness={2}>
        <Solid color={MAT.bezel} rough={0.5} />
      </RoundedBox>
      {[P.rose, P.amber, P.teal].map((c, i) => (
        <mesh key={c} position={[-1.78 + i * 0.16, 1.18, 0.165]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.02, 16]} />
          <meshStandardMaterial color={c} roughness={0.4} />
        </mesh>
      ))}
      <RoundedBox args={[2.6, 0.17, 0.03]} position={[0.2, 1.18, 0.165]} radius={0.06} smoothness={2}>
        <Solid color={mixHex(MAT.bezel, P.paper, 0.2)} rough={0.5} />
      </RoundedBox>
      {/* main frame */}
      <PageSheet size={[3.86, 2.08]} position={[0, -0.15, 0.14]} color={P.teal} active={!extract && (focus === "main" || focus === "tree")} rows={extract ? 0 : 5}>
        {extract ? (
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[1.2, 0.5, 0.01]} />
            <meshStandardMaterial color={mixHex(MAT.page, P.amber, 0.12)} roughness={0.7} transparent opacity={0.8} />
          </mesh>
        ) : null}
      </PageSheet>
      {/* iframe, cross-origin: its own sheet, its own id */}
      {!extract ? (
        <PageSheet size={[1.75, 1.05]} position={[0.85, -0.5, 0.36]} color={P.violet} active={focus === "iframe"} rows={3}>
          <RoundedBox args={[0.5, 0.17, 0.06]} position={[0.45, -0.3, 0.05]} radius={0.04} smoothness={2} castShadow>
            <Solid color={focus === "iframe" ? P.teal : mixHex(P.paper, P.teal, 0.5)} rough={0.35} />
          </RoundedBox>
        </PageSheet>
      ) : null}
      {/* modal dialog: blocks the page until handled */}
      {showDialog && !extract ? (
        <group position={[-0.2, 0.05, 0.8]}>
          <RoundedBox args={[1.9, 0.95, 0.08]} radius={0.05} smoothness={3} castShadow>
            <Solid color={mixHex(P.paper, P.rose, blocked ? 0.2 : 0.08)} rough={0.4} coat={0.5} />
          </RoundedBox>
          <Wire points={[[-0.95, -0.475, 0.045], [0.95, -0.475, 0.045], [0.95, 0.475, 0.045], [-0.95, 0.475, 0.045], [-0.95, -0.475, 0.045]]} color={P.rose} width={2} opacity={0.9} />
          {[-0.32, 0.32].map((x, i) => (
            <RoundedBox key={x} args={[0.5, 0.16, 0.05]} position={[x, -0.25, 0.05]} radius={0.04} smoothness={2}>
              <Solid color={handler === "deny" && i === 0 ? P.rose : P.surface} rough={0.4} />
            </RoundedBox>
          ))}
          <mesh position={[0, 0.16, 0.046]}>
            <planeGeometry args={[1.3, 0.07]} />
            <meshBasicMaterial color={mixHex(P.paper, P.rose, 0.5)} />
          </mesh>
          <Tag position={[0, 0.72, 0.1]} tone="rose" center>{blocked ? "sin handler: bloqueo" : "confirm() → deny"}</Tag>
        </group>
      ) : null}
      {!extract && (focus === "iframe" || focus === "dialog") ? <Cursor target={cursorTarget} /> : null}
      <Tag position={[0, 1.72, 0.1]} tone="ink" center>Chromium headless</Tag>
      {!extract ? <Tag position={[1.2, 0.18, 0.5]} tone="violet" size="xs" center>iframe F-7</Tag> : null}
      {extract ? <Tag position={[0, 0.55, 0.3]} tone="amber" size="xs" center>{'<div id="root">'}</Tag> : null}
    </group>
  );
}

const DUCT: V3[] = [[-2.45, -0.58, 0.35], [-1.6, -0.55, 0.55], [-0.7, -0.62, 0.35], [0.1, -0.7, 0.05]];
const DUCT_BACK: V3[] = [...DUCT].reverse().map(([x, y, z]) => [x, y + 0.12, z - 0.02] as V3);

function OutputStack({ chars, visible }: { chars: number; visible: boolean }) {
  // One sheet per 1 000 characters actually pasted into the context.
  const sheets = Math.ceil(chars / 1000);
  if (!visible) return null;
  return (
    <group position={[0.35, -1.07, 1.3]}>
      {Array.from({ length: sheets }, (_, i) => (
        <RoundedBox key={i} args={[0.9, 0.035, 0.62]} position={[0, 0.02 + i * 0.045, 0]} rotation={[0, (i % 2 ? 0.04 : -0.03), 0]} radius={0.01} smoothness={2} castShadow receiveShadow>
          <Solid color={mixHex(P.paper, P.violet, 0.12 + i * 0.03)} rough={0.7} coat={0.1} />
        </RoundedBox>
      ))}
      <Tag position={[0, 0.2 + sheets * 0.045, 0]} tone="violet" size="xs" center>
        {ES_INT.format(chars)} car.
      </Tag>
    </group>
  );
}

function CdpBench({ step, route, handler }: { step: number; route: Route; handler: Handler }) {
  const current = CDP_SCRIPT[step];
  const { log, isBlocked } = useMemo(() => cdpLog(step, handler), [step, handler]);
  const reachedDialog = step >= CDP_SCRIPT.findIndex((s) => s.key === "dialog");
  const showDialog = reachedDialog && (handler === "none" || current.key === "dialog");
  const lastOut = [...log].reverse().find((l) => l.dir === "→");
  const lastIn = [...log].reverse().find((l) => l.dir === "←");
  const extract = route === "extract";
  const returned = extract ? OUTPUT.shellChars : current.key === "snapshot" && !isBlocked ? Math.min(OUTPUT.axTreeChars, OUTPUT.cap) : 0;
  const focus = isBlocked ? "dialog" : current.focus;
  return (
    <PointerTilt amount={0.05}>
      <group>
        <Plinth />
        <HarnessConsole tool={current.chip} route={route} />
        <ChromiumChassis focus={focus} route={route} handler={handler} blocked={isBlocked} showDialog={showDialog} />
        {extract ? (
          <>
            <Arrow from={[-2.4, -0.4, 0.35]} to={[0.2, -0.4, 0.35]} color={P.amber} width={2} head={0.14} />
            <Arrow from={[0.2, -0.72, 0.5]} to={[-2.4, -0.72, 0.5]} color={P.amber} width={1.2} head={0.1} dashed />
            <Tag position={[-1.1, -0.12, 0.35]} tone="amber" center>HTTP GET</Tag>
          </>
        ) : (
          <>
            <Ribbon points={DUCT} color={mixHex(MAT.chassis, P.teal, 0.2)} radius={0.075} />
            {[0, 1, 2, 3].map((i) => {
              const p = DUCT[i];
              return (
                <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]}>
                  <torusGeometry args={[0.1, 0.022, 10, 24]} />
                  <Solid color={MAT.brass} metal={0.7} rough={0.3} coat={0} />
                </mesh>
              );
            })}
            <Flow points={DUCT.map(([x, y, z]) => [x, y + 0.12, z + 0.02] as V3)} color={P.teal} count={2} speed={isBlocked ? 0 : 0.42} size={0.05} lineOpacity={0} paused={isBlocked} />
            <Flow points={DUCT_BACK.map(([x, y, z]) => [x, y + 0.1, z] as V3)} color={P.violet} count={2} speed={0.36} size={0.045} lineOpacity={0} offset={0.5} paused={isBlocked} />
            <Tag position={[-1.15, 0.05, 0.5]} tone="teal" size="xs" center>
              <span className="normal-case">{lastOut ? `#${lastOut.id} ${lastOut.method}` : "—"}</span>
            </Tag>
            <Tag position={[-1.15, -0.95, 1.0]} tone="violet" size="xs" center>
              <span className="normal-case">{lastIn ? lastIn.method : "sin eventos"}</span>
            </Tag>
            <Tag position={[-0.95, -1.35, 1.8]} tone="muted" size="xs" center>WebSocket CDP</Tag>
          </>
        )}
        <OutputStack chars={returned} visible={returned > 0} />
        {isBlocked && !extract ? <Halo position={[2.35, -0.1, 0.4]} radius={1.3} color={P.rose} opacity={0.5} rotation={[0, 0, 0]} spin={0.4} /> : null}
        {!extract && !isBlocked && current.key === "click" ? <Node3D position={[3.0, -0.95, 0.22]} color={P.violet} radius={0.05} matte /> : null}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [route, setRoute] = useState<Route>("cdp");
  const [handler, setHandler] = useState<Handler>("deny");
  const [step, setStep] = useState(0);
  const { log, commands, isBlocked } = cdpLog(step, handler);
  const current = CDP_SCRIPT[step];
  const last = CDP_SCRIPT.length - 1;
  const returned = route === "extract" ? OUTPUT.shellChars : current.key === "snapshot" && !isBlocked ? Math.min(OUTPUT.axTreeChars, OUTPUT.cap) : 0;

  const note =
    route === "extract" ? (
      <div className="space-y-2">
        <p><strong>web_extract hace una petición HTTP y devuelve bytes.</strong> Sin JS, sin cookies, sin login. En una SPA de React la respuesta es el esqueleto: un <code>&lt;div id=&quot;root&quot;&gt;</code> vacío, porque el contenido lo pinta un JS que nadie ejecutó.</p>
        <Readout items={[
          { label: "llamadas CDP", value: "0", tone: "var(--amber)" },
          { label: "devuelto", value: `${OUTPUT.shellChars} caracteres`, tone: "var(--amber)" },
          { label: "contenido útil", value: "ninguno", tone: "var(--rose)" },
        ]} />
        <p className="text-xs text-muted">Para Wikipedia o una página de documentación estática, esta ruta basta y es más rápida. Para una SPA con sesión, hace falta el navegador.</p>
      </div>
    ) : (
      <div className="space-y-3">
        <p><strong>Paso {step + 1} · {current.short}.</strong> {current.blurb}{isBlocked ? " Sin handler nadie envía Page.handleJavaScriptDialog: la página sigue congelada, la siguiente llamada no responde y el turno nunca termina." : ""}</p>
        <Readout items={[
          { label: "tool", value: current.tool, tone: "var(--teal)" },
          { label: "mensajes con id", value: String(commands), tone: "var(--teal)" },
          { label: "estado", value: isBlocked ? "bloqueado por diálogo" : "en curso", tone: isBlocked ? "var(--rose)" : "var(--ink)" },
          { label: "al contexto", value: returned ? `${ES_INT.format(returned)} car. ≈ ${ES_INT.format(Math.round(returned / OUTPUT.charsPerToken))} tokens` : "—", tone: "var(--violet)" },
        ]} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-left text-xs">
            <thead className="font-mono text-[0.6rem] uppercase tracking-widest text-muted">
              <tr><th className="border-b border-line px-2 py-1">id</th><th className="border-b border-line px-2 py-1">sentido</th><th className="border-b border-line px-2 py-1">método CDP</th><th className="border-b border-line px-2 py-1">frame</th></tr>
            </thead>
            <tbody>
              {log.map((line, i) => (
                <tr key={i} className={line.stepIndex === step ? "text-ink" : "text-muted"}>
                  <td className="border-b border-line/60 px-2 py-1 font-mono tabular-nums">{line.id ?? "evento"}</td>
                  <td className="border-b border-line/60 px-2 py-1 font-mono">{line.dir === "→" ? "arnés → Chromium" : "Chromium → arnés"}</td>
                  <td className="border-b border-line/60 px-2 py-1 font-mono">{line.method}</td>
                  <td className="border-b border-line/60 px-2 py-1 font-mono">{line.frame}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">Tamaños didácticos: el HTML completo de la página serían unos {ES_INT.format(OUTPUT.domChars)} caracteres; su árbol de accesibilidad, {ES_INT.format(OUTPUT.axTreeChars)}; el tope por defecto de la lección, {ES_INT.format(OUTPUT.cap)}. Tokens estimados con la regla práctica de 4 caracteres por token. Los frameId son inventados.</p>
      </div>
    );

  return (
    <Figure
      label="Banco CDP · una tool call dentro de un navegador real"
      hint="tool call → socket CDP → frames y diálogos → modelo"
      legend={[
        { color: P.teal, label: "comando del arnés" },
        { color: P.violet, label: "evento / frame" },
        { color: P.rose, label: "diálogo" },
        { color: P.amber, label: "web_extract" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            value={route}
            onChange={setRoute}
            options={[{ value: "cdp", label: "Navegador", tone: P.teal }, { value: "extract", label: "web_extract", tone: P.amber }]}
            ariaLabel="Ruta de la herramienta"
          />
          {route === "cdp" ? (
            <>
              <Switcher
                value={handler}
                onChange={setHandler}
                options={[{ value: "deny", label: "Handler: deny", tone: P.teal }, { value: "none", label: "Sin handler", tone: P.rose }]}
                ariaLabel="Handler de diálogos"
              />
              <div className="flex items-center gap-1 rounded-full border border-line px-1 py-0.5" role="group" aria-label="Pasos de la tool call">
                <button type="button" className="chip min-w-8 px-2" disabled={step <= 0} aria-label="Paso anterior" onClick={() => setStep(Math.max(0, step - 1))}>←</button>
                <span className="px-1 font-mono text-[0.6rem] tabular-nums text-muted">paso {step + 1}/{last + 1}</span>
                <button type="button" className="chip min-w-8 px-2" disabled={step >= last} aria-label="Paso siguiente" onClick={() => setStep(Math.min(last, step + 1))}>→</button>
              </div>
            </>
          ) : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [2.2, 2.6, 10.5], fov: 34 }} fit={1.05}>
        <CdpBench step={step} route={route} handler={handler} />
      </Stage>
    </Figure>
  );
}
