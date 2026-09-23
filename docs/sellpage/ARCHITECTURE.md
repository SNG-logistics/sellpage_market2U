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
               mediaService.ts     <- every list/upload/delete of an image
  media/       ImageFieldInput.tsx <- the image field's UI (ships publicly, tiny)
               MediaLibraryDialog  <- the library itself (lazy, admin only)
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

The theme around the blocks is shared the same way: `renderer/ThemeFrame.tsx`
wraps the public page (through `SellpageRenderer`) **and** the editor canvas
(through Puck's `iframe` override). Until it did, the canvas showed no theme at
all, and every colour, font, width or background edit appeared only after
Publish.

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

### The public projection

The table above is the contract inside one document. It is not what a visitor
is allowed to fetch — **a database returns whole documents.** An access rule
can say which document may be read, never which fields, so a page that was
readable because it was published used to hand over its draft with it.

So a live page is stored **twice**: the admin document in `sellpages/{pageId}`,
and a projection of its published half in `publicPages/{slug}`. The visitor
reads only the second, which never contained a draft to leak.

- `schemas/publicProjection.ts` is the whole boundary. `toPublicDocument()`
  **names every field it copies.** Never `...doc` with deletions afterwards: a
  field added to `SellpageDocument` later would start leaking by itself, on the
  day it was added, with nothing in the diff to notice.
- It returns `null` when the page is not live, and callers **delete** the
  projection. Unpublishing removes the record rather than leaving it readable
  behind a status flag only the app checks.
- `PUBLIC_DOCUMENT_KEYS` is mirrored by `publicKeys()` in `firestore.rules`,
  which pins the stored document to exactly those keys. The browser assembles
  the projection and the browser is not trusted, so the rule is the real
  enforcement. `rules.test.ts` compares the two lists; they cannot drift.
- `adapter.save()` writes the page and reconciles the projection **atomically**
  — publish, unpublish, rename, a slug change and every autosave all end up
  there, so no call site can forget, and a crash cannot leave yesterday's copy
  live at an old slug.
- Keyed by slug, so the public read is a `get` of a known id. That is why the
  public rule is `allow get: if true` with nothing to reason about. It replaced
  a `list` rule that could only mention the fields the query happened to
  constrain — correct, but one refactor away from being wrong.
- `getBySlug()` stays admin-side, for slug uniqueness, where drafts must be
  visible. The public route uses `getPublicBySlug()`.

## Storage

UI components never call a database. Everything goes through
`services/sellpageService.ts`, which talks to a `SellpageStorageAdapter`.

The default adapter is `localStorageAdapter` — fine for development, **not
multi-user safe**. Moving to Firestore means implementing the interface in a
new file and calling `setSellpageStorageAdapter()` at startup; no page, block
or hook changes.

## Media library

Images live in Firebase Storage at `sellpages/{pageId}/{fileName}` — the one
path `storage.rules` opens (public read, admin write, images under 10 MB).

- **A block stores a plain URL string**, the same as before the library
  existed. The library is only a way to fill that string in; pasting a URL
  still works, and the render side still passes it through `safeImageUrl`.
- **Every image prop uses `imageField()`** from `blocks/fields.tsx`, not a
  `text` field.
- UI goes through `services/mediaService.ts`, never the Storage SDK. The
  Firebase implementation (`firebaseMediaAdapter.ts`) is loaded by dynamic
  import; tests swap in an in-memory adapter with `setMediaStorageAdapter()`.
- `mediaService` repeats the type and size limits from `storage.rules` so the
  user gets a readable message without a round trip. **The rules are the
  control; keep the two in step.**
- File names are generated (`buildMediaFileName`): the original name is user
  input headed for a URL path, so only `[a-z0-9-]` survives, the extension
  comes from the MIME type, and a unique prefix means no upload can overwrite
  another. That is also what makes the one-year immutable cache header safe.
- **`deleteMedia` refuses a file the draft or published page still shows.**
  Storage has no undo, and a deleted file on a published page is a broken image
  in front of customers. The builder hands the dialog its live draft through
  `MediaContext`, because the saved draft lags by the autosave debounce.
- Without Firebase the library is unavailable and the field says so; it does
  not fall back to `data:` URLs, which `safeImageUrl` rejects by design.

Not covered yet: files are not removed when a page is deleted, and a version
restored from history can reference an image deleted since.

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

The image field is the sharpest case: `blocks/fields.tsx` is shared code, so
`media/ImageFieldInput.tsx` ships publicly. It therefore loads
`MediaLibraryDialog` with `React.lazy`, and `mediaService` loads the Storage
adapter with a dynamic `import()`. Keep both boundaries.

Every block registered in `blocks/index.ts` is in that entry chunk, on every
public page, whether or not the page uses it. Eight blocks took it from 306 KB
to 342 KB raw. That is the cost of a single shared registry, and it is worth
paying while the block count is small; past roughly 120 KB gzip the registry
should be split so a page loads only the blocks it contains.

Measured 2026-09-22: entry chunk 342 KB raw / 107 KB gzip; the editor route and
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
- **An image URL written into CSS goes through `cssUrl()`**, after
  `safeImageUrl()`. `safeImageUrl` hands relative paths back as typed and the
  URL serializer leaves `(`, `)` and quotes alone, so an unquoted `url(${u})`
  can be closed early by the value. `cssUrl` quotes it and escapes `"` and `\`.
- **The theme is user input too.** `SellpageRenderer` passes every theme colour
  through `safeColor()` and the page background through `safeBackground()`
  before writing the `--sp-*` variables — blocks use `background:
  var(--sp-surface)`, so an unsanitized variable would reach every block.
- Block content is rendered as React children — never `dangerouslySetInnerHTML`.
  The page contract has no raw-HTML field, deliberately (see SCHEMA.md).
- `usePageHead` writes head tags with `setAttribute`, never `innerHTML`.

## Rules, and how they are tested

`firestore.rules` and `storage.rules` are the real boundary — the admin UI is a
browser app and cannot be trusted. `npm run test:emulator` runs both against the
Firebase emulators; run it after touching either file.

Three things the emulator taught us, all easy to get wrong by reading alone:

- **A rule cannot hide a field.** It decides whether a document is returned,
  and then the whole document is. Anything a visitor must not have belongs in a
  document they cannot read — hence `publicPages` (see "The public projection").
- **A rule for `list` may only mention fields the query constrains.** Firestore
  evaluates a query against the rule *before* reading anything, so it must be
  able to prove safety from the query itself. `status == 'published'` works;
  `publishedConfig != null` does not, however true it is of every stored page.
  The public read is a `get` by slug now and no longer depends on this, which
  is most of the reason it was changed.
- **`request.auth.token.admin` throws** for a token without the claim
  ("Property admin is undefined"), rather than evaluating false. Use
  `request.auth.token.get('admin', false)`. Either way access is denied, so the
  bug hides — it shows up only as noise in the emulator log.

## Still open

Firebase (project `sellpage-81ae5`) is built — config, Firestore adapter, auth,
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
