"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import {
  Flow,
  Halo,
  Lattice,
  Motes,
  Node3D,
  Ribbon,
  Slab,
  Wire,
  type Cell,
  type V3,
} from "@/components/three/atoms";
import { Stage, useStage } from "@/components/three/Stage";
import { P } from "@/lib/palette";

/**
 * Three clusters, one per layer of the stack. The home page hands it the
 * index of the card the reader is hovering; the camera leans that way.
 */

const X = [-3.5, 0, 3.5];

function Cluster({
  index,
  active,
  children,
}: {
  index: number;
  active: number | null;
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = active === index ? 1.1 : active === null ? 1 : 0.9;
    const k = still ? 1 : Math.min(1, dt * 4);
    g.scale.setScalar(g.scale.x + (target - g.scale.x) * k);
  });
  return (
    <group ref={ref} position={[X[index], 0, 0]}>
      {children}
    </group>
  );
}

/** Layer I — the loop. Nodes on a ring with traffic going round. */
function HarnessCluster() {
  const ring = useMemo(() => {
    const n = 6;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return [Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0] as V3;
    });
  }, []);

  const spin = useRef<Group>(null);
  const { still } = useStage();
  useFrame((_, dt) => {
    if (spin.current && !still) spin.current.rotation.z += dt * 0.12;
  });

  return (
    <group ref={spin}>
      {ring.map((p, i) => (
        <Node3D
          key={i}
          position={p}
          color={i === 0 ? P.amberDeep : P.amber}
          radius={i === 0 ? 0.13 : 0.085}
          pulse={i * 0.7}
        />
      ))}
      {ring.map((p, i) => (
        <Flow
          key={`f${i}`}
          points={[p, ring[(i + 1) % ring.length]]}
          color={P.amber}
          count={1}
          speed={0.45}
          size={0.04}
          offset={i / ring.length}
          lineOpacity={0.3}
        />
      ))}
      {/* Tool call: out of the loop and back in. */}
      <Flow
        points={[ring[2], [-1.9, -0.35, 0.7], [-1.55, 0.6, 0.9], ring[3]]}
        color={P.teal}
        count={2}
        speed={0.25}
        size={0.035}
        lineOpacity={0.28}
      />
      <Halo radius={1.4} thickness={0.006} color={P.amber} opacity={0.25} rotation={[0, 0, 0]} />
    </group>
  );
}

/** Layer II — the stack. Slabs with a residual stream running through. */
function ModelCluster() {
  const spin = useRef<Group>(null);
  const { still } = useStage();
  useFrame(({ clock }) => {
    if (spin.current && !still) {
      spin.current.rotation.y = Math.sin(clock.elapsedTime * 0.22) * 0.5 + 0.35;
    }
  });

  const slabs = useMemo(
    () => Array.from({ length: 7 }, (_, i) => -0.95 + i * 0.32),
    [],
  );

  return (
    <group ref={spin} rotation={[0.12, 0.35, 0]}>
      {slabs.map((y, i) => (
        <Slab
          key={i}
          position={[0, y, 0]}
          size={[1.5 - Math.abs(i - 3) * 0.06, 0.13, 1.1]}
          color={i % 3 === 0 ? P.violet : P.teal}
          fill={0.16}
          rim={0.5}
        />
      ))}
      <Ribbon
        points={[
          [0, -1.15, 0],
          [0.12, -0.4, 0.05],
          [-0.1, 0.35, -0.05],
          [0, 1.15, 0],
        ]}
        color={P.teal}
        radius={0.028}
        opacity={0.75}
      />
      <Node3D position={[0, 1.28, 0]} color={P.violet} radius={0.1} pulse={0.2} />
      <Motes count={90} radius={1.9} color={P.teal} size={0.02} opacity={0.4} speed={0.05} />
    </group>
  );
}

/** Layer III — the bank. Memory cells and a bus that never stops. */
function SiliconCluster() {
  const cells = useMemo<Cell[]>(() => {
    const out: Cell[] = [];
    const cols = 9;
    const rows = 7;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const filled = r < 5;
        out.push({
          position: [
            (c - (cols - 1) / 2) * 0.19,
            (r - (rows - 1) / 2) * 0.19 - 0.1,
            0,
          ],
          scale: filled ? 1 : 0.5,
          color: filled ? (r === 4 ? P.violet : P.teal) : P.faint,
        });
      }
    }
    return out;
  }, []);

  return (
    <group>
      <Lattice cells={cells} size={0.13} opacity={0.55} />
      <Wire
        points={[
          [-1.15, -0.85, 0],
          [1.15, -0.85, 0],
        ]}
        color={P.violet}
        opacity={0.3}
        width={2}
      />
      <Flow
        points={[
          [-1.15, -0.85, 0],
          [1.15, -0.85, 0],
        ]}
        color={P.violet}
        count={5}
        speed={0.7}
        size={0.045}
        lineOpacity={0}
      />
      <Halo radius={1.45} thickness={0.005} color={P.violet} opacity={0.2} rotation={[0, 0, 0]} />
    </group>
  );
}

function Rig({ active }: { active: number | null }) {
  const { still } = useStage();
  useFrame(({ camera, pointer }, dt) => {
    const k = Math.min(1, dt * 2.2);
    const targetX = (active === null ? 0 : X[active] * 0.5) + pointer.x * 0.5;
    const targetZ = active === null ? 9.4 : 8.3;
    const targetY = pointer.y * 0.35;
    if (still) {
      camera.position.set(0, 0, 9.4);
    } else {
      camera.position.x += (targetX - camera.position.x) * k;
      camera.position.y += (targetY - camera.position.y) * k;
      camera.position.z += (targetZ - camera.position.z) * k;
    }
    camera.lookAt(active === null ? 0 : X[active] * 0.35, 0, 0);
  });
  return null;
}

export function LayerTriptych({
  active,
  className,
}: {
  active: number | null;
  className?: string;
}) {
  return (
    <Stage
      className={className}
      camera={{ position: [0, 0, 9.4], fov: 44 }}
      background={P.paper}
      fit={false}
    >
      <Rig active={active} />
      <Cluster index={0} active={active}>
        <HarnessCluster />
      </Cluster>
      <Cluster index={1} active={active}>
        <ModelCluster />
      </Cluster>
      <Cluster index={2} active={active}>
        <SiliconCluster />
      </Cluster>

      {/* Requests go down the stack; results and heat come back up. */}
      <Flow
        points={[
          [-2.2, -0.15, 0.4],
          [-1.1, -0.55, 0.6],
          [-1.05, -0.2, 0.4],
        ]}
        color={P.amber}
        count={2}
        speed={0.3}
        lineOpacity={0.18}
      />
      <Flow
        points={[
          [1.05, -0.2, 0.4],
          [2.1, -0.6, 0.6],
          [2.3, -0.15, 0.4],
        ]}
        color={P.teal}
        count={2}
        speed={0.3}
        lineOpacity={0.18}
      />
      <Motes count={200} radius={9} color={P.teal} size={0.025} opacity={0.28} speed={0.01} />
    </Stage>
  );
}
