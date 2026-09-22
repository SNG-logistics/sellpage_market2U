import { SELLPAGE_SCHEMA_VERSION, parseSellpageData } from '../schemas/sellpageSchema'
import {
  createEmptyData,
  defaultSeo,
  defaultSettings,
  defaultTheme,
  type PublishedSellpage,
  type SellpageData,
  type SellpageDocument,
  type SellpageSeo,
  type SellpageSettings,
  type SellpageTheme,
  type SellpageVersion,
} from '../schemas/sellpage.types'
import { localStorageAdapter, type SellpageStorageAdapter } from './storageAdapter'

/**
 * Every read and write of a sellpage goes through this module. UI components
 * never talk to storage directly, so draft/publish rules are enforced in one
 * place (docs/sellpage/ARCHITECTURE.md).
 */
let adapter: SellpageStorageAdapter = localStorageAdapter

/** Swap the storage adapter (e.g. to a Firestore-backed one) without touching callers. */
export const setSellpageStorageAdapter = (next: SellpageStorageAdapter) => {
  adapter = next
}

const genId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sp_${Date.now()}_${Math.random().toString(36).slice(2)}`

const slugify = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || `page-${Date.now()}`

const isSlugTaken = async (slug: string, excludeId?: string): Promise<boolean> => {
  const existing = await adapter.getBySlug(slug)
  return existing !== null && existing.id !== excludeId
}

/**
 * Slugs must be unique — the public route resolves one page per slug, so a
 * collision would make a second page unreachable. Appends -2, -3, … until free.
 */
const uniqueSlug = async (base: string, excludeId?: string): Promise<string> => {
  let slug = base
  for (let n = 2; await isSlugTaken(slug, excludeId); n++) {
    slug = `${base}-${n}`
  }
  return slug
}

// --- Reads -----------------------------------------------------------------

export const listPages = () => adapter.list()

export const getPage = (id: string) => adapter.get(id)

export const getPageBySlug = (slug: string) => adapter.getBySlug(slug)

export type PublishedLookup =
  | { ok: true; page: PublishedSellpage }
  | { ok: false; reason: 'missing' | 'corrupted' | 'incompatible' }

/**
 * The public route's only entry point. Reads publishedConfig — never the
 * draft — validates it, and migrates it to the current schema version.
 * Returns a reason instead of throwing so the caller renders a fallback
 * rather than a blank page.
 */
export const getPublishedPageBySlug = async (slug: string): Promise<PublishedLookup> => {
  let doc: SellpageDocument | null
  try {
    doc = await adapter.getPublishedBySlug(slug)
  } catch {
    return { ok: false, reason: 'corrupted' }
  }

  if (!doc || doc.status !== 'published' || doc.publishedConfig === null) {
    return { ok: false, reason: 'missing' }
  }

  const parsed = parseSellpageData(doc.publishedConfig, doc.schemaVersion)
  if (!parsed.ok) return { ok: false, reason: parsed.reason }

  return {
    ok: true,
    page: {
      id: doc.id,
      slug: doc.slug,
      name: doc.name,
      data: parsed.data,
      // Published look/SEO fall back to defaults if a page was published
      // before these fields existed; never to the draft values.
      theme: doc.publishedTheme ?? defaultTheme(),
      seo: doc.publishedSeo ?? defaultSeo(),
      settings: doc.publishedSettings ?? defaultSettings(),
      publishedAt: doc.publishedAt,
    },
  }
}

// --- Writes ----------------------------------------------------------------

export const createPage = async (
  name: string,
  userId: string | null,
  initialData?: SellpageData,
  initialTheme?: SellpageTheme,
): Promise<SellpageDocument> => {
  const now = Date.now()
  const doc: SellpageDocument = {
    id: genId(),
    name,
    slug: await uniqueSlug(slugify(name)),
    status: 'draft',
    schemaVersion: SELLPAGE_SCHEMA_VERSION,
    draftConfig: initialData ?? createEmptyData(),
    draftTheme: initialTheme ?? defaultTheme(),
    draftSeo: defaultSeo(),
    draftSettings: defaultSettings(),
    publishedConfig: null,
    publishedTheme: null,
    publishedSeo: null,
    publishedSettings: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    createdBy: userId,
    updatedBy: userId,
  }
  await adapter.save(doc)
  return doc
}

/** Writes draftConfig ONLY. Never touches any published field. */
export const saveDraft = async (id: string, draftConfig: SellpageData, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const next: SellpageDocument = { ...doc, draftConfig, updatedAt: Date.now(), updatedBy: userId }
  await adapter.save(next)
  return next
}

/** Draft-only writes for the surrounding page settings. Same rule as saveDraft. */
export const saveDraftTheme = async (id: string, draftTheme: SellpageTheme, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const next: SellpageDocument = { ...doc, draftTheme, updatedAt: Date.now(), updatedBy: userId }
  await adapter.save(next)
  return next
}

export const saveDraftSeo = async (id: string, draftSeo: SellpageSeo, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const next: SellpageDocument = { ...doc, draftSeo, updatedAt: Date.now(), updatedBy: userId }
  await adapter.save(next)
  return next
}

export const saveDraftSettings = async (id: string, draftSettings: SellpageSettings, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const next: SellpageDocument = { ...doc, draftSettings, updatedAt: Date.now(), updatedBy: userId }
  await adapter.save(next)
  return next
}

export const renamePage = async (id: string, name: string, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const next: SellpageDocument = { ...doc, name, updatedAt: Date.now(), updatedBy: userId }
  await adapter.save(next)
  return next
}

/** Changing a slug keeps uniqueness, excluding the page itself. */
export const changeSlug = async (id: string, slug: string, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const next: SellpageDocument = {
    ...doc,
    slug: await uniqueSlug(slugify(slug), id),
    updatedAt: Date.now(),
    updatedBy: userId,
  }
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
 * validate -> snapshot a version -> draft becomes published -> set publishedAt.
 * The ONLY path that changes what the public page renders.
 */
export const publishPage = async (id: string, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)

  const validation = validateForPublish(doc)
  if (!validation.ok) throw new Error(validation.errors.join(' '))

  const now = Date.now()
  await createVersion(doc, userId, now)

  const next: SellpageDocument = {
    ...doc,
    status: 'published',
    schemaVersion: SELLPAGE_SCHEMA_VERSION,
    publishedConfig: structuredClone(doc.draftConfig),
    publishedTheme: structuredClone(doc.draftTheme),
    publishedSeo: structuredClone(doc.draftSeo),
    publishedSettings: structuredClone(doc.draftSettings),
    publishedAt: now,
    updatedAt: now,
    updatedBy: userId,
  }
  await adapter.save(next)
  return next
}

/** Takes the page offline without discarding what was published. */
export const unpublishPage = async (id: string, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const next: SellpageDocument = { ...doc, status: 'unpublished', updatedAt: Date.now(), updatedBy: userId }
  await adapter.save(next)
  return next
}

/**
 * Rebuilds a block tree with a fresh id on every block, at any nesting depth.
 *
 * Ids are unique within a page either way, so rendering does not need this.
 * Tracking does: the settings already reserve pixel ids, and per-block events
 * keyed on a block id would silently merge two different blocks that a
 * duplicate left sharing one. Cheaper to keep ids distinct than to discover
 * that in a report.
 */
const withFreshBlockIds = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(withFreshBlockIds) as T
  if (value === null || typeof value !== 'object') return value

  const next: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) next[key] = withFreshBlockIds(child)

  // A Puck block is `{ type, props: { id, … } }` — only those ids are block ids.
  const props = next.props
  if (typeof next.type === 'string' && props !== null && typeof props === 'object') {
    const asProps = props as Record<string, unknown>
    if (typeof asProps.id === 'string') asProps.id = `${next.type}-${genId()}`
  }
  return next as T
}

export const duplicatePage = async (id: string, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(id)
  if (!doc) throw new Error(`Sellpage ${id} not found`)
  const now = Date.now()
  const next: SellpageDocument = {
    ...doc,
    id: genId(),
    name: `${doc.name} (copy)`,
    slug: await uniqueSlug(slugify(`${doc.name}-copy`)),
    status: 'draft',
    // Deep-copied: a shallow spread would leave the copy sharing the
    // original's block tree, so editing one could mutate the other. The walk
    // rebuilds every object, so it is the deep copy as well as the re-id.
    draftConfig: withFreshBlockIds(doc.draftConfig),
    draftTheme: structuredClone(doc.draftTheme),
    draftSeo: structuredClone(doc.draftSeo),
    draftSettings: structuredClone(doc.draftSettings),
    // A duplicate is never born published.
    publishedConfig: null,
    publishedTheme: null,
    publishedSeo: null,
    publishedSettings: null,
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

// --- Versions --------------------------------------------------------------

/**
 * Snapshots the page's CURRENT DRAFT as the next version. Called by
 * publishPage; exported so an explicit "save a checkpoint" action can reuse it.
 */
export const createVersion = async (doc: SellpageDocument, userId: string | null, timestamp = Date.now()): Promise<SellpageVersion> => {
  const previous = (await adapter.listVersions(doc.id))[0]?.version ?? 0
  const version: SellpageVersion = {
    id: genId(),
    pageId: doc.id,
    version: previous + 1,
    timestamp,
    user: userId,
    schemaVersion: doc.schemaVersion,
    config: structuredClone(doc.draftConfig),
    theme: structuredClone(doc.draftTheme),
    seo: structuredClone(doc.draftSeo),
    settings: structuredClone(doc.draftSettings),
  }
  await adapter.saveVersion(version)
  return version
}

/** Newest first. */
export const getVersions = (pageId: string) => adapter.listVersions(pageId)

/** @deprecated use getVersions — kept so older call sites keep compiling. */
export const listVersions = getVersions

/**
 * Loads a past version into the DRAFT only, migrating it if it was written
 * under an older schema. Publishing stays a separate, explicit step — a
 * restore never changes what the public sees.
 */
export const restoreVersion = async (pageId: string, versionId: string, userId: string | null): Promise<SellpageDocument> => {
  const doc = await adapter.get(pageId)
  if (!doc) throw new Error(`Sellpage ${pageId} not found`)

  const version = (await adapter.listVersions(pageId)).find((v) => v.id === versionId)
  if (!version) throw new Error(`Version ${versionId} not found`)

  const parsed = parseSellpageData(version.config, version.schemaVersion ?? SELLPAGE_SCHEMA_VERSION)
  if (!parsed.ok) throw new Error(`Version ${versionId} cannot be restored (${parsed.reason}).`)

  const next: SellpageDocument = {
    ...doc,
    schemaVersion: SELLPAGE_SCHEMA_VERSION,
    draftConfig: parsed.data,
    draftTheme: structuredClone(version.theme ?? doc.draftTheme),
    draftSeo: structuredClone(version.seo ?? doc.draftSeo),
    draftSettings: structuredClone(version.settings ?? doc.draftSettings),
    updatedAt: Date.now(),
    updatedBy: userId,
  }
  await adapter.save(next)
  return next
}
