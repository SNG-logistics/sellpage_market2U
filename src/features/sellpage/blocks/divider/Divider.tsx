import type { ComponentConfig } from '@puckeditor/core'
import { colorField } from '../fields'

export type DividerProps = { color: string; thickness: number; margin: number }

export const dividerConfig: ComponentConfig<DividerProps> = {
  label: 'Divider',
  fields: {
    color: colorField('Color'),
    thickness: { type: 'number', label: 'Thickness', min: 1, max: 12 },
    margin: { type: 'number', label: 'Vertical margin', min: 0, max: 96 },
  },
  defaultProps: { color: '', thickness: 1, margin: 16 },
  render: ({ color, thickness, margin }) => (
    <hr style={{ border: 'none', borderTop: `${thickness}px solid ${color || '#e2e0da'}`, margin: `${margin}px 0` }} />
  ),
}
