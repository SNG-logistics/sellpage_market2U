import type { ComponentConfig, Slot } from '@puckeditor/core'
import { colorField } from '../fields'
import { safeColor } from '../../utils/safeUrl'

export type ContainerProps = {
  content: Slot
  direction: 'row' | 'column'
  gap: number
  padding: number
  background: string
  radius: number
  maxWidth: number
}

/**
 * Nested layout via Puck's Slot field — the editor renders drag/drop for
 * the slot's children itself; no custom nested DnD is implemented here.
 */
export const containerConfig: ComponentConfig<ContainerProps> = {
  label: 'Container',
  fields: {
    content: { type: 'slot' },
    direction: {
      type: 'radio',
      label: 'Direction',
      options: [
        { label: 'Row', value: 'row' },
        { label: 'Column', value: 'column' },
      ],
    },
    gap: { type: 'number', label: 'Gap', min: 0, max: 96 },
    padding: { type: 'number', label: 'Padding', min: 0, max: 96 },
    background: colorField('Background'),
    radius: { type: 'number', label: 'Radius', min: 0, max: 64 },
    maxWidth: { type: 'number', label: 'Max width (px, 0 = full)', min: 0, max: 1600 },
  },
  defaultProps: {
    content: [],
    direction: 'column',
    gap: 16,
    padding: 24,
    background: '',
    radius: 0,
    maxWidth: 0,
  },
  render: ({ content: Content, direction, gap, padding, background, radius, maxWidth }) => (
    <Content
      style={{
        display: 'flex',
        flexDirection: direction,
        flexWrap: 'wrap',
        gap,
        padding,
        background: safeColor(background),
        borderRadius: radius,
        maxWidth: maxWidth > 0 ? maxWidth : undefined,
        marginInline: maxWidth > 0 ? 'auto' : undefined,
        minHeight: 60,
      }}
    />
  ),
}
