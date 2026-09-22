import { createContext } from 'react'
import type { SellpageData } from '../schemas/sellpage.types'

/**
 * What an image field needs to know about the page being edited. Puck's
 * custom-field API passes a field only its own value, so the builder supplies
 * the rest through context.
 *
 * Null outside the builder — an image field rendered without it is a plain
 * URL input.
 */
export type MediaContextValue = {
  pageId: string
  /** The live editor state, not the last save: autosave lags by a debounce. */
  draftConfig: SellpageData
  publishedConfig: SellpageData | null
}

export const MediaContext = createContext<MediaContextValue | null>(null)
