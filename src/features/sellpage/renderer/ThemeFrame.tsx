import type { CSSProperties, ReactNode } from 'react'
import { defaultTheme, type SellpageTheme } from '../schemas/sellpage.types'
import { cssUrl, safeBackground, safeColor, safeImageUrl } from '../utils/safeUrl'

type Props = {
  theme: SellpageTheme
  children: ReactNode
}

// Viewport-sized, not page-sized: a sellpage is thousands of pixels tall, and
// `cover` against that height blows a photo up until a phone shows a sliver
// of it. A fixed layer shows the whole photo behind the scroll instead —
// and unlike `background-attachment: fixed`, iOS Safari honours it.
const FIT: Record<NonNullable<SellpageTheme['backgroundImageFit']>, string> = {
  cover: 'center / cover no-repeat',
  contain: 'center / contain no-repeat',
  repeat: 'left top / auto repeat',
}

// `top/right/bottom/left` rather than `inset`, which older Android WebViews —
// the in-app browsers of LINE and Facebook — do not all support.
const LAYER: CSSProperties = { position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', zIndex: 0 }

const overlayOpacity = (value: unknown): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return Math.min(Math.max(n, 0), 90) / 100
}

/**
 * The theme around a page's blocks. The public renderer and the editor canvas
 * both wrap their blocks in this, so what the admin sees is what the public
 * gets — the same reason there is one block registry.
 *
 * Every value is user input and is sanitized here. It matters most for the
 * colours: blocks write `background: var(--sp-surface)`, so an unsanitized
 * variable would carry an `image-set("https://…")` into every block at once.
 */
export function ThemeFrame({ theme, children }: Props) {
  const fallback = defaultTheme()
  const color = (key: keyof SellpageTheme['colors']) => safeColor(theme.colors[key]) ?? fallback.colors[key]

  const themeStyle: CSSProperties & Record<string, string | number> = {
    // Exposed as CSS variables so blocks and future theme-aware styles can
    // read them without each block importing the theme type.
    '--sp-primary': color('primary'),
    '--sp-secondary': color('secondary'),
    '--sp-accent': color('accent'),
    '--sp-background': color('background'),
    '--sp-surface': color('surface'),
    '--sp-text': color('text'),
    '--sp-muted': color('muted'),
    '--sp-spacing': `${theme.spacing}px`,
    background: safeBackground(theme.background) ?? fallback.background,
    color: color('text'),
    fontFamily: theme.typography.bodyFont,
    minHeight: '100%',
  }

  const contentStyle: CSSProperties = {
    maxWidth: theme.maxWidth > 0 ? theme.maxWidth : undefined,
    marginInline: theme.maxWidth > 0 ? 'auto' : undefined,
  }

  // Absent on every page saved before the field existed, and then nothing
  // below is rendered: those pages get exactly the markup they always had.
  const image = safeImageUrl(theme.backgroundImage)
  if (!image) {
    return (
      <div style={themeStyle}>
        <div style={contentStyle}>{children}</div>
      </div>
    )
  }

  const fit = FIT[theme.backgroundImageFit ?? 'cover'] ?? FIT.cover
  const veil = overlayOpacity(theme.backgroundOverlay)

  return (
    <div style={themeStyle}>
      <div aria-hidden="true" className="sp-page-bg" style={{ ...LAYER, background: `${cssUrl(image)} ${fit}` }} />
      {veil > 0 ? (
        // The page's own background colour, so text chosen to sit on that
        // colour stays readable over the photo — dark themes get a dark veil,
        // light ones a light veil, without a separate setting.
        <div aria-hidden="true" className="sp-page-bg__veil" style={{ ...LAYER, background: color('background'), opacity: veil }} />
      ) : null}
      <div style={{ ...contentStyle, position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
