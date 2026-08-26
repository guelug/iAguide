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

## License

MIT. Copyright 2026 Pedro Caparros Torres / guelug and iAguide contributors.
