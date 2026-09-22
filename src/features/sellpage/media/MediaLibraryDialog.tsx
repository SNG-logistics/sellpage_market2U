import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MediaContextValue } from './mediaContext'
import {
  MEDIA_ACCEPTED_TYPES,
  deleteMedia,
  findMediaUsage,
  listMedia,
  uploadMedia,
  validateMediaFile,
  type MediaItem,
} from '../services/mediaService'

type Props = {
  media: MediaContextValue
  selectedUrl: string
  onSelect: (url: string) => void
  onClose: () => void
}

/** Firebase reports a rules rejection as a code; say what it means for an admin. */
const describeError = (err: unknown, fallback: string): string => {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : ''
  if (code === 'storage/unauthorized' || code === 'storage/unauthenticated') {
    return 'Storage refused the request. Your account needs the admin claim, and storage.rules must be deployed.'
  }
  if (code === 'storage/quota-exceeded') return 'The storage quota for this project is used up.'
  if (code === 'storage/retry-limit-exceeded' || code === 'storage/canceled') return 'The connection dropped. Try again.'
  return err instanceof Error && err.message ? err.message : fallback
}

const formatSize = (bytes: number): string => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

/**
 * The page's media library: browse, upload, pick, delete.
 *
 * Default export because it is only ever loaded through `React.lazy` — see
 * ImageFieldInput.
 */
export default function MediaLibraryDialog({ media, selectedUrl, onSelect, onClose }: Props) {
  const { pageId, draftConfig, publishedConfig } = media
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<{ name: string; fraction: number } | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    listMedia(pageId).then(
      (next) => !cancelled && setItems(next),
      (err) => {
        if (cancelled) return
        setItems([])
        setError(describeError(err, 'Could not load the media library.'))
      },
    )
    return () => {
      cancelled = true
    }
  }, [pageId])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError(null)
      const problems: string[] = []
      // One at a time: progress stays readable, and a slow mobile uplink is
      // not split across several large images at once.
      for (const file of files) {
        const problem = validateMediaFile(file)
        if (problem) {
          problems.push(`${file.name}: ${problem}`)
          continue
        }
        setUploading({ name: file.name, fraction: 0 })
        try {
          const item = await uploadMedia(pageId, file, (fraction) => setUploading({ name: file.name, fraction }))
          setItems((current) => [item, ...(current ?? [])])
        } catch (err) {
          problems.push(`${file.name}: ${describeError(err, 'Upload failed.')}`)
        }
      }
      setUploading(null)
      if (problems.length > 0) setError(problems.join(' '))
    },
    [pageId],
  )

  const term = search.trim().toLowerCase()
  const visible = (items ?? []).filter((item) => item.name.toLowerCase().includes(term))

  const handleDelete = async (item: MediaItem) => {
    setError(null)
    setConfirmingDelete(null)
    try {
      await deleteMedia(pageId, item, { draftConfig, publishedConfig })
      setItems((current) => (current ?? []).filter((other) => other.path !== item.path))
    } catch (err) {
      setError(describeError(err, 'Could not delete the image.'))
    }
  }

  return createPortal(
    <div className="sp-media__backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="sp-media" role="dialog" aria-modal="true" aria-label="Media library">
        <header className="sp-media__head">
          <h2>Media library</h2>
          <div className="sp-media__head-actions">
            <input
              ref={fileInput}
              type="file"
              hidden
              multiple
              accept={MEDIA_ACCEPTED_TYPES.join(',')}
              aria-label="Upload images"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                // Reset so choosing the same file again still fires a change.
                event.target.value = ''
                if (files.length > 0) void handleFiles(files)
              }}
            />
            <button type="button" className="sp-media__upload" disabled={uploading !== null} onClick={() => fileInput.current?.click()}>
              Upload images
            </button>
            <button type="button" onClick={onClose} aria-label="Close media library">
              ✕
            </button>
          </div>
        </header>

        {uploading ? (
          <div className="sp-media__progress" role="status">
            <span>
              Uploading {uploading.name}… {Math.round(uploading.fraction * 100)}%
            </span>
            <progress value={uploading.fraction} max={1} />
          </div>
        ) : null}

        {error ? (
          <p className="sp-media__error" role="alert">
            {error}
          </p>
        ) : null}

        {/* Only worth showing once there is something to search through. */}
        {items !== null && items.length > 0 ? (
          <label className="sp-media__search">
            <span>Search images</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        ) : null}

        {items === null ? (
          <p className="sp-media__empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="sp-media__empty">No images yet. Upload PNG, JPEG, GIF, WebP or SVG files up to 10 MB.</p>
        ) : visible.length === 0 ? (
          // Without this the grid renders empty and a search that matches
          // nothing looks like the library itself has gone missing.
          <p className="sp-media__empty">No image matches “{search.trim()}”.</p>
        ) : (
          <ul className="sp-media__grid">
            {visible.map((item) => {
              const usage = findMediaUsage(item.url, { draftConfig, publishedConfig })
              return (
                <li key={item.path} className={item.url === selectedUrl ? 'sp-media__item sp-media__item--selected' : 'sp-media__item'}>
                  <button type="button" className="sp-media__pick" onClick={() => onSelect(item.url)} aria-label={`Use ${item.name}`}>
                    <img src={item.url} alt="" loading="lazy" />
                  </button>
                  <div className="sp-media__meta">
                    <span className="sp-media__name" title={item.name}>
                      {item.name}
                    </span>
                    <span>
                      {formatSize(item.size)}
                      {usage ? ` · in ${usage} page` : ''}
                    </span>
                  </div>
                  {confirmingDelete === item.path ? (
                    <div className="sp-media__confirm">
                      <button type="button" className="sp-danger" onClick={() => void handleDelete(item)}>
                        Delete permanently
                      </button>
                      <button type="button" onClick={() => setConfirmingDelete(null)}>
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="sp-media__delete"
                      // Refused by the service as well; disabling it here just
                      // says why before the click instead of after.
                      disabled={usage !== null}
                      title={usage ? `Used in the ${usage} page — remove it there first.` : undefined}
                      onClick={() => setConfirmingDelete(item.path)}
                      aria-label={`Delete ${item.name}`}
                    >
                      Delete
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {items !== null && items.length > 0 && !items.some((item) => item.name.toLowerCase().includes(search.trim().toLowerCase())) && <p className="sp-media__empty">No matching images.</p>}
      </div>
    </div>,
    document.body,
  )
}
