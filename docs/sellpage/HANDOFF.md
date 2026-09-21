# Sellpage Builder — Handoff

Update this file at the end of your working session. Read it at the start.

**Last updated:** 2026-09-22 · **By:** Agent A (core)

## Repository state

- Branch `main`. The GitHub repo's own `Initial commit` (a bare `README.md`)
  has been merged in; local work is ahead of `origin/main` and **not yet pushed**.
- No Agent B or C work exists in the repo yet. `docs/sellpage/` was created by
  this session — if the brief told you to read it earlier and it was missing,
  that is why.

## Agent A — status

### Completed

| Task | State |
| --- | --- |
| A1 Puck core | `@puckeditor/core` **0.23.0** installed. API read from the installed `.d.ts`, not guessed. Verified: `Config`, `Data`, `Render`, `ComponentConfig`, fields (incl. `CustomField`, `SlotField`), `Viewports`, `Permissions`, `Puck` props. |
| A2 Page contract | `schemas/sellpage.types.ts` — document, data, theme, SEO, settings, version, `PublishedSellpage`, plus defaults. Single source of truth for B/C. |
| A3 Shared renderer | One `blocks/index.ts` Config + one `SellpageRenderer`, used by admin preview and public page. No Admin/Public renderer split. |
| A4 Service layer | `getPage`, `getPageBySlug`, `getPublishedPageBySlug`, `createPage`, `saveDraft`(+theme/seo/settings), `renamePage`, `changeSlug`, `publishPage`, `unpublishPage`, `duplicatePage`, `deletePage`, `createVersion`, `getVersions`, `restoreVersion`. Storage behind `SellpageStorageAdapter`. |
| A5 Draft/publish | Enforced in the service layer and covered by tests. |
| A6 Autosave | `hooks/useAutosave.ts` — 1200 ms debounce, states Unsaved/Saving/Saved/Error, stale-response guard via a request id. |
| A7 Versions | Snapshot per publish: version (from 1), timestamp, user, `schemaVersion`, config + theme + seo + settings. Restore → draft only. |
| A8 Public routing | `/s/:slug` → `getPublishedPageBySlug` → `FallbackPage` on missing/corrupted/incompatible. Never a blank page. |
| A9 Migration | `schemas/schemaMigrations.ts` with ordered steps, `migrateToCurrent`, `canReadSchemaVersion`; tests fail the build if the version is bumped without a step. |

### Blocked

| Task | Blocker |
| --- | --- |
| A10 Firebase Auth / Firestore Rules / Storage | **Firebase is not installed and no project/credentials are configured.** Needs a Firebase project id + web config from the repo owner. Until then `userId` is threaded everywhere but passed `null`, and `/admin/*` has no auth guard. |

### Verification (all green)

`npx tsc -b` · `npm run lint` (oxlint, 0 warnings) · `npm test` (**37 passing**) · `npm run build`

## What B and C can rely on

- **Import page types from `schemas/sellpage.types.ts` only.** Do not declare
  your own page/config types.
- **Register every block in `blocks/index.ts`.** That registry is what both
  the editor and the public renderer consume; a block outside it does not exist.
- **Do not write `published*` fields.** Call the service; only `publishPage()`
  may touch them.
- **Do not import Puck editor UI (e.g. `FieldLabel`) into block/field modules**
  — it pulls the whole editor bundle onto the public page. Build custom field
  UI from plain elements, as `blocks/fields.tsx` does.
- **Sanitize before rendering user input**: `safeUrl`, `safeImageUrl`,
  `safeColor`, `safeCssValue` in `utils/safeUrl.ts`.
- **Never add a drag-and-drop library.** See ARCHITECTURE.md.

## Suggested next tasks

**A (core)** — when Firebase config arrives: Firestore adapter implementing
`SellpageStorageAdapter`, Auth wiring for `userId`, an `/admin/*` route guard,
Firestore security rules (public read of published pages only; admin-only
writes), Storage rules for media.

**B / C** — theme editor UI, responsive per-breakpoint props, page-management
UI polish, media library, additional blocks. All against the contract above.

## Known gaps / debt

- `localStorageAdapter` is single-user and not production storage.
- `/admin/*` routes are unauthenticated.
- Tracking pixel ids are stored in settings but not yet emitted on the public page.
- `restoreVersion` migrates a snapshot's `config`; theme/seo/settings snapshots
  are restored as-is (they have no migration steps yet).
