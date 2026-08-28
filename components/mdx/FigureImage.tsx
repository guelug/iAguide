import type { ReactNode } from "react";

type FigureImageProps = {
  src: string;
  label: string;
  caption?: ReactNode;
};

/** Accessible wrapper for generated editorial illustrations in lessons. */
export function FigureImage({ src, label, caption }: FigureImageProps) {
  return (
    <figure className="not-prose my-7 overflow-hidden rounded-xl border border-line bg-sunken">
      <img
        src={src}
        alt={label}
        className="block h-auto w-full"
        loading="lazy"
        decoding="async"
      />
      {caption ? (
        <figcaption className="border-t border-line px-4 py-2.5 text-[0.9rem] leading-relaxed text-ink-soft">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
