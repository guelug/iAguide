import Image from "next/image";
import type { ReactNode } from "react";

type FigureImageProps = {
  src: string;
  label: string;
  caption?: ReactNode;
  /** Intrinsic size. Every illustration shipped so far is 2816×1584. */
  width?: number;
  height?: number;
};

/**
 * Accessible wrapper for the generated editorial illustrations in lessons.
 *
 * The dimensions are real rather than guessed, so the browser reserves the
 * right box before the file arrives and the prose does not jump while a
 * reader is part-way down a paragraph.
 */
export function FigureImage({
  src,
  label,
  caption,
  width = 2816,
  height = 1584,
}: FigureImageProps) {
  return (
    <figure className="not-prose my-7 overflow-hidden rounded-xl border border-line bg-sunken">
      <Image
        src={src}
        alt={label}
        width={width}
        height={height}
        className="block h-auto w-full"
        sizes="(min-width: 82rem) 56rem, (min-width: 48rem) 90vw, 100vw"
      />
      {caption ? (
        <figcaption className="border-t border-line px-4 py-2.5 text-[0.9rem] leading-relaxed text-ink-soft">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
