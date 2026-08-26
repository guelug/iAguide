import type { ComponentType } from "react";
import type { Locale } from "@/i18n/routing";
import type { TrackId } from "@/content/tracks";

import agentPatterns from "./agent-patterns/meta.json";
import attention from "./attention/meta.json";
import callsCacheThreads from "./calls-cache-threads/meta.json";
import contextEngineering from "./context-engineering/meta.json";
import costAndEconomics from "./cost-and-economics/meta.json";
import data from "./data/meta.json";
import distributedTraining from "./distributed-training/meta.json";
import embeddingsAndRetrieval from "./embeddings-and-retrieval/meta.json";
import evaluation from "./evaluation/meta.json";
import fieldGuide from "./field-guide/meta.json";
import fineTuning from "./fine-tuning/meta.json";
import languageOfModels from "./language-of-models/meta.json";
import localInference from "./local-inference/meta.json";
import mathsYouNeed from "./maths-you-need/meta.json";
import memoryHardware from "./memory-hardware/meta.json";
import mixtureOfExperts from "./mixture-of-experts/meta.json";
import modelZoo from "./model-zoo/meta.json";
import multimodal from "./multimodal/meta.json";
import orientation from "./orientation/meta.json";
import quantization from "./quantization/meta.json";
import reinforcementLearning from "./reinforcement-learning/meta.json";
import safetyAndInjection from "./safety-and-injection/meta.json";
import servingAndThroughput from "./serving-and-throughput/meta.json";
import theHarness from "./the-harness/meta.json";
import tokenization from "./tokenization/meta.json";
import tools from "./tools-and-mcp/meta.json";
import training from "./training/meta.json";

export type ModuleStatus = "complete" | "wip";

export type ModuleMeta = {
  id: string;
  order: number;
  slug: string;
  track: TrackId;
  title: { en: string; es: string };
  summary: { en: string; es: string };
  status: ModuleStatus;
  prereqs: string[];
  durationMin: number;
  tags: string[];
};

/**
 * The registry. A module is a folder: meta.json, en.mdx, es.mdx, and an
 * optional Visual.tsx. Adding one means adding an import here and, if it
 * ships a diagram, a line in VISUALS. Nothing else in the app changes.
 */
const RAW = [
  orientation,
  languageOfModels,
  tokenization,
  attention,
  mathsYouNeed,
  embeddingsAndRetrieval,
  theHarness,
  callsCacheThreads,
  contextEngineering,
  tools,
  agentPatterns,
  evaluation,
  safetyAndInjection,
  training,
  data,
  distributedTraining,
  reinforcementLearning,
  fineTuning,
  mixtureOfExperts,
  multimodal,
  modelZoo,
  localInference,
  quantization,
  memoryHardware,
  servingAndThroughput,
  costAndEconomics,
  fieldGuide,
] as ModuleMeta[];

export const MODULES: ModuleMeta[] = [...RAW].sort((a, b) => a.order - b.order);

export const READY = MODULES.filter((m) => m.status === "complete");

export const TOTAL_MINUTES = MODULES.reduce((n, m) => n + m.durationMin, 0);

export function getModule(slug: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function getNext(slug: string): ModuleMeta | undefined {
  const i = MODULES.findIndex((m) => m.slug === slug);
  if (i < 0 || i === MODULES.length - 1) return undefined;
  return MODULES[i + 1];
}

export function getPrev(slug: string): ModuleMeta | undefined {
  const i = MODULES.findIndex((m) => m.slug === slug);
  if (i <= 0) return undefined;
  return MODULES[i - 1];
}

export function modulesByTrack(track: TrackId): ModuleMeta[] {
  return MODULES.filter((m) => m.track === track);
}

export function localize(mod: ModuleMeta, locale: Locale) {
  return {
    ...mod,
    title: mod.title[locale],
    summary: mod.summary[locale],
  };
}

/**
 * Diagrams are lazily imported so a lesson only pays for its own scene.
 * The key is the module slug; <VisualSlot /> resolves it from the route.
 */
export const VISUALS: Record<string, () => Promise<{ default: ComponentType }>> = {
  orientation: () => import("./orientation/Visual"),
  "language-of-models": () => import("./language-of-models/Visual"),
  tokenization: () => import("./tokenization/Visual"),
  attention: () => import("./attention/Visual"),
  "maths-you-need": () => import("./maths-you-need/Visual"),
  "embeddings-and-retrieval": () => import("./embeddings-and-retrieval/Visual"),
  "the-harness": () => import("./the-harness/Visual"),
  "calls-cache-threads": () => import("./calls-cache-threads/Visual"),
  "context-engineering": () => import("./context-engineering/Visual"),
  "tools-and-mcp": () => import("./tools-and-mcp/Visual"),
  "agent-patterns": () => import("./agent-patterns/Visual"),
  evaluation: () => import("./evaluation/Visual"),
  "safety-and-injection": () => import("./safety-and-injection/Visual"),
  training: () => import("./training/Visual"),
  data: () => import("./data/Visual"),
  "distributed-training": () => import("./distributed-training/Visual"),
  "reinforcement-learning": () => import("./reinforcement-learning/Visual"),
  "fine-tuning": () => import("./fine-tuning/Visual"),
  "mixture-of-experts": () => import("./mixture-of-experts/Visual"),
  multimodal: () => import("./multimodal/Visual"),
  "model-zoo": () => import("./model-zoo/Visual"),
  "local-inference": () => import("./local-inference/Visual"),
  quantization: () => import("./quantization/Visual"),
  "memory-hardware": () => import("./memory-hardware/Visual"),
  "serving-and-throughput": () => import("./serving-and-throughput/Visual"),
  "cost-and-economics": () => import("./cost-and-economics/Visual"),
  "field-guide": () => import("./field-guide/Visual"),
};

export function getVisualLoader(slug: string) {
  return VISUALS[slug];
}
