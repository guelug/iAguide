"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MathUtils } from "three";
import { Figure, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Arrow, Node3D, Tag } from "@/components/three/atoms";
import {
  AxisLine,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
} from "@/components/three/iso";
import { P } from "@/lib/palette";

/*
 * The comparison every reference lesson needs and none of them had.
 *
 * These modules all end up explaining the same awkward thing: two or
 * three surfaces share a name, run in different directions, and each owns
 * knobs that look interchangeable and are not. That is a spatial fact —
 * who calls whom, and which controls sit on which side — so it belongs in
 * a drawing, not in a nine-hundred-word paragraph.
 *
 * The scene is data-driven: a module supplies its surfaces and the knobs
 * that must not be mixed, and gets a diagram specific to itself.
 */

export type Surface = {
  /** Short name as it appears in the docs, e.g. "openclaw acp". */
  name: string;
  /** Which way the calls run through this surface. */
  role: "server" | "client" | "bridge";
  /** One line: what this surface actually is. */
  note: string;
  /** The controls that belong to this surface and nowhere else. */
  knobs: string[];
  color: string;
};

export type SurfaceCompareCopy = {
  title: string;
  hint: string;
  /** Reads under the canvas; the sentence the figure is making. */
  note: string;
  /** Labels for the three roles, translated. */
  roles: { server: string; client: string; bridge: string };
  knobsLabel: string;
  /**
   * The mis-paste the prose warns about, drawn as a crossed link between
   * two platforms. Stated explicitly rather than inferred from matching
   * knob names, because the dangerous pairs rarely share a name — that is
   * precisely why people paste one into the other.
   */
  hazard?: { text: string; from: number; to: number };
};

const SLOT_X = [-4.1, 0, 4.1];

function Platform({
  surface,
  index,
  active,
  onSelect,
  roles,
  knobsLabel,
}: {
  surface: Surface;
  index: number;
  active: boolean;
  onSelect: () => void;
  roles: SurfaceCompareCopy["roles"];
  knobsLabel: string;
}) {
  const lift = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = lift.current;
    if (!g) return;
    g.position.y = MathUtils.damp(g.position.y, active ? 0.34 : 0, 6, dt);
  });

  const x = SLOT_X[index] ?? 0;
  const dir = surface.role;

  return (
    <group
      position={[x, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {/* The plinth: one per surface, so they are visibly separate things. */}
      <RoundedBox
        args={[3.1, 0.26, 2.5]}
        radius={0.06}
        smoothness={3}
        position={[0, 0.13, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={active ? surface.color : P.sunken}
          roughness={0.42}
          metalness={0.05}
          envMapIntensity={0.9}
        />
      </RoundedBox>

      <group ref={lift}>
        {/* The knobs that belong here, stacked as physical chips. */}
        {surface.knobs.map((k, i) => (
          <group key={k} position={[-0.85 + (i % 2) * 1.55, 0.42 + Math.floor(i / 2) * 0.34, -0.55 + (i % 2) * 0.3]}>
            <RoundedBox args={[1.25, 0.16, 0.6]} radius={0.05} smoothness={3} castShadow>
              <meshStandardMaterial
                color={active ? P.surface : P.sunken}
                roughness={0.36}
                metalness={0.04}
                envMapIntensity={0.9}
              />
            </RoundedBox>
            <mesh position={[-0.5, 0.1, 0]}>
              <boxGeometry args={[0.14, 0.03, 0.36]} />
              <meshStandardMaterial color={surface.color} roughness={0.4} />
            </mesh>
            <Tag position={[0.12, 0.22, 0]} tone={active ? "ink" : "muted"} size="xs" center>
              {k}
            </Tag>
          </group>
        ))}
      </group>

      <Tag position={[0, -0.55, 1.5]} tone={active ? "ink" : "muted"} size="sm" center>
        {surface.name}
      </Tag>
      <Tag position={[0, -0.95, 1.5]} tone="muted" size="xs" center>
        {roles[dir]}
      </Tag>
      {active ? (
        <Tag position={[0, 2.55, 0]} tone="ink" size="xs" center>
          {knobsLabel}: {surface.knobs.length}
        </Tag>
      ) : null}

      {/* Direction of travel, drawn on the plate. */}
      <Arrow
        from={dir === "client" ? [0, 0.02, 1.5] : [0, 0.02, -1.5]}
        to={dir === "client" ? [0, 0.02, -1.5] : [0, 0.02, 1.5]}
        color={active ? surface.color : P.line}
        width={active ? 2 : 1.2}
        head={0.16}
        opacity={active ? 0.9 : 0.4}
      />
    </group>
  );
}

export function SurfaceCompare({
  surfaces,
  copy,
}: {
  surfaces: Surface[];
  copy: SurfaceCompareCopy;
}) {
  const [active, setActive] = useState(0);
  const chosen = surfaces[active] ?? surfaces[0];

  const hazard = copy.hazard;

  return (
    <Figure
      label={copy.title}
      hint={copy.hint}
      legend={surfaces.map((s) => ({ color: s.color, label: s.name }))}
      controls={
        <Switcher
          value={String(active)}
          onChange={(v) => setActive(Number(v))}
          options={surfaces.map((s, i) => ({
            value: String(i),
            label: s.name,
            tone: s.color,
          }))}
          ariaLabel={copy.title}
        />
      }
      note={
        <>
          <strong className="text-ink">{chosen.name}</strong> — {chosen.note}
          <span className="mt-1.5 block text-muted">{copy.note}</span>
        </>
      }
      height="h-[400px] md:h-[490px]"
    >
      <Stage
        className="h-full w-full"
        orthographic
        camera={ISO_CAMERA}
        background={P.paper}
        fit={1.16}
      >
        <IsoFrame width={15} depth={11} y={-0.03} />
        <PlanTrace
          points={[
            [-6.5, 3.4],
            [-6.5, -3.4],
            [6.5, -3.4],
          ]}
          y={-0.02}
          color={P.line}
          opacity={0.7}
        />

        {surfaces.map((s, i) => (
          <Platform
            key={s.name}
            surface={s}
            index={i}
            active={i === active}
            onSelect={() => setActive(i)}
            roles={copy.roles}
            knobsLabel={copy.knobsLabel}
          />
        ))}

        {/* One protocol name spanning all of them: the reason they get
            confused in the first place. */}
        {surfaces.length > 1 ? (
          <AxisLine
            from={[SLOT_X[0], 1.9, 0]}
            to={[SLOT_X[Math.min(surfaces.length, 3) - 1], 1.9, 0]}
            overrun={0.9}
            color={P.lineStrong}
            opacity={0.45}
          />
        ) : null}

        {/* The trap, drawn as a link that is crossed out. */}
        {hazard ? (
          <group>
            <AxisLine
              from={[SLOT_X[hazard.from] ?? 0, 1.2, 0.9]}
              to={[SLOT_X[hazard.to] ?? 0, 1.2, 0.9]}
              overrun={0}
              color={P.rose}
              opacity={0.5}
            />
            <group
              position={[
                ((SLOT_X[hazard.from] ?? 0) + (SLOT_X[hazard.to] ?? 0)) / 2,
                1.2,
                0.9,
              ]}
            >
              <Node3D position={[0, 0, 0]} color={P.rose} radius={0.13} matte />
              <Tag position={[0, 0.45, 0]} tone="rose" size="xs" center>
                {hazard.text}
              </Tag>
            </group>
          </group>
        ) : null}

        <IsoDust count={34} center={[0, 1.4, 0]} spread={[5.5, 0.9, 1.6]} />
      </Stage>
    </Figure>
  );
}
