# Sellpage deployment

Use project `market2u-b5f15`. Never put an Admin SDK service-account key in
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

Enable Authentication > Sign-in method > Google for `market2u-b5f15`. Confirm
the production domain is in Authentication > Authorized domains.

## 3. Grant the first admin

Create or obtain a service-account JSON outside the repository. Put its JSON
in a process-scoped environment variable, identify exactly one Firebase Auth
user, then run the script:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content -Raw 'C:\secure\market2u-service-account.json'
$env:ADMIN_EMAIL = 'admin@example.com'
npm run grant-admin
Remove-Item Env:FIREBASE_SERVICE_ACCOUNT_JSON
Remove-Item Env:ADMIN_EMAIL
```

`ADMIN_UID` may be used instead of `ADMIN_EMAIL`. The script reads credentials
only from `FIREBASE_SERVICE_ACCOUNT_JSON`; it accepts no credential path or
credential command-line argument. The user must sign out and back in after the
claim changes.

## 4. Deploy rules before the web app

```powershell
npx firebase-tools login
npx firebase-tools use market2u-b5f15
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project market2u-b5f15
```

Rules go first so a newly deployed admin cannot write through stale access
controls. Do not continue unless this command succeeds.

## 5. Build with production web configuration

Set the public `VITE_FIREBASE_*` values in `.env.local` or the CI environment,
then rebuild. These web-app values are identifiers, not Admin SDK credentials.

```powershell
npx vite build
```

## 6. Deploy hosting

```powershell
npx firebase-tools deploy --only hosting --project market2u-b5f15
```

After deployment, sign in as the claimed admin and verify: create a page,
upload an image, publish, open `/s/:slug` in a signed-out browser, edit the
draft, and confirm the public page remains unchanged until republished.
