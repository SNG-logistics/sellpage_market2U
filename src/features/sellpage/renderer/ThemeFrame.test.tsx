import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemePanel } from '../builder/ThemePanel'
import { defaultTheme, type SellpageTheme } from '../schemas/sellpage.types'
import { ThemeFrame } from './ThemeFrame'

afterEach(cleanup)

const frame = (theme: SellpageTheme) =>
  render(
    <ThemeFrame theme={theme}>
      <p>content</p>
    </ThemeFrame>,
  ).container

const layers = (root: HTMLElement) => root.querySelectorAll<HTMLElement>('.sp-page-bg, .sp-page-bg__veil')
const contentOf = (root: HTMLElement) => within(root).getByText('content').parentElement as HTMLElement

describe('ThemeFrame — pages saved before the background image existed', () => {
  // Rule 8: saved themes have no backgroundImage key at all, and a published
  // page re-renders with whatever frame is deployed. They must get exactly
  // the markup they had: two plain wrappers, nothing layered, nothing
  // positioned that could shift an absolutely placed block.
  it('renders the same two wrappers and nothing else', () => {
    const root = frame(defaultTheme())
    const outer = root.firstElementChild as HTMLElement

    expect(layers(root)).toHaveLength(0)
    expect(outer.children).toHaveLength(1)
    expect(contentOf(root).style.position).toBe('')
    expect(contentOf(root).style.zIndex).toBe('')
  })

  it('treats an emptied field the same as a missing one', () => {
    expect(frame({ ...defaultTheme(), backgroundImage: '' }).innerHTML).toBe(frame(defaultTheme()).innerHTML)
  })
})

describe('ThemeFrame — background image', () => {
  const withImage = (patch: Partial<SellpageTheme> = {}): SellpageTheme => ({
    ...defaultTheme(),
    backgroundImage: 'https://cdn.example.com/bg.jpg',
    ...patch,
  })

  it('puts the photo in a fixed layer behind the content, quoted', () => {
    const root = frame(withImage())
    const [layer] = layers(root)

    expect(layer.getAttribute('aria-hidden')).toBe('true')
    expect(layer.style.position).toBe('fixed')
    expect(layer.getAttribute('style')).toContain('url("https://cdn.example.com/bg.jpg")')
    // Above the fixed layer, so every block stays clickable and visible.
    expect(contentOf(root).style.position).toBe('relative')
    expect(contentOf(root).style.zIndex).toBe('1')
  })

  it('accepts a same-origin path, the free route without Storage', () => {
    const [layer] = layers(frame(withImage({ backgroundImage: '/images/bg.webp' })))
    expect(layer.getAttribute('style')).toContain('url("/images/bg.webp")')
  })

  it('renders nothing for a URL safeImageUrl refuses', () => {
    for (const bad of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', '//evil.example/x.jpg']) {
      const root = frame(withImage({ backgroundImage: bad }))
      expect(layers(root)).toHaveLength(0)
      expect(contentOf(root).style.position).toBe('')
    }
  })

  it('veils the photo in the page background colour, clamped to 90%', () => {
    const veil = (overlay: unknown) =>
      frame(withImage({ backgroundOverlay: overlay as number })).querySelector<HTMLElement>('.sp-page-bg__veil')

    expect(veil(undefined)).toBeNull()
    expect(veil(0)).toBeNull()
    expect(veil(Number.NaN)).toBeNull()
    expect(veil(40)?.style.opacity).toBe('0.4')
    expect(veil(500)?.style.opacity).toBe('0.9')
    expect(veil(-20)).toBeNull()
    // The theme's own background colour, sanitized like every other colour.
    // Compared through the DOM, which normalises `#faf9f5` to `rgb(…)`.
    const probe = document.createElement('div')
    probe.style.background = defaultTheme().colors.background
    expect(veil(40)?.style.background).toBe(probe.style.background)
  })
})

describe('ThemePanel — background image controls', () => {
  it('shows fit and overlay only once there is an image', () => {
    const onChange = vi.fn()
    const { rerender } = render(<ThemePanel theme={defaultTheme()} onChange={onChange} onClose={() => {}} />)

    expect(screen.getByLabelText('Background image')).toBeTruthy()
    expect(screen.queryByText('Image fit')).toBeNull()

    rerender(<ThemePanel theme={{ ...defaultTheme(), backgroundImage: '/images/bg.webp' }} onChange={onChange} onClose={() => {}} />)
    expect(screen.getByText('Image fit')).toBeTruthy()
    expect(screen.getByText('Image overlay (0%)')).toBeTruthy()
  })

  it('keeps the photo when a preset changes the look', () => {
    const onChange = vi.fn()
    const theme: SellpageTheme = { ...defaultTheme(), backgroundImage: '/images/bg.webp', backgroundOverlay: 40 }
    render(<ThemePanel theme={theme} onChange={onChange} onClose={() => {}} />)

    const presetButton = screen.getByRole('heading', { name: 'Theme Presets' }).parentElement!.querySelector('button')!
    fireEvent.click(presetButton)

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ backgroundImage: '/images/bg.webp', backgroundOverlay: 40 }))
  })
})
