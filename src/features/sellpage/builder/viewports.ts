import type { Viewports } from '@puckeditor/core'

/** Puck's own viewport switcher — no custom device-preview frame is built. */
export const sellpageViewports: Viewports = [
  { width: 390, height: 'auto', label: 'Mobile', icon: 'Smartphone' },
  { width: 768, height: 'auto', label: 'Tablet', icon: 'Tablet' },
  { width: 1440, height: 'auto', label: 'Desktop', icon: 'Monitor' },
]
