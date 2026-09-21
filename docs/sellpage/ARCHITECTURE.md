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

### A block change ships to every published page at once

The flip side of one shared renderer: a published config is stored as data and
re-rendered by whatever block code is currently deployed. Editing a block
therefore changes pages nobody has reopened or republished.

- **A new prop must render exactly as before when it is `undefined`.** Saved
  pages never have it — Puck's `defaultProps` apply only to newly inserted
  blocks. Give it a render-time fallback (`lineHeight || 1.2`); that also
  means no schema bump.
- **Don't change what an existing prop does by default.** Forcing every image
  link to `target="_blank"`, or capping image height, silently rewrites live
  pages. Add a prop that opts in instead.
- `blocks/blocks.test.tsx` renders the prop sets saved by older versions
  through the real renderer. When you add props to a block, add its previous
  prop set there.

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

The same goes for **`lib/firebase.ts`**, which pulls in the ~557 KB Firebase
SDK. Shared code that only needs to know whether Firebase is configured imports
`lib/firebaseConfig.ts` (no SDK) instead.

Measured 2026-09-22: entry chunk 306 KB raw / 98 KB gzip; the editor route and
the Firebase SDK each load lazily on top. (The residual ~85 KB gzip of
tiptap/prosemirror inside Puck's own `Render` is unavoidable without forking
Puck.)

## Security invariants

- Every user-supplied URL passes `safeUrl()` / `safeImageUrl()` before
  reaching `href` or `src`. Allowed: http, https, mailto, tel, line, relative
  paths, in-page anchors. Blocked: `javascript:`, `data:`, protocol-relative.
- Every user-supplied colour passes `safeColor()`; composite CSS (border,
  shadow) passes `safeCssValue()`, which rejects `url()`, `expression()`,
  `javascript:` and `@import`.
- **`background` passes `safeBackground()`, never `safeCssValue()`.**
  `safeCssValue` is a deny-list that is only sufficient because border and
  box-shadow cannot hold an image. `background` can, without any `url(`:
  `image-set("https://…")` takes a bare string, and `\75rl(…)` is `url(…)` after
  CSS decodes the escape. `safeBackground` is an allow-list — a colour, or
  exactly one gradient, no quotes or backslashes. Image backgrounds go through
  their own `safeImageUrl()` field (see Hero), not through a free-text value.
- Block content is rendered as React children — never `dangerouslySetInnerHTML`.
  The page contract has no raw-HTML field, deliberately (see SCHEMA.md).
- `usePageHead` writes head tags with `setAttribute`, never `innerHTML`.

## Still open

Firebase (project `market2u-b5f15`) is built — config, Firestore adapter, auth,
the `/admin/*` guard, `firestore.rules`, `storage.rules` — but **nothing has
been deployed or run against a live database**. Before exposing this publicly:

1. Deploy the rules: `firebase deploy --only firestore:rules,storage`.
2. Enable the Google sign-in provider in the console, or the button returns
   `auth/operation-not-allowed`.
3. Grant a user the `admin` claim; until then nobody can write to Firestore.
   That needs the Admin SDK and a service-account key — a real secret, which
   must never go in `.env.local` or the repo.

Firebase stays optional: with no `VITE_FIREBASE_*` vars the app runs on
localStorage and shows an "unprotected" banner.
