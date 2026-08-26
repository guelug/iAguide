"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "model" | "harness" | "metal";

export default function Visual() {
  const t = useCopy({
    en: {
      "which_layer_failed": "which layer failed",
      "model_harness_metal": "model · harness · metal",
      "model": "model",
      "model_2": "Model"
    },
    es: {
      "which_layer_failed": "qué capa falló",
      "model_harness_metal": "modelo · harness · metal",
      "model": "modelo",
      "model_2": "Modelo"
    },
  });
  const [mode, setMode] = useState<Mode>("model");
  return (
    <Figure
      label={t.which_layer_failed}
      hint={t.model_harness_metal}
      legend={[
          { color: P.teal, label: t.model },
          { color: P.amber, label: "harness" },
          { color: P.violet, label: "metal" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "model", label: t.model_2, tone: P.teal },
            { value: "harness", label: "Harness", tone: P.amber },
            { value: "metal", label: "Metal", tone: P.violet }
          ]}
          ariaLabel={t.model_harness_metal}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.2, 0]} size={[1.8, 1.8, 0.12]} color={P.teal} fill={mode === "model" ? 0.34 : 0.12} />
        <Tag position={[-2.2, 1.25, 0.2]} tone="teal">weights</Tag>
        <Slab position={[0, 0.2, 0]} size={[1.8, 1.8, 0.12]} color={P.amber} fill={mode === "harness" ? 0.34 : 0.12} />
        <Tag position={[0, 1.25, 0.2]} tone="amber">loop</Tag>
        <Slab position={[2.2, 0.2, 0]} size={[1.8, 1.8, 0.12]} color={P.violet} fill={mode === "metal" ? 0.34 : 0.12} />
        <Tag position={[2.2, 1.25, 0.2]} tone="violet">runtime</Tag>
        <Tag position={[0, -1.2, 0.2]} tone="muted">name the layer before you patch</Tag>
    
      </Stage>
    </Figure>
  );
}
