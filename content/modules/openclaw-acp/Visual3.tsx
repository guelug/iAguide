"use client";

import {
  SurfaceCompare,
  type Surface,
} from "@/components/three/scenes/SurfaceCompare";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * "Comparar, sin mezclar knobs" is the longest unillustrated stretch in
 * the course — around 1,700 words asking the reader to hold three
 * surfaces, two products and one protocol name in their head at once.
 *
 * All the facts here come from that section: which side runs the loop,
 * which way each surface points, and the specific paste the docs warn
 * against.
 */

const SURFACES_EN: Surface[] = [
  {
    name: "hermes acp",
    role: "server",
    note: "an ACP server that wraps AIAgent over stdio and runs the loop in-process",
    knobs: ["use_unstable_protocol"],
    color: P.violet,
  },
  {
    name: "openclaw acp",
    role: "server",
    note: "also an ACP server, but it forwards to a Gateway session instead of running the loop itself",
    knobs: ["acp.backend", "acp.dispatch.enabled"],
    color: P.teal,
  },
  {
    name: "/acp spawn",
    role: "client",
    note: "the other direction: OpenClaw is the client, starting an external harness on the host",
    knobs: ["runtime", "mode", "cwd", "resumeSessionId"],
    color: P.amber,
  },
];

const SURFACES_ES: Surface[] = [
  {
    name: "hermes acp",
    role: "server",
    note: "un servidor ACP que envuelve AIAgent por stdio y corre el bucle in-process",
    knobs: ["use_unstable_protocol"],
    color: P.violet,
  },
  {
    name: "openclaw acp",
    role: "server",
    note: "también servidor ACP, pero reenvía a una sesión del Gateway en vez de correr el bucle",
    knobs: ["acp.backend", "acp.dispatch.enabled"],
    color: P.teal,
  },
  {
    name: "/acp spawn",
    role: "client",
    note: "la otra dirección: OpenClaw es el cliente y arranca un harness externo en el host",
    knobs: ["runtime", "mode", "cwd", "resumeSessionId"],
    color: P.amber,
  },
];

export default function Visual() {
  const t = useCopy({
    en: {
      surfaces: SURFACES_EN,
      copy: {
        title: "three shapes, two products, one protocol name",
        hint: "click a plinth · the arrow is the direction calls travel",
        note: "The name ACP is the only thing all three share. Each plinth owns its own knobs, and a knob only means something on the surface it belongs to.",
        roles: { server: "server", client: "client", bridge: "bridge" },
        knobsLabel: "knobs",
        hazard: { text: "do not paste across", from: 0, to: 1 },
      },
    },
    es: {
      surfaces: SURFACES_ES,
      copy: {
        title: "tres formas, dos productos, un nombre de protocolo",
        hint: "pulsa una peana · la flecha es la dirección de las llamadas",
        note: "El nombre ACP es lo único que comparten las tres. Cada peana tiene sus propios mandos, y un mando solo significa algo en la superficie a la que pertenece.",
        roles: { server: "servidor", client: "cliente", bridge: "puente" },
        knobsLabel: "mandos",
        hazard: { text: "no pegar de una a otra", from: 0, to: 1 },
      },
    },
  });

  return <SurfaceCompare surfaces={t.surfaces} copy={t.copy} />;
}
