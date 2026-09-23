import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MEDIA_MAX_BYTES,
  buildMediaFileName,
  deleteMedia,
  findMediaUsage,
  isMediaLibraryAvailable,
  listMedia,
  setMediaStorageAdapter,
  uploadMedia,
  validateMediaFile,
  type MediaItem,
  type MediaStorageAdapter,
} from './mediaService'
import type { SellpageData } from '../schemas/sellpage.types'

// Vitest loads `.env.local`, so without this the "no Firebase" cases would
// pass or fail depending on whose machine runs them.
vi.mock('../../../lib/firebaseConfig', () => ({ isFirebaseConfigured: () => false, isStorageConfigured: () => false }))

const item = (name: string, updatedAt = 0): MediaItem => ({
  name,
  path: `sellpages/page-1/${name}`,
  url: `https://storage.example/${name}?alt=media&token=abc`,
  size: 1024,
  contentType: 'image/png',
  updatedAt,
})

const configWith = (src: string) =>
  ({ root: { props: {} }, content: [{ type: 'Image', props: { id: 'Image-1', src } }] }) as unknown as SellpageData

const fakeAdapter = (items: MediaItem[] = []): MediaStorageAdapter & { removed: string[] } => {
  const removed: string[] = []
  return {
    removed,
    list: vi.fn(async () => items),
    upload: vi.fn(async (pageId, fileName) => ({ ...item(fileName), path: `sellpages/${pageId}/${fileName}` })),
    remove: vi.fn(async (path) => {
      removed.push(path)
    }),
  }
}

afterEach(() => setMediaStorageAdapter(null))

describe('validateMediaFile', () => {
  it('accepts the image types storage.rules accepts', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']) {
      expect(validateMediaFile({ type, size: 1000 })).toBeNull()
    }
  })

  it('rejects non-images, including ones disguised by file name', () => {
    expect(validateMediaFile({ type: 'text/html', size: 1000 })).toMatch(/Only PNG/)
    expect(validateMediaFile({ type: 'application/pdf', size: 1000 })).toMatch(/Only PNG/)
    expect(validateMediaFile({ type: '', size: 1000 })).toMatch(/Only PNG/)
  })

  it('rejects empty files and files at or over the 10 MB rule', () => {
    expect(validateMediaFile({ type: 'image/png', size: 0 })).toMatch(/empty/)
    expect(validateMediaFile({ type: 'image/png', size: MEDIA_MAX_BYTES })).toMatch(/10 MB/)
    expect(validateMediaFile({ type: 'image/png', size: MEDIA_MAX_BYTES - 1 })).toBeNull()
  })
})

describe('buildMediaFileName', () => {
  it('keeps only url-safe characters from the original name', () => {
    const name = buildMediaFileName('Summer SALE (final) v2.PNG', 'image/png', 1, 0)
    expect(name).toMatch(/^[a-z0-9]+-summer-sale-final-v2\.png$/)
  })

  it('takes the extension from the MIME type, not from the name', () => {
    expect(buildMediaFileName('photo.exe', 'image/jpeg', 1, 0)).toMatch(/-photo\.jpg$/)
  })

  it('cannot be steered out of the folder', () => {
    const name = buildMediaFileName('../../other-page/x.png', 'image/png', 1, 0)
    expect(name).not.toContain('/')
    expect(name).not.toContain('..')
  })

  it('still produces a name for Thai and Lao file names', () => {
    expect(buildMediaFileName('โปรโมชั่น.jpg', 'image/jpeg', 1, 0)).toMatch(/-image\.jpg$/)
  })

  it('does not collide when the same file is uploaded twice', () => {
    expect(buildMediaFileName('a.png', 'image/png', 1000, 0.1)).not.toBe(buildMediaFileName('a.png', 'image/png', 1001, 0.1))
    expect(buildMediaFileName('a.png', 'image/png', 1000, 0.1)).not.toBe(buildMediaFileName('a.png', 'image/png', 1000, 0.2))
  })
})

describe('findMediaUsage', () => {
  const url = item('a.png').url

  it('reports published ahead of draft', () => {
    expect(findMediaUsage(url, { draftConfig: configWith(url), publishedConfig: configWith(url) })).toBe('published')
    expect(findMediaUsage(url, { draftConfig: configWith(url), publishedConfig: null })).toBe('draft')
    expect(findMediaUsage(url, { draftConfig: configWith('https://x.example/other.png'), publishedConfig: null })).toBeNull()
  })

  it('finds a URL in any prop of any block, nested or not', () => {
    const nested = {
      root: { props: {} },
      content: [{ type: 'Container', props: { id: 'c', content: [{ type: 'Hero', props: { id: 'h', backgroundImage: url } }] } }],
    } as unknown as SellpageData
    expect(findMediaUsage(url, { draftConfig: nested, publishedConfig: null })).toBe('draft')
  })

  it('never matches an empty URL', () => {
    expect(findMediaUsage('', { draftConfig: configWith(''), publishedConfig: null })).toBeNull()
  })
})

describe('with an adapter', () => {
  let adapter: ReturnType<typeof fakeAdapter>
  const unused = { draftConfig: configWith(''), publishedConfig: null }

  beforeEach(() => {
    adapter = fakeAdapter([item('old.png', 1), item('new.png', 2)])
    setMediaStorageAdapter(adapter)
  })

  it('is available', () => {
    expect(isMediaLibraryAvailable()).toBe(true)
  })

  it('lists newest first', async () => {
    expect((await listMedia('page-1')).map((m) => m.name)).toEqual(['new.png', 'old.png'])
  })

  it('uploads under a generated name, never the raw one', async () => {
    const file = new File(['x'], '../evil name.png', { type: 'image/png' })
    await uploadMedia('page-1', file)
    const [pageId, fileName] = vi.mocked(adapter.upload).mock.calls[0]
    expect(pageId).toBe('page-1')
    expect(fileName).toMatch(/^[a-z0-9]+-evil-name\.png$/)
  })

  it('refuses an invalid file before it reaches storage', async () => {
    await expect(uploadMedia('page-1', new File(['x'], 'page.html', { type: 'text/html' }))).rejects.toThrow(/Only PNG/)
    expect(adapter.upload).not.toHaveBeenCalled()
  })

  it('refuses a page id that is not a plain path segment', async () => {
    await expect(listMedia('../other')).rejects.toThrow(/Invalid page id/)
    await expect(uploadMedia('a/b', new File(['x'], 'a.png', { type: 'image/png' }))).rejects.toThrow(/Invalid page id/)
  })

  it('deletes an unused file', async () => {
    await deleteMedia('page-1', item('old.png'), unused)
    expect(adapter.removed).toEqual(['sellpages/page-1/old.png'])
  })

  it('refuses to delete a file the published or draft page still shows', async () => {
    const target = item('old.png')
    await expect(deleteMedia('page-1', target, { draftConfig: configWith(''), publishedConfig: configWith(target.url) })).rejects.toThrow(/published page/)
    await expect(deleteMedia('page-1', target, { draftConfig: configWith(target.url), publishedConfig: null })).rejects.toThrow(/draft/)
    expect(adapter.removed).toEqual([])
  })

  it("refuses to delete another page's file", async () => {
    await expect(deleteMedia('page-2', item('old.png'), unused)).rejects.toThrow(/does not belong/)
    await expect(deleteMedia('page-1', { ...item('x'), path: 'sellpages/page-1/../page-2/x.png' }, unused)).rejects.toThrow(/does not belong/)
    expect(adapter.removed).toEqual([])
  })
})

describe('without Firebase', () => {
  it('is unavailable, and says what to do instead', async () => {
    expect(isMediaLibraryAvailable()).toBe(false)
    await expect(listMedia('page-1')).rejects.toThrow(/Paste an image URL/)
  })
})
