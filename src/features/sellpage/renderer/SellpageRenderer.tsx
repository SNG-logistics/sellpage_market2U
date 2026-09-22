// The `/rsc` entry is Puck's pure-render build: same output as the default
// entry's `Render`, but without the editor's state store or rich-text-editing
// chunks, so the public page never loads the Puck Editor bundle.
import { Render } from '@puckeditor/core/rsc'
import type { CSSProperties } from 'react'
import { puckConfig } from '../blocks'
import { defaultTheme, type SellpageData, type SellpageTheme } from '../schemas/sellpage.types'
import { safeBackground, safeColor } from '../utils/safeUrl'
import '../styles/sellpage.css'

type Props = {
  data: SellpageData
  /** Omitted in contexts that supply the theme themselves (e.g. the editor canvas). */
  theme?: SellpageTheme
}

/**
 * THE renderer. Both the admin preview and the public page render through
 * this component and the single `puckConfig`, so what an admin sees is what
 * the public gets after Publish. Do not add an AdminRenderer/PublicRenderer
 * split — see docs/sellpage/ARCHITECTURE.md.
 */
export function SellpageRenderer({ data, theme }: Props) {
  if (!theme) return <Render config={puckConfig} data={data} />

  // The theme is user input like any block prop. It matters most here: blocks
  // write `background: var(--sp-surface)`, so an unsanitized variable would
  // carry an `image-set("https://…")` into a background on every block at once.
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

  return (
    <div style={themeStyle}>
      <div style={contentStyle}>
        <Render config={puckConfig} data={data} />
      </div>
    </div>
  )
}
