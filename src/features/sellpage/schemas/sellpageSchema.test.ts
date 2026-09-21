import { describe, expect, it } from 'vitest'
import { SELLPAGE_SCHEMA_VERSION, createEmptyData, parseSellpageData } from './sellpageSchema'

describe('parseSellpageData', () => {
  it('accepts empty data at the current schema version', () => {
    const result = parseSellpageData(createEmptyData(), SELLPAGE_SCHEMA_VERSION)
    expect(result.ok).toBe(true)
  })

  it('flags missing data so callers can render a fallback, not a blank page', () => {
    expect(parseSellpageData(null, SELLPAGE_SCHEMA_VERSION)).toEqual({ ok: false, reason: 'missing' })
    expect(parseSellpageData(undefined, SELLPAGE_SCHEMA_VERSION)).toEqual({ ok: false, reason: 'missing' })
  })

  it('flags structurally invalid data as corrupted', () => {
    expect(parseSellpageData({ content: 'not-an-array' }, SELLPAGE_SCHEMA_VERSION)).toEqual({ ok: false, reason: 'corrupted' })
    expect(parseSellpageData({ content: [{ type: 'X' }] }, SELLPAGE_SCHEMA_VERSION)).toEqual({ ok: false, reason: 'corrupted' })
    expect(parseSellpageData('nonsense', SELLPAGE_SCHEMA_VERSION)).toEqual({ ok: false, reason: 'corrupted' })
  })

  it('flags a schema version newer than this build understands as incompatible', () => {
    const result = parseSellpageData(createEmptyData(), SELLPAGE_SCHEMA_VERSION + 1)
    expect(result).toEqual({ ok: false, reason: 'incompatible' })
  })

  it('flags a non-positive-integer schema version as incompatible', () => {
    expect(parseSellpageData(createEmptyData(), 0)).toEqual({ ok: false, reason: 'incompatible' })
    expect(parseSellpageData(createEmptyData(), -1)).toEqual({ ok: false, reason: 'incompatible' })
    expect(parseSellpageData(createEmptyData(), 1.5)).toEqual({ ok: false, reason: 'incompatible' })
  })
})
