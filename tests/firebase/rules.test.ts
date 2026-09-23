import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { PUBLIC_DOCUMENT_KEYS } from '../../src/features/sellpage/schemas/publicProjection'

const projectId = 'market2u-sellpage-test'
let env: RulesTestEnvironment

const publishedPage = (id: string) => ({
  id,
  name: 'Published',
  slug: `published-${id}`,
  status: 'published',
  schemaVersion: 1,
  publishedConfig: { root: { props: {} }, content: [], zones: {} },
  draftConfig: { root: { props: { title: 'SECRET unpublished draft' } }, content: [], zones: {} },
})

const draftPage = (id: string) => ({ ...publishedPage(id), name: 'Draft', slug: `draft-${id}`, status: 'draft', publishedConfig: null })

/** A projection of the above, as `toPublicDocument` builds it. */
const publicPage = (slug: string) => ({
  pageId: 'live',
  slug,
  name: 'Published',
  schemaVersion: 1,
  config: { root: { props: {} }, content: [], zones: {} },
  theme: null,
  seo: null,
  settings: null,
  publishedAt: 1,
})

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(resolve('firestore.rules'), 'utf8') },
    storage: { rules: await readFile(resolve('storage.rules'), 'utf8') },
  })
})

afterEach(async () => {
  await env.clearFirestore()
  await env.clearStorage()
})

afterAll(async () => {
  await env.cleanup()
})

const seedPage = async (id: string, value: Record<string, unknown>) => {
  await env.withSecurityRulesDisabled((context) => setDoc(doc(context.firestore(), 'sellpages', id), value))
}

const seedPublic = async (slug: string, value: Record<string, unknown> = publicPage(slug)) => {
  await env.withSecurityRulesDisabled((context) => setDoc(doc(context.firestore(), 'publicPages', slug), value))
}

describe('firestore.rules', () => {
  it('keeps every sellpages document away from anonymous and non-admin users', async () => {
    await seedPage('live', publishedPage('live'))
    await seedPage('draft', draftPage('draft'))

    // Published or not: this collection holds the draft, and a read returns
    // whole documents. There is nothing here a visitor may have.
    for (const db of [env.unauthenticatedContext().firestore(), env.authenticatedContext('reader').firestore()]) {
      await assertFails(getDoc(doc(db, 'sellpages/live')))
      await assertFails(getDoc(doc(db, 'sellpages/draft')))
      await assertFails(getDocs(collection(db, 'sellpages')))
      await assertFails(getDocs(query(collection(db, 'sellpages'), where('status', '==', 'published'))))
    }
  })

  it('serves one public page to anyone and refuses the catalogue', async () => {
    await seedPublic('published-live')

    for (const db of [env.unauthenticatedContext().firestore(), env.authenticatedContext('reader').firestore()]) {
      // Exactly the read firestoreAdapter.getPublicBySlug performs.
      await assertSucceeds(getDoc(doc(db, 'publicPages/published-live')))
      // Listing would hand over every live page in one request; rendering a
      // page never needs it.
      await assertFails(getDocs(collection(db, 'publicPages')))
    }
  })

  it('does not expose draft content to an anonymous reader of a live page', async () => {
    await seedPage('live', publishedPage('live'))
    await seedPublic('published-live')

    const snapshot = await getDoc(doc(env.unauthenticatedContext().firestore(), 'publicPages/published-live'))

    // This was the known gap: a published page used to hand over its whole
    // document. It is closed by the document a visitor reaches never having
    // held the draft, not by a rule filtering fields — rules cannot.
    expect(snapshot.data()).not.toHaveProperty('draftConfig')
    expect(JSON.stringify(snapshot.data())).not.toContain('SECRET')
  })

  it('refuses a public document carrying anything outside the projection', async () => {
    const db = env.authenticatedContext('admin', { admin: true }).firestore()

    // The browser assembles the projection, so this is the enforcement that
    // matters: a compromised or buggy client cannot publish the draft.
    await assertFails(setDoc(doc(db, 'publicPages/leaky'), { ...publicPage('leaky'), draftConfig: { content: [] } }))
    // A missing field is refused too, so a half-written document cannot sit
    // where a page should be.
    await assertFails(setDoc(doc(db, 'publicPages/partial'), { slug: 'partial', name: 'Partial' }))
    // The slug is the document id; a mismatch would make the page
    // unreachable at the address it claims.
    await assertFails(setDoc(doc(db, 'publicPages/mismatch'), publicPage('other-slug')))

    await assertSucceeds(setDoc(doc(db, 'publicPages/clean'), publicPage('clean')))
    await assertSucceeds(deleteDoc(doc(db, 'publicPages/clean')))
  })

  it('pins the rule to PUBLIC_DOCUMENT_KEYS so the two cannot drift apart', async () => {
    const rules = await readFile(resolve('firestore.rules'), 'utf8')
    const listed = rules.match(/function publicKeys\(\) \{\s*return \[(.*?)\];/s)?.[1]

    expect(listed).toBeDefined()
    const inRules = [...listed!.matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(inRules.sort()).toEqual([...PUBLIC_DOCUMENT_KEYS].sort())
  })

  it('denies anonymous and non-admin writes to both collections', async () => {
    await seedPage('live', publishedPage('live'))
    await seedPublic('published-live')

    for (const db of [env.unauthenticatedContext().firestore(), env.authenticatedContext('reader').firestore()]) {
      await assertFails(setDoc(doc(db, 'sellpages/new'), publishedPage('new')))
      await assertFails(setDoc(doc(db, 'sellpages/live'), { ...publishedPage('live'), name: 'Changed' }))
      await assertFails(deleteDoc(doc(db, 'sellpages/live')))
      await assertFails(getDoc(doc(db, 'sellpages/live/versions/v1')))
      await assertFails(setDoc(doc(db, 'sellpages/live/versions/v1'), { version: 1 }))
      // A visitor may read a live page but never change one.
      await assertFails(setDoc(doc(db, 'publicPages/published-live'), publicPage('published-live')))
      await assertFails(deleteDoc(doc(db, 'publicPages/published-live')))
    }
  })

  it('lets admins read, list, create, update, delete, and manage versions', async () => {
    await seedPage('draft', draftPage('draft'))
    const db = env.authenticatedContext('admin', { admin: true }).firestore()

    await assertSucceeds(getDoc(doc(db, 'sellpages/draft')))
    await assertSucceeds(getDocs(collection(db, 'sellpages')))
    await assertSucceeds(setDoc(doc(db, 'sellpages/new'), draftPage('new')))
    await assertSucceeds(setDoc(doc(db, 'sellpages/new'), { ...draftPage('new'), name: 'Changed' }))
    await assertSucceeds(setDoc(doc(db, 'sellpages/new/versions/v1'), { version: 1 }))
    await assertSucceeds(getDoc(doc(db, 'sellpages/new/versions/v1')))
    await assertSucceeds(deleteDoc(doc(db, 'sellpages/new')))
  })

  it('rejects malformed admin creates and identity changes', async () => {
    await seedPage('live', publishedPage('live'))
    const db = env.authenticatedContext('admin', { admin: true }).firestore()

    await assertFails(setDoc(doc(db, 'sellpages/wrong-path'), publishedPage('different-id')))
    await assertFails(setDoc(doc(db, 'sellpages/no-version'), { ...publishedPage('no-version'), schemaVersion: '1' }))
    await assertFails(setDoc(doc(db, 'sellpages/live'), { ...publishedPage('changed-id') }))
  })
})

describe('storage.rules', () => {
  const image = new Uint8Array([137, 80, 78, 71])

  it('allows public reads only inside the sellpage media path', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(ref(context.storage(), 'sellpages/page/image.png'), image, { contentType: 'image/png' })
      await uploadBytes(ref(context.storage(), 'private/image.png'), image, { contentType: 'image/png' })
    })
    for (const storage of [env.unauthenticatedContext().storage(), env.authenticatedContext('reader').storage()]) {
      await assertSucceeds(getBytes(ref(storage, 'sellpages/page/image.png')))
      await assertFails(getBytes(ref(storage, 'private/image.png')))
    }
  })

  it('denies anonymous and non-admin uploads and deletes', async () => {
    await env.withSecurityRulesDisabled((context) =>
      uploadBytes(ref(context.storage(), 'sellpages/page/existing.png'), image, { contentType: 'image/png' }),
    )
    for (const storage of [env.unauthenticatedContext().storage(), env.authenticatedContext('reader').storage()]) {
      await assertFails(uploadBytes(ref(storage, 'sellpages/page/new.png'), image, { contentType: 'image/png' }))
      await assertFails(deleteObject(ref(storage, 'sellpages/page/existing.png')))
    }
  })

  it('allows admins to upload supported images and delete them', async () => {
    const storage = env.authenticatedContext('admin', { admin: true }).storage()
    const file = ref(storage, 'sellpages/page/image.webp')
    await assertSucceeds(uploadBytes(file, image, { contentType: 'image/webp' }))
    await assertSucceeds(deleteObject(file))
  })

  it('rejects wrong types, files of 10 MB or more, and paths outside the page folder', async () => {
    const storage = env.authenticatedContext('admin', { admin: true }).storage()
    await assertFails(uploadBytes(ref(storage, 'sellpages/page/file.txt'), image, { contentType: 'text/plain' }))
    await assertFails(
      uploadBytes(ref(storage, 'sellpages/page/too-large.png'), new Uint8Array(10 * 1024 * 1024), { contentType: 'image/png' }),
    )
    await assertFails(uploadBytes(ref(storage, 'outside/image.png'), image, { contentType: 'image/png' }))
    await assertFails(uploadBytes(ref(storage, 'sellpages/page/nested/image.png'), image, { contentType: 'image/png' }))
  })
})
