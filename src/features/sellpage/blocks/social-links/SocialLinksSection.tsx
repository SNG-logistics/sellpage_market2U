import type { ComponentConfig } from '@puckeditor/core'
import { colorField } from '../fields'
import { safeBackground, safeColor, safeUrl } from '../../utils/safeUrl'
import { buttonIconMap } from '../button/buttonIconRegistry'

export type SocialPlatform = 'whatsapp' | 'facebook' | 'telegram' | 'line' | 'tiktok' | 'instagram' | 'youtube' | 'website'

export type SocialLinkItem = {
  platform: SocialPlatform
  title: string
  subtitle: string
  url: string
  enabled?: boolean
  customBackground: string
  customIconBackground: string
  customTextColor: string
}

export type SocialLinksSectionProps = {
  links: SocialLinkItem[]
  gap: number
  radius: number
  showArrow: boolean
  hoverEffect: 'lift' | 'glow' | 'none'
}

export const platformPresets: Record<SocialPlatform, {
  name: string
  icon: keyof typeof buttonIconMap
  iconBg: string
  iconColor: string
  cardBg: string
  border: string
  defaultTitle: string
  defaultSubtitle: string
}> = {
  whatsapp: {
    name: 'WhatsApp',
    icon: 'whatsapp',
    iconBg: '#25D366',
    iconColor: '#ffffff',
    cardBg: 'linear-gradient(90deg, rgba(37, 211, 102, 0.18) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(37, 211, 102, 0.35)',
    defaultTitle: 'WhatsApp',
    defaultSubtitle: 'แชตกับแอดมินทันที ตลอด 24 ชม.',
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    iconBg: '#1877F2',
    iconColor: '#ffffff',
    cardBg: 'linear-gradient(90deg, rgba(24, 119, 242, 0.18) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(24, 119, 242, 0.35)',
    defaultTitle: 'Facebook',
    defaultSubtitle: 'ทักข้อความเพจหลัก มีแอดมินดูแล',
  },
  telegram: {
    name: 'Telegram',
    icon: 'telegram',
    iconBg: '#229ED9',
    iconColor: '#ffffff',
    cardBg: 'linear-gradient(90deg, rgba(34, 158, 217, 0.18) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(34, 158, 217, 0.35)',
    defaultTitle: 'Telegram',
    defaultSubtitle: 'เข้าร่วมกลุ่มข่าวสารและโปรโมชั่น',
  },
  line: {
    name: 'LINE',
    icon: 'line',
    iconBg: '#06C755',
    iconColor: '#ffffff',
    cardBg: 'linear-gradient(90deg, rgba(6, 199, 85, 0.18) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(6, 199, 85, 0.35)',
    defaultTitle: 'LINE Official',
    defaultSubtitle: 'ติดต่อฝ่ายบริการลูกค้าทันที',
  },
  tiktok: {
    name: 'TikTok',
    icon: 'tiktok',
    iconBg: '#000000',
    iconColor: '#ffffff',
    cardBg: 'linear-gradient(90deg, rgba(254, 44, 85, 0.15) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    defaultTitle: 'TikTok',
    defaultSubtitle: 'ติดตามคลิปไฮไลท์และกิจกรรม',
  },
  instagram: {
    name: 'Instagram',
    icon: 'instagram',
    iconBg: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)',
    iconColor: '#ffffff',
    cardBg: 'linear-gradient(90deg, rgba(220, 39, 67, 0.15) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(220, 39, 67, 0.35)',
    defaultTitle: 'Instagram',
    defaultSubtitle: 'ติดตามภาพอัปเดตและไลฟ์สไตล์',
  },
  youtube: {
    name: 'YouTube',
    icon: 'youtube',
    iconBg: '#FF0000',
    iconColor: '#ffffff',
    cardBg: 'linear-gradient(90deg, rgba(255, 0, 0, 0.15) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(255, 0, 0, 0.35)',
    defaultTitle: 'YouTube',
    defaultSubtitle: 'ชมรีวิวและวิดีโอแนะนำ',
  },
  website: {
    name: 'Website',
    icon: 'website',
    iconBg: '#d4af37',
    iconColor: '#121212',
    cardBg: 'linear-gradient(90deg, rgba(212, 175, 55, 0.18) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    defaultTitle: 'เข้าสู่เว็บไซต์หลัก',
    defaultSubtitle: 'คลิกเพื่อเข้าใช้งานระบบทันที',
  },
}

export const socialLinksSectionConfig: ComponentConfig<SocialLinksSectionProps> = {
  label: 'Social Links Section',
  fields: {
    links: {
      type: 'array',
      label: 'Social Contact Buttons',
      getItemSummary: (item) => `${item.platform?.toUpperCase() || 'BUTTON'} — ${item.title || 'Link'}`,
      arrayFields: {
        platform: {
          type: 'select',
          label: 'Platform',
          options: [
            { label: 'WhatsApp', value: 'whatsapp' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Telegram', value: 'telegram' },
            { label: 'LINE', value: 'line' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Website', value: 'website' },
          ],
        },
        title: { type: 'text', label: 'Title / Action' },
        subtitle: { type: 'text', label: 'Subtitle / Helper Text' },
        url: { type: 'text', label: 'URL Destination' },
        enabled: {
          type: 'radio',
          label: 'Item Visibility',
          options: [
            { label: 'Enabled', value: true },
            { label: 'Hidden', value: false },
          ],
        },
        customBackground: colorField('Background Override'),
        customIconBackground: colorField('Icon Background Override'),
        customTextColor: colorField('Text Color Override'),
      },
      defaultItemProps: {
        platform: 'line',
        title: 'LINE Official',
        subtitle: 'ติดต่อฝ่ายบริการลูกค้า 24 ชม.',
        url: '',
        enabled: true,
        customBackground: '',
        customIconBackground: '',
        customTextColor: '',
      },
    },
    gap: { type: 'number', label: 'Button Spacing (px)', min: 6, max: 32 },
    radius: { type: 'number', label: 'Corner Radius (px)', min: 0, max: 32 },
    showArrow: {
      type: 'radio',
      label: 'Show Right Arrow ( › )',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    hoverEffect: {
      type: 'select',
      label: 'Hover Animation',
      options: [
        { label: 'Lift (Translate Y)', value: 'lift' },
        { label: 'Glow (Shadow)', value: 'glow' },
        { label: 'None', value: 'none' },
      ],
    },
  },
  defaultProps: {
    links: [
      {
        platform: 'whatsapp',
        title: 'WhatsApp',
        subtitle: 'แชตกับแอดมินทันที สะดวก รวดเร็ว',
        url: 'https://whatsapp.com',
        enabled: true,
        customBackground: '',
        customIconBackground: '',
        customTextColor: '',
      },
      {
        platform: 'facebook',
        title: 'Facebook',
        subtitle: 'ทักข้อความแฟนเพจหลัก',
        url: 'https://facebook.com',
        enabled: true,
        customBackground: '',
        customIconBackground: '',
        customTextColor: '',
      },
      {
        platform: 'telegram',
        title: 'Telegram',
        subtitle: 'เข้าร่วมกลุ่มข่าวสารกิจกรรมพิเศษ',
        url: 'https://telegram.org',
        enabled: true,
        customBackground: '',
        customIconBackground: '',
        customTextColor: '',
      },
      {
        platform: 'line',
        title: 'LINE Official',
        subtitle: 'ติดต่อฝ่ายบริการลูกค้า 24 ชั่วโมง',
        url: 'https://line.me',
        enabled: true,
        customBackground: '',
        customIconBackground: '',
        customTextColor: '',
      },
    ],
    gap: 12,
    radius: 14,
    showArrow: true,
    hoverEffect: 'lift',
  },
  render: ({ links, gap = 12, radius = 14, showArrow = true, hoverEffect = 'lift' }) => {
    return (
      <div
        className="sp-social-links-section"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {links.map((link, idx) => {
          if (link.enabled === false) return null

          const preset = platformPresets[link.platform] ?? platformPresets.line
          const IconComponent = buttonIconMap[preset.icon] ?? buttonIconMap.arrowRight
          const title = link.title || preset.defaultTitle
          const subtitle = link.subtitle || preset.defaultSubtitle
          const href = safeUrl(link.url)

          const bg = safeBackground(link.customBackground) ?? preset.cardBg
          const iconBg = safeBackground(link.customIconBackground) ?? preset.iconBg
          const textCol = safeColor(link.customTextColor) ?? '#ffffff'
          const borderStyle = preset.border

          const hoverClass = hoverEffect === 'lift' ? 'sp-btn-lift' : hoverEffect === 'glow' ? 'sp-btn-glow' : ''

          const inner = (
            <div
              className={`sp-social-button-row ${hoverClass}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: bg,
                border: borderStyle,
                borderRadius: radius,
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                boxSizing: 'border-box',
                width: '100%',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: preset.iconColor,
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                  }}
                >
                  <IconComponent width={24} height={24} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: textCol, lineHeight: 1.25 }}>
                    {title}
                  </span>
                  {subtitle ? (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>
                      {subtitle}
                    </span>
                  ) : null}
                </div>
              </div>

              {showArrow && (
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)',
                    marginLeft: 8,
                  }}
                  aria-hidden="true"
                >
                  ›
                </span>
              )}
            </div>
          )

          if (href) {
            return (
              <a
                key={idx}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
              >
                {inner}
              </a>
            )
          }

          return <div key={idx}>{inner}</div>
        })}
      </div>
    )
  },
}
