import type { SellpageDocument, SellpageVersion } from '../schemas/sellpage.types'

export type { SellpageVersion }

/**
 * Storage is behind this interface so the service layer, builder and
 * public renderer never call a database directly. Swapping the
 * localStorage adapter below for a Firestore adapter is a one-file change:
 * implement this interface and pass it to setSellpageStorageAdapter().
 */
export interface SellpageStorageAdapter {
  list(): Promise<SellpageDocument[]>
  get(id: string): Promise<SellpageDocument | null>
  /** Admin-side lookup: finds a page whatever its status (slug uniqueness, editing). */
  getBySlug(slug: string): Promise<SellpageDocument | null>
  /**
   * The public route's lookup, separate from `getBySlug` because it is the
   * only read a visitor performs. A backend's access rules have to be able to
   * prove the query returns published pages only, which means the constraint
   * belongs in the query — not in a status check after the fact.
   */
  getPublishedBySlug(slug: string): Promise<SellpageDocument | null>
  save(doc: SellpageDocument): Promise<void>
  remove(id: string): Promise<void>
  listVersions(pageId: string): Promise<SellpageVersion[]>
  saveVersion(version: SellpageVersion): Promise<void>
}

const STORAGE_KEY = 'market2u:sellpages:v1'
const VERSIONS_KEY = 'market2u:sellpage-versions:v1'

const readAll = (): Record<string, SellpageDocument> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, SellpageDocument>) : {}
  } catch {
    return {}
  }
}

const writeAll = (docs: Record<string, SellpageDocument>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

const readVersions = (): SellpageVersion[] => {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY)
    return raw ? (JSON.parse(raw) as SellpageVersion[]) : []
  } catch {
    return []
  }
}

const writeVersions = (versions: SellpageVersion[]) => {
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions))
}

/**
 * Default adapter for local development and demos. Not multi-user safe —
 * replace with a Firestore-backed adapter before shipping the admin to
 * real users (see docs/sellpage/ARCHITECTURE.md).
 */
export const localStorageAdapter: SellpageStorageAdapter = {
  async list() {
    return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt)
  },
  async get(id) {
    return readAll()[id] ?? null
  },
  async getBySlug(slug) {
    return Object.values(readAll()).find((doc) => doc.slug === slug) ?? null
  },
  async getPublishedBySlug(slug) {
    return Object.values(readAll()).find((doc) => doc.slug === slug && doc.status === 'published') ?? null
  },
  async save(doc) {
    const all = readAll()
    all[doc.id] = doc
    writeAll(all)
  },
  async remove(id) {
    const all = readAll()
    delete all[id]
    writeAll(all)
    writeVersions(readVersions().filter((v) => v.pageId !== id))
  },
  async listVersions(pageId) {
    return readVersions()
      .filter((v) => v.pageId === pageId)
      .sort((a, b) => b.version - a.version)
  },
  async saveVersion(version) {
    writeVersions([...readVersions(), version])
  },
}
