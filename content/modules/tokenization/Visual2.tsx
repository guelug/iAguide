"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, PointerTilt, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* tokenization: BPE merge on real examples, vocab lattice, special tokens. */
type Mode = "bpe" | "vocab" | "specials";

const COPY = {
  en: {
    the_tokenizer_is_the_models_language: "the tokenizer is the model's language",
    bpe_vocab_specials: "bpe merges · vocab lattice · special tokens",
    bpe: "bpe merge",
    vocab: "vocab",
    specials: "specials",
    merging: "merging pairs",
    final_tokens: "final tokens",
    lit: "lit = frequent",
    dark: "dark = rare",
    chatml: "chatML",
  },
  es: {
    the_tokenizer_is_the_models_language: "el tokenizador es el lenguaje del modelo",
    bpe_vocab_specials: "fusiones bpe · vocabulario · tokens especiales",
    bpe: "fusión bpe",
    vocab: "vocabulario",
    specials: "especiales",
    merging: "fusionando pares",
    final_tokens: "tokens finales",
    lit: "encendido = frecuente",
    dark: "oscuro = raro",
    chatml: "chatML",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("bpe");

  // Real BPE: "low er low est" → "low lower lowest"
  const steps = [
    ["low", " ", "e", "s", "t"],
    ["low", " ", "es", "t"],
    ["low", " ", "est"],
    ["low", " est"],
    ["low", " est"],
  ];

  return (
    <Figure
      label={t.the_tokenizer_is_the_models_language}
      hint={t.bpe_vocab_specials}
      legend={[
        { color: P.teal, label: t.bpe },
        { color: P.violet, label: t.vocab },
        { color: P.rose, label: t.specials },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "bpe", label: t.bpe, tone: P.teal },
            { value: "vocab", label: t.vocab, tone: P.violet },
            { value: "specials", label: t.specials, tone: P.rose },
          ]}
          ariaLabel={t.the_tokenizer_is_the_models_language}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "bpe" && (
          <>
            {/* merge animation over 5 steps */}
            {steps.map((toks, step) => (
              <group key={step} position={[0, 1.2 - step * 0.55, 0]}>
                {toks.map((tok, i) => (
                  <Slab
                    key={i + "-" + tok}
                    position={[-2.4 + i * 0.55, 0, 0]}
                    size={[0.5, 0.4, 0.08]}
                    color={step === 4 ? P.teal : P.muted}
                    fill={step === 4 ? 0.32 : 0.12}
                  />
                ))}
                <Tag position={[-2.9, 0, 0.15]} tone="muted" size="xs">#{step}</Tag>
              </group>
            ))}
            <Tag position={[0, -1.85, 0.15]} tone="muted" size="xs">{t.merging}</Tag>
            <Wire points={[[2.0, 1.2, 0], [2.0, -1.6, 0]]} color={P.teal} width={2.5} opacity={0.8} />
            <Tag position={[2.35, -0.4, 0.15]} tone="teal" size="xs">{t.final_tokens}</Tag>
          </>
        )}

        {mode === "vocab" && (
          <>
            <Lattice
              cells={Array.from({ length: 32 }, (_, i) => ({
                position: [-1.9 + (i % 8) * 0.55, 1.0 - Math.floor(i / 8) * 0.55, 0] as [number, number, number],
                color: i % 3 === 0 ? P.teal : i % 7 === 0 ? P.amber : P.muted,
              }))}
              size={0.28}
              opacity={0.9}
            />
            <Tag position={[0, 1.55, 0.15]} tone="violet">~50–200k tokens</Tag>
            <Tag position={[-2.3, -0.6, 0.15]} tone="teal" size="xs">{t.lit}</Tag>
            <Tag position={[2.3, -0.6, 0.15]} tone="muted" size="xs">{t.dark}</Tag>
          </>
        )}

        {mode === "specials" && (
          <>
            {(
              [
                ["<|im_start|>", P.rose, -2.0],
                ["user", P.teal, 0],
                ["<|im_end|>", P.rose, 2.0],
              ] as const
            ).map(([lab, col, x]) => (
              <group key={lab}>
                <Slab position={[x, 0.55, 0]} size={[1.7, 0.85, 0.14]} color={col} fill={col === P.rose ? 0.32 : 0.18} />
                <Tag position={[x, 1.15, 0.15]} tone={col === P.rose ? "rose" : "teal"} size="xs">
                  {lab}
                </Tag>
              </group>
            ))}
            <Wire points={[[-1.1, 0.55, 0], [-0.85, 0.55, 0]]} color={P.lineStrong} opacity={0.6} />
            <Wire points={[[0.85, 0.55, 0], [1.1, 0.55, 0]]} color={P.lineStrong} opacity={0.6} />
            <Tag position={[0, -0.35, 0.15]} tone="muted" size="xs">{t.chatml}</Tag>
            {/* rose = invisible to normal text but meaningful to model */}
            <Tag position={[0, -1.05, 0.15]} tone="rose" size="xs">control tokens</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
