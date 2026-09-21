import type { CSSProperties } from 'react'

/** A preset is data only. There is exactly one Button component; presets never fork it. */
export type ButtonPresetTokens = {
  background: string
  textColor: string
  border: string
  radius: number
  shadow: string
  /** Extra declarations a preset needs beyond the shared tokens. */
  extra?: CSSProperties
}

const buttonPresetIds = [
  'solid',
  'outline',
  'soft',
  'glass',
  'gradient',
  'shadow',
  '3d',
  'neon',
  'minimal',
  'pill',
  'luxuryGold',
  'blackGold',
  'darkGlass',
  'whiteGlass',
  'vipGold',
] as const

export type ButtonPresetId = (typeof buttonPresetIds)[number]

export const buttonPresets: Record<ButtonPresetId, ButtonPresetTokens> = {
  solid: { background: '#0f6b5c', textColor: '#ffffff', border: 'none', radius: 10, shadow: 'none' },
  outline: { background: 'transparent', textColor: '#0f6b5c', border: '2px solid #0f6b5c', radius: 10, shadow: 'none' },
  soft: { background: '#dcefe9', textColor: '#0b4f44', border: 'none', radius: 12, shadow: 'none' },
  glass: {
    background: 'rgba(255,255,255,0.22)',
    textColor: '#14201d',
    border: '1px solid rgba(255,255,255,0.55)',
    radius: 14,
    shadow: '0 8px 24px rgba(0,0,0,0.12)',
    extra: { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' },
  },
  gradient: {
    background: 'linear-gradient(135deg,#0f6b5c,#1a9c7a)',
    textColor: '#ffffff',
    border: 'none',
    radius: 12,
    shadow: '0 6px 18px rgba(15,107,92,0.35)',
  },
  shadow: { background: '#ffffff', textColor: '#14201d', border: '1px solid #e2e0da', radius: 12, shadow: '0 10px 28px rgba(0,0,0,0.18)' },
  '3d': { background: '#e8a317', textColor: '#1b1a17', border: 'none', radius: 12, shadow: '0 6px 0 #a87508' },
  neon: {
    background: '#0b0f14',
    textColor: '#5dfcd0',
    border: '1px solid #5dfcd0',
    radius: 10,
    shadow: '0 0 14px rgba(93,252,208,0.65), inset 0 0 10px rgba(93,252,208,0.25)',
  },
  minimal: { background: 'transparent', textColor: '#14201d', border: 'none', radius: 0, shadow: 'none', extra: { textDecoration: 'underline', textUnderlineOffset: '4px' } },
  pill: { background: '#14201d', textColor: '#ffffff', border: 'none', radius: 999, shadow: 'none' },
  luxuryGold: {
    background: 'linear-gradient(135deg,#f6e27a,#cb9b2d 55%,#f6e27a)',
    textColor: '#3a2a05',
    border: '1px solid #b8891f',
    radius: 10,
    shadow: '0 6px 18px rgba(203,155,45,0.4)',
  },
  blackGold: { background: '#0e0d0b', textColor: '#e9c766', border: '1px solid #cb9b2d', radius: 10, shadow: '0 6px 18px rgba(0,0,0,0.45)' },
  darkGlass: {
    background: 'rgba(14,16,20,0.55)',
    textColor: '#ffffff',
    border: '1px solid rgba(255,255,255,0.18)',
    radius: 14,
    shadow: '0 8px 24px rgba(0,0,0,0.35)',
    extra: { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
  },
  whiteGlass: {
    background: 'rgba(255,255,255,0.65)',
    textColor: '#14201d',
    border: '1px solid rgba(255,255,255,0.85)',
    radius: 14,
    shadow: '0 8px 32px rgba(31,38,135,0.08)',
    extra: { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' },
  },
  vipGold: {
    background: 'linear-gradient(180deg,#2a2210,#0e0d0b)',
    textColor: '#f6e27a',
    border: '2px solid #e9c766',
    radius: 999,
    shadow: '0 0 0 3px rgba(233,199,102,0.2), 0 10px 26px rgba(0,0,0,0.5)',
  },
}

export const buttonPresetOptions: { label: string; value: ButtonPresetId }[] = [
  { label: 'Solid', value: 'solid' },
  { label: 'Outline', value: 'outline' },
  { label: 'Soft', value: 'soft' },
  { label: 'Glass', value: 'glass' },
  { label: 'Gradient', value: 'gradient' },
  { label: 'Shadow', value: 'shadow' },
  { label: '3D', value: '3d' },
  { label: 'Neon', value: 'neon' },
  { label: 'Minimal', value: 'minimal' },
  { label: 'Pill', value: 'pill' },
  { label: 'Luxury Gold', value: 'luxuryGold' },
  { label: 'Black Gold', value: 'blackGold' },
  { label: 'Dark Glass', value: 'darkGlass' },
  { label: 'White Glass', value: 'whiteGlass' },
  { label: 'VIP Gold', value: 'vipGold' },
]

export const isButtonPresetId = (value: unknown): value is ButtonPresetId =>
  typeof value === 'string' && (buttonPresetIds as readonly string[]).includes(value)
