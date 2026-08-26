import type { ReactNode } from "react";

/**
 * An equation with its plain-language reading attached. A formula the
 * reader cannot say out loud has not been taught.
 */
export function Formula({
  reads,
  children,
}: {
  /** How you would say it at a whiteboard. */
  reads?: string;
  children: ReactNode;
}) {
  return (
    <div className="not-prose my-7 overflow-hidden rounded-xl border border-violet/30 bg-violet-dim/30">
      <div className="overflow-x-auto px-4 py-4 text-paper">{children}</div>
      {reads ? (
        <p className="border-t border-violet/20 px-4 py-2.5 text-[0.9rem] leading-relaxed text-paper/75">
          <span className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-violet">
            reads&nbsp;·&nbsp;
          </span>
          {reads}
        </p>
      ) : null}
    </div>
  );
}
