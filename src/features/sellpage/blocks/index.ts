import type { Config } from '@puckeditor/core'
import { headingConfig, type HeadingProps } from './heading/Heading'
import { textConfig, type TextProps } from './text/Text'
import { buttonConfig, type ButtonProps } from './button/Button'
import { imageConfig, type ImageProps } from './image/Image'
import { dividerConfig, type DividerProps } from './divider/Divider'
import { spacerConfig, type SpacerProps } from './spacer/Spacer'
import { heroConfig, type HeroProps } from './hero/Hero'
import { socialButtonConfig, type SocialButtonProps } from './social-button/SocialButton'
import { containerConfig, type ContainerProps } from './container/Container'
import { statsConfig, type StatsProps } from './stats/Stats'
import { alertConfig, type AlertProps } from './alert/Alert'
import { trustBarConfig, type TrustBarProps } from './trust-bar/TrustBar'
import { onlineCounterConfig, type OnlineCounterProps } from './online-counter/OnlineCounter'
import { brandHeroConfig, type BrandHeroProps } from './brand-hero/BrandHero'
import { promoCardConfig, type PromoCardProps } from './promo-card/PromoCard'
import { socialLinksSectionConfig, type SocialLinksSectionProps } from './social-links/SocialLinksSection'
import { statsSectionConfig, type StatsSectionProps } from './stats-section/StatsSection'
import { securityNoticeConfig, type SecurityNoticeProps } from './security-notice/SecurityNotice'
import { mainCtaConfig, type MainCtaProps } from './main-cta/MainCTA'

/**
 * BlockRegistry: the single source of truth for every block's props and
 * config. Add a block here and it is available in both the editor and the
 * public renderer, because both consume this same `Config` object.
 */
export type BlockProps = {
  Heading: HeadingProps
  Text: TextProps
  Button: ButtonProps
  Image: ImageProps
  Divider: DividerProps
  Spacer: SpacerProps
  Hero: HeroProps
  SocialButton: SocialButtonProps
  Container: ContainerProps
  Stats: StatsProps
  Alert: AlertProps
  // Luxury Section-based blocks (MVP)
  TrustBar: TrustBarProps
  OnlineCounter: OnlineCounterProps
  BrandHero: BrandHeroProps
  PromoCard: PromoCardProps
  SocialLinksSection: SocialLinksSectionProps
  StatsSection: StatsSectionProps
  SecurityNotice: SecurityNoticeProps
  MainCTA: MainCtaProps
}

export const puckConfig: Config<BlockProps> = {
  categories: {
    luxury: {
      title: 'Luxury Sellpage',
      components: [
        'TrustBar',
        'OnlineCounter',
        'BrandHero',
        'PromoCard',
        'SocialLinksSection',
        'StatsSection',
        'SecurityNotice',
        'MainCTA',
      ],
    },
    typography: { title: 'Typography', components: ['Heading', 'Text'] },
    actions: { title: 'Actions', components: ['Button', 'SocialButton'] },
    media: { title: 'Media', components: ['Image'] },
    layout: { title: 'Layout', components: ['Container', 'Divider', 'Spacer'] },
    marketing: { title: 'Marketing', components: ['Hero', 'Stats', 'Alert'] },
  },
  components: {
    Heading: headingConfig,
    Text: textConfig,
    Button: buttonConfig,
    Image: imageConfig,
    Divider: dividerConfig,
    Spacer: spacerConfig,
    Hero: heroConfig,
    SocialButton: socialButtonConfig,
    Container: containerConfig,
    Stats: statsConfig,
    Alert: alertConfig,
    TrustBar: trustBarConfig,
    OnlineCounter: onlineCounterConfig,
    BrandHero: brandHeroConfig,
    PromoCard: promoCardConfig,
    SocialLinksSection: socialLinksSectionConfig,
    StatsSection: statsSectionConfig,
    SecurityNotice: securityNoticeConfig,
    MainCTA: mainCtaConfig,
  },
}
