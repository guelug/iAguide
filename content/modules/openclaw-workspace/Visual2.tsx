"use client";

import { useState } from "react";
import { Figure, Switcher, Readout } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Halo, Motes, Node3D, PointerTilt, Ribbon, Slab, Tag, ShadowBlob, Arrow } from "@/components/three/atoms";
import { P, mixHex } from "@/lib/palette";
import { useCopy } from "@/lib/useCopy";
import { RoundedBox } from "@react-three/drei";
import { useLocale } from "next-intl";

type Mode = "bootstrap" | "files" | "scope";
const COPY = {
  en: { title: "the workspace is the agent's house", hint: "bootstrap · files · scope", bootstrap: "bootstrap", files: "files", scope: "scope", soul: "SOUL.md", agents: "AGENTS.md", memory: "MEMORY.md", user: "USER.md", skills: "skills", inject: "inject", host: "host", sandbox: "sandbox", cwd: "cwd", config: "config" },
  es: { title: "el workspace es la casa del agente", hint: "bootstrap · ficheros · alcance", bootstrap: "bootstrap", files: "ficheros", scope: "alcance", soul: "SOUL.md", agents: "AGENTS.md", memory: "MEMORY.md", user: "USER.md", skills: "skills", inject: "inyecta", host: "host", sandbox: "sandbox", cwd: "cwd", config: "config" },
};

function LegacyVisual() {
  const t = useCopy(COPY);
  const [mode, setMode] = useState<Mode>("bootstrap");
  return <Figure label={t.title} hint={t.hint} legend={[{ color: P.teal, label: t.soul }, { color: P.violet, label: t.memory }, { color: P.amber, label: t.skills }]} controls={<Switcher value={mode} onChange={setMode} options={[{ value: "bootstrap", label: t.bootstrap, tone: P.teal }, { value: "files", label: t.files, tone: P.violet }, { value: "scope", label: t.scope, tone: P.amber }]} ariaLabel={t.title} />}>
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 8.6], fov: 37 }}>
      <Motes count={100} radius={7} opacity={0.3} /><PointerTilt amount={0.07}>
        {mode === "bootstrap" && <><Slab position={[-1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.teal} fill={0.22} /><Tag position={[-1.7, 0.78, 0.15]} tone="teal">{t.cwd}</Tag><Ribbon points={[[-0.75, 0.2, 0], [0.75, 0.2, 0]]} color={P.violet} radius={0.05} opacity={0.85} /><Slab position={[1.7, 0.2, 0]} size={[1.6, 0.9, 0.12]} color={P.violet} fill={0.22} /><Tag position={[1.7, 0.78, 0.15]} tone="violet">{t.inject}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">primer turno → bootstrap</Tag></>}
        {mode === "files" && <>{[[t.agents, P.teal, -1.8], [t.soul, P.violet, -0.6], [t.user, P.amber, 0.6], [t.memory, P.rose, 1.8]].map(([label, color, x], i) => <group key={label as string}><Slab position={[x as number, 0.2, 0]} size={[1.2, 0.78, 0.12]} color={color as string} fill={0.24} /><Tag position={[x as number, 0.72, 0.15]} tone={(["teal", "violet", "amber", "rose"] as const)[i]} size="xs">{label as string}</Tag></group>)}<Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">cada sesión carga instrucciones; MEMORY es opcional</Tag></>}
        {mode === "scope" && <><Halo position={[0, 0.2, 0]} radius={1.1} color={P.amber} opacity={0.34} spin={0.1} /><Node3D position={[0, 0.2, 0]} color={P.amber} radius={0.2} pulse={0.3} /><Tag position={[0, 0.78, 0.15]} tone="amber">{t.host}</Tag><Ribbon points={[[-1.9, 0.2, 0], [-0.45, 0.2, 0]]} color={P.teal} radius={0.045} opacity={0.85} /><Tag position={[-1.9, 0.65, 0.15]} tone="teal" size="xs">{t.cwd}</Tag><Ribbon points={[[0.45, 0.2, 0], [1.9, 0.2, 0]]} color={P.rose} radius={0.045} opacity={0.85} /><Tag position={[1.9, 0.65, 0.15]} tone="rose" size="xs">{t.sandbox}</Tag><Tag position={[0, -0.75, 0.15]} tone="muted" size="xs">workspace ≠ sandbox duro</Tag></>}
      </PointerTilt>
    </Stage>
  </Figure>;
}

/* ------------------------------------------------------------------ ES */

/*
 * Lo que existe para el agente, y dónde. Dos bancos:
 *  - Git privado: el repo del workspace recibe AGENTS, SOUL, IDENTITY,
 *    USER y memory/ (el git add de la lección); .gitignore frena .env,
 *    *.key, *.pem, secrets*; y todo ~/.openclaw (config, bases SQLite,
 *    credenciales, skills gestionadas) queda fuera del repo siempre.
 *  - Skills: seis ubicaciones apiladas por precedencia (la más alta
 *    arriba). Si una skill con el mismo nombre aparece en varias, gana la
 *    más alta. Las ubicaciones de cada skill de ejemplo son inventadas.
 */

type Ow2Mode = "git" | "skills";
type FileState = "commit" | "ignored" | "outside";
type GitFile = { name: string; state: FileState };

const GIT_FILES: GitFile[] = [
  { name: "AGENTS.md", state: "commit" },
  { name: "SOUL.md", state: "commit" },
  { name: "IDENTITY.md", state: "commit" },
  { name: "USER.md", state: "commit" },
  { name: "memory/", state: "commit" },
  { name: ".env", state: "ignored" },
  { name: "deploy.pem", state: "ignored" },
  { name: "openclaw.json", state: "outside" },
  { name: "openclaw.sqlite", state: "outside" },
  { name: "credentials/", state: "outside" },
  { name: "agent.sqlite", state: "outside" },
];

const SKILL_LEVELS = [
  "<workspace>/skills",
  "<workspace>/.agents/skills",
  "~/.agents/skills",
  "~/.openclaw/skills",
  "incluidas",
  "extraDirs",
];

type SkillKey = "resumen" | "deploy" | "pdf";
const SKILL_WHERE: Record<SkillKey, number[]> = {
  resumen: [3, 4],
  deploy: [0, 2, 5],
  pdf: [4],
};

const O2W = { base: "#2d3336", baseTop: "#42494d", brass: "#b68442", steel: "#a3aaad", ceramic: "#efebe2" };

function Chip2({ position, name, color, faded = false, struck = false }: { position: [number, number, number]; name: string; color: string; faded?: boolean; struck?: boolean }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.05, 0.26, 0.5]} position={[0, 0.13, 0]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={faded ? "#d8d4ca" : mixHex(P.paper, color, 0.4)} roughness={0.42} clearcoat={0.4} transparent={faded} opacity={faded ? 0.75 : 1} />
      </RoundedBox>
      {struck ? (
        <mesh position={[0, 0.27, 0]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[1.1, 0.02, 0.04]} />
          <meshStandardMaterial color={P.rose} />
        </mesh>
      ) : null}
      <Tag position={[0, 0.45, 0]} tone={faded ? "muted" : "ink"} size="xs" center>
        <span className="normal-case">{name}</span>
      </Tag>
    </group>
  );
}

function GitScene() {
  const commits = GIT_FILES.filter((f) => f.state === "commit");
  const ignored = GIT_FILES.filter((f) => f.state === "ignored");
  const outside = GIT_FILES.filter((f) => f.state === "outside");
  return (
    <group>
      {/* Workspace zone with its private repo tray. */}
      <RoundedBox args={[4.6, 0.12, 4.4]} position={[-2.3, 0.06, 0]} radius={0.05} smoothness={2} receiveShadow>
        <meshStandardMaterial color={mixHex(P.paper, P.teal, 0.2)} roughness={0.55} />
      </RoundedBox>
      <Tag position={[-4.35, 0.25, 2.0]} tone="teal" size="xs">~/.openclaw/workspace</Tag>
      <RoundedBox args={[1.8, 0.1, 3.4]} position={[-1.2, 0.17, -0.1]} radius={0.04} smoothness={2} receiveShadow castShadow>
        <meshStandardMaterial color={O2W.ceramic} roughness={0.55} />
      </RoundedBox>
      {[-2.1, -0.3].map((x) => (
        <mesh key={x} position={[x, 0.3, -0.1]}>
          <boxGeometry args={[0.04, 0.2, 3.4]} />
          <meshStandardMaterial color={O2W.brass} metalness={0.75} roughness={0.28} />
        </mesh>
      ))}
      <Tag position={[-1.2, 0.25, 1.85]} tone="teal" size="xs" center>repo git privado</Tag>
      {commits.map((f, i) => <Chip2 key={f.name} position={[-1.2, 0.22, -1.5 + i * 0.62]} name={f.name} color={P.teal} />)}
      {ignored.map((f, i) => <Chip2 key={f.name} position={[-3.3, 0.12, -0.9 + i * 0.9]} name={f.name} color={P.rose} faded struck />)}
      <Tag position={[-3.3, 0.25, 1.0]} tone="rose" size="xs" center>.gitignore</Tag>

      {/* ~/.openclaw zone: never in the workspace repo. */}
      <RoundedBox args={[3.6, 0.12, 4.4]} position={[2.6, 0.06, 0]} radius={0.05} smoothness={2} receiveShadow>
        <meshStandardMaterial color={mixHex(P.paper, P.amber, 0.2)} roughness={0.55} />
      </RoundedBox>
      <Tag position={[0.95, 0.25, 2.0]} tone="amber" size="xs">~/.openclaw</Tag>
      {outside.map((f, i) => <Chip2 key={f.name} position={[2.6, 0.12, -1.4 + i * 0.85]} name={f.name} color={P.amber} />)}
      {/* The wall between the zones. */}
      <mesh position={[0.4, 0.4, 0]}>
        <boxGeometry args={[0.06, 0.8, 4.4]} />
        <meshStandardMaterial color={P.rose} transparent opacity={0.55} />
      </mesh>
      <Tag position={[0.4, 1.0, 0]} tone="rose" size="xs" center>fuera de git</Tag>
    </group>
  );
}

function SkillsScene({ skill }: { skill: SkillKey }) {
  const where = SKILL_WHERE[skill];
  const winner = Math.min(...where);
  const shelfY = (i: number) => 0.2 + (SKILL_LEVELS.length - 1 - i) * 0.3;
  const shelfZ = (i: number) => -1.9 + i * 0.74;
  return (
    <group>
      {/* A rack of shelves: precedence runs top to bottom. */}
      {SKILL_LEVELS.map((_, i) => (
        <mesh key={"riser" + i} position={[0, shelfY(i) / 2, shelfZ(i)]} castShadow receiveShadow>
          <boxGeometry args={[5.2, shelfY(i), 0.7]} />
          <meshStandardMaterial color={i % 2 ? "#50585c" : "#586064"} roughness={0.6} />
        </mesh>
      ))}
      {SKILL_LEVELS.map((level, i) => {
        const has = where.includes(i);
        const wins = i === winner;
        return (
          <group key={level} position={[0, shelfY(i) + 0.04, shelfZ(i)]}>
            <RoundedBox args={[5.4, 0.08, 0.72]} radius={0.03} smoothness={2} castShadow receiveShadow>
              <meshStandardMaterial color={O2W.ceramic} roughness={0.55} />
            </RoundedBox>
            <Tag position={[-2.55, 0.14, 0.2]} tone={wins ? "teal" : "muted"} size="xs">
              <span className="normal-case">{i + 1 + ". " + level}</span>
            </Tag>
            {has ? (
              <group position={[1.2, 0.04, 0]}>
                <RoundedBox args={[1.1, 0.34, 0.5]} position={[0, 0.17, 0]} radius={0.06} smoothness={3} castShadow>
                  <meshPhysicalMaterial color={wins ? mixHex(P.paper, P.teal, 0.5) : "#d6d2c8"} roughness={0.4} clearcoat={0.45} transparent={!wins} opacity={wins ? 1 : 0.7} />
                </RoundedBox>
                <mesh position={[0, 0.35, 0.255]}>
                  <boxGeometry args={[0.7, 0.02, 0.01]} />
                  <meshStandardMaterial color={wins ? P.teal : P.lineStrong} />
                </mesh>
                <Tag position={[0.75, 0.2, 0]} tone={wins ? "teal" : "muted"} size="xs">{wins ? "gana" : "sombreada"}</Tag>
              </group>
            ) : null}
          </group>
        );
      })}
      <Arrow from={[3.2, shelfY(0) + 0.3, shelfZ(0)]} to={[3.2, shelfY(5) + 0.3, shelfZ(5)]} color={P.inkSoft} width={1.8} head={0.12} />
      <Tag position={[3.7, shelfY(3) + 0.35, shelfZ(3)]} tone="muted" size="xs" center>menos precedencia</Tag>
    </group>
  );
}

function SpanishVisual() {
  const [mode, setMode] = useState<Ow2Mode>("git");
  const [skill, setSkill] = useState<SkillKey>("deploy");
  const where = SKILL_WHERE[skill];
  const winner = Math.min(...where);
  const counts = { commit: 0, ignored: 0, outside: 0 };
  GIT_FILES.forEach((f) => { counts[f.state] += 1; });
  return (
    <Figure
      label="Lo que no está en la casa no existe para el agente"
      hint="repo privado · fuera de git · precedencia de skills"
      height="h-[440px] md:h-[520px]"
      legend={[
        { color: P.teal, label: "en el workspace / gana" },
        { color: P.amber, label: "~/.openclaw" },
        { color: P.rose, label: "ignorado / fuera de git" },
      ]}
      note={
        mode === "git" ? (
          <div className="space-y-3">
            <p><strong>El workspace se versiona en un repo privado; ~/.openclaw nunca.</strong> El git add de la lección sube AGENTS, SOUL, IDENTITY, USER y memory/. Los secretos se quedan fuera con .gitignore. Config, bases SQLite (estado, sesiones y transcripts) y credenciales viven bajo ~/.openclaw y no se commitean, ni siquiera por un symlink de conveniencia.</p>
            <Readout items={[
              { label: "al repo", value: String(counts.commit), tone: "var(--teal)" },
              { label: "ignorados", value: String(counts.ignored), tone: "var(--rose)" },
              { label: "fuera de git", value: String(counts.outside), tone: "var(--amber)" },
            ]} />
            <p className="text-xs text-muted">Caso de la lección: un archivo de configuración fuera del workspace no existe para el agente; lo que el agente ve es su casa.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p><strong>Gana la ubicación más alta: {SKILL_LEVELS[winner]}.</strong> OpenClaw carga skills de seis sitios, del workspace a extraDirs. Una skill con el mismo nombre en un nivel inferior queda sombreada. Las skills se exponen por su nombre plano de frontmatter aunque estén en carpetas agrupadas.</p>
            <Readout items={[
              { label: "skill", value: skill, tone: "var(--ink)" },
              { label: "copias", value: String(where.length), tone: "var(--muted)" },
              { label: "carga", value: SKILL_LEVELS[winner], tone: "var(--teal)" },
            ]} />
            <p className="text-xs text-muted">Orden de OpenClaw, «Agent runtime». En qué niveles está cada skill de ejemplo es inventado para mostrar la regla.</p>
          </div>
        )
      }
      controls={
        <>
          <Switcher value={mode} onChange={setMode} ariaLabel="Vista" options={[{ value: "git", label: "Git privado", tone: P.teal }, { value: "skills", label: "Skills", tone: P.violet }]} />
          {mode === "skills" ? <Switcher value={skill} onChange={setSkill} ariaLabel="Skill de ejemplo" options={[{ value: "deploy", label: "deploy", tone: P.teal }, { value: "resumen", label: "resumen", tone: P.teal }, { value: "pdf", label: "pdf", tone: P.teal }]} /> : null}
        </>
      }
    >
      <Stage className="h-full w-full" camera={{ position: [1.8, 6.4, 9.2], fov: 32 }} fit={1.04}>
        <ShadowBlob position={[0, -0.38, 0]} scale={10} opacity={0.12} />
        <RoundedBox args={[9.6, 0.3, 5.2]} position={[0, -0.2, 0]} radius={0.15} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color={O2W.base} roughness={0.55} metalness={0.15} />
        </RoundedBox>
        {mode === "git" ? <GitScene /> : <SkillsScene skill={skill} />}
      </Stage>
    </Figure>
  );
}

export default function Visual() {
  return useLocale() === "es" ? <SpanishVisual /> : <LegacyVisual />;
}
