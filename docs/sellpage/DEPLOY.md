# Sellpage deployment

Use project `sellpage-81ae5`. Never put an Admin SDK service-account key in
`.env`, `.env.local`, command arguments, or this repository.

## 1. Verify locally

```powershell
npm ci
npx playwright install chromium
$env:PATH = 'C:\Program Files\Android\Android Studio\jbr\bin;' + $env:PATH # if java is not already on PATH
npx tsc -b
npm run lint
npm test
npm run test:emulator
npm run test:e2e
npx vite build
```

Do not deploy while any check fails. The emulator suite loads the checked-in
`firestore.rules` and `storage.rules`, and therefore must run before rules are
published.

## 2. Configure Firebase console

Authentication → Sign-in method → enable **Google**. If Authentication has
never been opened for this project, use "Get started" first: without it the
app reports `auth/configuration-not-found`, whatever the provider list shows.

Authentication → Settings → Authorized domains needs `localhost` for local
development and any custom domain. The `*.web.app` and `*.firebaseapp.com`
domains of this project are added automatically.

The sign-in screen names the exact Firebase error code, so work from that
rather than guessing which of these is missing.

## 3. Deploy rules before anything else

```powershell
npx firebase-tools login
npx firebase-tools use sellpage-81ae5
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project sellpage-81ae5
```

Rules go first, before the admin claim and before the site: a project whose
rules have never been deployed is running whatever the console last had, which
may be test-mode "allow all". Granting an admin, or publishing a site that
writes, against those is the one ordering mistake worth avoiding. Do not
continue unless this command succeeds.

## 3b. Storage, and what to do without it

Cloud Storage needs the **Blaze** plan. A project on Spark has no bucket, and
`deploy --only storage` fails before it writes anything — which is why step 3
lists Firestore alone.

Without a bucket, leave `VITE_FIREBASE_STORAGE_BUCKET` **empty**. The console
shows a bucket name before one exists, and setting it puts an upload button in
the editor that can only fail at the end of the upload. Empty, the media
library hides itself and the image field says so.

Images then come from either:

- **`public/`** — a file at `public/images/x.jpg` deploys with the site and is
  referenced as `/images/x.jpg`. Free, same domain, no third party. Hosting
  serves a real file before it applies the SPA rewrite, so this does not
  collide with `/s/:slug`. Adding an image means another build and deploy.
- **any https URL** — pasted into the image field, as the field has always
  accepted.

`storage.rules` stays in the repo, correct and tested, simply not deployed. On
Blaze later: enable Storage, set the bucket variable, rebuild, and run
`npx firebase-tools deploy --only storage --project sellpage-81ae5`. Nothing
else changes.

## 4. Build with production web configuration

Set the public `VITE_FIREBASE_*` values in `.env.local` or the CI environment,
then rebuild. These web-app values are identifiers, not Admin SDK credentials.

Vite inlines them at build time rather than reading them at runtime, so a
change to `.env.local` means another build — redeploying the same `dist/` will
not pick it up.

```powershell
npx vite build
```

## 5. Deploy hosting

```powershell
npx firebase-tools deploy --only hosting --project sellpage-81ae5
```

The site lands on `https://sellpage-81ae5.web.app`. Firebase authorises its own
hosting domains for Auth automatically, so Google sign-in works there without
adding anything to Authorized domains — a custom domain does need adding.

`firebase.json` rewrites every path to `index.html`, which is what makes
`/s/:slug` resolve on a hard refresh rather than 404.

The site is live at this point with **no admin**, which is the safe state to
be in: nobody can write until the next step.

## 6. Grant the first admin

Open the deployed site and sign in with Google once, so Firebase Auth has a
user to grant the claim to. The account lands on "Not authorised" — expected.
Do this on the deployed site rather than `localhost`: Firebase authorises its
own hosting domains for Auth automatically, while `localhost` depends on
what is listed under Authorized domains.

Create or obtain a service-account JSON outside the repository (Firebase
console → Project settings → Service accounts → Generate new private key).
Put its contents in a process-scoped environment variable, name exactly one
Firebase Auth user, then run the script:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content -Raw 'C:\secure\market2u-service-account.json'
$env:ADMIN_EMAIL = 'goldenstargds99@gmail.com'
npm run grant-admin
Remove-Item Env:FIREBASE_SERVICE_ACCOUNT_JSON
Remove-Item Env:ADMIN_EMAIL
```

`ADMIN_UID` may be used instead of `ADMIN_EMAIL`. The script reads credentials
only from `FIREBASE_SERVICE_ACCOUNT_JSON`; it accepts no credential path and no
credential argument, so the key never reaches a shell history or a process
list. **Sign out and back in afterwards** — a claim only reaches the app on a
freshly minted ID token.

## 7. Verify on the deployed site

Signed in as the claimed admin: create a page, upload an image, publish, then
open `/s/:slug` in a signed-out browser or a private window. Edit the draft and
confirm the public page stays unchanged until you publish again. That last
check is the one that proves draft and published are really separate.

## Rolling back

`firebase-tools` keeps previous hosting releases. In the console, Hosting →
Release history → the three-dot menu on an earlier release → Rollback. This
reverts the site only: **rules and Firestore data do not roll back with it**,
so a release that also changed rules needs those redeployed from the matching
commit.

## What a visitor can reach

Only `publicPages/{slug}` — one document per live page, holding the published
half and nothing else. `sellpages`, which holds the draft, is admin-only in
both directions.

Worth knowing before the first publish:

- **Unpublishing deletes the public document**, so the page stops being
  readable rather than merely stopping being linked.
- **Renaming a slug retires the old URL.** The projection moves; anything
  pointing at the previous address gets the fallback page.
- The `publishedConfig` a visitor receives is whatever was live at the last
  publish. Draft edits after that are not in the document they can fetch —
  verify this yourself with step 7 rather than taking it on trust.

To check on the deployed site: open `/s/:slug` in a private window, DevTools →
Network. The only Firestore read should be `publicPages`, and its response
should not contain the string `draftConfig`.
