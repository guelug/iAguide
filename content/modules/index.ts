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
import agentLoop from "./agent-loop/meta.json";
import promptAssembly from "./prompt-assembly/meta.json";
import toolsRuntime from "./tools-runtime/meta.json";
import sessionsMod from "./sessions/meta.json";
import gatewayMod from "./gateway/meta.json";
import compressionCaching from "./compression-caching/meta.json";
import pluginsAndSkills from "./plugins-and-skills/meta.json";
import scheduledJobs from "./scheduled-jobs/meta.json";
import browserTools from "./browser-tools/meta.json";
import programmaticAccess from "./programmatic-access/meta.json";
import hermesOwnership from "./hermes-ownership/meta.json";
import hermesAiagent from "./hermes-aiagent/meta.json";
import hermesProviders from "./hermes-providers/meta.json";
import hermesLoop from "./hermes-loop/meta.json";
import hermesAssembly from "./hermes-assembly/meta.json";
import hermesCompression from "./hermes-compression/meta.json";
import hermesSessions from "./hermes-sessions/meta.json";
import hermesGateway from "./hermes-gateway/meta.json";
import hermesTools from "./hermes-tools/meta.json";
import hermesPlugins from "./hermes-plugins/meta.json";
import hermesPlatforms from "./hermes-platforms/meta.json";
import hermesSkills from "./hermes-skills/meta.json";
import hermesCron from "./hermes-cron/meta.json";
import hermesBrowser from "./hermes-browser/meta.json";
import hermesAcp from "./hermes-acp/meta.json";
import hermesEgress from "./hermes-egress/meta.json";
import openclawGateway from "./openclaw-gateway/meta.json";
import openclawProtocol from "./openclaw-protocol/meta.json";
import openclawNodes from "./openclaw-nodes/meta.json";
import openclawQueue from "./openclaw-queue/meta.json";
import openclawRuntime from "./openclaw-runtime/meta.json";
import openclawWorkspace from "./openclaw-workspace/meta.json";
import openclawSessions from "./openclaw-sessions/meta.json";
import openclawReset from "./openclaw-reset/meta.json";
import openclawPairing from "./openclaw-pairing/meta.json";
import openclawTailscale from "./openclaw-tailscale/meta.json";
import openclawSandbox from "./openclaw-sandbox/meta.json";
import openclawCompaction from "./openclaw-compaction/meta.json";
import openclawTools from "./openclaw-tools/meta.json";
import openclawCron from "./openclaw-cron/meta.json";
import openclawBrowser from "./openclaw-browser/meta.json";
import openclawAcp from "./openclaw-acp/meta.json";
import tokenization from "./tokenization/meta.json";
import tools from "./tools-and-mcp/meta.json";
import training from "./training/meta.json";
import dummyAgent from "./dummy-agent/meta.json";
import smolagents from "./smolagents/meta.json";
import smolagentsMulti from "./smolagents-multi/meta.json";
import llamaindex from "./llamaindex/meta.json";
import langgraph from "./langgraph/meta.json";
import agenticRag from "./agentic-rag/meta.json";
import observability from "./observability/meta.json";
import gaia from "./gaia/meta.json";
import functionCallingFt from "./function-calling-ft/meta.json";
import gameAgents from "./game-agents/meta.json";

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
  agentLoop,
  promptAssembly,
  toolsRuntime,
  sessionsMod,
  gatewayMod,
  compressionCaching,
  pluginsAndSkills,
  scheduledJobs,
  browserTools,
  programmaticAccess,
  hermesOwnership,
  hermesAiagent,
  hermesProviders,
  hermesLoop,
  hermesAssembly,
  hermesCompression,
  hermesSessions,
  hermesGateway,
  hermesTools,
  hermesPlugins,
  hermesPlatforms,
  hermesSkills,
  hermesCron,
  hermesBrowser,
  hermesAcp,
  hermesEgress,
  openclawGateway,
  openclawProtocol,
  openclawNodes,
  openclawQueue,
  openclawRuntime,
  openclawWorkspace,
  openclawSessions,
  openclawReset,
  openclawPairing,
  openclawTailscale,
  openclawSandbox,
  openclawCompaction,
  openclawTools,
  openclawCron,
  openclawBrowser,
  openclawAcp,
  callsCacheThreads,
  contextEngineering,
  tools,
  agentPatterns,
  evaluation,
  observability,
  gaia,
  safetyAndInjection,
  dummyAgent,
  smolagents,
  smolagentsMulti,
  llamaindex,
  langgraph,
  agenticRag,
  training,
  data,
  distributedTraining,
  reinforcementLearning,
  fineTuning,
  functionCallingFt,
  mixtureOfExperts,
  multimodal,
  modelZoo,
  localInference,
  quantization,
  memoryHardware,
  servingAndThroughput,
  costAndEconomics,
  gameAgents,
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
  "agent-loop": () => import("./agent-loop/Visual"),
  "prompt-assembly": () => import("./prompt-assembly/Visual"),
  "tools-runtime": () => import("./tools-runtime/Visual"),
  sessions: () => import("./sessions/Visual"),
  gateway: () => import("./gateway/Visual"),
  "compression-caching": () => import("./compression-caching/Visual"),
  "plugins-and-skills": () => import("./plugins-and-skills/Visual"),
  "scheduled-jobs": () => import("./scheduled-jobs/Visual"),
  "browser-tools": () => import("./browser-tools/Visual"),
  "programmatic-access": () => import("./programmatic-access/Visual"),
  "hermes-ownership": () => import("./hermes-ownership/Visual"),
  "hermes-aiagent": () => import("./hermes-aiagent/Visual"),
  "hermes-providers": () => import("./hermes-providers/Visual"),
  "hermes-loop": () => import("./hermes-loop/Visual"),
  "hermes-assembly": () => import("./hermes-assembly/Visual"),
  "hermes-compression": () => import("./hermes-compression/Visual"),
  "hermes-sessions": () => import("./hermes-sessions/Visual"),
  "hermes-gateway": () => import("./hermes-gateway/Visual"),
  "hermes-tools": () => import("./hermes-tools/Visual"),
  "hermes-plugins": () => import("./hermes-plugins/Visual"),
  "hermes-platforms": () => import("./hermes-platforms/Visual"),
  "hermes-skills": () => import("./hermes-skills/Visual"),
  "hermes-cron": () => import("./hermes-cron/Visual"),
  "hermes-browser": () => import("./hermes-browser/Visual"),
  "hermes-acp": () => import("./hermes-acp/Visual"),
  "hermes-egress": () => import("./hermes-egress/Visual"),
  "openclaw-gateway": () => import("./openclaw-gateway/Visual"),
  "openclaw-protocol": () => import("./openclaw-protocol/Visual"),
  "openclaw-nodes": () => import("./openclaw-nodes/Visual"),
  "openclaw-queue": () => import("./openclaw-queue/Visual"),
  "openclaw-runtime": () => import("./openclaw-runtime/Visual"),
  "openclaw-workspace": () => import("./openclaw-workspace/Visual"),
  "openclaw-sessions": () => import("./openclaw-sessions/Visual"),
  "openclaw-reset": () => import("./openclaw-reset/Visual"),
  "openclaw-pairing": () => import("./openclaw-pairing/Visual"),
  "openclaw-tailscale": () => import("./openclaw-tailscale/Visual"),
  "openclaw-sandbox": () => import("./openclaw-sandbox/Visual"),
  "openclaw-compaction": () => import("./openclaw-compaction/Visual"),
  "openclaw-tools": () => import("./openclaw-tools/Visual"),
  "openclaw-cron": () => import("./openclaw-cron/Visual"),
  "openclaw-browser": () => import("./openclaw-browser/Visual"),
  "openclaw-acp": () => import("./openclaw-acp/Visual"),
  "calls-cache-threads": () => import("./calls-cache-threads/Visual"),
  "context-engineering": () => import("./context-engineering/Visual"),
  "tools-and-mcp": () => import("./tools-and-mcp/Visual"),
  "agent-patterns": () => import("./agent-patterns/Visual"),
  evaluation: () => import("./evaluation/Visual"),
  "safety-and-injection": () => import("./safety-and-injection/Visual"),
  "dummy-agent": () => import("./dummy-agent/Visual"),
  smolagents: () => import("./smolagents/Visual"),
  "smolagents-multi": () => import("./smolagents-multi/Visual"),
  llamaindex: () => import("./llamaindex/Visual"),
  langgraph: () => import("./langgraph/Visual"),
  "agentic-rag": () => import("./agentic-rag/Visual"),
  observability: () => import("./observability/Visual"),
  gaia: () => import("./gaia/Visual"),
  "function-calling-ft": () => import("./function-calling-ft/Visual"),
  "game-agents": () => import("./game-agents/Visual"),
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
