import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SellpageRenderer } from '../../features/sellpage/renderer/SellpageRenderer'
import { FallbackPage } from '../../features/sellpage/renderer/FallbackPage'
import type { PublishedSellpage } from '../../features/sellpage/schemas/sellpage.types'
import { getPublishedPageBySlug } from '../../features/sellpage/services/sellpageService'
import { usePageHead } from '../../features/sellpage/hooks/usePageHead'

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; page: PublishedSellpage }
  | { kind: 'fallback'; reason: 'missing' | 'corrupted' | 'incompatible' }

/**
 * /s/:slug — renders publishedConfig ONLY, never the draft, through the same
 * SellpageRenderer and block definitions the admin preview uses.
 */
export function PublicSellpagePage() {
  const { slug } = useParams<{ slug: string }>()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    getPublishedPageBySlug(slug)
      .then((result) => {
        if (cancelled) return
        setState(result.ok ? { kind: 'ready', page: result.page } : { kind: 'fallback', reason: result.reason })
      })
      .catch(() => {
        // getPublishedPageBySlug already converts fetch errors into a reason;
        // this is the belt-and-braces path so a public page is never blank.
        if (!cancelled) setState({ kind: 'fallback', reason: 'corrupted' })
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  usePageHead(state.kind === 'ready' ? state.page : null)

  if (state.kind === 'loading') return null
  if (state.kind === 'fallback') return <FallbackPage reason={state.reason} />
  return <SellpageRenderer data={state.page.data} theme={state.page.theme} />
}
