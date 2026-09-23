import type { ComponentConfig } from '@puckeditor/core'
import { colorField, imageField } from '../fields'
import { safeBackground, safeColor, safeCssValue, safeImageUrl, safeUrl } from '../../utils/safeUrl'

export type PromoCardPreset = 'blackGold' | 'luxury' | 'darkGlass' | 'gradientGold'

export type PromoCardProps = {
  title: string
  subtitle: string
  description: string
  image: string
  imagePosition: 'right' | 'left'
  url: string
  openTarget: '_self' | '_blank'
  preset: PromoCardPreset
  customBackground: string
  textColor: string
  borderColor: string
  radius: number
  showArrow: boolean
  shadow: string
}

const presets: Record<PromoCardPreset, { bg: string; border: string; titleColor: string; descColor: string; shadow: string }> = {
  blackGold: {
    bg: 'linear-gradient(135deg, #1e1910 0%, #0d0d0d 100%)',
    border: '1px solid rgba(212, 175, 55, 0.5)',
    titleColor: '#f6e27a',
    descColor: '#d4d4d4',
    shadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(212, 175, 55, 0.08)',
  },
  luxury: {
    bg: 'linear-gradient(135deg, #2a2012 0%, #151008 100%)',
    border: '1px solid #b8860b',
    titleColor: '#ffd700',
    descColor: '#f5deb3',
    shadow: '0 8px 20px rgba(0,0,0,0.6)',
  },
  darkGlass: {
    bg: 'rgba(26, 26, 26, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    titleColor: '#ffffff',
    descColor: '#a3a3a3',
    shadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
  },
  gradientGold: {
    bg: 'linear-gradient(135deg, #f6e27a 0%, #d4af37 50%, #aa8010 100%)',
    border: '1px solid #fff5cc',
    titleColor: '#1c1505',
    descColor: '#2b2006',
    shadow: '0 8px 24px rgba(212, 175, 55, 0.4)',
  },
}

export const promoCardConfig: ComponentConfig<PromoCardProps> = {
  label: 'Promo / VIP Card',
  fields: {
    title: { type: 'text', label: 'Badge / Title' },
    subtitle: { type: 'text', label: 'Subtitle / Highlight' },
    description: { type: 'textarea', label: 'Description' },
    image: imageField('Icon / Logo URL'),
    imagePosition: {
      type: 'radio',
      label: 'Image Position',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
    },
    url: { type: 'text', label: 'Action URL (optional)' },
    openTarget: {
      type: 'radio',
      label: 'Open in',
      options: [
        { label: 'Same tab', value: '_self' },
        { label: 'New tab', value: '_blank' },
      ],
    },
    preset: {
      type: 'select',
      label: 'Theme Preset',
      options: [
        { label: 'Black Gold (VIP)', value: 'blackGold' },
        { label: 'Luxury Dark', value: 'luxury' },
        { label: 'Dark Glass', value: 'darkGlass' },
        { label: 'Gradient Gold', value: 'gradientGold' },
      ],
    },
    showArrow: {
      type: 'radio',
      label: 'Show Arrow Decoration',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    customBackground: colorField('Background Override'),
    textColor: colorField('Text Color Override'),
    borderColor: colorField('Border Color Override'),
    radius: { type: 'number', label: 'Corner Radius (px)', min: 0, max: 32 },
    shadow: { type: 'text', label: 'Shadow (CSS)' },
  },
  defaultProps: {
    title: 'VIP MEMBER',
    subtitle: 'บริการระดับพรีเมียม',
    description: 'ปลอดภัย มั่นคง ฝากถอนได้ทันที พร้อมทีมงานดูแล 24 ชม.',
    image: '',
    imagePosition: 'right',
    url: '',
    openTarget: '_self',
    preset: 'blackGold',
    showArrow: true,
    customBackground: '',
    textColor: '',
    borderColor: '',
    radius: 16,
    shadow: '',
  },
  render: ({
    title,
    subtitle,
    description,
    image,
    imagePosition,
    url,
    openTarget,
    preset,
    showArrow,
    customBackground,
    textColor,
    borderColor,
    radius,
    shadow,
  }) => {
    const config = presets[preset] ?? presets.blackGold
    const bg = safeBackground(customBackground) ?? config.bg
    const border = safeCssValue(borderColor) ?? safeColor(borderColor) ? `1px solid ${safeColor(borderColor)}` : config.border
    const titleCol = safeColor(textColor) ?? config.titleColor
    const descCol = safeColor(textColor) ?? config.descColor
    const boxShad = safeCssValue(shadow) ?? config.shadow
    const href = safeUrl(url)
    const imgUrl = safeImageUrl(image)

    const cardContent = (
      <div
        className="sp-promo-card"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: imagePosition === 'left' ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '20px 22px',
          background: bg,
          border,
          borderRadius: radius ?? 16,
          boxShadow: boxShad,
          boxSizing: 'border-box',
          width: '100%',
          overflow: 'hidden',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {title ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(212, 175, 55, 0.2)',
                  color: titleCol,
                }}
              >
                {title}
              </span>
            </div>
          ) : null}

          {subtitle ? (
            <div style={{ fontSize: 18, fontWeight: 700, color: titleCol, lineHeight: 1.3 }}>
              {subtitle}
            </div>
          ) : null}

          {description ? (
            <div style={{ fontSize: 13, color: descCol, lineHeight: 1.5, opacity: 0.9 }}>
              {description}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={title || 'Promo'}
              style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8 }}
            />
          ) : (
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 12,
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: titleCol,
              }}
            >
              👑
            </div>
          )}

          {showArrow && (
            <span
              style={{
                fontSize: 20,
                color: titleCol,
                fontWeight: 'bold',
                opacity: 0.8,
                marginLeft: 4,
              }}
              aria-hidden="true"
            >
              ›
            </span>
          )}
        </div>
      </div>
    )

    if (href) {
      return (
        <a
          href={href}
          target={openTarget === '_blank' ? '_blank' : undefined}
          rel={openTarget === '_blank' ? 'noopener noreferrer' : undefined}
          style={{ display: 'block', width: '100%', textDecoration: 'none' }}
        >
          {cardContent}
        </a>
      )
    }

    return cardContent
  },
}
