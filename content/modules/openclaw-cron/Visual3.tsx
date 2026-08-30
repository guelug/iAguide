"use client";

import {
  SurfaceCompare,
  type Surface,
} from "@/components/three/scenes/SurfaceCompare";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * The "Comparar, sin mezclar knobs" section runs about 1,200 words and
 * asks the reader to keep two schedulers and a hook endpoint apart. Every
 * fact below is from that section: who owns the jobs, which knob disables
 * what, and the paste the docs warn against.
 */

const EN: Surface[] = [
  {
    name: "Hermes cron",
    role: "server",
    note: "a Hermes scheduler, living inside the Hermes loop",
    knobs: ["crontab line"],
    color: P.violet,
  },
  {
    name: "OpenClaw automations",
    role: "server",
    note: "sqlite jobs owned by the Gateway; one-shots self-delete only when they succeed",
    knobs: ["cron.enabled", "OPENCLAW_SKIP_CRON", "cron.triggers.enabled"],
    color: P.teal,
  },
  {
    name: "Gateway hooks",
    role: "client",
    note: "HTTP wake endpoints that need their own dedicated token — never a gateway auth token",
    knobs: ["hooks.enabled", "hook token"],
    color: P.amber,
  },
];

const ES: Surface[] = [
  {
    name: "Hermes cron",
    role: "server",
    note: "un scheduler de Hermes, dentro del bucle Hermes",
    knobs: ["línea crontab"],
    color: P.violet,
  },
  {
    name: "Automations OpenClaw",
    role: "server",
    note: "jobs sqlite del Gateway; los one-shot se autoborran solo si terminan bien",
    knobs: ["cron.enabled", "OPENCLAW_SKIP_CRON", "cron.triggers.enabled"],
    color: P.teal,
  },
  {
    name: "Hooks del Gateway",
    role: "client",
    note: "endpoints HTTP de wake con su propio token dedicado — nunca un token de auth del gateway",
    knobs: ["hooks.enabled", "hook token"],
    color: P.amber,
  },
];

export default function Visual() {
  const t = useCopy({
    en: {
      surfaces: EN,
      copy: {
        title: "two schedulers and a doorbell",
        hint: "click a plinth · the arrow is the direction calls travel",
        note: "A crontab line is not a session knob. Recurring failures back off 30s, 60s, 5m, 15m, 60m, and a time-based job disables itself after ten consecutive failures.",
        roles: { server: "server", client: "inbound", bridge: "bridge" },
        knobsLabel: "knobs",
        hazard: { text: "no crontab line in session.reset", from: 0, to: 1 },
      },
    },
    es: {
      surfaces: ES,
      copy: {
        title: "dos schedulers y un timbre",
        hint: "pulsa una peana · la flecha es la dirección de las llamadas",
        note: "Una línea de crontab no es un mando de sesión. Los fallos recurrentes hacen backoff 30s, 60s, 5m, 15m, 60m, y un job por tiempo se autodeshabilita tras diez fallos seguidos.",
        roles: { server: "servidor", client: "entrante", bridge: "puente" },
        knobsLabel: "mandos",
        hazard: { text: "no pegar crontab en session.reset", from: 0, to: 1 },
      },
    },
  });

  return <SurfaceCompare surfaces={t.surfaces} copy={t.copy} />;
}
