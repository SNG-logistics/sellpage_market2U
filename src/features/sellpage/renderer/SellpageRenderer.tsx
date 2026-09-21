// The `/rsc` entry is Puck's pure-render build: same output as the default
// entry's `Render`, but without the editor's state store or rich-text-editing
// chunks, so the public page never loads the Puck Editor bundle.
import { Render } from '@puckeditor/core/rsc'
import type { CSSProperties } from 'react'
import { puckConfig } from '../blocks'
import type { SellpageData, SellpageTheme } from '../schemas/sellpage.types'

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

  const themeStyle: CSSProperties & Record<string, string | number> = {
    // Exposed as CSS variables so blocks and future theme-aware styles can
    // read them without each block importing the theme type.
    '--sp-primary': theme.colors.primary,
    '--sp-secondary': theme.colors.secondary,
    '--sp-accent': theme.colors.accent,
    '--sp-background': theme.colors.background,
    '--sp-surface': theme.colors.surface,
    '--sp-text': theme.colors.text,
    '--sp-muted': theme.colors.muted,
    '--sp-spacing': `${theme.spacing}px`,
    background: theme.background,
    color: theme.colors.text,
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
