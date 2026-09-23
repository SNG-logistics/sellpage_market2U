import { describe, expect, it } from 'vitest'
import { PUBLIC_DOCUMENT_KEYS, samePublicDocument, toPublicDocument } from './publicProjection'
import {
  createEmptyData,
  defaultSeo,
  defaultSettings,
  defaultTheme,
  type SellpageDocument,
} from './sellpage.types'

const page = (overrides: Partial<SellpageDocument> = {}): SellpageDocument => ({
  id: 'page-1',
  name: 'Contact',
  slug: 'contact',
  status: 'published',
  schemaVersion: 1,
  draftConfig: createEmptyData(),
  draftTheme: defaultTheme(),
  draftSeo: { ...defaultSeo(), title: 'DRAFT ONLY' },
  draftSettings: defaultSettings(),
  publishedConfig: createEmptyData(),
  publishedTheme: defaultTheme(),
  publishedSeo: defaultSeo(),
  publishedSettings: defaultSettings(),
  createdAt: 1,
  updatedAt: 2,
  publishedAt: 3,
  createdBy: 'admin-uid',
  updatedBy: 'admin-uid',
  ...overrides,
})

describe('toPublicDocument', () => {
  it('carries the published half and nothing else', () => {
    const projection = toPublicDocument(page())

    expect(projection).toEqual({
      pageId: 'page-1',
      slug: 'contact',
      name: 'Contact',
      schemaVersion: 1,
      config: createEmptyData(),
      theme: defaultTheme(),
      seo: defaultSeo(),
      settings: defaultSettings(),
      publishedAt: 3,
    })
  })

  it('leaves out every draft field and the author ids', () => {
    // The assertion that matters: this object is served to anyone with the
    // URL. `toEqual` above would also catch a leak, but this says why.
    const serialised = JSON.stringify(toPublicDocument(page()))

    for (const secret of ['draftConfig', 'draftTheme', 'draftSeo', 'draftSettings', 'DRAFT ONLY', 'createdBy', 'admin-uid']) {
      expect(serialised).not.toContain(secret)
    }
  })

  it('returns null for a page that is not live, so no document is stored for it', () => {
    expect(toPublicDocument(page({ status: 'draft', publishedConfig: null }))).toBeNull()
    expect(toPublicDocument(page({ status: 'unpublished' }))).toBeNull()
    // Published but never given a config: publishPage writes both together,
    // so this is only reachable through corrupted data.
    expect(toPublicDocument(page({ publishedConfig: null }))).toBeNull()
  })

  it('keeps nulls from a page published before theme/seo/settings existed', () => {
    const projection = toPublicDocument(page({ publishedTheme: null, publishedSeo: null, publishedSettings: null }))

    // Not filled in from the draft, and not invented here — the public route
    // substitutes its own defaults at render time.
    expect(projection).toMatchObject({ theme: null, seo: null, settings: null })
  })

  it('lists exactly the keys it produces', () => {
    // PUBLIC_DOCUMENT_KEYS is what firestore.rules pins the document to. If
    // the two fall out of step, a legitimate write starts being rejected.
    expect(Object.keys(toPublicDocument(page())!).sort()).toEqual([...PUBLIC_DOCUMENT_KEYS].sort())
  })
})

describe('samePublicDocument', () => {
  it('ignores changes that stay in the draft', () => {
    const before = toPublicDocument(page())
    const after = toPublicDocument(page({ draftConfig: { ...createEmptyData(), zones: { a: [] } }, updatedAt: 999 }))

    expect(samePublicDocument(before, after)).toBe(true)
  })

  it('notices a change to what was published', () => {
    const before = toPublicDocument(page())
    const after = toPublicDocument(page({ name: 'Renamed' }))

    expect(samePublicDocument(before, after)).toBe(false)
    expect(samePublicDocument(before, null)).toBe(false)
    expect(samePublicDocument(null, null)).toBe(true)
  })
})
