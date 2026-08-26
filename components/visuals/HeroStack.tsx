"use client";

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  Group,
  InstancedMesh,
  Object3D,
  ShaderMaterial,
} from "three";
import { Halo, Motes, type V3 } from "@/components/three/atoms";
import { Stage, useStage } from "@/components/three/Stage";
import { P } from "@/lib/palette";

/**
 * The landing scene. A tunnel of layer frames with token traffic running
 * through it, collapsing into a single emitted token near the camera.
 * Every element is literal: frames are transformer blocks, motes are the
 * residual stream, the bright node at the end is the token you just read.
 */

const DEPTH_NEAR = 5.2;
const DEPTH_FAR = -17;
const SPAN = DEPTH_NEAR - DEPTH_FAR;
const LAYERS = 15;

/** A squircle: reads as a matrix face, not as a portal. */
function squarePath(r: number, k = 4, steps = 72): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const denom = Math.pow(Math.pow(Math.abs(c), k) + Math.pow(Math.abs(s), k), 1 / k);
    out.push([(r * c) / denom, (r * s) / denom, 0]);
  }
  return out;
}

function LayerFrames() {
  const group = useRef<Group>(null);
  const { still } = useStage();

  const frames = useMemo(
    () =>
      Array.from({ length: LAYERS }, (_, i) => {
        const t = i / (LAYERS - 1);
        const z = DEPTH_FAR + t * SPAN * 0.92;
        const r = 1.5 + t * 1.55;
        return {
          z,
          r,
          pts: squarePath(r),
          spin: (i % 2 === 0 ? 1 : -1) * (0.04 + i * 0.006),
          tone: i % 5 === 0 ? P.violet : i % 3 === 0 ? P.amber : P.teal,
          opacity: 0.16 + t * 0.5,
        };
      }),
    [],
  );

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g || still) return;
    const t = clock.elapsedTime;
    g.children.forEach((child, i) => {
      child.rotation.z = Math.sin(t * 0.14 + i * 0.5) * 0.12 + frames[i].spin * t * 0.35;
    });
  });

  return (
    <group ref={group}>
      {frames.map((f, i) => (
        <group key={i} position={[0, 0, f.z]}>
          <Line
            points={f.pts}
            color={f.tone}
            lineWidth={i === LAYERS - 1 ? 2.2 : 1.3}
            transparent
            opacity={f.opacity}
          />
        </group>
      ))}
    </group>
  );
}

const dummy = new Object3D();

function TokenTraffic({ count = 460 }: { count?: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const { still, quality } = useStage();
  const n = Math.max(120, Math.round(count * quality));

  const seeds = useMemo(
    () =>
      Array.from({ length: n }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 0.35 + Math.pow(Math.random(), 0.6) * 2.55,
        speed: 0.045 + Math.random() * 0.075,
        offset: Math.random(),
        twist: 0.05 + Math.random() * 0.12,
        wob: Math.random() * Math.PI * 2,
        tone: Math.random() < 0.7 ? P.teal : Math.random() < 0.6 ? P.amber : P.violet,
      })),
    [n],
  );

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const col = new Color();
    seeds.forEach((s, i) => m.setColorAt(i, col.set(s.tone)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [seeds]);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const time = still ? 0.35 : clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const t = (time * s.speed + s.offset) % 1;
      const z = DEPTH_FAR + t * SPAN;
      // Radius narrows as tokens approach the head: the funnel is the point.
      const squeeze = 1 - Math.pow(t, 3.2) * 0.86;
      const a = s.angle + z * s.twist + Math.sin(time * 0.5 + s.wob) * 0.15;
      const r = s.radius * squeeze;
      dummy.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.78, z);
      const near = Math.pow(t, 2.2);
      dummy.scale.setScalar(0.02 + near * 0.075 + Math.sin(time * 3 + s.wob) * 0.004);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, n]} key={n}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial toneMapped={false} blending={AdditiveBlending} transparent opacity={0.95} />
    </instancedMesh>
  );
}

function EmittedToken() {
  const ref = useRef<Group>(null);
  const { still } = useStage();
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || still) return;
    const t = clock.elapsedTime;
    g.rotation.y = t * 0.35;
    g.rotation.x = Math.sin(t * 0.4) * 0.25;
    const beat = 1 + Math.sin(t * 2.4) * 0.06;
    g.scale.setScalar(beat);
  });

  return (
    <group ref={ref} position={[0, 0, DEPTH_NEAR - 2.1]}>
      <mesh>
        <icosahedronGeometry args={[0.17, 1]} />
        <meshStandardMaterial
          color={P.paper}
          emissive={P.teal}
          emissiveIntensity={1.1}
          roughness={0.15}
          metalness={0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh scale={1.9}>
        <icosahedronGeometry args={[0.17, 0]} />
        <meshBasicMaterial color={P.teal} wireframe transparent opacity={0.3} toneMapped={false} />
      </mesh>
      <Halo radius={0.42} thickness={0.005} color={P.amber} opacity={0.55} rotation={[0, 0, 0]} spin={0.6} />
      <Halo radius={0.62} thickness={0.003} color={P.violet} opacity={0.35} rotation={[0.5, 0.3, 0]} spin={-0.4} />
      <pointLight color={P.teal} intensity={4} distance={6} decay={2} />
    </group>
  );
}

/** Distant nebula so the tunnel does not sit on flat black. */
const NEBULA_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const NEBULA_FRAG = `
varying vec2 vUv;
uniform float uTime;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p);
  f=f*f*(3.0-2.0*f);
  float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.07; a*=0.5; }
  return v;
}
void main(){
  vec2 uv = vUv;
  vec2 c = uv - 0.5;
  float t = uTime * 0.035;
  float n = fbm(uv * 3.1 + vec2(t, t * 0.6));
  float m = fbm(uv * 6.3 - vec2(t * 0.8, t * 0.3));
  float radial = 1.0 - smoothstep(0.05, 0.62, length(c * vec2(1.0, 1.35)));
  vec3 col = mix(uA, uB, n);
  col = mix(col, uC, pow(m, 2.4) * 0.7);
  col *= 0.22 + radial * 1.25;
  col += (hash(uv * 900.0 + t) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}`;

function Nebula() {
  const mat = useRef<ShaderMaterial>(null);
  const { still } = useStage();
  const { viewport } = useThree();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uA: { value: new Color("#060a0e") },
      uB: { value: new Color("#123130") },
      uC: { value: new Color("#2b2350") },
    }),
    [],
  );
  useFrame((_, dt) => {
    if (mat.current && !still) mat.current.uniforms.uTime.value += dt;
  });
  const w = Math.max(46, viewport.width * 3);
  return (
    <mesh position={[0, 0, DEPTH_FAR - 9]} scale={[w, w * 0.62, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={NEBULA_VERT}
        fragmentShader={NEBULA_FRAG}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * The tunnel sits at the origin; the camera aims to the left of it so the
 * funnel lands in the right half of the frame and the headline gets clean
 * space. On narrow screens the bias goes away and it re-centres.
 */
function Rig() {
  const { still } = useStage();
  const { size } = useThree();
  const wide = size.width / Math.max(1, size.height) > 1.15;
  useFrame(({ camera, pointer, clock }, dt) => {
    const k = Math.min(1, dt * 1.6);
    const breathe = still ? 0 : Math.sin(clock.elapsedTime * 0.22) * 0.35;
    const tx = pointer.x * 0.7;
    const ty = pointer.y * 0.5 + breathe * 0.2;
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (ty - camera.position.y) * k;
    camera.position.z += (7.6 + breathe - camera.position.z) * k;
    camera.lookAt(wide ? -2.15 : 0, wide ? -0.25 : 0, DEPTH_NEAR - 3.2);
  });
  return null;
}

export function HeroStack({ className }: { className?: string }) {
  return (
    <Stage
      className={className}
      camera={{ position: [0, 0, 7.6], fov: 52, near: 0.1, far: 90 }}
      background={P.void}
      fog={[P.void, 14, 52]}
      bloom={{ intensity: 0.95, threshold: 0.24, smoothing: 0.6, radius: 0.75 }}
    >
      <Rig />
      <Nebula />
      <LayerFrames />
      <TokenTraffic />
      <EmittedToken />
      <Motes count={260} radius={11} color={P.violet} size={0.03} opacity={0.35} speed={0.012} />
    </Stage>
  );
}
