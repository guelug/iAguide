"use client";

import { useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Figure, Knob, Switcher } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Tag, Wire, type V3 } from "@/components/three/atoms";
import {
  AxisLine,
  Duct,
  GlassPanel,
  ISO_CAMERA,
  IsoDust,
  IsoFrame,
  PlanTrace,
  Sheet,
} from "@/components/three/iso";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { useLocale } from "next-intl";

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}

/*
 * Upload is a write-token operation, and there are three Git families.
 *
 * Model, dataset, space — same Git contract, different payload. A read
 * token stops at the gate with 403. A write token is still not a master
 * key: org membership is a second gate, already drawn in Visual3.
 */

type Mode = "types" | "write" | "read";

const COPY = {
  en: {
    title: "upload needs write, and three repo families",
    hint: "model · dataset · space · read token is a 403",
    types: "three repos",
    write: "write token",
    read: "read = 403",
    legendModel: "model",
    legendData: "dataset",
    legendSpace: "space",
    model: "model",
    dataset: "dataset",
    space: "space",
    gate: "write gate",
    hub: "Hub",
    notes: {
      types:
        "One Git contract, three families. A model holds weights and a card. A dataset holds rows. A Space is a repo that runs. hf upload --repo-type points at the family. Buckets are not repos.",
      write:
        "hf upload is the documented push. If the repo does not exist, the CLI creates it. A write token is required. Unsloth save_pretrained / push_to_hub is this same Hub API with a Python layer.",
      read: "A read token returns 403. Same role table as the tokens section, not a new ACL. Prefer uploading adapters from a machine you control, not from a shared notebook.",
    },
  },
  es: {
    title: "subir pide write, y tres familias de repo",
    hint: "modelo · dataset · space · token read es un 403",
    types: "tres repos",
    write: "token write",
    read: "read = 403",
    legendModel: "modelo",
    legendData: "dataset",
    legendSpace: "space",
    model: "modelo",
    dataset: "dataset",
    space: "space",
    gate: "puerta write",
    hub: "Hub",
    notes: {
      types:
        "Un contrato Git, tres familias. Un modelo guarda pesos y una card. Un dataset guarda filas. Un Space es un repo que se ejecuta. hf upload --repo-type apunta a la familia. Los buckets no son repos.",
      write:
        "hf upload es el push documentado. Si el repo no existe, la CLI lo crea. Hace falta un token write. El export de Unsloth (save_pretrained, push_to_hub) es esta misma API del Hub con una capa Python.",
      read: "Un token read devolverá 403. Es la misma tabla de roles de la página de tokens, no una ACL nueva. Prefiere subir adapters desde una máquina que controlas, no desde un notebook compartido.",
    },
  },
};

const ISO: V3 = [0, Math.PI / 4, 0];

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("types");
  const pass = mode !== "read";

  return (
    <Figure
      label={t.title}
      hint={t.hint}
      legend={[
        { color: P.teal, label: t.legendModel },
        { color: P.amber, label: t.legendData },
        { color: P.violet, label: t.legendSpace },
      ]}
      controls={
        <Switcher
          value={mode}
          onChange={setMode}
          options={[
            { value: "types", label: t.types, tone: P.teal },
            { value: "write", label: t.write, tone: P.amber },
            { value: "read", label: t.read, tone: P.rose },
          ]}
          ariaLabel={t.title}
        />
      }
      note={
        <>
          <strong className="text-ink">{t[mode]}</strong>
          {" — "}
          {t.notes[mode]}
        </>
      }
      height="h-[400px] md:h-[500px]"
    >
      <Stage className="h-full w-full" orthographic camera={ISO_CAMERA} background={P.paper} fit={1.14}>
        <IsoFrame width={13.2} depth={11.5} y={-0.04} />
        <PlanTrace
          points={[[-5.5, 3.3], [0, 3.3], [0, 0.3]]}
          y={-0.03}
          color={pass ? P.amber : P.rose}
          opacity={0.65}
        />
        <AxisLine from={[-4.6, 0, 2.2]} to={[4.7, 0, 2.2]} />
        <IsoDust count={40} center={[0, 0.55, 0]} spread={[5.0, 1.0, 3.5]} />

        {[
          { x: -3.4, z: 1.15, color: P.teal, wash: P.tealWash, label: t.model, tone: "teal" as const },
          { x: -3.4, z: -0.15, color: P.amber, wash: P.amberWash, label: t.dataset, tone: "amber" as const },
          { x: -3.4, z: -1.45, color: P.violet, wash: P.violetWash, label: t.space, tone: "violet" as const },
        ].map((r) => (
          <group key={r.label}>
            <Sheet
              position={[r.x, 0.06, r.z]}
              size={[1.45, 1.0]}
              color={r.wash}
              fill={0.88}
              marks={4}
              markColor={r.color}
            />
            <Tag position={[r.x, 1.25, r.z]} tone={r.tone} size="xs">
              {r.label}
            </Tag>
          </group>
        ))}

        <GlassPanel
          position={[0.15, 1.35, 0]}
          rotation={ISO}
          size={[1.55, 2.35]}
          color={pass ? P.amber : P.rose}
          opacity={pass ? 0.28 : 0.14}
        />
        <Tag position={[0.15, 2.75, 0]} tone={pass ? "amber" : "rose"} size="xs">
          {t.gate}
        </Tag>

        <GlassPanel
          position={[3.15, 1.4, 0.15]}
          rotation={ISO}
          size={[2.45, 2.3]}
          color={P.teal}
          opacity={pass ? 0.26 : 0.08}
        />
        <Tag position={[3.15, 2.8, 0.15]} tone="teal">
          {t.hub}
        </Tag>
        {pass
          ? [0, 1, 2].map((i) => (
              <Sheet
                key={i}
                position={[3.05, 0.08 + i * 0.09, 0.25 - i * 0.08]}
                size={[1.4, 0.95]}
                color={i === 2 ? P.violetWash : i === 1 ? P.amberWash : P.tealWash}
                fill={0.8}
                marks={3}
                markColor={i === 2 ? P.violet : i === 1 ? P.amber : P.teal}
              />
            ))
          : null}

        <Duct
          from={[-2.4, 0.22, 0]}
          to={[pass ? 2.05 : 0.15, pass ? 0.45 : 0.9, 0.1]}
          color={pass ? P.amber : P.rose}
          radius={0.1}
          bend={0.5}
        />
        <Flow
          points={[
            [-2.25, 0.25, 0],
            [pass ? 1.9 : 0.05, pass ? 0.48 : 0.85, 0.08],
          ]}
          color={pass ? P.amber : P.rose}
          count={3}
        />
      </Stage>
    </Figure>
  );
}

/* ======================================================================
 * Versión española: qué hace `hf upload` con tu carpeta.
 *
 * Dos puertas en serie (rol del token, membresía en la org), después la
 * familia de repo (--repo-type) y por último la rama: commit directo en
 * main o pull request con --create-pr. --every 10 sube la carpeta cada
 * diez minutos durante el entrenamiento: los commits se cuentan.
 * ==================================================================== */

type TokenRole = "read" | "write";
type Target = "user" | "orgWriter" | "orgReader";
type Family = "model" | "dataset" | "space";

const FAMILY: Record<Family, { label: string; color: string; flag: string }> = {
  model: { label: "Modelo", color: P.teal, flag: "" },
  dataset: { label: "Dataset", color: P.amber, flag: " --repo-type dataset" },
  space: { label: "Space", color: P.violet, flag: " --repo-type space" },
};
const TARGET: Record<Target, { repo: string; label: string }> = {
  user: { repo: "nuria/qwen-adapter", label: "Tu cuenta" },
  orgWriter: { repo: "MiOrg/qwen-adapter", label: "Org · escritura" },
  orgReader: { repo: "MiOrg/qwen-adapter", label: "Org · solo lectura" },
};

function uploadOutcome(role: TokenRole, target: Target, pr: boolean, minutes: number) {
  if (role === "read") return { ok: false, stop: 1 as const, commits: 0, reason: "rol" };
  if (target === "orgReader") return { ok: false, stop: 2 as const, commits: 0, reason: "membresía" };
  const commits = minutes === 0 ? 1 : Math.floor(minutes / 10);
  return { ok: true, stop: 3 as const, commits, reason: pr ? "pr" : "main" };
}

function SpanishVisual() {
  const [role, setRole] = useState<TokenRole>("write");
  const [target, setTarget] = useState<Target>("user");
  const [family, setFamily] = useState<Family>("model");
  const [pr, setPr] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const o = uploadOutcome(role, target, pr, minutes);
  const cmd = `hf upload ${TARGET[target].repo} ./salida .${FAMILY[family].flag}${pr ? " --create-pr" : ""}${minutes ? " --every 10" : ""}`;

  const story = !o.ok
    ? o.stop === 1
      ? "El token es read. La primera puerta devuelve 403 antes de mirar el repo: leer y descargar sí, hacer push no. Es la misma tabla de roles de la página de tokens, no una ACL nueva."
      : "El token es write, pero en MiOrg eres miembro de solo lectura. La segunda puerta devuelve 403: el rol del token y tu membresía se aplican a la vez. Un token write no es una llave maestra."
    : `Las dos puertas pasan. Si ${TARGET[target].repo} no existe, la CLI lo crea como ${FAMILY[family].label.toLowerCase()}. ${pr ? "Con --create-pr los ficheros llegan como pull request y main no se toca." : "Sin --create-pr el commit va directo a main."} ${minutes ? `Con --every 10 durante ${minutes} minutos de entrenamiento salen ${o.commits} commits.` : ""}`;

  return (
    <Figure
      label="Subir es una operación de token write"
      hint="hf upload · dos puertas · tres familias de repo"
      height="h-[520px] md:h-[600px]"
      legend={[
        { color: P.teal, label: "Modelo" },
        { color: P.amber, label: "Dataset" },
        { color: P.violet, label: "Space" },
        { color: P.rose, label: "403" },
      ]}
      controls={
        <>
          <Switcher ariaLabel="Rol del token" value={role} onChange={setRole} options={[{ value: "write", label: "Token write", tone: P.teal }, { value: "read", label: "Token read", tone: P.rose }]} />
          <Switcher ariaLabel="Destino" value={target} onChange={setTarget} options={(Object.keys(TARGET) as Target[]).map((v) => ({ value: v, label: TARGET[v].label, tone: v === "orgReader" ? P.rose : P.inkSoft }))} />
          <Switcher ariaLabel="Familia de repo" value={family} onChange={setFamily} options={(Object.keys(FAMILY) as Family[]).map((v) => ({ value: v, label: FAMILY[v].label, tone: FAMILY[v].color }))} />
          <button type="button" className="chip" aria-pressed={pr} onClick={() => setPr(!pr)}>{pr ? "Quitar --create-pr" : "Añadir --create-pr"}</button>
          <Knob label="--every 10 durante" value={minutes} min={0} max={90} step={10} onChange={setMinutes} format={(v) => (v ? `${v} min` : "no")} />
        </>
      }
      note={
        <div className="space-y-3">
          <p className="rounded border border-line bg-paper p-3 font-mono text-xs">{cmd}</p>
          <div className="grid grid-cols-3 gap-3 border-b border-line pb-3">
            {[
              ["Resultado", o.ok ? (pr ? "pull request" : "commit en main") : "403"],
              ["Se detiene en", o.ok ? "—" : o.stop === 1 ? "puerta 1 · rol" : "puerta 2 · membresía"],
              ["Commits", String(o.commits)],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="block text-xs text-muted">{label}</span>
                <strong className={`mt-1 block font-display text-2xl ${!o.ok && label !== "Commits" ? "text-rose" : "text-ink"}`}>{value}</strong>
              </div>
            ))}
          </div>
          <p>{story}</p>
          <p className="text-xs text-muted">Nombres de repo ilustrativos. Sube adapters y cards desde una máquina que controlas, no desde un notebook compartido. Unsloth push_to_hub usa esta misma API del Hub.</p>
        </div>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [3, 6.5, 10.5], fov: 34 }} fit={1.05}>
        <UploadBench outcome={o} family={family} pr={pr} />
      </Stage>
    </Figure>
  );
}

/* BENCH */
function Part({ p, s, color, coat = 0.4, rough = 0.42, metal = 0.05, rot }: { p: V3; s: V3; color: string; coat?: number; rough?: number; metal?: number; rot?: V3 }) {
  return (
    <RoundedBox args={s} position={p} rotation={rot} radius={Math.min(0.05, Math.min(s[0], s[1], s[2]) / 3)} smoothness={2} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={coat} />
    </RoundedBox>
  );
}

const GATE_X = [-1.9, -0.2];
const BIN_Z: Record<Family, number> = { model: -1.25, dataset: 0, space: 1.25 };

function Gate({ x, open, label, tested }: { x: number; open: boolean; label: string; tested: boolean }) {
  const color = !tested ? "#B9B5A9" : open ? P.teal : P.rose;
  return (
    <group position={[x, 0, 0]}>
      {[-0.55, 0.55].map((z) => <Part key={z} p={[0, 0.45, z]} s={[0.16, 0.8, 0.16]} color="#2E3438" metal={0.4} />)}
      <group position={[0, 0.72, -0.55]} rotation={[open ? -1.2 : 0, 0, 0]}>
        <Part p={[0, 0, 0.55]} s={[0.08, 0.08, 1.1]} color={color} />
      </group>
      <mesh position={[0, 0.9, -0.55]} castShadow>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={tested ? 0.25 : 0} />
      </mesh>
      <Tag position={[0, 1.35, -0.55]} tone={!tested ? "muted" : open ? "teal" : "rose"} size="xs" center>{tested && !open ? `${label} · 403` : label}</Tag>
    </group>
  );
}

function UploadBench({ outcome, family, pr }: { outcome: ReturnType<typeof uploadOutcome>; family: Family; pr: boolean }) {
  const stopX = outcome.ok ? 1.3 : GATE_X[outcome.stop - 1] - 0.45;
  const binZ = BIN_Z[family];
  return (
    <group>
      <Part p={[0, -0.13, 0]} s={[10.4, 0.22, 4.4]} color="#40362D" rough={0.6} coat={0.3} />
      <Part p={[0, 0.0, 0]} s={[10.1, 0.05, 4.1]} color="#6B513A" rough={0.55} coat={0} />

      {/* Your folder. */}
      <group position={[-4.0, 0, 0]}>
        <Part p={[0, 0.12, 0]} s={[1.4, 0.14, 1.2]} color="#2E3438" metal={0.3} />
        {["adapter_model", "adapter_config", "README"].map((f, k) => (
          <Part key={f} p={[0, 0.24 + k * 0.05, 0]} s={[1.0 - k * 0.05, 0.03, 0.8 - k * 0.05]} color={k === 0 ? "#EDE6D6" : k === 1 ? "#F4EFE4" : "#FBF7EE"} rough={0.7} coat={0} rot={[0, (k - 1) * 0.08, 0]} />
        ))}
        <Tag position={[0, 0.2, 0.85]} tone="ink" size="xs" center>./salida</Tag>
      </group>

      {/* Conveyor through the two gates. */}
      {[-0.22, 0.22].map((z) => (
        <mesh key={z} position={[-1.05, 0.2, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 4.6, 12]} />
          <meshStandardMaterial color="#B68442" metalness={0.72} roughness={0.28} />
        </mesh>
      ))}
      <Gate x={GATE_X[0]} open={outcome.stop > 1} tested label="Rol del token" />
      <Gate x={GATE_X[1]} open={outcome.stop > 2} tested={outcome.stop >= 2} label="Membresía" />
      <Flow points={[[-3.3, 0.45, 0], [stopX, 0.45, 0]]} color={outcome.ok ? P.teal : P.rose} count={3} size={0.05} speed={0.35} lineOpacity={0.4} />
      <Part p={[stopX, 0.38, 0]} s={[0.5, 0.2, 0.36]} color={outcome.ok ? "#EDE6D6" : mixHex("#EDE6D6", P.rose, 0.35)} />

      {/* The Hub: three repo families, one Git contract. */}
      <group position={[3.2, 0, 0]}>
        <Part p={[0, 0.12, 0]} s={[3.0, 0.14, 4.0]} color="#263532" metal={0.3} />
        {(Object.keys(BIN_Z) as Family[]).map((f) => {
          const on = f === family && outcome.ok;
          const col = FAMILY[f].color;
          return (
            <group key={f} position={[0, 0, BIN_Z[f]]}>
              <Part p={[0, 0.24, 0]} s={[2.6, 0.08, 1.0]} color={mixHex(P.paper, col, on ? 0.3 : 0.12)} />
              {[-0.46, 0.46].map((z) => <Part key={z} p={[0, 0.36, z]} s={[2.6, 0.18, 0.06]} color={mixHex(P.paper, col, 0.5)} />)}
              <mesh position={[0, 0.32, -0.1]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.025, 0.025, 2.2, 10]} />
                <meshStandardMaterial color={col} roughness={0.4} />
              </mesh>
              <Tag position={[-1.55, 0.35, 0]} tone={f === "model" ? "teal" : f === "dataset" ? "amber" : "violet"} size="xs" center>{FAMILY[f].label}</Tag>
              {on
                ? Array.from({ length: outcome.commits }, (_, k) =>
                    pr ? (
                      <mesh key={k} position={[-0.6 + k * 0.2, 0.36, 0.22]} castShadow>
                        <cylinderGeometry args={[0.07, 0.07, 0.07, 18]} />
                        <meshStandardMaterial color={P.inkSoft} roughness={0.4} />
                      </mesh>
                    ) : (
                      <mesh key={k} position={[-0.9 + k * 0.2, 0.36, -0.1]} castShadow>
                        <cylinderGeometry args={[0.07, 0.07, 0.07, 18]} />
                        <meshStandardMaterial color={col} roughness={0.4} />
                      </mesh>
                    ),
                  )
                : null}
              {on && pr ? (
                <>
                  <Wire points={[[-1.0, 0.34, -0.1], [-0.75, 0.34, 0.22], [-0.6 + (outcome.commits - 1) * 0.2, 0.34, 0.22]]} color={P.inkSoft} width={1.6} />
                  <Tag position={[0.9, 0.55, 0.3]} tone="ink" size="xs" center>pull request</Tag>
                </>
              ) : null}
              {on && !pr ? <Tag position={[0.9, 0.55, -0.1]} tone={f === "model" ? "teal" : f === "dataset" ? "amber" : "violet"} size="xs" center>{`main · ${outcome.commits}`}</Tag> : null}
            </group>
          );
        })}
        <Tag position={[0, 0.3, -2.25]} tone="ink" size="xs" center>Hub</Tag>
      </group>
      {outcome.ok ? <Flow points={[[1.5, 0.45, 0], [2.2, 0.9, binZ * 0.6], [2.8, 0.5, binZ]]} color={FAMILY[family].color} count={3} size={0.05} speed={0.4} lineOpacity={0.4} /> : null}
    </group>
  );
}
