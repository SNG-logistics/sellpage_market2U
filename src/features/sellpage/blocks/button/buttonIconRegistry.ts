import { ArrowRight, Cart, Check, FacebookIcon, InstagramIcon, LineIcon, MailIcon, Phone, TelegramIcon, TikTokIcon, WebsiteIcon, WhatsAppIcon, YouTubeIcon } from './buttonIcons'

// Kept out of buttonIcons.tsx so that file exports components only
// (oxlint's react/only-export-components — needed for fast refresh).
export const buttonIconMap = {
  arrowRight: ArrowRight,
  cart: Cart,
  check: Check,
  phone: Phone,
  line: LineIcon,
  whatsapp: WhatsAppIcon,
  telegram: TelegramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  website: WebsiteIcon,
  email: MailIcon,
}

export const buttonIconOptions = [
  { label: 'Arrow right', value: 'arrowRight' as const },
  { label: 'Cart', value: 'cart' as const },
  { label: 'Check', value: 'check' as const },
  { label: 'Phone', value: 'phone' as const },
  { label: 'LINE', value: 'line' as const },
  { label: 'WhatsApp', value: 'whatsapp' as const },
  { label: 'Telegram', value: 'telegram' as const },
  { label: 'Facebook', value: 'facebook' as const },
  { label: 'TikTok', value: 'tiktok' as const },
  { label: 'Instagram', value: 'instagram' as const },
  { label: 'YouTube', value: 'youtube' as const },
  { label: 'Website', value: 'website' as const },
  { label: 'Email', value: 'email' as const },
]

