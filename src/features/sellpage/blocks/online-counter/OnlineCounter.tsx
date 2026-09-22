import type { ComponentConfig } from '@puckeditor/core'
import { alignOptions, colorField, type Align } from '../fields'
import { safeBackground, safeColor, safeCssValue } from '../../utils/safeUrl'

/**
 * A small badge showing a figure the seller enters — customers served, orders
 * shipped, years in business.
 *
 * This block used to offer a "random simulation" mode: it invented a number
 * between a min and a max and drifted it every few seconds, under the default
 * caption "ออนไลน์ตอนนี้" ("online right now"). A buyer reading that had no way
 * to know nothing was being measured. Inventing an audience figure to pressure
 * a purchase is deceptive advertising under Thai consumer-protection law, and
 * it costs more in trust than it wins in conversions. The mode is gone, and
 * the defaults no longer claim a live measurement.
 *
 * Whatever number the seller types is a claim they are making and must be able
 * to back up, exactly like the text in TrustBar. If a genuinely live figure is
 * wanted, it has to come from a real source (Analytics, the order database) —
 * not from this block.
 *
 * The registry key stays `OnlineCounter` on purpose: renaming a block key
 * orphans every saved page that uses it, and a key is not worth that.
 */
export type OnlineCounterProps = {
  enabled?: boolean
  prefix: string
  number: number
  suffix: string
  iconType: 'none' | 'pulseDot' | 'users' | 'fire'
  background: string
  border: string
  textColor: string
  numberColor: string
  radius: number
  align: Align
}

export const onlineCounterConfig: ComponentConfig<OnlineCounterProps> = {
  label: 'Counter Badge',
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
    number: { type: 'number', label: 'Number (a figure you can back up)', min: 0 },
    suffix: { type: 'text', label: 'Suffix text' },
    iconType: {
      type: 'select',
      // A pulsing dot is how the web signals "live". On a number typed by
      // hand it says something the number cannot, so it is not the default.
      label: 'Icon style',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Users Symbol (👥)', value: 'users' },
        { label: 'Fire Symbol (🔥)', value: 'fire' },
        { label: 'Green Pulse Dot (only for a genuinely live figure)', value: 'pulseDot' },
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
    prefix: 'ลูกค้าไว้วางใจแล้ว',
    number: 0,
    suffix: 'ราย',
    iconType: 'users',
    background: 'rgba(20, 20, 20, 0.75)',
    border: '1px solid rgba(212, 175, 55, 0.35)',
    textColor: '#f0f0f0',
    numberColor: '#f6e27a',
    radius: 20,
    align: 'center',
  },
  render: ({
    enabled = true,
    prefix,
    number,
    suffix,
    iconType,
    background,
    border,
    textColor,
    numberColor,
    radius,
    align,
  }) => {
    if (!enabled) return <></>

    const count = Number.isFinite(number) ? number : 0
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

          {prefix ? <span>{prefix}</span> : null}
          <strong style={{ color: numColor, fontWeight: 700 }}>{count.toLocaleString()}</strong>
          {suffix ? <span>{suffix}</span> : null}
        </div>
      </div>
    )
  },
}
