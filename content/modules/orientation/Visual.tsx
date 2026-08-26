"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "foundations" | "harness" | "metal";

export default function Visual() {
  const t = useCopy({
    en: {
      "four_tracks": "four tracks",
      "step_the_figure": "step the figure",
      "foundations": "foundations",
      "foundations_2": "Foundations"
    },
    es: {
      "four_tracks": "cuatro pistas",
      "step_the_figure": "recorre la figura",
      "foundations": "fundamentos",
      "foundations_2": "Fundamentos"
    },
  });
  const [mode, setMode] = useState<Mode>("foundations");
  return (
    <Figure
      label={t.four_tracks}
      hint={t.step_the_figure}
      legend={[
          { color: P.teal, label: t.foundations },
          { color: P.amber, label: "harness" },
          { color: P.violet, label: "metal" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "foundations", label: t.foundations_2, tone: P.teal },
            { value: "harness", label: "Harness", tone: P.amber },
            { value: "metal", label: "Metal", tone: P.violet }
          ]}
          ariaLabel={t.step_the_figure}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 7.5], fov: 40 }}>
        
        <Slab position={[-2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.teal} fill={mode === "foundations" ? 0.34 : 0.12} />
        <Tag position={[-2.2, 1.2, 0.2]} tone="teal">{t.foundations_2}</Tag>
        <Slab position={[0, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.amber} fill={mode === "harness" ? 0.34 : 0.12} />
        <Tag position={[0, 1.2, 0.2]} tone="amber">Harness</Tag>
        <Slab position={[2.2, 0.2, 0]} size={[1.9, 1.7, 0.12]} color={P.violet} fill={mode === "metal" ? 0.34 : 0.12} />
        <Tag position={[2.2, 1.2, 0.2]} tone="violet">Metal</Tag>
        <Flow points={[[-1.2, 0.2, 0], [-0.95, 0.2, 0]]} color={P.teal} count={2} />
        <Flow points={[[1.0, 0.2, 0], [1.25, 0.2, 0]]} color={P.amber} count={2} />
        
      </Stage>
    </Figure>
  );
}
