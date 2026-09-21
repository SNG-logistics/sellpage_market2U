import type { ComponentConfig } from '@puckeditor/core'
import { renderButton, type ButtonProps } from '../button/Button'
import { alignOptions, colorField } from '../fields'
import { buttonIconMap } from '../button/buttonIconRegistry'

export const socialNetworks = {
  line: { label: 'LINE', background: '#06C755', textColor: '#ffffff', icon: 'line' as keyof typeof buttonIconMap },
  whatsapp: { label: 'WhatsApp', background: '#25D366', textColor: '#ffffff', icon: 'whatsapp' as keyof typeof buttonIconMap },
  telegram: { label: 'Telegram', background: '#229ED9', textColor: '#ffffff', icon: 'telegram' as keyof typeof buttonIconMap },
  facebook: { label: 'Facebook', background: '#1877F2', textColor: '#ffffff', icon: 'facebook' as keyof typeof buttonIconMap },
  tiktok: { label: 'TikTok', background: '#000000', textColor: '#ffffff', icon: 'tiktok' as keyof typeof buttonIconMap },
  instagram: { label: 'Instagram', background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)', textColor: '#ffffff', icon: 'instagram' as keyof typeof buttonIconMap },
  youtube: { label: 'YouTube', background: '#FF0000', textColor: '#ffffff', icon: 'youtube' as keyof typeof buttonIconMap },
  website: { label: 'Website', background: '#14201d', textColor: '#ffffff', icon: 'website' as keyof typeof buttonIconMap },
  phone: { label: 'Phone', background: '#0f6b5c', textColor: '#ffffff', icon: 'phone' as keyof typeof buttonIconMap },
  email: { label: 'Email', background: '#ea4335', textColor: '#ffffff', icon: 'email' as keyof typeof buttonIconMap },
} as const

export type SocialNetworkKey = keyof typeof socialNetworks

export type SocialButtonProps = Pick<ButtonProps, 'url' | 'openTarget' | 'width' | 'align' | 'radius' | 'padding' | 'fontSize' | 'animation'> & {
  network: SocialNetworkKey
  label: string
  customBackground: string
  customTextColor: string
}

const buttonDefaults: Omit<ButtonProps, keyof SocialButtonProps | 'label'> = {
  subtitle: '',
  icon: 'none',
  iconPosition: 'left',
  preset: 'solid',
  background: '',
  textColor: '',
  border: 'none',
  shadow: 'none',
  fontWeight: 600,
}

/**
 * SocialButton reuses the Button renderer and only supplies a network preset
 * (brand colour and default icon) plus a restricted field set — it never re-implements Button.
 */
export const socialButtonConfig: ComponentConfig<SocialButtonProps> = {
  label: 'Social Button',
  fields: {
    network: {
      type: 'select',
      label: 'Platform',
      options: Object.entries(socialNetworks).map(([value, meta]) => ({ label: meta.label, value: value as SocialNetworkKey })),
    },
    label: { type: 'text', label: 'Label' },
    url: { type: 'text', label: 'URL', placeholder: 'https://…' },
    customBackground: colorField('Background override (optional)'),
    customTextColor: colorField('Text color override (optional)'),
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
    label: 'Chat with us on LINE',
    url: '',
    customBackground: '',
    customTextColor: '',
    openTarget: '_blank',
    width: 'auto',
    align: 'left',
    radius: 999,
    padding: 12,
    fontSize: 16,
    animation: 'none',
  },
  render: (props) => {
    const networkMeta = socialNetworks[props.network] ?? socialNetworks.line
    const bg = props.customBackground || networkMeta.background
    const color = props.customTextColor || networkMeta.textColor
    const iconKey = networkMeta.icon

    return renderButton({
      ...buttonDefaults,
      label: props.label || networkMeta.label,
      url: props.url,
      icon: iconKey,
      iconPosition: 'left',
      openTarget: props.openTarget,
      width: props.width,
      align: props.align,
      radius: props.radius,
      padding: props.padding,
      fontSize: props.fontSize,
      animation: props.animation,
      background: bg,
      textColor: color,
    })
  },
}
