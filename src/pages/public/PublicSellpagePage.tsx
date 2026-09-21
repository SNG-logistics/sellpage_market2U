import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SellpageRenderer } from '../../features/sellpage/renderer/SellpageRenderer'
import { FallbackPage } from '../../features/sellpage/renderer/FallbackPage'
import { parseSellpageData, type SellpageData } from '../../features/sellpage/schemas/sellpageSchema'
import { getPageBySlug } from '../../features/sellpage/services/sellpageService'

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; data: SellpageData }
  | { kind: 'fallback'; reason: 'missing' | 'corrupted' | 'incompatible' }

/**
 * /s/:slug — reads publishedConfig ONLY, never draftConfig. Uses the same
 * SellpageRenderer/blocks as the admin preview.
 */
export function PublicSellpagePage() {
  const { slug } = useParams<{ slug: string }>()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    getPageBySlug(slug)
      .then((doc) => {
        if (cancelled) return
        if (!doc || doc.status !== 'published' || !doc.publishedConfig) {
          setState({ kind: 'fallback', reason: 'missing' })
          return
        }
        const result = parseSellpageData(doc.publishedConfig, doc.schemaVersion)
        setState(result.ok ? { kind: 'ready', data: result.data } : { kind: 'fallback', reason: result.reason })
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'fallback', reason: 'corrupted' })
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (state.kind === 'loading') return null
  if (state.kind === 'fallback') return <FallbackPage reason={state.reason} />
  return <SellpageRenderer data={state.data} />
}
