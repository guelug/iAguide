"use client";

import { createElement, useCallback, type CSSProperties, type ReactNode } from "react";

type Tag = "div" | "li" | "section" | "article" | "figure" | "p";

/**
 * Opacity + lift on first intersection. The observer is wired from the
 * ref callback and torn down by the cleanup React 19 lets a ref callback
 * return, so there is no ref object to read during render.
 */
export function Reveal({
  children,
  delay = 0,
  as = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: Tag;
  className?: string;
}) {
  const attach = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.shown = "true";
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref: attach,
      className: `reveal ${className}`,
      style: { "--reveal-delay": `${delay}ms` } as CSSProperties,
    },
    children,
  );
}
