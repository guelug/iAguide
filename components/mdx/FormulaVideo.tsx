import type { ReactNode } from "react";

type FormulaVideoProps = {
  src: string;
  label: string;
  caption?: ReactNode;
};

/** Small, accessible MP4 player for generated formula animations. */
export function FormulaVideo({ src, label, caption }: FormulaVideoProps) {
  return (
    <figure className="not-prose my-7 overflow-hidden rounded-xl border border-violet/30 bg-violet-wash">
      <video className="block w-full" controls playsInline muted preload="metadata" aria-label={label}>
        <source src={src} type="video/mp4" />
        {label}
      </video>
      {caption ? <figcaption className="border-t border-violet/20 px-4 py-2.5 text-[0.9rem] leading-relaxed text-ink-soft">{caption}</figcaption> : null}
    </figure>
  );
}
