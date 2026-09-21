import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { puckConfig, type BlockProps } from './index'
import { SellpageRenderer } from '../renderer/SellpageRenderer'
import { defaultTheme, type SellpageData } from '../schemas/sellpage.types'

type BlockType = keyof BlockProps

// Vitest runs without `globals`, so Testing Library cannot register its own
// cleanup — without this, each test would also see every earlier render.
afterEach(cleanup)

/**
 * Renders one block through THE renderer, the same path the public page uses.
 * `props` is deliberately loose: saved pages hold whatever prop set existed
 * when they were last edited, not the current `BlockProps`.
 */
const renderBlock = (type: BlockType, props: Record<string, unknown>) => {
  const data = {
    root: { props: {} },
    content: [{ type, props: { id: `${type}-test`, ...props } }],
  } as unknown as SellpageData
  return render(<SellpageRenderer data={data} theme={defaultTheme()} />)
}

describe('block registry', () => {
  const types = Object.keys(puckConfig.components) as BlockType[]

  it.each(types)('%s renders with its defaultProps', (type) => {
    const defaults = puckConfig.components[type].defaultProps as Record<string, unknown>
    const { container } = renderBlock(type, defaults)
    expect(container.innerHTML).not.toBe('')
  })
})

/**
 * The renderer is shared, so deployed block code re-renders every published
 * page. These are the exact prop sets saved before the B1 pass added props —
 * they must keep rendering, and keep behaving, as they did.
 */
describe('pages saved before the B1 props existed', () => {
  it('Heading renders without lineHeight', () => {
    const { getByRole } = renderBlock('Heading', {
      text: 'Old heading',
      level: 'h2',
      align: 'center',
      color: '',
      fontSize: 32,
      fontWeight: 700,
    })
    const heading = getByRole('heading', { level: 2, name: 'Old heading' })
    expect(heading.style.lineHeight).toBe('1.2')
    expect(heading.style.textAlign).toBe('center')
  })

  it('Text renders fully opaque without fontWeight, lineHeight or opacity', () => {
    const { getByText } = renderBlock('Text', { content: 'Old text', align: 'left', color: '', fontSize: 16 })
    const p = getByText('Old text')
    expect(p.style.opacity).toBe('1')
    expect(p.style.fontWeight).toBe('400')
  })

  it('Image keeps its link in the same tab and stays left-aligned', () => {
    const { getByRole } = renderBlock('Image', {
      src: 'https://example.com/a.jpg',
      alt: 'Old image',
      linkUrl: 'https://example.com/',
      width: 100,
      radius: 0,
      objectFit: 'cover',
    })
    const link = getByRole('link')
    expect(link.hasAttribute('target')).toBe(false)
    expect(link.parentElement?.style.alignItems).toBe('flex-start')
    expect(getByRole('img', { name: 'Old image' })).toBeTruthy()
  })
})

describe('Image', () => {
  const base = { ...(puckConfig.components.Image.defaultProps as Record<string, unknown>), src: 'https://example.com/a.jpg', alt: 'Pic' }

  it('sizes an unlinked image by width', () => {
    const { getByRole } = renderBlock('Image', { ...base, width: 50 })
    expect(getByRole('img').style.width).toBe('50%')
  })

  it('applies width once when linked — on the link, not again on the image', () => {
    const { getByRole } = renderBlock('Image', { ...base, width: 50, linkUrl: 'https://example.com/' })
    expect(getByRole('link').style.width).toBe('50%')
    expect(getByRole('img').style.width).toBe('100%')
  })

  it('does not cap height, so long infographics are not cropped', () => {
    const { getByRole } = renderBlock('Image', base)
    expect(getByRole('img').style.maxHeight).toBe('')
  })

  it('opens in a new tab only when asked, with noopener', () => {
    const { getByRole } = renderBlock('Image', { ...base, linkUrl: 'https://example.com/', openTarget: '_blank' })
    const link = getByRole('link')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('leaves in-page anchors and tel: links in the same tab by default', () => {
    for (const linkUrl of ['#order', 'tel:+66812345678']) {
      const { getByRole, unmount } = renderBlock('Image', { ...base, linkUrl })
      expect(getByRole('link').hasAttribute('target')).toBe(false)
      unmount()
    }
  })

  it('drops an unsafe link but still shows the image', () => {
    const { queryByRole, getByRole } = renderBlock('Image', { ...base, linkUrl: 'javascript:alert(1)' })
    expect(queryByRole('link')).toBeNull()
    expect(getByRole('img').getAttribute('src')).toBe('https://example.com/a.jpg')
  })

  it('shows the placeholder instead of an unsafe src', () => {
    const { container, getByRole } = renderBlock('Image', { ...base, src: 'data:image/svg+xml,<svg onload=alert(1)>' })
    expect(container.querySelector('img')).toBeNull()
    expect(getByRole('img', { name: 'Pic' }).textContent).toBe('[IMAGE]')
  })

  it('rejects a shadow that would fetch a remote resource', () => {
    const { getByRole } = renderBlock('Image', { ...base, shadow: '0 0 0 1px url(https://evil.example/x)' })
    expect(getByRole('img').style.boxShadow).toBe('none')
  })

  it('renders the caption aligned with the image', () => {
    const { getByText } = renderBlock('Image', { ...base, caption: 'A caption', align: 'right' })
    expect(getByText('A caption').style.textAlign).toBe('right')
  })
})

describe('Button', () => {
  const base = { ...(puckConfig.components.Button.defaultProps as Record<string, unknown>), url: 'https://example.com/' }

  it('renders a link when it has a URL, and an inert button when it has none', () => {
    const linked = renderBlock('Button', base)
    expect(linked.getByRole('link', { name: 'Click me' }).getAttribute('href')).toBe('https://example.com/')
    linked.unmount()

    const { getByRole, queryByRole } = renderBlock('Button', { ...base, url: '' })
    expect(queryByRole('link')).toBeNull()
    expect((getByRole('button') as HTMLButtonElement).disabled).toBe(true)
  })

  it('never renders an unsafe URL as a link', () => {
    const { queryByRole } = renderBlock('Button', { ...base, url: 'javascript:alert(1)' })
    expect(queryByRole('link')).toBeNull()
  })

  it('adds noopener only when opening a new tab', () => {
    const sameTab = renderBlock('Button', base)
    expect(sameTab.getByRole('link').hasAttribute('rel')).toBe(false)
    sameTab.unmount()

    const { getByRole } = renderBlock('Button', { ...base, openTarget: '_blank' })
    expect(getByRole('link').getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('accepts a custom gradient background', () => {
    const { getByRole } = renderBlock('Button', { ...base, background: 'linear-gradient(90deg, #ff0000, #0000ff)' })
    expect(getByRole('link').style.background).toContain('linear-gradient')
  })

  it('falls back to the preset when the background would load a remote image', () => {
    const preset = renderBlock('Button', base)
    const presetBackground = preset.getByRole('link').style.background
    preset.unmount()

    for (const background of ['image-set("https://evil.example/t.gif" 1x)', '\\75rl(https://evil.example/t.gif)']) {
      const { getByRole, unmount } = renderBlock('Button', { ...base, background })
      expect(getByRole('link').style.background).toBe(presetBackground)
      unmount()
    }
  })

  it('falls back to the solid preset for a preset id it does not know', () => {
    const { getByRole } = renderBlock('Button', { ...base, preset: 'removed-preset' })
    expect(getByRole('link').style.background).not.toBe('')
  })
})
