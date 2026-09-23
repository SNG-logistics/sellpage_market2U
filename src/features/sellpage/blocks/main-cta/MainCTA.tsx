import type { ComponentConfig } from '@puckeditor/core'
import { colorField } from '../fields'
import { safeBackground, safeColor, safeCssValue, safeUrl } from '../../utils/safeUrl'
import { buttonIconMap } from '../button/buttonIconRegistry'

export type MainCtaPreset = 'gold' | 'blackGold' | 'gradientGold' | 'vip' | 'glow'
export type MainCtaAnimation = 'none' | 'pulse' | 'shimmer' | 'bounce'

export type MainCtaProps = {
  text: string
  subtitle: string
  url: string
  openTarget: '_self' | '_blank'
  icon: string
  preset: MainCtaPreset
  fullWidth: boolean
  customBackground: string
  customTextColor: string
  radius: number
  customShadow: string
  animation: MainCtaAnimation
}

const presets: Record<
  MainCtaPreset,
  { bg: string; textColor: string; border: string; shadow: string }
> = {
  gold: {
    bg: 'linear-gradient(135deg, #f6e27a 0%, #cb9b2d 55%, #f6e27a 100%)',
    textColor: '#1f1503',
    border: '1px solid #ffe082',
    shadow: '0 8px 24px rgba(203, 155, 45, 0.45)',
  },
  blackGold: {
    bg: 'linear-gradient(135deg, #181510 0%, #0d0c0a 100%)',
    textColor: '#f6e27a',
    border: '1.5px solid #cb9b2d',
    shadow: '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(212, 175, 55, 0.15)',
  },
  gradientGold: {
    bg: 'linear-gradient(90deg, #d4af37 0%, #f6e27a 50%, #aa8010 100%)',
    textColor: '#181204',
    border: '1px solid #fff3b0',
    shadow: '0 10px 30px rgba(212, 175, 55, 0.5)',
  },
  vip: {
    bg: 'linear-gradient(180deg, #2a2010 0%, #0e0d0b 100%)',
    textColor: '#ffd700',
    border: '2px solid #ffd700',
    shadow: '0 0 0 3px rgba(255, 215, 0, 0.2), 0 12px 30px rgba(0, 0, 0, 0.7)',
  },
  glow: {
    bg: 'linear-gradient(135deg, #e5b839 0%, #b8860b 100%)',
    textColor: '#ffffff',
    border: '1px solid #ffd966',
    shadow: '0 0 25px rgba(246, 226, 122, 0.65), 0 8px 20px rgba(0, 0, 0, 0.5)',
  },
}

export const mainCtaConfig: ComponentConfig<MainCtaProps> = {
  label: 'Main CTA Button',
  fields: {
    text: { type: 'text', label: 'Button Text' },
    subtitle: { type: 'text', label: 'Subtitle / Caption (Optional)' },
    url: { type: 'text', label: 'Link URL (https://... or #)' },
    openTarget: {
      type: 'radio',
      label: 'Open Target',
      options: [
        { label: 'Same tab (_self)', value: '_self' },
        { label: 'New tab (_blank)', value: '_blank' },
      ],
    },
    icon: { type: 'text', label: 'Icon (emoji or icon name: arrowRight, cart, check)' },
    preset: {
      type: 'select',
      label: 'Button Preset',
      options: [
        { label: 'Radiant Gold', value: 'gold' },
        { label: 'Black Gold Luxury', value: 'blackGold' },
        { label: 'Metallic Gradient Gold', value: 'gradientGold' },
        { label: 'VIP Double Stroke', value: 'vip' },
        { label: 'Golden Glow', value: 'glow' },
      ],
    },
    fullWidth: {
      type: 'radio',
      label: 'Width',
      options: [
        { label: 'Full Width (100%)', value: true },
        { label: 'Auto Width', value: false },
      ],
    },
    customBackground: colorField('Custom Background / Gradient'),
    customTextColor: colorField('Custom Text Color'),
    radius: { type: 'number', label: 'Border Radius (px)', min: 0, max: 999 },
    customShadow: { type: 'text', label: 'Custom Box Shadow' },
    animation: {
      type: 'select',
      label: 'Animation',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Pulse Glow', value: 'pulse' },
        { label: 'Shimmer Light', value: 'shimmer' },
        { label: 'Bounce subtle', value: 'bounce' },
      ],
    },
  },
  defaultProps: {
    text: 'เข้าสู่เว็บไซต์หลัก',
    subtitle: 'คลิกเพื่อเข้าสู่ระบบและเริ่มใช้งานได้ทันที',
    url: 'https://example.com',
    openTarget: '_blank',
    icon: 'arrowRight',
    preset: 'gold',
    fullWidth: true,
    customBackground: '',
    customTextColor: '',
    radius: 14,
    customShadow: '',
    animation: 'pulse',
  },
  render: ({
    text = 'เข้าสู่เว็บไซต์',
    subtitle = '',
    url = '#',
    openTarget = '_blank',
    icon = 'arrowRight',
    preset = 'gold',
    fullWidth = true,
    customBackground = '',
    customTextColor = '',
    radius = 14,
    customShadow = '',
    animation = 'none',
  }) => {
    const p = presets[preset] ?? presets.gold
    const href = safeUrl(url) ?? '#'
    const bg = safeBackground(customBackground) || p.bg
    const color = safeColor(customTextColor) || p.textColor
    const shadow = safeCssValue(customShadow) || p.shadow

    const IconComponent = (buttonIconMap as Record<string, React.ComponentType<any>>)[icon]

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          margin: '12px 0',
          boxSizing: 'border-box',
        }}
      >
        <a
          href={href}
          target={openTarget}
          rel={openTarget === '_blank' ? 'noopener noreferrer' : undefined}
          className={`sp-main-cta sp-main-cta--${animation || 'none'}`}
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: fullWidth ? '100%' : 'auto',
            minHeight: 56,
            padding: subtitle ? '14px 24px' : '16px 28px',
            background: bg,
            color,
            border: p.border,
            borderRadius: radius ?? 14,
            boxShadow: shadow,
            textDecoration: 'none',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.02em',
              lineHeight: 1.2,
            }}
          >
            <span>{text}</span>
            {IconComponent ? (
              <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <IconComponent size={20} color="currentColor" />
              </span>
            ) : icon ? (
              <span aria-hidden="true">{icon}</span>
            ) : null}
          </div>
          {subtitle ? (
            <span
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: 500,
                opacity: 0.88,
                letterSpacing: '0.01em',
              }}
            >
              {subtitle}
            </span>
          ) : null}
        </a>
      </div>
    )
  },
}
