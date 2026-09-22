import type { CustomField } from '@puckeditor/core'
import { ImageFieldInput } from '../media/ImageFieldInput'

/** Shared field option lists, so every block offers the same choices. */
export const alignOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
] as const

export type Align = (typeof alignOptions)[number]['value']

/**
 * Colour field built on Puck's custom field API.
 *
 * Deliberately does NOT import Puck's `FieldLabel` helper: Puck's published
 * package bundles `FieldLabel` in the same chunk as the editor itself
 * (`Puck`, `Button`, panel chrome), so importing it here — in a module the
 * PUBLIC renderer also reaches through `blocks/index.ts` — would pull the
 * Puck Editor bundle into the public page. A plain label keeps the public
 * bundle editor-free while still sharing one block/field definition.
 *
 * An empty string means "inherit from preset/theme", so a block never
 * stores a colour it did not choose.
 */
export const colorField = (label: string): CustomField<string> => ({
  type: 'custom',
  label,
  render: ({ id, value, onChange, readOnly }) => (
    <label className="sp-color-field" htmlFor={id}>
      <span className="sp-color-field__label">{label}</span>
      <span className="sp-color-field__controls">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={/^#[0-9a-fA-F]{6}$/.test(value ?? '') ? value : '#000000'}
          disabled={readOnly}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          id={id}
          type="text"
          placeholder="Preset default"
          value={value ?? ''}
          disabled={readOnly}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" disabled={readOnly || !value} onClick={() => onChange('')}>
          Reset
        </button>
      </span>
    </label>
  ),
})

/**
 * Image URL field with the media-library picker. Use it for every prop that
 * holds an image URL, in place of a `text` field.
 *
 * The stored value is still a plain URL string, so switching a `text` field
 * to this one changes nothing about saved pages — and the render side must
 * keep passing the value through `safeImageUrl` exactly as before.
 */
export const imageField = (label: string): CustomField<string> => ({
  type: 'custom',
  label,
  render: ({ id, value, onChange, readOnly }) => (
    <ImageFieldInput id={id} label={label} value={value} readOnly={readOnly} onChange={onChange} />
  ),
})
