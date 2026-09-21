# Sellpage Builder — Handoff

Update this file at the end of your working session. Read it at the start.

**Last updated:** 2026-09-22 · **By:** Agent A (core)

## Repository state

- Branch `main`, 6 commits, **not yet pushed** to `origin`.
- `tsc -b` clean · oxlint 0 warnings · vitest **37/37** · `vite build` passes.

## Agent A — status

### Completed

| Task | State |
| --- | --- |
| A1 Puck core | `@puckeditor/core` 0.23.0, API read from the installed `.d.ts`. |
| A2 Page contract | `schemas/sellpage.types.ts` — document, data, theme, SEO, settings, version, `PublishedSellpage`, defaults. |
| A3 Shared renderer | One `blocks/index.ts` config + one `SellpageRenderer` for admin preview and public page. |
| A4 Service layer | All page/version functions; storage behind `SellpageStorageAdapter`. |
| A5 Draft/publish | Enforced in the service layer, covered by tests. |
| A6 Autosave | 1200 ms debounce, 4 states, stale-response guard. |
| A7 Versions | Snapshot per publish incl. `schemaVersion` + theme/seo/settings. Restore → draft only. |
| A8 Public routing | `/s/:slug` → `getPublishedPageBySlug` → `FallbackPage`. Never blank. |
| A9 Migration | Ordered steps, `migrateToCurrent`, and a test that fails the build if the version is bumped without a step. |
| **A10 Firebase** | **Done.** Config, Firestore adapter, auth + admin claim, `/admin/*` guard, `firestore.rules`, `storage.rules`, `.env.example`. |

### A10 notes

- **Firebase is optional.** With no `VITE_FIREBASE_*` vars the app runs in
  local mode on localStorage and shows a banner saying admin pages are
  unprotected. `npm run dev` works with no Firebase project.
- **The rules are the security boundary**, not `RequireAdmin`. Public `get`
  is allowed only on genuinely published pages; `list` is admin-only; every
  write needs the `admin` custom claim.
- **Admin claim is server-side only** — set it with the Admin SDK. The UI
  reads the same claim off the ID token, so UI and rules cannot drift.

### Still to do before a real deployment

1. Create the Firebase project; fill `.env.local` from `.env.example`.
2. Deploy `firestore.rules` and `storage.rules`.
3. Grant `admin: true` to the first user via the Admin SDK.
4. Until 1–3 are done, do not expose the site publicly — local mode has no auth.

## What B and C can rely on

- **Import page types from `schemas/sellpage.types.ts` only.** Do not declare
  your own page/config types.
- **Register every block in `blocks/index.ts`** — that registry is what both
  the editor and the public renderer consume.
- **Do not write `published*` fields.** Only `publishPage()` may.
- **Never call a database directly** — go through `sellpageService`.
- **Sanitize user input before rendering**: `safeUrl`, `safeImageUrl`,
  `safeColor`, `safeCssValue` in `utils/safeUrl.ts`.
- **Never add a drag-and-drop library.** Puck owns drag/drop/nesting.
- **Watch the bundle boundary.** Two modules would drag huge dependencies
  onto the public sellpage if imported from shared code:
  - Puck's editor UI (e.g. `FieldLabel`) — bundled with the whole editor.
  - `lib/firebase.ts` — pulls the ~557 KB SDK. To check whether Firebase is
    configured, import `lib/firebaseConfig.ts` instead (no SDK).
  Current entry: 303 KB raw / 96 KB gzip. Keep it there.

## Agent B — status (from B's own session)

### Completed by Agent B

| Task | State |
| --- | --- |
| B3 Button presets | Added `whiteGlass`; 15 presets total. |
| B4 Social Button | 10 networks with brand colours/icons, still reusing `renderButton`. |
| B5 Hero block | Logo, description, solid/gradient/image backgrounds, overlay, alignment, minHeight, primary + secondary CTAs. |

Committed by Agent A in `405558f` after verification.

### Pending for Agent B

B1 basic blocks polish · B6 Stats · B7 Alert · B8/B9 Builder UI ·
B10 theme & design tokens · B11/B12 responsive & viewports.

Nothing in Agent A's area blocks these — the contract, renderer, service
layer and theme type are all in place.

## Known gaps / debt

- No Firebase project configured yet, so the Firestore adapter is written
  but has never run against a live database.
- Tracking pixel ids are stored in settings but not yet emitted publicly.
- `restoreVersion` migrates a snapshot's `config`; theme/seo/settings
  snapshots restore as-is (no migration steps exist for them yet).
- Media library (Phase 8) not started; `storage.rules` is ready for it.
