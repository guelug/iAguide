"use client";

import { useMemo, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage, useStage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire, useCycle } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* prompt-assembly: the order of system/history/user; stable prefix halo; trim. */
type Mode = "order" | "stable" | "trim";

const COPY = {
  en: {
    prompt_is_a_cache_contract: "prompt is a cache contract",
    order_stable_trim: "order · stable prefix · trim",
    order: "order",
    stable: "stable",
    trim: "trim",
    system: "system",
    history: "history",
    user: "user",
    tool_def: "tool def",
    prefix_hits: "prefix hits",
    prefix_miss: "prefix miss",
    trim_low: "trim low-value",
  },
  es: {
    prompt_is_a_cache_contract: "el prompt es un contrato de caché",
    order_stable_trim: "orden · prefijo estable · poda",
    order: "orden",
    stable: "estable",
    trim: "poda",
    system: "sistema",
    history: "historial",
    user: "usuario",
    tool_def: "def tool",
    prefix_hits: "acierto prefijo",
    prefix_miss: "falla prefijo",
    trim_low: "poda lo de poco valor",
  },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("order");

  return (
    <Figure
      label={t.prompt_is_a_cache_contract}
      hint={t.order_stable_trim}
      legend={[
        { color: P.violet, label: t.system },
        { color: P.teal, label: t.history },
        { color: P.amber, label: t.user },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "order", label: t.order, tone: P.violet },
            { value: "stable", label: t.stable, tone: P.teal },
            { value: "trim", label: t.trim, tone: P.rose },
          ]}
          ariaLabel={t.prompt_is_a_cache_contract}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "order" && (
          <>
            {(
              [
                [t.system, P.violet, -2.0, 1.0],
                [t.tool_def, P.amber, 0.1, 0.95],
                [t.history, P.teal, 1.3, 0.7],
                [t.user, P.rose, 2.5, 0.45],
              ] as const
            ).map(([lab, col, x, y], i) => (
              <group key={lab}>
                <Slab position={[x, y, 0]} size={[1.8, 0.4, 0.1]} color={col} fill={0.22 - i * 0.02} />
                <Tag position={[x, y + 0.35, 0.15]} tone={col === P.violet ? "violet" : col === P.amber ? "amber" : col === P.teal ? "teal" : "rose"} size="xs">
                  {lab}
                </Tag>
              </group>
            ))}
            <Ribbon
              points={[[-2.0, 1.4, 0], [-1.0, 0.3, 0], [0.1, 0.85, 0], [1.3, 0.35, 0], [2.5, 0.15, 0]]}
              color={P.lineStrong}
              radius={0.03}
              opacity={0.7}
            />
            <Wire points={[[-2.9, 0.05, 0], [3.4, 0.05, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[3.4, -0.3, 0.15]} tone="muted" size="xs">token position →</Tag>
            <Tag position={[0, -1.0, 0.15]} tone="muted" size="xs">early bytes are stable</Tag>
          </>
        )}

        {mode === "stable" && (
          <>
            {/* prefix halo hits on first part, miss on tail */}
            <Slab position={[-1.8, 0.6, 0]} size={[2.0, 0.55, 0.12]} color={P.teal} fill={0.32} />
            <Halo position={[-1.8, 0.6, 0]} radius={1.15} color={P.teal} opacity={0.4} spin={0.15} />
            <Tag position={[-1.8, 1.45, 0.15]} tone="teal">{t.prefix_hits}</Tag>
            <Slab position={[1.6, 0.6, 0]} size={[1.8, 0.55, 0.12]} color={P.rose} fill={0.32} />
            <Tag position={[1.6, 1.45, 0.15]} tone="rose">{t.prefix_miss}</Tag>
            <Wire points={[[-2.9, 0.05, 0], [3.0, 0.05, 0]]} color={P.lineStrong} opacity={0.5} />
            <Tag position={[0, -0.55, 0.15]} tone="muted" size="xs">1 byte changed → whole-cache miss</Tag>
            {/* a tiny change highlighted on the right */}
            <Node3D position={[2.5, 0.6, 0]} color={P.rose} radius={0.11} pulse={0.6} />
          </>
        )}

        {mode === "trim" && (
          <>
            {/* three sections; the rose one gets cut */}
            {[P.teal, P.violet, P.rose].map((col, i) => (
              <group key={i}>
                <Slab
                  position={[0, 0.7 - i * 0.55, 0]}
                  size={[4.0 - i * 0.4, 0.35, 0.12]}
                  color={col}
                  fill={i === 2 ? 0.3 : 0.18}
                />
                {i === 2 && (
                  <>
                    <Wire points={[[-1.3, -0.4, 0], [1.3, -0.4, 0]]} color={P.rose} width={2.5} opacity={0.9} dashed />
                    <Tag position={[0, -0.85, 0.15]} tone="rose" size="xs">{t.trim_low}</Tag>
                  </>
                )}
              </group>
            ))}
            {/* final answer halo emerges below */}
            <Ribbon points={[[0, -1.05, 0], [0, -1.6, 0]]} color={P.amber} radius={0.04} opacity={0.7} />
            <Halo position={[0, -1.95, 0]} radius={0.55} color={P.amber} opacity={0.6} spin={0.2} />
            <Tag position={[0, -2.3, 0.15]} tone="amber" size="xs">answer</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */
/*
 * La factura turno a turno. Cada columna es un turno: abajo lo que se lee
 * de caché, arriba lo que se paga a precio completo. Supuestos didácticos:
 * prefijo congelado de 9.300 tokens, el historial crece 400 tokens por
 * turno, cada turno añade 150 tokens nuevos (efímero + mensaje), y leer de
 * caché cuesta el 10 % del input. simulateTurns() hace toda la cuenta.
 */

type Scenario = "good" | "clock" | "model";
const TURNS = 12;
const PREFIX = 9300;
const HISTORY_STEP = 400;
const NEW_PER_TURN = 150;
const CACHE_READ = 0.1;
const fmtK = (n: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(n);

function simulateTurns(scenario: Scenario, modelTurn: number) {
  const turns = Array.from({ length: TURNS }, (_, i) => {
    const t = i + 1;
    const history = (t - 1) * HISTORY_STEP;
    const total = PREFIX + history + NEW_PER_TURN;
    const cold = t === 1 || scenario === "clock" || (scenario === "model" && t === modelTurn);
    const cached = cold ? 0 : PREFIX + history;
    const uncached = total - cached;
    const cost = uncached + cached * CACHE_READ;
    return { t, total, cached, uncached, cost, cold };
  });
  const cost = turns.reduce((a, x) => a + x.cost, 0);
  const tokens = turns.reduce((a, x) => a + x.total, 0);
  return { turns, cost, tokens, maxTotal: turns[TURNS - 1].total };
}

const PB = { wood: "#3B2D27", woodTop: "#5E4533", graphite: "#2A2F31", steel: "#8C9895", brass: "#B7833E", ceramic: "#EEE9DF" };
const COL_PITCH = 0.66;
const H_MAX = 2.4;

function BMat({ color, clear = 0.45, rough = 0.42, metal = 0.04 }: { color: string; clear?: number; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={clear} clearcoatRoughness={0.3} />;
}

function TurnColumns({ scenario, modelTurn }: { scenario: Scenario; modelTurn: number }) {
  const sim = useMemo(() => simulateTurns(scenario, modelTurn), [scenario, modelTurn]);
  const { still } = useStage();
  const [cursor] = useCycle(TURNS + 4, 0.45);
  const shown = still ? TURNS : Math.min(TURNS, cursor + 1);
  const scaleH = (tokens: number) => (tokens / sim.maxTotal) * H_MAX;
  const costMax = sim.maxTotal; // un turno frío cuesta su total completo
  return (
    <group>
      {sim.turns.map((turn, i) => {
        const x = (i - (TURNS - 1) / 2) * COL_PITCH;
        const visible = i < shown;
        const hc = scaleH(turn.cached);
        const hu = scaleH(turn.uncached);
        const hk = (turn.cost / costMax) * 0.5;
        return (
          <group key={turn.t} position={[x, -0.42, 0]}>
            <RoundedBox position={[0, -0.02, 0]} args={[0.52, 0.06, 0.62]} radius={0.02} smoothness={2} receiveShadow>
              <BMat color={PB.ceramic} rough={0.55} />
            </RoundedBox>
            {visible && hc > 0.01 ? (
              <RoundedBox position={[0, hc / 2 + 0.02, -0.05]} args={[0.42, hc, 0.42]} radius={0.03} smoothness={2} castShadow receiveShadow>
                <BMat color={mixHex(P.paper, P.teal, 0.55)} />
              </RoundedBox>
            ) : null}
            {visible ? (
              <RoundedBox position={[0, hc + hu / 2 + 0.03, -0.05]} args={[0.42, Math.max(0.02, hu), 0.42]} radius={0.03} smoothness={2} castShadow receiveShadow>
                <BMat color={turn.cold ? mixHex(P.paper, P.rose, 0.55) : mixHex(P.paper, P.amber, 0.6)} />
              </RoundedBox>
            ) : null}
            {/* coste relativo del turno: ficha delante de la columna */}
            {visible ? (
              <RoundedBox position={[0, hk / 2 + 0.02, 0.6]} args={[0.4, Math.max(0.02, hk), 0.16]} radius={0.02} smoothness={2} castShadow>
                <BMat color={mixHex(P.paper, P.violet, 0.6)} />
              </RoundedBox>
            ) : null}
            {turn.t === 1 || turn.t === TURNS || (scenario === "model" && turn.t === modelTurn) ? (
              <Tag position={[0, -0.25, 0.85]} tone={scenario === "model" && turn.t === modelTurn ? "rose" : "muted"} size="xs" center>{scenario === "model" && turn.t === modelTurn ? "/model" : "t" + turn.t}</Tag>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function BillBench({ scenario, modelTurn }: { scenario: Scenario; modelTurn: number }) {
  return (
    <PointerTilt amount={0.05}>
      <group position={[0, -0.3, 0]}>
        <ShadowBlob position={[0, -0.82, 0.2]} scale={9.5} opacity={0.12} />
        <RoundedBox position={[0, -0.65, 0.2]} args={[9.0, 0.32, 2.4]} radius={0.15} smoothness={4} castShadow receiveShadow>
          <BMat color={PB.wood} clear={0.2} rough={0.62} />
        </RoundedBox>
        <RoundedBox position={[0, -0.46, 0.2]} args={[8.7, 0.06, 2.1]} radius={0.03} smoothness={3} receiveShadow>
          <BMat color={PB.woodTop} clear={0.3} rough={0.5} />
        </RoundedBox>
        <TurnColumns scenario={scenario} modelTurn={modelTurn} />
        <Tag position={[-4.25, 1.5, -0.05]} tone="ink" size="xs">tokens por turno</Tag>
        <Tag position={[-4.3, -0.15, 0.6]} tone="violet" size="xs">coste</Tag>
      </group>
    </PointerTilt>
  );
}

const SCEN: Record<Scenario, { label: string; text: string }> = {
  good: { label: "Hora en efímero", text: "Solo el primer turno escribe la caché; desde el segundo, prefijo e historial previo se leen con descuento y solo se paga lo nuevo." },
  clock: { label: "Hora en stable", text: "El timestamp al inicio del system prompt cambia cada turno: todos los turnos son fríos y se paga el historial entero una y otra vez." },
  model: { label: "/model a mitad", text: "Cambiar de modelo cambia la clave de caché: ese turno relee todo a precio completo; después la caché del nuevo modelo vuelve a calentarse." },
};

function SpanishVisual() {
  const [scenario, setScenario] = useState<Scenario>("model");
  const [modelTurn, setModelTurn] = useState(7);
  const sim = simulateTurns(scenario, modelTurn);
  const base = simulateTurns("good", modelTurn);
  const ratio = sim.cost / base.cost;
  return (
    <Figure
      label="La factura turno a turno · dónde se rompe el prefijo"
      hint="12 turnos · caché leída al 10 %"
      height="h-[420px] md:h-[500px]"
      legend={[
        { color: P.teal, label: "tokens leídos de caché" },
        { color: P.amber, label: "tokens nuevos" },
        { color: P.rose, label: "turno frío (todo a precio completo)" },
        { color: P.violet, label: "coste relativo del turno" },
      ]}
      controls={
        <>
          <Switcher value={scenario} onChange={setScenario} ariaLabel="Escenario" options={(Object.keys(SCEN) as Scenario[]).map((id) => ({ value: id, label: SCEN[id].label, tone: id === "good" ? P.teal : P.rose }))} />
          {scenario === "model" ? <Knob label="turno del /model" value={modelTurn} min={2} max={TURNS} onChange={setModelTurn} tone="var(--rose)" /> : null}
        </>
      }
      note={
        <div className="space-y-3">
          <p><strong>{SCEN[scenario].label}.</strong> {SCEN[scenario].text}</p>
          <Readout
            items={[
              { label: "tokens enviados", value: fmtK(sim.tokens / 1000) + " mil", tone: "var(--ink)" },
              { label: "coste equivalente", value: fmtK(sim.cost / 1000) + " mil tokens", tone: "var(--violet)" },
              { label: "frente a hora en efímero", value: "×" + fmtK(ratio), tone: ratio > 1.05 ? "var(--rose)" : "var(--teal)" },
            ]}
          />
          <p className="rounded border border-line bg-paper p-2 font-mono text-xs">coste del turno = tokens nuevos × 1 + tokens en caché × {String(CACHE_READ).replace(".", ",")}</p>
          <p className="text-xs text-muted">Modelo didáctico: prefijo congelado de {fmtK(PREFIX)} tokens, historial +{HISTORY_STEP} por turno, {NEW_PER_TURN} tokens nuevos por turno. El 10 % corresponde al precio de lectura de caché de Anthropic; se ignora el recargo de escritura y la caducidad de la caché. El arreglo del /model: la identidad del modelo va en la cabecera de la llamada, nunca dentro del system prompt, y aun así el cambio cuesta un turno frío.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 5.0, 9.2], fov: 34 }} fit={1.08}>
        <BillBench scenario={scenario} modelTurn={modelTurn} />
      </Stage>
    </Figure>
  );
}
