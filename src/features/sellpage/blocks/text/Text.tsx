import type { ComponentConfig } from '@puckeditor/core'
import { alignOptions, colorField, type Align } from '../fields'
import { safeColor } from '../../utils/safeUrl'

export type TextProps = {
  content: string
  align: Align
  color: string
  fontSize: number
  mobileFontSize?: number
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
    mobileFontSize: { type: 'number', label: 'Mobile Font size (px, optional)', min: 8, max: 36 },
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
    mobileFontSize: 0,
    fontWeight: 400,
    lineHeight: 1.6,
    opacity: 1,
  },
  render: ({ content, align, color, fontSize, mobileFontSize, fontWeight, lineHeight, opacity }) => {
    // See Heading: the class is attached only when there is an override, so a
    // page saved before this prop existed keeps one size at every width.
    const mSize = typeof mobileFontSize === 'number' && mobileFontSize > 0 ? `${mobileFontSize}px` : null

    return (
      <p
        className={mSize === null ? undefined : 'sp-responsive-text'}
        style={
          {
            margin: 0,
            textAlign: align,
            color: safeColor(color) ?? 'var(--sp-text, inherit)',
            fontSize,
            fontWeight: fontWeight || 400,
            lineHeight: lineHeight || 1.6,
            opacity: opacity ?? 1,
            whiteSpace: 'pre-line',
            ...(mSize === null ? {} : { '--sp-mobile-font-size': mSize }),
          } as React.CSSProperties
        }
      >
        {content}
      </p>
    )
  },
}
