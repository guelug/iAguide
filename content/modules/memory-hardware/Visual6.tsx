"use client";

import { useState } from "react";
import { Knob, Switcher } from "@/components/three/Figure";

const MACHINES = [
  { name: "GeForce RTX 5090", chip: "GPU discreta · GDDR7", capacity: 32, bandwidth: 1792, color: "#347969", source: "https://images.nvidia.com/aem-dam/Solutions/geforce/blackwell/nvidia-rtx-blackwell-gpu-architecture.pdf" },
  { name: "M4 Max · 16 CPU / 40 GPU", chip: "Configuración de 128 GB · unificada", capacity: 128, bandwidth: 546, color: "#b67c37", source: "https://support.apple.com/en-mide/121553" },
  { name: "M3 Max · 16 CPU / 40 GPU", chip: "Configuración de 128 GB · unificada", capacity: 128, bandwidth: 400, color: "#637da3", source: "https://support.apple.com/en-us/117737" },
];
const fmt = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 2 });

/** Decimal GB throughout. These are arithmetic bounds, never measured inference rates. */
export default function Visual6() {
  const [params, setParams] = useState(8);
  const [bits, setBits] = useState(4);
  const [kv, setKv] = useState(2);
  const [reserve, setReserve] = useState(8);
  const weights = params * bits / 8;
  const total = weights + kv + reserve;
  const segments = [{ name: "Pesos", value: weights, color: "#347969" }, { name: "Caché KV", value: kv, color: "#b67c37" }, { name: "Reserva", value: reserve, color: "#858e98" }];

  return (
    <section className="not-prose overflow-hidden rounded-sm border border-line-strong bg-surface p-1 shadow-[var(--shadow-card)]" aria-label="Comparador de capacidad y ancho de banda">
      <header className="border-b border-line px-5 py-5">
        <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-teal">iAguide / Instrumento de cálculo · 06</p>
        <h3 className="font-display text-2xl text-ink">Caber y alimentar al procesador</h3>
        <p className="mt-2 max-w-2xl text-sm text-muted">Elige una carga. Compara su ocupación y el tiempo mínimo teórico de una lectura de pesos.</p>
      </header>
      <div className="flex flex-wrap items-center gap-5 border-b border-line bg-paper px-5 py-4">
        <Knob label="Parámetros" value={params} min={1} max={120} onChange={setParams} format={n => `${n} mil M`} />
        <Switcher ariaLabel="Precisión de pesos" value={String(bits)} onChange={v => setBits(Number(v))} options={[4, 8, 16].map(n => ({ value: String(n), label: `${n} bits` }))} />
        <Knob label="Caché KV" value={kv} min={0} max={32} onChange={setKv} format={n => `${n} GB`} />
        <Knob label="Reserva" value={reserve} min={0} max={32} onChange={setReserve} format={n => `${n} GB`} />
      </div>
      <div className="grid gap-px border-b border-line bg-line sm:grid-cols-4">
        {[...segments, {name: "Total solicitado", value: total, color: "var(--ink)"}].map(item => <div key={item.name} className="bg-surface px-5 py-4"><p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted">{item.name}</p><output className="mt-1 block font-display text-2xl tabular-nums" style={{color: item.color}}>{fmt(item.value)} <span className="text-sm">GB</span></output></div>)}
      </div>
      <div className="bg-paper px-4 py-5 md:px-6">
        <div className="mb-3 flex justify-between gap-3 font-mono text-[0.6rem] uppercase tracking-widest text-muted"><span>01 / Ocupación de memoria</span><span>Escala común · 0–128 GB</span></div>
        <div className="space-y-4">
          {MACHINES.map(machine => {
            const fits = total <= machine.capacity;
            let offset = 0;
            return <article key={machine.name} className="border border-line-strong bg-surface p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><h4 className="text-sm font-semibold text-ink">{machine.name}</h4><p className="mt-1 font-mono text-[0.58rem] text-muted">{machine.chip}</p></div><span className={`font-mono text-xs ${fits ? "text-teal" : "text-rose"}`}>{fits ? `${fmt(machine.capacity - total)} GB de margen` : `Exceso: ${fmt(total - machine.capacity)} GB`}</span></div>
              <svg viewBox="0 0 640 60" className="block w-full" role="img" aria-label={`${machine.name}: ${fmt(total)} GB solicitados de ${machine.capacity} GB; ${fits ? "cabe en el presupuesto" : "no cabe en el presupuesto"}`}>
                <rect x="0" y="8" width="640" height="26" fill="var(--paper)" />
                {Array.from({length: 17}, (_, i) => <line key={i} x1={i * 40} x2={i * 40} y1="6" y2="37" stroke="var(--line)" strokeWidth="0.8" />)}
                {segments.map(segment => { const start = offset; offset += segment.value; const visible = Math.max(0, Math.min(segment.value, machine.capacity - start)); return <rect key={segment.name} x={Math.min(start, 128) * 5} y="10" width={visible * 5} height="22" fill={segment.color} />; })}
                <rect x="0.5" y="8" width={machine.capacity * 5 - 1} height="26" fill="none" stroke={machine.color} strokeWidth="1.5" />
                <line x1={machine.capacity * 5 - 1} x2={machine.capacity * 5 - 1} y1="3" y2="40" stroke={fits ? machine.color : "#b55050"} strokeWidth="2" />
                <text x="1" y="54" fontSize="10" fill="var(--muted)">0</text><text x={machine.capacity * 5 - 2} y="54" textAnchor="end" fontSize="10" fill="var(--ink)">{machine.capacity} GB</text>
              </svg>
            </article>;
          })}
        </div>
        <div className="mb-4 mt-7 flex flex-wrap justify-between gap-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted"><span>02 / Caudal de memoria publicado</span><span>Anchura proporcional · GB/s</span></div>
        <div className="space-y-5">
          {MACHINES.map(machine => <div key={machine.name}>
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs"><span className="font-semibold text-ink">{machine.name}</span><span className="font-mono text-muted">{fmt(machine.bandwidth)} GB/s</span></div>
            <div className="h-3 w-full border border-line bg-surface"><div className="h-full" style={{width: `${machine.bandwidth / 1792 * 100}%`, background: machine.color}} /></div>
            <p className="mt-2 text-xs text-ink-soft">Lectura ideal de {fmt(weights)} GB: <strong className="tabular-nums">{fmt(weights / machine.bandwidth * 1000)} ms</strong>{total > machine.capacity ? " · La carga no cabe: este cálculo no simula la descarga a RAM." : " · Solo lectura; falta el trabajo del modelo."}</p>
          </div>)}
        </div>
      </div>
      <footer className="space-y-3 border-t border-line px-5 py-4 text-xs leading-relaxed text-muted">
        <p><strong className="text-ink">Cómo se calcula.</strong> Pesos = parámetros × bits / 8. Lectura ideal = GB de pesos / GB por segundo. GB y GB/s son decimales. La cuantización real añade escalas y metadatos. La reserva es un supuesto editable para sistema, motor y temporales; no es una medición idéntica de ambos equipos.</p>
        <p><strong className="text-ink">No es un benchmark.</strong> El caudal máximo no garantiza velocidad de generación. Este límite omite cómputo, atención sobre la KV, sincronización, cachés y eficiencia del motor. En Apple, CPU, GPU y sistema comparten capacidad y tráfico. La VRAM de NVIDIA es un dominio separado de la RAM del equipo.</p>
        <p>Configuraciones concretas de referencia; otros chips Max tienen cifras distintas. Fuentes: {MACHINES.map((machine, i) => <span key={machine.name}>{i > 0 ? " · " : ""}<a className="underline decoration-line-strong underline-offset-2 hover:text-teal" href={machine.source} target="_blank" rel="noreferrer">{machine.name}</a></span>)}.</p>
      </footer>
    </section>
  );
}
