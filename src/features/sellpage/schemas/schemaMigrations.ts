import type { SellpageData } from './sellpage.types'

/**
 * Current schema version. Bump it in the SAME commit that adds the matching
 * migration step below — a bump without a step makes every older page
 * unrenderable (parse returns `incompatible`, the public route shows the
 * fallback), which is exactly what the tests guard against.
 */
export const SELLPAGE_SCHEMA_VERSION = 1

/** A migration upgrades data from version N to version N + 1. */
export type Migration = {
  readonly from: number
  readonly description: string
  readonly migrate: (data: SellpageData) => SellpageData
}

/**
 * Ordered v(N) -> v(N+1) steps. To add one:
 *   1. append `{ from: <current version>, description, migrate }`
 *   2. bump SELLPAGE_SCHEMA_VERSION to <current version> + 1
 *   3. add a test asserting an old-shaped document migrates correctly
 *
 * Migrations must be pure and must not throw on unexpected input — return the
 * data unchanged rather than crashing a public page.
 *
 * Example of the shape a future step takes:
 *   {
 *     from: 1,
 *     description: 'Button.iconPosition: "before"/"after" -> "left"/"right"',
 *     migrate: (data) => ({ ...data, content: data.content.map(renameIconPosition) }),
 *   }
 */
export const migrations: readonly Migration[] = []

const migrationFrom = (version: number): Migration | undefined => migrations.find((m) => m.from === version)

export type MigrationResult =
  | { ok: true; data: SellpageData; migrated: boolean }
  | { ok: false; reason: 'incompatible'; missingFrom: number }

/**
 * Upgrades data written at `fromVersion` up to SELLPAGE_SCHEMA_VERSION.
 * Never throws; a missing step is reported rather than guessed at.
 */
export const migrateToCurrent = (data: SellpageData, fromVersion: number): MigrationResult => {
  let current = data
  let migrated = false

  for (let version = fromVersion; version < SELLPAGE_SCHEMA_VERSION; version++) {
    const step = migrationFrom(version)
    if (!step) return { ok: false, reason: 'incompatible', missingFrom: version }
    current = step.migrate(current)
    migrated = true
  }

  return { ok: true, data: current, migrated }
}

/** True when this build can read data written at `schemaVersion`. */
export const canReadSchemaVersion = (schemaVersion: unknown): schemaVersion is number => {
  if (!Number.isInteger(schemaVersion)) return false
  const version = schemaVersion as number
  if (version < 1 || version > SELLPAGE_SCHEMA_VERSION) return false
  for (let v = version; v < SELLPAGE_SCHEMA_VERSION; v++) {
    if (!migrationFrom(v)) return false
  }
  return true
}
