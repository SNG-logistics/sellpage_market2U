# Sellpage Builder — Task briefs

Issued by Agent A on 2026-09-22, after Phase 8 (media library). Read
`/AGENTS.md` first, then `HANDOFF.md` and `ARCHITECTURE.md`. Do the tasks in
order; each one is shippable on its own. Stop after your list — do not start
on another agent's tasks.

Both of you: work only in the working tree, do not commit, and finish by
updating **your own section** of `HANDOFF.md` with the real numbers from
`npx tsc -b`, `npm run lint`, `npm test`, `npx vite build`.

---

## Agent B — Builder UI and blocks

The service layer already has everything below; none of it has a UI. Follow
`builder/ThemePanel.tsx` exactly: a panel opened from a button in Puck's own
header (`renderHeaderActions` in `SellpageBuilder.tsx`), editing **draft**
state, autosaved with `useAutosave`, never touching `published*`.

### B8 — SEO panel

- New `builder/SeoPanel.tsx`, opened by an "SEO" header button, same shape as
  ThemePanel. Fields: `title`, `description` (show a character count; warn
  past 60 / 160), `ogImage` via `imageField()`'s `ImageFieldInput` from
  `media/ImageFieldInput.tsx`, `canonicalUrl`, `noIndex`.
- Wire into `SellpageBuilder.tsx` like the theme: `useState` from
  `page.draftSeo`, `useAutosave` → `saveDraftSeo`, fold its status into the one
  `saveStatus` indicator.
- Read `hooks/usePageHead.ts` to see which SEO fields the public page actually
  emits, and label anything it does not. Do not change `usePageHead`.

### B9 — Settings, publish state and history panel

- New `builder/PagePanel.tsx` ("Page" header button) with three sections:
  1. **Settings** — the `SellpageSettings` fields (`draftSettings`, via
     `saveDraftSettings`). Tracking ids are plain text inputs; they are stored
     but not yet emitted on the public page — say so in the panel.
  2. **Publishing** — current state (draft / published / unpublished, from
     `publishedAt` / `unpublishedAt` on the document), the public URL
     `/s/{slug}`, "Unpublish" (`unpublishPage`, confirm first), "Change slug"
     (`changeSlug`; show its error message verbatim — the service validates).
  3. **History** — `listVersions(page.id)` newest first, each with version
     number, date and "Restore to draft" (`restoreVersion`, confirm first).
     After a restore, replace the builder's `draft` **and** theme state from
     the returned document, otherwise Puck keeps showing the old data.
- `SellpageBuilder` gets a single `openPanel: 'theme' | 'seo' | 'page' | null`
  instead of `themeOpen`, so only one panel is open at a time.

### B13 — Render tests for the remaining blocks

`blocks/blocks.test.tsx` covers Image and Button; Hero, Stats, Alert,
SocialButton and Container only have the defaultProps smoke test. Add, for
each, in the same file and style:

- its **pre-B-pass prop set** rendering unchanged (read `git log -p` on the
  block to find what a saved page from before your changes holds),
- every user URL/colour/background reaching the DOM only through the
  sanitizers (`javascript:` URL → no link; `image-set(…)` background → preset),
- the block-specific behaviour you added (Hero `bgType` switching, Stats
  column count, Alert variants, SocialButton brand defaults + overrides,
  Container `direction`/`maxWidth`).

### B11 — Mobile layout props (scoped down)

Do **not** add per-breakpoint prop objects to the page contract — that changes
`schemas/sellpage.types.ts`, which is Agent A's, and needs a migration. Instead
add plain props with render-time fallbacks (rule 8):

- Container: `stackOnMobile: boolean` (default `true` for new blocks;
  `undefined` must behave as today, i.e. `false`) → `flexDirection: column`
  under 768 px via a class in `styles/sellpage.css`, not inline media queries.
- Stats: `mobileColumns: 1 | 2` (undefined → today's behaviour).
- Heading/Text: `mobileFontSize: number` (0/undefined → same as `fontSize`).

Add each to `blocks.test.tsx` with the undefined case asserted.

### Not yours

`utils/safeUrl.ts`, `schemas/`, `services/`, `renderer/`, `firestore.rules`,
`storage.rules`, `ARCHITECTURE.md`. If a task above needs a change there,
write down what you need in your `HANDOFF.md` section and stop that task.

---

## Agent C — QA, rules and integration

Nothing here has ever run against a real Firebase project, and the security
rules have no tests. Your job is to make that safe to do. You may add
**dev** dependencies only: `@firebase/rules-unit-testing`, `firebase-tools`,
`@playwright/test`. No runtime dependencies.

### C1 — Rules tests on the emulators

- `npm run test:rules` → starts the Firestore + Storage emulators
  (`firebase emulators:exec`) and runs a Vitest suite under `tests/rules/`.
- `firestore.rules`: anonymous can read a page only when published; anonymous,
  and a signed-in user **without** the `admin` claim, cannot write anything;
  an admin can write `sellpages/{id}` and its `versions` subcollection.
- `storage.rules`: anyone can read `sellpages/{pageId}/{file}`; only an admin
  can write; a write of `text/html`, of `image/png` at 10 MB + 1 byte, or to
  any path outside `sellpages/` is refused even for an admin.
- If a rule is wrong, **do not edit the rules file** — write the failing test,
  mark it `.fails`, and record it in your handoff section for Agent A.

### C2 — Adapter tests on the emulators

Same emulator runner. Run `firestoreAdapter` and `firebaseMediaAdapter`
against the emulators as an admin (create the claim with the Auth emulator):
save/get/getBySlug/list/remove/listVersions/saveVersion round-trip; media
list/upload/remove including that `remove` on a page's file leaves the other
page's files alone. `lib/firebase.ts` must be pointed at the emulators through
`connect*Emulator` **in the test setup only** — do not change `firebase.ts`.

### C3 — Admin-claim script

`scripts/grant-admin.mjs <email>`: uses `firebase-admin`, reads the service
account path from `GOOGLE_APPLICATION_CREDENTIALS`, sets `{ admin: true }` on
that user, prints what it did. Refuse to run if the env var is missing, and
never accept the key as an argument or read it from the repo. Add
`*.json` service-account patterns to `.gitignore` if not already covered, and a
`docs/sellpage/DEPLOY.md` with the exact order: deploy rules → enable Google
provider → grant claim → build → deploy hosting → smoke test.

### C4 — End-to-end smoke test (local mode)

Playwright, `npm run test:e2e`, against `vite dev` with **no** `VITE_FIREBASE_*`
vars (localStorage mode, no sign-in): create a page → add Heading, Image (paste
a URL), Button → Publish → open `/s/{slug}` → the three blocks render with the
entered text and the image `src`. Then: edit the draft → the public page is
unchanged until Publish. Then: an unpublished slug shows `FallbackPage`, not a
blank page. One spec file; keep it under a minute.

### C5 — Report

Your `HANDOFF.md` section lists: what passed, every failing/`.fails` test with
the rule or code it points at, and anything you had to work around. Findings
about code go in the report, not into the code — Agent A fixes core.

### Not yours

Everything under `src/features/sellpage/` except adding `connect*Emulator`
calls in test setup files; the rules files; `AGENTS.md`, `ARCHITECTURE.md`.
