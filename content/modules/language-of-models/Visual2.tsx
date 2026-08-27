"use client";

import { useState } from "react";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import {
  Flow,
  Halo,
  Lattice,
  Motes,
  Node3D,
  PointerTilt,
  Ribbon,
  Slab,
  Tag,
  Wire,
} from "@/components/three/atoms";
import { P } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

/* A token is an integer, not a word. The context is a window. Next-token
   forever. Three architectures with three different jobs. */
type Mode = "tokens" | "window" | "arch";

const COPY = {
  en: {
    atoms_windows_and_engines: "atoms, windows, engines",
    a_token_is_a_number_a_context_is_a_budget: "a token is a number; a context is a budget",
    tokens: "tokens",
    window: "window",
    architectures: "architectures",
    word: "word",
    token: "token",
    vocab_id: "vocab id",
    system_prompt: "system prompt",
    tools: "tools",
    thread: "thread",
    answer: "answer",
    full: "full",
    encoder: "encoder",
    decoder: "decoder",
    seq2seq: "seq2seq",
    vector_out: "vector out",
    next_token: "next token",
    translate: "translate",
    counts: "cost: 1,3x",
  },
  es: {
    atoms_windows_and_engines: "átomos, ventanas, motores",
    a_token_is_a_number_a_context_is_a_budget: "un token es un número; el contexto es un presupuesto",
    tokens: "tokens",
    window: "ventana",
    architectures: "arquitecturas",
    word: "palabra",
    token: "token",
    vocab_id: "id de vocabulario",
    system_prompt: "system prompt",
    tools: "tools",
    thread: "hilo",
    answer: "respuesta",
    full: "llena",
    encoder: "encoder",
    decoder: "decoder",
    seq2seq: "seq2seq",
    vector_out: "sale un vector",
    next_token: "siguiente token",
    translate: "traduce",
    counts: "coste: 1,3x",
  },
};

export default function Visual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("tokens");

  // Spanish phrase "¿Qué tiempo hace hoy?" split into word vs token pieces
  const words = ["¿Qué", "tiempo", "hace", "hoy?"];
  const tokens = ["¿", "Qu", "é", " tiempo", " h", "ace", " h", "oy", "?"];

  return (
    <Figure
      label={t.atoms_windows_and_engines}
      hint={t.a_token_is_a_number_a_context_is_a_budget}
      legend={[
        { color: P.teal, label: t.token },
        { color: P.amber, label: t.window },
        { color: P.violet, label: t.architectures },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "tokens", label: t.tokens, tone: P.teal },
            { value: "window", label: t.window, tone: P.amber },
            { value: "arch", label: t.architectures, tone: P.violet },
          ]}
          ariaLabel={t.atoms_windows_and_engines}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.4, 8.8], fov: 36 }}>
        <Motes count={110} radius={7} opacity={0.3} />
        <PointerTilt amount={0.07}>

        {mode === "tokens" && (
          <>
            {/* words row */}
            <Tag position={[-2.9, 1.2, 0.15]} tone="muted" size="xs">{t.word}</Tag>
            {words.map((w, i) => (
              <group key={i}>
                <Slab position={[-2.2 + i * 1.35, 1.2, 0]} size={[1.15, 0.5, 0.1]} color={P.muted} fill={0.12} />
                <Tag position={[-2.2 + i * 1.35, 1.2, 0.15]} tone="ink" size="xs">{w}</Tag>
              </group>
            ))}
            {/* tokens row — more of them, uneven sizes */}
            <Tag position={[-2.9, -0.15, 0.15]} tone="teal" size="xs">{t.token}</Tag>
            {tokens.map((tk, i) => (
              <group key={i}>
                <Node3D
                  position={[-2.55 + i * 0.58, -0.15, 0]}
                  color={P.teal}
                  radius={0.12}
                  pulse={i * 0.2}
                  matte
                />
                <Tag position={[-2.55 + i * 0.58, -0.15, 0.15]} tone="teal" size="xs">{tk}</Tag>
              </group>
            ))}
            {/* word → token fan-in lines */}
            {words.map((_, i) => (
              <Wire
                key={i}
                points={[[-2.2 + i * 1.35, 0.92, 0], [-2.55 + i * 2, 0.05, 0]]}
                color={P.lineStrong}
                opacity={0.4}
              />
            ))}
            {/* vocab ids */}
            {tokens.slice(0, 5).map((tk, i) => (
              <Tag key={i} position={[-2.55 + i * 0.58, -0.85, 0.15]} tone="muted" size="xs">
                #{12850 + i * 731}
              </Tag>
            ))}
            <Tag position={[-2.55 + 2 * 0.58 + 1.4, -0.85, 0.15]} tone="muted" size="xs">{t.vocab_id}…</Tag>
            <Tag position={[2.4, -1.4, 0.15]} tone="amber">{t.counts}</Tag>
          </>
        )}

        {mode === "window" && (
          <>
            {/* the window frame */}
            <Slab position={[0, 0.2, 0]} size={[5.6, 2.6, 0.12]} color={P.amber} fill={0.06} rim={0.95} />
            <Tag position={[0, 1.85, 0.15]} tone="amber">{t.window}</Tag>
            {/* stacked regions inside */}
            <Slab position={[0, 1.1, 0.1]} size={[5.2, 0.5, 0.08]} color={P.violet} fill={0.24} />
            <Tag position={[0, 1.1, 0.2]} tone="violet" size="xs">{t.system_prompt}</Tag>
            <Slab position={[0, 0.55, 0.1]} size={[5.2, 0.4, 0.08]} color={P.teal} fill={0.2} />
            <Tag position={[0, 0.55, 0.2]} tone="teal" size="xs">{t.tools} + {t.thread}</Tag>
            <Slab position={[0, -0.45, 0.1]} size={[5.2, 1.0, 0.08]} color={P.sunken} fill={0.5} />
            <Tag position={[0, -0.45, 0.2]} tone="muted" size="xs">…</Tag>
            <Slab position={[0, -0.95, 0.1]} size={[5.2, 0.3, 0.08]} color={P.amber} fill={0.3} />
            <Tag position={[0, -0.95, 0.2]} tone="amber" size="xs">{t.answer}</Tag>
            {/* the overflow warning */}
            <Halo position={[2.9, 0.2, 0]} radius={0.55} color={P.rose} opacity={0.45} spin={0.25} />
            <Tag position={[2.9, 0.2, 0.2]} tone="rose" size="xs">{t.full}</Tag>
            <Flow points={[[3.2, -0.2, 0], [3.5, -1.2, 0]]} color={P.rose} count={2} size={0.05} />
          </>
        )}

        {mode === "arch" && (
          <>
            {(
              [
                [t.encoder, P.teal, -2.4, t.vector_out],
                [t.seq2seq, P.violet, 0, t.translate],
                [t.decoder, P.amber, 2.4, t.next_token],
              ] as const
            ).map(([name, col, x, out]) => (
              <group key={name}>
                <Slab position={[x, 0.6, 0]} size={[2.0, 1.5, 0.14]} color={col} fill={0.16} />
                <Tag position={[x, 1.6, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "amber"}>{name}</Tag>
                {Array.from({ length: 4 }, (_, i) => (
                  <Node3D
                    key={i}
                    position={[x - 0.5 + i * 0.34, 0.75, 0.15]}
                    color={col}
                    radius={0.09}
                    matte
                  />
                ))}
                <Flow
                  points={[[x, 0.1, 0.1], [x, -0.7, 0.1]]}
                  color={col}
                  count={2}
                  size={0.045}
                />
                <Tag position={[x, -1.1, 0.15]} tone={col === P.teal ? "teal" : col === P.violet ? "violet" : "amber"} size="xs">{out}</Tag>
              </group>
            ))}
            {/* decoder is the agent's engine */}
            <Halo position={[2.4, 0.6, 0]} radius={1.2} color={P.amber} opacity={0.3} spin={0.12} />
            <Ribbon points={[[-1.4, 1.9, 0], [0, 2.25, 0], [1.4, 1.9, 0]]} color={P.lineStrong} radius={0.02} opacity={0.8} />
          </>
        )}

        </PointerTilt>
      </Stage>
    </Figure>
  );
}
