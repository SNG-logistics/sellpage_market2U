import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SellpageBuilder } from '../../features/sellpage/builder/SellpageBuilder'
import type { SellpageDocument } from '../../features/sellpage/schemas/sellpageSchema'
import { getPage } from '../../features/sellpage/services/sellpageService'

/** /admin/sellpages/:id — hosts the Puck-powered SellpageBuilder for one page. */
export function AdminSellpageEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState<SellpageDocument | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    getPage(id).then(setPage)
  }, [id])

  if (page === undefined) return <p style={{ padding: 24 }}>Loading…</p>
  if (page === null) return <p style={{ padding: 24 }}>Page not found.</p>

  return (
    <SellpageBuilder
      page={page}
      userId={null}
      onBack={() => navigate('/admin/sellpages')}
      onPublished={setPage}
    />
  )
}
