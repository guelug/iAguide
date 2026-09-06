"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { Color, InstancedMesh, Object3D } from "three";
import { Figure } from "@/components/three/Figure";
import { Stage } from "@/components/three/Stage";
import { Flow, Tag, Wire } from "@/components/three/atoms";
import { P } from "@/lib/palette";

const LAYERS = 8;
const KV_HEADS = 2;
const HEAD_DIM = 4;
const BYTES = 2;
const CAPACITY = 16;
const INITIAL = 8;
const bytesPerToken = LAYERS * KV_HEADS * HEAD_DIM * 2 * BYTES;
const format = (n: number) => new Intl.NumberFormat("es-ES").format(n);

export default function Visual() {
  const [tokens, setTokens] = useState(INITIAL);
  const [separation, setSeparation] = useState(35);
  const [read, setRead] = useState(true);
  const used = tokens * bytesPerToken;
  return <Figure label="Caché KV · anatomía de una memoria" hint="8 capas / 2 cabezas KV / FP16" height="h-[520px] md:h-[620px]"
    legend={[{color:P.teal,label:"Claves K"},{color:P.amber,label:"Valores V"},{color:P.violet,label:"Última escritura"}]}
    controls={<><button type="button" className="chip" onClick={()=>setTokens(INITIAL)}>Repetir prefill</button><button type="button" className="chip" disabled={tokens===CAPACITY} onClick={()=>setTokens(n=>Math.min(CAPACITY,n+1))}>Generar un token +</button></>}
    note={<div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 border-b border-line pb-4">{[["Tokens almacenados",format(tokens)],["Caché ocupada",`${format(used)} B`],["Por token nuevo",`${bytesPerToken} B`]].map(([label,value])=><div key={label}><span className="block text-xs text-muted">{label}</span><strong className="mt-1 block font-display text-2xl text-ink">{value}</strong></div>)}</div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs">Separar capas <output className="float-right font-mono">{separation}%</output><input className="mt-2 block w-full accent-teal" type="range" min={0} max={100} value={separation} onChange={e=>setSeparation(Number(e.target.value))}/></label><button type="button" className="rounded border border-line px-3 py-2 text-left text-xs" aria-pressed={read} onClick={()=>setRead(!read)}>{read?"Lectura: todo el contexto":"Escritura: solo el token nuevo"} ↔</button></div>
      <p>{tokens===INITIAL?"El prefill calcula y guarda K y V para los ocho tokens iniciales en cada capa.":`Después de ${tokens-INITIAL} ${tokens-INITIAL===1?"paso":"pasos"} de decode hay ${tokens} tokens. Cada paso añade una nueva pareja K/V por cabeza y capa; las anteriores se reutilizan.`} {read?"La atención consulta el historial completo, aunque solo escriba un token nuevo.":"El violeta señala la última columna escrita. No se recalculan las claves y valores antiguos."}</p>
      <p className="rounded border border-line bg-paper p-3 font-mono text-xs leading-relaxed">Caché = tokens × 8 capas × 2 cabezas KV × 4 dimensiones × 2 (K y V) × 2 bytes = {format(used)} bytes.</p>
      <p className="text-xs text-muted">Maqueta conceptual, batch 1. Estas bandejas representan tensores; no son tarjetas físicas de una GPU. Dimensiones reducidas para poder contar todas las celdas. No incluye pesos, activaciones ni reservas del runtime.</p>
    </div>}>
    <Stage className="h-full w-full" camera={{position:[8,6,11],fov:35}} fit={1.14}><Cache tokens={tokens} gap={0.26+separation*0.009} read={read}/></Stage>
  </Figure>;
}

function Cache({tokens,gap,read}: {tokens:number;gap:number;read:boolean}) {
  const cells = useRef<InstancedMesh>(null);
  useLayoutEffect(()=>{
    if(!cells.current) return;
    const transform=new Object3D();
    const color=new Color();
    let index=0;
    for(let layer=0;layer<LAYERS;layer++) for(let token=0;token<CAPACITY;token++) for(let kind=0;kind<2;kind++) {
      transform.position.set((token-7.5)*0.34,layer*gap+0.1,kind===0?-0.36:0.36);
      transform.scale.set(0.27,token<tokens?0.15:0.035,0.5);
      transform.updateMatrix(); cells.current.setMatrixAt(index,transform.matrix);
      color.set(token>=tokens?"#D8DED9":!read&&token===tokens-1?P.violet:kind===0?P.teal:P.amber);
      if(!read&&token<tokens-1) color.lerp(new Color("#D8DED9"),0.65);
      cells.current.setColorAt(index++,color);
    }
    cells.current.instanceMatrix.needsUpdate=true;
    if(cells.current.instanceColor) cells.current.instanceColor.needsUpdate=true;
    cells.current.computeBoundingSphere();
  },[tokens,gap,read]);
  return <group position={[0,-LAYERS*gap/2,0]}>
    <instancedMesh ref={cells} args={[undefined,undefined,LAYERS*CAPACITY*2]} castShadow receiveShadow><boxGeometry/><meshStandardMaterial roughness={0.3} metalness={0.24}/></instancedMesh>
    {Array.from({length:LAYERS},(_,layer)=><group key={layer} position={[0,layer*gap,0]}>
      <RoundedBox args={[6,0.11,1.7]} radius={0.055} smoothness={2} receiveShadow castShadow><meshStandardMaterial color="#EBE8DC" roughness={0.42} metalness={0.16}/></RoundedBox>
      <mesh position={[0,-0.055,0]} castShadow><boxGeometry args={[5.8,0.09,1.48]}/><meshStandardMaterial color="#244E4B" roughness={0.46} metalness={0.25}/></mesh>
      {[-2.85,2.85].flatMap(x=>[-0.64,0.64].map(z=><mesh key={`${x}:${z}`} position={[x,0.08,z]} castShadow><cylinderGeometry args={[0.055,0.055,0.045,8]}/><meshStandardMaterial color="#A1A6A4" metalness={0.8} roughness={0.27}/></mesh>))}
      <Wire points={[[-2.75,0.085,0],[2.75,0.085,0]]} color="#C4AB6B" width={1}/>
      <mesh position={[3.08,0,0]}><boxGeometry args={[0.18,0.16,0.92]}/><meshStandardMaterial color="#B6914B" metalness={0.7} roughness={0.3}/></mesh>
    </group>)}
    {[-2.85,2.85].flatMap(x=>[-0.64,0.64].map(z=><mesh key={`${x}:${z}`} position={[x,(LAYERS-1)*gap/2-0.07,z]} castShadow><cylinderGeometry args={[0.024,0.024,(LAYERS-1)*gap+0.38,10]}/><meshStandardMaterial color="#828981" metalness={0.7} roughness={0.3}/></mesh>))}
    <RoundedBox args={[6.5,0.25,2.1]} position={[0,-0.4,0]} radius={0.09} smoothness={3} castShadow receiveShadow><meshStandardMaterial color="#263532" roughness={0.38} metalness={0.35}/></RoundedBox>
    <Tag position={[-2.8,(LAYERS-1)*gap+0.7,0]} center tone="muted" size="xs">8 capas</Tag>
    <Tag position={[0,(LAYERS-1)*gap+0.7,-0.45]} center tone="teal">K</Tag>
    <Tag position={[2.5,(LAYERS-1)*gap+0.7,0.45]} center tone="amber">V</Tag>
    <Tag position={[0,-0.9,0.9]} center tone="muted" size="xs">{tokens} / 16 posiciones</Tag>
    {read&&[0,LAYERS-1].map(layer=><Flow key={layer} points={[[3.4,layer*gap+0.12,0],[2.6,layer*gap+0.3,0],[-2.6,layer*gap+0.3,0]]} color={P.teal} count={5} size={0.035} speed={0.3} lineOpacity={0.12}/>)}
  </group>;
}
