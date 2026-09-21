import type { ComponentConfig } from '@puckeditor/core'

export type StatsProps = {
  items: { value: string; label: string }[]
}

export const statsConfig: ComponentConfig<StatsProps> = {
  label: 'Stats',
  fields: {
    items: {
      type: 'array',
      label: 'Stats',
      min: 1,
      max: 6,
      getItemSummary: (item) => item.value || 'Stat',
      arrayFields: {
        value: { type: 'text', label: 'Value' },
        label: { type: 'text', label: 'Label' },
      },
      defaultItemProps: { value: '0', label: 'Label' },
    },
  },
  defaultProps: {
    items: [
      { value: '10k+', label: 'Customers' },
      { value: '4.9', label: 'Rating' },
      { value: '24/7', label: 'Support' },
    ],
  },
  render: ({ items }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {items.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key -- stats have no stable id of their own
        <div key={index} style={{ textAlign: 'center', flex: '1 1 120px' }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{item.value}</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>{item.label}</div>
        </div>
      ))}
    </div>
  ),
}
