import type { SVGProps } from 'react'

const Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props} />
)

export const ArrowRight = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M5 12h14" />
    <path d="M13 5l7 7-7 7" />
  </Icon>
)

export const Cart = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
  </Icon>
)

export const Check = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M20 6L9 17l-5-5" />
  </Icon>
)

export const Phone = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
)

export const LineIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props} fill="currentColor" stroke="none" viewBox="0 0 24 24">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63h-2.425v1.125h2.425c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-3.056c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63h3.056c.349 0 .63.285.63.63 0 .349-.281.63-.63.63h-2.425v1.125h2.425zm-3.85-2.385c.349 0 .63.285.63.63v4.646c0 .344-.281.629-.63.629a.626.626 0 0 1-.63-.629V8.108c0-.345.281-.63.63-.63zm-2.473 0c.348 0 .63.285.63.63v2.668l2.16-2.923a.622.622 0 0 1 .499-.256c.349 0 .63.285.63.63v4.646c0 .344-.281.629-.63.629a.627.627 0 0 1-.63-.629V8.88l-2.16 2.923a.627.627 0 0 1-.5.256c-.348 0-.63-.285-.63-.63V8.108c0-.345.282-.63.63-.63zm-4.75 0c.349 0 .63.285.63.63v4.016h2.425c.349 0 .63.285.63.63 0 .344-.281.629-.63.629H8.292c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63zM12 2C6.477 2 2 5.673 2 10.207c0 4.07 3.56 7.502 8.375 8.084.326.07.77.216.882.496.101.252.066.648.032.903-.053.398-.244 1.554-.268 1.886-.041.574.266.564.558.372.292-.192 4.673-2.753 6.381-4.713C19.98 15.347 22 13.013 22 10.207 22 5.673 17.523 2 12 2z" />
  </Icon>
)

export const WhatsAppIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Icon>
)

export const TelegramIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Icon>
)

export const FacebookIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </Icon>
)

export const TikTokIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </Icon>
)

export const InstagramIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </Icon>
)

export const YouTubeIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </Icon>
)

export const WebsiteIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Icon>
)

export const MailIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </Icon>
)


