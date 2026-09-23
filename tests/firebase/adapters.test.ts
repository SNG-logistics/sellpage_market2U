import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createEmptyData, defaultSeo, defaultSettings, defaultTheme, type SellpageDocument, type SellpageVersion } from '../../src/features/sellpage/schemas/sellpage.types'

let db: Firestore
let storage: FirebaseStorage

vi.mock('../../src/lib/firebase', () => ({
  getDb: () => db,
  getFirebaseStorage: () => storage,
}))

import { firebaseMediaAdapter } from '../../src/features/sellpage/services/firebaseMediaAdapter'
import { firestoreAdapter } from '../../src/features/sellpage/services/firestoreAdapter'

const projectId = 'market2u-sellpage-test'
let env: RulesTestEnvironment

const makePage = (id: string, updatedAt = 1): SellpageDocument => ({
  id,
  name: `Page ${id}`,
  slug: `page-${id}`,
  status: 'draft',
  schemaVersion: 1,
  draftConfig: createEmptyData(),
  draftTheme: defaultTheme(),
  draftSeo: defaultSeo(),
  draftSettings: defaultSettings(),
  publishedConfig: null,
  publishedTheme: null,
  publishedSeo: null,
  publishedSettings: null,
  createdAt: 1,
  updatedAt,
  publishedAt: null,
  createdBy: 'admin',
  updatedBy: 'admin',
})

const makeVersion = (pageId: string, id: string, version: number): SellpageVersion => ({
  id,
  pageId,
  version,
  timestamp: version,
  user: 'admin',
  schemaVersion: 1,
  config: createEmptyData(),
  theme: defaultTheme(),
  seo: defaultSeo(),
  settings: defaultSettings(),
})

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile(resolve('firestore.rules'), 'utf8') },
    storage: { rules: await readFile(resolve('storage.rules'), 'utf8') },
  })
  const admin = env.authenticatedContext('admin', { admin: true })
  db = admin.firestore()
  storage = admin.storage()
})

afterEach(async () => {
  await env.clearFirestore()
  await env.clearStorage()
})

afterAll(async () => {
  await env.cleanup()
})

describe('firestoreAdapter emulator round-trip', () => {
  it('saves, gets, queries, lists, updates, and removes pages', async () => {
    const first = makePage('one', 10)
    const second = makePage('two', 20)
    await firestoreAdapter.save(first)
    await firestoreAdapter.save(second)

    expect(await firestoreAdapter.get('one')).toEqual(first)
    expect(await firestoreAdapter.get('missing')).toBeNull()
    expect(await firestoreAdapter.getBySlug('page-two')).toEqual(second)
    expect((await firestoreAdapter.list()).map((page) => page.id)).toEqual(['two', 'one'])

    const changed = { ...first, name: 'Changed', updatedAt: 30 }
    await firestoreAdapter.save(changed)
    expect(await firestoreAdapter.get('one')).toEqual(changed)

    await firestoreAdapter.remove('one')
    expect(await firestoreAdapter.get('one')).toBeNull()
  })

  it('publishes a projection with no draft in it, and drops it again on unpublish', async () => {
    const draft = makePage('proj')
    await firestoreAdapter.save(draft)
    // Nothing public exists for a page that has never gone live.
    expect(await firestoreAdapter.getPublicBySlug('page-proj')).toBeNull()

    const live = { ...draft, status: 'published' as const, publishedConfig: createEmptyData(), publishedAt: 5 }
    await firestoreAdapter.save(live)

    const projection = await firestoreAdapter.getPublicBySlug('page-proj')
    expect(projection).toMatchObject({ pageId: 'proj', slug: 'page-proj', publishedAt: 5 })
    expect(JSON.stringify(projection)).not.toContain('draft')

    await firestoreAdapter.save({ ...live, status: 'unpublished' })
    expect(await firestoreAdapter.getPublicBySlug('page-proj')).toBeNull()
  })

  it('moves the projection with the slug and deletes it with the page', async () => {
    const live = { ...makePage('moved'), status: 'published' as const, publishedConfig: createEmptyData(), publishedAt: 5 }
    await firestoreAdapter.save(live)
    await firestoreAdapter.save({ ...live, slug: 'page-moved-2' })

    // The old address must stop serving: a stale projection there would keep
    // the page alive at a URL the admin believes they retired.
    expect(await firestoreAdapter.getPublicBySlug('page-moved')).toBeNull()
    expect(await firestoreAdapter.getPublicBySlug('page-moved-2')).not.toBeNull()

    await firestoreAdapter.remove('moved')
    expect(await firestoreAdapter.getPublicBySlug('page-moved-2')).toBeNull()
  })

  it('round-trips versions newest-first and removes them with their page', async () => {
    await firestoreAdapter.save(makePage('versions'))
    await firestoreAdapter.saveVersion(makeVersion('versions', 'v1', 1))
    await firestoreAdapter.saveVersion(makeVersion('versions', 'v2', 2))

    expect((await firestoreAdapter.listVersions('versions')).map((version) => version.id)).toEqual(['v2', 'v1'])
    await firestoreAdapter.remove('versions')
    expect(await firestoreAdapter.listVersions('versions')).toEqual([])
  })
})

describe('firebaseMediaAdapter emulator round-trip', () => {
  it('uploads with metadata and progress, lists the item, and removes it', async () => {
    const progress: number[] = []
    const file = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })

    const uploaded = await firebaseMediaAdapter.upload('page1', 'image.png', file, (fraction) => progress.push(fraction))
    expect(uploaded).toMatchObject({
      name: 'image.png',
      path: 'sellpages/page1/image.png',
      size: 4,
      contentType: 'image/png',
    })
    expect(uploaded.url).toContain('sellpages%2Fpage1%2Fimage.png')
    expect(progress.at(-1)).toBe(1)

    const listed = await firebaseMediaAdapter.list('page1')
    expect(listed).toHaveLength(1)
    expect(listed[0]).toMatchObject({ name: uploaded.name, path: uploaded.path, size: uploaded.size, contentType: uploaded.contentType })

    await firebaseMediaAdapter.remove(uploaded.path)
    expect(await firebaseMediaAdapter.list('page1')).toEqual([])
  })
})
