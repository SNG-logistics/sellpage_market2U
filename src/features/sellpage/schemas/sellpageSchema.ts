import type { Data } from '@puckeditor/core'
import type { BlockProps } from '../blocks'

/**
 * Bump when the stored Puck data shape changes in a way old renderers
 * cannot read. Add a step to `migrations` for every bump.
 */
export const SELLPAGE_SCHEMA_VERSION = 1

// Typed against BlockRegistry's BlockProps (type-only import — no runtime
// coupling), so stored data always matches the components actually registered.
export type SellpageData = Data<BlockProps>

export type SellpageStatus = 'draft' | 'published' | 'unpublished'

/** Persisted document. Draft and published configs are always separate. */
export type SellpageDocument = {
  id: string
  name: string
  slug: string
  status: SellpageStatus
  schemaVersion: number
  draftConfig: SellpageData
  publishedConfig: SellpageData | null
  createdAt: number
  updatedAt: number
  publishedAt: number | null
  createdBy: string | null
  updatedBy: string | null
}

export const createEmptyData = (): SellpageData => ({
  root: { props: { title: '' } },
  content: [],
  zones: {},
})

type Migration = (data: SellpageData) => SellpageData

/** migrations[n] upgrades data from schema version n to n + 1. */
const migrations: Record<number, Migration> = {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isBlock = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.type === 'string' &&
  isRecord(value.props) &&
  typeof value.props.id === 'string'

/** Structural check only. Unknown block types are handled by the renderer. */
export const isValidSellpageData = (value: unknown): value is SellpageData => {
  if (!isRecord(value)) return false
  if (!Array.isArray(value.content) || !value.content.every(isBlock)) return false
  if (value.root !== undefined && !isRecord(value.root)) return false
  if (value.zones !== undefined && !isRecord(value.zones)) return false
  return true
}

export type ParseResult =
  | { ok: true; data: SellpageData }
  | { ok: false; reason: 'missing' | 'corrupted' | 'incompatible' }

/**
 * Validates stored data and upgrades it to the current schema version.
 * Never throws: callers decide what to render on failure.
 */
export const parseSellpageData = (value: unknown, schemaVersion: number): ParseResult => {
  if (value === null || value === undefined) return { ok: false, reason: 'missing' }
  if (!isValidSellpageData(value)) return { ok: false, reason: 'corrupted' }
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1 || schemaVersion > SELLPAGE_SCHEMA_VERSION) {
    return { ok: false, reason: 'incompatible' }
  }

  let data = value
  for (let version = schemaVersion; version < SELLPAGE_SCHEMA_VERSION; version++) {
    const migrate = migrations[version]
    if (!migrate) return { ok: false, reason: 'incompatible' }
    data = migrate(data)
  }
  return { ok: true, data }
}
