"use client";
import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { Readout } from "@/components/three/Figure";
import { Arrow, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

type Mode = "token" | "next" | "invent";
const COPY = {
  en: {
    title: "the model only ever continues",
    hint: "pieces · next token · fluent guess",
    token: "token",
    next: "next",
    invent: "invents",
    word: "word",
    piece: "piece",
    eos: "EOS",
    fact: "no row",
    fluent: "fluent",
    tokenNote: "count tokens, not characters",
    nextNote: "pick · append · repeat",
    inventNote: "sounds right ≠ is true",
    candidates: "candidates",
  },
  es: {
    title: "el modelo solo continúa",
    hint: "piezas · siguiente · conjetura fluida",
    token: "token",
    next: "siguiente",
    invent: "inventa",
    word: "palabra",
    piece: "pieza",
    eos: "EOS",
    fact: "sin fila",
    fluent: "fluido",
    tokenNote: "cuenta tokens, no caracteres",
    nextNote: "elige · añade · repite",
    inventNote: "suena bien ≠ es cierto",
    candidates: "candidatos",
  },
};

/* A word slab splits into uneven token chips: width is the message. */
function TokenScene({ t }: { t: (typeof COPY)["es"] }) {
  const chips: { w: number; x: number; color: string }[] = [
    { w: 0.9, x: -1.6, color: P.teal },
    { w: 0.55, x: -0.85, color: P.tealDeep },
    { w: 1.1, x: 0.0, color: P.violet },
    { w: 0.4, x: 0.78, color: P.amber },
    { w: 0.72, x: 1.42, color: P.teal },
  ];
  return (
    <>
      <Slab position={[-0.1, 0.55, -0.35]} size={[2.6, 0.5, 0.1]} color={P.inkSoft} fill={0.1} rim={0.5} />
      <Tag position={[-0.1, 0.98, -0.3]} tone="muted" size="xs" center>
        {t.word}
      </Tag>
      <Flow points={[[-0.1, 0.42, -0.3], [-0.1, 0.16, -0.1], [-0.1, 0, 0]]} color={P.inkSoft} count={3} size={0.035} lineOpacity={0.3} />
      {chips.map((chip, i) => (
        <group key={i} position={[chip.x, -0.18, 0.15]}>
          <RoundedBox args={[chip.w, 0.42, 0.24]} radius={0.07} smoothness={4}>
            <meshStandardMaterial color={chip.color} roughness={0.38} metalness={0.04} />
          </RoundedBox>
        </group>
      ))}
      <Tag position={[0.1, 0.42, 0.3]} tone="teal" size="xs" center>
        {t.piece} × 5
      </Tag>
    </>
  );
}

/* The stream so far, then a fan of candidates — one gets picked. */
function NextScene({ t }: { t: (typeof COPY)["es"] }) {
  const past = [-2.2, -1.45, -0.7];
  const fan: { y: number; p: number; color: string; hot: boolean }[] = [
    { y: 0.42, p: 0.62, color: P.amber, hot: true },
    { y: 0.05, p: 0.28, color: P.violet, hot: false },
    { y: -0.32, p: 0.1, color: P.violet, hot: false },
  ];
  return (
    <>
      {past.map((x, i) => (
        <Node3D key={x} position={[x, 0.05, 0]} color={P.teal} radius={0.15} pulse={0.2 + i * 0.25} />
      ))}
      <Flow points={[[past[0], 0.05, 0], [past[2], 0.05, 0]]} color={P.teal} count={4} speed={0.24} />
      {fan.map((f, i) => (
        <group key={i}>
          <Wire points={[[-0.35, 0.05, 0], [0.9, f.y, 0]]} color={f.color} opacity={f.hot ? 0.85 : 0.3} width={f.hot ? 1.8 : 1.1} dashed={!f.hot} />
          <Node3D position={[1.35, f.y, 0]} color={f.color} radius={f.hot ? 0.19 : 0.12} pulse={f.hot ? 0.4 : 0} />
          <Ribbon points={[[1.75, f.y, 0], [1.75 + f.p * 1.1, f.y, 0]]} color={f.color} radius={0.028} opacity={f.hot ? 0.9 : 0.4} />
        </group>
      ))}
      <Tag position={[1.35, 0.82, 0.15]} tone="amber" size="xs" center>
        {t.candidates}
      </Tag>
      <Halo position={[2.6, 0.05, 0]} radius={0.34} color={P.rose} opacity={0.5} spin={0.18} />
      <Tag position={[2.6, -0.45, 0.15]} tone="rose" size="xs" center>
        {t.eos}
      </Tag>
    </>
  );
}

/* A question looks for its row, finds an empty slot, answers fluently anyway. */
function InventScene({ t }: { t: (typeof COPY)["es"] }) {
  const rows = [-0.36, -0.12, 0.12, 0.36];
  return (
    <>
      <Node3D position={[-2.15, 0.15, 0]} color={P.teal} radius={0.18} pulse={0.3} />
      <Flow points={[[-1.85, 0.15, 0], [-1.15, 0.15, 0]]} color={P.teal} count={3} />
      <group position={[-0.35, 0.1, 0]}>
        <Slab position={[0, 0, 0]} size={[1.3, 1.15, 0.12]} color={P.violet} fill={0.14} />
        {rows.map((y, i) => (
          <Ribbon key={y} points={[[-0.45, y, 0.09], [0.45, y, 0.09]]} color={i === 2 ? P.rose : P.violet} radius={i === 2 ? 0.014 : 0.03} opacity={i === 2 ? 0.9 : 0.75} />
        ))}
        <Tag position={[0, 0.82, 0.15]} tone="rose" size="xs" center>
          {t.fact}
        </Tag>
      </group>
      <Flow points={[[0.45, 0.15, 0], [1.15, 0.15, 0]]} color={P.rose} count={3} />
      <group position={[1.85, 0.15, 0]}>
        <Ribbon points={[[-0.5, -0.18, 0.1], [-0.2, 0.08, 0.1], [0.15, -0.05, 0.1], [0.5, 0.14, 0.1]]} color={P.rose} radius={0.045} opacity={0.9} />
        <Halo position={[0, 0, 0]} radius={0.55} color={P.rose} opacity={0.3} spin={-0.14} />
        <Tag position={[0, 0.82, 0.15]} tone="rose" size="xs" center>
          {t.fluent}
        </Tag>
      </group>
    </>
  );
}

export default function Visual3() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}


function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("token");
  const note = mode === "token" ? t.tokenNote : mode === "next" ? t.nextNote : t.inventNote;
  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.piece },
        { color: P.violet, label: t.next },
        { color: P.rose, label: t.invent },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "token", label: t.token, tone: P.teal },
            { value: "next", label: t.next, tone: P.violet },
            { value: "invent", label: t.invent, tone: P.rose },
          ]}
          ariaLabel={t.title}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }} background={P.paper}>
        <Motes count={110} radius={7} color={P.lineStrong} size={0.024} opacity={0.22} />
        <PointerTilt amount={0.08}>
          {mode === "token" && <TokenScene t={t} />}
          {mode === "next" && <NextScene t={t} />}
          {mode === "invent" && <InventScene t={t} />}
          <ShadowBlob position={[0, -1.02, 0]} scale={4.2} opacity={0.07} />
          <Tag position={[0, -0.95, 0.15]} tone="muted" size="xs" center>
            {note}
          </Tag>
        </PointerTilt>
      </Stage>
    </Figure>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Componedora de tokens. El prompt entra ya troceado en piezas; en cada
 * paso el modelo puntúa candidatos (logits didácticos fijos), softmax los
 * convierte en probabilidades y la decodificación voraz toma el mayor. El
 * bucle para al emitir <EOS>. Con un hecho que no estaba en el
 * entrenamiento, la distribución es plana y aun así sale una frase segura.
 */

type Prompt = "known" | "unknown";
type Cand = { t: string; logit: number };

const PROMPTS: Record<Prompt, { pieces: string[]; steps: Cand[][] }> = {
  known: {
    pieces: ["La", " capital", " de", " Francia", " es"],
    steps: [
      [{ t: " París", logit: 6.1 }, { t: " una", logit: 2.4 }, { t: " Lyon", logit: 2.0 }, { t: " la", logit: 1.8 }, { t: " Roma", logit: 1.2 }, { t: " Madrid", logit: 1.0 }],
      [{ t: ".", logit: 4.6 }, { t: ",", logit: 2.2 }, { t: " y", logit: 1.6 }, { t: " (", logit: 0.9 }, { t: " en", logit: 0.9 }, { t: "<EOS>", logit: 1.1 }],
      [{ t: "<EOS>", logit: 5.2 }, { t: " Es", logit: 2.1 }, { t: " Su", logit: 1.7 }, { t: " La", logit: 1.5 }, { t: "\\n", logit: 1.4 }, { t: " Tiene", logit: 1.0 }],
    ],
  },
  unknown: {
    pieces: ["El", " gan", "ador", " del", " Mundial", " de", " 20", "34", " fue"],
    steps: [
      [{ t: " Brasil", logit: 2.3 }, { t: " España", logit: 2.2 }, { t: " Argentina", logit: 2.1 }, { t: " Francia", logit: 2.0 }, { t: " Alemania", logit: 1.9 }, { t: " Marruecos", logit: 1.4 }],
      [{ t: ",", logit: 2.6 }, { t: ".", logit: 2.5 }, { t: " tras", logit: 2.0 }, { t: " con", logit: 1.9 }, { t: " al", logit: 1.5 }, { t: "<EOS>", logit: 1.2 }],
      [{ t: " tras", logit: 2.8 }, { t: " que", logit: 2.3 }, { t: " con", logit: 2.2 }, { t: " en", logit: 1.8 }, { t: " el", logit: 1.6 }, { t: "<EOS>", logit: 1.3 }],
      [{ t: " vencer", logit: 3.0 }, { t: " ganar", logit: 2.6 }, { t: " una", logit: 2.0 }, { t: " un", logit: 1.9 }, { t: " derrotar", logit: 1.8 }, { t: "<EOS>", logit: 0.9 }],
      [{ t: " en", logit: 2.7 }, { t: " a", logit: 2.6 }, { t: " por", logit: 1.7 }, { t: " la", logit: 1.5 }, { t: " al", logit: 1.4 }, { t: "<EOS>", logit: 1.0 }],
      [{ t: " la", logit: 3.1 }, { t: " una", logit: 2.1 }, { t: " el", logit: 2.0 }, { t: " penaltis", logit: 1.9 }, { t: " Europa", logit: 1.2 }, { t: "<EOS>", logit: 1.0 }],
      [{ t: " final", logit: 4.0 }, { t: " prórroga", logit: 2.4 }, { t: " tanda", logit: 2.0 }, { t: " semifinal", logit: 1.8 }, { t: " copa", logit: 1.0 }, { t: "<EOS>", logit: 0.9 }],
      [{ t: ".", logit: 4.2 }, { t: ",", logit: 2.5 }, { t: " de", logit: 2.1 }, { t: " contra", logit: 1.8 }, { t: " del", logit: 1.3 }, { t: "<EOS>", logit: 1.6 }],
      [{ t: "<EOS>", logit: 4.8 }, { t: " El", logit: 2.3 }, { t: " Fue", logit: 2.0 }, { t: " La", logit: 1.6 }, { t: "\\n", logit: 1.5 }, { t: " Su", logit: 1.1 }],
    ],
  },
};

function softmax(c: Cand[]) {
  const mx = Math.max(...c.map((x) => x.logit));
  const e = c.map((x) => Math.exp(x.logit - mx));
  const z = e.reduce((a, b) => a + b, 0);
  return c.map((x, i) => ({ ...x, p: e[i] / z }));
}

/** Greedy decode up to `step` tokens; each generated token keeps its winning probability. */
function decode(prompt: Prompt, step: number) {
  const spec = PROMPTS[prompt];
  const gen: { t: string; p: number }[] = [];
  for (let i = 0; i < Math.min(step, spec.steps.length); i += 1) {
    const probs = softmax(spec.steps[i]);
    const best = probs.reduce((a, b) => (b.p > a.p ? b : a));
    gen.push({ t: best.t, p: best.p });
    if (best.t === "<EOS>") break;
  }
  const done = gen.at(-1)?.t === "<EOS>";
  const next = !done && step < spec.steps.length ? softmax(spec.steps[step]) : null;
  return { pieces: spec.pieces, gen, next, done, maxSteps: spec.steps.length };
}

const PCT = (p: number) => `${(p * 100).toLocaleString("es-ES", { maximumFractionDigits: 0 })} %`;

function TMat({ color, rough = 0.45, coat = 0.45, metal = 0 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.3} />;
}

const tileW = (t: string) => Math.min(1.05, 0.2 + t.replace(/^ /, "").length * 0.075);

function rowLayout(tokens: string[], z: number) {
  const gap = 0.07;
  const ws = tokens.map(tileW);
  const total = ws.reduce((a, b) => a + b, 0) + gap * Math.max(0, tokens.length - 1);
  let x = -total / 2;
  return tokens.map((t, i) => {
    const item = { t, w: ws[i], pos: [x + ws[i] / 2, -0.86, z] as V3 };
    x += ws[i] + gap;
    return item;
  });
}

function TypeTile({ t, w, pos, color, label }: { t: string; w: number; pos: V3; color: string; label: "ink" | "teal" | "rose" | "muted" }) {
  return (
    <group position={pos}>
      <RoundedBox args={[w, 0.26, 0.42]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <TMat color={color} />
      </RoundedBox>
      <Tag position={[0, 0.2, 0.12]} tone={label} size="xs" center plate={false}>
        <span className="normal-case">{t === "<EOS>" ? "EOS" : t.replace(/^ /, "·")}</span>
      </Tag>
    </group>
  );
}

function Compositor({ prompt, step }: { prompt: Prompt; step: number }) {
  const d = useMemo(() => decode(prompt, step), [prompt, step]);
  const promptRow = rowLayout(d.pieces, 0.55);
  const genRow = rowLayout(d.gen.length ? d.gen.map((g) => g.t) : [" "], 1.3);
  const bars = d.next ?? [];
  const best = bars.length ? bars.reduce((a, b) => (b.p > a.p ? b : a)) : null;
  const genEnd: V3 = d.gen.length ? [genRow[genRow.length - 1].pos[0] + genRow[genRow.length - 1].w / 2 + 0.3, -0.8, 1.3] : [0, -0.8, 1.3];
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -1.46, 0.4]} scale={9.5} opacity={0.12} />
        <RoundedBox args={[8.6, 0.3, 4.0]} position={[0, -1.25, 0.35]} radius={0.15} smoothness={4} castShadow receiveShadow>
          <TMat color="#40362d" rough={0.62} coat={0.2} />
        </RoundedBox>
        <RoundedBox args={[8.3, 0.08, 3.7]} position={[0, -1.07, 0.35]} radius={0.04} smoothness={2} receiveShadow>
          <TMat color="#6b513a" rough={0.5} coat={0.25} />
        </RoundedBox>
        {/* composing sticks */}
        {[0.55, 1.3].map((z) => (
          <RoundedBox key={z} args={[7.4, 0.08, 0.56]} position={[0, -1.01, z]} radius={0.03} smoothness={2} receiveShadow castShadow>
            <TMat color="#b68442" metal={0.55} rough={0.3} coat={0.2} />
          </RoundedBox>
        ))}
        {promptRow.map((r, i) => <TypeTile key={`p${i}`} t={r.t} w={r.w} pos={r.pos} color={mixHex(P.paper, P.inkSoft, 0.18)} label="ink" />)}
        {d.gen.map((g, i) => (
          <TypeTile key={`g${i}`} t={g.t} w={genRow[i].w} pos={genRow[i].pos} color={g.t === "<EOS>" ? mixHex(P.paper, P.rose, 0.5) : mixHex(P.paper, P.teal, 0.25 + 0.6 * g.p)} label={g.t === "<EOS>" ? "rose" : "teal"} />
        ))}
        <Tag position={[-4.1, -0.7, 0.55]} tone="muted" size="xs" center>prompt</Tag>
        <Tag position={[-4.1, -0.7, 1.3]} tone="teal" size="xs" center>salida</Tag>
        {/* probability organ for the next step */}
        {bars.map((b, i) => {
          const x = -2.75 + i * 1.1;
          const h = 0.08 + b.p * 2.6;
          const on = b === best;
          const col = b.t === "<EOS>" ? P.rose : on ? P.teal : mixHex(P.paper, P.teal, 0.3);
          return (
            <group key={`${step}-${b.t}`} position={[x, -1.0, -0.75]}>
              <RoundedBox args={[0.7, 0.1, 0.7]} position={[0, 0.02, 0]} radius={0.03} smoothness={2} receiveShadow>
                <TMat color="#2a2e33" rough={0.5} />
              </RoundedBox>
              <RoundedBox args={[0.5, h, 0.5]} position={[0, 0.07 + h / 2, 0]} radius={0.06} smoothness={3} castShadow>
                <TMat color={col} />
              </RoundedBox>
              <Tag position={[0, 0.3 + h, 0]} tone={on ? "ink" : "muted"} size="xs" center>
                <span className="normal-case">{`${b.t === "<EOS>" ? "EOS" : b.t.trim()} ${PCT(b.p)}`}</span>
              </Tag>
            </group>
          );
        })}
        {best ? <Arrow from={[-2.75 + bars.indexOf(best) * 1.1, -0.55, -0.3]} to={genEnd} color={P.teal} width={1.6} head={0.12} bow={0.2} /> : null}
        {d.done ? <Tag position={[0, 0.2, -0.75]} tone="rose" center>para en EOS</Tag> : null}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [prompt, setPrompt] = useState<Prompt>("known");
  const [step, setStep] = useState(0);
  const d = decode(prompt, step);
  const last = d.maxSteps;
  const text = d.gen.filter((g) => g.t !== "<EOS>").map((g) => g.t).join("");
  const best = d.next ? d.next.reduce((a, b) => (b.p > a.p ? b : a)) : null;
  const meanP = d.gen.length ? d.gen.reduce((a, g) => a + g.p, 0) / d.gen.length : 0;
  return (
    <Figure
      label="Componedora de tokens · el siguiente, y otra vez, hasta EOS"
      hint="piezas → puntuar → elegir → repetir"
      legend={[{ color: P.inkSoft, label: "piezas del prompt" }, { color: P.teal, label: "token elegido" }, { color: P.rose, label: "EOS" }]}
      note={
        <div className="space-y-2">
          <p>
            <strong>{prompt === "known" ? "Un hábito fuerte." : "Sin una fila que consultar."}</strong>{" "}
            {prompt === "known"
              ? "Tras «La capital de Francia es», París se lleva casi toda la probabilidad. No hay una tabla capital(Francia): hay un hábito de continuación."
              : "El Mundial de 2034 no estaba en el entrenamiento. La distribución es casi plana y la decodificación elige igual: sale una frase fluida y segura que nadie ha comprobado. Eso es inventar."}{" "}
            Fíjate en el prompt: «ganador» son dos piezas y «2034», otras dos.
          </p>
          <Readout items={[
            { label: "paso", value: `${Math.min(step, last)}/${last}`, tone: "var(--ink)" },
            { label: "texto", value: text ? `«${text.trim()}»` : "—", tone: "var(--teal)" },
            { label: "siguiente", value: best ? `${best.t === "<EOS>" ? "EOS" : best.t.trim()} (${PCT(best.p)})` : d.done ? "fin: EOS" : "—", tone: "var(--teal)" },
            { label: "confianza media", value: d.gen.length ? PCT(meanP) : "—", tone: meanP < 0.4 && d.gen.length ? "var(--rose)" : "var(--ink)" },
          ]} />
          <p className="text-xs text-muted">Logits inventados para la lámina; las probabilidades salen de un softmax real sobre ellos y la elección es voraz (temperatura 0). Un modelo real puntúa todo su vocabulario, no seis candidatos.</p>
        </div>
      }
      controls={
        <>
          <Switcher value={prompt} onChange={(v) => { setPrompt(v); setStep(0); }} options={[{ value: "known", label: "Hecho conocido", tone: P.teal }, { value: "unknown", label: "Sin fila", tone: P.rose }]} ariaLabel="Prompt" />
          <div className="flex items-center gap-1 rounded-full border border-line px-1 py-0.5" role="group" aria-label="Pasos de generación">
            <button type="button" className="chip min-w-8 px-2" disabled={step <= 0} aria-label="Paso anterior" onClick={() => setStep(Math.max(0, step - 1))}>←</button>
            <span className="px-1 font-mono text-[0.6rem] tabular-nums text-muted">paso {Math.min(step, last)}/{last}</span>
            <button type="button" className="chip min-w-8 px-2" disabled={d.done} aria-label="Paso siguiente" onClick={() => setStep(step + 1)}>→</button>
          </div>
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.8, 3.6, 10.5], fov: 34 }} fit={1.05}>
        <Compositor prompt={prompt} step={step} />
      </Stage>
    </Figure>
  );
}
