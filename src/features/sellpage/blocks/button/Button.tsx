import type { ComponentConfig } from '@puckeditor/core'
import type { CSSProperties } from 'react'
import { alignOptions, colorField, type Align } from '../fields'
import { buttonPresetOptions, buttonPresets, isButtonPresetId, type ButtonPresetId } from './buttonPresets'
import { safeUrl } from '../../utils/safeUrl'
import { buttonIconMap, buttonIconOptions } from './buttonIconRegistry'

export type ButtonProps = {
  label: string
  subtitle: string
  url: string
  icon: keyof typeof buttonIconMap | 'none'
  iconPosition: 'left' | 'right'
  openTarget: '_self' | '_blank'
  width: 'auto' | 'full'
  align: Align
  preset: ButtonPresetId
  background: string
  textColor: string
  border: string
  radius: number
  shadow: string
  padding: number
  fontSize: number
  fontWeight: 400 | 500 | 600 | 700
  animation: 'none' | 'pulse' | 'bounce' | 'shine'
}

/**
 * The single Button implementation used everywhere a button-like block is
 * needed. SocialButton wraps this rather than re-implementing it.
 */
export function renderButton(props: ButtonProps) {
  const preset = buttonPresets[isButtonPresetId(props.preset) ? props.preset : 'solid']
  const href = safeUrl(props.url)
  const Icon = props.icon !== 'none' ? buttonIconMap[props.icon] : null

  const style: CSSProperties = {
    background: props.background || preset.background,
    color: props.textColor || preset.textColor,
    border: props.border || preset.border,
    borderRadius: props.radius ?? preset.radius,
    boxShadow: props.shadow || preset.shadow,
    padding: `${props.padding}px ${props.padding * 1.6}px`,
    fontSize: props.fontSize,
    fontWeight: props.fontWeight,
    width: props.width === 'full' ? '100%' : undefined,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexDirection: props.iconPosition === 'right' ? 'row-reverse' : 'row',
    textDecoration: 'none',
    cursor: href ? 'pointer' : 'default',
    ...preset.extra,
  }

  const content = (
    <>
      {Icon ? <Icon aria-hidden="true" /> : null}
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <span>{props.label || 'Button'}</span>
        {props.subtitle ? <span style={{ fontSize: props.fontSize * 0.72, opacity: 0.85, fontWeight: 400 }}>{props.subtitle}</span> : null}
      </span>
    </>
  )

  const wrapperStyle: CSSProperties = {
    display: 'flex',
    justifyContent: props.align === 'center' ? 'center' : props.align === 'right' ? 'flex-end' : 'flex-start',
  }

  const animationClass = props.animation !== 'none' ? `sp-btn-${props.animation}` : undefined

  return (
    <div style={wrapperStyle}>
      {href ? (
        <a href={href} target={props.openTarget} rel={props.openTarget === '_blank' ? 'noopener noreferrer' : undefined} style={style} className={animationClass}>
          {content}
        </a>
      ) : (
        <button type="button" style={style} className={animationClass} disabled aria-disabled="true">
          {content}
        </button>
      )}
    </div>
  )
}

export const buttonConfig: ComponentConfig<ButtonProps> = {
  label: 'Button',
  fields: {
    label: { type: 'text', label: 'Label' },
    subtitle: { type: 'text', label: 'Subtitle' },
    url: { type: 'text', label: 'URL', placeholder: 'https://…' },
    icon: {
      type: 'select',
      label: 'Icon',
      options: [{ label: 'None', value: 'none' }, ...buttonIconOptions],
    },
    iconPosition: {
      type: 'radio',
      label: 'Icon position',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
    openTarget: {
      type: 'radio',
      label: 'Open in',
      options: [
        { label: 'Same tab', value: '_self' },
        { label: 'New tab', value: '_blank' },
      ],
    },
    width: {
      type: 'radio',
      label: 'Width',
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Full', value: 'full' },
      ],
    },
    align: { type: 'radio', label: 'Align', options: [...alignOptions] },
    preset: { type: 'select', label: 'Preset', options: buttonPresetOptions },
    background: colorField('Background (overrides preset)'),
    textColor: colorField('Text color (overrides preset)'),
    border: { type: 'text', label: 'Border (overrides preset)', placeholder: 'e.g. 1px solid #000' },
    radius: { type: 'number', label: 'Radius', min: 0, max: 999 },
    shadow: { type: 'text', label: 'Shadow (overrides preset)' },
    padding: { type: 'number', label: 'Padding', min: 4, max: 48 },
    fontSize: { type: 'number', label: 'Font size', min: 10, max: 40 },
    fontWeight: {
      type: 'select',
      label: 'Font weight',
      options: [
        { label: '400', value: 400 },
        { label: '500', value: 500 },
        { label: '600', value: 600 },
        { label: '700', value: 700 },
      ],
    },
    animation: {
      type: 'select',
      label: 'Animation',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Pulse', value: 'pulse' },
        { label: 'Bounce', value: 'bounce' },
        { label: 'Shine', value: 'shine' },
      ],
    },
  },
  defaultProps: {
    label: 'Click me',
    subtitle: '',
    url: '',
    icon: 'none',
    iconPosition: 'left',
    openTarget: '_self',
    width: 'auto',
    align: 'left',
    preset: 'solid',
    background: '',
    textColor: '',
    border: '',
    radius: 10,
    shadow: '',
    padding: 12,
    fontSize: 16,
    fontWeight: 600,
    animation: 'none',
  },
  render: (props) => renderButton(props),
}
