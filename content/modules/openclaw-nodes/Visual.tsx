"use client";

import { useState } from "react";
import { Figure, Switcher, Knob, Readout } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Node3D, Slab, Tag, Turntable, Wire, ShadowBlob } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";

type Step = "a" | "b" | "c" | "d" | "e";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "step_the_diagram": "step the diagram",
      "camera": "camera",
      "screen": "screen",
      "location": "location",
      "exec_host": "exec host",
      "core_path": "core path",
      "cost_volatile": "cost / volatile",
      "extension": "extension"
    },
    es: {
      "step_the_diagram": "recorre el diagrama",
      "camera": "cámara",
      "screen": "pantalla",
      "location": "ubicación",
      "exec_host": "host de exec",
      "core_path": "ruta núcleo",
      "cost_volatile": "coste / volátil",
      "extension": "extensión"
    },
  });

  const OPTIONS = [
    { value: "a" as const, label: "role:node", tone: "var(--teal)" },
    { value: "b" as const, label: t.camera, tone: "var(--amber)" },
    { value: "c" as const, label: t.screen, tone: "var(--violet)" },
    { value: "d" as const, label: t.location, tone: "var(--amber)" },
    { value: "e" as const, label: t.exec_host, tone: "var(--teal)" },
  ];
  const [step, setStep] = useState<Step>("a");

  return (
    <Figure
      label="OpenClaw: nodes as peripherals"
      hint={t.step_the_diagram}
      legend={[
        { color: P.teal, label: t.core_path },
        { color: P.amber, label: t.cost_volatile },
        { color: P.violet, label: t.extension },
      ]}
      controls={
        <Switcher
          ariaLabel="openclaw-nodes diagram steps"
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
        color={active === "a" ? P.teal : P.lineStrong}
        fill={active === "a" ? 0.55 : 0.14}
      />
      <Tag position={[-2.3, 1.4500000000000002, 0.0]} tone="teal" center>
        role:node
      </Tag>

      <Slab
        position={[-0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "b" ? P.amber : P.lineStrong}
        fill={active === "b" ? 0.55 : 0.14}
      />
      <Tag position={[-0.75, 1.4500000000000002, 0.0]} tone="amber" center>{t.camera}</Tag>

      <Slab
        position={[0.75, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "c" ? P.violet : P.lineStrong}
        fill={active === "c" ? 0.55 : 0.14}
      />
      <Tag position={[0.75, 1.4500000000000002, 0.0]} tone="violet" center>{t.screen}</Tag>

      <Slab
        position={[2.3, 0.9, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "d" ? P.teal : P.lineStrong}
        fill={active === "d" ? 0.55 : 0.14}
      />
      <Tag position={[2.3, 1.4500000000000002, 0.0]} tone="teal" center>{t.location}</Tag>

      <Slab
        position={[0.0, -1.05, 0.0]}
        size={[1.35, 0.62, 0.12]}
        color={active === "e" ? P.amber : P.lineStrong}
        fill={active === "e" ? 0.55 : 0.14}
      />
      <Tag position={[0.0, -0.5, 0.0]} tone="amber" center>{t.exec_host}</Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ ES */

/*
 * Un Gateway, varios nodos periféricos. Los mensajes de canal aterrizan
 * en el Gateway; los nodos se conectan con role: node por el WebSocket
 * del Gateway y exponen commands vía node.invoke. Reglas de la lección
 * (OpenClaw, «Nodes»): camera.* exige primer plano
 * (NODE_BACKGROUND_UNAVAILABLE si no), el tool nodes recorta durationMs
 * a 300000 ms, location está apagado por defecto, y exec con host=node
 * reenvía system.run al node host, que aplica sus approvals. Con el
 * Gateway en loopback hace falta un túnel ssh -L 18790:127.0.0.1:18789.
 */

type OnMode = "topology" | "camera" | "location" | "exec";

const MAX_DURATION_S = 300;

const N1 = { base: "#2d3336", baseTop: "#42494d", brass: "#b68442", steel: "#a3aaad", ceramic: "#efebe2", glass: "#23302f" };

const GW: [number, number, number] = [-0.6, 0, -0.2];
const PHONE: [number, number, number] = [2.7, 0, -1.4];
const MAC: [number, number, number] = [2.9, 0, 0.5];
const HOST: [number, number, number] = [2.3, 0, 2.1];
const CHANNELS = ["Telegram", "WhatsApp", "Slack"];

function Gateway({ lit }: { lit: boolean }) {
  return (
    <group position={GW}>
      <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.15, 0.18, 48]} />
        <meshStandardMaterial color={N1.ceramic} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.8, 0.64, 48]} />
        <meshPhysicalMaterial color={mixHex(P.paper, P.teal, lit ? 0.5 : 0.3)} roughness={0.35} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.84, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.05, 48]} />
        <meshStandardMaterial color={P.teal} roughness={0.35} metalness={0.3} emissive={P.teal} emissiveIntensity={lit ? 0.3 : 0.05} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.79, 0.45, Math.sin(a) * 0.79]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.04, 0.18, 0.14]} />
            <meshStandardMaterial color={N1.brass} metalness={0.8} roughness={0.25} />
          </mesh>
        );
      })}
      <Tag position={[0, 1.2, 0]} tone="teal" center>Gateway</Tag>
    </group>
  );
}

function Phone({ lit, foreground, label }: { lit: boolean; foreground: boolean; label: string }) {
  return (
    <group position={PHONE}>
      <RoundedBox args={[0.9, 0.08, 0.5]} position={[0, 0.04, 0]} radius={0.03} smoothness={2} receiveShadow>
        <meshStandardMaterial color={N1.ceramic} roughness={0.6} />
      </RoundedBox>
      <group position={[0, 0.62, 0]} rotation={[-0.25, 0, 0]}>
        <RoundedBox args={[0.58, 1.1, 0.07]} radius={0.06} smoothness={4} castShadow>
          <meshPhysicalMaterial color={"#2a2f33"} roughness={0.3} clearcoat={0.8} />
        </RoundedBox>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[0.5, 0.98]} />
          <meshStandardMaterial color={foreground ? mixHex(P.paper, P.violet, 0.35) : N1.glass} emissive={foreground && lit ? P.violet : "#000000"} emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0.16, 0.44, -0.04]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshStandardMaterial color="#111" metalness={0.5} roughness={0.2} />
        </mesh>
      </group>
      <Tag position={[0, 1.45, 0]} tone={lit ? "violet" : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

function Laptop({ lit, label }: { lit: boolean; label: string }) {
  return (
    <group position={MAC}>
      <RoundedBox args={[1.2, 0.07, 0.8]} position={[0, 0.035, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
        <meshPhysicalMaterial color="#c9ccce" metalness={0.6} roughness={0.35} clearcoat={0.4} />
      </RoundedBox>
      <group position={[0, 0.07, -0.38]} rotation={[-0.3, 0, 0]}>
        <RoundedBox args={[1.2, 0.8, 0.05]} position={[0, 0.4, 0]} radius={0.03} smoothness={2} castShadow>
          <meshPhysicalMaterial color="#c9ccce" metalness={0.6} roughness={0.35} clearcoat={0.4} />
        </RoundedBox>
        <mesh position={[0, 0.41, 0.03]}>
          <planeGeometry args={[1.08, 0.68]} />
          <meshStandardMaterial color={lit ? mixHex(P.paper, P.violet, 0.3) : N1.glass} />
        </mesh>
      </group>
      <Tag position={[0, 1.2, -0.3]} tone={lit ? "violet" : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

function HeadlessHost({ lit, label }: { lit: boolean; label: string }) {
  return (
    <group position={HOST}>
      <RoundedBox args={[1.1, 0.5, 0.75]} position={[0, 0.25, 0]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={lit ? mixHex(P.paper, P.amber, 0.35) : "#d6d2c8"} roughness={0.4} clearcoat={0.45} />
      </RoundedBox>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[-0.35 + i * 0.12, 0.25, 0.38]}>
          <boxGeometry args={[0.06, 0.3, 0.01]} />
          <meshStandardMaterial color="#6b7275" />
        </mesh>
      ))}
      <mesh position={[0.38, 0.38, 0.38]}>
        <sphereGeometry args={[0.04, 12, 8]} />
        <meshStandardMaterial color={lit ? P.amber : "#555"} emissive={lit ? P.amber : "#000"} emissiveIntensity={0.6} />
      </mesh>
      <Tag position={[0, 0.8, 0]} tone={lit ? "amber" : "muted"} size="xs" center>{label}</Tag>
    </group>
  );
}

function Channel({ name, z, lit }: { name: string; z: number; lit: boolean }) {
  return (
    <group position={[-3.6, 0, z]}>
      <RoundedBox args={[0.9, 0.3, 0.5]} position={[0, 0.15, 0]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={mixHex(P.paper, P.amber, lit ? 0.4 : 0.2)} roughness={0.4} clearcoat={0.4} />
      </RoundedBox>
      <Tag position={[0, 0.5, 0]} tone="amber" size="xs" center>{name}</Tag>
    </group>
  );
}

type OnState = { mode: OnMode; foreground: boolean; duration: number; locationOn: boolean; loopback: boolean };

function Cable({ from, to, color, active, dashed = false }: { from: [number, number, number]; to: [number, number, number]; color: string; active: boolean; dashed?: boolean }) {
  const mid: [number, number, number] = [(from[0] + to[0]) / 2, Math.max(from[1], to[1]) + 0.25, (from[2] + to[2]) / 2];
  return (
    <group>
      <Wire points={[from, mid, to]} color={active ? color : P.lineStrong} opacity={active ? 0.9 : 0.5} width={active ? 2.2 : 1.2} dashed={dashed} />
      {active ? <Flow points={[from, mid, to]} color={color} count={3} size={0.05} speed={0.4} lineOpacity={0} /> : null}
    </group>
  );
}

function NodesScene({ s }: { s: OnState }) {
  const gwPort = (dx: number, dz: number): [number, number, number] => [GW[0] + dx, 0.5, GW[2] + dz];
  const cam = s.mode === "camera";
  const loc = s.mode === "location";
  const exec = s.mode === "exec";
  const camFails = cam && !s.foreground;
  const locFails = loc && !s.locationOn;
  return (
    <group>
      <ShadowBlob position={[0, -0.38, 0.3]} scale={10.5} opacity={0.12} />
      <RoundedBox args={[9.6, 0.3, 6.2]} position={[0, -0.2, 0.3]} radius={0.15} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={N1.base} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[9.2, 0.07, 5.8]} position={[0, -0.02, 0.3]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial color={N1.baseTop} roughness={0.5} metalness={0.2} />
      </RoundedBox>

      <Gateway lit />
      {CHANNELS.map((c, i) => {
        const z = -1.3 + i * 1.1;
        return (
          <group key={c}>
            <Channel name={c} z={z} lit={s.mode === "topology"} />
            <Cable from={[-3.15, 0.2, z]} to={gwPort(-0.8, (z - GW[2]) * 0.4)} color={P.amber} active={s.mode === "topology"} />
          </group>
        );
      })}

      <Phone lit={s.mode === "topology" || cam || loc} foreground={cam ? s.foreground : true} label={cam || loc ? "iPhone · nodo" : "iPhone · role:node"} />
      <Laptop lit={s.mode === "topology"} label="Mac · modo nodo" />
      <HeadlessHost lit={s.mode === "topology" || exec} label="Build Node · host" />

      <Cable from={gwPort(0.8, -0.3)} to={[PHONE[0] - 0.3, 0.4, PHONE[2]]} color={camFails || locFails ? P.rose : P.violet} active={s.mode === "topology" || cam || loc} />
      <Cable from={gwPort(0.8, 0.2)} to={[MAC[0] - 0.6, 0.3, MAC[2]]} color={P.violet} active={s.mode === "topology"} />
      <Cable from={gwPort(0.7, 0.55)} to={[HOST[0] - 0.55, 0.3, HOST[2]]} color={P.amber} active={s.mode === "topology" || exec} dashed={exec && s.loopback} />

      {cam ? (
        <group>
          <Tag position={[1.1, 0.95, -0.75]} tone={camFails ? "rose" : "violet"} size="xs" center>{camFails ? "NODE_BACKGROUND_UNAVAILABLE" : "camera.clip"}</Tag>
          {camFails ? null : (
            /* Clamp gauge: requested vs forwarded duration. */
            <group position={[0.9, 0, -2.45]}>
              <RoundedBox args={[3.2, 0.1, 0.36]} position={[0, 0.05, 0]} radius={0.03} smoothness={2} receiveShadow>
                <meshStandardMaterial color={N1.ceramic} roughness={0.6} />
              </RoundedBox>
              <RoundedBox args={[(Math.min(s.duration, 600) / 600) * 3.0, 0.14, 0.22]} position={[-1.5 + ((Math.min(s.duration, 600) / 600) * 3.0) / 2, 0.14, 0]} radius={0.04} smoothness={2}>
                <meshStandardMaterial color={mixHex(P.paper, P.rose, 0.35)} transparent opacity={0.6} />
              </RoundedBox>
              <RoundedBox args={[(Math.min(s.duration, MAX_DURATION_S) / 600) * 3.0, 0.2, 0.26]} position={[-1.5 + ((Math.min(s.duration, MAX_DURATION_S) / 600) * 3.0) / 2, 0.16, 0]} radius={0.05} smoothness={2} castShadow>
                <meshPhysicalMaterial color={mixHex(P.paper, P.violet, 0.5)} roughness={0.35} clearcoat={0.5} />
              </RoundedBox>
              <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[0.03, 0.4, 0.4]} />
                <meshStandardMaterial color={P.rose} />
              </mesh>
              <Tag position={[0, 0.62, 0]} tone="rose" size="xs" center>tope 300 s</Tag>
            </group>
          )}
        </group>
      ) : null}
      {loc ? (
        <Tag position={[1.2, 1.35, -1.25]} tone={locFails ? "rose" : "violet"} size="xs" center>{locFails ? "location apagado" : "lat · lon · precisión"}</Tag>
      ) : null}
      {exec ? (
        <group>
          <Tag position={[1.0, 0.95, 1.55]} tone="amber" size="xs" center>system.run · host=node</Tag>
          {/* Approvals live on the node host, not on the Gateway. */}
          <group position={[HOST[0] + 0.95, 0, HOST[2]]}>
            <mesh position={[0, 0.22, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.24, 0.44, 24]} />
              <meshPhysicalMaterial color={N1.brass} metalness={0.7} roughness={0.3} clearcoat={0.4} />
            </mesh>
            <Tag position={[0, 0.68, 0]} tone="amber" size="xs" center>approvals</Tag>
          </group>
          {s.loopback ? (
            <group>
              <mesh position={[(GW[0] + HOST[0]) / 2 + 0.2, 0.28, (GW[2] + HOST[2]) / 2 + 0.2]} rotation={[0, -0.75, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.13, 0.13, 1.6, 24, 1, true]} />
                <meshPhysicalMaterial color={mixHex(P.paper, P.amber, 0.25)} transparent opacity={0.55} roughness={0.2} clearcoat={1} side={2} />
              </mesh>
              <Tag position={[0.2, 0.55, 1.9]} tone="amber" size="xs" center>túnel SSH 18790</Tag>
            </group>
          ) : null}
        </group>
      ) : null}
    </group>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<OnMode>("topology");
  const [foreground, setForeground] = useState(true);
  const [duration, setDuration] = useState(120);
  const [locationOn, setLocationOn] = useState(false);
  const [loopback, setLoopback] = useState(true);
  const forwarded = Math.min(duration, MAX_DURATION_S);
  const s: OnState = { mode, foreground, duration, locationOn, loopback };
  const note = {
    topology: (
      <div className="space-y-3">
        <p><strong>Un Gateway, varios periféricos.</strong> Telegram, WhatsApp o Slack aterrizan en el Gateway, nunca en un nodo. Los nodos (iPhone, el Mac en modo nodo, un node host sin pantalla) se conectan a su WebSocket con <code>role: node</code> y exponen commands por <code>node.invoke</code>. Dos Gateways son un conflicto, no una topología.</p>
        <Readout items={[{ label: "Gateways", value: "1", tone: "var(--teal)" }, { label: "nodos", value: "3", tone: "var(--violet)" }, { label: "canales en nodos", value: "0", tone: "var(--amber)" }]} />
        <p className="text-xs text-muted">El Mac en modo nodo es una sola conexión: la app ejecuta el node host como worker interno; no arranques un segundo nodo CLI en esa máquina.</p>
      </div>
    ),
    camera: (
      <div className="space-y-3">
        <p><strong>{foreground ? "App en primer plano: el clip se graba." : "App en segundo plano: la llamada falla."}</strong> {foreground ? `Pides ${duration} s; el tool nodes recorta durationMs a 300000 antes de reenviar, así que el nodo recibe ${forwarded} s${duration > MAX_DURATION_S ? " (recortado)" : ""}. El nodo aplica además su propio límite de payload.` : "camera.* exige primer plano; en segundo plano devuelve NODE_BACKGROUND_UNAVAILABLE."}</p>
        <Readout items={[
          { label: "pedido", value: duration + " s", tone: "var(--ink)" },
          { label: "reenviado", value: foreground ? forwarded + " s = " + forwarded * 1000 + " ms" : "—", tone: "var(--violet)" },
          { label: "resultado", value: foreground ? "clip" : "NODE_BACKGROUND_UNAVAILABLE", tone: foreground ? "var(--teal)" : "var(--rose)" },
        ]} />
      </div>
    ),
    location: (
      <div className="space-y-3">
        <p><strong>{locationOn ? "Location activado: respuesta con posición." : "Location está apagado por defecto."}</strong> {locationOn ? "La respuesta de location.get incluye lat/lon, la precisión en metros y un timestamp." : "Hasta que se activa en el nodo, location.get no devuelve una posición."}</p>
        <Readout items={[{ label: "estado", value: locationOn ? "activado" : "apagado (defecto)", tone: locationOn ? "var(--teal)" : "var(--rose)" }, { label: "campos", value: locationOn ? "lat · lon · precisión m · timestamp" : "—", tone: "var(--violet)" }]} />
      </div>
    ),
    exec: (
      <div className="space-y-3">
        <p><strong>exec con host=node.</strong> El modelo sigue hablando con el Gateway; el Gateway reenvía system.run al node host, y las approvals se aplican allí. {loopback ? "Con el Gateway en loopback, el nodo remoto no puede conectar directo: abre un túnel ssh -N -L 18790:127.0.0.1:18789 y arranca el nodo contra 127.0.0.1:18790." : "Con el Gateway accesible en la red, el node host conecta directo al puerto 18789."}</p>
        <Readout items={[{ label: "puerto del nodo", value: loopback ? "18790 → 18789" : "18789", tone: "var(--amber)" }, { label: "approvals", value: "en el node host", tone: "var(--amber)" }, { label: "nodes invoke system.run", value: "bloqueado", tone: "var(--rose)" }]} />
        <p className="text-xs text-muted">host=auto no elige el nodo implícitamente. El pairing no pre-aprueba commands: el primer system.run queda pendiente de approval o verificación SSH.</p>
      </div>
    ),
  }[mode];
  return (
    <Figure
      label="OpenClaw: los nodos son periféricos"
      hint="role:node · cámara · ubicación · host de exec"
      height="h-[460px] md:h-[540px]"
      legend={[
        { color: P.teal, label: "Gateway" },
        { color: P.violet, label: "nodo / node.invoke" },
        { color: P.amber, label: "canal / exec" },
        { color: P.rose, label: "fallo o tope" },
      ]}
      note={note}
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Vista de nodos" options={[
            { value: "topology", label: "role:node", tone: P.teal },
            { value: "camera", label: "Cámara", tone: P.violet },
            { value: "location", label: "Ubicación", tone: P.violet },
            { value: "exec", label: "Host de exec", tone: P.amber },
          ]} />
          {mode === "camera" ? (
            <>
              <Switcher value={foreground ? "fg" : "bg"} onChange={(v) => setForeground(v === "fg")} ariaLabel="Estado de la app" options={[{ value: "fg", label: "Primer plano", tone: P.violet }, { value: "bg", label: "Segundo plano", tone: P.rose }]} />
              <Knob label="duración" value={duration} min={10} max={600} step={10} onChange={setDuration} format={(v) => v + " s"} tone="var(--violet)" />
            </>
          ) : null}
          {mode === "location" ? <Switcher value={locationOn ? "on" : "off"} onChange={(v) => setLocationOn(v === "on")} ariaLabel="Location" options={[{ value: "off", label: "Apagado", tone: P.rose }, { value: "on", label: "Activado", tone: P.teal }]} /> : null}
          {mode === "exec" ? <Switcher value={loopback ? "lo" : "lan"} onChange={(v) => setLoopback(v === "lo")} ariaLabel="Bind del Gateway" options={[{ value: "lo", label: "Loopback", tone: P.amber }, { value: "lan", label: "Red", tone: P.teal }]} /> : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.4, 6.4, 8.8], fov: 32 }} fit={1.02}>
        <NodesScene s={s} />
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}
