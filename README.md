# iAguide

Bilingual EN/ES visual course on how AI works in practice. Night classroom. MIT. Curriculum 2026 — it will go stale.

Remote later: github.com/guelug/iAguide

## Run

package.json scripts: dev, build, start, lint. Node 20+. Install with the Node package manager, then start the dev script. Open http://localhost:3000 (goes to /en or /es).

## Add a module

Registry: drop a folder. Create content/modules/12-your-slug/ with meta.json, en.mdx, es.mdx, optional Visual.tsx (client, default export). Import meta in content/modules/index.ts (RAW + FOLDERS). Register Visuals on VISUALS. Glossary in content/glossary.ts. wip = teaser on the map.

MDX components: Callout, TryThis, Myth, Term, VisualSlot.

## Disclaimer

No fake benchmarks. Trust current CLI help over outlines.


## NOTICE — Hugging Face Agents Course

Parts of this curriculum rewrite ideas from the [Hugging Face Agents Course](https://huggingface.co/learn/agents-course) by Burtenshaw, Thomas, Simonini, and Paniego, licensed [Apache-2.0](https://github.com/huggingface/agents-course/blob/main/LICENSE). We do not copy those pages verbatim; we fold them into iAguide’s four tracks (foundations, harness, training, metal) and classroom voice. Framework lessons (dummy agent, smolagents, LlamaIndex, LangGraph, agentic RAG) are *particularity* encodings of the general harness loop — not a fifth track. Each lesson that uses the material has a local attribution.


## NOTICE — Papers, Unsloth, Hub, ComfyUI

Kimi Linear / Kimi Delta Attention lessons rewrite *Kimi Linear: An expressive, efficient attention architecture* (Kimi Team, 2025, arXiv:2510.26692) for use and deploy, not recitation. Attention Residuals lessons cite Kimi Team (2026, arXiv:2603.15031); equal contribution Guangyu Chen, Yu Zhang, Jianlin Su. Code: https://github.com/MoonshotAI/Attention-Residuals. PDFs live in `docs/papers/`.

Unsloth lessons follow official Unsloth docs (https://unsloth.ai/docs, https://unsloth.ai/docs/models/qwen3.8/train). We do not invent Colab notebooks; Qwen3.8-27B SFT is the official Kaggle path.

Hugging Face Hub and Inference lessons follow Hub, `hf` CLI, tokens, and Inference Providers documentation. Agents Course particularities remain Apache-2.0 (Burtenshaw, Thomas, Simonini, Paniego).

ComfyUI / CivitAI lessons follow Comfy-Org docs (https://docs.comfy.org) and CivitAI article 22492. Image-model papers (Ho et al. 2020; Rombach et al. 2022; Hu et al. 2022 LoRA) are cited in-lesson.

Hermes particularities credit Nous Research (https://hermes-agent.nousresearch.com). OpenClaw particularities credit https://docs.openclaw.ai by named page. Every lesson ends with a Sources / Fuentes bibliography.

A source map for agents extending the course: `docs/SOURCES.md`.

## License

MIT. Copyright 2026 Pedro Caparros Torres / guelug and iAguide contributors.
