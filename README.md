# sellpage_market2U

Visual Sellpage Builder for Market2U. Admins compose sellpages from blocks in
an editor; the published result is served on a public route.

**Puck (`@puckeditor/core`) is the page builder engine.** Drag, drop, block
ordering, insertion, selection, nesting, fields, canvas and viewports are all
Puck's. No custom drag-and-drop engine exists in this repo and none should be
added — see `docs/sellpage/ARCHITECTURE.md`.

## Getting started

```bash
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` then production build |
| `npm run lint` | oxlint |
| `npm test` | vitest (run mode) |

## Routes

| Route | Purpose |
| --- | --- |
| `/admin/sellpages` | Page list — create, edit, duplicate, delete |
| `/admin/sellpages/:id` | Puck-powered editor for one page |
| `/s/:slug` | Public sellpage — renders `publishedConfig` only |

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/sellpage/ARCHITECTURE.md`](docs/sellpage/ARCHITECTURE.md) | Layers, ownership boundaries, the rules that must hold |
| [`docs/sellpage/SCHEMA.md`](docs/sellpage/SCHEMA.md) | The page contract and how to change it safely |
| [`docs/sellpage/HANDOFF.md`](docs/sellpage/HANDOFF.md) | Current status, what is done, what is next |

## Stack

React 19 · TypeScript · Vite 8 · React Router 7 · `@puckeditor/core` 0.23 ·
vitest · oxlint
