import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SellpageDocument } from '../../features/sellpage/schemas/sellpage.types'
import { createPage, deletePage, duplicatePage, listPages, publishPage, unpublishPage } from '../../features/sellpage/services/sellpageService'
import { createLuxuryContactTemplate } from '../../features/sellpage/templates/luxuryContactTemplate'

/** /admin/sellpages — list, create, duplicate, delete. Edit/preview/publish live in the editor route. */
export function AdminSellpageListPage() {
  const navigate = useNavigate()
  const [pages, setPages] = useState<SellpageDocument[] | null>(null)
  const [newName, setNewName] = useState('')
  const [templateType, setTemplateType] = useState<'luxury' | 'blank'>('luxury')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = () => listPages().then(setPages)

  useEffect(() => {
    void refresh().catch(() => setError('Could not load sellpages. Please try again.'))
  }, [])

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The action failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = async () => {
    const defaultName = templateType === 'luxury' ? 'หน้าขายสินค้า VIP' : 'Untitled page'
    const name = newName.trim() || defaultName
    const template = templateType === 'luxury' ? createLuxuryContactTemplate() : null
    const page = await createPage(name, null, template?.data, template?.theme)
    setNewName('')
    navigate(`/admin/sellpages/${page.id}`)
  }

  const handleDuplicate = async (id: string) => {
    await duplicatePage(id, null)
    await refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page? This cannot be undone.')) return
    await deletePage(id)
    await refresh()
  }

  return (
    <div className="sp-admin-page">
      <header className="sp-admin-page__header">
        <h1>Sellpages</h1>
        <div className="sp-admin-page__new" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <select
            aria-label="Page template"
            disabled={busy}
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value as 'luxury' | 'blank')}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc' }}
          >
            <option value="luxury">✨ Market2U Luxury Contact (VIP)</option>
            <option value="blank">📄 Blank Page</option>
          </select>
          <input
            aria-label="Page name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={templateType === 'luxury' ? 'ชื่อหน้า (เช่น ติดต่อแอดมิน VIP)' : 'New page name'}
            style={{ minWidth: 220 }}
          />
          <button type="button" disabled={busy} onClick={() => void run(handleCreate)}>
            Create Page
          </button>
        </div>
      </header>

      {error && <div role="alert">{error} <button type="button" disabled={busy} onClick={() => void run(refresh)}>Retry loading</button></div>}

      {pages === null && !error ? (
        <p>Loading…</p>
      ) : pages === null ? null : pages.length === 0 ? (
        <p className="sp-empty">No sellpages yet. Create one above.</p>
      ) : (
        <table className="sp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Published At</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td>{page.name}</td>
                <td>/{page.slug}</td>
                <td>
                  <span className={`sp-status sp-status--${page.status}`}>{page.status}</span>
                </td>
                <td>{new Date(page.updatedAt).toLocaleString()}</td>
                <td>{page.publishedAt === null ? 'Never' : new Date(page.publishedAt).toLocaleString()}</td>
                <td className="sp-table__actions">
                  <button type="button" onClick={() => navigate(`/admin/sellpages/${page.id}`)}>
                    Edit
                  </button>
                  <a href={`/s/${page.slug}`} target="_blank" rel="noreferrer">
                    Preview
                  </a>
                  <button type="button" disabled={busy} onClick={() => void run(() => handleDuplicate(page.id))}>
                    Duplicate
                  </button>
                  {/* Asks first, like Unpublish does. From a list row this sits
                      one misclick away from Duplicate and Delete, and it puts
                      the current draft in front of the public immediately. */}
                  <button type="button" disabled={busy} onClick={() => {
                    const what = page.status === 'published' ? 'Republish' : 'Publish'
                    if (confirm(`${what} this page? The current draft becomes what visitors see at /s/${page.slug}.`)) {
                      void run(async () => { await publishPage(page.id, null); await refresh() })
                    }
                  }}>{page.status === 'published' ? 'Republish' : 'Publish'}</button>
                  {page.status === 'published' && <button type="button" disabled={busy} onClick={() => {
                    if (confirm('Unpublish this page? Visitors will no longer be able to view it.')) {
                      void run(async () => { await unpublishPage(page.id, null); await refresh() })
                    }
                  }}>Unpublish</button>}
                  <button type="button" disabled={busy} className="sp-danger" onClick={() => void run(() => handleDelete(page.id))}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
