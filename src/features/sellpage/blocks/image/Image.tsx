import type { ComponentConfig } from '@puckeditor/core'
import { safeImageUrl, safeUrl } from '../../utils/safeUrl'

export type ImageProps = {
  src: string
  alt: string
  linkUrl: string
  width: number
  radius: number
  objectFit: 'cover' | 'contain'
}

export const imageConfig: ComponentConfig<ImageProps> = {
  label: 'Image',
  fields: {
    src: { type: 'text', label: 'Image URL', placeholder: 'https://…' },
    alt: { type: 'text', label: 'Alt text' },
    linkUrl: { type: 'text', label: 'Link URL (optional)' },
    width: { type: 'number', label: 'Width %', min: 10, max: 100 },
    radius: { type: 'number', label: 'Radius', min: 0, max: 64 },
    objectFit: {
      type: 'radio',
      label: 'Fit',
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Contain', value: 'contain' },
      ],
    },
  },
  defaultProps: { src: '', alt: '', linkUrl: '', width: 100, radius: 0, objectFit: 'cover' },
  render: ({ src, alt, linkUrl, width, radius, objectFit }) => {
    const imgSrc = safeImageUrl(src)
    const href = safeUrl(linkUrl)

    const img = imgSrc ? (
      <img
        src={imgSrc}
        alt={alt}
        style={{ width: `${width}%`, borderRadius: radius, objectFit, display: 'block' }}
      />
    ) : (
      <div
        role="img"
        aria-label={alt || 'Placeholder image'}
        style={{
          width: `${width}%`,
          aspectRatio: '16 / 9',
          borderRadius: radius,
          background: '#e2e0da',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b6a63',
          fontSize: 14,
        }}
      >
        [IMAGE]
      </div>
    )

    return href ? (
      <a href={href} style={{ display: 'inline-block' }}>
        {img}
      </a>
    ) : (
      img
    )
  },
}
