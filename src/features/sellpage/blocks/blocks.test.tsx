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

  it('Heading and Text saved before mobileFontSize keep one size at every width', () => {
    const heading = renderBlock('Heading', {
      text: 'Old heading',
      level: 'h2',
      align: 'left',
      color: '',
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.2,
    })
    expect(heading.container.querySelector('.sp-responsive-text')).toBeNull()
    heading.unmount()

    const text = renderBlock('Text', {
      content: 'Old text',
      align: 'left',
      color: '',
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.6,
      opacity: 1,
    })
    expect(text.container.querySelector('.sp-responsive-text')).toBeNull()
  })

  it('a mobile font size, when set, is exposed to the mobile rule', () => {
    const { container } = renderBlock('Heading', {
      ...(puckConfig.components.Heading.defaultProps as Record<string, unknown>),
      mobileFontSize: 24,
    })
    const elem = container.querySelector('.sp-responsive-text') as HTMLElement
    expect(elem.style.getPropertyValue('--sp-mobile-font-size')).toBe('24px')
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

describe('Hero', () => {
  const base = { ...(puckConfig.components.Hero.defaultProps as Record<string, unknown>) }

  it('renders title, eyebrow, subtitle, and description', () => {
    const { getByText, getByRole } = renderBlock('Hero', {
      ...base,
      eyebrow: 'Limited Offer',
      title: 'Super Hero Title',
      subtitle: 'Sub headline text',
      description: 'Long description paragraph',
    })
    expect(getByText('Limited Offer')).toBeTruthy()
    expect(getByRole('heading', { level: 1, name: 'Super Hero Title' })).toBeTruthy()
    expect(getByText('Sub headline text')).toBeTruthy()
    expect(getByText('Long description paragraph')).toBeTruthy()
  })

  it('renders primary and secondary CTA buttons', () => {
    const { getByRole } = renderBlock('Hero', {
      ...base,
      primaryCtaLabel: 'Buy Now',
      primaryCtaUrl: 'https://example.com/buy',
      secondaryCtaLabel: 'Details',
      secondaryCtaUrl: 'https://example.com/info',
    })
    expect(getByRole('link', { name: 'Buy Now' }).getAttribute('href')).toBe('https://example.com/buy')
    expect(getByRole('link', { name: 'Details' }).getAttribute('href')).toBe('https://example.com/info')
  })

  it('sanitizes unsafe background images and logos', () => {
    const { container } = renderBlock('Hero', {
      ...base,
      bgType: 'image',
      backgroundImage: 'javascript:alert(1)',
      logo: 'javascript:alert(2)',
    })
    expect(container.querySelector('img')).toBeNull()
    expect(container.innerHTML).not.toContain('javascript:')
  })
})

describe('Stats', () => {
  const base = { ...(puckConfig.components.Stats.defaultProps as Record<string, unknown>) }

  it('renders stat items with value and label', () => {
    const { getByText } = renderBlock('Stats', {
      ...base,
      items: [
        { value: '5,000+', label: 'Users' },
        { value: '99%', label: 'Uptime' },
      ],
    })
    expect(getByText('5,000+')).toBeTruthy()
    expect(getByText('Users')).toBeTruthy()
    expect(getByText('99%')).toBeTruthy()
    expect(getByText('Uptime')).toBeTruthy()
  })

  it('overrides the column count on mobile when asked', () => {
    const { container } = renderBlock('Stats', { ...base, columns: 3, mobileColumns: 2 })
    const elem = container.querySelector('.sp-stats') as HTMLElement
    expect(elem.style.getPropertyValue('--sp-stats-mobile-cols')).toBe('2')
    expect(elem.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
  })

  it('a grid saved before mobileColumns existed keeps its columns at every width', () => {
    const { container } = renderBlock('Stats', {
      items: [{ value: '1', label: 'One' }],
      align: 'center',
      valueColor: '',
      labelColor: '',
      valueFontSize: 36,
      columns: 3,
    })
    // No class means the mobile rule cannot match it at all.
    expect(container.querySelector('.sp-stats')).toBeNull()
  })
})

describe('Alert', () => {
  const base = { ...(puckConfig.components.Alert.defaultProps as Record<string, unknown>) }

  it('renders alert preset variants with title and message', () => {
    const { getByText, getByRole } = renderBlock('Alert', {
      ...base,
      variant: 'vip',
      title: 'VIP Notice',
      description: 'Exclusive access granted.',
    })
    expect(getByRole('status')).toBeTruthy()
    expect(getByText('VIP Notice')).toBeTruthy()
    expect(getByText('Exclusive access granted.')).toBeTruthy()
  })

  it('sanitizes unsafe background colors', () => {
    const { getByRole } = renderBlock('Alert', {
      ...base,
      background: 'image-set("https://evil.example/t.gif" 1x)',
    })
    expect(getByRole('status').style.background).not.toContain('evil.example')
  })
})

describe('SocialButton', () => {
  const base = { ...(puckConfig.components.SocialButton.defaultProps as Record<string, unknown>), url: 'https://line.me/ti/p/@market2u' }

  it('renders LINE network button by default with brand color', () => {
    const { getByRole } = renderBlock('SocialButton', { ...base, network: 'line' })
    const link = getByRole('link')
    expect(link.getAttribute('href')).toBe('https://line.me/ti/p/@market2u')
    expect(link.style.background).toBe('rgb(6, 199, 85)')
  })

  it('supports all 10 social networks', () => {
    const networks = ['line', 'whatsapp', 'telegram', 'facebook', 'tiktok', 'instagram', 'youtube', 'website', 'phone', 'email'] as const
    networks.forEach((network) => {
      const { container, unmount } = renderBlock('SocialButton', { ...base, network })
      expect(container.innerHTML).not.toBe('')
      unmount()
    })
  })

  it('allows admin custom color overrides', () => {
    const { getByRole } = renderBlock('SocialButton', {
      ...base,
      customBackground: '#123456',
      customTextColor: '#ffffff',
    })
    const link = getByRole('link')
    expect(link.style.background).toBe('rgb(18, 52, 86)')
  })
})

describe('Container', () => {
  const base = { ...(puckConfig.components.Container.defaultProps as Record<string, unknown>) }

  it('renders direction, gap and padding', () => {
    const { container } = renderBlock('Container', { ...base, direction: 'row', gap: 20, padding: 30 })
    const elem = container.querySelector('.sp-container') as HTMLElement
    expect(elem.style.flexDirection).toBe('row')
    expect(elem.style.gap).toBe('20px')
    expect(elem.style.padding).toBe('30px')
  })

  it('stacks on mobile when asked, and only then', () => {
    const on = renderBlock('Container', { ...base, stackOnMobile: true })
    expect(on.container.querySelector('.sp-container--stack-mobile')).toBeTruthy()
    on.unmount()

    const off = renderBlock('Container', { ...base, stackOnMobile: false })
    expect(off.container.querySelector('.sp-container--stack-mobile')).toBeNull()
  })

  it('a row container saved before stackOnMobile existed still does not stack', () => {
    // No stackOnMobile in the props at all — defaultProps do not apply to a
    // saved page, so the fallback decides, and it must be "as before".
    const { container } = renderBlock('Container', {
      content: [],
      direction: 'row',
      gap: 16,
      padding: 24,
      background: '',
      radius: 0,
      maxWidth: 0,
    })
    expect(container.querySelector('.sp-container--stack-mobile')).toBeNull()
  })
})

describe('theme', () => {
  const data = { root: { props: {} }, content: [] } as unknown as SellpageData
  const themeRoot = (container: HTMLElement) => container.firstElementChild as HTMLElement

  it('passes the theme through as CSS variables', () => {
    const theme = { ...defaultTheme(), background: 'linear-gradient(180deg, #ffffff, #faf9f5)' }
    theme.colors = { ...theme.colors, primary: '#ff0000' }
    const root = themeRoot(render(<SellpageRenderer data={data} theme={theme} />).container)
    expect(root.style.getPropertyValue('--sp-primary')).toBe('#ff0000')
    expect(root.style.background).toContain('linear-gradient')
  })

  it('never lets a theme value carry a remote image into a background', () => {
    // Blocks write `background: var(--sp-surface)`, so the variable is the way in.
    const hostile = 'image-set("https://evil.example/t.gif" 1x)'
    const theme = { ...defaultTheme(), background: hostile }
    theme.colors = { ...theme.colors, surface: hostile, text: hostile }
    const root = themeRoot(render(<SellpageRenderer data={data} theme={theme} />).container)

    expect(root.getAttribute('style')).not.toContain('evil.example')
    expect(root.style.getPropertyValue('--sp-surface')).toBe(defaultTheme().colors.surface)
  })
})

describe('Luxury Sellpage Blocks', () => {
  it('TrustBar renders items and respects enabled flag', () => {
    const { getByText, queryByText, rerender } = renderBlock('TrustBar', {
      enabled: true,
      items: [
        { icon: '✓', text: 'มั่นใจ' },
        { icon: '★', text: 'เว็บมั่นคง' },
      ],
      textColor: '#f5e2a3',
      background: 'rgba(212, 175, 55, 0.12)',
      dividerColor: 'rgba(212, 175, 55, 0.3)',
      fontSize: 13,
      fontWeight: 600,
    })

    expect(getByText('มั่นใจ')).toBeTruthy()
    expect(getByText('เว็บมั่นคง')).toBeTruthy()

    // Test disabled
    rerender(
      <SellpageRenderer
        data={
          {
            root: { props: {} },
            content: [
              {
                type: 'TrustBar',
                props: {
                  id: 'TrustBar-disabled',
                  enabled: false,
                  items: [{ icon: '✓', text: 'มั่นใจ' }],
                  textColor: '',
                  background: '',
                  dividerColor: '',
                  fontSize: 13,
                  fontWeight: 600,
                },
              },
            ],
          } as unknown as SellpageData
        }
        theme={defaultTheme()}
      />
    )
    expect(queryByText('มั่นใจ')).toBeNull()
  })

  it('OnlineCounter renders prefix, the entered count, and suffix', () => {
    const { getByText } = renderBlock('OnlineCounter', {
      enabled: true,
      prefix: 'ลูกค้าไว้วางใจแล้ว',
      number: 3500,
      suffix: 'ราย',
      iconType: 'users',
      background: '',
      border: '',
      textColor: '',
      numberColor: '',
      radius: 20,
      align: 'center',
    })

    expect(getByText('ลูกค้าไว้วางใจแล้ว')).toBeTruthy()
    expect(getByText('3,500')).toBeTruthy()
    expect(getByText('ราย')).toBeTruthy()
  })

  it('OnlineCounter ships a default that claims nothing on the seller behalf', () => {
    // It used to default to a random 1,800–3,200 under "ออนไลน์ตอนนี้", i.e. a
    // live audience figure nobody measured. A block dropped on a page must
    // start from a number the seller then fills in themselves.
    const defaults = puckConfig.components.OnlineCounter.defaultProps as Record<string, unknown>
    expect(defaults.number).toBe(0)
    expect(String(defaults.prefix)).not.toContain('ออนไลน์')
    expect(defaults).not.toHaveProperty('mode')
  })

  it('BrandHero renders title, subtitle, and description', () => {
    const { getByText } = renderBlock('BrandHero', {
      logo: '',
      logoWidth: 140,
      title: 'ติดต่อแอดมิน VIP',
      subtitle: 'บริการตลอด 24 ชั่วโมง',
      description: 'สมัครสมาชิก ฝาก-ถอน สะดวก รวดเร็ว',
      alignment: 'center',
      titleColor: '',
      subtitleColor: '',
      descriptionColor: '',
      paddingTop: 20,
      paddingBottom: 20,
      background: '',
      backgroundImage: '',
      overlay: '',
    })

    expect(getByText('ติดต่อแอดมิน VIP')).toBeTruthy()
    expect(getByText('บริการตลอด 24 ชั่วโมง')).toBeTruthy()
    expect(getByText(/สมัครสมาชิก ฝาก-ถอน สะดวก รวดเร็ว/)).toBeTruthy()
  })

  it('PromoCard renders title, subtitle, description, and link', () => {
    const { getByText, getByRole } = renderBlock('PromoCard', {
      title: '3KING VIP',
      subtitle: 'บริการพิเศษเฉพาะคุณ',
      description: 'ปลอดภัย มั่นคง ฝากถอนได้ทันที',
      image: '',
      imagePosition: 'right',
      url: 'https://example.com/vip',
      openTarget: '_blank',
      preset: 'blackGold',
      customBackground: '',
      textColor: '',
      borderColor: '',
      radius: 14,
      showArrow: true,
      shadow: '',
    })

    expect(getByText('3KING VIP')).toBeTruthy()
    expect(getByText('บริการพิเศษเฉพาะคุณ')).toBeTruthy()
    expect(getByText('ปลอดภัย มั่นคง ฝากถอนได้ทันที')).toBeTruthy()
    const link = getByRole('link')
    expect(link.getAttribute('href')).toBe('https://example.com/vip')
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('SocialLinksSection renders all configured social platform buttons', () => {
    const { getByText } = renderBlock('SocialLinksSection', {
      links: [
        { platform: 'whatsapp', title: 'WhatsApp VIP', subtitle: 'แชตทันที', url: 'https://whatsapp.com' },
        { platform: 'line', title: 'LINE Official', subtitle: 'แอดไลน์สอบถาม', url: 'https://line.me' },
      ],
      gap: 12,
      radius: 14,
      showArrow: true,
      hoverEffect: 'lift',
    })

    expect(getByText('WhatsApp VIP')).toBeTruthy()
    expect(getByText('แชตทันที')).toBeTruthy()
    expect(getByText('LINE Official')).toBeTruthy()
    expect(getByText('แอดไลน์สอบถาม')).toBeTruthy()
  })

  it('StatsSection renders statistics items with values and labels', () => {
    const { getByText } = renderBlock('StatsSection', {
      items: [
        { value: '50,000+', label: 'ผู้ใช้งาน', icon: '👥' },
        { value: '24/7', label: 'ทีมงานดูแล', icon: '⚡' },
        { value: '100%', label: 'ความปลอดภัย', icon: '🛡️' },
      ],
      columns: 3,
      background: '',
      border: '',
      showDivider: true,
      dividerColor: '',
      radius: 16,
      padding: 16,
      valueColor: '',
      labelColor: '',
    })

    expect(getByText('50,000+')).toBeTruthy()
    expect(getByText('ผู้ใช้งาน')).toBeTruthy()
    expect(getByText('24/7')).toBeTruthy()
    expect(getByText('100%')).toBeTruthy()
  })

  it('SecurityNotice renders heading, description, and warning highlight', () => {
    const { getByText } = renderBlock('SecurityNotice', {
      preset: 'securityGold',
      icon: '🛡️',
      heading: 'ระบบความปลอดภัยและแจ้งเตือน',
      description: 'ทางเราไม่มีนโยบายทักหาลูกค้าก่อน',
      warningText: 'โปรดระวังบัญชีปลอม',
      customBackground: '',
      customBorder: '',
      titleColor: '',
      textColor: '',
      radius: 12,
    })

    expect(getByText('ระบบความปลอดภัยและแจ้งเตือน')).toBeTruthy()
    expect(getByText('ทางเราไม่มีนโยบายทักหาลูกค้าก่อน')).toBeTruthy()
    expect(getByText('โปรดระวังบัญชีปลอม')).toBeTruthy()
  })

  it('MainCTA renders button text, subtitle, and valid link', () => {
    const { getByRole, getByText } = renderBlock('MainCTA', {
      text: 'เข้าสู่เว็บไซต์ทันที',
      subtitle: 'คลิกเพื่อลงทะเบียน',
      url: 'https://market2u.example.com',
      openTarget: '_blank',
      icon: 'arrowRight',
      preset: 'gold',
      fullWidth: true,
      customBackground: '',
      customTextColor: '',
      radius: 14,
      customShadow: '',
      animation: 'pulse',
    })

    expect(getByText('เข้าสู่เว็บไซต์ทันที')).toBeTruthy()
    expect(getByText('คลิกเพื่อลงทะเบียน')).toBeTruthy()
    const link = getByRole('link')
    expect(link.getAttribute('href')).toBe('https://market2u.example.com/')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.className).toContain('sp-main-cta--pulse')
  })

  it('createLuxuryContactTemplate renders full luxury page without errors', async () => {
    const { createLuxuryContactTemplate } = await import('../templates/luxuryContactTemplate')
    const template = createLuxuryContactTemplate()

    expect(template.name).toBe('Market2U Luxury Contact')
    expect(template.data.content.length).toBe(8)

    const { getByText } = render(<SellpageRenderer data={template.data} theme={template.theme} />)
    expect(getByText('มั่นใจ')).toBeTruthy()
    expect(getByText('ติดต่อแอดมิน')).toBeTruthy()
    expect(getByText('YOUR BRAND VIP')).toBeTruthy()
    expect(getByText('WhatsApp')).toBeTruthy()
    expect(getByText('10,000+')).toBeTruthy()
    expect(getByText('ระบบความปลอดภัยและแจ้งเตือนมิจฉาชีพ')).toBeTruthy()
    expect(getByText('เข้าสู่เว็บไซต์หลัก')).toBeTruthy()
  })
})


