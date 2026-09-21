import type { ComponentConfig } from '@puckeditor/core'
import { alignOptions, colorField, type Align } from '../fields'
import { safeColor } from '../../utils/safeUrl'

export type HeadingProps = {
  text: string
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  align: Align
  color: string
  fontSize: number
  fontWeight: 400 | 500 | 600 | 700 | 800
  lineHeight: number
}

export const headingConfig: ComponentConfig<HeadingProps> = {
  label: 'Heading',
  fields: {
    text: { type: 'text', label: 'Text' },
    level: {
      type: 'select',
      label: 'HTML Tag / Level',
      options: [
        { label: 'H1', value: 'h1' },
        { label: 'H2', value: 'h2' },
        { label: 'H3', value: 'h3' },
        { label: 'H4', value: 'h4' },
        { label: 'H5', value: 'h5' },
        { label: 'H6', value: 'h6' },
      ],
    },
    align: { type: 'radio', label: 'Align', options: [...alignOptions] },
    color: colorField('Color'),
    fontSize: { type: 'number', label: 'Font size (px)', min: 12, max: 96 },
    fontWeight: {
      type: 'select',
      label: 'Font Weight',
      options: [400, 500, 600, 700, 800].map((v) => ({ label: String(v), value: v })),
    },
    lineHeight: { type: 'number', label: 'Line Height (multiplier)', min: 0.8, max: 2.5, step: 0.1 },
  },
  defaultProps: {
    text: 'Heading',
    level: 'h2',
    align: 'left',
    color: '',
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  render: ({ text, level: Level, align, color, fontSize, fontWeight, lineHeight }) => (
    <Level
      style={{
        margin: 0,
        textAlign: align,
        color: safeColor(color) ?? 'var(--sp-text, inherit)',
        fontSize,
        fontWeight,
        lineHeight: lineHeight || 1.2,
      }}
    >
      {text}
    </Level>
  ),
}
