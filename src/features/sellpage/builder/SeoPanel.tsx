import { defaultSeo, type SellpageSeo } from '../schemas/sellpage.types'
import { ImageFieldInput } from '../media/ImageFieldInput'

type Props = {
  seo: SellpageSeo
  onChange: (next: SellpageSeo) => void
  onClose: () => void
}

/**
 * Panel for editing DRAFT SEO parameters (Title, Description, ogImage, Canonical, noIndex).
 * Writes to draftSeo only — live SEO updates upon publish.
 */
export function SeoPanel({ seo, onChange, onClose }: Props) {
  const titleLen = seo.title.length
  const descLen = seo.description.length

  return (
    <aside className="sp-theme sp-seo-panel" aria-label="SEO settings">
      <header className="sp-theme__head">
        <h2>SEO Settings</h2>
        <button type="button" onClick={onClose} aria-label="Close SEO settings">
          ✕
        </button>
      </header>

      <p className="sp-theme__hint">
        Configure how search engines and social networks display this page. Changes take effect on publish.
      </p>

      <section>
        <h3>Search Engine Metadata</h3>
        <label className="sp-theme__row sp-theme__row--vertical">
          <div className="sp-seo__label-row">
            <span>Page Title</span>
            <span className={`sp-seo__count ${titleLen > 60 ? 'sp-seo__count--warning' : ''}`}>
              {titleLen} / 60 chars
            </span>
          </div>
          <input
            type="text"
            placeholder="e.g. Best Product Sellpage — Special Offer"
            value={seo.title}
            onChange={(e) => onChange({ ...seo, title: e.target.value })}
          />
        </label>

        <label className="sp-theme__row sp-theme__row--vertical">
          <div className="sp-seo__label-row">
            <span>Meta Description</span>
            <span className={`sp-seo__count ${descLen > 160 ? 'sp-seo__count--warning' : ''}`}>
              {descLen} / 160 chars
            </span>
          </div>
          <textarea
            rows={3}
            placeholder="Short summary of the page for Google search results..."
            value={seo.description}
            onChange={(e) => onChange({ ...seo, description: e.target.value })}
          />
        </label>
      </section>

      <section>
        <h3>Social Sharing (Open Graph)</h3>
        <div className="sp-theme__row sp-theme__row--vertical">
          <ImageFieldInput
            id="sp-seo-og-image"
            label="OG Image (Social Preview)"
            value={seo.ogImage}
            onChange={(url) => onChange({ ...seo, ogImage: url })}
          />
        </div>
      </section>

      <section>
        <h3>Advanced SEO</h3>
        <label className="sp-theme__row sp-theme__row--vertical">
          <span>Canonical URL (optional)</span>
          <input
            type="url"
            placeholder="https://example.com/original-page"
            value={seo.canonicalUrl}
            onChange={(e) => onChange({ ...seo, canonicalUrl: e.target.value })}
          />
        </label>

        <label className="sp-theme__row sp-theme__row--checkbox">
          <input
            type="checkbox"
            checked={seo.noIndex}
            onChange={(e) => onChange({ ...seo, noIndex: e.target.checked })}
          />
          <div>
            <strong>Hide from Search Engines (noindex)</strong>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b6a63' }}>
              Instruct search bots not to index this page in search results.
            </p>
          </div>
        </label>
      </section>

      <button type="button" className="sp-theme__reset" onClick={() => onChange(defaultSeo())}>
        Reset SEO to defaults
      </button>
    </aside>
  )
}
