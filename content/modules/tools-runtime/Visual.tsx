"use client";
import { Edges, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLocale } from "next-intl";
import { useMemo, useRef } from "react";
import { Group, MathUtils } from "three";
import { Readout } from "@/components/three/Figure";
import { useStage } from "@/components/three/Stage";
import { PointerTilt, ShadowBlob, type V3 } from "@/components/three/atoms";
import { mixHex } from "@/lib/palette";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Step = "schema" | "registry" | "dispatch" | "policy" | "backend";



function LegacyVisual() {
  const t = useCopy({
    en: {
      "tools_runtime": "Tools runtime",
      "step_the_diagram": "step the diagram",
      "schema": "schema",
      "registry": "registry",
      "dispatch": "dispatch",
      "policy": "policy",
      "backend": "backend",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "tools_runtime": "Runtime de herramientas",
      "step_the_diagram": "recorre el diagrama",
      "schema": "schema",
      "registry": "registro",
      "dispatch": "dispatch",
      "policy": "política",
      "backend": "backend",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "schema" as const, label: t.schema, tone: "var(--teal)" },
    { value: "registry" as const, label: t.registry, tone: "var(--teal)" },
    { value: "dispatch" as const, label: t.dispatch, tone: "var(--amber)" },
    { value: "policy" as const, label: t.policy, tone: "var(--violet)" },
    { value: "backend" as const, label: t.backend, tone: "var(--amber)" },
  ];
  const [step, setStep] = useState<Step>("schema");

  return (
    <Figure
      label={t.tools_runtime}
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="tools-runtime diagram steps"
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
        color={active === "schema" ? P.teal : P.lineStrong}
        fill={active === "schema" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.schema}</Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "registry" ? P.amber : P.lineStrong}
        fill={active === "registry" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.registry}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "dispatch" ? P.violet : P.lineStrong}
        fill={active === "dispatch" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.dispatch}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "policy" ? P.teal : P.lineStrong}
        fill={active === "policy" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.policy}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "backend" ? P.amber : P.lineStrong}
        fill={active === "backend" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.backend}</Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Backend = "local" | "docker" | "ssh";
type ResId = "workspace" | "home" | "ssh" | "secrets" | "net" | "procs";

const RESOURCES: { id: ResId; label: string; pos: V3 }[] = [
  { id: "workspace", label: "workspace/", pos: [1.2, 0, 0.55] },
  { id: "net", label: "red", pos: [1.2, 0, -0.55] },
  { id: "home", label: "~/ (home)", pos: [2.35, 0, 0.55] },
  { id: "secrets", label: "variables .env", pos: [2.35, 0, -0.55] },
  { id: "ssh", label: "~/.ssh", pos: [3.5, 0, 0.55] },
  { id: "procs", label: "procesos", pos: [3.5, 0, -0.55] },
];

/* What a terminal command can touch on *this* machine, per backend. Docker
   assumes the usual setup: workspace bind-mounted, default bridge network. */
const REACH: Record<Backend, ResId[]> = {
  local: ["workspace", "home", "ssh", "secrets", "net", "procs"],
  docker: ["workspace", "net"],
  ssh: [],
};

const BACKEND_TEXT: Record<Backend, string> = {
  local: "El backend local ejecuta como tu usuario: cualquier comando que la política deje pasar alcanza el home, las claves SSH, los secretos del entorno, la red y otros procesos.",
  docker: "Con Docker el comando vive en un contenedor: solo ve el workspace montado y la red del contenedor. Las claves y el resto del home quedan fuera, salvo que los montes tú.",
  ssh: "Con SSH el comando corre en otra máquina: esta queda intacta, pero todo lo que la cuenta remota pueda tocar allí queda a su alcance. Mover el backend no quita la necesidad de política.",
};

function SpanishVisual() {
  const [backend, setBackend] = useState<Backend>("local");
  const [approval, setApproval] = useState(true);
  const reach = useMemo(() => new Set(REACH[backend]), [backend]);
  const note = (
    <div className="space-y-3">
      <p>
        <strong>El modelo solo emite texto; los permisos viven entre el arnés y el host.</strong> {BACKEND_TEXT[backend]}{" "}
        {approval ? "Con aprobación humana, el comando espera en la puerta de política hasta que alguien lo autoriza." : "Sin aprobación, lo que pase el allow/deny llega directo al backend."}
      </p>
      <Readout
        items={[
          { label: "backend", value: backend === "local" ? "terminal local" : backend === "docker" ? "Docker" : "SSH remoto", tone: "var(--ink)" },
          { label: "recursos alcanzables aquí", value: `${reach.size} de ${RESOURCES.length}`, tone: reach.size > 2 ? "var(--rose)" : "var(--teal)" },
          { label: "aprobación", value: approval ? "requerida" : "no", tone: approval ? "var(--amber)" : "var(--muted)" },
        ]}
      />
      <p className="text-xs text-muted">Recursos de ejemplo de una máquina de desarrollo. Los alcances dependen de cómo configures cada backend (montajes, red, usuario remoto); aquí se muestra la configuración habitual.</p>
    </div>
  );
  return (
    <Figure
      label="Del tool_call al host · dónde están los permisos"
      hint="esquema → registro → despacho → política → backend"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.violet, label: "tool_call" },
        { color: P.amber, label: "política" },
        { color: P.rose, label: "alcanzable" },
        { color: P.teal, label: "aislado" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={backend} onChange={setBackend} ariaLabel="Backend" options={[{ value: "local", label: "Local", tone: P.rose }, { value: "docker", label: "Docker", tone: P.teal }, { value: "ssh", label: "SSH", tone: P.violet }]} />
          <button type="button" className="chip" aria-pressed={approval} style={approval ? { background: "var(--amber-wash)", borderColor: "var(--amber)" } : undefined} onClick={() => setApproval(!approval)}>
            {approval ? "Aprobación: sí" : "Aprobación: no"}
          </button>
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1, 2.4, 11.5], fov: 35 }} fit={1.02}>
        <HostScene backend={backend} reach={reach} approval={approval} />
      </Stage>
    </Figure>
  );
}

const HOST_Y = -0.9;
const STATIONS = [
  { x: -3.3, label: "esquema" },
  { x: -2.45, label: "registro" },
  { x: -1.6, label: "despacho" },
];
const POLICY_X = -0.7;
const BACKEND_X = 0.15;

function ResourceIcon({ id, color }: { id: ResId; color: string }) {
  const mat = <meshPhysicalMaterial color={color} roughness={0.38} clearcoat={0.5} />;
  switch (id) {
    case "workspace":
    case "home":
      return (
        <group>
          <RoundedBox position={[0, 0.2, 0]} args={[0.52, 0.34, 0.4]} radius={0.04} smoothness={2} castShadow>{mat}</RoundedBox>
          <RoundedBox position={[-0.12, 0.4, 0]} args={[0.24, 0.08, 0.4]} radius={0.03} smoothness={2} castShadow>{mat}</RoundedBox>
        </group>
      );
    case "ssh":
      return (
        <group position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow><torusGeometry args={[0.12, 0.045, 12, 28]} />{mat}</mesh>
          <mesh position={[0, -0.28, 0]} castShadow><boxGeometry args={[0.07, 0.34, 0.07]} />{mat}</mesh>
        </group>
      );
    case "secrets":
      return (
        <group>
          <RoundedBox position={[0, 0.24, 0]} args={[0.46, 0.44, 0.4]} radius={0.05} smoothness={2} castShadow>{mat}</RoundedBox>
          <mesh position={[0, 0.24, 0.21]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.04, 20]} /><meshStandardMaterial color="#B7833E" metalness={0.7} roughness={0.3} /></mesh>
        </group>
      );
    case "net":
      return (
        <group position={[0, 0.28, 0]}>
          <mesh castShadow><sphereGeometry args={[0.2, 24, 16]} />{mat}</mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.27, 0.015, 8, 40]} /><meshBasicMaterial color={color} /></mesh>
        </group>
      );
    default:
      return (
        <group>
          {[0.08, 0.2, 0.32].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.08, 24]} />{mat}</mesh>
          ))}
        </group>
      );
  }
}

function PolicyGate({ approval }: { approval: boolean }) {
  const arm = useRef<Group>(null);
  const { still } = useStage();
  useFrame(({ clock }, dt) => {
    if (!arm.current) return;
    // with approval the arm stays down half the cycle: the call waits
    const open = !approval || still || (clock.elapsedTime % 4) > 2;
    const target = open ? 1.3 : 0;
    arm.current.rotation.z = still ? (approval ? 0 : 1.3) : MathUtils.damp(arm.current.rotation.z, target, 5, dt);
  });
  return (
    <group position={[POLICY_X, HOST_Y, 0]}>
      <RoundedBox position={[0, 0.45, -0.45]} args={[0.18, 0.9, 0.18]} radius={0.04} smoothness={2} castShadow>
        <meshStandardMaterial color="#8C9895" metalness={0.55} roughness={0.34} />
      </RoundedBox>
      <group ref={arm} position={[0, 0.8, -0.45]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0.5, 0, 0]} castShadow><boxGeometry args={[1.0, 0.09, 0.07]} /><meshStandardMaterial color={P.amber} roughness={0.4} /></mesh>
      </group>
      <Tag position={[0, 1.3, 0]} tone="amber" size="xs" center>política</Tag>
    </group>
  );
}

function HostScene({ backend, reach, approval }: { backend: Backend; reach: Set<ResId>; approval: boolean }) {
  const term: V3 = [BACKEND_X, HOST_Y + 0.45, 0];
  const remote: V3 = [2.35, HOST_Y + 0.9, -2.3];
  return (
    <PointerTilt amount={0.05}>
      <group>
        <ShadowBlob position={[0, HOST_Y - 0.5, 0.1]} scale={10} opacity={0.1} />
        <RoundedBox position={[0, HOST_Y - 0.36, -0.3]} args={[10, 0.24, 3.2]} radius={0.1} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#2D3436" roughness={0.5} metalness={0.2} />
        </RoundedBox>
        {/* model and harness rail */}
        <group position={[-4.3, HOST_Y, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow><cylinderGeometry args={[0.36, 0.42, 0.2, 32]} /><meshStandardMaterial color="#4E5A59" metalness={0.5} roughness={0.35} /></mesh>
          <Node3D position={[0, 0.4, 0]} color={P.violet} radius={0.32} />
          <Tag position={[0, 1.02, 0]} tone="violet" size="xs" center>modelo</Tag>
        </group>
        <mesh position={[-2.1, HOST_Y - 0.14, 0]} receiveShadow><boxGeometry args={[4.2, 0.08, 0.3]} /><meshStandardMaterial color="#6E7472" metalness={0.55} roughness={0.35} /></mesh>
        {STATIONS.map((st) => (
          <group key={st.label} position={[st.x, HOST_Y, 0]}>
            <RoundedBox position={[0, 0.35, 0]} args={[0.12, 0.78, 0.8]} radius={0.03} smoothness={2} castShadow receiveShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, P.teal, 0.25)} roughness={0.4} clearcoat={0.4} transparent opacity={0.85} />
            </RoundedBox>
            <Tag position={[0, -0.34, 0.5]} tone="teal" size="xs" center>{st.label}</Tag>
          </group>
        ))}
        <PolicyGate approval={approval} />
        <Flow points={[[-3.95, HOST_Y + 0.4, 0], [-2.4, HOST_Y + 0.4, 0], [POLICY_X + 0.1, HOST_Y + 0.4, 0], [BACKEND_X - 0.2, HOST_Y + 0.4, 0]]} color={P.violet} count={2} size={0.05} speed={0.2} paused={approval} lineOpacity={0.45} />
        {/* backend terminal */}
        <group position={[BACKEND_X, HOST_Y, 0]}>
          <RoundedBox position={[0, 0.3, 0]} args={[0.5, 0.6, 0.6]} radius={0.05} smoothness={3} castShadow>
            <meshPhysicalMaterial color="#1F2528" roughness={0.35} clearcoat={0.6} />
          </RoundedBox>
          <mesh position={[0.26, 0.34, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.42, 0.34]} /><meshBasicMaterial color={backend === "docker" ? P.teal : backend === "ssh" ? P.violet : P.rose} /></mesh>
          <Tag position={[0, 0.95, 0.1]} tone="ink" size="xs" center>{backend === "local" ? "terminal local" : backend === "docker" ? "docker exec" : "ssh remoto"}</Tag>
        </group>
        {/* host plate */}
        <RoundedBox position={[2.35, HOST_Y - 0.12, 0]} args={[3.4, 0.16, 2.1]} radius={0.06} smoothness={3} castShadow receiveShadow>
          <meshPhysicalMaterial color="#E4DFD3" roughness={0.5} clearcoat={0.3} />
        </RoundedBox>
        <Tag position={[2.35, HOST_Y - 0.5, 1.15]} tone="muted" size="xs" center>esta máquina</Tag>
        {RESOURCES.map((r) => {
          const hit = reach.has(r.id);
          const col = hit ? P.rose : mixHex(P.paper, P.teal, 0.55);
          return (
            <group key={r.id} position={[r.pos[0], HOST_Y, r.pos[2]]}>
              <ResourceIcon id={r.id} color={col} />
              <Tag position={[0, r.pos[2] > 0 ? -0.2 : 0.75, r.pos[2] > 0 ? 0.35 : 0]} tone={hit ? "rose" : "teal"} size="xs" center>{r.label}</Tag>
            </group>
          );
        })}
        {RESOURCES.filter((r) => reach.has(r.id)).map((r, k) => (
          <Flow key={r.id} points={[term, [(term[0] + r.pos[0]) / 2, HOST_Y + 1.0, r.pos[2] * 0.5], [r.pos[0], HOST_Y + 0.5, r.pos[2]]]} color={P.rose} count={1} size={0.035} speed={0.3} offset={k * 0.17} paused={approval} lineOpacity={0.35} />
        ))}
        {backend === "local" ? (
          <mesh position={[1.9, HOST_Y + 0.55, 0]}>
            <boxGeometry args={[4.6, 1.3, 2.3]} />
            <meshBasicMaterial color={P.rose} transparent opacity={0.06} depthWrite={false} />
            <Edges color={P.rose} transparent opacity={0.6} />
          </mesh>
        ) : null}
        {backend === "docker" ? (
          <mesh position={[0.95, HOST_Y + 0.5, 0]}>
            <boxGeometry args={[2.0, 1.2, 2.2]} />
            <meshBasicMaterial color={P.teal} transparent opacity={0.07} depthWrite={false} />
            <Edges color={P.teal} transparent opacity={0.8} />
          </mesh>
        ) : null}
        {backend === "ssh" ? (
          <group>
            <Flow points={[term, [1.0, HOST_Y + 1.6, -1.2], remote]} color={P.violet} count={2} size={0.04} speed={0.25} paused={approval} lineOpacity={0.5} />
            <RoundedBox position={remote} args={[1.9, 0.14, 1.1]} radius={0.05} smoothness={2} castShadow>
              <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.25)} roughness={0.45} clearcoat={0.4} />
            </RoundedBox>
            {[-0.55, 0, 0.55].map((dx) => (
              <RoundedBox key={dx} position={[remote[0] + dx, remote[1] + 0.22, remote[2]]} args={[0.36, 0.3, 0.36]} radius={0.04} smoothness={2} castShadow>
                <meshPhysicalMaterial color={P.rose} roughness={0.4} clearcoat={0.5} />
              </RoundedBox>
            ))}
            <Tag position={[remote[0], remote[1] + 0.7, remote[2]]} tone="violet" size="xs" center>host remoto</Tag>
          </group>
        ) : null}
      </group>
    </PointerTilt>
  );
}
