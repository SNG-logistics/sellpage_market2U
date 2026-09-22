import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyData, type SellpageData, type SellpageDocument, type SellpageVersion } from '../schemas/sellpage.types'
import {
  changeSlug,
  createPage,
  duplicatePage,
  getPublishedPageBySlug,
  getVersions,
  publishPage,
  restoreVersion,
  saveDraft,
  saveDraftTheme,
  setSellpageStorageAdapter,
  unpublishPage,
} from './sellpageService'
import type { SellpageStorageAdapter } from './storageAdapter'

/** In-memory adapter so the service layer is tested without touching localStorage. */
const makeMemoryAdapter = (): SellpageStorageAdapter => {
  const docs = new Map<string, SellpageDocument>()
  const versions: SellpageVersion[] = []
  return {
    async list() {
      return [...docs.values()]
    },
    async get(id) {
      return docs.get(id) ?? null
    },
    async getBySlug(slug) {
      return [...docs.values()].find((d) => d.slug === slug) ?? null
    },
    async getPublishedBySlug(slug) {
      // Mirrors the real adapters: the status filter is part of the lookup,
      // so a service that used getBySlug here would be caught by these tests.
      return [...docs.values()].find((d) => d.slug === slug && d.status === 'published') ?? null
    },
    async save(doc) {
      docs.set(doc.id, doc)
    },
    async remove(id) {
      docs.delete(id)
    },
    async listVersions(pageId) {
      return versions.filter((v) => v.pageId === pageId).sort((a, b) => b.version - a.version)
    },
    async saveVersion(version) {
      versions.push(version)
    },
  }
}

const dataWith = (type: 'Heading' | 'Text', id: string, text: string): SellpageData => {
  const data = createEmptyData()
  data.content = [{ type, props: { id, ...(type === 'Heading' ? { text } : { content: text }) } }] as typeof data.content
  return data
}

describe('sellpageService', () => {
  beforeEach(() => {
    setSellpageStorageAdapter(makeMemoryAdapter())
  })

  describe('slugs', () => {
    it('gives pages created with the same name distinct slugs', async () => {
      const first = await createPage('Summer Sale', null)
      const second = await createPage('Summer Sale', null)

      expect(first.slug).toBe('summer-sale')
      expect(second.slug).not.toBe(first.slug)
    })

    it('keeps slugs unique when one is changed, ignoring the page itself', async () => {
      const first = await createPage('Alpha', null)
      const second = await createPage('Beta', null)

      const renamed = await changeSlug(second.id, 'alpha', null)
      expect(renamed.slug).not.toBe(first.slug)

      // Re-applying a page's own slug must not append a suffix.
      const unchanged = await changeSlug(first.id, 'alpha', null)
      expect(unchanged.slug).toBe('alpha')
    })
  })

  describe('draft / published separation', () => {
    it('saveDraft never touches any published field', async () => {
      const page = await createPage('Offer', null)
      await saveDraft(page.id, dataWith('Heading', 'h1', 'Published'), null)
      const published = await publishPage(page.id, null)

      const after = await saveDraft(page.id, dataWith('Text', 't1', 'Draft only'), null)

      expect(after.publishedConfig).toEqual(published.publishedConfig)
      expect(after.publishedConfig).not.toEqual(after.draftConfig)
    })

    it('theme edits stay in the draft until publish copies them across', async () => {
      const page = await createPage('Themed', null)
      await saveDraft(page.id, dataWith('Heading', 'h1', 'Hi'), null)
      await publishPage(page.id, null)

      const themed = await saveDraftTheme(page.id, { ...page.draftTheme, background: '#000000' }, null)
      expect(themed.draftTheme.background).toBe('#000000')
      expect(themed.publishedTheme?.background).toBe(page.draftTheme.background)

      const republished = await publishPage(page.id, null)
      expect(republished.publishedTheme?.background).toBe('#000000')
    })

    it('the public lookup returns published data and never the draft', async () => {
      const page = await createPage('Public', null)
      await saveDraft(page.id, dataWith('Heading', 'h1', 'Live copy'), null)
      await publishPage(page.id, null)
      await saveDraft(page.id, dataWith('Text', 't1', 'Unpublished edit'), null)

      const result = await getPublishedPageBySlug(page.slug)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.page.data.content[0].type).toBe('Heading')
      }
    })

    it('an unpublished page is not served publicly', async () => {
      const page = await createPage('Offline', null)
      await saveDraft(page.id, dataWith('Heading', 'h1', 'Hi'), null)
      await publishPage(page.id, null)
      await unpublishPage(page.id, null)

      const result = await getPublishedPageBySlug(page.slug)
      expect(result).toEqual({ ok: false, reason: 'missing' })
    })

    it('a page that was never published reports missing, not a blank render', async () => {
      const page = await createPage('Never', null)
      const result = await getPublishedPageBySlug(page.slug)
      expect(result).toEqual({ ok: false, reason: 'missing' })
    })
  })

  describe('publish validation', () => {
    it('refuses an empty page and succeeds once a block exists', async () => {
      const page = await createPage('Empty', null)
      await expect(publishPage(page.id, null)).rejects.toThrow(/at least one block/i)

      await saveDraft(page.id, dataWith('Heading', 'h1', 'Hi'), null)
      const published = await publishPage(page.id, null)
      expect(published.status).toBe('published')
      expect(published.publishedAt).toBeTypeOf('number')
    })
  })

  describe('versions', () => {
    it('snapshots each publish with an incrementing version and the schema version', async () => {
      const page = await createPage('Versioned', null)
      await saveDraft(page.id, dataWith('Heading', 'h1', 'v1'), null)
      await publishPage(page.id, null)
      await saveDraft(page.id, dataWith('Heading', 'h1', 'v2'), null)
      await publishPage(page.id, null)

      const versions = await getVersions(page.id)
      expect(versions.map((v) => v.version)).toEqual([2, 1])
      expect(versions[0].schemaVersion).toBe(page.schemaVersion)
      expect(versions[0].theme).toBeDefined()
    })

    it('restore writes to the DRAFT only — the public page is unchanged until republish', async () => {
      const page = await createPage('Restorable', null)
      await saveDraft(page.id, dataWith('Heading', 'h1', 'first'), null)
      await publishPage(page.id, null)
      await saveDraft(page.id, dataWith('Text', 't1', 'second'), null)
      await publishPage(page.id, null)

      const [, first] = await getVersions(page.id) // oldest of the two
      const restored = await restoreVersion(page.id, first.id, null)

      expect(restored.draftConfig.content[0].type).toBe('Heading')
      // Still serving the most recently published content.
      expect(restored.publishedConfig?.content[0].type).toBe('Text')

      const publicView = await getPublishedPageBySlug(page.slug)
      expect(publicView.ok && publicView.page.data.content[0].type).toBe('Text')
    })
  })

  describe('duplicate', () => {
    it('gets a fresh id, an unused slug, draft status and no published state', async () => {
      const page = await createPage('Original', null)
      await saveDraft(page.id, dataWith('Heading', 'h1', 'Hi'), null)
      const publishedOriginal = await publishPage(page.id, null)

      const copy = await duplicatePage(page.id, null)
      expect(copy.id).not.toBe(page.id)
      expect(copy.slug).not.toBe(publishedOriginal.slug)
      expect(copy.status).toBe('draft')
      expect(copy.publishedConfig).toBeNull()
      expect(copy.publishedTheme).toBeNull()
      // Deep-copied, not aliased to the original's block tree.
      expect(copy.draftConfig).not.toBe(publishedOriginal.draftConfig)
      expect(copy.draftConfig.content[0].type).toBe('Heading')
    })
  })
})
