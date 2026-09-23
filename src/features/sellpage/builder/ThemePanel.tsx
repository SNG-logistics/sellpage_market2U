import { ImageFieldInput } from '../media/ImageFieldInput'
import type { SellpageTheme } from '../schemas/sellpage.types'
import { defaultTheme } from '../schemas/sellpage.types'
import { themePresets, type ThemePresetKey } from '../theme/themePresets'

type Props = {
  theme: SellpageTheme
  onChange: (next: SellpageTheme) => void
  onClose: () => void
}

const COLOR_FIELDS: { key: keyof SellpageTheme['colors']; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'muted', label: 'Muted' },
]

// Thai and Lao first — this builder's pages are written in those scripts, and
// most Latin-first stacks render them with mismatched metrics.
const IMAGE_FITS: { value: NonNullable<SellpageTheme['backgroundImageFit']>; label: string }[] = [
  { value: 'cover', label: 'Fill the screen' },
  { value: 'contain', label: 'Show whole image' },
  { value: 'repeat', label: 'Tile (repeat)' },
]

const FONT_STACKS = [
  { label: 'Noto Sans Thai / Lao', value: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif" },
  { label: 'Noto Serif Thai / Lao', value: "'Noto Serif Thai', 'Noto Serif Lao', Georgia, serif" },
  { label: 'System sans', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Georgia serif', value: 'Georgia, "Times New Roman", serif' },
]

/**
 * Edits the page's DRAFT theme. Like every other edit in the builder this
 * writes the draft only — the live page changes on Publish, never here.
 */
export function ThemePanel({ theme, onChange, onClose }: Props) {
  const setColor = (key: keyof SellpageTheme['colors'], value: string) =>
    onChange({ ...theme, colors: { ...theme.colors, [key]: value } })

  const setTypography = (patch: Partial<SellpageTheme['typography']>) =>
    onChange({ ...theme, typography: { ...theme.typography, ...patch } })

  // A preset is a look; the background photo is the seller's content. Keep
  // it across a preset change — the veil follows the new background colour.
  const applyPreset = (key: ThemePresetKey) => {
    const preset = themePresets[key]
    if (preset) {
      onChange({
        ...preset.theme,
        backgroundImage: theme.backgroundImage,
        backgroundImageFit: theme.backgroundImageFit,
        backgroundOverlay: theme.backgroundOverlay,
      })
    }
  }

  const overlay = theme.backgroundOverlay ?? 0

  return (
    <aside className="sp-theme" aria-label="Theme settings">
      <header className="sp-theme__head">
        <h2>Theme</h2>
        <button type="button" onClick={onClose} aria-label="Close theme settings">
          ✕
        </button>
      </header>

      <p className="sp-theme__hint">Applies to the whole page. Takes effect publicly when you publish.</p>

      <section>
        <h3>Theme Presets</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
          {(Object.keys(themePresets) as ThemePresetKey[]).map((key) => {
            const p = themePresets[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #d4af37',
                  background: '#1a1a1a',
                  color: '#f6e27a',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h3>Colors</h3>
        {COLOR_FIELDS.map(({ key, label }) => (
          <label key={key} className="sp-theme__row">
            <span>{label}</span>
            <span className="sp-theme__color">
              <input
                type="color"
                aria-label={`${label} colour picker`}
                value={/^#[0-9a-fA-F]{6}$/.test(theme.colors[key]) ? theme.colors[key] : '#000000'}
                onChange={(e) => setColor(key, e.target.value)}
              />
              <input type="text" value={theme.colors[key]} onChange={(e) => setColor(key, e.target.value)} />
            </span>
          </label>
        ))}
      </section>

      <section>
        <h3>Typography</h3>
        <label className="sp-theme__row">
          <span>Heading font</span>
          <select value={theme.typography.headingFont} onChange={(e) => setTypography({ headingFont: e.target.value })}>
            {FONT_STACKS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="sp-theme__row">
          <span>Body font</span>
          <select value={theme.typography.bodyFont} onChange={(e) => setTypography({ bodyFont: e.target.value })}>
            {FONT_STACKS.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="sp-theme__row">
          <span>Type scale ({theme.typography.scale.toFixed(2)}×)</span>
          <input
            type="range"
            min={0.8}
            max={1.4}
            step={0.05}
            value={theme.typography.scale}
            onChange={(e) => setTypography({ scale: Number(e.target.value) })}
          />
        </label>
      </section>

      <section>
        <h3>Layout</h3>
        <label className="sp-theme__row">
          <span>Page background</span>
          <input type="text" value={theme.background} onChange={(e) => onChange({ ...theme, background: e.target.value })} />
        </label>
        <div className="sp-theme__row">
          <ImageFieldInput
            id="sp-theme-background-image"
            label="Background image"
            value={theme.backgroundImage}
            onChange={(url) => onChange({ ...theme, backgroundImage: url })}
          />
        </div>
        {theme.backgroundImage ? (
          <>
            <label className="sp-theme__row">
              <span>Image fit</span>
              <select
                value={theme.backgroundImageFit ?? 'cover'}
                onChange={(e) => onChange({ ...theme, backgroundImageFit: e.target.value as SellpageTheme['backgroundImageFit'] })}
              >
                {IMAGE_FITS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="sp-theme__row">
              <span>Image overlay ({overlay}%)</span>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={overlay}
                onChange={(e) => onChange({ ...theme, backgroundOverlay: Number(e.target.value) })}
              />
            </label>
          </>
        ) : null}
        <label className="sp-theme__row">
          <span>Max width (0 = full)</span>
          <input
            type="number"
            min={0}
            max={1600}
            value={theme.maxWidth}
            onChange={(e) => onChange({ ...theme, maxWidth: Number(e.target.value) })}
          />
        </label>
        <label className="sp-theme__row">
          <span>Spacing unit (px)</span>
          <input
            type="number"
            min={0}
            max={64}
            value={theme.spacing}
            onChange={(e) => onChange({ ...theme, spacing: Number(e.target.value) })}
          />
        </label>
      </section>

      <button type="button" className="sp-theme__reset" onClick={() => onChange(defaultTheme())}>
        Reset to defaults
      </button>
    </aside>
  )
}
