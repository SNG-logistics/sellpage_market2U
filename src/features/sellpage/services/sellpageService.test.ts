import { beforeEach, describe, expect, it } from 'vitest'
import type { SellpageDocument } from '../schemas/sellpageSchema'
import { createEmptyData } from '../schemas/sellpageSchema'
import { createPage, duplicatePage, getPageBySlug, publishPage, saveDraft, setSellpageStorageAdapter } from './sellpageService'
import type { SellpageStorageAdapter, SellpageVersion } from './storageAdapter'

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

const withBlock = () => {
  const data = createEmptyData()
  data.content = [{ type: 'Heading', props: { id: 'h1', text: 'Hi' } }] as typeof data.content
  return data
}

describe('sellpageService', () => {
  beforeEach(() => {
    setSellpageStorageAdapter(makeMemoryAdapter())
  })

  it('gives pages created with the same name distinct slugs', async () => {
    const first = await createPage('Summer Sale', null)
    const second = await createPage('Summer Sale', null)

    expect(first.slug).toBe('summer-sale')
    expect(second.slug).not.toBe(first.slug)
    expect(await getPageBySlug(second.slug)).toMatchObject({ id: second.id })
  })

  it('saveDraft never touches publishedConfig', async () => {
    const page = await createPage('Offer', null)
    await saveDraft(page.id, withBlock(), null)
    const published = await publishPage(page.id, null)

    const newDraft = createEmptyData()
    newDraft.content = [{ type: 'Text', props: { id: 't1', content: 'changed' } }] as typeof newDraft.content
    const afterDraft = await saveDraft(page.id, newDraft, null)

    // Public still sees what was published, not the new draft.
    expect(afterDraft.publishedConfig).toEqual(published.publishedConfig)
    expect(afterDraft.publishedConfig).not.toEqual(afterDraft.draftConfig)
  })

  it('publish refuses an empty page and succeeds once a block exists', async () => {
    const page = await createPage('Empty', null)
    await expect(publishPage(page.id, null)).rejects.toThrow(/at least one block/i)

    await saveDraft(page.id, withBlock(), null)
    const published = await publishPage(page.id, null)
    expect(published.status).toBe('published')
    expect(published.publishedAt).toBeTypeOf('number')
  })

  it('increments version numbers across publishes', async () => {
    const page = await createPage('Versioned', null)
    await saveDraft(page.id, withBlock(), null)
    await publishPage(page.id, null)
    await publishPage(page.id, null)

    const { listVersions } = await import('./sellpageService')
    const versions = await listVersions(page.id)
    expect(versions.map((v) => v.version)).toEqual([2, 1])
  })

  it('duplicate gets a fresh id, an unused slug, draft status and no published config', async () => {
    const page = await createPage('Original', null)
    await saveDraft(page.id, withBlock(), null)
    await publishPage(page.id, null)

    const copy = await duplicatePage(page.id, null)
    expect(copy.id).not.toBe(page.id)
    expect(copy.slug).not.toBe(page.slug)
    expect(copy.status).toBe('draft')
    expect(copy.publishedConfig).toBeNull()
    // Deep-copied, not aliased to the original's block tree.
    expect(copy.draftConfig).not.toBe(page.draftConfig)
    expect(copy.draftConfig.content).toEqual(withBlock().content)
  })
})
