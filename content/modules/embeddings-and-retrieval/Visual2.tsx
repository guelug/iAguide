"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* embeddings + retrieval: doc→vector cloud, HNSW layers, top-k halo. */
type Mode = "embed" | "index" | "retrieve";

const COPY = {
  en: {
    similarity_is_geometry: "similarity is geometry",
    embed_index_retrieve: "embed · index · retrieve",
    embed: "embed",
    index: "index",
    retrieve: "retrieve",
    doc: "doc",
    vector: "vector",
    query: "query",
    topk: "top-k",
    layer: "layer",
    coarse_to_fine: "coarse to fine",
  },
  es: {
    similarity_is_geometry: "la similitud es geometría",
    embed_index_retrieve: "embed · index · recupera",
    embed: "embed",
    index: "índice",
    retrieve: "recupera",
    doc: "doc",
    vector: "vector",
    query: "consulta",
    topk: "top-k",
    layer: "capa",
    coarse_to_fine: "grueso a fino",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("embed");

  const cloud = Array.from({ length: 32 }, (_, i) => ({
    position: [
      (Math.sin(i * 1.3) * 2.0) + Math.cos(i * 0.7) * 0.4,
      Math.cos(i * 1.7) * 1.4 + Math.sin(i * 0.4) * 0.3,
      0,
    ] as [number, number, number],
    color: i % 5 === 0 ? P.amber : i % 5 === 1 ? P.teal : P.violet,
  }));

  return (
    <Figure
      label={t.similarity_is_geometry}
      hint={t.embed_index_retrieve}
      legend={[
        { color: P.teal, label: t.embed },
        { color: P.violet, label: t.index },
        { color: P.amber, label: t.retrieve },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "embed", label: t.embed, tone: P.teal },
            { value: "index", label: t.index, tone: P.violet },
            { value: "retrieve", label: t.retrieve, tone: P.amber },
          ]}
          ariaLabel={t.similarity_is_geometry}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.6], fov: 37 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "embed" && (
          <>
            <Slab position={[-2.3, 0.5, 0]} size={[1.6, 0.85, 0.12]} color={P.teal} fill={0.2} />
            <Tag position={[-2.3, 1.1, 0.15]} tone="teal" size="xs">{t.doc}</Tag>
            <Ribbon points={[[-1.4, 0.5, 0], [-0.6, 0.4, 0]]} color={P.teal} radius={0.03} opacity={0.8} />
            <Lattice cells={cloud} size={0.13} opacity={0.92} matte />
            <Tag position={[1.5, -1.4, 0.15]} tone="violet" size="xs">{t.vector}</Tag>
          </>
        )}

        {mode === "index" && (
          <>
            {/* three HNSW layers, sparser going up */}
            {[0, 1, 2].map((i) => (
              <group key={i} position={[0, -0.5 + i * 1.0, 0]}>
                <Slab position={[0, 0, 0]} size={[4.0 - i * 0.8, 0.35, 0.14]} color={P.violet} fill={0.16 + i * 0.04} />
                <Lattice
                  cells={Array.from({ length: 8 - i * 3 }, (_, j) => ({
                    position: [-1.45 + j * (3.0 - i * 1.2) / Math.max(1, 7 - i * 3), 0, 0.1] as [number, number, number],
                    color: P.violet,
                  }))}
                  size={0.1}
                  opacity={0.9}
                  matte
                />
                <Tag position={[2.1 - i * 0.4, 0.05, 0.15]} tone="violet" size="xs">{t.layer} {i}</Tag>
              </group>
            ))}
            <Tag position={[-2.5, 0.0, 0.15]} tone="muted" size="xs">HNSW</Tag>
            <Tag position={[0, -1.3, 0.15]} tone="muted" size="xs">{t.coarse_to_fine}</Tag>
          </>
        )}

        {mode === "retrieve" && (
          <>
            <Node3D position={[0, 0.6, 0]} color={P.amber} radius={0.18} pulse={0.4} />
            <Tag position={[0, 1.05, 0.15]} tone="amber" size="xs">{t.query}</Tag>
            <Halo position={[0, 0.6, 0]} radius={0.95} color={P.amber} opacity={0.5} spin={0.2} />
            <Lattice cells={cloud} size={0.13} opacity={0.85} matte />
            {/* top-k highlighted */}
            {cloud.slice(0, 3).map((c, i) => (
              <group key={i}>
                <Halo
                  position={[c.position[0], c.position[1], 0]}
                  radius={0.4}
                  color={P.amber}
                  opacity={0.7}
                  spin={0.3}
                />
                <Wire points={[[0.2, 0.6, 0], [c.position[0], c.position[1], 0]]} color={P.amber} width={2.5} opacity={0.9} />
              </group>
            ))}
            <Tag position={[0, -1.4, 0.15]} tone="muted" size="xs">{t.topk}</Tag>
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
