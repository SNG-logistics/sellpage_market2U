import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
const adminUid = process.env.ADMIN_UID
const adminEmail = process.env.ADMIN_EMAIL

if (!rawServiceAccount) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required. Pass the service-account JSON through the environment; never commit it.')
}
if ((adminUid ? 1 : 0) + (adminEmail ? 1 : 0) !== 1) {
  throw new Error('Set exactly one of ADMIN_UID or ADMIN_EMAIL.')
}

let serviceAccount
try {
  serviceAccount = JSON.parse(rawServiceAccount)
} catch {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.')
}

const app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth(app)
const user = adminUid ? await auth.getUser(adminUid) : await auth.getUserByEmail(adminEmail)

await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true })
console.log(`Granted admin claim to uid ${user.uid}. The user must sign out and sign in again to refresh their ID token.`)
