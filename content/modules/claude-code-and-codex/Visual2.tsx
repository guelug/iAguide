"use client";
/* es-imports */
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useRef } from "react";
import { Group } from "three";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { Flow, ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";
/* /es-imports */
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
type Mode="loop"|"diff"|"permissions";
const COPY={en:{label:"coding agents are a loop with a diff",hint:"cli loop · diffs · permissions",loop:"cli loop",diff:"diffs",permissions:"permissions",task:"task",agent:"agent",file:"file",edit:"edit",allowed:"allowed",denied:"denied"},es:{label:"los agentes de código son un bucle con diff",hint:"bucle cli · diffs · permisos",loop:"bucle cli",diff:"diffs",permissions:"permisos",task:"tarea",agent:"agente",file:"fichero",edit:"edita",allowed:"permitido",denied:"denegado"}};
function LegacyVisual(){const t=useCopy(COPY);const [mode,setMode]=useState<Mode>("loop");return <Figure label={t.label} hint={t.hint} legend={[{color:P.teal,label:t.allowed},{color:P.violet,label:t.edit},{color:P.rose,label:t.denied}]} controls={<Switcher value={mode} onChange={setMode} options={[{value:"loop",label:t.loop,tone:P.teal},{value:"diff",label:t.diff,tone:P.violet},{value:"permissions",label:t.permissions,tone:P.rose}]} ariaLabel={t.label}/>}> <Stage className="h-full w-full" camera={{position:[0,.3,8.6],fov:37}}><Motes count={100} radius={7} opacity={.3}/><PointerTilt amount={.07}>
{mode==="loop"&&<><Node3D position={[0,1,0]} color={P.teal} radius={.22} pulse={.3}/><Tag position={[0,1.5,.15]} tone="teal">{t.agent}</Tag><Ribbon points={[[0,.6,0],[-1.6,-.4,0]]} color={P.violet} radius={.04} opacity={.8}/><Slab position={[-2,-.6,0]} size={[1.5,.7,.12]} color={P.violet} fill={.24}/><Tag position={[-2,-.1,.15]} tone="violet" size="xs">{t.file}</Tag><Ribbon points={[[-1.2,-.6,0],[0,.6,0]]} color={P.lineStrong} radius={.03} opacity={.7}/><Halo position={[0,.4,0]} radius={1.45} color={P.teal} opacity={.28} spin={.1}/></>}
{mode==="diff"&&<><Slab position={[-1.5,.5,0]} size={[2,.9,.14]} color={P.rose} fill={.18}/><Tag position={[-1.5,1.1,.15]} tone="rose">old file</Tag><Ribbon points={[[-.35,.5,0],[.35,.5,0]]} color={P.violet} radius={.05} opacity={.85}/><Slab position={[1.5,.5,0]} size={[2,.9,.14]} color={P.teal} fill={.24}/><Tag position={[1.5,1.1,.15]} tone="teal">new file</Tag><Tag position={[0,-.55,.15]} tone="violet" size="xs">+ additions · − deletions</Tag></>}
{mode==="permissions"&&<><Halo position={[0,.45,0]} radius={1.7} color={P.teal} opacity={.4} spin={.1}/><Node3D position={[0,.45,0]} color={P.teal} radius={.2} pulse={.3}/><Tag position={[0,1,.15]} tone="teal">{t.allowed}</Tag><Ribbon points={[[-2,.45,0],[-.5,.45,0]]} color={P.teal} radius={.05} opacity={.8}/><Slab position={[-2,.45,0]} size={[1.3,.6,.1]} color={P.teal} fill={.24}/><Ribbon points={[[.5,.45,0],[2,.45,0]]} color={P.rose} radius={.05} opacity={.8}/><Slab position={[2,.45,0]} size={[1.3,.6,.1]} color={P.rose} fill={.3}/><Tag position={[2,1,.15]} tone="rose">{t.denied}</Tag></>}
</PointerTilt></Stage></Figure>}

/* ───────────── Versión española (lámina de estudio) ───────────── */
export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* Un agente de código es un bucle que propone diffs; el modo de permisos
   decide cuáles llegan al disco. Las cifras + / − salen de un diff por LCS
   calculado aquí sobre ficheros de ejemplo. */

type Perm = "review" | "ask" | "workspace";

type Edit = { path: string; inside: boolean; before: string[]; after: string[] };
const EDITS: Edit[] = [
  {
    path: "src/hash.py",
    inside: true,
    before: ["import os", "", "def digest(path):", "    data = open(path).read()", "    return hash(data)"],
    after: ["import hashlib", "", "def digest(path):", "    with open(path, 'rb') as f:", "        data = f.read()", "    return hashlib.sha256(data).hexdigest()"],
  },
  {
    path: "tests/test_hash.py",
    inside: true,
    before: ["def test_digest():", "    assert digest('a.txt')"],
    after: ["def test_digest(tmp_path):", "    p = tmp_path / 'a.txt'", "    p.write_bytes(b'hola')", "    assert len(digest(p)) == 64"],
  },
  {
    path: "~/.bashrc",
    inside: false,
    before: ["export PATH=$PATH"],
    after: ["export PATH=$PATH", "alias test='pytest -q'"],
  },
];

/* Diff mínimo por subsecuencia común más larga. */
function lineDiff(a: string[], b: string[]) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const common = dp[0][0];
  return { add: b.length - common, del: a.length - common, keep: common };
}

function resolve(perm: Perm, approved: number) {
  return EDITS.map((edit, i) => {
    const d = lineDiff(edit.before, edit.after);
    let fate: "proposed" | "pending" | "applied" | "denied";
    /* Fuera de las raíces escribibles el sandbox rechaza la escritura. */
    if (perm === "review") fate = "proposed";
    else if (!edit.inside) fate = "denied";
    else if (perm === "workspace") fate = "applied";
    else fate = i < approved ? "applied" : "pending";
    return { ...edit, ...d, fate };
  });
}

const D = {
  base: "#2C3533",
  baseTop: "#3B4744",
  deck: "#ECE7DB",
  steel: "#9EA5A2",
  brass: "#B68442",
  charcoal: "#24292B",
};
const FATE_COLOR = { proposed: P.violet, pending: P.amber, applied: P.teal, denied: P.rose } as const;

function DiffCard({ add, del, fate, target }: { add: number; del: number; fate: keyof typeof FATE_COLOR; target: V3 }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = still ? 1 : Math.min(1, dt * 3);
    g.position.x += (target[0] - g.position.x) * k;
    g.position.y += (target[1] - g.position.y) * k;
    g.position.z += (target[2] - g.position.z) * k;
  });
  const lines = [...Array.from({ length: del }, () => P.rose), ...Array.from({ length: add }, () => P.teal)];
  return (
    <group ref={ref} position={[-3.2, target[1], target[2]]} rotation={[0, 0, fate === "denied" ? 0.18 : 0]}>
      <RoundedBox args={[1.0, 0.09, 0.7]} radius={0.03} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixHex(D.deck, FATE_COLOR[fate], 0.15)} roughness={0.5} clearcoat={0.35} />
      </RoundedBox>
      <mesh position={[-0.47, 0.05, 0]}>
        <boxGeometry args={[0.05, 0.02, 0.62]} />
        <meshStandardMaterial color={FATE_COLOR[fate]} />
      </mesh>
      {lines.map((color, i) => (
        <mesh key={i} position={[0.02, 0.05, -0.27 + i * (0.54 / Math.max(1, lines.length - 1))]}>
          <boxGeometry args={[0.7 - (i % 3) * 0.12, 0.012, 0.045]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Gate({ open, position, width }: { open: boolean; position: V3; width: number }) {
  const bar = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (!bar.current) return;
    const goal = open ? 0.4 : 0;
    const k = still ? 1 : Math.min(1, dt * 3);
    bar.current.position.y += (goal - bar.current.position.y) * k;
  });
  return (
    <group position={position}>
      {[-width / 2, width / 2].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[0, 0.36, 0]} castShadow>
            <boxGeometry args={[0.12, 0.72, 0.12]} />
            <meshStandardMaterial color={D.charcoal} roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.76, 0]}>
            <sphereGeometry args={[0.07, 16, 12]} />
            <meshStandardMaterial color={open ? P.teal : P.amber} emissive={open ? P.teal : P.amber} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      <group ref={bar} position={[0, 0, 0]}>
        <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, width, 14]} />
          <meshStandardMaterial color={D.brass} roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function Tray({ position, w, d, color, fence = false }: { position: V3; w: number; d: number; color: string; fence?: boolean }) {
  return (
    <group position={position}>
      <RoundedBox args={[w, 0.14, d]} position={[0, 0.07, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={D.charcoal} roughness={0.4} metalness={0.3} clearcoat={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.15, d / 2 - 0.05]}>
        <boxGeometry args={[w - 0.2, 0.02, 0.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {fence ? [-w / 2, w / 2].map((x) => (
        <mesh key={x} position={[x, 0.35, 0]} castShadow>
          <boxGeometry args={[0.05, 0.45, d]} />
          <meshStandardMaterial color={P.rose} roughness={0.5} transparent opacity={0.6} />
        </mesh>
      )) : null}
    </group>
  );
}

const LANE_Z = [0.85, -0.15, -1.45];
function targetFor(fate: keyof typeof FATE_COLOR, lane: number): V3 {
  const z = LANE_Z[lane];
  if (fate === "applied") return [2.35, 0.3, z];
  if (fate === "proposed") return [-1.75, 0.34, z];
  return [-0.75, 0.34, z];
}

function DiffScene({ perm, approved }: { perm: Perm; approved: number }) {
  const edits = resolve(perm, approved);
  return (
    <PointerTilt amount={0.04}>
      <group>
        <ShadowBlob position={[0, -0.28, 0]} scale={10.5} opacity={0.12} />
        <RoundedBox args={[10, 0.3, 4.6]} position={[-0.3, -0.13, -0.3]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={D.base} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[9.65, 0.06, 4.25]} position={[-0.3, 0.05, -0.3]} radius={0.03} smoothness={3} receiveShadow>
          <meshStandardMaterial color={D.baseTop} roughness={0.45} metalness={0.22} />
        </RoundedBox>
        {/* el agente: propone, no escribe */}
        <group position={[-4.0, 0.08, -0.3]}>
          <RoundedBox args={[1.3, 1.0, 1.3]} position={[0, 0.55, 0]} radius={0.1} smoothness={4} castShadow receiveShadow>
            <meshPhysicalMaterial color={D.charcoal} roughness={0.35} clearcoat={0.6} />
          </RoundedBox>
          <mesh position={[0.66, 0.6, 0]}>
            <boxGeometry args={[0.01, 0.5, 0.9]} />
            <meshStandardMaterial color={P.violet} emissive={P.violet} emissiveIntensity={0.4} />
          </mesh>
          <Tag position={[0, 1.35, 0]} tone="violet" size="xs" center>agente</Tag>
        </group>
        {/* conveyor de propuestas */}
        {LANE_Z.map((z) => (
          <mesh key={z} position={[-1.9, 0.1, z]} rotation={[0, 0, Math.PI / 2]} receiveShadow>
            <cylinderGeometry args={[0.03, 0.03, 3.4, 10]} />
            <meshStandardMaterial color={D.steel} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {edits.map((e, i) => (
          <group key={e.path}>
            <DiffCard add={e.add} del={e.del} fate={e.fate} target={targetFor(e.fate, i)} />
            <Gate open={e.fate === "applied"} position={[0.3, 0.08, LANE_Z[i]]} width={0.9} />
            {e.fate === "denied" ? <Tag position={[0.3, 1.1, LANE_Z[i]]} tone="rose" size="xs" center>sandbox: no</Tag> : null}
            <Tag position={[-1.75, 0.75, LANE_Z[i] + 0.1]} tone={e.inside ? "ink" : "rose"} size="xs" center><span className="normal-case">{`${e.path} +${e.add} −${e.del}`}</span></Tag>
          </group>
        ))}
        <Flow points={[[-3.3, 0.9, -0.3], [-2.8, 0.7, 0.4], [-2.4, 0.45, 0.85]]} color={P.violet} count={2} speed={0.35} />
        <Tray position={[2.35, 0.08, 0.35]} w={2.1} d={2.2} color={P.teal} />
        <Tray position={[2.35, 0.08, -1.45]} w={2.1} d={0.95} color={P.rose} fence />
        <Tag position={[3.75, 0.35, 0.35]} tone="teal" size="xs" center>workspace</Tag>
        <Tag position={[3.75, 0.35, -1.45]} tone="rose" size="xs" center>fuera de raíz</Tag>
      </group>
    </PointerTilt>
  );
}

const PERM_TEXT: Record<Perm, string> = {
  review: "Solo lectura (modo review de Codex, planificación en Claude Code): el agente lee el repo y propone diffs, pero nada cruza la barrera. Tú lees y luego aplicas.",
  ask: "Pedir permiso: cada edición espera en la barrera hasta que la apruebas. Aprueba una a una y mira cómo pasa solo la que autorizaste.",
  workspace: "Editar dentro del workspace: las ediciones bajo las raíces escribibles pasan solas; la que apunta fuera (~/.bashrc) la rechaza el sandbox.",
};

function DiffNote({ perm, approved }: { perm: Perm; approved: number }) {
  const edits = resolve(perm, approved);
  const count = (f: string) => edits.filter((e) => e.fate === f).length;
  return (
    <div className="space-y-3">
      <p><strong>El bucle termina en un diff.</strong> {PERM_TEXT[perm]}</p>
      <Readout items={[
        { label: "aplicadas", value: String(count("applied")), tone: "var(--teal)" },
        { label: "esperando", value: String(count("pending") + count("proposed")), tone: "var(--amber)" },
        { label: "rechazadas", value: String(count("denied")), tone: "var(--rose)" },
        { label: "líneas en disco", value: `+${edits.filter((e) => e.fate === "applied").reduce((s, e) => s + e.add, 0)} −${edits.filter((e) => e.fate === "applied").reduce((s, e) => s + e.del, 0)}`, tone: "var(--ink)" },
      ]} />
      <p className="text-xs text-muted">Diff calculado por subsecuencia común más larga sobre los ficheros de ejemplo. En Claude Code, Shift+Tab cicla el modo de permisos; en Codex, <code>/permissions</code> enseña el sandbox y las raíces escribibles. Los nombres exactos de cada modo cambian entre productos: la barrera es la idea común.</p>
    </div>
  );
}

function SpanishVisual() {
  const [perm, setPerm] = useState<Perm>("ask");
  const [approved, setApproved] = useState(0);
  const insideCount = EDITS.filter((e) => e.inside).length;
  return (
    <Figure
      label="Un agente de código es un bucle que termina en un diff"
      hint="propuesta → barrera de permisos → disco"
      height="h-[440px] md:h-[540px]"
      legend={[
        { color: P.violet, label: "propuesta" },
        { color: P.amber, label: "esperando permiso" },
        { color: P.teal, label: "aplicada" },
        { color: P.rose, label: "rechazada" },
      ]}
      note={<DiffNote perm={perm} approved={approved} />}
      controls={
        <>
          <Switcher value={perm} onChange={(p) => { setPerm(p); setApproved(0); }} ariaLabel="Modo de permisos" options={[
            { value: "review", label: "Solo lectura", tone: P.violet },
            { value: "ask", label: "Pedir permiso", tone: P.amber },
            { value: "workspace", label: "Editar workspace", tone: P.teal },
          ]} />
          {perm === "ask" ? (
            <>
              <button type="button" className="chip" disabled={approved >= insideCount} onClick={() => setApproved((a) => a + 1)}>Aprobar siguiente</button>
              <button type="button" className="chip" disabled={approved === 0} onClick={() => setApproved(0)}>Deshacer</button>
            </>
          ) : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3, 6.5, 9.5], fov: 34 }} fit={1.08}>
        <DiffScene perm={perm} approved={approved} />
      </Stage>
    </Figure>
  );
}
