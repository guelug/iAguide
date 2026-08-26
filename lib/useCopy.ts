"use client";

import { useLocale } from "next-intl";

/**
 * Visuals carry their own copy instead of going through messages/*.json.
 * A diagram's labels only make sense next to the geometry that uses them,
 * and keeping them in the same file is what makes a module a drop-in folder.
 */
export function useCopy<T>(dict: { en: T; es: T }): T {
  const locale = useLocale();
  return locale === "es" ? dict.es : dict.en;
}

export type Bi<T = string> = { en: T; es: T };
