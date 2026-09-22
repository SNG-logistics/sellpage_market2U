import { useEffect, useState } from 'react'
import type { ComponentConfig } from '@puckeditor/core'
import { alignOptions, colorField, type Align } from '../fields'
import { safeBackground, safeColor, safeCssValue } from '../../utils/safeUrl'

export type OnlineCounterProps = {
  enabled?: boolean
  prefix: string
  number: number
  suffix: string
  mode: 'manual' | 'random'
  min: number
  max: number
  refreshInterval: number
  iconType: 'pulseDot' | 'users' | 'fire'
  background: string
  border: string
  textColor: string
  numberColor: string
  radius: number
  align: Align
}

export const onlineCounterConfig: ComponentConfig<OnlineCounterProps> = {
  label: 'Online Counter',
  fields: {
    enabled: {
      type: 'radio',
      label: 'Visibility',
      options: [
        { label: 'Visible', value: true },
        { label: 'Hidden', value: false },
      ],
    },
    prefix: { type: 'text', label: 'Prefix text' },
    number: { type: 'number', label: 'Manual Online Count' },
    suffix: { type: 'text', label: 'Suffix text' },
    mode: {
      type: 'select',
      label: 'Counter Mode',
      options: [
        { label: 'Manual Number', value: 'manual' },
        { label: 'Random Simulation Range', value: 'random' },
      ],
    },
    min: { type: 'number', label: 'Random Min (e.g. 1800)' },
    max: { type: 'number', label: 'Random Max (e.g. 3200)' },
    refreshInterval: { type: 'number', label: 'Refresh interval (seconds, e.g. 30)', min: 5, max: 300 },
    iconType: {
      type: 'select',
      label: 'Icon style',
      options: [
        { label: 'Green Pulse Dot', value: 'pulseDot' },
        { label: 'Fire Symbol (🔥)', value: 'fire' },
        { label: 'Users Symbol (👥)', value: 'users' },
      ],
    },
    background: colorField('Background Color'),
    border: { type: 'text', label: 'Border (e.g. 1px solid rgba(212, 175, 55, 0.35))' },
    textColor: colorField('Text Color'),
    numberColor: colorField('Number Color'),
    radius: { type: 'number', label: 'Border radius (px)', min: 0, max: 40 },
    align: { type: 'radio', label: 'Alignment', options: [...alignOptions] },
  },
  defaultProps: {
    enabled: true,
    prefix: 'ออนไลน์ตอนนี้:',
    number: 2547,
    suffix: 'คน',
    mode: 'random',
    min: 1800,
    max: 3200,
    refreshInterval: 30,
    iconType: 'pulseDot',
    background: 'rgba(20, 20, 20, 0.75)',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    textColor: '#f0f0f0',
    numberColor: '#f6e27a',
    radius: 20,
    align: 'center',
  },
  render: function OnlineCounterBlock({
    enabled = true,
    prefix,
    number,
    suffix,
    mode,
    min,
    max,
    refreshInterval,
    iconType,
    background,
    border,
    textColor,
    numberColor,
    radius,
    align,
  }) {
    const [randomCount, setRandomCount] = useState<number>(() => {
      const minVal = Math.min(min || 1800, max || 3200)
      const maxVal = Math.max(min || 1800, max || 3200)
      return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal
    })

    useEffect(() => {
      if (mode !== 'random') return

      const intervalSec = Math.max(refreshInterval || 30, 5)
      const timer = setInterval(() => {
        const minVal = Math.min(min || 1800, max || 3200)
        const maxVal = Math.max(min || 1800, max || 3200)
        const delta = Math.floor(Math.random() * 15) - 7
        setRandomCount((prev) => {
          const next = prev + delta
          if (next < minVal) return minVal + 10
          if (next > maxVal) return maxVal - 10
          return next
        })
      }, intervalSec * 1000)

      return () => clearInterval(timer)
    }, [mode, min, max, refreshInterval])

    if (!enabled) return <></>

    const displayCount = mode === 'random' ? randomCount : (number ?? 2547)

    const bg = safeBackground(background) ?? 'rgba(20, 20, 20, 0.75)'
    const borderStyle = safeCssValue(border) ?? '1px solid rgba(212, 175, 55, 0.35)'
    const color = safeColor(textColor) ?? '#f0f0f0'
    const numColor = safeColor(numberColor) ?? '#f6e27a'
    const alignStyle = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'

    return (
      <div style={{ display: 'flex', justifyContent: alignStyle, width: '100%', margin: '4px 0' }}>
        <div
          className="sp-online-counter"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: bg,
            border: borderStyle,
            borderRadius: radius ?? 20,
            padding: '6px 14px',
            fontSize: 13,
            color,
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          {iconType === 'pulseDot' && (
            // The animation is a class, not an inline `animation`, so the
            // `prefers-reduced-motion` rule in sellpage.css can switch it off.
            // An inline one cannot be overridden and would keep pulsing for a
            // visitor who has asked the whole system to stop moving.
            <span
              className="sp-online-dot"
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
          )}
          {iconType === 'fire' && <span aria-hidden="true">🔥</span>}
          {iconType === 'users' && <span aria-hidden="true">👥</span>}

          <span>{prefix || 'ออนไลน์ตอนนี้:'}</span>
          <strong style={{ color: numColor, fontWeight: 700 }}>
            {displayCount.toLocaleString()}
          </strong>
          <span>{suffix || 'คน'}</span>
        </div>
      </div>
    )
  },
}
