import { canReadSchemaVersion, migrateToCurrent, SELLPAGE_SCHEMA_VERSION } from './schemaMigrations'
import type { SellpageData } from './sellpage.types'

/**
 * Validation and parsing for stored sellpage data.
 *
 * The contract types live in `sellpage.types.ts` and the version/migration
 * infrastructure in `schemaMigrations.ts`; both are re-exported here so
 * existing imports of this module keep working.
 */
export * from './sellpage.types'
export { SELLPAGE_SCHEMA_VERSION, migrations, migrateToCurrent, canReadSchemaVersion } from './schemaMigrations'
export type { Migration, MigrationResult } from './schemaMigrations'

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
 * Never throws: callers decide what to render on failure, and the public
 * route renders a fallback rather than a blank page.
 */
export const parseSellpageData = (value: unknown, schemaVersion: number): ParseResult => {
  if (value === null || value === undefined) return { ok: false, reason: 'missing' }
  if (!isValidSellpageData(value)) return { ok: false, reason: 'corrupted' }
  if (!canReadSchemaVersion(schemaVersion)) return { ok: false, reason: 'incompatible' }

  const result = migrateToCurrent(value, schemaVersion)
  return result.ok ? { ok: true, data: result.data } : { ok: false, reason: 'incompatible' }
}

/** Re-exported for callers that only need the current version number. */
export const currentSchemaVersion = SELLPAGE_SCHEMA_VERSION
