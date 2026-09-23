import type { ComponentConfig } from '@puckeditor/core'
import { colorField } from '../fields'
import { safeBackground, safeColor, safeCssValue } from '../../utils/safeUrl'

export type StatItem = {
  value: string
  label: string
  icon?: string
  valueColor: string
  labelColor: string
}

export type StatsSectionProps = {
  items: StatItem[]
  columns: 2 | 3 | 4
  background: string
  border: string
  showDivider: boolean
  dividerColor: string
  radius: number
  padding: number
  valueColor: string
  labelColor: string
}

export const statsSectionConfig: ComponentConfig<StatsSectionProps> = {
  label: 'Stats Section',
  fields: {
    items: {
      type: 'array',
      label: 'Statistics Items',
      min: 1,
      max: 6,
      getItemSummary: (item) => `${item.icon ? item.icon + ' ' : ''}${item.value || '0'} — ${item.label || 'Stat'}`,
      arrayFields: {
        value: { type: 'text', label: 'Value (e.g. 10,000+)' },
        label: { type: 'text', label: 'Label (e.g. สมาชิก)' },
        icon: { type: 'text', label: 'Icon (Emoji or symbol, optional)' },
        valueColor: colorField('Value Color Override'),
        labelColor: colorField('Label Color Override'),
      },
      defaultItemProps: { value: '100+', label: 'Items', icon: '★', valueColor: '', labelColor: '' },
    },
    columns: {
      type: 'select',
      label: 'Columns (Desktop)',
      options: [
        { label: '2 Columns', value: 2 },
        { label: '3 Columns', value: 3 },
        { label: '4 Columns', value: 4 },
      ],
    },
    background: colorField('Background Color'),
    border: { type: 'text', label: 'Border (e.g. 1px solid rgba(212,175,55,0.3))' },
    showDivider: {
      type: 'radio',
      label: 'Show Item Dividers',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
    dividerColor: colorField('Divider Color'),
    radius: { type: 'number', label: 'Border Radius (px)', min: 0, max: 40 },
    padding: { type: 'number', label: 'Padding (px)', min: 8, max: 48 },
    valueColor: colorField('Default Value Color'),
    labelColor: colorField('Default Label Color'),
  },
  defaultProps: {
    items: [
      { value: '10,000+', label: 'สมาชิก', icon: '👥', valueColor: '', labelColor: '' },
      { value: '24/7', label: 'บริการ', icon: '⚡', valueColor: '', labelColor: '' },
      { value: '100%', label: 'ปลอดภัย', icon: '🛡️', valueColor: '', labelColor: '' },
    ],
    columns: 3,
    background: 'rgba(20, 20, 20, 0.75)',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    showDivider: true,
    dividerColor: 'rgba(212, 175, 55, 0.25)',
    radius: 16,
    padding: 16,
    valueColor: '#f6e27a',
    labelColor: '#d4d4d4',
  },
  render: ({
    items = [],
    columns = 3,
    background = 'rgba(20, 20, 20, 0.75)',
    border = '1px solid rgba(212, 175, 55, 0.35)',
    showDivider = true,
    dividerColor = 'rgba(212, 175, 55, 0.25)',
    radius = 16,
    padding = 16,
    valueColor = '#f6e27a',
    labelColor = '#d4d4d4',
  }) => {
    const bg = safeBackground(background) ?? 'rgba(20, 20, 20, 0.75)'
    const bdr = safeCssValue(border) ?? '1px solid rgba(212, 175, 55, 0.35)'
    const dColor = safeColor(dividerColor) ?? 'rgba(212, 175, 55, 0.25)'
    const defaultValColor = safeColor(valueColor) ?? '#f6e27a'
    const defaultLblColor = safeColor(labelColor) ?? '#d4d4d4'

    const colCount = Math.max(1, Math.min(4, columns || 3))

    return (
      <div
        className="sp-stats-section"
        style={{
          background: bg,
          border: bdr,
          borderRadius: radius ?? 16,
          padding: `${padding ?? 16}px 12px`,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          width: '100%',
          boxSizing: 'border-box',
          margin: '8px 0',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colCount}, 1fr)`,
            alignItems: 'center',
            width: '100%',
          }}
        >
          {items.map((item, idx) => {
            const itemValColor = safeColor(item.valueColor) ?? defaultValColor
            const itemLblColor = safeColor(item.labelColor) ?? defaultLblColor
            const isLast = idx === items.length - 1
            const hasRightDivider = showDivider && !isLast && (idx + 1) % colCount !== 0

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '8px 4px',
                  borderRight: hasRightDivider ? `1px solid ${dColor}` : 'none',
                  minWidth: 0,
                }}
              >
                {item.icon ? (
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: 18,
                      marginBottom: 4,
                      lineHeight: 1,
                    }}
                  >
                    {item.icon}
                  </span>
                ) : null}
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: itemValColor,
                    lineHeight: 1.15,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.value}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: itemLblColor,
                    marginTop: 4,
                    lineHeight: 1.2,
                    opacity: 0.9,
                  }}
                >
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
}
