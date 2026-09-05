"use client";

import {
  SurfaceCompare,
  type Surface,
} from "@/components/three/scenes/SurfaceCompare";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * "Comparar, sin mezclar palancas", drawn.
 *
 * The section's argument is that two schedulers answer the same human
 * need — run this later — out of different stores, with different
 * isolation and different fallback wiring, and that the knobs are not
 * interchangeable even though the need is. Side by side that is one
 * glance instead of five hundred words.
 *
 * Every knob below is named in the section. The hazard is the paste it
 * warns about in as many words: do not replace jobs.json with a database
 * because OpenClaw uses SQLite. Cite the page you implement.
 */

const EN: Surface[] = [
  {
    name: "Hermes cron",
    role: "server",
    note: "a jobs.json file store plus a lock plus a fresh AIAgent, written atomically so a crash mid-tick leaves the previous file whole, never broken JSON",
    knobs: ["jobs.json", "skills[]", "schedule.kind", "deliver", "Chronos", "recursion guard"],
    color: P.violet,
  },
  {
    name: "OpenClaw cron",
    role: "server",
    note: "jobs in the Gateway's SQLite, driven over cron.* RPC, so a Control UI can poll a run by its runId",
    knobs: ["cron.*", "cron.runs", "announce", "webhook", "isolated / main"],
    color: P.teal,
  },
];

const ES: Surface[] = [
  {
    name: "Cron de Hermes",
    role: "server",
    note: "un almacén de fichero jobs.json más un lock más un AIAgent fresco, escrito de forma atómica para que un crash a mitad de tick deje el fichero anterior entero y nunca un JSON roto",
    knobs: ["jobs.json", "skills[]", "schedule.kind", "deliver", "Chronos", "guardia de recursión"],
    color: P.violet,
  },
  {
    name: "Cron de OpenClaw",
    role: "server",
    note: "jobs en la SQLite del Gateway, manejados por RPC cron.*, de modo que una Control UI pueda sondear una corrida por su runId",
    knobs: ["cron.*", "cron.runs", "announce", "webhook", "isolated / main"],
    color: P.teal,
  },
];

export default function Visual() {
  const t = useCopy({
    en: {
      surfaces: EN,
      copy: {
        title: "same need, different stores",
        hint: "pick a scheduler · the knobs under it belong to it alone",
        note: "Run this later is one human need and two products. Different stores, different isolation, different fallback wiring. Choose the product, then cite its page — a briefing that must land in Telegram without poisoning a live chat transcript is already an isolation decision Hermes made, and a briefing that must be an RPC a Control UI can poll by runId is OpenClaw's cron.runs.",
        roles: { server: "owns the jobs", client: "calls in", bridge: "bridge" },
        knobsLabel: "its own knobs",
        hazard: {
          text: "do not swap jobs.json for a database because OpenClaw uses SQLite",
          from: 1,
          to: 0,
        },
      },
    },
    es: {
      surfaces: ES,
      copy: {
        title: "la misma necesidad, distintos almacenes",
        hint: "elige un scheduler · las palancas de debajo son solo suyas",
        note: "Correr esto luego es una necesidad humana y dos productos. Distintos almacenes, distinto aislamiento, distinto cableado de fallback. Elige el producto y cita su página: un briefing que debe aterrizar en Telegram sin envenenar un transcript de chat vivo ya es una decisión de aislamiento que tomó Hermes, y un briefing que debe ser un RPC que una Control UI pueda sondear por runId es cron.runs de OpenClaw.",
        roles: { server: "posee los jobs", client: "llama", bridge: "puente" },
        knobsLabel: "sus propias palancas",
        hazard: {
          text: "no cambies jobs.json por una base de datos porque OpenClaw use SQLite",
          from: 1,
          to: 0,
        },
      },
    },
  });

  return <SurfaceCompare surfaces={t.surfaces} copy={t.copy} />;
}
