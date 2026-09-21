import type { ComponentConfig } from '@puckeditor/core'
import type { CSSProperties } from 'react'
import { alignOptions, type Align } from '../fields'
import { safeCssValue, safeImageUrl, safeUrl } from '../../utils/safeUrl'

export type ImageProps = {
  src: string
  alt: string
  caption: string
  linkUrl: string
  openTarget: '_self' | '_blank'
  width: number
  radius: number
  align: Align
  objectFit: 'cover' | 'contain'
  shadow: string
}

export const imageConfig: ComponentConfig<ImageProps> = {
  label: 'Image',
  fields: {
    src: { type: 'text', label: 'Image URL', placeholder: 'https://…' },
    alt: { type: 'text', label: 'Alt text' },
    caption: { type: 'text', label: 'Caption (optional)' },
    linkUrl: { type: 'text', label: 'Link URL (optional)' },
    openTarget: {
      type: 'radio',
      label: 'Open in',
      options: [
        { label: 'Same tab', value: '_self' },
        { label: 'New tab', value: '_blank' },
      ],
    },
    width: { type: 'number', label: 'Width %', min: 10, max: 100 },
    radius: { type: 'number', label: 'Radius (px)', min: 0, max: 64 },
    align: { type: 'radio', label: 'Align', options: [...alignOptions] },
    objectFit: {
      type: 'radio',
      label: 'Fit',
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Contain', value: 'contain' },
      ],
    },
    shadow: { type: 'text', label: 'Shadow (optional CSS shadow)' },
  },
  defaultProps: {
    src: '',
    alt: '',
    caption: '',
    linkUrl: '',
    openTarget: '_self',
    width: 100,
    radius: 8,
    align: 'center',
    objectFit: 'cover',
    shadow: '',
  },
  render: ({ src, alt, caption, linkUrl, openTarget, width, radius, align, objectFit, shadow }) => {
    const imgSrc = safeImageUrl(src)
    const href = safeUrl(linkUrl)
    const shadowVal = safeCssValue(shadow)

    // `width` is a share of the block. When the image is linked the <a> takes
    // that share and the image fills it — sizing both would apply it twice.
    const ownWidth = href ? '100%' : `${width}%`

    const wrapperStyle: CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
      width: '100%',
    }

    // No max-height: sellpages routinely use long infographic images, and a
    // cap would crop them under `objectFit: cover`.
    const imgStyle: CSSProperties = {
      width: ownWidth,
      borderRadius: radius,
      objectFit,
      display: 'block',
      boxShadow: shadowVal ?? 'none',
    }

    const imgElement = imgSrc ? (
      <img src={imgSrc} alt={alt} style={imgStyle} />
    ) : (
      <div
        role="img"
        aria-label={alt || 'Placeholder image'}
        style={{
          width: ownWidth,
          aspectRatio: '16 / 9',
          borderRadius: radius,
          background: 'var(--sp-surface, #e2e0da)',
          border: '1px solid #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sp-muted, #6b6a63)',
          fontSize: 14,
          boxShadow: shadowVal ?? 'none',
        }}
      >
        [IMAGE]
      </div>
    )

    const content = href ? (
      <a
        href={href}
        target={openTarget === '_blank' ? '_blank' : undefined}
        rel={openTarget === '_blank' ? 'noopener noreferrer' : undefined}
        style={{ display: 'inline-block', width: `${width}%` }}
      >
        {imgElement}
      </a>
    ) : (
      imgElement
    )

    return (
      <div style={wrapperStyle}>
        {content}
        {caption ? (
          <div style={{ fontSize: 13, color: 'var(--sp-muted, #6b6a63)', marginTop: 6, textAlign: align }}>
            {caption}
          </div>
        ) : null}
      </div>
    )
  },
}
