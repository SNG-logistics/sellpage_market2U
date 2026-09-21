import type { ComponentConfig } from '@puckeditor/core'

export type AlertProps = {
  message: string
  variant: 'info' | 'success' | 'warning' | 'danger'
}

const variantStyles: Record<AlertProps['variant'], { background: string; color: string; border: string }> = {
  info: { background: '#e7f1fb', color: '#0b4a86', border: '#bcdcf7' },
  success: { background: '#e5f6ee', color: '#0b5c34', border: '#b9e6cc' },
  warning: { background: '#fdf3d8', color: '#7a5b06', border: '#f5e0a0' },
  danger: { background: '#fbe9e9', color: '#8a1f1f', border: '#f3c6c6' },
}

export const alertConfig: ComponentConfig<AlertProps> = {
  label: 'Alert',
  fields: {
    message: { type: 'textarea', label: 'Message' },
    variant: {
      type: 'select',
      label: 'Variant',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Success', value: 'success' },
        { label: 'Warning', value: 'warning' },
        { label: 'Danger', value: 'danger' },
      ],
    },
  },
  defaultProps: { message: 'This is an alert message.', variant: 'info' },
  render: ({ message, variant }) => {
    const tokens = variantStyles[variant] ?? variantStyles.info
    return (
      <div
        role="status"
        style={{
          background: tokens.background,
          color: tokens.color,
          border: `1px solid ${tokens.border}`,
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: 14,
        }}
      >
        {message}
      </div>
    )
  },
}
