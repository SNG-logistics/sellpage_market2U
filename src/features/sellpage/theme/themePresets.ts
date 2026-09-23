import type { SellpageTheme } from '../schemas/sellpage.types'

export type ThemePresetKey = 'blackGold' | 'darkLuxury' | 'redGold' | 'midnightGold'

export const themePresets: Record<ThemePresetKey, { label: string; theme: SellpageTheme }> = {
  blackGold: {
    label: 'Black Gold (VIP)',
    theme: {
      colors: {
        primary: '#d4af37',
        secondary: '#aa8010',
        accent: '#f6e27a',
        background: '#0d0d0d',
        surface: '#181818',
        text: '#f5f5f5',
        muted: '#a3a3a3',
      },
      typography: {
        headingFont: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif",
        bodyFont: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif",
        scale: 1,
      },
      background: 'radial-gradient(ellipse at top, #1e1910 0%, #0a0a0a 100%)',
      maxWidth: 480,
      spacing: 16,
    },
  },
  darkLuxury: {
    label: 'Dark Luxury',
    theme: {
      colors: {
        primary: '#e5c07b',
        secondary: '#987127',
        accent: '#ffd700',
        background: '#121212',
        surface: '#1c1c1c',
        text: '#ffffff',
        muted: '#9a9a9a',
      },
      typography: {
        headingFont: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif",
        bodyFont: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif",
        scale: 1,
      },
      background: 'linear-gradient(180deg, #181512 0%, #0d0d0d 100%)',
      maxWidth: 480,
      spacing: 16,
    },
  },
  redGold: {
    label: 'Red Gold (High Energy)',
    theme: {
      colors: {
        primary: '#f6c85f',
        secondary: '#8a1515',
        accent: '#ffd700',
        background: '#140404',
        surface: '#220808',
        text: '#ffffff',
        muted: '#c99b9b',
      },
      typography: {
        headingFont: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif",
        bodyFont: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif",
        scale: 1,
      },
      background: 'radial-gradient(circle at 50% 0%, #360a0a 0%, #100202 100%)',
      maxWidth: 480,
      spacing: 16,
    },
  },
  midnightGold: {
    label: 'Midnight Gold',
    theme: {
      colors: {
        primary: '#dfba51',
        secondary: '#1c283c',
        accent: '#f3e5ab',
        background: '#070b12',
        surface: '#0f1726',
        text: '#f0f4f8',
        muted: '#818e9f',
      },
      typography: {
        headingFont: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif",
        bodyFont: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif",
        scale: 1,
      },
      background: 'linear-gradient(180deg, #0e1728 0%, #05080e 100%)',
      maxWidth: 480,
      spacing: 16,
    },
  },
}
