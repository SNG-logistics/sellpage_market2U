import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SellpageBuilder } from '../../features/sellpage/builder/SellpageBuilder'
import type { SellpageDocument } from '../../features/sellpage/schemas/sellpageSchema'
import { getPage } from '../../features/sellpage/services/sellpageService'

type Loaded = { id: string; doc: SellpageDocument | null }

/** /admin/sellpages/:id — hosts the Puck-powered SellpageBuilder for one page. */
export function AdminSellpageEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getPage(id).then((doc) => {
      if (!cancelled) setLoaded({ id, doc })
    })
    return () => {
      cancelled = true
    }
  }, [id])

  // Derived during render rather than reset in the effect: while the route's
  // id and the loaded id disagree we are still fetching, so the previous
  // page's content can never be shown (or edited) under the new id.
  const page = loaded && loaded.id === id ? loaded.doc : undefined

  if (page === undefined) return <p style={{ padding: 24 }}>Loading…</p>
  if (page === null) return <p style={{ padding: 24 }}>Page not found.</p>

  return (
    <SellpageBuilder
      // Keying by id forces a full remount when navigating between pages, so
      // SellpageBuilder's `draft` state (initialized once from page.draftConfig)
      // can never carry one page's content into another page's autosave.
      key={page.id}
      page={page}
      userId={null}
      onBack={() => navigate('/admin/sellpages')}
      onPublished={(next) => setLoaded({ id: next.id, doc: next })}
    />
  )
}
