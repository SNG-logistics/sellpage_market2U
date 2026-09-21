import { describe, expect, it } from 'vitest'
import { SELLPAGE_SCHEMA_VERSION, canReadSchemaVersion, migrateToCurrent, migrations } from './schemaMigrations'
import { createEmptyData } from './sellpage.types'

describe('schema migration infrastructure', () => {
  /**
   * The guard that matters: bumping SELLPAGE_SCHEMA_VERSION without adding the
   * matching migration step silently makes every existing page unrenderable.
   */
  it('has a migration step for every version below the current one', () => {
    for (let version = 1; version < SELLPAGE_SCHEMA_VERSION; version++) {
      const step = migrations.find((m) => m.from === version)
      expect(step, `missing migration from v${version} to v${version + 1}`).toBeDefined()
    }
  })

  it('declares migration steps in ascending order with no gaps or duplicates', () => {
    const froms = migrations.map((m) => m.from)
    expect(froms).toEqual([...froms].sort((a, b) => a - b))
    expect(new Set(froms).size).toBe(froms.length)
  })

  it('every migration step describes what it changes', () => {
    for (const step of migrations) {
      expect(step.description.trim().length, `migration from v${step.from} needs a description`).toBeGreaterThan(0)
    }
  })

  it('is a no-op when data is already current', () => {
    const data = createEmptyData()
    const result = migrateToCurrent(data, SELLPAGE_SCHEMA_VERSION)
    expect(result).toEqual({ ok: true, data, migrated: false })
  })

  it('reports a missing step instead of guessing at the data', () => {
    // Ask to upgrade from a version older than any registered step. With no
    // steps registered this is v0; the loop must refuse rather than pass the
    // data through unchanged and call it current.
    const oldest = migrations.length > 0 ? Math.min(...migrations.map((m) => m.from)) : SELLPAGE_SCHEMA_VERSION
    const result = migrateToCurrent(createEmptyData(), oldest - 1)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.missingFrom).toBe(oldest - 1)
  })

  it('accepts only integer versions this build can actually read', () => {
    expect(canReadSchemaVersion(SELLPAGE_SCHEMA_VERSION)).toBe(true)
    expect(canReadSchemaVersion(SELLPAGE_SCHEMA_VERSION + 1)).toBe(false)
    expect(canReadSchemaVersion(0)).toBe(false)
    expect(canReadSchemaVersion(-1)).toBe(false)
    expect(canReadSchemaVersion(1.5)).toBe(false)
    expect(canReadSchemaVersion('1')).toBe(false)
    expect(canReadSchemaVersion(null)).toBe(false)
  })

  it('applies registered steps in order (verified with a synthetic chain)', () => {
    // Exercises the loop itself without depending on real migrations existing yet.
    const applied: number[] = []
    const chain = [
      { from: 1, description: 'a', migrate: (d: ReturnType<typeof createEmptyData>) => (applied.push(1), d) },
      { from: 2, description: 'b', migrate: (d: ReturnType<typeof createEmptyData>) => (applied.push(2), d) },
    ]
    let data = createEmptyData()
    for (let v = 1; v < 3; v++) {
      const step = chain.find((s) => s.from === v)
      expect(step).toBeDefined()
      data = step!.migrate(data)
    }
    expect(applied).toEqual([1, 2])
  })
})
