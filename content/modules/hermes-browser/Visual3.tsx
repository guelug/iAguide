"use client";

import {
  SurfaceCompare,
  type Surface,
} from "@/components/three/scenes/SurfaceCompare";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * "Comparar, sin mezclar mandos", drawn.
 *
 * Both products drive a browser and both handle dialogs, so the prose has
 * to keep insisting they are different objects on different pages. The
 * difference is structural — one attaches a supervisor per task to
 * whatever backend is already there, the other runs a profile it owns —
 * and structure is what a diagram is for.
 *
 * The hazard is the section's own warning, and it runs both ways: neither
 * config key belongs in the other product's file.
 */

const EN: Surface[] = [
  {
    name: "Hermes browser",
    role: "bridge",
    note: "a CDPSupervisor per task_id, attached to whatever backend the browser tools already use — local Chrome, Browserbase, or nothing at all",
    knobs: ["CDPSupervisor", "browser.dialog_policy", "pending_dialogs", "browser_dialog", "browser_cdp frame_id"],
    color: P.violet,
  },
  {
    name: "OpenClaw browser",
    role: "server",
    note: "a dedicated openclaw profile of Chrome, Brave, Edge or Chromium, driven by a loopback-only control service inside the Gateway and isolated from the personal browser",
    knobs: ["browser.defaultProfile", "openclaw / user / chrome", "dialog accept|dismiss", "dialog id"],
    color: P.teal,
  },
];

const ES: Surface[] = [
  {
    name: "Navegador de Hermes",
    role: "bridge",
    note: "un CDPSupervisor por task_id, unido al backend que las tools de navegador ya usen: Chrome local, Browserbase, o nada",
    knobs: ["CDPSupervisor", "browser.dialog_policy", "pending_dialogs", "browser_dialog", "browser_cdp frame_id"],
    color: P.violet,
  },
  {
    name: "Navegador de OpenClaw",
    role: "server",
    note: "un perfil dedicado openclaw de Chrome, Brave, Edge o Chromium, conducido por un servicio de control solo loopback dentro del Gateway y aislado del navegador personal",
    knobs: ["browser.defaultProfile", "openclaw / user / chrome", "dialog accept|dismiss", "dialog id"],
    color: P.teal,
  },
];

export default function Visual() {
  const t = useCopy({
    en: {
      surfaces: EN,
      copy: {
        title: "same need, different object",
        hint: "pick a product · what hangs under it is on its page, not the other one",
        note: "Both drive a browser and both answer dialogs, which is exactly why they get confused. Hermes attaches a supervisor to a backend that is already there; OpenClaw runs a profile it owns. Hermes has no named profiles — it has one supervisor per task_id — and OpenClaw has no dialog_policy. Same human need, different object, different page.",
        roles: { server: "owns the browser", client: "calls in", bridge: "attaches to one" },
        knobsLabel: "its own knobs",
        hazard: {
          text: "browser.defaultProfile and browser.dialog_policy do not cross",
          from: 1,
          to: 0,
        },
      },
    },
    es: {
      surfaces: ES,
      copy: {
        title: "la misma necesidad, distinto objeto",
        hint: "elige un producto · lo que cuelga debajo está en su página, no en la otra",
        note: "Los dos conducen un navegador y los dos contestan diálogos, que es justo por lo que se confunden. Hermes une un supervisor a un backend que ya está ahí; OpenClaw corre un perfil que posee. Hermes no tiene perfiles con nombre — tiene un supervisor por task_id — y OpenClaw no tiene dialog_policy. Misma necesidad humana, distinto objeto, distinta página.",
        roles: { server: "posee el navegador", client: "llama", bridge: "se une a uno" },
        knobsLabel: "sus propios mandos",
        hazard: {
          text: "browser.defaultProfile y browser.dialog_policy no se cruzan",
          from: 1,
          to: 0,
        },
      },
    },
  });

  return <SurfaceCompare surfaces={t.surfaces} copy={t.copy} />;
}
