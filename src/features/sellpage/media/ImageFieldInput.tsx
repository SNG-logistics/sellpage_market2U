import { lazy, Suspense, useContext, useState } from 'react'
import { MediaContext } from './mediaContext'
import { isMediaLibraryAvailable } from '../services/mediaService'
import { safeImageUrl } from '../utils/safeUrl'

// This component is reached from `blocks/fields.tsx`, so it ships in the
// PUBLIC bundle too. The dialog — and through it the Firebase SDK — must stay
// behind this lazy boundary.
const MediaLibraryDialog = lazy(() => import('./MediaLibraryDialog'))

type Props = {
  id: string
  label: string
  value: string | undefined
  readOnly?: boolean
  onChange: (value: string) => void
}

/**
 * Image URL input with a media-library picker.
 *
 * The stored value is always a plain URL string, exactly as before the
 * library existed — pasting a URL keeps working, and nothing about a saved
 * page changes.
 */
export function ImageFieldInput({ id, label, value, readOnly, onChange }: Props) {
  const media = useContext(MediaContext)
  const [open, setOpen] = useState(false)
  const preview = safeImageUrl(value)
  const canBrowse = media !== null && isMediaLibraryAvailable()

  return (
    <div className="sp-image-field">
      <label className="sp-image-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="sp-image-field__controls">
        {preview ? <img className="sp-image-field__thumb" src={preview} alt="" /> : null}
        <input
          id={id}
          type="text"
          placeholder="https://…"
          value={value ?? ''}
          disabled={readOnly}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="sp-image-field__actions">
        {canBrowse ? (
          <button type="button" disabled={readOnly} onClick={() => setOpen(true)}>
            Choose or upload…
          </button>
        ) : null}
        <button type="button" disabled={readOnly || !value} onClick={() => onChange('')}>
          Clear
        </button>
      </div>
      {media !== null && !isMediaLibraryAvailable() ? (
        <p className="sp-image-field__hint">Uploads need Firebase Storage. Paste an image URL for now.</p>
      ) : null}
      {open && media ? (
        <Suspense fallback={null}>
          <MediaLibraryDialog
            media={media}
            selectedUrl={value ?? ''}
            onSelect={(url) => {
              onChange(url)
              setOpen(false)
            }}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
