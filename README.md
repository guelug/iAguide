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

## License

MIT. Copyright 2026 Pedro Caparros Torres / guelug and iAguide contributors.
