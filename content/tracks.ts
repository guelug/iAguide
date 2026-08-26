import { P } from "@/lib/palette";
import type { Locale } from "@/i18n/routing";

export type TrackId = "foundations" | "harness" | "training" | "metal";

export type Track = {
  id: TrackId;
  color: string;
  /** Roman numeral shown on the map. */
  numeral: string;
  name: { en: string; es: string };
  blurb: { en: string; es: string };
};

export const TRACKS: Track[] = [
  {
    id: "foundations",
    color: P.teal,
    numeral: "I",
    name: { en: "Foundations", es: "Fundamentos" },
    blurb: {
      en: "What a language model is doing when it answers you: tokens, attention, vectors, and the small pile of maths you actually need.",
      es: "Qué hace de verdad un modelo de lenguaje cuando te responde: tokens, atención, vectores y el poco de matemáticas que sí hace falta.",
    },
  },
  {
    id: "harness",
    color: P.amber,
    numeral: "II",
    name: { en: "The harness", es: "El arnés" },
    blurb: {
      en: "The loop you build around the weights: prompts, tools, threads, caches, subagents, evals, and the ways it gets attacked.",
      es: "El bucle que construyes alrededor de los pesos: prompts, herramientas, hilos, cachés, subagentes, evals y cómo lo atacan.",
    },
  },
  {
    id: "training",
    color: P.violet,
    numeral: "III",
    name: { en: "Making models", es: "Fabricar modelos" },
    blurb: {
      en: "Pretraining, data, parallelism, reinforcement learning, fine-tuning, mixtures of experts, and everything that is not text.",
      es: "Preentrenamiento, datos, paralelismo, aprendizaje por refuerzo, fine-tuning, mezclas de expertos y todo lo que no es texto.",
    },
  },
  {
    id: "metal",
    color: P.paper,
    numeral: "IV",
    name: { en: "Running them", es: "Hacerlos correr" },
    blurb: {
      en: "Choosing weights, quantizing them, feeding them memory and bandwidth, serving them fast, and knowing what it costs.",
      es: "Elegir pesos, cuantizarlos, alimentarlos con memoria y ancho de banda, servirlos rápido y saber lo que cuesta.",
    },
  },
];

export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t])) as Record<
  TrackId,
  Track
>;

export function trackName(id: TrackId, locale: Locale) {
  return TRACK_BY_ID[id].name[locale];
}
