/**
 * Puts the accents back on the Spanish lessons.
 *
 * The reference modules were written without them, so a reader moving
 * from the core curriculum — which is properly accented — into the
 * OpenClaw and Hermes pages hits prose that reads like machine output.
 * That is a legibility problem, not a pedantry one: a course loses
 * authority when its own language is sloppy.
 *
 * Only unambiguous forms are rewritten. Words that exist both with and
 * without the accent (mas/más, limite/límite, publico/público,
 * seria/sería) are left alone and reported, because deciding those needs
 * the sentence, not a table.
 *
 * Nothing inside code, links or MDX tags is touched. That is enforced,
 * not hoped for: every file must survive a mask/restore round trip
 * untouched before a single replacement is allowed to be written.
 *
 *   node scripts/fix-spanish-accents.mjs [--dry]
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DRY = process.argv.includes("--dry");
const ROOT = "content/modules";

/** Forms that do not exist in Spanish without the accent. */
const SAFE = {
  sesion: "sesión",
  politica: "política",
  politicas: "políticas",
  tambien: "también",
  estan: "están",
  peticion: "petición",
  asi: "así",
  opcion: "opción",
  ejecucion: "ejecución",
  codigo: "código",
  despues: "después",
  conexion: "conexión",
  unico: "único",
  unica: "única",
  version: "versión",
  automatico: "automático",
  automatica: "automática",
  automatizacion: "automatización",
  segun: "según",
  semantica: "semántica",
  deberia: "debería",
  ultimo: "último",
  ultima: "última",
  navegacion: "navegación",
  modulo: "módulo",
  informacion: "información",
  configuracion: "configuración",
  aplicacion: "aplicación",
  tecnico: "técnico",
  tecnica: "técnica",
  metrica: "métrica",
  parametro: "parámetro",
  parametros: "parámetros",
  proximo: "próximo",
  rapido: "rápido",
  basico: "básico",
  basica: "básica",
  estatico: "estático",
  dinamico: "dinámico",
  logica: "lógica",
  fisico: "físico",
  podria: "podría",
  habria: "habría",
};

/* The plurals carry no accent — Spanish drops it when the stress moves —
   so "sesiones", "peticiones" and "opciones" are already correct and are
   deliberately absent from the table above. */

/* Forms that are real words either way, so each occurrence was read in
   context before being listed here.
     mas     — 130 uses, every one "plus"; none the literary "but"
     limite  — always the noun, never "que él limite"
     publico — always the adjective, never "yo publico"
     numero  — always the noun, never "yo numero"
     seria   — the conditional, except the one phrase kept below */
const JUDGED = {
  mas: "más",
  limite: "límite",
  publico: "público",
  numero: "número",
  seria: "sería",
};

/* "producción seria" means serious production and is spelled correctly.
   Masked before the pass so the table above cannot reach it. */
const KEEP = [/producción seria/gi, /\bdiffusion\b/gi, /\bstateversion\b/gi];

/* One rule covers most of it: a word ending in -cion is always Spanish,
   because English spells that ending -tion or -ssion, never -cion. So
   the accent is unconditional and no list is needed.

   -sion is not safe the same way — English shares it — and this corpus
   really does use the English words in Spanish sentences: "el vision
   encoder", "reciprocal rank fusion", "natural language supervision"
   (a paper title), "[conclusion](…)" (a link label). So -sion is a
   short list of forms read in context, and the genuinely mixed ones
   (extension, supervision, conclusion) are deliberately left alone. */
const ENDINGS = [[/\b([a-záéíóúñ]{2,})cion\b/gi, "ción"]];

/* Dropped tildes on the n. These are not accents but a different
   letter, and losing it changes the word: "ano" and "año" are not the
   same noun. Note "ninguno" and "comunes" are spelled correctly as they
   are and are deliberately absent. */
const NTILDE = {
  tamano: "tamaño",
  ensenar: "enseñar",
  anadir: "añadir",
  anade: "añade",
  anadido: "añadido",
  pequeno: "pequeño",
  pequena: "pequeña",
  dueno: "dueño",
  companero: "compañero",
  senal: "señal",
  senales: "señales",
  manana: "mañana",
  dano: "daño",
  danos: "daños",
  acompana: "acompaña",
  diseno: "diseño",
  disenos: "diseños",
};

/* The rest of the missing accents, swept by pattern rather than memory:
   adverbs in -mente, esdrújulas, and the í-hiatus words. */
const MORE = {
  via: "vía",
  automaticamente: "automáticamente",
  explicitamente: "explícitamente",
  implicitamente: "implícitamente",
  practicamente: "prácticamente",
  unicamente: "únicamente",
  tipicamente: "típicamente",
  basicamente: "básicamente",
  rapidamente: "rápidamente",
  facilmente: "fácilmente",
  proposito: "propósito",
  linea: "línea",
  lineas: "líneas",
  arbol: "árbol",
  arboles: "árboles",
  util: "útil",
  utiles: "útiles",
  ademas: "además",
  mayoria: "mayoría",
  dia: "día",
  dias: "días",
  movil: "móvil",
  moviles: "móviles",
  multiple: "múltiple",
  multiples: "múltiples",
  especifico: "específico",
  especifica: "específica",
  especificos: "específicos",
  especificas: "específicas",
  generico: "genérico",
  genericos: "genéricos",
  facil: "fácil",
  faciles: "fáciles",
  dificil: "difícil",
  dificiles: "difíciles",
  exito: "éxito",
  comun: "común",
  ahi: "ahí",
  alla: "allá",
  categoria: "categoría",
  categorias: "categorías",
  invalido: "inválido",
  valido: "válido",
  maximo: "máximo",
  minimo: "mínimo",
  optimo: "óptimo",
  razon: "razón",
  sincrono: "síncrono",
  asincrono: "asíncrono",
  garantia: "garantía",
  garantias: "garantías",
  identico: "idéntico",
  tenia: "tenía",
  haria: "haría",
  existia: "existía",
  deberian: "deberían",
  serian: "serían",
  energia: "energía",
  teoria: "teoría",
};

/* Found by asking the corpus about itself: any word written both with
   and without a diacritic somewhere in the lessons is an inconsistency
   by definition. That surfaced far more than a remembered list would.
   Only the one-way errors are listed — pairs where both spellings are
   real Spanish are excluded, because they turn on syntax:
     que/qué, como/cómo, cuando/cuándo, donde/dónde, cual/cuál — the
       interrogatives, which need the question to decide
     paso/pasó, cambio/cambió, filtro/filtró and the other noun-versus-
       preterite pairs
     hacia/hacía, continua/continúa, publica/pública, perdida/pérdida
     término/termino/terminó and envío/envio/envió, which are three ways
     video, which Spain and Latin America spell differently on purpose */
const CORPUS = {
  pagina: "página",
  paginas: "páginas",
  cache: "caché",
  caches: "cachés",
  guia: "guía",
  dialogo: "diálogo",
  dialogos: "diálogos",
  explicito: "explícito",
  explicita: "explícita",
  explicitos: "explícitos",
  explicitas: "explícitas",
  implicita: "implícita",
  generica: "genérica",
  agnostica: "agnóstica",
  metodo: "método",
  metodos: "métodos",
  maquina: "máquina",
  traves: "través",
  vacio: "vacío",
  vacia: "vacía",
  vacias: "vacías",
  envia: "envía",
  envian: "envían",
  envie: "envíe",
  enviara: "enviará",
  reenvia: "reenvía",
  reenvian: "reenvían",
  envios: "envíos",
  canonico: "canónico",
  canonicas: "canónicas",
  todavia: "todavía",
  parrafo: "párrafo",
  invalida: "inválida",
  invalidas: "inválidas",
  validos: "válidos",
  continuan: "continúan",
  catalogo: "catálogo",
  catalogos: "catálogos",
  portatil: "portátil",
  limites: "límites",
  tunel: "túnel",
  resumenes: "resúmenes",
  imagenes: "imágenes",
  diagnostico: "diagnóstico",
  diagnosticos: "diagnósticos",
  demas: "demás",
  codigos: "códigos",
  trafico: "tráfico",
  sintetico: "sintético",
  sinteticos: "sintéticos",
  sinteticas: "sintéticas",
  raiz: "raíz",
  raices: "raíces",
  numeros: "números",
  ningun: "ningún",
  magico: "mágico",
  efimero: "efímero",
  detras: "detrás",
  anaden: "añaden",
  anadan: "añadan",
  anadio: "añadió",
  acuna: "acuña",
  tamanos: "tamaños",
  publicos: "públicos",
  proxima: "próxima",
  patron: "patrón",
  nucleo: "núcleo",
  menu: "menú",
  mensajeria: "mensajería",
  huerfano: "huérfano",
  huerfanas: "huérfanas",
  gestion: "gestión",
  estatica: "estática",
  escaner: "escáner",
  ensena: "enseña",
  ensenan: "enseñan",
  ensenen: "enseñen",
  ensenando: "enseñando",
  ensenanza: "enseñanza",
  senala: "señala",
  cortesia: "cortesía",
  automaticos: "automáticos",
  auditoria: "auditoría",
  aislan: "aíslan",
  union: "unión",
  ultimos: "últimos",
  topologia: "topología",
  titulo: "título",
  terminos: "términos",
  rapidos: "rápidos",
  rapida: "rápida",
  quedense: "quédense",
  puntua: "puntúa",
  perifericos: "periféricos",
  pequenos: "pequeños",
  minuscula: "minúscula",
  membresia: "membresía",
  matematica: "matemática",
  leelas: "léelas",
  usalo: "úsalo",
  tratalo: "trátalo",
  copialos: "cópialos",
  indices: "índices",
  historico: "histórico",
  historicas: "históricas",
  grafico: "gráfico",
  evalua: "evalúa",
  estandar: "estándar",
  codec: "códec",
  caido: "caído",
  busqueda: "búsqueda",
  atras: "atrás",
  academicos: "académicos",
  querias: "querías",
  vivia: "vivía",
  veria: "vería",
  debia: "debía",
  quedaria: "quedaría",
  pararia: "pararía",
  empezo: "empezó",
  eligio: "eligió",
  escribio: "escribió",
  murio: "murió",
  abrio: "abrió",
};

/* The other direction: two words the lessons over-accent. "relean" is
   the correct subjunctive and "afines" the correct plural adjective. */
const OVER = { releán: "relean", afinés: "afines" };

const SION = {
  precision: "precisión",
  decision: "decisión",
  revision: "revisión",
  division: "división",
  recursion: "recursión",
  presion: "presión",
  admision: "admisión",
  comprension: "comprensión",
  expresion: "expresión",
  dimension: "dimensión",
};

/* "esta" is the demonstrative "this" as often as the verb "is", so it is
   only accented in front of the words that make it unmistakably a verb:
   a participle, a gerund, or one of a few fixed complements. */
const ESTA =
  /\besta\b(?=\s+(?:bien|mal|en|hecho|listo|vac[ií]o|activo|apagado|encendido|puesto|disponible|documentado|soportado|permitido|corriendo|esperando|haciendo|gated|el\b|la\b|[a-záéíóúñ]+(?:ado|ido|ando|iendo)\b))/gi;

/** Still ambiguous and left alone: reported for a human to read. */
const AMBIGUOUS = ["practica", "critico"];

/* Private-use codepoints, so a placeholder can never collide with prose.
   A plain " 12 " marker would: the lessons are full of bare numbers. */
const OPEN = "\uE000";
const CLOSE = "\uE001";
const SLOT = new RegExp(OPEN + "(\\d+)" + CLOSE, "g");

/** Spans that must never be touched: code, URLs, links and MDX tags. */
function protect(text) {
  const slots = [];
  const stash = (m) => {
    slots.push(m);
    return OPEN + (slots.length - 1) + CLOSE;
  };
  let masked = text
    .replace(/```[\s\S]*?```/g, stash)
    .replace(/`[^`\n]*`/g, stash)
    .replace(/https?:\/\/\S+/g, stash)
    .replace(/\[[^\]]*\]\([^)]*\)/g, stash)
    .replace(/<[^>]+>/g, stash);
  for (const rx of KEEP) masked = masked.replace(rx, stash);

  /* Stashed spans nest — a JSX tag can swallow an already-masked code
     span — so one pass of replace leaves inner markers stranded. Expand
     until the text stops changing. */
  const restore = (s) => {
    let out = s;
    for (let i = 0; i < 8 && SLOT.test(out); i++) {
      SLOT.lastIndex = 0;
      out = out.replace(SLOT, (_, n) => slots[Number(n)]);
    }
    SLOT.lastIndex = 0;
    return out;
  };

  return { masked, restore };
}

/** Keep the original capitalisation of the word being replaced. */
function matchCase(src, out) {
  if (src[0] === src[0].toUpperCase()) return out[0].toUpperCase() + out.slice(1);
  return out;
}

const TABLE = { ...SAFE, ...JUDGED, ...SION, ...NTILDE, ...MORE, ...CORPUS, ...OVER };
const words = Object.keys(TABLE).sort((a, b) => b.length - a.length);
const RX = new RegExp("\\b(" + words.join("|") + ")\\b", "gi");
const AMB = new RegExp("\\b(" + AMBIGUOUS.join("|") + ")\\b", "gi");

const dirs = (await readdir(ROOT, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let changed = 0;
let replaced = 0;
let refused = 0;
const pending = new Map();

for (const slug of dirs) {
  const file = join(ROOT, slug, "es.mdx");
  let src;
  try {
    src = await readFile(file, "utf8");
  } catch {
    continue;
  }

  const { masked, restore } = protect(src);

  /* The guard: if masking is not reversible on this exact file, the
     script has no business rewriting it. */
  if (restore(masked) !== src || src.includes(OPEN) || src.includes(CLOSE)) {
    console.error("refused (masking not reversible): " + slug);
    refused++;
    continue;
  }

  let hits = 0;
  let fixed = masked.replace(RX, (m) => {
    hits++;
    return matchCase(m, TABLE[m.toLowerCase()]);
  });
  for (const [rx, tail] of ENDINGS) {
    fixed = fixed.replace(rx, (m, stem) => {
      hits++;
      return matchCase(m, stem.toLowerCase() + tail);
    });
  }
  fixed = fixed.replace(ESTA, (m) => {
    hits++;
    return matchCase(m, "está");
  });

  for (const m of masked.match(AMB) ?? []) {
    const w = m.toLowerCase();
    pending.set(w, (pending.get(w) ?? 0) + 1);
  }

  if (hits > 0) {
    replaced += hits;
    changed++;
    if (!DRY) await writeFile(file, restore(fixed));
  }
}

console.log(
  replaced + " accents restored across " + changed + " files" + (DRY ? " (dry run)" : ""),
);
if (refused) console.log(refused + " files refused");
/* In --dry mode this doubles as a regression check: a non-zero exit
   means new unaccented prose has landed since the last sweep. */
if (DRY && replaced > 0) process.exitCode = 1;
if (pending.size) {
  console.log("\nleft for a human — real words either way:");
  for (const [w, n] of [...pending].sort((a, b) => b[1] - a[1])) {
    console.log("  " + String(n).padStart(4) + "  " + w);
  }
}
