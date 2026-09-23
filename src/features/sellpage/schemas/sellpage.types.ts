import type { Data } from '@puckeditor/core'
import type { BlockProps } from '../blocks'

/**
 * THE SHARED PAGE CONTRACT.
 *
 * Every agent/area imports its page types from here. Do not declare a second
 * Page/Sellpage type anywhere else — a block, a panel or a service that
 * invents its own shape will silently drift from what is actually stored.
 *
 * Changing anything in this file is a schema change: see SCHEMA.md and
 * `schemaMigrations.ts` before editing.
 */

/** Puck's data, typed against the blocks actually registered in BlockRegistry. */
export type SellpageData = Data<BlockProps>

export type SellpageStatus = 'draft' | 'published' | 'unpublished'

/** Global look, applied around the rendered blocks. Owned by the theme editor. */
export type SellpageTheme = {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    muted: string
  }
  typography: {
    /** CSS font-family stack for headings. */
    headingFont: string
    /** CSS font-family stack for body copy. */
    bodyFont: string
    /** Multiplier applied to block font sizes; 1 = as authored. */
    scale: number
  }
  /** Page background, behind every block. */
  background: string
  /** Max content width in px; 0 = full bleed. */
  maxWidth: number
  /** Base spacing unit in px, for blocks that opt into theme spacing. */
  spacing: number
}

export type SellpageSeo = {
  title: string
  description: string
  /** Absolute or same-origin image URL; sanitized at render time. */
  ogImage: string
  /** Absolute canonical URL, or '' to let the public route decide. */
  canonicalUrl: string
  noIndex: boolean
}

export type SellpageSettings = {
  /** Language for <html lang>, e.g. 'th', 'lo', 'en'. */
  language: string
  /** Analytics/tracking ids. Empty string = not configured. */
  tracking: {
    facebookPixelId: string
    googleAnalyticsId: string
    tiktokPixelId: string
  }
  /** Extra <head> is deliberately NOT supported — see SCHEMA.md. */
  customHeadHtml?: never
}

/**
 * One stored sellpage.
 *
 * `draftConfig` and `publishedConfig` are separate by contract: editing only
 * ever writes `draftConfig`, publishing copies it to `publishedConfig`, and
 * the public route reads `publishedConfig` alone.
 *
 * Theme/SEO/settings are versioned with the page the same way: `*Draft` holds
 * what the editor is changing, the plain field holds what is live.
 */
export type SellpageDocument = {
  id: string
  name: string
  slug: string
  status: SellpageStatus
  schemaVersion: number

  /** Editor state. Never read by the public route. */
  draftConfig: SellpageData
  draftTheme: SellpageTheme
  draftSeo: SellpageSeo
  draftSettings: SellpageSettings

  /** Live state. Written only by publishPage(). Null until first publish. */
  publishedConfig: SellpageData | null
  publishedTheme: SellpageTheme | null
  publishedSeo: SellpageSeo | null
  publishedSettings: SellpageSettings | null

  createdAt: number
  updatedAt: number
  publishedAt: number | null
  createdBy: string | null
  updatedBy: string | null
}

/**
 * The only stored document a visitor is allowed to read.
 *
 * It is a separate record, not a filtered view: a database cannot redact
 * fields on read, so anything a visitor may fetch has to have been written
 * without the draft in it. Built by `toPublicDocument` in
 * `publicProjection.ts` — the one place that decides what becomes public.
 *
 * Keyed by slug rather than page id, so the public read is a single `get`
 * and the rule for it is `allow get: if true` with nothing else to reason
 * about.
 */
export type PublicSellpageDocument = {
  /** The admin document this was projected from. Not used to fetch anything. */
  pageId: string
  slug: string
  /** Falls back to the <title> when SEO has none; public already. */
  name: string
  schemaVersion: number
  config: SellpageData
  /**
   * Null when the page was published before these fields existed. The public
   * route substitutes defaults — it never falls back to the draft, which is
   * not here to fall back to.
   */
  theme: SellpageTheme | null
  seo: SellpageSeo | null
  settings: SellpageSettings | null
  publishedAt: number | null
}

/** What the public route needs to render one page. Nothing draft-derived. */
export type PublishedSellpage = {
  id: string
  slug: string
  name: string
  data: SellpageData
  theme: SellpageTheme
  seo: SellpageSeo
  settings: SellpageSettings
  publishedAt: number | null
}

/** One publish snapshot. Restoring writes it back to the DRAFT only. */
export type SellpageVersion = {
  id: string
  pageId: string
  /** Monotonic, starts at 1. */
  version: number
  timestamp: number
  user: string | null
  /** Schema version the snapshot was written with — needed to migrate on restore. */
  schemaVersion: number
  config: SellpageData
  theme: SellpageTheme
  seo: SellpageSeo
  settings: SellpageSettings
}

export const defaultTheme = (): SellpageTheme => ({
  colors: {
    primary: '#0f6b5c',
    secondary: '#123b33',
    accent: '#e8a317',
    background: '#faf9f5',
    surface: '#ffffff',
    text: '#14201d',
    muted: '#6b6a63',
  },
  typography: {
    headingFont: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif",
    bodyFont: "'Noto Sans Thai', 'Noto Sans Lao', system-ui, sans-serif",
    scale: 1,
  },
  background: '#faf9f5',
  maxWidth: 960,
  spacing: 16,
})

export const defaultSeo = (): SellpageSeo => ({
  title: '',
  description: '',
  ogImage: '',
  canonicalUrl: '',
  noIndex: false,
})

export const defaultSettings = (): SellpageSettings => ({
  language: 'th',
  tracking: { facebookPixelId: '', googleAnalyticsId: '', tiktokPixelId: '' },
})

export const createEmptyData = (): SellpageData => ({
  root: { props: { title: '' } },
  content: [],
  zones: {},
})
