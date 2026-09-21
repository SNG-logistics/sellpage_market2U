# Sellpage Builder — Architecture

Owner of this document: **Agent A (core)**. B and C read it; changes to the
rules below are A's call.

## The one rule everything else follows

**Puck (`@puckeditor/core`, v0.23.0) is the page builder engine.**

Drag, drop, block ordering, block insertion, component selection, nested
components, fields, the canvas, preview and viewports are Puck's. If Puck has
the feature, we use Puck's.

Never add, and never reach for as a substitute:
`dnd-kit`, `react-dnd`, `sortablejs`, `interact.js`, a hand-written drag
engine, a hand-written canvas/positioning engine, or a hand-written nested
drag system.

Nesting is done with Puck's **Slot** field (see `blocks/container/Container.tsx`),
not with a custom nested drop target.

## Layers

```
src/features/sellpage/
  schemas/     sellpage.types.ts   <- THE page contract (A owns)
               schemaMigrations.ts <- version + migration steps (A owns)
               sellpageSchema.ts   <- validation/parse, re-exports the above
  blocks/      index.ts            <- BlockRegistry: the single Puck Config
               <block>/<Block>.tsx <- one folder per block
  renderer/    SellpageRenderer.tsx<- THE renderer (admin preview + public)
               FallbackPage.tsx    <- shown instead of a blank public page
  services/    sellpageService.ts  <- every read/write of a page
               storageAdapter.ts   <- storage behind an interface
  hooks/       useAutosave.ts, usePageHead.ts
  builder/     SellpageBuilder.tsx <- wraps <Puck>, adds autosave + publish
  utils/       safeUrl.ts          <- URL/CSS sanitizers
src/pages/
  admin/       AdminSellpageListPage, AdminSellpageEditorPage
  public/      PublicSellpagePage
```

## Data flow

```
        Admin editor                         Public page
             |                                    |
        draftConfig                         publishedConfig
             |                                    |
             +----------> SellpageRenderer <------+
                                 |
                          blocks/index.ts (one Puck Config)
```

There is exactly **one** renderer and **one** block registry. Do not introduce
`AdminRenderer` / `PublicRenderer`, or a second set of block implementations —
what the admin previews is what the public gets after Publish, and that only
holds while both sides run the same definitions.

## Draft vs published

| | Written by | Read by |
| --- | --- | --- |
| `draftConfig`, `draftTheme`, `draftSeo`, `draftSettings` | editing, autosave, restore | the editor only |
| `publishedConfig`, `publishedTheme`, `publishedSeo`, `publishedSettings` | `publishPage()` only | the public route only |

- Saving a draft must never change what a visitor sees.
- `publishPage()` is the only function that writes a `published*` field.
- The public route calls `getPublishedPageBySlug()`, which refuses drafts and
  unpublished pages by construction.

## Storage

UI components never call a database. Everything goes through
`services/sellpageService.ts`, which talks to a `SellpageStorageAdapter`.

The default adapter is `localStorageAdapter` — fine for development, **not
multi-user safe**. Moving to Firestore means implementing the interface in a
new file and calling `setSellpageStorageAdapter()` at startup; no page, block
or hook changes.

## Bundle boundary

The public page must not ship the Puck **editor**. Two things keep that true:

1. `SellpageRenderer` imports `Render` from `@puckeditor/core/rsc` — Puck's
   pure-render entry — not from the default entry.
2. The editor route is `React.lazy()`-loaded in `App.tsx`.

There is a third, less obvious constraint: **do not import Puck's editor UI
helpers (e.g. `FieldLabel`) into any module the renderer reaches.** Puck ships
those in the same physical chunk as `Puck` itself, so a single import drags the
whole editor into the public bundle. `blocks/fields.tsx` therefore builds its
custom field UI from plain elements.

Measured after these changes: public/list routes ~209 KB gzip; the editor
route lazy-loads ~173 KB gzip more on top. (The residual ~85 KB gzip of
tiptap/prosemirror inside Puck's own `Render` is unavoidable without forking
Puck.)

## Security invariants

- Every user-supplied URL passes `safeUrl()` / `safeImageUrl()` before
  reaching `href` or `src`. Allowed: http, https, mailto, tel, line, relative
  paths, in-page anchors. Blocked: `javascript:`, `data:`, protocol-relative.
- Every user-supplied colour passes `safeColor()`; composite CSS (border,
  shadow) passes `safeCssValue()`, which rejects `url()`, `expression()`,
  `javascript:` and `@import`.
- Block content is rendered as React children — never `dangerouslySetInnerHTML`.
  The page contract has no raw-HTML field, deliberately (see SCHEMA.md).
- `usePageHead` writes head tags with `setAttribute`, never `innerHTML`.

## Still open

- **Firebase**: not installed. Auth, Firestore rules and Storage are unbuilt;
  `userId` is threaded through every service call and currently passed `null`.
- **Admin auth**: the `/admin/*` routes are unguarded.
