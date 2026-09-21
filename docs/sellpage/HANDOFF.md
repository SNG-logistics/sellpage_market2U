# Sellpage Builder — Handoff

Update this file at the end of your working session. Read it at the start.
**Append your section rather than replacing the file** — a previous rewrite
dropped the Agent A sections, including the bundle rules below that every
agent needs.

**Last updated:** 2026-09-22 · **By:** Agent A (core) — merging Agent B's section

## Repository state

- Branch `main`, **not yet pushed** to `origin`.
- `tsc -b` clean · oxlint 0 warnings · vitest **37/37** · `vite build` passes.

## Rules every agent must follow

1. **Puck owns drag/drop/nesting.** Never add dnd-kit, react-dnd, sortablejs,
   interact.js, or a hand-rolled canvas/drag engine.
2. **Import page types from `schemas/sellpage.types.ts` only.** Never declare a
   second Page/Config type.
3. **Register every block in `blocks/index.ts`** — that one registry feeds both
   the editor and the public renderer.
4. **Never write `published*` fields.** Only `publishPage()` may.
5. **Never call a database directly** — go through `sellpageService`.
6. **Sanitize user input before rendering**: `safeUrl`, `safeImageUrl`,
   `safeColor`, `safeCssValue` in `utils/safeUrl.ts`.
7. **Watch the bundle boundary.** Two imports would drag huge dependencies onto
   the PUBLIC sellpage if used from shared code:
   - Puck's editor UI (e.g. `FieldLabel`) — shipped in the same chunk as the
     whole editor.
   - `lib/firebase.ts` — pulls the ~557 KB SDK. To check whether Firebase is
     configured, import `lib/firebaseConfig.ts` instead (no SDK).

   Current entry: **303 KB raw / 97 KB gzip**. Keep it there.

## Agent A — status (core / Puck / Firebase / data)

| Task | State |
| --- | --- |
| A1 Puck core | `@puckeditor/core` 0.23.0, API read from the installed `.d.ts`. |
| A2 Page contract | `schemas/sellpage.types.ts` — document, data, theme, SEO, settings, version, `PublishedSellpage`. |
| A3 Shared renderer | One `blocks/index.ts` config + one `SellpageRenderer` for admin preview and public page. |
| A4 Service layer | All page/version functions behind `SellpageStorageAdapter`. |
| A5 Draft/publish | Enforced in the service layer, covered by tests. |
| A6 Autosave | 1200 ms debounce, 4 states, stale-response guard. Blocks and theme both. |
| A7 Versions | Snapshot per publish incl. `schemaVersion` + theme/seo/settings. Restore → draft only. |
| A8 Public routing | `/s/:slug` → `getPublishedPageBySlug` → `FallbackPage`. Never blank. |
| A9 Migration | Ordered steps + a test that fails the build if the version is bumped without one. |
| A10 Firebase | Config, Firestore adapter, auth, `/admin/*` guard, `firestore.rules`, `storage.rules`. |
| Theme editor | `builder/ThemePanel.tsx`, opened from Puck's own header, autosaves to draft. |
| Google Sign-in | `signInWithGoogle` (popup, `prompt: select_account`); email/password kept as a fallback. |

### Firebase project: `market2u-b5f15`

- Web app **"Market2U Sellpage"** registered; config in `.env.local` (gitignored).
- `.firebaserc` pins the project; `firebase.json` wires rules, hosting and emulators.
- **Firebase is optional** — with no `VITE_FIREBASE_*` vars the app runs on
  localStorage and shows an "unprotected" banner.

### NOT done — required before exposing this publicly

1. **Rules are not deployed.** `firebase deploy --only firestore:rules,storage`
2. **Google sign-in provider may not be enabled** in the console
   (Authentication → Sign-in method → Google). Without it the button returns
   `auth/operation-not-allowed`, which the UI reports explicitly.
3. **No user has the `admin` claim**, so no one can write to Firestore. Granting
   it needs the Admin SDK and a service-account key — a real secret, which must
   never go in `.env.local` or the repo.
4. The Firestore adapter has **never run against a live database**.

## Agent B — status (frontend / blocks / builder UI / theme)

| Task | State |
| --- | --- |
| B1 Basic blocks | Audited Heading, Text, Image, Divider, Spacer — props editable, live preview, safe URL/colour handling. |
| B3 Button system | `whiteGlass` added (15 presets). `renderButton` handles label, subtitle, URL, icon, target, width, padding, colours, border, radius, shadow, font, animation. |
| B4 Social buttons | 10 platforms (LINE, WhatsApp, Telegram, Facebook, TikTok, Instagram, YouTube, Website, Phone, Email) with brand colours/icons and admin overrides. |
| B5 Hero | Logo, title, subtitle, description, solid/gradient/image backgrounds, overlay, alignment, minHeight, primary + secondary CTAs. |
| B6 Stats | Grid columns (2/3/4), item management, font size, alignment, value and label colours. |
| B7 Alert | Info, Success, Warning, Security, VIP Gold presets; title, description, custom background/text/border/radius. |
| B10 Theme tokens | `styles/sellpage.css` — `--sp-*` variables, button animations, Noto Sans Thai/Lao stacks, `prefers-reduced-motion`. |
| B12 Viewports | Verified 390 / 768 / 1440 in `viewports.ts`. |

### Pending for Agent B

B8/B9 Builder UI · B11 responsive per-breakpoint props.

## Known gaps / debt

- Media library (Phase 8) not started; `storage.rules` is ready for it.
- Tracking pixel ids are stored in settings but not yet emitted publicly.
- `restoreVersion` migrates a snapshot's `config`; theme/seo/settings restore
  as-is (no migration steps exist for them yet).
