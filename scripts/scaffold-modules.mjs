/**
 * One-shot scaffolder: writes meta.json for every module in the curriculum
 * and creates empty en/es lesson files where they do not exist yet.
 * Safe to re-run — it only overwrites meta.json, never lesson prose.
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "content", "modules");

/** [slug, order, track, minutes, prereqs, tags, titleEn, titleEs, sumEn, sumEs] */
const M = [
  ["orientation", 0, "foundations", 9, [], ["map", "outcomes"],
    "Orientation", "Orientación",
    "What this course is, how to read the map, and the four tracks you can walk.",
    "Qué es este curso, cómo leer el mapa y las cuatro pistas que puedes recorrer."],

  ["language-of-models", 1, "foundations", 16, ["orientation"], ["tokens", "sampling", "kv-cache"],
    "The language of models", "El idioma de los modelos",
    "Tokens, logits, sampling, prefill and decode — the vocabulary every other module assumes.",
    "Tokens, logits, muestreo, prefill y decode: el vocabulario que dan por sabido los demás módulos."],

  ["tokenization", 2, "foundations", 15, ["language-of-models"], ["bpe", "vocab", "unicode"],
    "Tokenization", "Tokenización",
    "Why 'strawberry' has three r's and the model cannot count them. BPE, vocabularies, and the bill you pay per language.",
    "Por qué «strawberry» tiene tres erres y el modelo no sabe contarlas. BPE, vocabularios y la factura que pagas por idioma."],

  ["attention", 3, "foundations", 22, ["tokenization"], ["transformer", "qkv", "rope", "gqa"],
    "Attention and the block", "La atención y el bloque",
    "Open the transformer. Q, K, V, heads, residual stream, MLP, norms, RoPE, GQA — drawn, not hand-waved.",
    "Abrimos el transformer. Q, K, V, cabezas, flujo residual, MLP, normalizaciones, RoPE, GQA — dibujado, no insinuado."],

  ["maths-you-need", 4, "foundations", 20, ["attention"], ["linear-algebra", "softmax", "gradients"],
    "The maths you actually need", "Las matemáticas que sí necesitas",
    "Dot products, matrices, softmax, log-likelihood, gradients. Enough to read a paper figure without lying to yourself.",
    "Productos escalares, matrices, softmax, log-verosimilitud, gradientes. Lo justo para leer una figura sin engañarte."],

  ["embeddings-and-retrieval", 5, "foundations", 20, ["maths-you-need"], ["rag", "vectors", "chunking"],
    "Embeddings and retrieval", "Embeddings y recuperación",
    "Vector space, cosine similarity, chunking, hybrid search, rerankers — and why naive RAG disappoints.",
    "Espacio vectorial, similitud coseno, troceado, búsqueda híbrida, rerankers — y por qué el RAG ingenuo decepciona."],

  ["the-harness", 6, "harness", 20, ["language-of-models"], ["agents", "tools", "threads"],
    "The harness", "El arnés",
    "The loop around the weights: profile, tools, threads, permissions, subagents, compaction. Swap the engine; the loop remains.",
    "El bucle alrededor de los pesos: perfil, herramientas, hilos, permisos, subagentes, compactación. Cambia el motor; el bucle sigue."],

  ["calls-cache-threads", 7, "harness", 18, ["the-harness"], ["api", "streaming", "cache"],
    "Calls, caches, threads", "Llamadas, cachés, hilos",
    "What actually leaves your machine on one turn, which of the four caches you just hit, and how a thread survives it.",
    "Qué sale realmente de tu máquina en un turno, cuál de las cuatro cachés acabas de tocar y cómo sobrevive un hilo."],

  ["context-engineering", 8, "harness", 22, ["calls-cache-threads"], ["prompting", "structured-output", "prefill"],
    "Context engineering", "Ingeniería de contexto",
    "Prompting as budget allocation: ordering, few-shot, structured output, prefill tricks, and cache-shaped prompts.",
    "El prompting como reparto de presupuesto: orden, few-shot, salida estructurada, trucos de prefill y prompts con forma de caché."],

  ["tools-and-mcp", 9, "harness", 20, ["the-harness"], ["mcp", "schemas", "sandbox"],
    "Tools and MCP", "Herramientas y MCP",
    "Designing a tool a model can actually use: schemas, errors, idempotence, sandboxes, and what MCP standardises.",
    "Diseñar una herramienta que un modelo sepa usar: esquemas, errores, idempotencia, sandboxes y qué estandariza MCP."],

  ["agent-patterns", 10, "harness", 22, ["tools-and-mcp"], ["subagents", "planning", "memory"],
    "Agent patterns", "Patrones de agente",
    "Orchestrators, subagents, plan-then-act, critics, durable memory — with the failure mode each one buys you.",
    "Orquestadores, subagentes, planificar-y-actuar, críticos, memoria durable — con el fallo que compra cada patrón."],

  ["evaluation", 11, "harness", 20, ["agent-patterns"], ["evals", "benchmarks", "llm-judge"],
    "Evaluation", "Evaluación",
    "How to read a benchmark without being fooled, and how to build the twenty-case eval that actually protects you.",
    "Cómo leer un benchmark sin tragártelo, y cómo montar el eval de veinte casos que de verdad te protege."],

  ["safety-and-injection", 12, "harness", 20, ["evaluation"], ["prompt-injection", "guardrails", "sandboxing"],
    "Safety and prompt injection", "Seguridad e inyección de prompts",
    "Untrusted text is not instructions. Injection, exfiltration, the lethal trifecta, and defences that survive contact.",
    "El texto no fiable no son instrucciones. Inyección, exfiltración, la tríada letal y defensas que aguantan el contacto."],

  ["training", 13, "training", 22, ["maths-you-need"], ["pretraining", "loss", "scaling"],
    "Training", "Entrenamiento",
    "Pretraining as compression: the loss curve, batches, learning rates, scaling laws, and what a checkpoint really is.",
    "El preentrenamiento como compresión: curva de pérdida, lotes, learning rate, leyes de escala y qué es un checkpoint."],

  ["data", 14, "training", 18, ["training"], ["datasets", "dedup", "synthetic"],
    "Data", "Datos",
    "The part that decides quality: sourcing, dedup, filtering, contamination, synthetic data, licences.",
    "La parte que decide la calidad: fuentes, deduplicación, filtrado, contaminación, datos sintéticos, licencias."],

  ["distributed-training", 15, "training", 20, ["training"], ["fsdp", "tensor-parallel", "zero"],
    "Distributed training", "Entrenamiento distribuido",
    "Why one GPU is never enough: data, tensor, pipeline and expert parallelism, ZeRO/FSDP, and the interconnect wall.",
    "Por qué una GPU nunca basta: paralelismo de datos, tensor, pipeline y expertos, ZeRO/FSDP y el muro del interconector."],

  ["reinforcement-learning", 16, "training", 24, ["training"], ["rlhf", "dpo", "grpo"],
    "Reinforcement learning", "Aprendizaje por refuerzo",
    "From a base model to something you want to talk to: reward models, PPO, DPO, GRPO, RLVR, and reward hacking.",
    "De un modelo base a algo con lo que quieras hablar: modelos de recompensa, PPO, DPO, GRPO, RLVR y el hackeo de la recompensa."],

  ["fine-tuning", 17, "training", 22, ["reinforcement-learning"], ["lora", "qlora", "datasets"],
    "Fine-tuning", "Fine-tuning",
    "LoRA, QLoRA, full fine-tune, and the honest decision tree that usually ends in 'do not fine-tune yet'.",
    "LoRA, QLoRA, fine-tune completo y el árbol de decisión honesto que casi siempre acaba en «aún no»."],

  ["mixture-of-experts", 18, "training", 16, ["attention"], ["moe", "routing", "active-params"],
    "Mixture of experts", "Mezcla de expertos",
    "Why a 400B model can run like a 30B one: routing, active parameters, load balancing, and what MoE costs you in VRAM.",
    "Por qué un modelo de 400B puede correr como uno de 30B: enrutado, parámetros activos, balanceo y qué te cuesta en VRAM."],

  ["multimodal", 19, "training", 22, ["attention"], ["vision", "diffusion", "audio"],
    "Beyond text", "Más allá del texto",
    "Vision encoders, latent diffusion, flow matching, speech and video — the same maths wearing different clothes.",
    "Codificadores de visión, difusión latente, flow matching, voz y vídeo: las mismas matemáticas con otra ropa."],

  ["model-zoo", 20, "metal", 18, ["language-of-models"], ["open-weights", "licences", "cards"],
    "The model zoo", "El zoo de modelos",
    "Reading a model card and a model name: base vs instruct, open weights vs open source, sizes, licences, versions.",
    "Leer una ficha y un nombre de modelo: base vs instruct, pesos abiertos vs código abierto, tamaños, licencias, versiones."],

  ["local-inference", 21, "metal", 20, ["model-zoo"], ["gguf", "runtimes", "servers"],
    "Local inference", "Inferencia local",
    "Runtimes, GGUF vs safetensors, context length vs memory, and the first hour with a model on your own machine.",
    "Runtimes, GGUF vs safetensors, contexto frente a memoria y la primera hora con un modelo en tu propia máquina."],

  ["quantization", 22, "metal", 20, ["local-inference"], ["gguf", "awq", "nf4"],
    "Quantization", "Cuantización",
    "Why we quantize, how to read Q4_K_M / GPTQ / AWQ / NF4 / MXFP4, and where quality actually goes.",
    "Por qué cuantizamos, cómo leer Q4_K_M / GPTQ / AWQ / NF4 / MXFP4 y por dónde se escapa la calidad."],

  ["memory-hardware", 23, "metal", 20, ["quantization"], ["vram", "unified", "bandwidth"],
    "Memory and hardware", "Memoria y hardware",
    "VRAM vs unified memory, bandwidth as the real speed limit, KV cache growth, and how to size a machine.",
    "VRAM frente a memoria unificada, el ancho de banda como límite real, el crecimiento de la caché KV y cómo dimensionar."],

  ["serving-and-throughput", 24, "metal", 20, ["memory-hardware"], ["batching", "vllm", "speculative"],
    "Serving and throughput", "Servir y rendimiento",
    "Continuous batching, paged attention, speculative decoding, and the difference between fast for you and cheap for everyone.",
    "Batching continuo, paged attention, decodificación especulativa y la diferencia entre rápido para ti y barato para todos."],

  ["cost-and-economics", 25, "metal", 16, ["serving-and-throughput"], ["pricing", "tco", "budget"],
    "Cost and economics", "Coste y economía",
    "Token arithmetic you can do in your head, cache economics, and the honest local-vs-API break-even.",
    "Aritmética de tokens que puedes hacer de cabeza, la economía de la caché y el punto de equilibrio honesto local vs API."],

  ["field-guide", 26, "metal", 18, ["cost-and-economics"], ["playbook", "recipes", "debugging"],
    "Field guide", "Guía de campo",
    "The whole course compressed into decisions: which model, which knob, which failure you are looking at.",
    "Todo el curso comprimido en decisiones: qué modelo, qué mando, qué fallo estás mirando."],
];

const exists = async (p) => access(p).then(() => true).catch(() => false);

for (const [slug, order, track, durationMin, prereqs, tags, tEn, tEs, sEn, sEs] of M) {
  const dir = join(ROOT, slug);
  await mkdir(dir, { recursive: true });

  const metaPath = join(dir, "meta.json");
  let status = "wip";
  if (await exists(metaPath)) {
    try {
      status = JSON.parse(await readFile(metaPath, "utf8")).status ?? "wip";
    } catch {}
  }
  for (const loc of ["en", "es"]) {
    const p = join(dir, `${loc}.mdx`);
    if (!(await exists(p))) {
      await writeFile(p, "");
      status = "wip";
    } else if ((await readFile(p, "utf8")).trim().length === 0) {
      status = "wip";
    }
  }

  const meta = {
    id: slug,
    order,
    slug,
    track,
    title: { en: tEn, es: tEs },
    summary: { en: sEn, es: sEs },
    status,
    prereqs,
    durationMin,
    tags,
  };
  await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n");
}

console.log(`scaffolded ${M.length} modules`);
