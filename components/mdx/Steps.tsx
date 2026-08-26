import type { ReactNode } from "react";

/**
 * A procedure with a rail down the side. Used for anything that happens
 * in a fixed order — a turn of the agent loop, a training step, a first
 * hour with a local model.
 */
export function Steps({ children }: { children: ReactNode }) {
  return (
    <div className="steps not-prose my-7 border-l border-line pl-6 [counter-reset:step]">
      {children}
    </div>
  );
}

export function Step({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="relative mb-5 [counter-increment:step] last:mb-0">
      <span
        aria-hidden
        className="absolute -left-[2.16rem] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-teal/50 bg-paper font-mono text-[0.6rem] text-teal before:content-[counter(step)]"
      />
      <p className="font-medium text-ink">{title}</p>
      {children ? (
        <div className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{children}</div>
      ) : null}
    </div>
  );
}
