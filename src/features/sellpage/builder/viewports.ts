import type { Viewports } from '@puckeditor/core'

/** Puck's own viewport switcher — no custom device-preview frame is built. */
export const sellpageViewports: Viewports = [
  { width: 390, height: 'auto', label: 'Mobile (390px)', icon: 'Smartphone' },
  { width: 360, height: 'auto', label: 'Compact (360px)', icon: 'Smartphone' },
  { width: 430, height: 'auto', label: 'Large (430px)', icon: 'Smartphone' },
  { width: 768, height: 'auto', label: 'Tablet (768px)', icon: 'Tablet' },
  { width: 1440, height: 'auto', label: 'Desktop (1440px)', icon: 'Monitor' },
]
