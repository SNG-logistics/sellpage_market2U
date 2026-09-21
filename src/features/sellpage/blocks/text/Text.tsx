import type { ComponentConfig } from '@puckeditor/core'
import { alignOptions, colorField, type Align } from '../fields'

export type TextProps = {
  content: string
  align: Align
  color: string
  fontSize: number
}

export const textConfig: ComponentConfig<TextProps> = {
  label: 'Text',
  fields: {
    content: { type: 'textarea', label: 'Content' },
    align: { type: 'radio', label: 'Align', options: [...alignOptions] },
    color: colorField('Color'),
    fontSize: { type: 'number', label: 'Font size', min: 10, max: 48 },
  },
  defaultProps: {
    content: 'Add your text here.',
    align: 'left',
    color: '',
    fontSize: 16,
  },
  render: ({ content, align, color, fontSize }) => (
    <p style={{ margin: 0, textAlign: align, color: color || undefined, fontSize, whiteSpace: 'pre-line' }}>{content}</p>
  ),
}
