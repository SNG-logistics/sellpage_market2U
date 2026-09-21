import type { ComponentConfig } from '@puckeditor/core'
import { renderButton, type ButtonProps } from '../button/Button'
import { alignOptions } from '../fields'

const socialNetworks = {
  facebook: { label: 'Facebook', background: '#1877F2', icon: 'facebookLike' },
  line: { label: 'LINE', background: '#06C755', icon: 'phone' },
  messenger: { label: 'Messenger', background: '#0084FF', icon: 'phone' },
  whatsapp: { label: 'WhatsApp', background: '#25D366', icon: 'phone' },
} as const

type Network = keyof typeof socialNetworks

export type SocialButtonProps = Pick<ButtonProps, 'url' | 'openTarget' | 'width' | 'align' | 'radius' | 'padding' | 'fontSize' | 'animation'> & {
  network: Network
  label: string
}

const buttonDefaults: Omit<ButtonProps, keyof SocialButtonProps | 'label'> = {
  subtitle: '',
  icon: 'none',
  iconPosition: 'left',
  preset: 'solid',
  background: '',
  textColor: '#ffffff',
  border: 'none',
  shadow: 'none',
  fontWeight: 600,
}

/**
 * SocialButton reuses the Button renderer and only supplies a network preset
 * (brand colour) plus a restricted field set — it never re-implements Button.
 */
export const socialButtonConfig: ComponentConfig<SocialButtonProps> = {
  label: 'Social Button',
  fields: {
    network: {
      type: 'select',
      label: 'Network',
      options: Object.entries(socialNetworks).map(([value, meta]) => ({ label: meta.label, value: value as Network })),
    },
    label: { type: 'text', label: 'Label' },
    url: { type: 'text', label: 'URL', placeholder: 'https://…' },
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
    radius: { type: 'number', label: 'Radius', min: 0, max: 999 },
    padding: { type: 'number', label: 'Padding', min: 4, max: 48 },
    fontSize: { type: 'number', label: 'Font size', min: 10, max: 40 },
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
    network: 'line',
    label: 'Chat with us',
    url: '',
    openTarget: '_blank',
    width: 'auto',
    align: 'left',
    radius: 999,
    padding: 12,
    fontSize: 16,
    animation: 'none',
  },
  render: (props) => {
    const network = socialNetworks[props.network]
    return renderButton({
      ...buttonDefaults,
      label: props.label,
      url: props.url,
      openTarget: props.openTarget,
      width: props.width,
      align: props.align,
      radius: props.radius,
      padding: props.padding,
      fontSize: props.fontSize,
      animation: props.animation,
      background: network.background,
    })
  },
}
