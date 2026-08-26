# Second-pass prompt (paste this to another agent)

You are reviewing and extending Pedro Caparrós's public course **iAguide** (https://github.com/guelug/iAguide, local `/Users/guelug/CascadeProyects/iAguide`). Read `docs/SOURCES.md` in the pack (or this prompt) before editing. Four tracks only. Light classroom. Content only.

## Job

1. Confirm every source below is actually taught in a lesson (not a one-line mention). If a lesson is under ~180 lines of EN teaching, expand it from the **official** page, with notes, myths, cases, and recipes. Matching ES.
2. Do not replace Pedro's course map with Hugging Face's. Fold HF into existing slugs.
3. New material already drafted (may not be on GitHub `main` yet): Kimi KDA, AttnRes (APA), AttnRes systems, Kimi Linear serve, Unsloth, Unsloth Qwen3.8 train, Unsloth Qwen3.8 run. Review those for accuracy against the papers/docs. Do not shrink them.
4. Hugging Face Agents Course, Hermes developer guide, and OpenClaw docs must get the **same depth** as those Unsloth/Kimi lessons. Current `dummy-agent` and `openclaw-gateway` on `main` are recaps. That is the bug.

## Sources (fetch, do not invent)

Hugging Face: https://huggingface.co/learn/agents-course and https://github.com/huggingface/agents-course (Apache-2.0, Burtenshaw / Thomas / Simonini / Paniego).

Hermes: https://hermes-agent.nousresearch.com (full developer guide).

OpenClaw: https://docs.openclaw.ai/concepts/architecture and the rest of docs.openclaw.ai.

Kimi Linear: https://arxiv.org/abs/2510.26692 PDF `docs/papers/kimi-linear-2510.26692.pdf`. Serve: `vllm serve moonshotai/Kimi-Linear-48B-A3B-Instruct --port 8000 --tensor-parallel-size 4 --max-model-len 1048576 --trust-remote-code`. No llama.cpp/GGUF/MLX for KDA.

Attention Residuals: https://arxiv.org/abs/2603.15031 PDF `docs/papers/kimi-attention-residuals-2603.15031.pdf` (Pedro's file) and the arXiv copy. Authors: Kimi Team; equal contribution Guangyu Chen, Yu Zhang, Jianlin Su. Code https://github.com/MoonshotAI/Attention-Residuals. APA in-text. Systems lesson must explain pipeline cache, two-phase online softmax, I/O table.

Unsloth: https://unsloth.ai/docs/models/qwen3.8/train plus https://unsloth.ai/docs/models/qwen3.8, notebooks index, fine-tuning guide, requirements, GGUF save, RL guide. Qwen3.8-27B free SFT is **Kaggle**, not Colab. GGUF is inference-only.

## Done when

- A table of slug → EN line count → official URL, with nothing important still under 180 lines unless it is a true stub marked `wip`.
- README NOTICE lists HF (Apache), Kimi APA, Unsloth docs.
- `index.ts` registers every new slug.
- No invented APIs. No fifth track. No UI theme fight.

Start by reading `docs/SOURCES.md` and sampling `dummy-agent/en.mdx` vs `unsloth-qwen38/en.mdx` so you feel the bar.

Also review oauth-and-keys, quotas-and-pricing, image-models, comfyui-first-workflow, civitai-loras against the official Hermes/OpenClaw/ComfyUI/CivitAI URLs in SOURCES.md.

## Academic credit (mandatory)

100% académico. Every section names who wrote the source. Papers in APA. Docs as Org. (date). *Title*. URL. Credit Hugging Face Agents Course authors (Burtenshaw, Thomas, Simonini, Paniego), Unsloth, Comfy-Org, CivitAI article authors, Nous Research, OpenClaw. End each lesson with Fuentes/Sources. Tips must be traceable to those pages. New Hub tutorials: huggingface-hub, huggingface-inference.


## Note — five extra slugs drafted 2026-08-26 (oauth / quotas / image / Comfy / LoRA)

1. Review `oauth-and-keys`, `quotas-and-pricing`, `image-models`, `comfyui-first-workflow`, `civitai-loras` under `/workspace/iaguide-pack/` against the official URLs in `docs/SOURCES.md` (Hermes providers + credential pools, OpenClaw oauth + authentication + failover, HF Inference Providers pricing, Comfy-Org models / first generation / LoRA, CivitAI article 22492).
2. Confirm EN and ES each stay ≥ 200 lines, end in Fuentes/Sources, and keep VisualSlot / TryThis / Case / Callout / Myth or Compare. Do not shrink.
3. Do not invent OpenAI or Anthropic $/MTok. Hermes subscription table is copied as documented (including "not currently documented" cells). HF Free credit is 0.10 USD/month, subject to change, fetched from HF pricing.
4. Claude Pro has no Hermes OAuth path; Max extra credits only; Gemini consumer plan has no documented OAuth. OpenClaw always-on gateway prefers API key on the gateway host. Token sink ≠ gateway password.
5. ComfyUI does not ship SDXL; official first generation default is SD 1.5 `v1-5-pruned-emaonly-fp16.safetensors`. Attribute CivitAI 22492 (20/7/euler + ASCII) and Comfy-Org (`R`, Ctrl+Enter, paths) separately.
6. LoRA = Hu et al. 2022 adapter on a frozen base (same idea as Unsloth); Load LoRA between Checkpoint and KSampler; SD1.5 LoRA on SDXL looks like noise.
7. Register via `INDEX_SNIPPET_EXTRA.ts` (`RAW` + `VISUALS`). Four tracks only. No git from this pass. No globals.css / layout / palette / atoms / HeroStack.
8. Light Visuals only (`P.teal` / `P.amber` / `P.violet`, never `P.void`). Tips must remain traceable to a named URL or APA paper.
9. PKCE is RFC 7636; OAuth 2.0 is RFC 6749. Dual Claude Code + OpenClaw login can invalidate refresh tokens (OpenClaw token sink).
10. If a live fetch 404s, say so and keep the vendor URL; do not fill blanks with a blog's price table.
