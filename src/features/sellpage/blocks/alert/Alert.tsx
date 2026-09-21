import type { ComponentConfig } from '@puckeditor/core'
import { colorField } from '../fields'
import { safeColor, safeCssValue } from '../../utils/safeUrl'

export type AlertPreset = 'info' | 'success' | 'warning' | 'security' | 'vip'

export type AlertProps = {
  title: string
  description: string
  variant: AlertPreset
  background: string
  textColor: string
  border: string
  radius: number
}

const variantTokens: Record<AlertPreset, { background: string; textColor: string; border: string; icon: string }> = {
  info: { background: '#e7f1fb', textColor: '#0b4a86', border: '1px solid #bcdcf7', icon: 'ℹ️' },
  success: { background: '#e5f6ee', textColor: '#0b5c34', border: '1px solid #b9e6cc', icon: '✅' },
  warning: { background: '#fdf3d8', textColor: '#7a5b06', border: '1px solid #f5e0a0', icon: '⚠️' },
  security: { background: '#0d192b', textColor: '#60a5fa', border: '1px solid #1e3a8a', icon: '🛡️' },
  vip: { background: 'linear-gradient(135deg, #1c1917, #0c0a09)', textColor: '#f6e27a', border: '1px solid #cb9b2d', icon: '👑' },
}

export const alertConfig: ComponentConfig<AlertProps> = {
  label: 'Alert',
  fields: {
    title: { type: 'text', label: 'Title' },
    description: { type: 'textarea', label: 'Description / Message' },
    variant: {
      type: 'select',
      label: 'Preset Variant',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Success', value: 'success' },
        { label: 'Warning', value: 'warning' },
        { label: 'Security', value: 'security' },
        { label: 'VIP Gold', value: 'vip' },
      ],
    },
    background: colorField('Background override (optional)'),
    textColor: colorField('Text color override (optional)'),
    border: { type: 'text', label: 'Border override (optional)', placeholder: 'e.g. 1px solid #000' },
    radius: { type: 'number', label: 'Radius (px)', min: 0, max: 48 },
  },
  defaultProps: {
    title: 'Important Notice',
    description: 'This is an important alert message for your customers.',
    variant: 'info',
    background: '',
    textColor: '',
    border: '',
    radius: 12,
  },
  render: ({ title, description, variant, background, textColor, border, radius }) => {
    const tokens = variantTokens[variant] ?? variantTokens.info
    const bg = safeColor(background) ?? safeCssValue(background) ?? tokens.background
    const color = safeColor(textColor) ?? tokens.textColor
    const borderStyle = safeCssValue(border) ?? tokens.border

    return (
      <div
        role="status"
        style={{
          background: bg,
          color,
          border: borderStyle,
          borderRadius: radius ?? 12,
          padding: '16px 20px',
          fontSize: 15,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          boxShadow: variant === 'vip' ? '0 8px 24px rgba(203,155,45,0.15)' : 'none',
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{tokens.icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {title ? <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{title}</div> : null}
          {description ? <div style={{ opacity: 0.9, lineHeight: 1.4 }}>{description}</div> : null}
        </div>
      </div>
    )
  },
}
