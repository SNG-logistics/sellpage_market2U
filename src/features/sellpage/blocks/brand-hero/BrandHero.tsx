import type { ComponentConfig } from '@puckeditor/core'
import { alignOptions, colorField, imageField, type Align } from '../fields'
import { safeBackground, safeColor, safeCssValue, safeImageUrl } from '../../utils/safeUrl'

export type BrandHeroProps = {
  logo: string
  logoWidth: number
  title: string
  subtitle: string
  description: string
  alignment: Align
  titleColor: string
  subtitleColor: string
  descriptionColor: string
  paddingTop: number
  paddingBottom: number
  background: string
  backgroundImage: string
  overlay: string
}

export const brandHeroConfig: ComponentConfig<BrandHeroProps> = {
  label: 'Brand Hero',
  fields: {
    logo: imageField('Brand Logo'),
    logoWidth: { type: 'number', label: 'Logo Width (px)', min: 40, max: 360 },
    title: { type: 'text', label: 'Main Heading' },
    subtitle: { type: 'text', label: 'Subtitle' },
    description: { type: 'textarea', label: 'Description' },
    alignment: { type: 'radio', label: 'Alignment', options: [...alignOptions] },
    titleColor: colorField('Title Color'),
    subtitleColor: colorField('Subtitle Color'),
    descriptionColor: colorField('Description Color'),
    background: colorField('Background Color / Gradient'),
    backgroundImage: imageField('Background Image URL'),
    overlay: { type: 'text', label: 'Overlay (e.g. rgba(0,0,0,0.5))' },
    paddingTop: { type: 'number', label: 'Padding Top (px)', min: 0, max: 120 },
    paddingBottom: { type: 'number', label: 'Padding Bottom (px)', min: 0, max: 120 },
  },
  defaultProps: {
    logo: '',
    logoWidth: 140,
    title: 'ติดต่อแอดมิน',
    subtitle: 'บริการตลอด 24 ชั่วโมง',
    description: 'สมัครสมาชิก ฝาก-ถอน แจ้งปัญหา\nและสอบถามข้อมูลได้ทันที รวดเร็ว ปลอดภัย',
    alignment: 'center',
    titleColor: '#f6e27a',
    subtitleColor: '#e5c07b',
    descriptionColor: '#d4d4d4',
    paddingTop: 24,
    paddingBottom: 24,
    background: 'transparent',
    backgroundImage: '',
    overlay: '',
  },
  render: ({
    logo,
    logoWidth,
    title,
    subtitle,
    description,
    alignment,
    titleColor,
    subtitleColor,
    descriptionColor,
    paddingTop,
    paddingBottom,
    background,
    backgroundImage,
    overlay,
  }) => {
    const logoSrc = safeImageUrl(logo)
    const bgImg = safeImageUrl(backgroundImage)
    const bg = safeBackground(background) ?? 'transparent'
    const overlayColor = safeCssValue(overlay) ?? safeColor(overlay)
    const align = alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center'
    const textAlign = alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : 'center'

    return (
      <div
        className="sp-brand-hero"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: align,
          textAlign,
          paddingTop: paddingTop ?? 24,
          paddingBottom: paddingBottom ?? 24,
          paddingInline: 16,
          background: bg,
          backgroundImage: bgImg ? `url(${bgImg})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 12,
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {bgImg && overlayColor ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: overlayColor,
              pointerEvents: 'none',
            }}
          />
        ) : null}

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: align, gap: 10, maxWidth: 540 }}>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Brand Logo"
              style={{
                width: logoWidth || 140,
                maxHeight: 180,
                objectFit: 'contain',
                marginBottom: 8,
              }}
            />
          ) : (
            <div
              style={{
                width: logoWidth || 140,
                height: 50,
                border: '1px dashed rgba(212, 175, 55, 0.4)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d4af37',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              [ BRAND LOGO ]
            </div>
          )}

          {subtitle ? (
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: safeColor(subtitleColor) ?? '#e5c07b',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {subtitle}
            </span>
          ) : null}

          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1.25,
              color: safeColor(titleColor) ?? '#f6e27a',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            {title}
          </h1>

          {description ? (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 15,
                lineHeight: 1.6,
                color: safeColor(descriptionColor) ?? '#d4d4d4',
                whiteSpace: 'pre-line',
              }}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
    )
  },
}
