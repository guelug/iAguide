"use client";

import {
  SurfaceCompare,
  type Surface,
} from "@/components/three/scenes/SurfaceCompare";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/*
 * Three layers that all feel like "the sandbox" and are not the same
 * thing. The section says it in nine hundred words; the plinths say which
 * layer owns which key, which is the part people actually get wrong.
 */

const EN: Surface[] = [
  {
    name: "Hermes sandboxing",
    role: "server",
    note: "a concern of the Hermes loop, not of the Gateway",
    knobs: ["Docker flag"],
    color: P.violet,
  },
  {
    name: "Sandbox backends",
    role: "server",
    note: "provisioned by the Gateway; creator-role required sandboxes are not overridden by mode=off",
    knobs: ["sandbox.mode", "sandbox.browser.allowHostControl"],
    color: P.teal,
  },
  {
    name: "Tool policy",
    role: "client",
    note: "a separate layer where deny wins; the workspace AGENTS.md Tools section does not control it",
    knobs: ["tools.deny", "tools.alsoAllow", "sessionToolsVisibility"],
    color: P.amber,
  },
];

const ES: Surface[] = [
  {
    name: "Sandboxing de Hermes",
    role: "server",
    note: "asunto del bucle Hermes, no del Gateway",
    knobs: ["flag de Docker"],
    color: P.violet,
  },
  {
    name: "Backends de sandbox",
    role: "server",
    note: "los provisiona el Gateway; un sandbox required por creator role no lo tumba mode=off",
    knobs: ["sandbox.mode", "sandbox.browser.allowHostControl"],
    color: P.teal,
  },
  {
    name: "Tool policy",
    role: "client",
    note: "capa aparte donde deny gana; la sección Tools de AGENTS.md no la controla",
    knobs: ["tools.deny", "tools.alsoAllow", "sessionToolsVisibility"],
    color: P.amber,
  },
];

export default function Visual() {
  const t = useCopy({
    en: {
      surfaces: EN,
      copy: {
        title: "three layers that all feel like the sandbox",
        hint: "click a plinth · the arrow is the direction calls travel",
        note: "Deny wins across the layers, and elevated is exec-only. When a tool is blocked, openclaw logs names the layer in the agents/tool-policy entry.",
        roles: { server: "provisioned", client: "policy", bridge: "bridge" },
        knobsLabel: "keys",
        hazard: { text: "no Docker flag in tools.deny", from: 0, to: 2 },
      },
    },
    es: {
      surfaces: ES,
      copy: {
        title: "tres capas que parecen el sandbox",
        hint: "pulsa una peana · la flecha es la dirección de las llamadas",
        note: "Deny gana entre capas, y elevated es solo exec. Cuando una tool se bloquea, openclaw logs nombra la capa en la entrada agents/tool-policy.",
        roles: { server: "provisionado", client: "política", bridge: "puente" },
        knobsLabel: "claves",
        hazard: { text: "no pegar flag de Docker en tools.deny", from: 0, to: 2 },
      },
    },
  });

  return <SurfaceCompare surfaces={t.surfaces} copy={t.copy} />;
}
