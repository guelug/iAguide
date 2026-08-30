import type { ComponentType } from "react";
import type { Locale } from "@/i18n/routing";
import type { TrackId } from "@/content/tracks";

import agentPatterns from "./agent-patterns/meta.json";
import attention from "./attention/meta.json";
import kimiDeltaAttention from "./kimi-delta-attention/meta.json";
import attentionResiduals from "./attention-residuals/meta.json";
import callsCacheThreads from "./calls-cache-threads/meta.json";
import contextEngineering from "./context-engineering/meta.json";
import costAndEconomics from "./cost-and-economics/meta.json";
import quotasAndPricing from "./quotas-and-pricing/meta.json";
import data from "./data/meta.json";
import distributedTraining from "./distributed-training/meta.json";
import embeddingsAndRetrieval from "./embeddings-and-retrieval/meta.json";
import evaluation from "./evaluation/meta.json";
import fieldGuide from "./field-guide/meta.json";
import fineTuning from "./fine-tuning/meta.json";
import unsloth from "./unsloth/meta.json";
import unslothQwen38 from "./unsloth-qwen38/meta.json";
import languageOfModels from "./language-of-models/meta.json";
import localInference from "./local-inference/meta.json";
import huggingfaceInference from "./huggingface-inference/meta.json";
import comfyuiFirstWorkflow from "./comfyui-first-workflow/meta.json";
import unslothQwen38Run from "./unsloth-qwen38-run/meta.json";
import mathsYouNeed from "./maths-you-need/meta.json";
import memoryHardware from "./memory-hardware/meta.json";
import mixtureOfExperts from "./mixture-of-experts/meta.json";
import modelZoo from "./model-zoo/meta.json";
import huggingfaceHub from "./huggingface-hub/meta.json";
import multimodal from "./multimodal/meta.json";
import imageModels from "./image-models/meta.json";
import civitaiLoras from "./civitai-loras/meta.json";
import orientation from "./orientation/meta.json";
import quantization from "./quantization/meta.json";
import reinforcementLearning from "./reinforcement-learning/meta.json";
import safetyAndInjection from "./safety-and-injection/meta.json";
import servingAndThroughput from "./serving-and-throughput/meta.json";
import kimiLinearServe from "./kimi-linear-serve/meta.json";
import attnresOptimize from "./attnres-optimize/meta.json";
import theHarness from "./the-harness/meta.json";
import agentLoop from "./agent-loop/meta.json";
import promptAssembly from "./prompt-assembly/meta.json";
import toolsRuntime from "./tools-runtime/meta.json";
import sessionsMod from "./sessions/meta.json";
import gatewayMod from "./gateway/meta.json";
import oauthAndKeys from "./oauth-and-keys/meta.json";
import compressionCaching from "./compression-caching/meta.json";
import pluginsAndSkills from "./plugins-and-skills/meta.json";
import scheduledJobs from "./scheduled-jobs/meta.json";
import browserTools from "./browser-tools/meta.json";
import programmaticAccess from "./programmatic-access/meta.json";
import claudeCodeAndCodex from "./claude-code-and-codex/meta.json";
import hermesOwnership from "./hermes-ownership/meta.json";
import hermesAiagent from "./hermes-aiagent/meta.json";
import hermesProviders from "./hermes-providers/meta.json";
import openrouterPresets from "./openrouter-presets/meta.json";
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
 kimiDeltaAttention,
 attentionResiduals,
  mathsYouNeed,
  embeddingsAndRetrieval,
  theHarness,
  agentLoop,
  promptAssembly,
  toolsRuntime,
  sessionsMod,
  gatewayMod,
  oauthAndKeys,
  compressionCaching,
  pluginsAndSkills,
  scheduledJobs,
  browserTools,
  programmaticAccess,
  claudeCodeAndCodex,
  hermesOwnership,
  hermesAiagent,
  hermesProviders,
  openrouterPresets,
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
 unsloth,
 unslothQwen38,
  functionCallingFt,
  mixtureOfExperts,
  multimodal,
  imageModels,
  civitaiLoras,
  modelZoo,
  huggingfaceHub,
  localInference,
  huggingfaceInference,
  comfyuiFirstWorkflow,
 unslothQwen38Run,
  quantization,
  memoryHardware,
  servingAndThroughput,
 kimiLinearServe,
 attnresOptimize,
  costAndEconomics,
  quotasAndPricing,
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
 "kimi-delta-attention": () => import("./kimi-delta-attention/Visual"),
 "attention-residuals": () => import("./attention-residuals/Visual"),
  "maths-you-need": () => import("./maths-you-need/Visual"),
  "embeddings-and-retrieval": () => import("./embeddings-and-retrieval/Visual"),
  "the-harness": () => import("./the-harness/Visual"),
  "agent-loop": () => import("./agent-loop/Visual"),
  "prompt-assembly": () => import("./prompt-assembly/Visual"),
  "tools-runtime": () => import("./tools-runtime/Visual"),
  sessions: () => import("./sessions/Visual"),
  gateway: () => import("./gateway/Visual"),
  "oauth-and-keys": () => import("./oauth-and-keys/Visual"),
  "compression-caching": () => import("./compression-caching/Visual"),
  "plugins-and-skills": () => import("./plugins-and-skills/Visual"),
  "scheduled-jobs": () => import("./scheduled-jobs/Visual"),
  "browser-tools": () => import("./browser-tools/Visual"),
  "programmatic-access": () => import("./programmatic-access/Visual"),
  "claude-code-and-codex": () => import("./claude-code-and-codex/Visual"),
  "hermes-ownership": () => import("./hermes-ownership/Visual"),
  "hermes-aiagent": () => import("./hermes-aiagent/Visual"),
  "hermes-providers": () => import("./hermes-providers/Visual"),
  "openrouter-presets": () => import("./openrouter-presets/Visual"),
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
 unsloth: () => import("./unsloth/Visual"),
 "unsloth-qwen38": () => import("./unsloth-qwen38/Visual"),
  "mixture-of-experts": () => import("./mixture-of-experts/Visual"),
  multimodal: () => import("./multimodal/Visual"),
  "image-models": () => import("./image-models/Visual"),
  "civitai-loras": () => import("./civitai-loras/Visual"),
  "model-zoo": () => import("./model-zoo/Visual"),
  "huggingface-hub": () => import("./huggingface-hub/Visual"),
  "local-inference": () => import("./local-inference/Visual"),
  "huggingface-inference": () => import("./huggingface-inference/Visual"),
  "comfyui-first-workflow": () => import("./comfyui-first-workflow/Visual"),
 "unsloth-qwen38-run": () => import("./unsloth-qwen38-run/Visual"),
  quantization: () => import("./quantization/Visual"),
  "memory-hardware": () => import("./memory-hardware/Visual"),
  "serving-and-throughput": () => import("./serving-and-throughput/Visual"),
 "kimi-linear-serve": () => import("./kimi-linear-serve/Visual"),
 "attnres-optimize": () => import("./attnres-optimize/Visual"),
  "cost-and-economics": () => import("./cost-and-economics/Visual"),
  "quotas-and-pricing": () => import("./quotas-and-pricing/Visual"),
  "field-guide": () => import("./field-guide/Visual"),
};

export function getVisualLoader(slug: string) {
  return VISUALS[slug];
}

/**
 * Optional extra scenes for a module: Visual2.tsx, Visual3.tsx, ... sit beside
 * Visual.tsx in the same folder and are registered under "<slug>:2",
 * "<slug>:3", ... Use <VisualSlot id="<slug>:2" /> in the MDX to place them
 * near whatever section they teach. Kept in a separate map so an absent
 * extra resolves to undefined without a failed dynamic import.
 */
export const VISUALS_EXTRA: Record<
  string,
  () => Promise<{ default: ComponentType }>
> = {
  "agent-patterns:2": () => import("./agent-patterns/Visual2"),
  "agent-patterns:3": () => import("./agent-patterns/Visual3"),
  "observability:2": () => import("./observability/Visual2"),
  "observability:3": () => import("./observability/Visual3"),
  "the-harness:2": () => import("./the-harness/Visual2"),
  "the-harness:3": () => import("./the-harness/Visual3"),
  "kimi-delta-attention:2": () => import("./kimi-delta-attention/Visual2"),
  "kimi-delta-attention:3": () => import("./kimi-delta-attention/Visual3"),
  "attention-residuals:2": () => import("./attention-residuals/Visual2"),
  "attention-residuals:3": () => import("./attention-residuals/Visual3"),
  "language-of-models:2": () => import("./language-of-models/Visual2"),
  "language-of-models:3": () => import("./language-of-models/Visual3"),
  "dummy-agent:2": () => import("./dummy-agent/Visual2"),
  "agentic-rag:2": () => import("./agentic-rag/Visual2"),
  "llamaindex:2": () => import("./llamaindex/Visual2"),
  "langgraph:2": () => import("./langgraph/Visual2"),
  "gaia:2": () => import("./gaia/Visual2"),
  "smolagents:2": () => import("./smolagents/Visual2"),
  "hermes-skills:2": () => import("./hermes-skills/Visual2"),
  "oauth-and-keys:2": () => import("./oauth-and-keys/Visual2"),
  "calls-cache-threads:2": () => import("./calls-cache-threads/Visual2"),
  "tools-and-mcp:2": () => import("./tools-and-mcp/Visual2"),
  "civitai-loras:2": () => import("./civitai-loras/Visual2"),
  "civitai-loras:3": () => import("./civitai-loras/Visual3"),
  "unsloth:2": () => import("./unsloth/Visual2"),
  "unsloth:3": () => import("./unsloth/Visual3"),
  "fine-tuning:2": () => import("./fine-tuning/Visual2"),
  "fine-tuning:3": () => import("./fine-tuning/Visual3"),
  "training:2": () => import("./training/Visual2"),
  "training:3": () => import("./training/Visual3"),
  "training:4": () => import("./training/Visual4"),
  "image-models:2": () => import("./image-models/Visual2"),
  "image-models:3": () => import("./image-models/Visual3"),
  "function-calling-ft:2": () => import("./function-calling-ft/Visual2"),
  "function-calling-ft:3": () => import("./function-calling-ft/Visual3"),
  "kimi-linear-serve:2": () => import("./kimi-linear-serve/Visual2"),
  "kimi-linear-serve:3": () => import("./kimi-linear-serve/Visual3"),
  "comfyui-first-workflow:2": () => import("./comfyui-first-workflow/Visual2"),
  "comfyui-first-workflow:3": () => import("./comfyui-first-workflow/Visual3"),
  "attnres-optimize:2": () => import("./attnres-optimize/Visual2"),
  "attnres-optimize:3": () => import("./attnres-optimize/Visual3"),
  "game-agents:2": () => import("./game-agents/Visual2"),
  "game-agents:3": () => import("./game-agents/Visual3"),
  "agent-loop:2": () => import("./agent-loop/Visual2"),
  "attention:2": () => import("./attention/Visual2"),
  "attention:3": () => import("./attention/Visual3"),
  "browser-tools:2": () => import("./browser-tools/Visual2"),
  "claude-code-and-codex:2": () => import("./claude-code-and-codex/Visual2"),
  "compression-caching:2": () => import("./compression-caching/Visual2"),
  "context-engineering:2": () => import("./context-engineering/Visual2"),
  "cost-and-economics:2": () => import("./cost-and-economics/Visual2"),
  "data:2": () => import("./data/Visual2"),
  "distributed-training:2": () => import("./distributed-training/Visual2"),
  "distributed-training:3": () => import("./distributed-training/Visual3"),
  "embeddings-and-retrieval:2": () => import("./embeddings-and-retrieval/Visual2"),
  "embeddings-and-retrieval:3": () => import("./embeddings-and-retrieval/Visual3"),
  "evaluation:2": () => import("./evaluation/Visual2"),
  "field-guide:2": () => import("./field-guide/Visual2"),
  "field-guide:3": () => import("./field-guide/Visual3"),
  "gateway:2": () => import("./gateway/Visual2"),
  "hermes-acp:2": () => import("./hermes-acp/Visual2"),
  "hermes-aiagent:2": () => import("./hermes-aiagent/Visual2"),
  "hermes-assembly:2": () => import("./hermes-assembly/Visual2"),
  "hermes-browser:2": () => import("./hermes-browser/Visual2"),
  "hermes-compression:2": () => import("./hermes-compression/Visual2"),
  "hermes-cron:2": () => import("./hermes-cron/Visual2"),
  "hermes-egress:2": () => import("./hermes-egress/Visual2"),
  "hermes-gateway:2": () => import("./hermes-gateway/Visual2"),
  "hermes-loop:2": () => import("./hermes-loop/Visual2"),
  "hermes-ownership:2": () => import("./hermes-ownership/Visual2"),
  "hermes-platforms:2": () => import("./hermes-platforms/Visual2"),
  "hermes-plugins:2": () => import("./hermes-plugins/Visual2"),
  "hermes-providers:2": () => import("./hermes-providers/Visual2"),
  "hermes-sessions:2": () => import("./hermes-sessions/Visual2"),
  "hermes-tools:2": () => import("./hermes-tools/Visual2"),
  "huggingface-hub:2": () => import("./huggingface-hub/Visual2"),
  "huggingface-inference:2": () => import("./huggingface-inference/Visual2"),
  "local-inference:2": () => import("./local-inference/Visual2"),
  "maths-you-need:2": () => import("./maths-you-need/Visual2"),
  "maths-you-need:3": () => import("./maths-you-need/Visual3"),
  "memory-hardware:2": () => import("./memory-hardware/Visual2"),
  "memory-hardware:3": () => import("./memory-hardware/Visual3"),
  "mixture-of-experts:2": () => import("./mixture-of-experts/Visual2"),
  "model-zoo:2": () => import("./model-zoo/Visual2"),
  "multimodal:2": () => import("./multimodal/Visual2"),
  "openclaw-acp:2": () => import("./openclaw-acp/Visual2"),
  "openclaw-acp:3": () => import("./openclaw-acp/Visual3"),
  "openclaw-browser:2": () => import("./openclaw-browser/Visual2"),
  "openclaw-compaction:2": () => import("./openclaw-compaction/Visual2"),
  "openclaw-cron:2": () => import("./openclaw-cron/Visual2"),
  "openclaw-cron:3": () => import("./openclaw-cron/Visual3"),
  "openclaw-gateway:2": () => import("./openclaw-gateway/Visual2"),
  "openclaw-nodes:2": () => import("./openclaw-nodes/Visual2"),
  "openclaw-pairing:2": () => import("./openclaw-pairing/Visual2"),
  "openclaw-protocol:2": () => import("./openclaw-protocol/Visual2"),
  "openclaw-queue:2": () => import("./openclaw-queue/Visual2"),
  "openclaw-reset:2": () => import("./openclaw-reset/Visual2"),
  "openclaw-runtime:2": () => import("./openclaw-runtime/Visual2"),
  "openclaw-sandbox:2": () => import("./openclaw-sandbox/Visual2"),
  "openclaw-sandbox:3": () => import("./openclaw-sandbox/Visual3"),
  "openclaw-sessions:2": () => import("./openclaw-sessions/Visual2"),
  "openclaw-tailscale:2": () => import("./openclaw-tailscale/Visual2"),
  "openclaw-tools:2": () => import("./openclaw-tools/Visual2"),
  "openclaw-workspace:2": () => import("./openclaw-workspace/Visual2"),
  "openrouter-presets:2": () => import("./openrouter-presets/Visual2"),
  "orientation:2": () => import("./orientation/Visual2"),
  "orientation:3": () => import("./orientation/Visual3"),
  "orientation:4": () => import("./orientation/Visual4"),
  "orientation:5": () => import("./orientation/Visual5"),
  "orientation:6": () => import("./orientation/Visual6"),
  "plugins-and-skills:2": () => import("./plugins-and-skills/Visual2"),
  "programmatic-access:2": () => import("./programmatic-access/Visual2"),
  "prompt-assembly:2": () => import("./prompt-assembly/Visual2"),
  "quantization:2": () => import("./quantization/Visual2"),
  "quotas-and-pricing:2": () => import("./quotas-and-pricing/Visual2"),
  "quotas-and-pricing:3": () => import("./quotas-and-pricing/Visual3"),
  "reinforcement-learning:2": () => import("./reinforcement-learning/Visual2"),
  "reinforcement-learning:3": () => import("./reinforcement-learning/Visual3"),
  "safety-and-injection:2": () => import("./safety-and-injection/Visual2"),
  "scheduled-jobs:2": () => import("./scheduled-jobs/Visual2"),
  "serving-and-throughput:2": () => import("./serving-and-throughput/Visual2"),
  "sessions:2": () => import("./sessions/Visual2"),
  "smolagents-multi:2": () => import("./smolagents-multi/Visual2"),
  "tokenization:2": () => import("./tokenization/Visual2"),
  "tools-runtime:2": () => import("./tools-runtime/Visual2"),
  "unsloth-qwen38:2": () => import("./unsloth-qwen38/Visual2"),
  "unsloth-qwen38-run:2": () => import("./unsloth-qwen38-run/Visual2"),
  "unsloth-qwen38-run:3": () => import("./unsloth-qwen38-run/Visual3"),
};

export function getExtraVisualLoader(key: string) {
  return VISUALS_EXTRA[key];
}
