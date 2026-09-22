# Sellpage Builder — Handoff

Update this file at the end of your working session. Read it at the start.
**Edit your own section; leave the others alone. Never replace the file.** It
has been rewritten wholesale three times, and every time the rewrite dropped
the Agent A sections and the shared rules. The rules now also live in
`ARCHITECTURE.md` so they survive, but the status tables only live here.
How to edit this file safely is spelled out in `/AGENTS.md` — read it first.

**Last updated:** 2026-09-22 · **By:** Agent A (core) — reviewed B's B8–B13 and C's C1–C5

## Repository state

- Branch `main`, **not yet pushed** to `origin` (local is ahead of `origin/main`).
- `tsc -b` clean · oxlint 0 warnings · `vite build` passes.
- `npm test` **121/121** · `npm run test:emulator` **12 passed, 1 expected fail**
  (the documented draft-leak gap) · `npm run test:e2e` **1/1**.
- Verified in a real browser: builder, all three panels, the image field, and a
  published page at `/s/:slug`, with no console or page errors.
- Several agents share this one working tree, sometimes at the same moment.
  Re-read a file right before editing it, and check a file does not already
  exist before creating it.

## Rules every agent must follow

Full reasoning is in `ARCHITECTURE.md`; this is the checklist.

1. **Puck owns drag/drop/nesting.** Never add dnd-kit, react-dnd, sortablejs,
   interact.js, or a hand-rolled canvas/drag engine.
2. **Import page types from `schemas/sellpage.types.ts` only.** Never declare a
   second Page/Config type.
3. **Register every block in `blocks/index.ts`** — that one registry feeds both
   the editor and the public renderer.
4. **Never write `published*` fields.** Only `publishPage()` may.
5. **Never call a database directly** — go through `sellpageService`.
6. **Sanitize user input before rendering** with `utils/safeUrl.ts`: `safeUrl`,
   `safeImageUrl`, `safeColor`, `safeCssValue` (border, shadow) and
   `safeBackground`. **A `background` goes through `safeBackground`, never
   `safeCssValue`** — `safeCssValue` only blocks `url(`, and a background can
   load a remote image without one (`image-set("https://…")`, `\75rl(…)`).
7. **Watch the bundle boundary.** Two imports would drag huge dependencies onto
   the PUBLIC sellpage if used from shared code:
   - Puck's editor UI (e.g. `FieldLabel`) — shipped in the same chunk as the
     whole editor.
   - `lib/firebase.ts` — pulls the ~557 KB SDK. To check whether Firebase is
     configured, import `lib/firebaseConfig.ts` instead (no SDK).

   Current entry: **306 KB raw / 98 KB gzip**. Keep it there.
8. **A block change ships to every published page at once.** Published configs
   are re-rendered by whatever block code is deployed. A new prop must render
   exactly as before when it is `undefined` (saved pages never have it — Puck's
   `defaultProps` only apply to newly inserted blocks), and an existing prop's
   default behaviour must not change. When you add props to a block, add its
   previous prop set to `blocks/blocks.test.tsx`.

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
| `safeBackground` | Allow-list sanitizer for `background` (a colour or exactly one gradient). Used by Button, Alert, Hero background and Hero overlay. |
| Block render tests | `blocks/blocks.test.tsx` — every block through the real `SellpageRenderer`, pre-B1 prop sets, Image and Button behaviour. |
| Phase 8 Media library | `services/mediaService.ts` + lazy `firebaseMediaAdapter.ts`; `imageField()` in `blocks/fields.tsx`; `media/` (field input, lazy dialog, context). Upload with progress, pick, delete with in-use guard. Wired into Image `src`, Hero `logo` and `backgroundImage`. **Tested against an in-memory adapter only — never run against real Storage** (see "NOT done"). |
| Theme sanitizing | `SellpageRenderer` passes theme colours through `safeColor` and the page background through `safeBackground` before writing `--sp-*`. |

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
4. The Firestore adapter has **never run against a live database**, and the
   media adapter has **never uploaded to real Storage**. Items 1 and 3 block
   both: until the rules are deployed and someone holds the `admin` claim,
   every upload is refused (the dialog says so in those words).

### A's review of B's B1 pass (2026-09-22, commit `36bfa8e`)

Heading and Text merged as written. Everything below passed tsc, lint and the
tests that existed, so none of those would have caught it.

Image:

- **Linked images rendered at width squared.** Both the `<a>` and the `<img>`
  inside it were sized `width%`, so a 50 % linked image came out at 25 %. The
  `<a>` now carries the width and the image fills it.
- **`maxHeight: 800` removed.** Under `objectFit: cover` it cropped any image
  taller than 800 px — every long infographic, the staple of a sellpage — on
  already-published pages too (rule 8).
- **Forced `target="_blank"` replaced with an `openTarget` field**, same shape
  as Button's, defaulting to same-tab. Forcing a new tab broke `#anchor`,
  `tel:` and `line:` links and changed existing pages' behaviour (rule 8).
- `border: '1px stroke #ccc'` is not valid CSS and was silently dropped →
  `1px solid #ccc`.

Backgrounds: Button, Alert and Hero passed user backgrounds through
`safeCssValue` to allow gradients. Gradients still work; they now go through
`safeBackground` (rule 6).

`blocks.test.tsx`: A and B each created this file within the same few minutes,
and A's write replaced B's 5-test version before either was committed. The
committed file is A's; it covers the areas B listed (defaultProps, `renderButton`
output, URL sanitization). B — if anything of yours is missing, add it to the
existing file.

Left as B wrote it, but worth knowing: Heading/Text now fall back to
`var(--sp-text, inherit)` instead of inheriting. Identical today, because no
block sets an inherited text colour. The day Container (or any slot parent)
gains a `textColor`, children will ignore it until this fallback is dropped.

### A's review of B's B8–B13 pass (2026-09-22)

SEO panel, Page panel and the extra block tests merged as written. Fixed:

- **B11 changed how already-published pages lay out** — rule 8, in the one
  place the brief called out. `stackOnMobile ?? true` made every published
  row Container stack under 640 px, and `mobileColumns ?? 1` dropped every
  published Stats grid to one column, because a saved page has neither prop
  and `defaultProps` do not apply to it. Both fallbacks now mean "as before",
  and each block only carries the responsive class when it actually holds the
  prop, so the CSS cannot reach an older page at all. New blocks still get the
  mobile-friendly defaults. The test that asserted the wrong default is
  rewritten, and each block now has a no-prop case.
- **Panels covered Puck's header**, including the Publish button: `.sp-theme`
  was `position: fixed` full-height at `right: 0`. Puck and the open panel are
  flex siblings now (`.sp-builder__canvas`), so nothing overlaps.
- The SEO panel sat outside `MediaContext`, so its OG-image field could never
  open the library. All three panels are inside the provider now.
- Unpublish took visitors' page down with no confirmation; it asks now.
- History showed "No versions saved yet" for a moment before the first load
  resolved, and `loadingVersions` was never set true. Loading is derived from
  `versions === null` instead of a second state.

### A's review of C's QA pass (2026-09-22)

The emulator harness works — including a junction to dodge the Thai characters
in the repo path, which is a real obstacle neatly handled. Both findings C
raised were genuine, and both were mine to fix:

- **The public site could not have loaded from Firestore at all.** A slug
  lookup is a `list` to Firestore, not a `get`, and `list` was admin-only, so
  `/s/:slug` would have failed for every visitor the moment Firebase was
  switched on. The rule now also allows a list that is provably restricted to
  published pages, and the adapter has a separate `getPublishedBySlug` that
  puts `status == 'published'` **in the query** — `isPublished()` could not be
  used, because Firestore cannot prove the `publishedConfig != null` half from
  a query. An unconstrained list is still refused.
- **`request.auth.token.admin` threw on a token without the claim** ("Property
  admin is undefined") in both rules files. It denied, so it was never unsafe,
  but the error hid real failures in the emulator log. Both use
  `.get('admin', false)` now.
- C's draft-leak test is real and now marked `it.fails` so the suite stays
  honest — see "Known gaps".

## Agent B — status (frontend / blocks / builder UI / theme)

| B1 Basic blocks | Heading (h1–h6, lineHeight, mobileFontSize), Text (fontWeight, lineHeight, opacity, mobileFontSize), Image (align, caption, shadow, openTarget), Divider, Spacer — props editable, live preview, safe URL/colour handling. |
| B3 Button system | `whiteGlass` added to `buttonPresets.ts` (15 presets). `renderButton` handles label, subtitle, URL, icon, target, width, padding, colours (including custom gradients), border, radius, shadow, font, animation. |
| B4 Social buttons | SVG icons for 10 platforms (LINE, WhatsApp, Telegram, Facebook, TikTok, Instagram, YouTube, Website, Phone, Email) in `buttonIcons.tsx` and `buttonIconRegistry.ts`; `SocialButton.tsx` has brand colours/icons and admin overrides. |
| B5 Hero | Logo, title, subtitle, description, solid/gradient/image backgrounds, overlay, alignment, minHeight, primary + secondary CTAs. |
| B6 Stats | Grid columns (2/3/4), mobileColumns (1/2), item management, font size, alignment, value and label colours. |
| B7 Alert | Info, Success, Warning, Security, VIP Gold presets; title, description, custom background/text/border/radius. |
| B8 SEO panel | `SeoPanel.tsx` — Title/Description with char counters, ogImage using `imageField()`, Canonical URL, noIndex toggle, reset button. |
| B9 Page panel | `PagePanel.tsx` — Publishing (Status, Live URL, Unpublish, Slug change with validation), Tracking Settings (Pixel, GA4, TikTok), Version History (list + Restore to draft). |
| B10 Theme tokens | `styles/sellpage.css` — `--sp-*` variables, button animations (`sp-btn-pulse`, `sp-btn-bounce`, `sp-btn-shine`), Noto Sans Thai/Lao stacks, `prefers-reduced-motion`. Imported in `SellpageRenderer.tsx`. |
| B11 Mobile props | Simplified mobile props: `stackOnMobile` (Container), `mobileColumns` (Stats), `mobileFontSize` (Heading, Text) with render-time fallbacks. |
| B12 Viewports | Verified 390 / 768 / 1440 in `viewports.ts`. |
| B13 Render tests | Complete unit tests for Hero, Stats, Alert, SocialButton, Container, Image, Button in `blocks.test.tsx` (43 tests in blocks.test.tsx, 117 total). |

### Pending for Agent B

None — all assigned Agent B tasks (B1–B13) completed.

## Agent C — status (QA / rules / integration)

| Task | State |
| --- | --- |
| C1 Rules tests | Emulator suite covers anonymous, signed-in non-admin, admin, published/draft reads, writes, versions, image types, 10 MB limit, delete, and outside/nested paths. Both defects C raised were real; A fixed them (see A's review). Now 12 pass + 1 documented `it.fails`. |
| C2 Adapter tests | `firestoreAdapter` page/version CRUD and `firebaseMediaAdapter` upload/list/delete round-trip pass against Firestore/Storage emulators. No live Firebase project was used. |
| C3 Admin/deploy | `scripts/grant-admin.mjs` reads the service account only from `FIREBASE_SERVICE_ACCOUNT_JSON`; `docs/sellpage/DEPLOY.md` gives verify, claim, rules, build, hosting, and smoke order. |
| C4 Browser smoke | Playwright Chromium localStorage flow passes: create → publish → `/s/:slug` → draft isolation → never-published fallback. |

### Core/rules defects C found — both fixed by A

1. **Slug lookup was denied to every visitor.** Fixed: `getPublishedBySlug` +
   a `list` rule for queries restricted to published pages.
2. **A published document hands the visitor its draft too.** Still open — see
   "Known gaps". Firestore cannot redact fields, so this needs the public data
   split into its own document or collection.

C also noted Puck logs that `renderHeaderActions` is deprecated. It still
works; moving to `overrides.headerActions` is B's when it becomes worth doing.

## Next exact task

Follow `DEPLOY.md` against the real project: deploy rules, enable the Google
provider, grant the `admin` claim, then the first real end-to-end pass (sign in
→ upload an image → place it → publish → open `/s/:slug`). **Nothing has ever
run against live Firebase**; the emulator suite is the closest we have.

Then, before any real customer data: split the public projection so a visitor
cannot read drafts (gap 1 below).

## Known gaps / debt

- **A published page exposes its draft.** A visitor who fetches the document
  directly gets `draftConfig` and every other draft field. `it.fails` in
  `tests/firebase/rules.test.ts` documents the contract; the fix is a separate
  published document/collection, which also lets the `get` rule get simpler.
  Acceptable only while no draft holds anything private.
- Media files are not removed when their page is deleted, and a version
  restored from history can reference an image deleted since.
- Tracking pixel ids are stored in settings but not yet emitted publicly.
- `restoreVersion` migrates a snapshot's `config`; theme/seo/settings restore
  as-is (no migration steps exist for them yet).
