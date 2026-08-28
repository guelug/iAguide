"use client";
import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Lattice, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag } from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "tower" | "ocr" | "audio";
const COPY = {
  en: { label: "one model, many modalities", hint: "vision · ocr · audio", tower: "tower", ocr: "ocr", audio: "audio", image: "image", encoder: "encoder", projector: "projector", tokens: "tokens", waveform: "waveform", spectrogram: "spectrogram" },
  es: { label: "un modelo, muchas modalidades", hint: "visión · ocr · audio", tower: "torre", ocr: "ocr", audio: "audio", image: "imagen", encoder: "encoder", projector: "proyector", tokens: "tokens", waveform: "onda", spectrogram: "espectrograma" },
};
export default function Visual() {
  const t = useCopy(COPY); const [mode, setMode] = useState<Mode>("tower");
  return <Figure label={t.label} hint={t.hint} legend={[{ color: P.teal, label: t.image }, { color: P.violet, label: t.encoder }, { color: P.amber, label: t.tokens }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "tower", label: t.tower, tone: P.teal }, { value: "ocr", label: t.ocr, tone: P.violet }, { value: "audio", label: t.audio, tone: P.amber }]} ariaLabel={t.label} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}><Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
      {mode === "tower" && <>
        <Slab position={[-2.4, 0.5, 0]} size={[1.5, 1.4, 0.14]} color={P.teal} fill={0.2} /><Tag position={[-2.4, 1.45, 0.15]} tone="teal">{t.image}</Tag>
        <Ribbon points={[[-1.6, 0.5, 0], [-0.5, 0.5, 0]]} color={P.teal} radius={0.05} opacity={0.85} />
        <Slab position={[0, 0.5, 0]} size={[1.5, 1.4, 0.14]} color={P.violet} fill={0.22} /><Tag position={[0, 1.45, 0.15]} tone="violet">{t.encoder}</Tag>
        <Ribbon points={[[0.8, 0.5, 0], [1.5, 0.5, 0]]} color={P.amber} radius={0.05} opacity={0.85} />
        <Lattice cells={Array.from({ length: 12 }, (_, i) => ({ position: [1.5 + (i % 4) * 0.35, 0.95 - Math.floor(i / 4) * 0.4, 0] as [number, number, number], color: P.amber }))} size={0.13} opacity={0.9} matte /><Tag position={[2.2, -0.1, 0.15]} tone="amber">{t.tokens}</Tag>
      </>}
      {mode === "ocr" && <>
        <Slab position={[-2, 0.4, 0]} size={[2.0, 1.5, 0.14]} color={P.teal} fill={0.18} /><Tag position={[-2, 1.35, 0.15]} tone="teal">pixels</Tag>
        <Lattice cells={Array.from({ length: 25 }, (_, i) => ({ position: [-2.7 + (i % 5) * 0.35, 0.9 - Math.floor(i / 5) * 0.35, 0.15] as [number, number, number], color: i % 3 === 0 ? P.amber : P.teal }))} size={0.13} opacity={0.9} matte />
        <Ribbon points={[[-0.9, 0.4, 0], [0.3, 0.4, 0]]} color={P.violet} radius={0.05} opacity={0.9} /><Node3D position={[1.2, 0.4, 0]} color={P.violet} radius={0.22} pulse={0.3} /><Tag position={[1.2, 0.95, 0.15]} tone="violet">text tokens</Tag>
        <Tag position={[0, -1.1, 0.15]} tone="muted" size="xs">pixels → features → texto</Tag>
      </>}
      {mode === "audio" && <>
        <Ribbon points={[[-2.8, 0.4, 0], [-2, 0.8, 0], [-1.2, 0.1, 0], [-0.4, 0.7, 0]]} color={P.amber} radius={0.05} opacity={0.9} /><Tag position={[-2, 1.25, 0.15]} tone="amber">{t.waveform}</Tag>
        <Slab position={[0.5, 0.4, 0]} size={[1.8, 1.5, 0.14]} color={P.violet} fill={0.18} /><Lattice cells={Array.from({ length: 20 }, (_, i) => ({ position: [-0.2 + (i % 5) * 0.3, 0.85 - Math.floor(i / 5) * 0.3, 0.15] as [number, number, number], color: i % 2 ? P.violet : P.amber }))} size={0.11} opacity={0.9} matte /><Tag position={[0.5, 1.35, 0.15]} tone="violet">{t.spectrogram}</Tag>
        <Ribbon points={[[1.5, 0.4, 0], [2.4, 0.4, 0]]} color={P.teal} radius={0.05} opacity={0.85} /><Node3D position={[2.6, 0.4, 0]} color={P.teal} radius={0.2} pulse={0.3} /><Tag position={[2.6, 0.95, 0.15]} tone="teal">{t.tokens}</Tag>
      </>}
    </PointerTilt></Stage>
  </Figure>;
}
