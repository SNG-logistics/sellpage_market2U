import { useEffect } from 'react'
import type { PublishedSellpage } from '../schemas/sellpage.types'
import { safeImageUrl, safeUrl } from '../utils/safeUrl'

const setMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)
  if (!el) {
    const tag = selector.startsWith('link') ? 'link' : 'meta'
    el = document.createElement(tag) as HTMLMetaElement | HTMLLinkElement
    document.head.appendChild(el)
  }
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
  return el
}

const removeEl = (selector: string) => {
  document.head.querySelector(selector)?.remove()
}

/**
 * Applies a published page's SEO to the document head.
 *
 * Values come from stored page data, so URLs are sanitized before they reach
 * the DOM. Content is written with setAttribute (never innerHTML), and the
 * contract has no raw-HTML head field by design — see SCHEMA.md.
 */
export function usePageHead(page: PublishedSellpage | null) {
  useEffect(() => {
    if (!page) return

    const previousTitle = document.title
    const previousLang = document.documentElement.lang

    const title = page.seo.title.trim() || page.name
    document.title = title
    if (page.settings.language) document.documentElement.lang = page.settings.language

    setMeta('meta[name="description"]', { name: 'description', content: page.seo.description })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    setMeta('meta[property="og:description"]', { property: 'og:description', content: page.seo.description })

    const ogImage = safeImageUrl(page.seo.ogImage)
    if (ogImage) setMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage })
    else removeEl('meta[property="og:image"]')

    const canonical = safeUrl(page.seo.canonicalUrl)
    if (canonical) setMeta('link[rel="canonical"]', { rel: 'canonical', href: canonical })
    else removeEl('link[rel="canonical"]')

    if (page.seo.noIndex) setMeta('meta[name="robots"]', { name: 'robots', content: 'noindex,nofollow' })
    else removeEl('meta[name="robots"]')

    return () => {
      document.title = previousTitle
      document.documentElement.lang = previousLang
    }
  }, [page])
}
