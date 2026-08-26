"use client";

import { Grid, Line, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, Group, InstancedMesh, Object3D } from "three";
import { Halo, Tag, type V3 } from "@/components/three/atoms";
import { Stage, useStage } from "@/components/three/Stage";
import { useCopy } from "@/lib/useCopy";
import { P } from "@/lib/palette";

/**
 * The landing figure, and the thesis of the whole course in one image:
 * text becomes tokens, tokens cross a stack of layers, one token comes
 * out the other side. Drawn as blueprint illustration on paper — plates,
 * chips and hairlines — so it survives a projector and a printout.
 */

const LAYERS = 11;
const X_IN = -4.6;
const X_OUT = 4.15;
const SPAN = X_OUT - X_IN;

function LayerPlates() {
  const group = useRef<Group>(null);
  const { still } = useStage();

  const plates = useMemo(
    () =>
      Array.from({ length: LAYERS }, (_, i) => {
        const t = i / (LAYERS - 1);
        return {
          x: -3.1 + t * 6.2,
          h: 2.5 - Math.abs(t - 0.5) * 0.5,
          d: 2.0 - Math.abs(t - 0.5) * 0.4,
          tone: i === LAYERS - 1 ? P.violet : i % 4 === 0 ? P.amber : P.teal,
          fill: 0.16 + t * 0.14,
        };
      }),
    [],
  );

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g || still) return;
    const t = clock.elapsedTime;
    g.children.forEach((child, i) => {
      child.position.y = Math.sin(t * 0.5 + i * 0.55) * 0.045;
    });
  });

  return (
    <group ref={group}>
      {plates.map((p, i) => (
        <group key={i} position={[p.x, 0, 0]}>
          <RoundedBox args={[0.07, p.h, p.d]} radius={0.03} smoothness={2}>
            <meshStandardMaterial
              color={p.tone}
              transparent
              opacity={p.fill}
              roughness={0.6}
              metalness={0}
              depthWrite={false}
            />
          </RoundedBox>
          <Line
            points={
              [
                [0.04, -p.h / 2, -p.d / 2],
                [0.04, p.h / 2, -p.d / 2],
                [0.04, p.h / 2, p.d / 2],
                [0.04, -p.h / 2, p.d / 2],
                [0.04, -p.h / 2, -p.d / 2],
              ] as V3[]
            }
            color={p.tone}
            lineWidth={i === LAYERS - 1 ? 2 : 1.2}
            transparent
            opacity={0.45 + (i / LAYERS) * 0.45}
          />
        </group>
      ))}
    </group>
  );
}

const dummy = new Object3D();
const tmpColor = new Color();

/** Token chips crossing the stack, converging on the answer. */
function TokenChips({ count = 240 }: { count?: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const { still, quality } = useStage();
  const n = Math.max(90, Math.round(count * quality));

  const seeds = useMemo(
    () =>
      Array.from({ length: n }, () => ({
        y: (Math.random() - 0.5) * 2.1,
        z: (Math.random() - 0.5) * 1.7,
        speed: 0.055 + Math.random() * 0.075,
        offset: Math.random(),
        wob: Math.random() * Math.PI * 2,
        warm: Math.random(),
      })),
    [n],
  );

  const colorAt = useMemo(() => {
    const a = new Color(P.teal);
    const b = new Color(P.violet);
    const c = new Color(P.amber);
    return (warm: number, t: number, out: Color) => {
      // Representations start teal and drift violet as they go deeper;
      // a minority run warm, so the field never looks like one material.
      out.copy(warm > 0.82 ? c : a).lerp(b, warm > 0.82 ? 0.15 : t * 0.85);
      return out;
    };
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const col = new Color();
    seeds.forEach((s, i) => m.setColorAt(i, colorAt(s.warm, 0, col)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [seeds, colorAt]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const time = still ? 0.4 : clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const t = (time * s.speed + s.offset) % 1;
      const x = X_IN + t * SPAN;
      // Everything funnels into the single emitted token on the right.
      const squeeze = 1 - Math.pow(Math.max(0, (t - 0.55) / 0.45), 2) * 0.94;
      dummy.position.set(
        x,
        s.y * squeeze + Math.sin(time * 0.8 + s.wob) * 0.05 * squeeze,
        s.z * squeeze + Math.cos(time * 0.6 + s.wob) * 0.05 * squeeze,
      );
      dummy.rotation.set(0, Math.sin(time * 0.4 + s.wob) * 0.4, 0);
      const fade = Math.min(1, t * 6) * Math.min(1, (1 - t) * 9);
      dummy.scale.set(0.13 * fade, 0.06 * fade, 0.06 * fade);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, colorAt(s.warm, t, tmpColor));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, n]} key={n}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.4} metalness={0.02} />
    </instancedMesh>
  );
}

/** Attention: a few hairlines between chips, redrawn as the field moves. */
function AttentionWeb() {
  const { still } = useStage();
  const ref = useRef<Group>(null);

  const strands = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        y0: (Math.random() - 0.5) * 1.7,
        y1: (Math.random() - 0.5) * 1.2,
        z0: (Math.random() - 0.5) * 1.3,
        z1: (Math.random() - 0.5) * 0.9,
        x0: -3.4 + Math.random() * 2.2,
        x1: -0.6 + Math.random() * 2.6,
        tone: i % 3 === 0 ? P.amber : P.teal,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || still) return;
    g.children.forEach((child, i) => {
      const m = child as unknown as { material?: { opacity: number } };
      if (m.material) {
        m.material.opacity =
          0.08 + Math.max(0, Math.sin(clock.elapsedTime * 0.7 + strands[i].phase)) * 0.3;
      }
    });
  });

  return (
    <group ref={ref}>
      {strands.map((s, i) => (
        <Line
          key={i}
          points={
            [
              [s.x0, s.y0, s.z0],
              [(s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2 + 0.5, (s.z0 + s.z1) / 2],
              [s.x1, s.y1, s.z1],
            ] as V3[]
          }
          color={s.tone}
          lineWidth={1}
          transparent
          opacity={0.18}
        />
      ))}
    </group>
  );
}

/** A ring that expands and fades out of the emitted token — the "tick". */
function PulseRing({ color }: { color: string }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = still ? 0.35 : (clock.elapsedTime * 0.55) % 1;
    const s = 0.7 + t * 2.1;
    g.scale.setScalar(s);
    g.children.forEach((child) => {
      const m = child as unknown as { material?: { opacity: number } };
      if (m.material) m.material.opacity = (1 - t) * 0.55;
    });
  });
  return (
    <group ref={ref} rotation={[0, 0.4, 0]}>
      <mesh>
        <torusGeometry args={[0.62, 0.008, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

function EmittedToken({ label }: { label: string }) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || still) return;
    const t = clock.elapsedTime;
    g.rotation.y = Math.sin(t * 0.5) * 0.3;
    g.scale.setScalar(1 + Math.sin(t * 2.1) * 0.035);
  });

  return (
    <group ref={ref} position={[X_OUT - 0.1, 0, 0]}>
      <RoundedBox args={[0.58, 0.3, 0.3]} radius={0.09} smoothness={4}>
        <meshStandardMaterial color={P.teal} roughness={0.32} metalness={0.05} />
      </RoundedBox>
      <PulseRing color={P.amber} />
      <Halo radius={0.62} thickness={0.008} color={P.amber} opacity={0.75} rotation={[0, 0.4, 0]} spin={0.5} />
      <Halo radius={0.86} thickness={0.005} color={P.violet} opacity={0.45} rotation={[0.6, 0, 0.2]} spin={-0.35} />
      <Tag position={[0, 0.62, 0]} tone="ink" center>
        {label}
      </Tag>
    </group>
  );
}

function InputStack({ label }: { label: string }) {
  const rows = useMemo(() => [0.72, 0.36, 0, -0.36, -0.72], []);
  return (
    <group position={[X_IN - 0.15, 0, 0]}>
      {rows.map((y, i) => (
        <RoundedBox
          key={i}
          args={[0.5 + (i % 2) * 0.22, 0.17, 0.17]}
          radius={0.05}
          smoothness={3}
          position={[-(i % 2) * 0.1, y, 0]}
        >
          <meshStandardMaterial
            color={i === 2 ? P.amber : P.ink}
            transparent
            opacity={i === 2 ? 0.9 : 0.5}
            roughness={0.5}
            metalness={0}
          />
        </RoundedBox>
      ))}
      <Tag position={[0, 1.05, 0]} tone="muted" center>
        {label}
      </Tag>
    </group>
  );
}

function Rig() {
  const { still } = useStage();
  const { size } = useThree();
  const wide = size.width / Math.max(1, size.height) > 1.2;
  useFrame(({ camera, pointer, clock }, dt) => {
    const k = Math.min(1, dt * 1.8);
    const drift = still ? 0 : Math.sin(clock.elapsedTime * 0.16);
    const tx = pointer.x * 0.8 + drift * 0.25;
    const ty = 1.5 + pointer.y * 0.4;
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (8.4 - camera.position.z) * k;
    camera.lookAt(wide ? 0.9 : 0, wide ? -0.15 : 0, 0);
  });
  return null;
}

export function HeroStack({ className }: { className?: string }) {
  const copy = useCopy({
    en: { in: "your prompt", out: "next token" },
    es: { in: "tu prompt", out: "siguiente token" },
  });

  return (
    <Stage
      className={className}
      camera={{ position: [0, 1.5, 8.4], fov: 46, near: 0.1, far: 60 }}
      background={P.paper}
    >
      <Rig />
      <group rotation={[0, -0.26, 0]}>
        <Grid
          args={[26, 26]}
          position={[0, -1.85, 0]}
          cellSize={0.45}
          cellThickness={0.5}
          cellColor={P.line}
          sectionSize={2.25}
          sectionThickness={0.9}
          sectionColor={P.lineStrong}
          fadeDistance={20}
          fadeStrength={1.4}
          infiniteGrid
        />
        <LayerPlates />
        <AttentionWeb />
        <TokenChips />
        <InputStack label={copy.in} />
        <EmittedToken label={copy.out} />
      </group>
    </Stage>
  );
}
