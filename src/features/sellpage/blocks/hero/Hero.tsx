import type { ComponentConfig } from '@puckeditor/core'
import { alignOptions, colorField } from '../fields'
import { safeColor, safeCssValue, safeImageUrl } from '../../utils/safeUrl'
import { renderButton, type ButtonProps } from '../button/Button'
import type { Align } from '../fields'

export type HeroProps = {
  logo: string
  eyebrow: string
  title: string
  subtitle: string
  description: string
  bgType: 'solid' | 'gradient' | 'image'
  background: string
  backgroundImage: string
  overlay: string
  alignment: Align
  minHeight: number
  textColor: string
  primaryCtaLabel: string
  primaryCtaUrl: string
  secondaryCtaLabel: string
  secondaryCtaUrl: string
}

const heroButtonDefaults: Omit<ButtonProps, 'label' | 'url'> = {
  subtitle: '',
  icon: 'none',
  iconPosition: 'left',
  openTarget: '_self',
  width: 'auto',
  align: 'left',
  preset: 'solid',
  background: '',
  textColor: '',
  border: '',
  radius: 10,
  shadow: '',
  padding: 14,
  fontSize: 16,
  fontWeight: 600,
  animation: 'none',
}

export const heroConfig: ComponentConfig<HeroProps> = {
  label: 'Hero',
  fields: {
    logo: { type: 'text', label: 'Logo image URL' },
    eyebrow: { type: 'text', label: 'Eyebrow' },
    title: { type: 'text', label: 'Title' },
    subtitle: { type: 'text', label: 'Subtitle' },
    description: { type: 'textarea', label: 'Description' },
    bgType: {
      type: 'radio',
      label: 'Background type',
      options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Gradient', value: 'gradient' },
        { label: 'Image', value: 'image' },
      ],
    },
    background: colorField('Background color/gradient'),
    backgroundImage: { type: 'text', label: 'Background image URL' },
    overlay: { type: 'text', label: 'Overlay color (e.g. rgba(0,0,0,0.4))' },
    alignment: { type: 'radio', label: 'Alignment', options: [...alignOptions] },
    minHeight: { type: 'number', label: 'Min height (px)', min: 200, max: 1000 },
    textColor: colorField('Text color'),
    primaryCtaLabel: { type: 'text', label: 'Primary CTA label' },
    primaryCtaUrl: { type: 'text', label: 'Primary CTA URL' },
    secondaryCtaLabel: { type: 'text', label: 'Secondary CTA label' },
    secondaryCtaUrl: { type: 'text', label: 'Secondary CTA URL' },
  },
  defaultProps: {
    logo: '',
    eyebrow: 'EXCLUSIVE OFFER',
    title: 'Transform Your Experience Today',
    subtitle: 'Discover premium features designed to elevate your business.',
    description: 'Get started with instant access, 24/7 dedicated support, and money-back guarantee.',
    bgType: 'gradient',
    background: 'linear-gradient(135deg, #0f6b5c, #123b33)',
    backgroundImage: '',
    overlay: 'rgba(0,0,0,0.35)',
    alignment: 'center',
    minHeight: 480,
    textColor: '#ffffff',
    primaryCtaLabel: 'Get Started Now',
    primaryCtaUrl: '#',
    secondaryCtaLabel: 'Learn More',
    secondaryCtaUrl: '#',
  },
  render: (props) => {
    const logoUrl = safeImageUrl(props.logo)
    const bgImgUrl = safeImageUrl(props.backgroundImage)
    const overlayVal = safeColor(props.overlay) ?? safeCssValue(props.overlay) ?? 'rgba(0,0,0,0.35)'
    const isCenter = props.alignment === 'center'
    const isRight = props.alignment === 'right'

    let backgroundStyle = safeColor(props.background) ?? safeCssValue(props.background) ?? 'linear-gradient(135deg,#0f6b5c,#123b33)'

    if (props.bgType === 'image' && bgImgUrl) {
      backgroundStyle = `#14201d url(${bgImgUrl}) center/cover no-repeat`
    } else if (props.bgType === 'solid' && props.background) {
      backgroundStyle = safeColor(props.background) ?? '#0f6b5c'
    }

    return (
      <div
        style={{
          position: 'relative',
          padding: '64px 32px',
          borderRadius: 16,
          overflow: 'hidden',
          background: backgroundStyle,
          minHeight: props.minHeight || 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
          color: safeColor(props.textColor) ?? '#ffffff',
        }}
      >
        {props.bgType === 'image' && bgImgUrl && overlayVal ? (
          <div style={{ position: 'absolute', inset: 0, background: overlayVal, pointerEvents: 'none' }} />
        ) : null}
        <div
          style={{
            position: 'relative',
            maxWidth: 720,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
            textAlign: isCenter ? 'center' : isRight ? 'right' : 'left',
            gap: 16,
          }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ maxHeight: 60, width: 'auto', marginBottom: 8, objectFit: 'contain' }} />
          ) : null}

          {props.eyebrow ? (
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.9 }}>
              {props.eyebrow}
            </div>
          ) : null}

          <h1 style={{ margin: 0, fontSize: 44, fontWeight: 800, lineHeight: 1.15 }}>{props.title}</h1>

          {props.subtitle ? (
            <p style={{ margin: 0, fontSize: 20, fontWeight: 500, opacity: 0.95, lineHeight: 1.4 }}>{props.subtitle}</p>
          ) : null}

          {props.description ? (
            <p style={{ margin: 0, fontSize: 16, fontWeight: 400, opacity: 0.8, lineHeight: 1.6, maxWidth: 580 }}>
              {props.description}
            </p>
          ) : null}

          {(props.primaryCtaLabel || props.secondaryCtaLabel) && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 12,
                justifyContent: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start',
              }}
            >
              {props.primaryCtaLabel ? (
                renderButton({ ...heroButtonDefaults, label: props.primaryCtaLabel, url: props.primaryCtaUrl, align: props.alignment })
              ) : null}
              {props.secondaryCtaLabel ? (
                renderButton({
                  ...heroButtonDefaults,
                  preset: 'outline',
                  textColor: '#ffffff',
                  border: '2px solid rgba(255,255,255,0.7)',
                  label: props.secondaryCtaLabel,
                  url: props.secondaryCtaUrl,
                  align: props.alignment,
                })
              ) : null}
            </div>
          )}
        </div>
      </div>
    )
  },
}
