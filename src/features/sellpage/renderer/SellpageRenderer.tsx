// The `/rsc` entry is Puck's pure-render build: same output as the default
// entry's `Render`, but without the editor's state store or rich-text-editing
// chunks, so the public page never loads the Puck Editor bundle.
import { Render } from '@puckeditor/core/rsc'
import { puckConfig } from '../blocks'
import type { SellpageData, SellpageTheme } from '../schemas/sellpage.types'
import '../styles/sellpage.css'
import { ThemeFrame } from './ThemeFrame'

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

  return (
    <ThemeFrame theme={theme}>
      <Render config={puckConfig} data={data} />
    </ThemeFrame>
  )
}
