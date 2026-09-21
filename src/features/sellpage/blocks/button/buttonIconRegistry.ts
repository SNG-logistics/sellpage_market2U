import { ArrowRight, Cart, Check, Phone } from './buttonIcons'

// Kept out of buttonIcons.tsx so that file exports components only
// (oxlint's react/only-export-components — needed for fast refresh).
export const buttonIconMap = { arrowRight: ArrowRight, cart: Cart, check: Check, phone: Phone }

export const buttonIconOptions = [
  { label: 'Arrow right', value: 'arrowRight' as const },
  { label: 'Cart', value: 'cart' as const },
  { label: 'Check', value: 'check' as const },
  { label: 'Phone', value: 'phone' as const },
]
