import { describe, expect, it } from 'vitest'
import { safeColor, safeImageUrl, safeUrl } from './safeUrl'

describe('safeUrl', () => {
  it('allows http/https/mailto/tel/line URLs', () => {
    expect(safeUrl('https://example.com')).toBe('https://example.com/')
    expect(safeUrl('http://example.com')).toBe('http://example.com/')
    expect(safeUrl('mailto:a@b.com')).toBe('mailto:a@b.com')
    expect(safeUrl('tel:+66123456789')).toBe('tel:+66123456789')
    expect(safeUrl('line://ti/p/@example')).toBe('line://ti/p/@example')
  })

  it('allows relative paths and in-page anchors', () => {
    expect(safeUrl('/checkout')).toBe('/checkout')
    expect(safeUrl('#pricing')).toBe('#pricing')
  })

  it('rejects javascript:, data:, vbscript: and malformed input', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull()
    expect(safeUrl('JaVaScRiPt:alert(1)')).toBeNull()
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeUrl('vbscript:msgbox(1)')).toBeNull()
    expect(safeUrl('//evil.com')).toBeNull()
    expect(safeUrl('')).toBeNull()
    expect(safeUrl(null)).toBeNull()
    expect(safeUrl(undefined)).toBeNull()
  })

  it('strips control characters and whitespace used to smuggle a scheme', () => {
    expect(safeUrl('java\tscript:alert(1)')).toBeNull()
    expect(safeUrl('java\nscript:alert(1)')).toBeNull()
  })
})

describe('safeImageUrl', () => {
  it('allows absolute http(s) and same-origin paths only', () => {
    expect(safeImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(safeImageUrl('/uploads/a.png')).toBe('/uploads/a.png')
  })

  it('rejects mailto/tel and unsafe schemes for images', () => {
    expect(safeImageUrl('mailto:a@b.com')).toBeNull()
    expect(safeImageUrl('javascript:alert(1)')).toBeNull()
  })
})

describe('safeColor', () => {
  it('accepts hex, rgb/rgba, hsl/hsla, transparent, currentColor', () => {
    expect(safeColor('#fff')).toBe('#fff')
    expect(safeColor('#ffffff')).toBe('#ffffff')
    expect(safeColor('rgba(0,0,0,0.5)')).toBe('rgba(0,0,0,0.5)')
    expect(safeColor('hsl(200 50% 50%)')).toBe('hsl(200 50% 50%)')
    expect(safeColor('transparent')).toBe('transparent')
    expect(safeColor('currentColor')).toBe('currentColor')
  })

  it('rejects url() and expression injection attempts', () => {
    expect(safeColor('url(javascript:alert(1))')).toBeUndefined()
    expect(safeColor('red; background:url(x)')).toBeUndefined()
    expect(safeColor(123)).toBeUndefined()
  })
})
