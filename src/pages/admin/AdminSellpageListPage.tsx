import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SellpageDocument } from '../../features/sellpage/schemas/sellpageSchema'
import { createPage, deletePage, duplicatePage, listPages } from '../../features/sellpage/services/sellpageService'

/** /admin/sellpages — list, create, duplicate, delete. Edit/preview/publish live in the editor route. */
export function AdminSellpageListPage() {
  const navigate = useNavigate()
  const [pages, setPages] = useState<SellpageDocument[] | null>(null)
  const [newName, setNewName] = useState('')

  const refresh = () => listPages().then(setPages)

  useEffect(() => {
    refresh()
  }, [])

  const handleCreate = async () => {
    const name = newName.trim() || 'Untitled page'
    const page = await createPage(name, null)
    setNewName('')
    navigate(`/admin/sellpages/${page.id}`)
  }

  const handleDuplicate = async (id: string) => {
    await duplicatePage(id, null)
    refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this page? This cannot be undone.')) return
    await deletePage(id)
    refresh()
  }

  return (
    <div className="sp-admin-page">
      <header className="sp-admin-page__header">
        <h1>Sellpages</h1>
        <div className="sp-admin-page__new">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New page name" />
          <button type="button" onClick={handleCreate}>
            Create
          </button>
        </div>
      </header>

      {pages === null ? (
        <p>Loading…</p>
      ) : pages.length === 0 ? (
        <p className="sp-empty">No sellpages yet. Create one above.</p>
      ) : (
        <table className="sp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Updated</th>
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
                <td className="sp-table__actions">
                  <button type="button" onClick={() => navigate(`/admin/sellpages/${page.id}`)}>
                    Edit
                  </button>
                  <a href={`/s/${page.slug}`} target="_blank" rel="noreferrer">
                    Preview
                  </a>
                  <button type="button" onClick={() => handleDuplicate(page.id)}>
                    Duplicate
                  </button>
                  <button type="button" className="sp-danger" onClick={() => handleDelete(page.id)}>
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
