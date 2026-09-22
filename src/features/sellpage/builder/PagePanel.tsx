import { useEffect, useState } from 'react'
import type { SellpageDocument, SellpageSettings, SellpageVersion } from '../schemas/sellpage.types'
import { changeSlug, getVersions, restoreVersion, unpublishPage } from '../services/sellpageService'

type Props = {
  page: SellpageDocument
  settings: SellpageSettings
  userId: string | null
  onChangeSettings: (next: SellpageSettings) => void
  onPageUpdated: (updatedPage: SellpageDocument) => void
  onClose: () => void
}

type Tab = 'publishing' | 'settings' | 'history'

export function PagePanel({ page, settings, userId, onChangeSettings, onPageUpdated, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('publishing')
  const [slugInput, setSlugInput] = useState(page.slug)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [savingSlug, setSavingSlug] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  
  // null = not fetched yet. Loading is derived from that rather than held in
  // its own state, so the effect never sets state during its own render pass.
  const [versions, setVersions] = useState<SellpageVersion[] | null>(null)
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const loadingVersions = versions === null && historyError === null

  useEffect(() => {
    if (activeTab !== 'history') return
    let cancelled = false
    getVersions(page.id)
      .then((list) => {
        if (!cancelled) {
          setVersions(list)
          setHistoryError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setHistoryError(err instanceof Error ? err.message : 'Failed to load versions.')
      })
    return () => {
      cancelled = true
    }
  }, [activeTab, page.id])

  const handleChangeSlug = async () => {
    if (!slugInput.trim() || slugInput === page.slug) return
    setSlugError(null)
    setSavingSlug(true)
    try {
      const updated = await changeSlug(page.id, slugInput, userId)
      onPageUpdated(updated)
      setSlugInput(updated.slug)
    } catch (err) {
      setSlugError(err instanceof Error ? err.message : 'Failed to update slug.')
    } finally {
      setSavingSlug(false)
    }
  }

  const handleUnpublish = async () => {
    // Visitors lose the page the moment this succeeds; the draft is untouched.
    if (!confirm(`Unpublish this page? /s/${page.slug} will show "Page unavailable" until you publish again.`)) return
    setUnpublishing(true)
    try {
      const updated = await unpublishPage(page.id, userId)
      onPageUpdated(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unpublish failed.')
    } finally {
      setUnpublishing(false)
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('Restore this snapshot to your DRAFT? Unsaved draft changes will be replaced.')) return
    setRestoringVersionId(versionId)
    try {
      const restoredDoc = await restoreVersion(page.id, versionId, userId)
      onPageUpdated(restoredDoc)
      onClose()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restore version failed.')
    } finally {
      setRestoringVersionId(null)
    }
  }

  const updateTracking = (patch: Partial<SellpageSettings['tracking']>) => {
    onChangeSettings({
      ...settings,
      tracking: { ...settings.tracking, ...patch },
    })
  }

  return (
    <aside className="sp-theme sp-page-panel" aria-label="Page management">
      <header className="sp-theme__head">
        <h2>Page & Settings</h2>
        <button type="button" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </header>

      <nav className="sp-page-panel__tabs">
        <button
          type="button"
          className={`sp-page-panel__tab ${activeTab === 'publishing' ? 'sp-page-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('publishing')}
        >
          Publishing
        </button>
        <button
          type="button"
          className={`sp-page-panel__tab ${activeTab === 'settings' ? 'sp-page-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Tracking
        </button>
        <button
          type="button"
          className={`sp-page-panel__tab ${activeTab === 'history' ? 'sp-page-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </nav>

      {activeTab === 'publishing' && (
        <section>
          <h3>Status & Public URL</h3>
          <div className="sp-theme__row">
            <span>Status</span>
            <span className={`sp-status-badge sp-status-badge--${page.status}`}>
              {page.status.toUpperCase()}
            </span>
          </div>

          {page.status === 'published' && (
            <div className="sp-theme__row sp-theme__row--vertical">
              <span>Public Link</span>
              <a
                href={`/s/${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sp-page-panel__link"
              >
                /s/{page.slug} ↗
              </a>
            </div>
          )}

          <div className="sp-theme__row sp-theme__row--vertical">
            <span>URL Slug</span>
            <div className="sp-page-panel__slug-input">
              <input
                type="text"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="my-sellpage-slug"
              />
              <button
                type="button"
                disabled={savingSlug || slugInput === page.slug || !slugInput.trim()}
                onClick={handleChangeSlug}
              >
                {savingSlug ? 'Saving…' : 'Update'}
              </button>
            </div>
            {slugError ? <p className="sp-page-panel__error">{slugError}</p> : null}
          </div>

          {page.status === 'published' && (
            <div className="sp-page-panel__actions">
              <button
                type="button"
                className="sp-btn-danger"
                disabled={unpublishing}
                onClick={handleUnpublish}
              >
                {unpublishing ? 'Unpublishing…' : 'Unpublish Page'}
              </button>
            </div>
          )}
        </section>
      )}

      {activeTab === 'settings' && (
        <section>
          <h3>Language & Analytics</h3>
          <p className="sp-theme__hint">
            Tracking ids are saved with the page but not yet emitted on the public page — nothing fires until that ships.
          </p>
          <label className="sp-theme__row">
            <span>Language</span>
            <select
              value={settings.language}
              onChange={(e) => onChangeSettings({ ...settings, language: e.target.value })}
            >
              <option value="th">Thai (ไทย)</option>
              <option value="lo">Lao (ลาว)</option>
              <option value="en">English (US)</option>
            </select>
          </label>

          <label className="sp-theme__row sp-theme__row--vertical">
            <span>Facebook Pixel ID</span>
            <input
              type="text"
              placeholder="e.g. 123456789012345"
              value={settings.tracking.facebookPixelId}
              onChange={(e) => updateTracking({ facebookPixelId: e.target.value })}
            />
          </label>

          <label className="sp-theme__row sp-theme__row--vertical">
            <span>Google Analytics ID (GA4)</span>
            <input
              type="text"
              placeholder="e.g. G-XXXXXXXXXX"
              value={settings.tracking.googleAnalyticsId}
              onChange={(e) => updateTracking({ googleAnalyticsId: e.target.value })}
            />
          </label>

          <label className="sp-theme__row sp-theme__row--vertical">
            <span>TikTok Pixel ID</span>
            <input
              type="text"
              placeholder="e.g. CXXXXXXXXXXXXXXXXX"
              value={settings.tracking.tiktokPixelId}
              onChange={(e) => updateTracking({ tiktokPixelId: e.target.value })}
            />
          </label>
        </section>
      )}

      {activeTab === 'history' && (
        <section>
          <h3>Publish History & Checkpoints</h3>
          {loadingVersions && <p className="sp-theme__hint">Loading version history…</p>}
          {historyError && <p className="sp-page-panel__error">{historyError}</p>}
          {versions?.length === 0 && (
            <p className="sp-theme__hint">No versions saved yet. Publish the page to create snapshots.</p>
          )}

          <ul className="sp-history-list">
            {(versions ?? []).map((ver) => (
              <li key={ver.id} className="sp-history-item">
                <div className="sp-history-item__info">
                  <strong>Version #{ver.version}</strong>
                  <time>{new Date(ver.timestamp).toLocaleString()}</time>
                </div>
                <button
                  type="button"
                  className="sp-history-item__restore"
                  disabled={restoringVersionId === ver.id}
                  onClick={() => handleRestoreVersion(ver.id)}
                >
                  {restoringVersionId === ver.id ? 'Restoring…' : 'Restore to Draft'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  )
}
