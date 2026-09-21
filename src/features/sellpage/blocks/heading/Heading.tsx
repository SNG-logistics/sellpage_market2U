import type { ComponentConfig } from '@puckeditor/core'
import { alignOptions, colorField, type Align } from '../fields'

export type HeadingProps = {
  text: string
  level: 'h1' | 'h2' | 'h3' | 'h4'
  align: Align
  color: string
  fontSize: number
  fontWeight: 400 | 500 | 600 | 700 | 800
}

export const headingConfig: ComponentConfig<HeadingProps> = {
  label: 'Heading',
  fields: {
    text: { type: 'text', label: 'Text' },
    level: {
      type: 'select',
      label: 'Level',
      options: [
        { label: 'H1', value: 'h1' },
        { label: 'H2', value: 'h2' },
        { label: 'H3', value: 'h3' },
        { label: 'H4', value: 'h4' },
      ],
    },
    align: { type: 'radio', label: 'Align', options: [...alignOptions] },
    color: colorField('Color'),
    fontSize: { type: 'number', label: 'Font size', min: 12, max: 96 },
    fontWeight: {
      type: 'select',
      label: 'Weight',
      options: [400, 500, 600, 700, 800].map((v) => ({ label: String(v), value: v })),
    },
  },
  defaultProps: {
    text: 'Heading',
    level: 'h2',
    align: 'left',
    color: '',
    fontSize: 32,
    fontWeight: 700,
  },
  render: ({ text, level: Level, align, color, fontSize, fontWeight }) => (
    <Level style={{ margin: 0, textAlign: align, color: color || undefined, fontSize, fontWeight }}>{text}</Level>
  ),
}
