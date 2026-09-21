import { describe, expect, it } from 'vitest'
import { safeBackground, safeColor, safeCssValue, safeImageUrl, safeUrl } from './safeUrl'

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

  it('preserves hyphens in domains and paths (regression)', () => {
    expect(safeUrl('https://my-site.com/summer-sale')).toBe('https://my-site.com/summer-sale')
    expect(safeUrl('/summer-sale')).toBe('/summer-sale')
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

describe('safeCssValue', () => {
  it('accepts composite border/shadow values', () => {
    expect(safeCssValue('1px solid #000')).toBe('1px solid #000')
    expect(safeCssValue('0 6px 18px rgba(0,0,0,0.35)')).toBe('0 6px 18px rgba(0,0,0,0.35)')
  })

  it('rejects values that would fetch a remote resource or run script', () => {
    expect(safeCssValue('url(https://evil.com/track.png)')).toBeUndefined()
    expect(safeCssValue('url (https://evil.com/x)')).toBeUndefined()
    expect(safeCssValue('expression(alert(1))')).toBeUndefined()
    expect(safeCssValue('@import "evil.css"')).toBeUndefined()
    expect(safeCssValue('')).toBeUndefined()
    expect(safeCssValue(null)).toBeUndefined()
  })
})

describe('safeBackground', () => {
  it('accepts a plain colour', () => {
    expect(safeBackground('#0f6b5c')).toBe('#0f6b5c')
    expect(safeBackground('rgba(0,0,0,0.35)')).toBe('rgba(0,0,0,0.35)')
  })

  it('accepts a single gradient, including nested colour functions', () => {
    for (const gradient of [
      'linear-gradient(135deg, #0f6b5c, #123b33)',
      'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 100%)',
      'radial-gradient(circle at 50% 50%, #fff, #000)',
      'repeating-linear-gradient(45deg, #fff 0 10px, #eee 10px 20px)',
      'conic-gradient(from 90deg, hsl(200 50% 50%), hsl(20 50% 50%))',
      'linear-gradient(var(--sp-primary), var(--sp-accent))',
    ]) {
      expect(safeBackground(gradient)).toBe(gradient)
    }
  })

  it('rejects every way of loading a remote image — not only url()', () => {
    // A bare string is a URL inside image-set(), so there is no `url(` to catch.
    expect(safeBackground('image-set("https://evil.example/t.gif" 1x)')).toBeUndefined()
    // CSS decodes \75 to "u": this IS url(…) by the time the browser reads it.
    expect(safeBackground('\\75rl(https://evil.example/t.gif)')).toBeUndefined()
    expect(safeBackground('url(https://evil.example/t.gif)')).toBeUndefined()
    expect(safeBackground('linear-gradient(#fff, #000), url(https://evil.example/t.gif)')).toBeUndefined()
    expect(safeBackground('linear-gradient(#fff, #000), image-set("https://evil.example/t.gif" 1x)')).toBeUndefined()
  })

  it('rejects a second layer stacked after the gradient', () => {
    expect(safeBackground('linear-gradient(#fff, #000), linear-gradient(#000, #fff)')).toBeUndefined()
    expect(safeBackground('linear-gradient(#fff, #000) , element(#secret)')).toBeUndefined()
  })

  it('rejects everything else', () => {
    expect(safeBackground('red; position: fixed')).toBeUndefined()
    expect(safeBackground('linear-gradient(#fff, #000')).toBeUndefined()
    expect(safeBackground('')).toBeUndefined()
    expect(safeBackground(null)).toBeUndefined()
  })

  it('shows why safeCssValue must not guard a background', () => {
    expect(safeCssValue('image-set("https://evil.example/t.gif" 1x)')).toBeDefined()
    expect(safeCssValue('\\75rl(https://evil.example/t.gif)')).toBeDefined()
  })
})
