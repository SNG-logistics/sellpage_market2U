import { useCallback, useState } from 'react'
import { Puck } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import { puckConfig } from '../blocks'
import { sellpageViewports } from './viewports'
import { ThemePanel } from './ThemePanel'
import { useAutosave, type AutosaveStatus } from '../hooks/useAutosave'
import type { SellpageData, SellpageDocument, SellpageTheme } from '../schemas/sellpage.types'
import { publishPage, saveDraft, saveDraftTheme, validateForPublish } from '../services/sellpageService'

type Props = {
  page: SellpageDocument
  userId: string | null
  onBack: () => void
  onPublished: (page: SellpageDocument) => void
}

const statusCopy: Record<AutosaveStatus, string> = {
  idle: 'Saved',
  unsaved: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Error saving draft',
}

/**
 * Puck IS the canvas, drag/drop, block ordering, insertion, selection,
 * fields and viewports here — this component only wires autosave and
 * publish around it. No custom canvas or DnD is implemented.
 */
export function SellpageBuilder({ page, userId, onBack, onPublished }: Props) {
  const [draft, setDraft] = useState<SellpageData>(page.draftConfig)
  const [theme, setTheme] = useState<SellpageTheme>(page.draftTheme)
  const [themeOpen, setThemeOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const persistDraft = useCallback(
    (data: SellpageData) => saveDraft(page.id, data, userId).then(() => undefined),
    [page.id, userId],
  )
  const autosaveStatus = useAutosave(draft, persistDraft, 1200)

  // The theme autosaves on the same terms as the block data: draft only,
  // debounced, never on every keystroke of a colour field.
  const persistTheme = useCallback(
    (next: SellpageTheme) => saveDraftTheme(page.id, next, userId).then(() => undefined),
    [page.id, userId],
  )
  const themeStatus = useAutosave(theme, persistTheme, 1200)

  // One indicator for the whole page: an error or an in-flight save on
  // either the blocks or the theme is what the user needs to see.
  const saveStatus: AutosaveStatus =
    autosaveStatus === 'error' || themeStatus === 'error'
      ? 'error'
      : autosaveStatus === 'saving' || themeStatus === 'saving'
        ? 'saving'
        : autosaveStatus === 'unsaved' || themeStatus === 'unsaved'
          ? 'unsaved'
          : autosaveStatus

  const handlePublish = async () => {
    setPublishError(null)
    const validation = validateForPublish({ ...page, draftConfig: draft })
    if (!validation.ok) {
      setPublishError(validation.errors.join(' '))
      return
    }
    setPublishing(true)
    try {
      await saveDraft(page.id, draft, userId)
      const published = await publishPage(page.id, userId)
      onPublished(published)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="sp-builder">
      <Puck
        config={puckConfig}
        data={draft}
        viewports={sellpageViewports}
        onChange={setDraft}
        headerTitle={page.name}
        headerPath={`/${page.slug}`}
        renderHeaderActions={() => (
          <div className="sp-builder__header-actions">
            <span className={`sp-autosave sp-autosave--${saveStatus}`}>{statusCopy[saveStatus]}</span>
            {publishError ? <span className="sp-publish-error">{publishError}</span> : null}
            <button type="button" className="sp-btn-back" onClick={onBack}>
              Back
            </button>
            <button type="button" className="sp-btn-theme" onClick={() => setThemeOpen((open) => !open)} aria-pressed={themeOpen}>
              Theme
            </button>
            <button type="button" className="sp-btn-publish" onClick={handlePublish} disabled={publishing}>
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        )}
      />
      {themeOpen ? <ThemePanel theme={theme} onChange={setTheme} onClose={() => setThemeOpen(false)} /> : null}
    </div>
  )
}
