import { SELLPAGE_SCHEMA_VERSION, createEmptyData, type SellpageDocument, type SellpageStatus } from '../schemas/sellpageSchema'
import { localStorageAdapter, type SellpageStorageAdapter, type SellpageVersion } from './storageAdapter'

/**
 * All Firestore/localStorage access goes through this module — UI
 * components never call the storage adapter directly (market2u-firebase-publish).
 */
let adapter: SellpageStorageAdapter = localStorageAdapter

/** Swap the storage adapter (e.g. to a Firestore-backed one) without touching callers. */
export const setSellpageStorageAdapter = (next: SellpageStorageAdapter) => {
  adapter = next
}

const genId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sp_${Date.now()}_${Math.random().toString(36).slice(2)}`)

const slugify = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || `page-${Date.now()}`

export const listPages = () => adapter.list()

export const getPage = (id: string) => adapter.get(id)

export const getPageBySlug = (slug: string) => adapter.getBySlug(slug)

export const createPage = async (name: string, userId: string | null): Promise<SellpageDocument> => {
  const now = Date.now()
  const doc: SellpageDocument = {
    id: genId(),
    name,
    slug: slugify(name),
    status: 'draft',
    schemaVersion: SELLPAGE_SCHEMA_VERSION,
    draftConfig: createEmptyData(),
    publishedConfig: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    createdBy: userId,
    updatedBy: userId,
  }
  await adapter.save(doc)
  return doc
}

/** Writes draftConfig ONLY. Never touches publishedConfig — the public page never changes here. */
export const saveDraft = async (id: string, draftConfig: SellpageDocument['draftConfig'], userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const next: SellpageDocument = { ...doc, draftConfig, updatedAt: Date.now(), updatedBy: userId }
  await adapter.save(next)
  return next
}

export type PublishValidation = { ok: true } | { ok: false; errors: string[] }

/** Structural validation before publish. Extend with business rules as blocks grow. */
export const validateForPublish = (doc: SellpageDocument): PublishValidation => {
  const errors: string[] = []
  if (!doc.name.trim()) errors.push('Page name is required.')
  if (!doc.slug.trim()) errors.push('Page slug is required.')
  if (!doc.draftConfig.content || doc.draftConfig.content.length === 0) errors.push('Add at least one block before publishing.')
  return errors.length ? { ok: false, errors } : { ok: true }
}

/**
 * validate -> create version -> draft becomes published -> set publishedAt.
 * This is the only path that changes what the public page renders.
 */
export const publishPage = async (id: string, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)

  const validation = validateForPublish(doc)
  if (!validation.ok) throw new Error(validation.errors.join(' '))

  const now = Date.now()
  const version: SellpageVersion = {
    id: genId(),
    pageId: id,
    version: (await adapter.listVersions(id))[0]?.version ?? 0,
    timestamp: now,
    user: userId,
    config: doc.draftConfig,
  }
  await adapter.saveVersion({ ...version, version: version.version + 1 })

  const next: SellpageDocument = {
    ...doc,
    status: 'published',
    publishedConfig: doc.draftConfig,
    publishedAt: now,
    updatedAt: now,
    updatedBy: userId,
  }
  await adapter.save(next)
  return next
}

export const unpublishPage = async (id: string, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const next: SellpageDocument = { ...doc, status: 'unpublished' as SellpageStatus, updatedAt: Date.now(), updatedBy: userId }
  await adapter.save(next)
  return next
}

export const duplicatePage = async (id: string, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const now = Date.now()
  const next: SellpageDocument = {
    ...doc,
    id: genId(),
    name: `${doc.name} (copy)`,
    slug: slugify(`${doc.name}-copy-${now}`),
    status: 'draft',
    publishedConfig: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
  }
  await adapter.save(next)
  return next
}

export const deletePage = (id: string) => adapter.remove(id)

export const listVersions = (pageId: string) => adapter.listVersions(pageId)

/** Loads a past version into the DRAFT only. Publishing remains a separate, explicit step. */
export const restoreVersion = async (pageId: string, versionId: string, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(pageId)
  if (!doc) throw new Error(`Sellpage ${pageId} not found`)
  const versions = await adapter.listVersions(pageId)
  const version = versions.find((v) => v.id === versionId)
  if (!version || !version.config) throw new Error(`Version ${versionId} not found`)

  const next: SellpageDocument = { ...doc, draftConfig: version.config, updatedAt: Date.now(), updatedBy: userId }
  await adapter.save(next)
  return next
}
