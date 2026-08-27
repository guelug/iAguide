"use client";

import { Children, isValidElement, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Two learning paths for the same lesson: a quick route and a deep route.
 *
 * Usage in MDX:
 *
 *   <Path>
 *     <Easy>
 *       The five-minute version. Enough to keep moving.
 *     </Easy>
 *     <Hard>
 *       The full version. Why it works, the failure modes, the numbers.
 *     </Hard>
 *   </Path>
 *
 * The reader picks a tab; the panel animates in. Both paths teach the same
 * concept, so nobody gets lost by choosing the short one.
 */
export function Path({ children }: { children: ReactNode }) {
  const t = useTranslations("mdx");
  const [mode, setMode] = useState<"easy" | "hard">("easy");

  // Find the two panels among children.
  let easy: ReactNode = null;
  let hard: ReactNode = null;
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const name = (child.type as { displayName?: string })?.displayName ?? "";
    if (name === "Easy") easy = child;
    if (name === "Hard") hard = child;
  });

  return (
    <div className="not-prose my-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <div className="flex border-b border-line/70">
        <button
          onClick={() => setMode("easy")}
          className={`flex-1 px-4 py-2.5 text-left transition-colors ${
            mode === "easy"
              ? "bg-teal-wash/60 text-teal-deep"
              : "text-ink-soft hover:bg-sunken"
          }`}
        >
          <span className="block font-mono text-[0.62rem] tracking-[0.2em] uppercase">
            {t("pathEasy")}
          </span>
          <span className="mt-0.5 block text-xs font-medium">
            {t("pathEasyHint")}
          </span>
        </button>
        <button
          onClick={() => setMode("hard")}
          className={`flex-1 px-4 py-2.5 text-left transition-colors ${
            mode === "hard"
              ? "bg-violet-wash/60 text-violet-deep"
              : "text-ink-soft hover:bg-sunken"
          }`}
        >
          <span className="block font-mono text-[0.62rem] tracking-[0.2em] uppercase">
            {t("pathHard")}
          </span>
          <span className="mt-0.5 block text-xs font-medium">
            {t("pathHardHint")}
          </span>
        </button>
      </div>
      <div className="px-4 py-4">
        <div
          key={mode}
          className="animate-path-in text-sm leading-relaxed text-ink"
        >
          {mode === "easy" ? easy : hard}
        </div>
      </div>
    </div>
  );
}

export function Easy({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
Easy.displayName = "Easy";

export function Hard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
Hard.displayName = "Hard";
