"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "input" | "output" | "cache";

export default function Visual() {
  const t = useCopy({
    en: {
      "tokens_are_a_bill": "tokens are a bill",
      "cache_hits_are_the_discount": "cache hits are the discount",
      "input_tokens": "input tokens",
      "output": "output",
      "cached_prefix": "cached prefix",
      "input_tokens_2": "Input tokens",
      "output_2": "Output",
      "cached_prefix_2": "Cached prefix"
    },
    es: {
      "tokens_are_a_bill": "los tokens son la factura",
      "cache_hits_are_the_discount": "los aciertos de caché son el descuento",
      "input_tokens": "tokens de entrada",
      "output": "salida",
      "cached_prefix": "prefijo en caché",
      "input_tokens_2": "Tokens de entrada",
      "output_2": "Salida",
      "cached_prefix_2": "Prefijo en caché"
    },
  });
  const [mode, setMode] = useState<Mode>("input");
  return (
    <Figure
      label={t.tokens_are_a_bill}
      hint={t.cache_hits_are_the_discount}
      legend={[
          { color: P.teal, label: t.input_tokens },
          { color: P.amber, label: t.output },
          { color: P.violet, label: t.cached_prefix }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "input", label: t.input_tokens_2, tone: P.teal },
            { value: "output", label: t.output_2, tone: P.amber },
            { value: "cache", label: t.cached_prefix_2, tone: P.violet }
          ]}
          ariaLabel={t.cache_hits_are_the_discount}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 8.0], fov: 40 }}>

        {/* Input slab */}
        <Slab
          position={[-2.0, 0.3, 0]}
          size={[2.4, 1.7, 0.12]}
          color={P.teal}
          fill={mode === "cache" ? 0.14 : 0.34}
        />
        <Tag position={[-2.0, 1.25, 0.2]} tone="teal">
          {mode === "cache" ? "prefijo en caché" : "factura de prefill"}
        </Tag>

        {/* Output slab */}
        <Slab
          position={[2.0, 0.3, 0]}
          size={[2.4, 1.7, 0.12]}
          color={P.amber}
          fill={0.32}
        />
        <Tag position={[2.0, 1.25, 0.2]} tone="amber">factura de decode</Tag>

        {/* Cache overlay only visible in cache mode */}
        {mode === "cache" ? (
          <>
            <Slab position={[-2.0, 0.3, 0.05]} size={[2.4, 1.7, 0.08]} color={P.violet} fill={0.18} />
            <Tag position={[0, -0.55, 0.2]} tone="violet">sigues pagando los tokens nuevos</Tag>
            <Flow points={[[-3.2, 0.3, 0.2], [-0.8, 0.3, 0.2]]} color={P.violet} count={4} />
          </>
        ) : (
          <Tag position={[0, -0.7, 0.2]} tone="muted">entrada + salida ≠ palabras</Tag>
        )}

      </Stage>
    </Figure>
  );
}
