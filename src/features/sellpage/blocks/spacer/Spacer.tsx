import type { ComponentConfig } from '@puckeditor/core'

export type SpacerProps = { height: number }

export const spacerConfig: ComponentConfig<SpacerProps> = {
  label: 'Spacer',
  fields: {
    height: { type: 'number', label: 'Height (px)', min: 4, max: 400 },
  },
  defaultProps: { height: 32 },
  render: ({ height }) => <div style={{ height }} aria-hidden="true" />,
}
