// Imports the SDK-free config module on purpose: the image field reaches this
// file from `blocks/`, which the PUBLIC renderer also bundles. The Firebase
// adapter is only ever loaded through the dynamic import below.
import { isFirebaseConfigured } from '../../../lib/firebaseConfig'
import type { SellpageData } from '../schemas/sellpage.types'

export type MediaItem = {
  /** File name within the page's folder. */
  name: string
  /** Full storage path: `sellpages/{pageId}/{name}`. */
  path: string
  /** Public download URL — what gets stored in a block's image prop. */
  url: string
  size: number
  contentType: string
  updatedAt: number
}

/**
 * Media storage sits behind this interface for the same reason page storage
 * does (see storageAdapter.ts): UI never talks to Firebase directly, and tests
 * run against an in-memory adapter.
 */
export interface MediaStorageAdapter {
  list(pageId: string): Promise<MediaItem[]>
  upload(pageId: string, fileName: string, file: Blob, onProgress?: (fraction: number) => void): Promise<MediaItem>
  remove(path: string): Promise<void>
}

// These mirror storage.rules, which is the real control — a client check only
// saves the user a round trip and gives a readable message. Keep them in step.
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024
export const MEDIA_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'] as const

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

let adapter: MediaStorageAdapter | null = null

/** For tests, and for swapping the backend without touching any UI. */
export const setMediaStorageAdapter = (next: MediaStorageAdapter | null) => {
  adapter = next
}

/**
 * False in local mode (no Firebase project): there is nowhere to put a file.
 * The image field still works — it falls back to a pasted URL.
 */
export const isMediaLibraryAvailable = (): boolean => adapter !== null || isFirebaseConfigured()

const getAdapter = async (): Promise<MediaStorageAdapter> => {
  if (adapter) return adapter
  if (!isFirebaseConfigured()) {
    throw new Error('The media library needs Firebase Storage. Paste an image URL instead.')
  }
  // Dynamic import keeps the Firebase SDK out of every bundle that merely
  // renders an image field.
  adapter = (await import('./firebaseMediaAdapter')).firebaseMediaAdapter
  return adapter
}

/** Returns a message the user can act on, or null when the file is acceptable. */
export const validateMediaFile = (file: { type: string; size: number }): string | null => {
  if (!(MEDIA_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return 'Only PNG, JPEG, GIF, WebP and SVG images can be uploaded.'
  }
  if (file.size === 0) return 'That file is empty.'
  if (file.size >= MEDIA_MAX_BYTES) return 'Images must be smaller than 10 MB.'
  return null
}

/**
 * A storage-safe, collision-free file name.
 *
 * The original name is user input and ends up in a URL path, so only
 * [a-z0-9-] survives. Thai and Lao names therefore reduce to nothing, which
 * is fine: the unique prefix is what identifies the file, and the extension
 * comes from the MIME type rather than from whatever the name claimed.
 */
export const buildMediaFileName = (originalName: string, contentType: string, now = Date.now(), random = Math.random()): string => {
  const stem = originalName
    .replace(/\.[^.]*$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const unique = `${now.toString(36)}${Math.floor(random * 36 ** 4).toString(36).padStart(4, '0')}`
  const extension = EXTENSION_BY_TYPE[contentType] ?? 'bin'
  return `${unique}-${stem || 'image'}.${extension}`
}

// Page ids come from our own service, but they are also a path segment here.
const assertPageId = (pageId: string) => {
  if (!/^[A-Za-z0-9_-]+$/.test(pageId)) throw new Error('Invalid page id.')
}

export const mediaFolder = (pageId: string): string => {
  assertPageId(pageId)
  return `sellpages/${pageId}`
}

export const listMedia = async (pageId: string): Promise<MediaItem[]> => {
  assertPageId(pageId)
  const items = await (await getAdapter()).list(pageId)
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt)
}

export const uploadMedia = async (pageId: string, file: File, onProgress?: (fraction: number) => void): Promise<MediaItem> => {
  assertPageId(pageId)
  const problem = validateMediaFile(file)
  if (problem) throw new Error(problem)
  return (await getAdapter()).upload(pageId, buildMediaFileName(file.name, file.type), file, onProgress)
}

export type MediaUsage = 'published' | 'draft' | null

/**
 * Where a media URL is referenced. Published wins: that is the copy visitors
 * are looking at right now.
 */
export const findMediaUsage = (
  url: string,
  configs: { draftConfig: SellpageData | null; publishedConfig: SellpageData | null },
): MediaUsage => {
  if (url === '') return null
  // Block props are plain JSON, so a substring search finds the URL wherever a
  // block keeps it — including blocks added after this was written.
  const holds = (config: SellpageData | null) => config !== null && JSON.stringify(config).includes(JSON.stringify(url).slice(1, -1))
  if (holds(configs.publishedConfig)) return 'published'
  if (holds(configs.draftConfig)) return 'draft'
  return null
}

/**
 * Deletes a file, unless the page still shows it. Storage has no undo, and a
 * deleted file that a published page references is a broken image in front of
 * customers — so that case is refused here rather than left to the UI.
 */
export const deleteMedia = async (
  pageId: string,
  item: Pick<MediaItem, 'path' | 'url'>,
  configs: { draftConfig: SellpageData | null; publishedConfig: SellpageData | null },
): Promise<void> => {
  if (!item.path.startsWith(`${mediaFolder(pageId)}/`) || item.path.includes('..')) {
    throw new Error('That file does not belong to this page.')
  }
  const usage = findMediaUsage(item.url, configs)
  if (usage === 'published') throw new Error('This image is on the published page. Remove it from the page and publish before deleting it.')
  if (usage === 'draft') throw new Error('This image is used in the draft. Remove it from the page before deleting it.')
  await (await getAdapter()).remove(item.path)
}
