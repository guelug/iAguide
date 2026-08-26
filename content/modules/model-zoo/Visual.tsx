"use client";
// SCAFFOLD — replace with the real diagram for this module.
import { Figure } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Motes, Node3D, Turntable } from "@/components/three/atoms";
import { P } from "@/lib/palette";

export default function Visual() {
  return (
    <Figure label="model-zoo">
      <Stage className="h-full w-full" camera={{ position: [0, 0, 6], fov: 45 }}>
        <Turntable>
          <Node3D position={[0, 0, 0]} color={P.teal} radius={0.6} faceted pulse={0.2} />
        </Turntable>
        <Motes count={120} radius={6} />
      </Stage>
    </Figure>
  );
}
