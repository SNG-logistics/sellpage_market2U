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
}

export const puckConfig: Config<BlockProps> = {
  categories: {
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
  },
}
