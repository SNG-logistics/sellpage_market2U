import type { ComponentConfig } from '@puckeditor/core'
import { colorField } from '../fields'
import { safeBackground, safeColor } from '../../utils/safeUrl'

export type TrustBarItem = {
  icon: string
  text: string
}

export type TrustBarProps = {
  enabled?: boolean
  items: TrustBarItem[]
  textColor: string
  background: string
  dividerColor: string
  fontSize: number
  fontWeight: 400 | 500 | 600 | 700
}

export const trustBarConfig: ComponentConfig<TrustBarProps> = {
  label: 'Trust Bar',
  fields: {
    enabled: {
      type: 'radio',
      label: 'Visibility',
      options: [
        { label: 'Visible', value: true },
        { label: 'Hidden', value: false },
      ],
    },
    items: {
      type: 'array',
      label: 'Trust Badges (2–4 items)',
      min: 1,
      max: 4,
      getItemSummary: (item) => `${item.icon || '✓'} ${item.text || 'Item'}`,
      arrayFields: {
        icon: { type: 'text', label: 'Icon (emoji or symbol)' },
        text: { type: 'text', label: 'Text' },
      },
      defaultItemProps: { icon: '✓', text: 'ปลอดภัย 100%' },
    },
    textColor: colorField('Text Color'),
    background: colorField('Background Color'),
    dividerColor: colorField('Divider Color'),
    fontSize: { type: 'number', label: 'Font size (px)', min: 10, max: 24 },
    fontWeight: {
      type: 'select',
      label: 'Font weight',
      options: [
        { label: '400 (Regular)', value: 400 },
        { label: '500 (Medium)', value: 500 },
        { label: '600 (Semi-bold)', value: 600 },
        { label: '700 (Bold)', value: 700 },
      ],
    },
  },
  defaultProps: {
    enabled: true,
    items: [
      { icon: '✓', text: 'มั่นใจ' },
      { icon: '★', text: 'เว็บมั่นคง' },
      { icon: '🛡️', text: 'ได้รับความไว้วางใจ' },
    ],
    textColor: '#f5e2a3',
    background: 'rgba(212, 175, 55, 0.12)',
    dividerColor: 'rgba(212, 175, 55, 0.3)',
    fontSize: 13,
    fontWeight: 600,
  },
  render: ({ enabled = true, items, textColor, background, dividerColor, fontSize, fontWeight }) => {
    if (!enabled) return <></>

    const color = safeColor(textColor) ?? '#f5e2a3'
    const bg = safeBackground(background) ?? 'rgba(212, 175, 55, 0.12)'
    const divider = safeColor(dividerColor) ?? 'rgba(212, 175, 55, 0.3)'

    return (
      <div
        className="sp-trust-bar"
        style={{
          background: bg,
          color,
          fontSize: fontSize || 13,
          fontWeight: fontWeight || 600,
          padding: '8px 12px',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              flex: 1,
              textAlign: 'center',
              borderRight: idx < items.length - 1 ? `1px solid ${divider}` : 'none',
              paddingInline: 6,
            }}
          >
            {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    )
  },
}
