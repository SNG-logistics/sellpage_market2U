import type { ComponentConfig } from '@puckeditor/core'
import { colorField } from '../fields'
import { safeBackground, safeColor, safeCssValue } from '../../utils/safeUrl'

export type SecurityNoticePreset = 'securityGold' | 'warning' | 'info' | 'dark'

export type SecurityNoticeProps = {
  preset: SecurityNoticePreset
  icon: string
  heading: string
  description: string
  warningText: string
  customBackground: string
  customBorder: string
  titleColor: string
  textColor: string
  radius: number
}

const presets: Record<
  SecurityNoticePreset,
  { bg: string; border: string; titleColor: string; textColor: string; warningColor: string }
> = {
  securityGold: {
    bg: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(212, 175, 55, 0.45)',
    titleColor: '#f6e27a',
    textColor: '#d4d4d4',
    warningColor: '#ffc83b',
  },
  warning: {
    bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.45)',
    titleColor: '#fca5a5',
    textColor: '#f3f4f6',
    warningColor: '#ef4444',
  },
  info: {
    bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(20, 20, 20, 0.85) 100%)',
    border: '1px solid rgba(59, 130, 246, 0.45)',
    titleColor: '#93c5fd',
    textColor: '#f3f4f6',
    warningColor: '#60a5fa',
  },
  dark: {
    bg: 'rgba(20, 20, 20, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    titleColor: '#ffffff',
    textColor: '#a3a3a3',
    warningColor: '#f59e0b',
  },
}

export const securityNoticeConfig: ComponentConfig<SecurityNoticeProps> = {
  label: 'Security Notice',
  fields: {
    preset: {
      type: 'select',
      label: 'Preset Style',
      options: [
        { label: 'Security Gold', value: 'securityGold' },
        { label: 'Warning (Red)', value: 'warning' },
        { label: 'Info (Blue)', value: 'info' },
        { label: 'Dark Neutral', value: 'dark' },
      ],
    },
    icon: { type: 'text', label: 'Icon (Emoji or symbol)' },
    heading: { type: 'text', label: 'Heading' },
    description: { type: 'textarea', label: 'Description' },
    warningText: { type: 'textarea', label: 'Warning Note / Highlight' },
    customBackground: colorField('Custom Background (Optional)'),
    customBorder: { type: 'text', label: 'Custom Border (e.g. 1px solid #d4af37)' },
    titleColor: colorField('Heading Color Override'),
    textColor: colorField('Text Color Override'),
    radius: { type: 'number', label: 'Border Radius (px)', min: 0, max: 32 },
  },
  defaultProps: {
    preset: 'securityGold',
    icon: '🛡️',
    heading: 'ระบบความปลอดภัยและแจ้งเตือนมิจฉาชีพ',
    description: 'โปรดตรวจสอบลิงก์และบัญชีทางการทุกครั้งก่อนทำรายการ ทางเราไม่มีนโยบายทักข้อความหาลูกค้าก่อน',
    warningText: '⚠️ ติดต่อผ่านช่องทางที่ระบุบนหน้านี้เท่านั้น เพื่อความปลอดภัยสูงสุด',
    customBackground: '',
    customBorder: '',
    titleColor: '',
    textColor: '',
    radius: 12,
  },
  render: ({
    preset = 'securityGold',
    icon = '🛡️',
    heading = 'ระบบความปลอดภัยและแจ้งเตือนมิจฉาชีพ',
    description = '',
    warningText = '',
    customBackground = '',
    customBorder = '',
    titleColor = '',
    textColor = '',
    radius = 12,
  }) => {
    const p = presets[preset] ?? presets.securityGold

    const bg = safeBackground(customBackground) || p.bg
    const bdr = safeCssValue(customBorder) || p.border
    const hColor = safeColor(titleColor) || p.titleColor
    const tColor = safeColor(textColor) || p.textColor

    return (
      <div
        className="sp-security-notice"
        style={{
          background: bg,
          border: bdr,
          borderRadius: radius ?? 12,
          padding: '16px 18px',
          margin: '8px 0',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {icon ? (
            <span
              aria-hidden="true"
              style={{
                fontSize: 24,
                lineHeight: 1.2,
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            {heading ? (
              <h4
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: hColor,
                  lineHeight: 1.35,
                }}
              >
                {heading}
              </h4>
            ) : null}
            {description ? (
              <p
                style={{
                  margin: '6px 0 0 0',
                  fontSize: 13,
                  color: tColor,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                }}
              >
                {description}
              </p>
            ) : null}
            {warningText ? (
              <div
                style={{
                  margin: '10px 0 0 0',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: p.warningColor,
                  lineHeight: 1.4,
                  borderLeft: `3px solid ${p.warningColor}`,
                  whiteSpace: 'pre-line',
                }}
              >
                {warningText}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  },
}
