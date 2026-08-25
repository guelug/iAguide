"use client";

import { Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, ShaderMaterial } from "three";
import { CanvasFrame } from "@/components/CanvasFrame";

const vert = "varying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}";
const frag = "varying vec2 vUv;\nuniform float uTime;\nuniform vec3 uTeal;\nuniform vec3 uAmber;\nuniform vec3 uVoid;\nfloat hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat noise(vec2 p) {\n  vec2 i = floor(p);\n  vec2 f = fract(p);\n  f = f * f * (3.0 - 2.0 * f);\n  float a = hash(i);\n  float b = hash(i + vec2(1.0, 0.0));\n  float c = hash(i + vec2(0.0, 1.0));\n  float d = hash(i + vec2(1.0, 1.0));\n  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\nfloat fbm(vec2 p) {\n  float v = 0.0;\n  float a = 0.5;\n  for (int i = 0; i < 5; i++) {\n    v += a * noise(p);\n    p *= 2.03;\n    a *= 0.5;\n  }\n  return v;\n}\nvoid main() {\n  vec2 uv = vUv;\n  float t = uTime * 0.08;\n  vec2 p = uv * vec2(1.7, 1.05);\n  p.y += 0.12 * sin(p.x * 3.1 + t);\n  float n = fbm(p + vec2(t * 0.45, t * 0.16));\n  float band = smoothstep(0.22, 0.78, n);\n  float silk = 0.55 + 0.45 * sin(6.2 * (p.x + p.y * 0.55 + 0.35 * n) - t * 1.5);\n  vec3 col = mix(uVoid, uTeal, band * 0.58 * silk);\n  col = mix(col, uAmber, pow(n, 3.2) * 0.38 * (1.0 - uv.y));\n  col *= 0.5 + 0.5 * uv.y;\n  col += (hash(uv * 720.0 + t) - 0.5) * 0.035;\n  gl_FragColor = vec4(col, 1.0);\n}";

function Field() {
  const mat = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTeal: { value: new Color("#3d7a74") },
      uAmber: { value: new Color("#8a6b32") },
      uVoid: { value: new Color("#07090b") },
    }),
    [],
  );

  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });

  return (
    <>
      <mesh scale={[18, 11, 1]} position={[0, 0, -1.6]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
        />
      </mesh>
      <ambientLight intensity={0.7} />
      <pointLight position={[2, 1, 3]} intensity={4} color="#5aa8a0" />
      <Float speed={0.7} rotationIntensity={0.35} floatIntensity={0.25}>
        <mesh position={[1.85, 0.15, 1.4]} scale={0.32}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#5aa8a0"
            wireframe
            emissive="#5aa8a0"
            emissiveIntensity={0.4}
          />
        </mesh>
      </Float>
    </>
  );
}

export function SilkField({ className }: { className?: string }) {
  return (
    <CanvasFrame className={className} camera={{ position: [0, 0, 3.1], fov: 48 }}>
      <Field />
    </CanvasFrame>
  );
}
