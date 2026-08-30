"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Node3D, Tag, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
} from "@/components/three/iso";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Three ingress modes with different bills.
 *
 * The section lists requirements in prose, and one of them is a hard,
 * checkable fact that a drawing can enforce: Funnel only supports 443,
 * 8443 and 10000 over TLS. Turning the port knob and watching the rack
 * refuse is worth more than the sentence, because the sentence is easy
 * to read past and the refusal is not.
 */

type Mode = "serve" | "funnel" | "tailnet";

/** The only ports Funnel will carry. */
const FUNNEL_PORTS = [443, 8443, 10000];
const PORT_CHOICES = [443, 3000, 8443, 8080, 10000];

/** Requirements, per mode, straight from the section. */
const REQS: Record<Mode, string[]> = {
  serve: ["cli", "https"],
  funnel: ["cli", "https", "version", "magicdns", "attr", "port"],
  tailnet: [],
};

const COPY = {
  en: {
    title: "what each ingress mode costs",
    hint: "turn the port · Funnel carries three of them and no others",
    serve: "Serve",
    funnel: "Funnel",
    tailnet: "bind tailnet",
    legendMet: "requirement met",
    legendBlocked: "blocks startup",
    legendClaim: "foreground claim",
    reqs: {
      cli: "tailscale CLI installed and logged in",
      https: "HTTPS enabled for the tailnet",
      version: "Tailscale v1.38.3+",
      magicdns: "MagicDNS",
      attr: "funnel node attribute",
      port: "port is 443, 8443 or 10000",
    },
    port: "port",
    verdict: "startup",
    up: "comes up",
    failsClosed: "fails closed",
    claim: "Tailscale claim",
    claimNote: "held in the foreground; losing the Gateway releases it",
    listener: "127.0.0.1 listener",
    conflict: "status 78 · a persistent root route already owns 443",
    serveNote:
      "managed Serve proxies to a dedicated loopback listener while ordinary local clients keep the configured Gateway port. Startup only succeeds once the foreground Tailscale claim is active, and stopping the Gateway releases it again.",
    funnelNote:
      "everything Serve needs, plus a version floor, MagicDNS, a funnel node attribute — and a port that is one of exactly three. On macOS it also needs the open-source variant of the Tailscale app.",
    tailnetNote:
      "no Tailscale ingress at all: the Gateway binds on the tailnet itself. Nothing here is claimed or proxied, so none of the Serve or Funnel requirements apply — and none of their protections do either.",
  },
  es: {
    title: "qué cuesta cada modo de ingress",
    hint: "gira el puerto · Funnel lleva tres y ninguno más",
    serve: "Serve",
    funnel: "Funnel",
    tailnet: "bind tailnet",
    legendMet: "requisito cumplido",
    legendBlocked: "bloquea el arranque",
    legendClaim: "claim en foreground",
    reqs: {
      cli: "CLI tailscale instalado y logueado",
      https: "HTTPS habilitado para el tailnet",
      version: "Tailscale v1.38.3+",
      magicdns: "MagicDNS",
      attr: "atributo funnel en el nodo",
      port: "puerto 443, 8443 o 10000",
    },
    port: "puerto",
    verdict: "arranque",
    up: "levanta",
    failsClosed: "falla cerrado",
    claim: "claim de Tailscale",
    claimNote: "se sostiene en foreground; perder el Gateway lo libera",
    listener: "listener 127.0.0.1",
    conflict: "status 78 · una ruta root persistente ya posee el 443",
    serveNote:
      "el Serve gestionado proxifica a un listener loopback dedicado mientras los clientes locales normales conservan el puerto configurado del Gateway. El arranque solo tiene éxito con el claim de Tailscale activo en foreground, y parar el Gateway lo libera.",
    funnelNote:
      "todo lo que pide Serve, más un mínimo de versión, MagicDNS, un atributo funnel en el nodo — y un puerto que sea uno de exactamente tres. En macOS además exige la variante open-source de la app Tailscale.",
    tailnetNote:
      "sin ingress de Tailscale: el Gateway hace bind en el propio tailnet. Aquí no se reclama ni se proxifica nada, así que no aplica ningún requisito de Serve o Funnel — ni ninguna de sus protecciones.",
  },
};

/** One requirement, as a bolt that is either driven home or missing. */
function Req({
  position,
  met,
  label,
}: {
  position: V3;
  met: boolean;
  label: string;
}) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.y = MathUtils.damp(g.position.y, met ? 0.28 : 0.05, 6, dt);
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[0.24, 0.28, 0.12, 18]} />
        <meshStandardMaterial color={P.sunken} roughness={0.5} />
      </mesh>
      <group ref={ref}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.3, 16]} />
          <meshStandardMaterial
            color={met ? P.teal : P.rose}
            roughness={0.34}
            metalness={0.1}
            envMapIntensity={0.9}
          />
        </mesh>
      </group>
      {!met ? <Halo position={[0, 0.15, 0]} radius={0.42} color={P.rose} opacity={0.75} spin={0.5} /> : null}
      <Tag position={[0.55, 0.16, 0]} tone={met ? "ink" : "rose"} size="xs">
        {label}
      </Tag>
    </group>
  );
}

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("funnel");
  const [portIdx, setPortIdx] = useState(1);

  const port = PORT_CHOICES[portIdx];
  const portOk = FUNNEL_PORTS.includes(port);

  /* Only the port requirement is actually variable here; the rest are
     environment facts the reader is asked to assume are in place. */
  const metOf = (id: string) => (id === "port" ? portOk : true);
  const required = REQS[mode];
  const up = required.every(metOf);

  const note = mode === "serve" ? t.serveNote : mode === "funnel" ? t.funnelNote : t.tailnetNote;
  const accent = mode === "funnel" ? P.amber : mode === "serve" ? P.teal : P.violet;

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendMet },
        { color: P.rose, label: t.legendBlocked },
        { color: P.violet, label: t.legendClaim },
      ]}
      controls={
        <>
          <Switcher
            value={mode}
            onChange={setMode}
            options={[
              { value: "serve", label: t.serve, tone: P.teal },
              { value: "funnel", label: t.funnel, tone: P.amber },
              { value: "tailnet", label: t.tailnet, tone: P.violet },
            ]}
            ariaLabel={t.title}
          />
          <Knob
            label={t.port}
            value={portIdx}
            min={0}
            max={PORT_CHOICES.length - 1}
            step={1}
            onChange={setPortIdx}
            format={(v) => String(PORT_CHOICES[v])}
            tone={portOk ? P.teal : P.rose}
          />
        </>
      }
      note={
        <>
          {note}
          <div className="mt-2">
            <Readout
              items={[
                {
                  label: t.verdict,
                  value: up ? t.up : t.failsClosed,
                  tone: up ? "var(--teal)" : "var(--rose)",
                },
                { label: t.claim, value: t.claimNote, tone: "var(--violet)" },
                { label: "", value: t.conflict, tone: "var(--muted)" },
              ]}
            />
          </div>
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={14} depth={10} y={-0.05} />

        {/* The port rack: three sockets carry Funnel, the rest are dead. */}
        <group position={[-4.2, 0, 2.4]}>
          {PORT_CHOICES.map((p, i) => {
            const carries = FUNNEL_PORTS.includes(p);
            const chosen = i === portIdx;
            return (
              <group key={p} position={[i * 1.15, 0, 0]}>
                <RoundedBox args={[0.9, 0.28, 0.9]} radius={0.05} smoothness={3} position={[0, 0.14, 0]} castShadow receiveShadow>
                  <meshStandardMaterial
                    color={carries ? (chosen ? accent : P.tealWash) : P.sunken}
                    roughness={0.42}
                    metalness={0.04}
                    envMapIntensity={0.9}
                  />
                </RoundedBox>
                {chosen ? (
                  <>
                    <Node3D position={[0, 0.55, 0]} color={carries ? P.teal : P.rose} radius={0.14} />
                    <Halo position={[0, 0.55, 0]} radius={0.4} color={carries ? P.teal : P.rose} opacity={0.75} spin={0.5} />
                  </>
                ) : null}
                <Tag position={[0, -0.14, 0.7]} tone={carries ? "ink" : "muted"} size="xs" center>
                  {p}
                </Tag>
              </group>
            );
          })}
          <Tag position={[2.3, 0.9, -0.9]} tone="muted" size="xs" center>
            {t.reqs.port}
          </Tag>
        </group>

        {/* The requirements this mode actually has. */}
        {required.map((id, i) => (
          <Req
            key={id}
            position={[-4.2, 0, -2.8 + i * 0.85]}
            met={metOf(id)}
            label={t.reqs[id as keyof typeof t.reqs]}
          />
        ))}
        {required.length === 0 ? (
          <Tag position={[-3.4, 0.3, -1.4]} tone="violet" size="xs">
            {t.tailnet}
          </Tag>
        ) : null}

        {/* The Gateway, and the claim it has to be holding. */}
        <group position={[3.4, 0, -0.6]}>
          <RoundedBox args={[2, 0.8, 1.8]} radius={0.08} smoothness={3} position={[0, 0.4, 0]} castShadow receiveShadow>
            <meshStandardMaterial
              color={up ? P.surface : P.roseWash}
              roughness={0.36}
              metalness={0.05}
              envMapIntensity={0.95}
            />
          </RoundedBox>
          <Tag position={[0, 1.05, 0]} tone={up ? "ink" : "rose"} size="sm" center>
            {up ? t.up : t.failsClosed}
          </Tag>

          {mode !== "tailnet" ? (
            <group position={[0, 1.6, 0]}>
              <Node3D position={[0, 0, 0]} color={up ? P.violet : P.line} radius={0.16} faceted pulse={up ? 0.2 : 0} />
              {up ? <Halo radius={0.44} color={P.violet} opacity={0.7} spin={0.4} /> : null}
              <Tag position={[0, 0.5, 0]} tone={up ? "violet" : "muted"} size="xs" center>
                {t.claim}
              </Tag>
            </group>
          ) : null}

          {/* Managed ingress proxies to its own loopback listener. */}
          {mode !== "tailnet" ? (
            <group position={[0, 0, 2.3]}>
              <RoundedBox args={[1.7, 0.4, 0.8]} radius={0.06} smoothness={3} position={[0, 0.2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={P.sunken} roughness={0.45} />
              </RoundedBox>
              <Tag position={[0, 0.55, 0]} tone="muted" size="xs" center>
                {t.listener}
              </Tag>
              <AxisLine from={[0, 0.4, -1.1]} to={[0, 0.4, -0.5]} overrun={0} color={accent} opacity={0.6} />
            </group>
          ) : null}
        </group>

        {/* Every requirement reports to the Gateway. */}
        {required.map((id, i) => (
          <AxisLine
            key={id}
            from={[-3.6, 0.2, -2.8 + i * 0.85]}
            to={[2.3, 0.2, -0.6]}
            overrun={0}
            color={metOf(id) ? P.teal : P.rose}
            opacity={metOf(id) ? 0.35 : 0.6}
            dashed={!metOf(id)}
          />
        ))}

        <IsoDust count={22} center={[0, 1.2, 0]} spread={[4, 0.6, 2.6]} />
      </Stage>
    </Figure>
  );
}
