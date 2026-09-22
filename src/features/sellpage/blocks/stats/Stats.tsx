import type { ComponentConfig } from '@puckeditor/core'
import { alignOptions, colorField, type Align } from '../fields'
import { safeColor } from '../../utils/safeUrl'

export type StatsItem = {
  value: string
  label: string
}

export type StatsProps = {
  items: StatsItem[]
  align: Align
  valueColor: string
  labelColor: string
  valueFontSize: number
  columns: 2 | 3 | 4
  mobileColumns?: 1 | 2
}

export const statsConfig: ComponentConfig<StatsProps> = {
  label: 'Stats',
  fields: {
    items: {
      type: 'array',
      label: 'Stats Items',
      min: 1,
      max: 6,
      getItemSummary: (item) => `${item.value || '0'} — ${item.label || 'Stat'}`,
      arrayFields: {
        value: { type: 'text', label: 'Value (e.g. 10,000+)' },
        label: { type: 'text', label: 'Label (e.g. สมาชิก)' },
      },
      defaultItemProps: { value: '100%', label: 'Satisfied' },
    },
    align: { type: 'radio', label: 'Alignment', options: [...alignOptions] },
    valueColor: colorField('Value Color'),
    labelColor: colorField('Label Color'),
    valueFontSize: { type: 'number', label: 'Value Font Size', min: 18, max: 72 },
    columns: {
      type: 'select',
      label: 'Grid Columns (Desktop)',
      options: [
        { label: '2 Columns', value: 2 },
        { label: '3 Columns', value: 3 },
        { label: '4 Columns', value: 4 },
      ],
    },
    mobileColumns: {
      type: 'radio',
      label: 'Mobile Columns',
      options: [
        { label: '1 Column', value: 1 },
        { label: '2 Columns', value: 2 },
      ],
    },
  },
  defaultProps: {
    items: [
      { value: '10,000+', label: 'สมาชิก' },
      { value: '24/7', label: 'บริการ' },
      { value: '100%', label: 'Secure' },
    ],
    align: 'center',
    valueColor: '',
    labelColor: '',
    valueFontSize: 36,
    columns: 3,
    mobileColumns: 1,
  },
  render: ({ items, align, valueColor, labelColor, valueFontSize, columns, mobileColumns }) => {
    const valColor = safeColor(valueColor) ?? 'var(--sp-primary, #0f6b5c)'
    const lblColor = safeColor(labelColor) ?? 'var(--sp-text, #14201d)'
    const textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'
    // Only opt a block into the mobile override when it actually carries the
    // prop. A page saved before this existed has no `mobileColumns`, and must
    // keep showing `columns` at every width (rule 8).
    const mCols = mobileColumns === 1 || mobileColumns === 2 ? mobileColumns : null

    return (
      <div
        className={mCols === null ? undefined : 'sp-stats'}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))`,
          gap: 24,
          padding: '24px 16px',
          width: '100%',
          ...(mCols === null ? {} : { '--sp-stats-mobile-cols': String(mCols) }),
        } as React.CSSProperties}
      >
        {items.map((item, index) => (
          // eslint-disable-next-line react/no-array-index-key -- stats items don't have stable unique IDs
          <div key={index} style={{ textAlign, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: valueFontSize || 36, fontWeight: 800, color: valColor, lineHeight: 1.1 }}>
              {item.value || '0'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: lblColor, opacity: 0.85, lineHeight: 1.3 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    )
  },
}
