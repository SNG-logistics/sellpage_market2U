const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:', 'line:'])

/**
 * True for ASCII control characters (0x00-0x1F, 0x7F) and whitespace —
 * the characters a browser strips before parsing a URL's scheme, so
 * "java<TAB>script:" reads as "javascript:" once stripped here too.
 * Checked with charCodeAt rather than a regex literal: embedding raw
 * control bytes (or \u escapes, which some tool pipelines decode into raw
 * bytes on the way into a file) in a regex is fragile to edit and review.
 */
const isStrippableChar = (code: number): boolean => code <= 0x1f || code === 0x7f || /\s/.test(String.fromCharCode(code))

/**
 * Returns a URL that is safe to put in href/src, or null.
 * Blocks javascript:, data:, vbscript: and anything else not allow-listed.
 * Relative paths and in-page anchors are allowed.
 */
export const safeUrl = (input: unknown): string | null => {
  if (typeof input !== 'string') return null

  let value = ''
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    if (!isStrippableChar(code)) value += input[i]
  }
  if (value === '') return null

  if (value.startsWith('#') || (value.startsWith('/') && !value.startsWith('//'))) return value

  try {
    const url = new URL(value)
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

/** Image sources: only http(s) or same-origin paths. */
export const safeImageUrl = (input: unknown): string | null => {
  const url = safeUrl(input)
  if (url === null) return null
  return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://') ? url : null
}

const CSS_COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/deg]+\)|transparent|currentColor)$/

/** Accepts plain colour values only, so user input cannot smuggle url() or expressions into style. */
export const safeColor = (input: unknown): string | undefined => {
  if (typeof input !== 'string') return undefined
  const value = input.trim()
  return CSS_COLOR.test(value) ? value : undefined
}

const CSS_RESOURCE_OR_SCRIPT = /url\s*\(|expression\s*\(|javascript:|@import/i

/**
 * For composite CSS values that are not single colours (border, box-shadow).
 * React assigns these through the style object, so a stray `;` cannot break
 * out into another declaration — but url()/expression() could still fetch a
 * remote resource from a published page, so those are rejected outright.
 *
 * NOT for `background` — use `safeBackground`. This is a deny-list, and it is
 * only sufficient because border and box-shadow cannot hold an image at all.
 * `background` can, and an image needs no `url(`: `image-set("https://…")`
 * takes a bare string, and `\75rl(…)` is `url(…)` once CSS decodes the escape.
 */
export const safeCssValue = (input: unknown): string | undefined => {
  if (typeof input !== 'string') return undefined
  const value = input.trim()
  if (value === '' || CSS_RESOURCE_OR_SCRIPT.test(value)) return undefined
  return value
}

// No quotes and no backslash: every way CSS has of naming a remote resource
// other than url() — image-set(), image(), src() — needs a string, and every
// way of disguising `url` needs an escape.
const CSS_GRADIENT = /^(repeating-)?(linear|radial|conic)-gradient\([a-zA-Z0-9\s.,%#()/+-]+\)$/

/** True when `value` is one function call — its first `(` closes on the last character, not before. */
const isSingleCall = (value: string): boolean => {
  let depth = 0
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++
    else if (value[i] === ')' && --depth === 0 && i !== value.length - 1) return false
  }
  return depth === 0
}

/**
 * For `background`: a plain colour, or exactly one gradient. An allow-list,
 * unlike `safeCssValue`, because `background` is the one styled property that
 * can load an image.
 */
export const safeBackground = (input: unknown): string | undefined => {
  const color = safeColor(input)
  if (color !== undefined) return color
  if (typeof input !== 'string') return undefined
  const value = input.trim()
  return CSS_GRADIENT.test(value) && !CSS_RESOURCE_OR_SCRIPT.test(value) && isSingleCall(value) ? value : undefined
}
