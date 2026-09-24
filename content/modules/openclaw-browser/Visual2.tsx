"use client";

import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

type Mode = "profiles" | "control" | "routing";
const COPY = {
  en: { title: "one browser, three profiles", hint: "isolated · control plane · node proxy", profiles: "profiles", control: "control plane", routing: "routing", openclaw: "openclaw", user: "user", chrome: "chrome", isolated: "isolated", loopback: "loopback", node: "node", sandbox: "sandbox", host: "host", cdp: "CDP" },
  es: { title: "un navegador, tres perfiles", hint: "aislado · plano de control · proxy nodo", profiles: "perfiles", control: "plano control", routing: "routing", openclaw: "openclaw", user: "user", chrome: "chrome", isolated: "aislado", loopback: "loopback", node: "nodo", sandbox: "sandbox", host: "host", cdp: "CDP" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("profiles");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.isolated }, { color: P.violet, label: t.loopback }, { color: P.amber, label: t.node }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "profiles", label: t.profiles, tone: P.teal }, { value: "control", label: t.control, tone: P.violet }, { value: "routing", label: t.routing, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "profiles" && <>{[[t.openclaw, P.teal, -1.8], [t.user, P.violet, 0], [t.chrome, P.amber, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.45, 0.95, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.8, 0.15]} tone={(["teal", "violet", "amber"] as const)[i]} size="xs">{label as string}</Tag><Tag position={[x as number, 0.1, 0.15]} tone="muted" size="xs">{i === 0 ? t.isolated : t.cdp}</Tag></group>)}</>}
        {mode === "control" && <><Halo position={[0, 0.2, 0]} radius={1.15} color={P.violet} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.violet} radius={0.2} pulse={0.3} /><Tag position={[0, 0.8, 0.15]} tone="violet">{t.loopback}</Tag><Ribbon points={[[-2, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-2, 0.65, 0.15]} tone="teal" size="xs">gateway + 2</Tag><Ribbon points={[[0.45, 0.2, 0], [2, 0.2, 0]]} color={P.amber} radius={0.045} opacity={0.85} /><Tag position={[2, 0.65, 0.15]} tone="amber" size="xs">CDP 9+</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">perfil personal fuera del circuito</Tag></>}
        {mode === "routing" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.sandbox}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.amber} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.amber} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="amber">{t.node}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">target: sandbox · host · node</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

/* ======================================================================
 * Versión española: a dónde va una llamada de la tool browser.
 *
 * Reglas de la lección, en orden: resolver target (sandbox, host o
 * node; si se omite, la sesión y un nodo conectado deciden), comprobar
 * allowHostControl para host desde un sandbox, rechazar mutaciones
 * persistentes de perfil en el proxy de nodo, y pasar la navegación por
 * la política SSRF, que es fail-closed aunque no se configure.
 * ==================================================================== */

type Target = "auto" | "sandbox" | "host" | "node";
type Dest = "public" | "private" | "allowed";
type Action = "navigate" | "reset";
type Route = "sandbox" | "host" | "node";

const DEST: Record<Dest, { label: string; url: string; privateNet: boolean }> = {
  public: { label: "Web pública", url: "https://example.com", privateNet: false },
  private: { label: "Red privada", url: "http://10.0.0.5/admin", privateNet: true },
  allowed: { label: "Host permitido", url: "https://intranet.ejemplo", privateNet: true },
};

function resolveCall(sandboxed: boolean, nodeUp: boolean, target: Target, allowHost: boolean, dest: Dest, action: Action) {
  let route: Route;
  if (target === "auto") route = nodeUp ? "node" : sandboxed ? "sandbox" : "host";
  else route = target;
  if (route === "node" && !nodeUp) return { route, stop: "route" as const, why: "No hay ningún nodo con navegador conectado: target node no tiene a dónde ir." };
  if (route === "host" && sandboxed && !allowHost)
    return { route, stop: "route" as const, why: "La sesión está en sandbox y pide target host: hace falta agents.defaults.sandbox.browser.allowHostControl=true. Sin él, se rechaza." };
  if (route === "node" && action === "reset")
    return { route, stop: "proxy" as const, why: "El proxy de nodo nunca permite mutaciones persistentes de perfil (create-profile, delete-profile, reset-profile). La acción se rechaza en el nodo." };
  if (action === "navigate" && DEST[dest].privateNet && dest !== "allowed")
    return { route, stop: "ssrf" as const, why: "La navegación a una dirección privada se bloquea: la política SSRF es fail-closed aunque omitas browser.ssrfPolicy." };
  return { route, stop: "none" as const, why: "" };
}

function SpanishVisual() {
  const [sandboxed, setSandboxed] = useState(true);
  const [nodeUp, setNodeUp] = useState(false);
  const [target, setTarget] = useState<Target>("auto");
  const [allowHost, setAllowHost] = useState(false);
  const [dest, setDest] = useState<Dest>("public");
  const [action, setAction] = useState<Action>("navigate");
  const r = resolveCall(sandboxed, nodeUp, target, allowHost, dest, action);

  const routeWhy =
    target === "auto"
      ? nodeUp
        ? "Sin target y con un nodo con navegador conectado, la tool se auto-enruta al nodo."
        : sandboxed
          ? "Sin target, una sesión en sandbox usa el navegador del sandbox."
          : "Sin target, una sesión sin sandbox usa el navegador del host."
      : `target: "${target}" fija el destino y desactiva el auto-enrutado.`;
  const ok =
    action === "reset"
      ? "reset-profile fuera del proxy de nodo no pasa por la navegación: es una operación de perfil local."
      : dest === "allowed"
        ? "intranet.ejemplo figura en allowedHostnames: la excepción es estrecha y explícita, mejor que dangerouslyAllowPrivateNetwork."
        : "Destino público: la política SSRF lo deja pasar.";

  return (
    <Figure
      label="Una llamada de browser: ruta, proxy y filtro SSRF"
      hint={`sesión ${sandboxed ? "en sandbox" : "sin sandbox"} · target ${target === "auto" ? "omitido" : target}`}
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "Sandbox" },
        { color: P.amber, label: "Host" },
        { color: P.violet, label: "Nodo" },
        { color: P.rose, label: "Rechazo" },
      ]}
      controls={
        <>
          <button type="button" className="chip" aria-pressed={sandboxed} onClick={() => setSandboxed(!sandboxed)}>{sandboxed ? "Sandbox: sí" : "Sandbox: no"}</button>
          <button type="button" className="chip" aria-pressed={nodeUp} onClick={() => setNodeUp(!nodeUp)}>{nodeUp ? "Nodo conectado: sí" : "Nodo conectado: no"}</button>
          <Switcher ariaLabel="target" value={target} onChange={setTarget} options={[{ value: "auto", label: "Sin target", tone: P.inkSoft }, { value: "sandbox", label: "sandbox", tone: P.teal }, { value: "host", label: "host", tone: P.amber }, { value: "node", label: "node", tone: P.violet }]} />
          {sandboxed && target === "host" ? <button type="button" className="chip" aria-pressed={allowHost} onClick={() => setAllowHost(!allowHost)}>{allowHost ? "allowHostControl activo" : "Activar allowHostControl"}</button> : null}
          <Switcher ariaLabel="Destino" value={dest} onChange={setDest} options={(Object.keys(DEST) as Dest[]).map((v) => ({ value: v, label: DEST[v].label, tone: v === "private" ? P.rose : P.teal }))} />
          <Switcher ariaLabel="Acción" value={action} onChange={setAction} options={[{ value: "navigate", label: "Navegar", tone: P.teal }, { value: "reset", label: "reset-profile", tone: P.rose }]} />
        </>
      }
      note={
        <div className="space-y-2">
          <p className="rounded border border-line bg-paper p-3 font-mono text-xs">browser {action === "navigate" ? `open ${DEST[dest].url}` : "reset-profile"} · ruta: {r.route} · {r.stop === "none" ? "permitido" : `rechazado en ${r.stop === "route" ? "el enrutado" : r.stop === "proxy" ? "el proxy de nodo" : "el filtro SSRF"}`}</p>
          <p>{routeWhy} {r.stop === "none" ? ok : r.why}</p>
          <p className="text-xs text-muted">El HTTP_PROXY del Gateway no proxifica el navegador gestionado, así que no puede debilitar el filtro SSRF. Desactivar el proxy de nodo: nodeHost.browserProxy.enabled=false en el nodo o gateway.nodes.browser.mode=&quot;off&quot;. Fuente: OpenClaw, Browser.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.2, 9.5, 8.5], fov: 34 }} fit={1.02}>
        <RouteBench res={r} nodeUp={nodeUp} dest={dest} action={action} sandboxed={sandboxed} />
      </Stage>
    </Figure>
  );
}

/* BENCH */
function Unit({ p, s, color, coat = 0.4, rough = 0.42, metal = 0.05 }: { p: V3; s: V3; color: string; coat?: number; rough?: number; metal?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(0.05, Math.min(s[0], s[1], s[2]) / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} />
    </RoundedBox>
  );
}

const HOST_Z: Record<Route, number> = { sandbox: -1.35, host: 0, node: 1.35 };
const HOST_COLOR: Record<Route, string> = { sandbox: P.teal, host: P.amber, node: P.violet };
const HOST_X = -1.2;
const GATE_X2 = 1.5;
const DEST_Z: Record<Dest, number> = { public: -1.2, private: 0.1, allowed: 1.35 };
const DEST_X = 3.8;

function Cross({ p }: { p: V3 }) {
  return (
    <group position={p}>
      {[0.785, -0.785].map((r) => (
        <mesh key={r} rotation={[0, 0, r]}>
          <boxGeometry args={[0.5, 0.08, 0.08]} />
          <meshStandardMaterial color={P.rose} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function RouteBench({ res, nodeUp, dest, action, sandboxed }: { res: ReturnType<typeof resolveCall>; nodeUp: boolean; dest: Dest; action: Action; sandboxed: boolean }) {
  const hz = HOST_Z[res.route];
  const reachedHost = res.stop !== "route";
  const toGate = reachedHost && res.stop !== "proxy" && action === "navigate";
  const passed = toGate && res.stop === "none";
  return (
    <group>
      <Unit p={[0, -0.13, 0]} s={[10.4, 0.22, 4.4]} color="#263532" metal={0.3} coat={0.35} />
      <Unit p={[0, 0.0, 0]} s={[10.1, 0.05, 4.1]} color={mixHex(P.paper, P.sunken, 0.7)} rough={0.6} coat={0} />

      {/* The agent's tool call. */}
      <group position={[-4.2, 0, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.62, 0.4, 32]} />
          <meshPhysicalMaterial color="#2E3438" metalness={0.3} roughness={0.4} clearcoat={0.4} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.12, 32]} />
          <meshStandardMaterial color={sandboxed ? P.teal : P.amber} roughness={0.4} />
        </mesh>
        <Tag position={[0, 1.0, 0]} tone="ink" size="xs" center>tool browser</Tag>
      </group>

      {/* Three places a browser can run. */}
      {(Object.keys(HOST_Z) as Route[]).map((id) => {
        const on = id === res.route;
        const dim = id === "node" && !nodeUp;
        const col = dim ? "#C4C0B6" : HOST_COLOR[id];
        return (
          <group key={id} position={[HOST_X, 0, HOST_Z[id]]}>
            <Unit p={[0, 0.35, 0]} s={[1.3, 0.55, 0.95]} color={mixHex(P.paper, col, on ? 0.5 : 0.22)} />
            {id === "sandbox"
              ? [-0.5, 0, 0.5].map((x) => (
                  <mesh key={x} position={[x, 0.75, 0]}>
                    <boxGeometry args={[0.03, 0.3, 0.95]} />
                    <meshStandardMaterial color={P.tealDeep} metalness={0.4} roughness={0.4} />
                  </mesh>
                ))
              : null}
            {id === "node" ? (
              <mesh position={[0.45, 0.95, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
                <meshStandardMaterial color={col} />
              </mesh>
            ) : null}
            <Tag position={[-0.95, 0.35, 0]} tone={dim ? "muted" : id === "sandbox" ? "teal" : id === "host" ? "amber" : "violet"} size="xs" center>{id === "node" && !nodeUp ? "nodo ausente" : id}</Tag>
          </group>
        );
      })}
      <Flow points={[[-3.6, 0.5, 0], [-2.5, 0.8, hz * 0.6], [HOST_X - 0.7, 0.5, hz]]} color={reachedHost ? HOST_COLOR[res.route] : P.rose} count={3} size={0.05} speed={0.35} lineOpacity={0.45} />
      {!reachedHost ? <Cross p={[HOST_X - 0.9, 0.9, hz]} /> : null}
      {res.stop === "proxy" ? <Cross p={[HOST_X, 1.05, hz]} /> : null}

      {/* The SSRF wall: fail-closed. */}
      <group position={[GATE_X2, 0, 0]}>
        {[-1.2, 1.2].map((z) => <Unit key={z} p={[0, 0.55, z * 1.2]} s={[0.22, 1.0, 1.1]} color="#3A4745" metal={0.3} />)}
        <Unit p={[0, 1.15, 0]} s={[0.26, 0.18, 3.8]} color="#2E3B39" metal={0.3} />
        <group position={[0, 0.55, DEST_Z[dest] * 0.55]}>
          <mesh rotation={[0, passed ? 1.2 : 0, 0]} position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.9, 0.8]} />
            <meshPhysicalMaterial color={toGate ? (passed ? P.teal : P.rose) : "#9AA1A7"} roughness={0.4} clearcoat={0.4} />
          </mesh>
        </group>
        <Tag position={[0, 1.55, 0]} tone={toGate && !passed ? "rose" : "teal"} size="xs" center>{toGate && !passed ? "SSRF · bloqueado" : "filtro SSRF"}</Tag>
      </group>
      {toGate ? <Flow points={[[HOST_X + 0.7, 0.5, hz], [0.4, 0.7, (hz + DEST_Z[dest] * 0.55) / 2], [GATE_X2 - 0.15, 0.55, DEST_Z[dest] * 0.55]]} color={HOST_COLOR[res.route]} count={2} size={0.05} speed={0.35} lineOpacity={0.4} /> : null}
      {passed ? <Flow points={[[GATE_X2 + 0.15, 0.55, DEST_Z[dest] * 0.55], [DEST_X - 0.5, 0.6, DEST_Z[dest]]]} color={P.teal} count={2} size={0.05} speed={0.35} lineOpacity={0.4} /> : null}

      {/* Destinations. */}
      {(Object.keys(DEST) as Dest[]).map((id) => {
        const on = id === dest && action === "navigate";
        return (
          <group key={id} position={[DEST_X, 0, DEST_Z[id]]}>
            {id === "public" ? (
              <mesh position={[0, 0.5, 0]} castShadow>
                <sphereGeometry args={[0.38, 28, 20]} />
                <meshPhysicalMaterial color={on ? P.teal : "#B7C9C5"} roughness={0.35} clearcoat={0.5} />
              </mesh>
            ) : (
              <Unit p={[0, 0.4, 0]} s={[0.8, 0.6, 0.7]} color={on ? (id === "private" ? P.rose : P.teal) : "#CFCAC0"} metal={0.2} />
            )}
            <Tag position={[0.2, 1.1, 0]} tone={on ? "ink" : "muted"} size="xs" center>{DEST[id].label}</Tag>
          </group>
        );
      })}
    </group>
  );
}
