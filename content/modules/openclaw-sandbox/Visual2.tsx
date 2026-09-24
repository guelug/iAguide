"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Figure, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Arrow, Halo, Motes, Node3D, PointerTilt, Ribbon, ShadowBlob, Slab, Tag, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * El muro de papel.
 *
 * La tool policy filtra por nombre: saca cartuchos del inventario, pero no
 * inspecciona lo que hace una tool que queda dentro. Si exec sigue
 * permitido, denegar write no protege los archivos: el shell puede
 * escribirlos. El inventario se calcula con deny (grupos expandidos) y
 * allow; el archivo del proyecto recibe una flecha por cada camino de
 * escritura que sobrevive. Grupos reducidos a las tools de la lámina.
 */

type ToolId = "read" | "write" | "edit" | "exec" | "process" | "browser";
type DenySet = "none" | "write" | "fs" | "fs+runtime";

const BAYS: { group: string; tools: ToolId[] }[] = [
  { group: "group:fs", tools: ["read", "write", "edit"] },
  { group: "group:runtime", tools: ["exec", "process"] },
  { group: "browser", tools: ["browser"] },
];
const DENY: Record<DenySet, { label: string; tools: ToolId[] }> = {
  none: { label: "deny vacío", tools: [] },
  write: { label: "deny write, edit", tools: ["write", "edit"] },
  fs: { label: "deny group:fs", tools: ["read", "write", "edit"] },
  "fs+runtime": { label: "deny group:fs + group:runtime", tools: ["read", "write", "edit", "exec", "process"] },
};
const ALLOW_READ = ["read", "browser"] as ToolId[];
const WRITES_DIRECT: ToolId[] = ["write", "edit"];
const WRITES_VIA_SHELL: ToolId[] = ["exec", "process"];

function inventory(deny: DenySet, allowList: boolean) {
  const denied = new Set(DENY[deny].tools);
  const available = BAYS.flatMap((b) => b.tools).filter((t) => !denied.has(t) && (!allowList || ALLOW_READ.includes(t)));
  const direct = available.filter((t) => WRITES_DIRECT.includes(t));
  const shell = available.filter((t) => WRITES_VIA_SHELL.includes(t));
  return { denied, available: new Set(available), direct, shell, paper: direct.length === 0 && shell.length > 0 && denied.size > 0 };
}

function Physical({ color, rough = 0.42, coat = 0.45, metal = 0.03 }: { color: string; rough?: number; coat?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} clearcoatRoughness={0.28} />;
}

const TOOL_COLOR: Record<ToolId, string> = { read: P.teal, write: P.amber, edit: P.amber, exec: P.rose, process: P.rose, browser: P.violet };
const bayZ = (b: number) => (b - 1) * 1.15;
const slotX = (k: number) => -3.25 + k * 0.72;
const DOC: V3 = [2.3, 0, 0];

function Cartridge({ tool, x, z, state }: { tool: ToolId; x: number; z: number; state: "on" | "denied" | "notAllowed" }) {
  const color = TOOL_COLOR[tool];
  const lifted = state === "denied";
  return (
    <group position={[x, lifted ? 1.25 : 0.2, z]} rotation={lifted ? [0.25, 0, 0.35] : [0, 0, 0]}>
      <RoundedBox args={[0.5, 0.62, 0.62]} position={[0, 0.31, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <Physical color={state === "on" ? color : state === "denied" ? mixHex(P.paper, P.rose, 0.45) : "#C9C3B5"} coat={0.55} />
      </RoundedBox>
      <mesh position={[0, 0.5, 0.315]}><boxGeometry args={[0.36, 0.1, 0.01]} /><meshBasicMaterial color={state === "on" ? "#F4EFE4" : "#E3DED2"} /></mesh>
      <Tag position={[0, 0.95, 0]} tone={state === "on" ? (tool === "read" ? "teal" : tool === "browser" ? "violet" : tool === "exec" || tool === "process" ? "rose" : "amber") : "muted"} size="xs" center>{tool}</Tag>
    </group>
  );
}

function Rack({ inv }: { inv: ReturnType<typeof inventory> }) {
  return (
    <group>
      <RoundedBox args={[3.9, 0.2, 3.8]} position={[-2.0, 0.0, 0]} radius={0.06} smoothness={3} castShadow receiveShadow><Physical color="#263532" metal={0.3} coat={0.3} /></RoundedBox>
      {BAYS.map((bay, b) => (
        <group key={bay.group}>
          <RoundedBox args={[3.6, 0.1, 0.95]} position={[-2.0, 0.14, bayZ(b)]} radius={0.03} smoothness={2} receiveShadow><Physical color="#4A3A2C" rough={0.6} coat={0.2} /></RoundedBox>
          {bay.tools.map((t, k) => (
            <Cartridge key={t} tool={t} x={slotX(k)} z={bayZ(b)} state={inv.denied.has(t) ? "denied" : inv.available.has(t) ? "on" : "notAllowed"} />
          ))}
          <Tag position={[-0.15, 0.25, bayZ(b)]} tone="muted" size="xs" center>{bay.group}</Tag>
        </group>
      ))}
    </group>
  );
}

function ProjectFile({ exposed, via }: { exposed: boolean; via: "direct" | "shell" | "none" }) {
  return (
    <group position={DOC}>
      <RoundedBox args={[1.5, 0.2, 1.9]} position={[0, 0.1, 0]} radius={0.05} smoothness={3} castShadow receiveShadow><Physical color="#D2CCBE" coat={0.25} /></RoundedBox>
      {[0, 1, 2].map((k) => (
        <RoundedBox key={k} args={[1.05, 0.03, 1.4]} position={[0.03 * k, 0.24 + k * 0.04, -0.03 * k]} radius={0.01} smoothness={1} castShadow><Physical color="#F4EFE4" rough={0.8} coat={0.05} /></RoundedBox>
      ))}
      {[0.4, 0.2, 0, -0.2].map((z) => <mesh key={z} position={[0.05, 0.345, z]}><boxGeometry args={[0.8, 0.005, 0.04]} /><meshBasicMaterial color={exposed ? P.rose : "#B9B1A0"} /></mesh>)}
      {!exposed && (
        <group position={[0.55, 0.55, 0.75]}>
          <mesh castShadow><boxGeometry args={[0.3, 0.24, 0.12]} /><meshStandardMaterial color={P.teal} metalness={0.4} roughness={0.35} /></mesh>
          <mesh position={[0, 0.17, 0]}><torusGeometry args={[0.09, 0.025, 8, 20, Math.PI]} /><meshStandardMaterial color="#9C9C94" metalness={0.8} roughness={0.25} /></mesh>
        </group>
      )}
      {exposed && <Halo position={[0, 0.3, 0]} radius={1.05} color={P.rose} opacity={0.45} spin={0.2} />}
      <Tag position={[0, -0.05, 1.2]} tone={exposed ? "rose" : "teal"} size="xs" center>{exposed ? (via === "shell" ? "escribible vía shell" : "escribible") : "a salvo"}</Tag>
    </group>
  );
}

function PaperScene({ inv }: { inv: ReturnType<typeof inventory> }) {
  const exposed = inv.direct.length + inv.shell.length > 0;
  const via = inv.direct.length ? "direct" : inv.shell.length ? "shell" : "none";
  const where = (t: ToolId): V3 => {
    const b = BAYS.findIndex((bay) => bay.tools.includes(t));
    return [slotX(BAYS[b].tools.indexOf(t)), 0.85, bayZ(b)];
  };
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -0.15, 0]} scale={9} opacity={0.07} />
        <RoundedBox args={[9.0, 0.16, 4.8]} position={[-0.4, -0.18, 0]} radius={0.06} smoothness={3} receiveShadow><Physical color="#6E5440" rough={0.6} coat={0.15} /></RoundedBox>
        <Rack inv={inv} />
        <ProjectFile exposed={exposed} via={via} />
        {inv.direct.map((t) => <Arrow key={t} from={where(t)} to={[DOC[0] - 0.7, 0.5, DOC[2] - 0.2]} color={P.amber} width={2} bow={0.4} />)}
        {inv.shell.map((t) => <Arrow key={t} from={where(t)} to={[DOC[0] - 0.7, 0.45, DOC[2] + 0.3]} color={P.rose} width={2} dashed bow={0.5} />)}
        {inv.paper && <Tag position={[0.2, 1.8, 0.4]} tone="rose" size="xs" center>muro de papel</Tag>}
      </group>
    </PointerTilt>
  );
}

function SpanishVisual() {
  const [deny, setDeny] = useState<DenySet>("write");
  const [allowList, setAllowList] = useState(false);
  const inv = useMemo(() => inventory(deny, allowList), [deny, allowList]);
  const list = (xs: ToolId[]) => (xs.length ? xs.join(", ") : "ninguna");
  const available = BAYS.flatMap((b) => b.tools).filter((t) => inv.available.has(t));
  const verdict = inv.paper
    ? <>Has denegado <code>{DENY[deny].tools.filter((t) => WRITES_DIRECT.includes(t)).join(", ") || "write"}</code>, pero <code>{list(inv.shell)}</code> sigue en el inventario. La política filtra por nombre y no mira dentro de exec: un <code>echo … &gt; archivo</code> escribe igual. <strong>Muro de papel.</strong> Para un agente de solo lectura, deniega también <code>group:runtime</code>.</>
    : inv.direct.length + inv.shell.length === 0
      ? <>No queda ninguna tool que escriba: ni <code>write</code>/<code>edit</code> ni un shell. El archivo está a salvo por política (la del sistema de archivos del sandbox es otra capa).</>
      : <>Hay caminos de escritura directos (<code>{list(inv.direct)}</code>){inv.shell.length ? <> y por shell (<code>{list(inv.shell)}</code>)</> : null}. Nada impide modificar el proyecto.</>;
  return (
    <Figure
      label="El muro de papel · la política filtra nombres, no efectos"
      hint="group:fs sostiene write · group:runtime sostiene exec"
      height="h-[440px] md:h-[540px]"
      legend={[{ color: P.amber, label: "escritura directa" }, { color: P.rose, label: "shell / denegada" }, { color: P.teal, label: "lectura" }, { color: P.violet, label: "browser" }]}
      controls={
        <>
          <Switcher value={deny} onChange={setDeny} ariaLabel="tools.deny" options={(Object.keys(DENY) as DenySet[]).map((d) => ({ value: d, label: DENY[d].label, tone: d === "none" ? P.muted : P.rose }))} />
          <Switcher value={allowList ? "list" : "empty"} onChange={(v) => setAllowList(v === "list")} ariaLabel="tools.allow" options={[{ value: "empty", label: "allow vacío", tone: P.muted }, { value: "list", label: "allow: read, browser", tone: P.violet }]} />
        </>
      }
      note={
        <div className="space-y-3">
          <p>{verdict}</p>
          <Readout items={[
            { label: "disponibles", value: list(available), tone: "var(--teal)" },
            { label: "denegadas", value: list([...inv.denied]), tone: "var(--rose)" },
            { label: "¿puede escribir?", value: inv.direct.length + inv.shell.length ? (inv.direct.length ? "sí, directo" : "sí, vía shell") : "no", tone: inv.direct.length + inv.shell.length ? "var(--rose)" : "var(--teal)" },
          ]} />
          <p className="text-xs text-muted">Reglas: deny siempre gana; si allow no está vacío, todo lo que no nombra queda bloqueado. Los grupos se muestran reducidos a las tools de la lámina; copia la tabla de grupos de la página que estés enseñando.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0.6, 6.0, 8.4], fov: 34 }} fit={1.06}>
        <PaperScene inv={inv} />
      </Stage>
    </Figure>
  );
}

/* ---------------------------------------------------------------- legacy (EN, intacto) */

type Mode = "layers" | "explain" | "elevated";
const COPY = {
  en: { title: "three controls, three answers", hint: "where · what · escape hatch", layers: "layers", explain: "explain", elevated: "elevated", sandbox: "sandbox", policy: "tool policy", exec: "exec", where: "where tools run", what: "what exists", deny: "deny wins", host: "host", container: "container", blocked: "blocked" },
  es: { title: "tres controles, tres respuestas", hint: "dónde · qué · escape hatch", layers: "capas", explain: "explica", elevated: "elevated", sandbox: "sandbox", policy: "política tools", exec: "exec", where: "dónde corren", what: "qué existe", deny: "deny gana", host: "host", container: "contenedor", blocked: "bloqueado" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("layers");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.sandbox }, { color: P.violet, label: t.policy }, { color: P.rose, label: t.exec }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "layers", label: t.layers, tone: P.teal }, { value: "explain", label: t.explain, tone: P.violet }, { value: "elevated", label: t.elevated, tone: P.rose }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "layers" && <><Slab position={[0, 0.35, 0]} size={[4.7, 1.65, 0.12]} color={P.teal} fill={0.12} rim={0.7} /><Slab position={[0, 0.35, 0.08]} size={[3.65, 1.12, 0.08]} color={P.violet} fill={0.16} /><Slab position={[0, 0.35, 0.16]} size={[2.55, 0.6, 0.06]} color={P.rose} fill={0.23} /><Tag position={[-1.7, 0.82, 0.2]} tone="teal" size="xs">{t.sandbox} · {t.where}</Tag><Tag position={[0, 0.62, 0.25]} tone="violet" size="xs">{t.policy} · {t.what}</Tag><Tag position={[1.15, 0.42, 0.3]} tone="rose" size="xs">{t.exec}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">deny → hard stop</Tag></>}
        {mode === "explain" && <><Slab position={[-1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.teal} fill={0.23} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.where}</Tag><Ribbon points={[[-0.7, 0.2, 0], [0.7, 0.2, 0]]} color={P.lineStrong} radius={0.045} opacity={0.8} /><Slab position={[1.7, 0.2, 0]} size={[1.65, 0.9, 0.12]} color={P.violet} fill={0.23} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.what}</Tag><Node3D position={[0, -0.85, 0]} color={P.amber} radius={0.16} pulse={0.3} /><Tag position={[0, -0.42, 0.15]} tone="amber" size="xs">sandbox explain</Tag></>}
        {mode === "elevated" && <><Halo position={[0, 0.2, 0]} radius={1.25} color={P.rose} opacity={0.34} spin={0.12} /><Node3D position={[0, 0.2, 0]} color={P.rose} radius={0.22} pulse={0.45} /><Tag position={[0, 0.8, 0.15]} tone="rose">{t.exec}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Slab position={[-2, 0.2, 0]} size={[1.35, 0.65, 0.1]} color={P.teal} fill={0.24} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">{t.container}</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.rose} radius={0.06} opacity={0.95} /><Slab position={[2, 0.2, 0]} size={[1.35, 0.65, 0.1]} color={P.rose} fill={0.24} /><Tag position={[2, 0.65, 0.15]} tone="rose" size="xs">{t.host}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">{t.deny}: elevated no otorga tools</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}
