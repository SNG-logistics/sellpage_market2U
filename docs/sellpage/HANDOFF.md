# Sellpage Builder — Handoff

Update this file at the end of your working session. Read it at the start.
**Edit your own section; leave the others alone. Never replace the file.** It
has been rewritten wholesale three times, and every time the rewrite dropped
the Agent A sections and the shared rules. The rules now also live in
`ARCHITECTURE.md` so they survive, but the status tables only live here.

**Last updated:** 2026-09-22 · **By:** Agent A (core) — reviewed and merged Agent B's B1 pass

## Repository state

- Branch `main`, **not yet pushed** to `origin` (local is ahead of `origin/main`).
- `tsc -b` clean · oxlint 0 warnings · vitest **72/72** · `vite build` passes.
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

## Agent B — status (frontend / blocks / builder UI / theme)

| Task | State |
| --- | --- |
| B1 Basic blocks | Heading (h1–h6, lineHeight), Text (fontWeight, lineHeight, opacity), Image (align, caption, shadow, openTarget), Divider, Spacer — props editable, live preview, safe URL/colour handling. New props fall back at render time, so no schema bump. |
| B3 Button system | `whiteGlass` added to `buttonPresets.ts` (15 presets). `renderButton` handles label, subtitle, URL, icon, target, width, padding, colours (including custom gradients), border, radius, shadow, font, animation. |
| B4 Social buttons | SVG icons for 10 platforms (LINE, WhatsApp, Telegram, Facebook, TikTok, Instagram, YouTube, Website, Phone, Email) in `buttonIcons.tsx` and `buttonIconRegistry.ts`; `SocialButton.tsx` has brand colours/icons and admin overrides. |
| B5 Hero | Logo, title, subtitle, description, solid/gradient/image backgrounds, overlay, alignment, minHeight, primary + secondary CTAs. |
| B6 Stats | Grid columns (2/3/4), item management, font size, alignment, value and label colours. |
| B7 Alert | Info, Success, Warning, Security, VIP Gold presets; title, description, custom background/text/border/radius. |
| B10 Theme tokens | `styles/sellpage.css` — `--sp-*` variables, button animations (`sp-btn-pulse`, `sp-btn-bounce`, `sp-btn-shine`), Noto Sans Thai/Lao stacks, `prefers-reduced-motion`. Imported in `SellpageRenderer.tsx`. |
| B12 Viewports | Verified 390 / 768 / 1440 in `viewports.ts`. |

### Pending for Agent B

B8/B9 Builder UI · B11 responsive per-breakpoint props.

## Next exact task

Agent A + C: integration testing / QA, then Media Library (Phase 8).

## Known gaps / debt

- Block render tests cover Image and Button in depth; Hero, Stats, Alert,
  SocialButton and Container only have the "renders with defaultProps" smoke test.
- Media library (Phase 8) not started; `storage.rules` is ready for it.
- Tracking pixel ids are stored in settings but not yet emitted publicly.
- `restoreVersion` migrates a snapshot's `config`; theme/seo/settings restore
  as-is (no migration steps exist for them yet).
