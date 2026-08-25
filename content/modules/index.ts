import type { ComponentType } from "react";
import type { Locale } from "@/i18n/routing";
import meta00 from "./00-orientation/meta.json";
import meta01 from "./01-language-of-models/meta.json";
import meta02 from "./02-the-harness/meta.json";
import meta03 from "./03-calls-cache-threads/meta.json";
import meta04 from "./04-model-zoo/meta.json";
import meta05 from "./05-training/meta.json";
import meta06 from "./06-fine-tuning/meta.json";
import meta07 from "./07-local-inference/meta.json";
import meta08 from "./08-quantization/meta.json";
import meta09 from "./09-memory-hardware/meta.json";
import meta10 from "./10-maths-you-need/meta.json";
import meta11 from "./11-field-guide/meta.json";

export type ModuleStatus = "complete" | "wip";

export type ModuleMeta = {
  id: string;
  order: number;
  slug: string;
  title: { en: string; es: string };
  summary: { en: string; es: string };
  status: ModuleStatus;
  prereqs: string[];
  durationMin: number;
  tags: string[];
  folder: string;
};

const RAW = [
  meta00,
  meta01,
  meta02,
  meta03,
  meta04,
  meta05,
  meta06,
  meta07,
  meta08,
  meta09,
  meta10,
  meta11,
] as Omit<ModuleMeta, "folder">[];

const FOLDERS: Record<string, string> = {
  orientation: "00-orientation",
  "language-of-models": "01-language-of-models",
  "the-harness": "02-the-harness",
  "calls-cache-threads": "03-calls-cache-threads",
  "model-zoo": "04-model-zoo",
  training: "05-training",
  "fine-tuning": "06-fine-tuning",
  "local-inference": "07-local-inference",
  quantization: "08-quantization",
  "memory-hardware": "09-memory-hardware",
  "maths-you-need": "10-maths-you-need",
  "field-guide": "11-field-guide",
};

export const MODULES: ModuleMeta[] = RAW.map((m) => ({
  ...m,
  folder: FOLDERS[m.slug] ?? m.slug,
})).sort((a, b) => a.order - b.order);

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

export function localize(mod: ModuleMeta, locale: Locale) {
  return {
    ...mod,
    title: mod.title[locale],
    summary: mod.summary[locale],
  };
}

export const VISUALS: Record<string, () => Promise<{ default: ComponentType }>> = {
  "language-of-models": () => import("./01-language-of-models/Visual"),
  "the-harness": () => import("./02-the-harness/Visual"),
  quantization: () => import("./08-quantization/Visual"),
  "memory-hardware": () => import("./09-memory-hardware/Visual"),
};

export function getVisualLoader(slug: string) {
  return VISUALS[slug];
}
