import { toPublicDocument } from '../schemas/publicProjection'
import type { PublicSellpageDocument, SellpageDocument, SellpageVersion } from '../schemas/sellpage.types'

export type { SellpageVersion }

/**
 * Storage is behind this interface so the service layer, builder and
 * public renderer never call a database directly. Swapping the
 * localStorage adapter below for a Firestore adapter is a one-file change:
 * implement this interface and pass it to setSellpageStorageAdapter().
 *
 * Every adapter keeps TWO records per page: the admin document, and the
 * public projection built from its published half (see
 * `schemas/publicProjection.ts`). Only the projection is ever readable by a
 * visitor, which is what keeps a draft out of public reach.
 */
export interface SellpageStorageAdapter {
  list(): Promise<SellpageDocument[]>
  get(id: string): Promise<SellpageDocument | null>
  /** Admin-side lookup: finds a page whatever its status (slug uniqueness, editing). */
  getBySlug(slug: string): Promise<SellpageDocument | null>
  /**
   * The public route's only read. Returns the projection, not the page —
   * a visitor never touches the admin document at all, so there is no draft
   * for a bug in this layer to expose.
   */
  getPublicBySlug(slug: string): Promise<PublicSellpageDocument | null>
  /**
   * Writes the admin document AND reconciles its public projection —
   * atomically, in one commit.
   *
   * Reconciling here rather than at the call sites is deliberate: publish,
   * unpublish, rename, a slug change and every draft autosave all end up in
   * this one method, so none of them can forget. An adapter that writes the
   * two records separately can leave yesterday's page live at an old slug
   * after a crash, which is the failure this replaced.
   */
  save(doc: SellpageDocument): Promise<void>
  /** Removes the page, its versions and its public projection. */
  remove(id: string): Promise<void>
  listVersions(pageId: string): Promise<SellpageVersion[]>
  saveVersion(version: SellpageVersion): Promise<void>
}

const STORAGE_KEY = 'market2u:sellpages:v1'
const VERSIONS_KEY = 'market2u:sellpage-versions:v1'
/** Public projections, keyed by slug — the same split the Firestore adapter makes. */
const PUBLIC_KEY = 'market2u:sellpages-public:v1'

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

const readPublic = (): Record<string, PublicSellpageDocument> => {
  try {
    const raw = localStorage.getItem(PUBLIC_KEY)
    return raw ? (JSON.parse(raw) as Record<string, PublicSellpageDocument>) : {}
  } catch {
    return {}
  }
}

const writePublic = (docs: Record<string, PublicSellpageDocument>) => {
  localStorage.setItem(PUBLIC_KEY, JSON.stringify(docs))
}

/**
 * Brings the public projections in line with one saved page.
 *
 * Shared by both adapters in spirit: drop the entry at the slug the page used
 * to have (a rename would otherwise leave the old URL serving the old copy),
 * then write or delete the entry at the current slug.
 */
const reconcilePublic = (doc: SellpageDocument, previousSlug: string | null) => {
  const all = readPublic()
  if (previousSlug !== null && previousSlug !== doc.slug) delete all[previousSlug]

  const projection = toPublicDocument(doc)
  if (projection) all[doc.slug] = projection
  else delete all[doc.slug]

  writePublic(all)
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
  async getPublicBySlug(slug) {
    return readPublic()[slug] ?? null
  },
  async save(doc) {
    const all = readAll()
    const previousSlug = all[doc.id]?.slug ?? null
    all[doc.id] = doc
    writeAll(all)
    reconcilePublic(doc, previousSlug)
  },
  async remove(id) {
    const all = readAll()
    const removed = all[id]
    delete all[id]
    writeAll(all)
    writeVersions(readVersions().filter((v) => v.pageId !== id))
    if (removed) {
      const publicDocs = readPublic()
      delete publicDocs[removed.slug]
      writePublic(publicDocs)
    }
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
