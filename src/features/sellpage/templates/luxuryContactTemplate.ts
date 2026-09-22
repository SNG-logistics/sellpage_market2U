import type { SellpageData, SellpageTheme } from '../schemas/sellpage.types'
import { themePresets } from '../theme/themePresets'

export const LUXURY_CONTACT_TEMPLATE_NAME = 'Market2U Luxury Contact'

/**
 * Creates a complete section-based Sellpage layout modeled after the luxury
 * VIP reference design. Contains Top Trust Bar, Online Counter, Brand Hero,
 * VIP Promo Card, Social Links, Statistics, Security Notice, and Main CTA.
 *
 * All content uses placeholders ("YOUR BRAND", "ติดต่อแอดมิน") and is 100%
 * editable via the Admin Puck builder panels without hardcoding.
 */
export function createLuxuryContactTemplate(): {
  name: string
  data: SellpageData
  theme: SellpageTheme
} {
  const theme = themePresets.blackGold.theme

  const data: SellpageData = {
    root: { props: { title: 'Market2U Luxury Contact' } },
    content: [
      {
        type: 'TrustBar',
        props: {
          id: 'TrustBar-1',
          enabled: true,
          items: [
            { icon: '✓', text: 'มั่นใจ' },
            { icon: '★', text: 'เว็บมั่นคง' },
            { icon: '🛡️', text: 'ได้รับความไว้วางใจ' },
          ],
          textColor: '#f5e2a3',
          background: 'rgba(212, 175, 55, 0.12)',
          dividerColor: 'rgba(212, 175, 55, 0.3)',
          fontSize: 13,
          fontWeight: 600,
        },
      },
      {
        // Starts at zero on purpose. A template ships to every new page, so a
        // figure pre-filled here would be a claim the seller never made and
        // cannot back up — see the note in OnlineCounter.tsx.
        type: 'OnlineCounter',
        props: {
          id: 'OnlineCounter-1',
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
      },
      {
        type: 'BrandHero',
        props: {
          id: 'BrandHero-1',
          logo: '',
          logoWidth: 140,
          title: 'ติดต่อแอดมิน',
          subtitle: 'YOUR BRAND VIP SERVICE',
          description: 'สมัครสมาชิก ฝาก-ถอน แจ้งปัญหา\nและสอบถามได้ตลอด 24 ชั่วโมง',
          alignment: 'center',
          titleColor: '#f6e27a',
          subtitleColor: '#e5c07b',
          descriptionColor: '#d4d4d4',
          paddingTop: 24,
          paddingBottom: 20,
          background: 'transparent',
          backgroundImage: '',
          overlay: '',
        },
      },
      {
        type: 'PromoCard',
        props: {
          id: 'PromoCard-1',
          title: 'YOUR BRAND VIP',
          subtitle: 'บริการ VIP สิทธิพิเศษระดับพรีเมียม',
          description: 'ปลอดภัย มั่นคง ฝาก-ถอนได้ทันที พร้อมดูแลระดับส่วนตัว 24 ชั่วโมง',
          image: '',
          imagePosition: 'right',
          url: '#',
          openTarget: '_blank',
          preset: 'blackGold',
          customBackground: '',
          textColor: '',
          borderColor: '',
          radius: 14,
          showArrow: true,
          shadow: '',
        },
      },
      {
        type: 'SocialLinksSection',
        props: {
          id: 'SocialLinksSection-1',
          gap: 12,
          radius: 14,
          showArrow: true,
          hoverEffect: 'lift',
          links: [
            {
              platform: 'whatsapp',
              title: 'WhatsApp',
              subtitle: 'แชตกับแอดมินทันที บริการรวดเร็ว',
              url: 'https://whatsapp.com',
              enabled: true,
              customBackground: '',
              customIconBackground: '',
              customTextColor: '',
            },
            {
              platform: 'facebook',
              title: 'Facebook',
              subtitle: 'ติดต่อแฟนเพจหลัก มีเจ้าหน้าที่ดูแล',
              url: 'https://facebook.com',
              enabled: true,
              customBackground: '',
              customIconBackground: '',
              customTextColor: '',
            },
            {
              platform: 'telegram',
              title: 'Telegram',
              subtitle: 'เข้าร่วมกลุ่มข่าวสารและโปรโมชั่นพิเศษ',
              url: 'https://telegram.org',
              enabled: true,
              customBackground: '',
              customIconBackground: '',
              customTextColor: '',
            },
            {
              platform: 'line',
              title: 'LINE Official',
              subtitle: 'แอดไลน์เพื่อทำรายการและสอบถาม 24 ชม.',
              url: 'https://line.me',
              enabled: true,
              customBackground: '',
              customIconBackground: '',
              customTextColor: '',
            },
          ],
        },
      },
      {
        type: 'StatsSection',
        props: {
          id: 'StatsSection-1',
          items: [
            { value: '10,000+', label: 'สมาชิก', icon: '👥', valueColor: '', labelColor: '' },
            { value: '24/7', label: 'บริการ', icon: '⚡', valueColor: '', labelColor: '' },
            { value: '100%', label: 'ปลอดภัย', icon: '🛡️', valueColor: '', labelColor: '' },
          ],
          columns: 3,
          background: 'rgba(20, 20, 20, 0.75)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          showDivider: true,
          dividerColor: 'rgba(212, 175, 55, 0.25)',
          radius: 16,
          padding: 16,
          valueColor: '#f6e27a',
          labelColor: '#d4d4d4',
        },
      },
      {
        type: 'SecurityNotice',
        props: {
          id: 'SecurityNotice-1',
          preset: 'securityGold',
          icon: '🛡️',
          heading: 'ระบบความปลอดภัยและแจ้งเตือนมิจฉาชีพ',
          description: 'โปรดระวังผู้ไม่หวังดีแอบอ้าง ทางเราไม่มีนโยบายทักข้อความหาลูกค้าก่อนทุกกรณี',
          warningText: '⚠️ ติดต่อผ่านช่องทางทางการที่ระบุบนหน้านี้เท่านั้น เพื่อความปลอดภัยสูงสุด',
          customBackground: '',
          customBorder: '',
          titleColor: '',
          textColor: '',
          radius: 12,
        },
      },
      {
        type: 'MainCTA',
        props: {
          id: 'MainCTA-1',
          text: 'เข้าสู่เว็บไซต์หลัก',
          subtitle: 'คลิกเพื่อเข้าสู่ระบบและเริ่มใช้งานได้ทันที',
          url: 'https://example.com',
          openTarget: '_blank',
          icon: 'arrowRight',
          preset: 'gold',
          fullWidth: true,
          customBackground: '',
          customTextColor: '',
          radius: 14,
          customShadow: '',
          animation: 'pulse',
        },
      },
    ],
    zones: {},
  }

  return {
    name: LUXURY_CONTACT_TEMPLATE_NAME,
    data,
    theme,
  }
}
