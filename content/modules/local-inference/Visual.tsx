"use client";

import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";
import { useState } from "react";
import { Figure, Knob, Readout, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, ShadowBlob, Slab, Tag, type V3 } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";

type Mode = "gguf" | "ollama" | "vllm";

function LegacyVisual() {
  const t = useCopy({
    en: {
      "engines": "engines",
      "step_the_figure": "step the figure"
    },
    es: {
      "engines": "motores",
      "step_the_figure": "recorre la figura"
    },
  });
  const [mode, setMode] = useState<Mode>("gguf");

  // vLLM = many parallel slabs (batching); llama.cpp/Ollama = single user
  const users = mode === "vllm" ? 4 : 1;

  return (
    <Figure
      label={t.engines}
      hint={t.step_the_figure}
      legend={[
          { color: P.teal, label: "llama.cpp" },
          { color: P.amber, label: "ollama" },
          { color: P.violet, label: "vllm" }
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "gguf", label: "llama.cpp", tone: P.teal },
            { value: "ollama", label: "Ollama", tone: P.amber },
            { value: "vllm", label: "vLLM", tone: P.violet }
          ]}
          ariaLabel={t.step_the_figure}
        />
      }
    >
      <Stage className="h-full w-full" camera={{ position: [0, 0.15, 8.5], fov: 40 }}>

        {/* Three engines */}
        <Slab
          position={[-2.6, 0.0, 0]}
          size={[2.0, 1.7, 0.12]}
          color={P.teal}
          fill={mode === "gguf" ? 0.34 : 0.14}
        />
        <Tag position={[-2.6, 1.0, 0.2]} tone="teal">llama.cpp · GGUF</Tag>

        <Slab
          position={[0, 0.0, 0]}
          size={[2.0, 1.7, 0.12]}
          color={P.amber}
          fill={mode === "ollama" ? 0.34 : 0.14}
        />
        <Tag position={[0, 1.0, 0.2]} tone="amber">Ollama · HTTP</Tag>

        <Slab
          position={[2.6, 0.0, 0]}
          size={[2.0, 1.7, 0.12]}
          color={P.violet}
          fill={mode === "vllm" ? 0.34 : 0.14}
        />
        <Tag position={[2.6, 1.0, 0.2]} tone="violet">vLLM · batch</Tag>

        {/* User cards below each engine */}
        {Array.from({ length: users }).map((_, i) => {
          const x = mode === "vllm" ? 1.4 + (i - 1.5) * 0.8 : (mode === "ollama" ? 0 : -2.6);
          return (
            <Slab
              key={i}
              position={[x, -0.8, 0.05]}
              size={[0.55, 0.4, 0.08]}
              color={P.violet}
              fill={0.42}
            />
          );
        })}
        {mode === "vllm" ? (
          <Tag position={[2.6, -1.15, 0.2]} tone="violet">4 usuarios · batch continuo</Tag>
        ) : mode === "ollama" ? (
          <Tag position={[0, -1.15, 0.2]} tone="amber">1 usuario · HTTP en 11434</Tag>
        ) : (
          <Tag position={[-2.6, -1.15, 0.2]} tone="teal">1 usuario · flags totales</Tag>
        )}

        {/* Decode arrow streaming from engine */}
        <Flow
          points={mode === "vllm" ? [[1.6, 0.0, 0], [3.6, 0.0, 0]] : [[-1.5, 0.0, 0], [-3.6, 0.0, 0]]}
          color={mode === "vllm" ? P.violet : P.teal}
          count={mode === "vllm" ? 8 : 4}
        />

      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lámina ES: elegir motor local. Un banco con tres zonas: clientes (cuántos
 * usuarios a la vez), el motor (cuya forma cambia) sobre su hardware, y el
 * artefacto que ese motor carga. La elección sale de la tabla «Selección
 * práctica de motor» de la lección; el formato, de la tabla de formatos.
 */

type Hw = "mac" | "nvidia" | "cpu";
type Priority = "easy" | "control";
type Engine = "llama" | "ollama" | "vllm" | "mlx";
type Artifact = "gguf" | "safetensors" | "mlx";

const ENGINE: Record<Engine, { name: string; artifact: Artifact; iface: string; tone: string }> = {
  llama: { name: "llama.cpp", artifact: "gguf", iface: "llama-server · HTTP", tone: P.teal },
  ollama: { name: "Ollama", artifact: "gguf", iface: "ollama serve · :11434", tone: P.violet },
  vllm: { name: "vLLM", artifact: "safetensors", iface: "vllm serve · HTTP", tone: P.amber },
  mlx: { name: "MLX-LM", artifact: "mlx", iface: "mlx_lm.server", tone: P.rose },
};
const ARTIFACT: Record<Artifact, string> = { gguf: "GGUF", safetensors: "safetensors", mlx: "MLX" };
const HW_LABEL: Record<Hw, string> = { mac: "Mac M-series", nvidia: "GPU NVIDIA", cpu: "solo CPU" };
const DECODE: Record<Hw, string> = { mac: "40–80 tok/s", nvidia: "100–200 tok/s", cpu: "15–30 tok/s" };

/** La tabla de la lección, en código. */
function choose(hw: Hw, users: number, priority: Priority): { engine: Engine; why: string } {
  if (hw === "cpu") {
    return priority === "easy"
      ? { engine: "ollama", why: "Solo CPU: Ollama hereda el backend de llama.cpp y añade descarga y API en un comando." }
      : { engine: "llama", why: "Solo CPU, presupuesto bajo: llama.cpp CPU. Lo que cabe, lo que corre." };
  }
  if (users > 1) {
    return hw === "nvidia"
      ? { engine: "vllm", why: "Servidor GPU con varios usuarios: vLLM, por la caché KV paginada y el batching continuo." }
      : { engine: "mlx", why: "macOS como servidor para varios usuarios: MLX-LM server aprovecha la memoria unificada." };
  }
  if (priority === "easy") return { engine: "ollama", why: "Un usuario que quiere un modelo en un comando: Ollama, cero configuración." };
  return hw === "mac"
    ? { engine: "llama", why: "Mac con app propia y control fino: llama.cpp (Metal) o MLX; aquí llama.cpp por el acceso a flags." }
    : { engine: "llama", why: "Un usuario en GPU NVIDIA con control de flags: llama.cpp CUDA. vLLM se justifica cuando hay cola." };
}

function M({ color, rough = 0.4, metal = 0 }: { color: string; rough?: number; metal?: number }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={0.4} clearcoatRoughness={0.3} />;
}

function Hardware({ hw }: { hw: Hw }) {
  if (hw === "mac") {
    return (
      <group>
        <RoundedBox args={[2.2, 0.36, 1.9]} position={[0, 0.18, 0]} radius={0.14} smoothness={4} castShadow receiveShadow>
          <M color="#C9CDCB" rough={0.3} metal={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.7, 0.05, 0.7]} position={[0, 0.38, 0]} radius={0.03} smoothness={2} castShadow>
          <M color="#2C3332" />
        </RoundedBox>
        {[[-0.62, 0], [0.62, 0], [0, -0.58], [0, 0.58]].map(([x, z]) => (
          <RoundedBox key={`${x}:${z}`} args={[0.34, 0.05, 0.3]} position={[x, 0.38, z]} radius={0.02} smoothness={2} castShadow>
            <M color={mixHex("#2C3332", P.teal, 0.35)} />
          </RoundedBox>
        ))}
      </group>
    );
  }
  if (hw === "nvidia") {
    return (
      <group>
        <RoundedBox args={[2.5, 0.22, 1.5]} position={[0, 0.11, 0]} radius={0.05} smoothness={3} castShadow receiveShadow>
          <M color="#183F38" />
        </RoundedBox>
        <RoundedBox args={[2.4, 0.2, 1.3]} position={[0, 0.3, 0]} radius={0.08} smoothness={3} castShadow>
          <M color="#2C3332" rough={0.35} metal={0.3} />
        </RoundedBox>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.41, 0]} castShadow>
            <cylinderGeometry args={[0.46, 0.46, 0.03, 36]} />
            <M color="#4E5A59" metal={0.4} />
          </mesh>
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[-1.1 + i * 0.2, 0.02, 0.76]}>
            <boxGeometry args={[0.1, 0.1, 0.02]} />
            <meshStandardMaterial color="#B7833E" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <group>
      <RoundedBox args={[2.4, 0.12, 1.9]} position={[0, 0.06, 0]} radius={0.04} smoothness={3} castShadow receiveShadow>
        <M color="#1F3A34" />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.12, 0.62]} position={[-0.3, 0.18, 0]} radius={0.03} smoothness={2} castShadow>
        <M color="#8C9895" metal={0.6} rough={0.3} />
      </RoundedBox>
      {[0.55, 0.72, 0.89].map((x) => (
        <RoundedBox key={x} args={[0.08, 0.3, 1.5]} position={[x, 0.27, 0]} radius={0.02} smoothness={2} castShadow>
          <M color="#2C3332" />
        </RoundedBox>
      ))}
    </group>
  );
}

function EngineBlock({ engine, users }: { engine: Engine; users: number }) {
  const tone = ENGINE[engine].tone;
  const y = 0.62;
  if (engine === "vllm") {
    const pages = Math.min(24, Math.max(2, users * 2));
    return (
      <group position={[0, y, 0]}>
        <RoundedBox args={[1.9, 0.5, 1.3]} position={[0, 0.25, 0]} radius={0.06} smoothness={3} castShadow receiveShadow>
          <M color="#2C3332" />
        </RoundedBox>
        <mesh position={[0, 0.26, 0.652]}>
          <planeGeometry args={[1.6, 0.08]} />
          <meshStandardMaterial color={tone} />
        </mesh>
        <Tag position={[1.2, 0.6, -0.3]} tone="amber" size="xs">
          páginas KV
        </Tag>
        {Array.from({ length: 24 }, (_, i) => (
          <RoundedBox key={i} args={[0.2, 0.06, 0.2]} position={[-0.75 + (i % 8) * 0.215, 0.53, -0.3 + Math.floor(i / 8) * 0.3]} radius={0.02} smoothness={2} castShadow>
            <M color={i < pages ? mixHex(P.paper, tone, 0.5 + (i % 3) * 0.15) : "#4E5A59"} />
          </RoundedBox>
        ))}
      </group>
    );
  }
  const core = (
    <group>
      <RoundedBox args={[1.0, 0.42, 0.9]} position={[0, 0.21, 0]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <M color={engine === "mlx" ? "#C9CDCB" : "#2C3332"} metal={engine === "mlx" ? 0.5 : 0} rough={0.35} />
      </RoundedBox>
      {engine !== "mlx"
        ? [-0.28, 0, 0.28].map((x) => (
            <mesh key={x} position={[x, 0.46, 0.15]} castShadow>
              <cylinderGeometry args={[0.08, 0.09, 0.08, 20]} />
              <M color={mixHex("#8C9895", tone, 0.4)} metal={0.4} />
            </mesh>
          ))
        : null}
      <mesh position={[0, 0.22, 0.452]}>
        <planeGeometry args={[0.8, 0.07]} />
        <meshStandardMaterial color={tone} />
      </mesh>
    </group>
  );
  if (engine !== "ollama") return <group position={[0, y, 0]}>{core}</group>;
  return (
    <group position={[0, y, 0]}>
      {core}
      <RoundedBox args={[1.5, 0.75, 1.25]} position={[0, 0.37, 0]} radius={0.12} smoothness={4}>
        <meshPhysicalMaterial color={mixHex(P.paper, tone, 0.25)} transparent opacity={0.3} roughness={0.15} clearcoat={1} depthWrite={false} />
      </RoundedBox>
      <RoundedBox args={[0.22, 0.2, 0.2]} position={[-0.86, 0.3, 0]} radius={0.04} smoothness={2} castShadow>
        <M color="#B7833E" metal={0.7} rough={0.3} />
      </RoundedBox>
    </group>
  );
}

function ArtifactModel({ artifact }: { artifact: Artifact }) {
  if (artifact === "gguf") {
    return (
      <group>
        {[P.amber, P.violet, P.teal].map((c, i) => (
          <RoundedBox key={c} args={[0.8, i === 0 ? 0.36 : 0.1, 1.0]} position={[0, i === 0 ? 0.18 : 0.41 + (i - 1) * 0.11, 0]} radius={0.03} smoothness={2} castShadow receiveShadow>
            <M color={mixHex(P.paper, c, 0.75)} />
          </RoundedBox>
        ))}
      </group>
    );
  }
  if (artifact === "safetensors") {
    return (
      <group>
        {[0, 1, 2, 3].map((i) => (
          <RoundedBox key={i} args={[0.7, 0.08, 0.9]} position={[0, 0.05 + i * 0.1, 0]} radius={0.02} smoothness={2} castShadow receiveShadow>
            <M color={mixHex(P.paper, P.amber, 0.45 + i * 0.1)} />
          </RoundedBox>
        ))}
        <RoundedBox args={[0.3, 0.04, 0.4]} position={[0.55, 0.03, 0.3]} radius={0.01} smoothness={2} castShadow>
          <M color="#EFEAE0" />
        </RoundedBox>
      </group>
    );
  }
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <RoundedBox key={i} args={[0.8, 0.05, 1.0]} position={[0, 0.04 + i * 0.13, 0]} radius={0.02} smoothness={2} castShadow receiveShadow>
          <M color={mixHex(P.paper, P.rose, 0.4 + i * 0.15)} />
        </RoundedBox>
      ))}
    </group>
  );
}

function Clients({ users }: { users: number }) {
  const shown = Math.min(users, 16);
  return (
    <group position={[-3.6, 0.24, 0]}>
      <RoundedBox args={[1.5, 0.08, 1.9]} position={[0, 0.04, 0]} radius={0.03} smoothness={2} receiveShadow>
        <meshStandardMaterial color="#C9BFAD" roughness={0.55} />
      </RoundedBox>
      {Array.from({ length: shown }, (_, i) => {
        const x = -0.5 + (i % 4) * 0.33;
        const z = -0.6 + Math.floor(i / 4) * 0.4;
        return (
          <group key={i} position={[x, 0.08, z]}>
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.1, 0.24, 16]} />
              <M color={mixHex(P.paper, P.inkSoft, 0.55)} />
            </mesh>
            <mesh position={[0, 0.31, 0]} castShadow>
              <sphereGeometry args={[0.075, 16, 12]} />
              <M color={mixHex(P.paper, P.inkSoft, 0.55)} />
            </mesh>
          </group>
        );
      })}
      <Tag position={[0, 0.1, 1.2]} tone="ink" size="xs" center plate={false}>
        {users === 1 ? "1 usuario" : `${users} usuarios`}
      </Tag>
    </group>
  );
}

function SpanishVisual() {
  const [hw, setHw] = useState<Hw>("mac");
  const [users, setUsers] = useState(1);
  const [priority, setPriority] = useState<Priority>("easy");
  const pick = choose(hw, users, priority);
  const info = ENGINE[pick.engine];
  const lanes = Math.min(users, 4);
  const batched = pick.engine === "vllm" || pick.engine === "mlx";
  const artifactPos: V3 = [3.3, 0.3, 0];

  const note = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
        {[
          ["Motor", info.name],
          ["Artefacto", ARTIFACT[info.artifact]],
          ["Decode típico (8B Q4)", pick.engine === "vllm" ? "rápido + batching" : DECODE[hw]],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-xs text-muted">{label}</span>
            <strong className="mt-1 block font-display text-xl text-ink">{value}</strong>
          </div>
        ))}
      </div>
      <p>{pick.why}</p>
      <p>
        Carga {ARTIFACT[info.artifact]}
        {info.artifact === "gguf"
          ? ": un solo archivo con pesos, tokenizador y metadatos (las tres bandas)."
          : info.artifact === "safetensors"
            ? ": un contenedor de tensores en fragmentos (AWQ, GPTQ o FP8), no un GGUF renombrado."
            : ": arrays nativos de Apple, no GGUF."}{" "}
        Un arnés habla con <code>{info.iface}</code>, no con un binario interactivo como <code>llama-cli</code> u <code>ollama run</code>.
        {pick.engine === "vllm" ? " Las celdas sobre el servidor son páginas de caché KV; se reparten entre las peticiones que entran juntas." : ""}
      </p>
      <p className="text-xs text-muted">
        Regla de decisión tomada de la tabla de la lección; los rangos de tok/s son los típicos que cita para un 8B Q4, no una medición. La forma
        de cada motor es un esquema: no representa su código.
      </p>
    </div>
  );

  return (
    <Figure
      label="Elegir motor local: quién pregunta, dónde corre, qué archivo carga"
      hint="usuarios · hardware · artefacto"
      height="h-[500px] md:h-[580px]"
      legend={[
        { color: info.tone, label: info.name },
        { color: P.inkSoft, label: "peticiones" },
        { color: P.amber, label: "carga del artefacto" },
      ]}
      note={note}
      controls={
        <>
          <Switcher
            ariaLabel="Hardware"
            value={hw}
            onChange={setHw}
            options={[
              { value: "mac", label: "Mac", tone: P.teal },
              { value: "nvidia", label: "GPU NVIDIA", tone: P.amber },
              { value: "cpu", label: "Solo CPU", tone: P.inkSoft },
            ]}
          />
          <Switcher
            ariaLabel="Prioridad"
            value={priority}
            onChange={setPriority}
            options={[
              { value: "easy", label: "Comodidad", tone: P.violet },
              { value: "control", label: "Control", tone: P.teal },
            ]}
          />
          <Knob label="Usuarios" min={1} max={32} value={users} onChange={setUsers} tone={P.inkSoft} />
          <Readout items={[{ label: "motor", value: info.name, tone: info.tone }]} />
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [-2.5, 5.2, 9.5], fov: 34 }} fit={0.96}>
        <ShadowBlob position={[0, 0.004, 0]} scale={9.5} opacity={0.1} />
        <RoundedBox args={[9.6, 0.24, 3.0]} position={[0, 0.12, 0]} radius={0.12} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial color="#DDD5C6" roughness={0.4} clearcoat={0.3} clearcoatRoughness={0.35} />
        </RoundedBox>
        <Clients users={users} />
        <group position={[0, 0.24, 0]}>
          <Hardware hw={hw} />
          <EngineBlock engine={pick.engine} users={users} />
          <Tag position={[0, 1.55, 0]} tone={pick.engine === "llama" ? "teal" : pick.engine === "ollama" ? "violet" : pick.engine === "vllm" ? "amber" : "rose"} size="sm" center>
            {info.name}
          </Tag>
          <Tag position={[0, -0.1, 1.2]} tone="muted" size="xs" center plate={false}>
            {HW_LABEL[hw]}
          </Tag>
        </group>
        <group position={artifactPos}>
          <RoundedBox args={[1.2, 0.08, 1.4]} position={[0, -0.02, 0]} radius={0.03} smoothness={2} receiveShadow>
            <meshStandardMaterial color="#8C9895" metalness={0.5} roughness={0.35} />
          </RoundedBox>
          <ArtifactModel artifact={info.artifact} />
          <Tag position={[0, -0.1, 1.0]} tone="amber" size="xs" center plate={false}>
            {ARTIFACT[info.artifact]}
          </Tag>
        </group>
        <Flow points={[[2.8, 0.7, 0], [1.9, 1.3, 0], [1.1, 1.05, 0]]} color={P.amber} count={2} size={0.05} speed={0.35} lineOpacity={0.3} />
        {Array.from({ length: lanes }, (_, i) => {
          const z = (i - (lanes - 1) / 2) * 0.35;
          return (
            <Flow
              key={i}
              points={batched && lanes > 1 ? [[-2.8, 0.7, z], [-1.8, 1.0, z * 0.5], [-1.0, 1.1, 0]] : [[-2.8, 0.7, z], [-1.8, 1.0, z], [-1.0, 1.1, z]]}
              color={P.inkSoft}
              count={2}
              size={0.04}
              speed={0.45}
              offset={i * 0.25}
              lineOpacity={0.25}
            />
          );
        })}
      </Stage>
    </Figure>
  );
}
