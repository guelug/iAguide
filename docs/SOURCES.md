# iAguide content sources (for any agent)

Canonical map of what Pedro asked to fold into [github.com/guelug/iAguide](https://github.com/guelug/iAguide). Local checkout: `/Users/guelug/CascadeProyects/iAguide`. Four tracks only (`foundations`, `harness`, `training`, `metal`). No fifth track. Light classroom UI. Do not invent llama.cpp/GGUF/MLX for KDA. Do not invent a Colab SFT notebook for Qwen3.8-27B (official path is Kaggle). Rewrite official docs in iAguide voice; do not paste notebooks or PDFs verbatim.

Quality bar (second pass, 2026-08-26): each EN `en.mdx` and matching `es.mdx` is real teaching, not a recap. Target **at least 180–220 lines** with `VisualSlot`, `TryThis`, named **Case**, `Callout`, `Myth` or `Compare` where it earns its keep, official links, and notes that add value. Dummy-agent on main is ~40 lines: that is the failure mode.

## What Pedro asked (this thread)

1. Expand iAguide so the **full Hugging Face Agents Course** has a real home inside Pedro's map (dummy agent, smolagents, LlamaIndex, LangGraph, agentic RAG, observability, GAIA, function-calling fine-tune, game-agent case). Keep the course map; do not replace it with HF's.
2. Absorb **Hermes Agent** developer-guide material (tools, gateway, plugins, platforms, skills, cron, browser, ACP, egress) as harness *particularities*.
3. Same for **OpenClaw** particularities (gateway, protocol, nodes, queue, runtime, workspace, sessions, pairing, Tailscale, sandbox, compaction, tools, cron, browser, ACP).
4. Add **Kimi Linear / Kimi Delta Attention** (arxiv 2510.26692) focused on how to use and deploy, not paper recitation.
5. Add **Attention Residuals** (arxiv 2603.15031, PDF attached by Pedro) academic APA, authors, and a separate lesson on **how it is optimized**.
6. Add the full **Unsloth Qwen3.8 train guide** (official docs + free Kaggle notebooks): what Unsloth is, how to train, how to run locally.
7. Same depth for **everything already said**, not only the last PDF.

## Papers (PDFs in this folder)

| File | Citation |
| --- | --- |
| `docs/papers/kimi-linear-2510.26692.pdf` | Kimi Team. (2025). *Kimi Linear: An expressive, efficient attention architecture* (arXiv:2510.26692). https://arxiv.org/abs/2510.26692 |
| `docs/papers/kimi-attention-residuals-2603.15031.pdf` | Pedro's copy of the AttnRes technical report |
| `docs/papers/kimi-attention-residuals-arxiv.pdf` | Kimi Team. (2026). *Attention residuals* (arXiv:2603.15031v1, 16 Mar 2026). https://arxiv.org/abs/2603.15031 Equal contribution: Guangyu Chen, Yu Zhang, Jianlin Su. Code: https://github.com/MoonshotAI/Attention-Residuals |

## Hugging Face Agents Course (Apache-2.0)

Course: https://huggingface.co/learn/agents-course  
Repo: https://github.com/huggingface/agents-course  
ToC: https://github.com/huggingface/agents-course/blob/main/units/en/_toctree.yml  
License: https://github.com/huggingface/agents-course/blob/main/LICENSE  
Authors: Burtenshaw, Thomas, Simonini, Paniego.

| HF unit | iAguide slug(s) |
| --- | --- |
| Unit 0 onboarding | `orientation` (do not clone HF onboarding) |
| Unit 1 agents, tools, dummy loop | `dummy-agent`, `the-harness`, `agent-loop`, `tools-runtime` |
| Unit 2.1 smolagents | `smolagents`, `smolagents-multi` |
| Unit 2.2 LlamaIndex | `llamaindex` |
| Unit 2.3 LangGraph | `langgraph` |
| Unit 3 agentic RAG | `agentic-rag` |
| Unit 4 / GAIA | `gaia`, `evaluation` |
| Bonus 1 function-calling FT | `function-calling-ft` |
| Bonus 2 observability | `observability` |
| Bonus 3 game agents | `game-agents` |

HF pages to fetch (not a closed list):

- https://huggingface.co/learn/agents-course/en/unit0/introduction
- https://huggingface.co/learn/agents-course/en/unit1/introduction
- https://huggingface.co/learn/agents-course/en/unit1/what-are-agents
- https://huggingface.co/learn/agents-course/unit2/introduction
- https://huggingface.co/learn/agents-course/unit2/smolagents/introduction
- https://huggingface.co/learn/agents-course/unit2/llama-index/introduction
- https://huggingface.co/learn/agents-course/unit2/langgraph/introduction
- https://huggingface.co/learn/agents-course/unit3/agentic-rag/introduction
- https://huggingface.co/learn/agents-course/unit4/introduction
- https://huggingface.co/learn/agents-course/bonus-unit1/introduction
- https://huggingface.co/learn/agents-course/bonus-unit2/introduction
- https://huggingface.co/learn/agents-course/bonus-unit3/introduction

## Hermes Agent (Nous Research)

Site: https://hermes-agent.nousresearch.com  
iAguide slugs: `hermes-ownership`, `hermes-aiagent`, `hermes-providers`, `hermes-loop`, `hermes-assembly`, `hermes-compression`, `hermes-sessions`, `hermes-gateway`, `hermes-tools`, `hermes-plugins`, `hermes-platforms`, `hermes-skills`, `hermes-cron`, `hermes-browser`, `hermes-acp`, `hermes-egress`. Coverage is the full developer guide, not the first eight pages. General harness layer stays generic (`agent-loop`, `prompt-assembly`, `tools-runtime`, `sessions`, `gateway`, `compression-caching`, `plugins-and-skills`, `scheduled-jobs`, `browser-tools`, `programmatic-access`).

## OpenClaw

Docs: https://docs.openclaw.ai/concepts/architecture  
iAguide slugs: `openclaw-gateway`, `openclaw-protocol`, `openclaw-nodes`, `openclaw-queue`, `openclaw-runtime`, `openclaw-workspace`, `openclaw-sessions`, `openclaw-reset`, `openclaw-pairing`, `openclaw-tailscale`, `openclaw-sandbox`, `openclaw-compaction`, `openclaw-tools`, `openclaw-cron`, `openclaw-browser`, `openclaw-acp`. Fetch the matching docs.openclaw.ai pages; do not invent protocol fields.

## Kimi Linear / AttnRes (already drafted on box, not yet on GitHub main)

Drafts: `/workspace/iaguide-pack/` and `/workspace/iaguide-kimi/`.

| slug | track | order | notes |
| --- | --- | --- | --- |
| `kimi-delta-attention` | foundations | 3.5 | sequence mixer, hybrid 3:1 KDA:MLA |
| `attention-residuals` | foundations | 3.6 | APA, authors, PreNorm dilution |
| `kimi-linear-serve` | metal | 24.5 | exact vLLM command, no GGUF invention |
| `attnres-optimize` | metal | 24.6 | pipeline cache, two-phase softmax, I/O table |

Checkpoints: https://huggingface.co/moonshotai/Kimi-Linear-48B-A3B-Instruct  
Kernels: https://github.com/fla-org/flash-linear-attention/tree/main/fla/ops/kda  
vLLM: `vllm serve moonshotai/Kimi-Linear-48B-A3B-Instruct --port 8000 --tensor-parallel-size 4 --max-model-len 1048576 --trust-remote-code`  
Transformers: `fla-core>=0.4.0`, `trust_remote_code=True`. 48B BF16 ~96GB will not fit a 24GB card.

## Unsloth / Qwen3.8 (already drafted on box, not yet on GitHub main)

Drafts: `/workspace/iaguide-pack/` and `/workspace/iaguide-unsloth/`.

| slug | track | order |
| --- | --- | --- |
| `unsloth` | training | 17.4 |
| `unsloth-qwen38` | training | 17.6 |
| `unsloth-qwen38-run` | metal | 21.5 |

Official:

- https://unsloth.ai/docs
- https://unsloth.ai/docs/models/qwen3.8/train
- https://unsloth.ai/docs/models/qwen3.8
- https://unsloth.ai/docs/get-started/unsloth-notebooks
- https://unsloth.ai/docs/get-started/fine-tuning-llms-guide
- https://unsloth.ai/docs/get-started/fine-tuning-for-beginners/unsloth-requirements
- https://unsloth.ai/docs/basics/inference-and-deployment/saving-to-gguf
- https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide
- https://unsloth.ai/docs/basics/vision-fine-tuning
- https://github.com/unslothai/unsloth
- https://github.com/unslothai/notebooks
- Kaggle conversational (NOT Colab): https://www.kaggle.com/notebooks/welcome?src=https://github.com/unslothai/notebooks/blob/main/nb/Kaggle-Qwen3.8_(27B)-Conversational.ipynb&accelerator=nvidiaTeslaT4
- Kaggle GRPO (change model to Qwen3.8): https://www.kaggle.com/notebooks/welcome?src=https://github.com/unslothai/notebooks/blob/main/nb/Kaggle-Muse_Glimmer_(30B)-GRPO.ipynb&accelerator=nvidiaTeslaT4
- 4-bit train checkpoint: https://huggingface.co/unsloth/Qwen3.8-27B-unsloth-bnb-4bit
- Install: `curl -fsSL https://unsloth.ai/install.sh | sh` (Mac/Linux/WSL); Windows `irm https://unsloth.ai/install.ps1 | iex`

## Constraints for any agent

- Do not clone repos onto the box or Pedro's Mac unless Pedro asked. Edit `/Users/guelug/CascadeProyects/iAguide` when the Mac is online, or keep drafts under `/workspace/iaguide-pack`.
- Do not commit Claude light-theme WIP (`globals.css`, `layout.tsx`, `palette.ts`, `atoms.tsx`, `HeroStack`).
- Content-only PRs to `guelug/iAguide` `main`.
- Register new slugs in `content/modules/index.ts` (`RAW` + `VISUALS`).
- EN+ES, Visual.tsx light classroom (`P.teal` / `P.amber` / `P.violet`, never `P.void` / `#07090b`).
- Cite sources in the lesson and in README NOTICE. Apache for HF. APA for Kimi papers.

## Harness auth, quotas, image models (added 2026-08-26)

Pedro also asked to cover OAuth with a consumer subscription vs API keys in the harnesses, price/quota examples, image models, a ComfyUI first-workflow tutorial, and CivitAI LoRAs.

- Hermes providers: https://hermes-agent.nousresearch.com/docs/integrations/providers
- Hermes credential pools: https://hermes-agent.nousresearch.com/docs/user-guide/features/credential-pools
- OpenClaw OAuth: https://docs.openclaw.ai/concepts/oauth
- OpenClaw authentication: https://docs.openclaw.ai/gateway/authentication.md
- ComfyUI first generation: https://docs.comfy.org/get_started/first_generation
- ComfyUI models: https://docs.comfy.org/basic-concepts/models
- ComfyUI LoRA: https://docs.comfy.org/tutorials/basic/lora
- Pedro's ComfyUI tutorial: https://civitai.com/articles/22492/comfyui-tutorial-2-building-your-first-workflow
- CivitAI models catalog: https://civitai.com/models

Planned slugs: `oauth-and-keys` (harness), `quotas-and-pricing` (metal), `image-models`, `comfyui-first-workflow`, `civitai-loras` (training/metal).

## Academic credit (Pedro, 2026-08-26)

Every lesson is a course guide, not a blog. Claims need a named source. End each `en.mdx` / `es.mdx` with a **Fuentes / Sources** bibliography.

Citation style:
- **Papers:** APA. Authors, year, *title*, arXiv id, URL. Example: Kimi Team. (2025). *Kimi Linear: An expressive, efficient attention architecture* (arXiv:2510.26692). https://arxiv.org/abs/2510.26692 Equal contribution when the PDF says so (AttnRes: Guangyu Chen, Yu Zhang, Jianlin Su).
- **Product docs:** Organization. (n.d. or dated page). *Title*. URL. Name the page, not just the domain.
- **Courses:** Credit authors. Hugging Face Agents Course: Burtenshaw, Thomas, Simonini, Paniego. Apache-2.0. https://huggingface.co/learn/agents-course
- **Community articles:** Author as listed on the page + title + URL (CivitAI article 22492).
- **Libraries:** Hugging Face Transformers, Unsloth (`unslothai/unsloth`), Comfy-Org, Nous Research (Hermes), OpenClaw docs.

Big sources that must appear as hyperlinks when the lesson touches them:
- Hugging Face Hub: https://huggingface.co/docs/hub
- Hugging Face CLI: https://huggingface.co/docs/huggingface_hub/en/guides/cli
- Hugging Face tokens: https://huggingface.co/docs/hub/en/security-tokens
- Hugging Face Inference Providers: https://huggingface.co/docs/inference-providers
- Unsloth: https://unsloth.ai/docs and https://unsloth.ai/docs/models/qwen3.8/train
- CivitAI: https://civitai.com and https://civitai.com/articles/22492/comfyui-tutorial-2-building-your-first-workflow
- ComfyUI: https://docs.comfy.org
- Hermes: https://hermes-agent.nousresearch.com
- OpenClaw: https://docs.openclaw.ai

Do not invent prices, notebooks, or APIs. If a live fetch fails, say so and point at the vendor page.

## Hugging Face Hub how-to (added 2026-08-26)

Drafts on this box: `/workspace/iaguide-pack/huggingface-hub/` (training, order 18.2, prereq `model-zoo`) and `/workspace/iaguide-pack/huggingface-inference/` (metal, order 21.2, prereqs `huggingface-hub`, `local-inference`). EN+ES, Visual.tsx, register via `INDEX_SNIPPET_HF.ts`. Do not invent prices, Colab notebooks, or OpenAI/Anthropic $/MTok. Date Hub catalog counts and Providers free-tier as of August 2026.

| slug | track | order | title EN |
| --- | --- | --- | --- |
| `huggingface-hub` | training | 18.2 | How to use the Hugging Face Hub |
| `huggingface-inference` | metal | 21.2 | Hugging Face Inference Providers and Transformers |

Official Hub / CLI / tokens (Hugging Face, the organization):

- Hub index (2M+ models / 1.5M datasets / 1.5M Spaces as of fetch 2026-08-26): https://huggingface.co/docs/hub/en/index
- User access tokens (fine-grained / read / write, HF_TOKEN, revoke `POST /api/credentials/revoke`, Trusted Publishers): https://huggingface.co/docs/hub/en/security-tokens
- Settings → Access Tokens: https://huggingface.co/settings/tokens
- Gated models: https://huggingface.co/docs/hub/en/models-gated
- Spaces overview (Gradio / Docker / static / ZeroGPU): https://huggingface.co/docs/hub/en/spaces-overview
- Storage backend (Xet): https://huggingface.co/docs/hub/en/storage-backends
- Model cards: https://huggingface.co/docs/hub/en/model-cards
- CLI `hf` (installer `https://hf.co/cli/install.sh` / Windows `https://hf.co/cli/install.ps1`, `uvx hf`, `hf auth login` device code https://huggingface.co/oauth/device, `hf download` `--dry-run`, `hf cache prune`): https://huggingface.co/docs/huggingface_hub/en/guides/cli
- Search the Hub: https://huggingface.co/docs/huggingface_hub/en/guides/search
- Rename from `huggingface-cli` to `hf`: https://huggingface.co/blog/hf-cli

Official inference / Transformers:

- Inference Providers: https://huggingface.co/docs/inference-providers/en/index
- Inference Providers pricing (Free users $0.10/month subject to change; no markup; PRO $2.00): https://huggingface.co/docs/inference-providers/en/pricing
- huggingface_hub inference guide (`InferenceClient`, Endpoints, local TGI/vLLM): https://huggingface.co/docs/huggingface_hub/en/guides/inference
- Transformers docs: https://huggingface.co/docs/transformers
- Transformers quicktour (`pipeline`, `AutoModel`, `AutoTokenizer`, `Trainer`): https://huggingface.co/docs/transformers/en/quicktour
- Transformers GitHub: https://github.com/huggingface/transformers
- Wolf et al. (2020). *Transformers: State-of-the-art natural language processing*. https://aclanthology.org/2020.emnlp-demos.6
- Inference Endpoints: https://huggingface.co/docs/inference-endpoints
- Text Generation Inference: https://huggingface.co/docs/text-generation-inference
- vLLM: https://docs.vllm.ai

Neighbor catalogs and harnesses (do not mix):

- Unsloth docs: https://unsloth.ai/docs
- Unsloth org on the Hub: https://huggingface.co/unsloth
- Unsloth Qwen3.8 4-bit checkpoint: https://huggingface.co/unsloth/Qwen3.8-27B-unsloth-bnb-4bit
- CivitAI: https://civitai.com
- ComfyUI first generation: https://docs.comfy.org/get_started/first_generation
- ComfyUI LoRA: https://docs.comfy.org/tutorials/basic/lora
- Hermes providers (`HF_TOKEN` in `~/.hermes/.env`, provider `huggingface`, `router.huggingface.co/v1`, suffixes `:fastest` `:cheapest` `:provider_name`, free tier $0.10/month Hermes-documented): https://hermes-agent.nousresearch.com/docs/integrations/providers
- OpenClaw architecture: https://docs.openclaw.ai/concepts/architecture
- Hugging Face Agents Course (Burtenshaw, Thomas, Simonini, Paniego, Apache-2.0): https://huggingface.co/learn/agents-course · https://github.com/huggingface/agents-course


## Drafted on this box: oauth / quotas / image / Comfy / LoRA (2026-08-26)

Folders under `/workspace/iaguide-pack/<slug>/{meta.json,en.mdx,es.mdx,Visual.tsx}`. Register via `INDEX_SNIPPET_EXTRA.ts`. Four tracks only. No invented OpenAI/Anthropic $/MTok (Hermes table copied as documented; HF Free credit 0.10 USD fetched from HF pricing). Date examples as of August 2026.

| slug | track | order | prereqs | durationMin |
| --- | --- | --- | --- | --- |
| `oauth-and-keys` | harness | 6.141 | gateway | 40 |
| `quotas-and-pricing` | metal | 25.3 | cost-and-economics, oauth-and-keys | 35 |
| `image-models` | training | 19.4 | multimodal | 35 |
| `comfyui-first-workflow` | metal | 21.8 | image-models, local-inference | 40 |
| `civitai-loras` | training | 19.6 | comfyui-first-workflow, fine-tuning | 35 |

Additional URLs used in those lessons (append to the list above):

- OpenClaw model failover: https://docs.openclaw.ai/concepts/model-failover
- Hugging Face Inference Providers index: https://huggingface.co/docs/inference-providers/index
- Hugging Face Inference Providers pricing (Free 0.10 USD/month subject to change; no markup): https://huggingface.co/docs/inference-providers/pricing
- Hugging Face tokens: https://huggingface.co/settings/tokens
- Anthropic Claude Code Pro/Max: https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan
- Nous Portal subscriptions: https://portal.nousresearch.com/manage-subscription
- Comfy-Org SD1.5 archive: https://huggingface.co/Comfy-Org/stable-diffusion-v1-5-archive/blob/main/v1-5-pruned-emaonly-fp16.safetensors
- Comfy-Org multiple LoRAs: https://docs.comfy.org/tutorials/basic/multiple-loras
- Comfy-Org text-to-image: https://docs.comfy.org/tutorials/basic/text-to-image
- Hugging Face safetensors: https://huggingface.co/docs/safetensors/index
- Unsloth fine-tuning guide (LoRA algebra): https://unsloth.ai/docs/get-started/fine-tuning-llms-guide
- RFC 6749 OAuth 2.0: https://datatracker.ietf.org/doc/html/rfc6749
- RFC 7636 PKCE: https://datatracker.ietf.org/doc/html/rfc7636
- Ho et al. (2020) DDPM arXiv:2006.11239
- Rombach et al. (2022) LDM arXiv:2112.10752
- Podell et al. (2023) SDXL arXiv:2307.01952
- Radford et al. (2021) CLIP arXiv:2103.00020
- Kingma & Welling (2013) VAE arXiv:1312.6114
- Hu et al. (2022) LoRA arXiv:2106.09685

## Claude Code + Codex (2026-08-26)

Harness module `claude-code-and-codex` (track harness, order 6.191, after `programmatic-access`). Spanish-first `es.mdx`; `en.mdx` is a real twin, not a stub. Do not paste installer one-liners; cite the Quickstart pages.

- Anthropic Claude Code overview: https://code.claude.com/docs/en/overview
- Anthropic Claude Code quickstart: https://code.claude.com/docs/en/quickstart
- Anthropic Agent view: https://code.claude.com/docs/en/agent-view#manage-multiple-agents-with-agent-view
- Anthropic Agents (subagents, agent view, teams, dynamic workflows): https://code.claude.com/docs/en/agents
- OpenAI code generation (Responses API, gpt-5.6, gpt-5.3-codex): https://developers.openai.com/api/docs/guides/code-generation
- OpenAI Codex CLI: https://developers.openai.com/codex/cli
- OpenAI openai/codex repo: https://github.com/openai/codex
