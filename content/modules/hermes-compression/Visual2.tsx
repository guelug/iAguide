"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * La clave de caché es el prefijo.
 *
 * Dos filas de mensajes: la petición anterior (atrás) y la actual (delante).
 * Los clips de latón son los cuatro breakpoints cache_control de
 * system_and_3: el system prompt y los tres últimos mensajes no system.
 * El modelo de caché es explícito: el proveedor guardó los prefijos que
 * terminaban en un breakpoint de la petición anterior; la petición actual
 * acierta el más largo de esos prefijos que siga idéntico byte a byte y con
 * el mismo modelo. Todo lo demás se relee a precio de input sin descuento.
 */

type Item = { id: string; kind: "system" | "user" | "assistant" | "tool" | "summary"; tokens: number };
type CacheEvent = "turn" | "compact" | "after" | "model";

function unit(i: number) {
  let x = Math.imul(i + 11, 2654435761) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0;
  return ((x ^ (x >>> 13)) >>> 0) / 4294967296;
}

const KIND_CYCLE: Item["kind"][] = ["user", "assistant", "tool", "assistant"];
const msg = (n: number): Item => {
  const kind = KIND_CYCLE[(n - 1) % 4];
  const base = kind === "tool" ? 2400 + unit(n) * 2600 : kind === "user" ? 250 + unit(n) * 500 : 500 + unit(n) * 900;
  return { id: `m${n}`, kind, tokens: Math.round(base) };
};
const SYSTEM: Item = { id: "sys", kind: "system", tokens: 3200 };
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => msg(a + k));
const SUMMARY: Item = { id: "sum", kind: "summary", tokens: 2600 };

/** system_and_3: the system prompt plus the last three non-system messages. */
const breakpoints = (list: Item[]) => new Set([0, list.length - 3, list.length - 2, list.length - 1]);

type Scenario = { prev: Item[]; curr: Item[]; sameModel: boolean };

const SCENARIOS: Record<CacheEvent, Scenario> = {
  turn: { prev: [SYSTEM, ...range(1, 12)], curr: [SYSTEM, ...range(1, 14)], sameModel: true },
  compact: { prev: [SYSTEM, ...range(1, 14)], curr: [SYSTEM, msg(1), msg(2), SUMMARY, ...range(11, 15)], sameModel: true },
  after: { prev: [SYSTEM, msg(1), msg(2), SUMMARY, ...range(11, 15)], curr: [SYSTEM, msg(1), msg(2), SUMMARY, ...range(11, 17)], sameModel: true },
  model: { prev: [SYSTEM, ...range(1, 12)], curr: [SYSTEM, ...range(1, 14)], sameModel: false },
};

function cacheHit({ prev, curr, sameModel }: Scenario) {
  if (!sameModel) return { hitCount: 0, bp: -1 };
  let hitCount = 0;
  let bp = -1;
  breakpoints(prev).forEach((k) => {
    const same = prev.slice(0, k + 1).every((m, j) => curr[j]?.id === m.id);
    if (same && k + 1 > hitCount) { hitCount = k + 1; bp = k; }
  });
  return { hitCount, bp };
}

const tokensOf = (xs: Item[]) => xs.reduce((a, m) => a + m.tokens, 0);
const fmtN = (n: number) => Math.round(n).toLocaleString("es-ES");

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

const SCALE = 8.6 / 24000;
const X0 = -4.3;
const GAP = 0.03;
const KIND_STYLE: Record<Item["kind"], { color: string; h: number }> = {
  system: { color: P.teal, h: 0.95 },
  user: { color: P.amber, h: 0.62 },
  assistant: { color: P.violet, h: 0.5 },
  tool: { color: "#B9B3A4", h: 0.56 },
  summary: { color: P.violetDeep, h: 0.8 },
};

function placeRow(list: Item[]) {
  let cursor = X0;
  return list.map((m) => {
    const w = Math.max(0.06, m.tokens * SCALE);
    const x = cursor + w / 2;
    cursor += w + GAP;
    return { m, x, w, end: cursor - GAP };
  });
}

function Row({ list, z, hitCount, usedBp, dim, label, model, fresh }: { list: Item[]; z: number; hitCount: number; usedBp: number; dim: boolean; label: string; model: string; fresh: boolean }) {
  const placed = placeRow(list);
  const bps = breakpoints(list);
  const hitEnd = hitCount > 0 ? placed[hitCount - 1].end : X0;
  const rowEnd = placed[placed.length - 1].end;
  return (
    <group position={[0, 0, z]}>
      <RoundedBox args={[rowEnd - X0 + 0.5, 0.1, 0.95]} position={[(rowEnd + X0) / 2, -0.05, 0]} radius={0.04} smoothness={2} castShadow receiveShadow>
        <Physical color="#2E3B38" rough={0.45} metal={0.3} coat={0.3} />
      </RoundedBox>
      {placed.map(({ m, x, w }, k) => {
        const st = KIND_STYLE[m.kind];
        const hit = k < hitCount;
        return (
          <group key={m.id} position={[x, 0, 0]}>
            <RoundedBox args={[w, st.h, 0.7]} position={[0, st.h / 2 + 0.01, 0]} radius={Math.min(0.03, w / 3)} smoothness={2} castShadow receiveShadow>
              <Physical color={dim ? mixHex(P.paper, st.color, 0.45) : st.color} coat={0.5} />
            </RoundedBox>
            {/* strip under the slab: teal = read from cache, amber = re-read at full input price */}
            {!dim && <mesh position={[0, 0.012, 0.42]}><boxGeometry args={[w, 0.02, 0.08]} /><meshBasicMaterial color={hit ? P.teal : P.amber} /></mesh>}
            {bps.has(k) && (
              <group position={[0, st.h + 0.06, 0]}>
                <mesh castShadow><boxGeometry args={[Math.min(0.2, w + 0.04), 0.1, 0.76]} /><meshStandardMaterial color={k === usedBp ? P.teal : "#B68442"} metalness={0.7} roughness={0.28} /></mesh>
                {k === usedBp && <Halo position={[0, 0.02, 0]} radius={0.32} color={P.teal} opacity={0.55} spin={0.25} />}
              </group>
            )}
          </group>
        );
      })}
      {/* glass sleeve over the cached prefix */}
      {!dim && hitCount > 0 && (
        <mesh position={[(hitEnd + X0) / 2, 0.55, 0]}>
          <boxGeometry args={[hitEnd - X0 + 0.08, 1.12, 0.84]} />
          <meshPhysicalMaterial color={P.tealWash} transparent opacity={0.26} roughness={0.08} depthWrite={false} />
        </mesh>
      )}
      <group position={[X0 - 0.85, 0, 0]}>
        <RoundedBox args={[0.9, 0.5, 0.7]} position={[0, 0.25, 0]} radius={0.06} smoothness={3} castShadow receiveShadow>
          <Physical color={fresh ? P.rose : "#D8D2C4"} coat={0.4} />
        </RoundedBox>
        <Tag position={[0, 0.78, 0]} tone={fresh ? "rose" : "muted"} size="xs" center>{model}</Tag>
      </group>
      <Tag position={[rowEnd + 0.75, 0.3, 0]} tone={dim ? "muted" : "ink"} size="xs" center>{label}</Tag>
    </group>
  );
}

function CacheScene({ ev }: { ev: CacheEvent }) {
  const sc = SCENARIOS[ev];
  const { hitCount, bp } = cacheHit(sc);
  const prevPlaced = placeRow(sc.prev);
  const matchEnd = hitCount > 0 ? prevPlaced[hitCount - 1].end : X0;
  return (
    <PointerTilt amount={0.035}>
      <group>
        <ShadowBlob position={[0, -0.2, -0.2]} scale={11} opacity={0.08} />
        <RoundedBox args={[11.8, 0.16, 4.2]} position={[0.2, -0.2, -0.35]} radius={0.06} smoothness={3} receiveShadow>
          <Physical color="#6E5440" rough={0.6} coat={0.15} />
        </RoundedBox>
        <Row list={sc.prev} z={-1.5} hitCount={0} usedBp={bp} dim label="anterior" model="modelo A" fresh={false} />
        <Row list={sc.curr} z={0.8} hitCount={hitCount} usedBp={-1} dim={false} label="actual" model={sc.sameModel ? "modelo A" : "modelo B"} fresh={!sc.sameModel} />
        {/* the lookup: the new request checks the prefixes the provider stored at old breakpoints */}
        {hitCount > 0 ? (
          <Flow points={[[matchEnd, 1.15, -1.5], [matchEnd, 1.6, -0.35], [matchEnd, 1.15, 0.8]]} color={P.teal} count={3} size={0.05} speed={0.4} lineOpacity={0.4} />
        ) : (
          <Flow points={[[X0 + 0.3, 1.2, -1.5], [X0 + 0.3, 1.6, -0.35], [X0 + 0.3, 1.2, 0.8]]} color={P.rose} count={2} size={0.05} speed={0.3} lineOpacity={0.3} />
        )}
        <Tag position={[hitCount > 0 ? matchEnd : X0 + 0.3, 1.9, -0.35]} tone={hitCount > 0 ? "teal" : "rose"} size="xs" center>{hitCount > 0 ? "prefijo idéntico" : "sin acierto"}</Tag>
      </group>
    </PointerTilt>
  );
}

const EVENT_TEXT: Record<CacheEvent, { title: string; body: string }> = {
  turn: { title: "Turno normal.", body: "La petición nueva es la anterior más dos mensajes. El prefijo guardado en el último breakpoint anterior sigue idéntico, así que se lee de caché; solo los mensajes nuevos se pagan completos. Los breakpoints 2–4 avanzan con la ventana rodante." },
  compact: { title: "Primera compactación.", body: "El medio se sustituye por un resumen. System y primer intercambio siguen idénticos, pero el único prefijo guardado que todavía coincide es el del breakpoint 1: solo el system prompt acierta. Esto no es un fallo del resumen; es el prefijo que cambió por construcción." },
  after: { title: "Turno siguiente.", body: "Tras la compactación, la nueva lista ya es estable: el turno siguiente vuelve a acertar todo lo anterior. La ventana rodante se restablece en uno o dos turnos." },
  model: { title: "Cambio de modelo.", body: "Mismos bytes, otro modelo (/model, fallback del primario o rotación de pool a otra cuenta). La caché del proveedor está acotada al modelo y a la cuenta: cero aciertos y relectura del historial entero a precio de input. Hermes no puede eludirlo." },
};

function SpanishVisual() {
  const [ev, setEv] = useState<CacheEvent>("turn");
  const sc = SCENARIOS[ev];
  const { hitCount, bp } = useMemo(() => cacheHit(sc), [sc]);
  const total = tokensOf(sc.curr);
  const hit = tokensOf(sc.curr.slice(0, hitCount));
  const text = EVENT_TEXT[ev];
  return (
    <Figure
      label="La clave de caché es el prefijo · system_and_3"
      hint="4 breakpoints · prefijo idéntico · mismo modelo"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.teal, label: "leído de caché" },
        { color: P.amber, label: "relectura completa" },
        { color: "#B68442", label: "breakpoint" },
        { color: P.violetDeep, label: "resumen" },
      ]}
      controls={
        <Switcher value={ev} onChange={setEv} ariaLabel="Evento de la sesión" options={[
          { value: "turn", label: "Turno normal", tone: P.teal },
          { value: "compact", label: "Compactación", tone: P.violet },
          { value: "after", label: "Turno siguiente", tone: P.teal },
          { value: "model", label: "Cambio de modelo", tone: P.rose },
        ]} />
      }
      note={
        <div className="space-y-3">
          <p><strong>{text.title}</strong> {text.body}</p>
          <Readout items={[
            { label: "tokens del prompt", value: fmtN(total) },
            { label: "desde caché", value: fmtN(hit), tone: "var(--teal)" },
            { label: "relectura", value: fmtN(total - hit), tone: "var(--amber)" },
            { label: "acierto", value: `${Math.round((hit / total) * 100)} %`, tone: hit > 0 ? "var(--teal)" : "var(--rose)" },
            { label: "breakpoint usado", value: bp < 0 ? "ninguno" : bp === 0 ? "1 (system)" : `mensaje ${bp}` },
          ]} />
          <p className="text-xs text-muted">Modelo didáctico: el proveedor guardó los prefijos que terminaban en un breakpoint de la petición anterior; se acierta el más largo que siga idéntico y con el mismo modelo. Tamaños de mensaje inventados para poder contar. No se muestran precios: la lección no fija tarifas de lectura de caché.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.8, 6.0, 9.0], fov: 34 }} fit={1.06}>
        <CacheScene ev={ev} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

type Mode="compact"|"drop"|"safeguard";
const COPY={en:{label:"compression is a deliberate loss",hint:"compact · drop tools · safeguard",compact:"compact",drop:"drop tools",safeguard:"safeguard",thread:"thread",summary:"summary",tool:"tool result",keep:"keep",dropLabel:"drop",audit:"audit"},es:{label:"comprimir es perder con intención",hint:"compacta · quita tools · salvaguarda",compact:"compacta",drop:"quita tools",safeguard:"salvaguarda",thread:"hilo",summary:"resumen",tool:"resultado tool",keep:"conserva",dropLabel:"quita",audit:"audita"}};
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("compact");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.keep},{color:P.violet,label:t.summary},{color:P.rose,label:t.dropLabel}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"compact",label:t.compact,tone:P.teal},{value:"drop",label:t.drop,tone:P.rose},{value:"safeguard",label:t.safeguard,tone:P.amber}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="compact"&&<><>{[0,1,2,3,4].map(i=><Slab key={i} position={[-2+i*.8,.7-(i%2)*.3,0]} size={[.7,.5,.1]} color={P.teal} fill={.18}/>)}</><Ribbon points={[[-.3,.5,0],[.6,-.1,0]]} color={P.violet} radius={.05} opacity={.8}/><Slab position={[1.5,-.4,0]} size={[1.6,.8,.14]} color={P.violet} fill={.28}/><Tag position={[1.5,.15,.15]} tone="violet">{t.summary}</Tag><Tag position={[0,-1.1,.15]} tone="muted" size="xs">10k → 200 tokens</Tag></>}
{mode==="drop"&&<>{[[t.keep,P.teal,-1.7],[t.tool,P.rose,0],[t.summary,P.violet,1.7]].map(([lab,col,x],i)=><group key={lab as string}><Slab position={[x as number,.5,0]} size={[1.4,.8,.12]} color={col as string} fill={i===1?.3:.22}/><Tag position={[x as number,1.05,.15]} tone={i===0?"teal":i===1?"rose":"violet"} size="xs">{lab as string}</Tag></group>)}<Ribbon points={[[0,.1,0],[0,-.8,0]]} color={P.rose} radius={.05} opacity={.85}/><Tag position={[0,-1.2,.15]} tone="rose" size="xs">tool result → {t.dropLabel}</Tag></>}
{mode==="safeguard"&&<><Halo position={[0,.4,0]} radius={1.4} color={P.amber} opacity={.45} spin={.12}/><Node3D position={[0,.4,0]} color={P.amber} radius={.2} pulse={.3}/><Tag position={[0,1.0,.15]} tone="amber">{t.audit}</Tag><Slab position={[-2,.4,0]} size={[1.5,.7,.12]} color={P.teal} fill={.24}/><Tag position={[-2,.9,.15]} tone="teal">{t.thread}</Tag><Slab position={[2,.4,0]} size={[1.5,.7,.12]} color={P.rose} fill={.22}/><Tag position={[2,.9,.15]} tone="rose">unsafe input</Tag></>}
</PointerTilt></Stage></Figure>}
