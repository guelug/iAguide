import type { ReactNode } from "react";

/**
 * Two columns that are genuinely in tension — VRAM vs unified memory,
 * LoRA vs full fine-tune. Not a table: tables invite fake symmetry.
 */
export function Compare({
  a,
  b,
  children,
}: {
  a: string;
  b: string;
  children: ReactNode;
}) {
  return (
    <div className="not-prose my-7 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
      <div className="bg-ink px-4 py-3">
        <p className="font-mono text-[0.62rem] tracking-[0.18em] uppercase text-teal">{a}</p>
      </div>
      <div className="bg-ink px-4 py-3">
        <p className="font-mono text-[0.62rem] tracking-[0.18em] uppercase text-amber">{b}</p>
      </div>
      <div className="compare-body col-span-full bg-ink px-4 py-4 text-[0.98rem] leading-relaxed text-paper/85 md:col-span-2">
        <div className="grid gap-6 md:grid-cols-2">{children}</div>
      </div>
    </div>
  );
}

/** One side of a <Compare>. Use two per block, in order. */
export function Side({ children }: { children: ReactNode }) {
  return <div className="space-y-2 text-[0.95rem] leading-relaxed">{children}</div>;
}
