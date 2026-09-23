import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Puck } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import { puckConfig } from '../blocks'
import { sellpageViewports } from './viewports'
import { ThemePanel } from './ThemePanel'
import { SeoPanel } from './SeoPanel'
import { PagePanel } from './PagePanel'
import { MediaContext, type MediaContextValue } from '../media/mediaContext'
import { ThemeFrame } from '../renderer/ThemeFrame'
import { useAutosave, type AutosaveStatus } from '../hooks/useAutosave'
import type { SellpageData, SellpageDocument, SellpageSeo, SellpageSettings, SellpageTheme } from '../schemas/sellpage.types'
import {
  publishPage,
  saveDraft,
  saveDraftSeo,
  saveDraftSettings,
  saveDraftTheme,
  validateForPublish,
} from '../services/sellpageService'

type Props = {
  page: SellpageDocument
  userId: string | null
  onBack: () => void
  onPublished: (page: SellpageDocument) => void
}

type ActivePanel = 'none' | 'theme' | 'seo' | 'page'

const panelLabels = { theme: 'Theme', seo: 'SEO', page: 'Page' } as const

/**
 * The draft theme, carried into Puck's canvas iframe.
 *
 * The canvas used to render blocks with no theme around them, so colour,
 * font, width and background edits only appeared after Publish. It now wraps
 * its blocks in the same `ThemeFrame` as the public page. Context rather than
 * a prop because Puck owns the iframe; its content is a React portal, so
 * context reaches it. The override is a stable module-level component — a new
 * function every render would remount the whole canvas on every keystroke.
 */
const CanvasThemeContext = createContext<SellpageTheme | null>(null)

function CanvasTheme({ children }: { children: ReactNode }) {
  const theme = useContext(CanvasThemeContext)
  return theme ? <ThemeFrame theme={theme}>{children}</ThemeFrame> : <>{children}</>
}

const canvasOverrides = { iframe: CanvasTheme }

/**
 * Open the canvas at phone width. Sellpages are read on phones — shared into
 * LINE and Facebook chats — so that is the view to build in.
 *
 * Without this Puck picks the viewport closest to the *editor's* window, which
 * on the computer a seller builds from is always Desktop 1440. Passing a
 * current viewport is what makes Puck skip that guess; the switcher still
 * offers every size. Module-level, so it seeds the state once rather than
 * resetting the viewport on every render.
 */
const mobileFirstUi = {
  viewports: {
    current: { width: sellpageViewports[0].width, height: 'auto' as const },
    controlsVisible: true,
    options: [],
  },
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
 * fields and viewports here — this component wires autosave, publish,
 * theme, SEO, and page management around it.
 */
export function SellpageBuilder({ page: initialPage, userId, onBack, onPublished }: Props) {
  const [currentPage, setCurrentPage] = useState<SellpageDocument>(initialPage)
  const [draft, setDraft] = useState<SellpageData>(initialPage.draftConfig)
  const [theme, setTheme] = useState<SellpageTheme>(initialPage.draftTheme)
  const [seo, setSeo] = useState<SellpageSeo>(initialPage.draftSeo)
  const [settings, setSettings] = useState<SellpageSettings>(initialPage.draftSettings)

  const [activePanel, setActivePanel] = useState<ActivePanel>('none')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  // Draft blocks autosave
  const persistDraft = useCallback(
    (data: SellpageData) => saveDraft(currentPage.id, data, userId).then((doc) => {
      setCurrentPage(doc)
      return undefined
    }),
    [currentPage.id, userId],
  )
  const autosaveStatus = useAutosave(draft, persistDraft, 1200)

  // Theme autosave
  const persistTheme = useCallback(
    (next: SellpageTheme) => saveDraftTheme(currentPage.id, next, userId).then((doc) => {
      setCurrentPage(doc)
      return undefined
    }),
    [currentPage.id, userId],
  )
  const themeStatus = useAutosave(theme, persistTheme, 1200)

  // SEO autosave
  const persistSeo = useCallback(
    (next: SellpageSeo) => saveDraftSeo(currentPage.id, next, userId).then((doc) => {
      setCurrentPage(doc)
      return undefined
    }),
    [currentPage.id, userId],
  )
  const seoStatus = useAutosave(seo, persistSeo, 1200)

  // Settings autosave
  const persistSettings = useCallback(
    (next: SellpageSettings) => saveDraftSettings(currentPage.id, next, userId).then((doc) => {
      setCurrentPage(doc)
      return undefined
    }),
    [currentPage.id, userId],
  )
  const settingsStatus = useAutosave(settings, persistSettings, 1200)

  // Aggregated status across blocks, theme, SEO, and settings
  const statuses = [autosaveStatus, themeStatus, seoStatus, settingsStatus]
  const saveStatus: AutosaveStatus = statuses.includes('error')
    ? 'error'
    : statuses.includes('saving')
      ? 'saving'
      : statuses.includes('unsaved')
        ? 'unsaved'
        : 'saved'

  const mediaContext = useMemo<MediaContextValue>(
    () => ({ pageId: currentPage.id, draftConfig: draft, publishedConfig: currentPage.publishedConfig }),
    [currentPage.id, currentPage.publishedConfig, draft],
  )

  const handlePublish = async () => {
    setPublishError(null)
    const validation = validateForPublish({ ...currentPage, draftConfig: draft })
    if (!validation.ok && 'errors' in validation) {
      setPublishError(validation.errors.join(' '))
      return
    }
    setPublishing(true)
    try {
      await saveDraft(currentPage.id, draft, userId)
      await saveDraftTheme(currentPage.id, theme, userId)
      await saveDraftSeo(currentPage.id, seo, userId)
      await saveDraftSettings(currentPage.id, settings, userId)

      const published = await publishPage(currentPage.id, userId)
      setCurrentPage(published)
      onPublished(published)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed.')
    } finally {
      setPublishing(false)
    }
  }

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel((prev) => (prev === panel ? 'none' : panel))
  }

  const handlePageUpdated = (updated: SellpageDocument) => {
    setCurrentPage(updated)
    setDraft(updated.draftConfig)
    setTheme(updated.draftTheme)
    setSeo(updated.draftSeo)
    setSettings(updated.draftSettings)
  }

  return (
    // Puck and the open side panel are flex siblings, so a panel never covers
    // Puck's header — the Publish button stays reachable with a panel open.
    // Every panel sits inside MediaContext: the SEO panel's OG image field
    // needs the library like any block's image field does.
    <div className="sp-builder">
      <MediaContext.Provider value={mediaContext}>
        <div className="sp-builder__canvas">
          <CanvasThemeContext.Provider value={theme}>
            <Puck
              config={puckConfig}
              data={draft}
              overrides={canvasOverrides}
              ui={mobileFirstUi}
              viewports={sellpageViewports}
              onChange={setDraft}
              headerTitle={currentPage.name}
              headerPath={`/${currentPage.slug}`}
              renderHeaderActions={() => (
                <div className="sp-builder__header-actions">
                  <span className={`sp-autosave sp-autosave--${saveStatus}`}>{statusCopy[saveStatus]}</span>
                  {publishError ? <span className="sp-publish-error">{publishError}</span> : null}
                  <button type="button" className="sp-btn-back" onClick={onBack}>
                    Back
                  </button>
                  {(['theme', 'seo', 'page'] as const).map((panel) => (
                    <button
                      key={panel}
                      type="button"
                      className="sp-btn-theme"
                      onClick={() => togglePanel(panel)}
                      aria-pressed={activePanel === panel}
                    >
                      {panelLabels[panel]}
                    </button>
                  ))}
                  <button type="button" className="sp-btn-publish" onClick={handlePublish} disabled={publishing}>
                    {publishing ? 'Publishing…' : 'Publish'}
                  </button>
                </div>
              )}
            />
          </CanvasThemeContext.Provider>
        </div>

        {activePanel === 'theme' && (
          <ThemePanel theme={theme} onChange={setTheme} onClose={() => setActivePanel('none')} />
        )}
        {activePanel === 'seo' && (
          <SeoPanel seo={seo} onChange={setSeo} onClose={() => setActivePanel('none')} />
        )}
        {activePanel === 'page' && (
          <PagePanel
            page={currentPage}
            settings={settings}
            userId={userId}
            onChangeSettings={setSettings}
            onPageUpdated={handlePageUpdated}
            onClose={() => setActivePanel('none')}
          />
        )}
      </MediaContext.Provider>
    </div>
  )
}
