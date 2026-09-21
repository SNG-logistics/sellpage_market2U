import type { ComponentConfig } from '@puckeditor/core'
import { alignOptions, colorField, type Align } from '../fields'
import { safeColor } from '../../utils/safeUrl'

export type TextProps = {
  content: string
  align: Align
  color: string
  fontSize: number
  fontWeight: 400 | 500 | 600 | 700
  lineHeight: number
  opacity: number
}

export const textConfig: ComponentConfig<TextProps> = {
  label: 'Text',
  fields: {
    content: { type: 'textarea', label: 'Content' },
    align: { type: 'radio', label: 'Align', options: [...alignOptions] },
    color: colorField('Color'),
    fontSize: { type: 'number', label: 'Font size (px)', min: 10, max: 48 },
    fontWeight: {
      type: 'select',
      label: 'Font Weight',
      options: [
        { label: '400 (Regular)', value: 400 },
        { label: '500 (Medium)', value: 500 },
        { label: '600 (Semi Bold)', value: 600 },
        { label: '700 (Bold)', value: 700 },
      ],
    },
    lineHeight: { type: 'number', label: 'Line Height (multiplier)', min: 1, max: 3, step: 0.1 },
    opacity: { type: 'number', label: 'Opacity (0.1 to 1)', min: 0.1, max: 1, step: 0.05 },
  },
  defaultProps: {
    content: 'Add your text content here.',
    align: 'left',
    color: '',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    opacity: 1,
  },
  render: ({ content, align, color, fontSize, fontWeight, lineHeight, opacity }) => (
    <p
      style={{
        margin: 0,
        textAlign: align,
        color: safeColor(color) ?? 'var(--sp-text, inherit)',
        fontSize,
        fontWeight: fontWeight || 400,
        lineHeight: lineHeight || 1.6,
        opacity: opacity ?? 1,
        whiteSpace: 'pre-line',
      }}
    >
      {content}
    </p>
  ),
}
