import type { ComponentConfig } from '@puckeditor/core'
import { colorField } from '../fields'
import { safeColor, safeImageUrl } from '../../utils/safeUrl'
import { renderButton, type ButtonProps } from '../button/Button'

export type HeroProps = {
  eyebrow: string
  title: string
  subtitle: string
  backgroundImage: string
  overlayColor: string
  textColor: string
  ctaLabel: string
  ctaUrl: string
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
    eyebrow: { type: 'text', label: 'Eyebrow' },
    title: { type: 'text', label: 'Title' },
    subtitle: { type: 'textarea', label: 'Subtitle' },
    backgroundImage: { type: 'text', label: 'Background image URL' },
    overlayColor: colorField('Overlay color'),
    textColor: colorField('Text color'),
    ctaLabel: { type: 'text', label: 'Button label' },
    ctaUrl: { type: 'text', label: 'Button URL' },
  },
  defaultProps: {
    eyebrow: '',
    title: 'Your headline goes here',
    subtitle: 'A short supporting sentence about the offer.',
    backgroundImage: '',
    overlayColor: 'rgba(0,0,0,0.35)',
    textColor: '#ffffff',
    ctaLabel: 'Get started',
    ctaUrl: '',
  },
  render: ({ eyebrow, title, subtitle, backgroundImage, overlayColor, textColor, ctaLabel, ctaUrl }) => {
    const bg = safeImageUrl(backgroundImage)
    return (
      <div
        style={{
          position: 'relative',
          padding: '72px 32px',
          borderRadius: 16,
          overflow: 'hidden',
          background: bg ? `#14201d` : 'linear-gradient(135deg,#0f6b5c,#123b33)',
          backgroundImage: bg ? `url(${bg})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: safeColor(textColor) ?? '#ffffff',
        }}
      >
        {bg ? <div style={{ position: 'absolute', inset: 0, background: safeColor(overlayColor) ?? 'rgba(0,0,0,0.35)' }} /> : null}
        <div style={{ position: 'relative', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {eyebrow ? <div style={{ fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.85 }}>{eyebrow}</div> : null}
          <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.1 }}>{title}</h1>
          {subtitle ? <p style={{ margin: 0, fontSize: 18, opacity: 0.9 }}>{subtitle}</p> : null}
          {ctaLabel ? renderButton({ ...heroButtonDefaults, label: ctaLabel, url: ctaUrl }) : null}
        </div>
      </div>
    )
  },
}
