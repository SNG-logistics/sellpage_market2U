import type { PublicSellpageDocument, SellpageDocument } from './sellpage.types'

/**
 * THE PUBLIC BOUNDARY.
 *
 * Everything a visitor can read passes through this file and nothing else.
 * Keep it short enough to audit in one sitting.
 *
 * Why a projection at all: Firestore returns whole documents. A rule can say
 * *which* document an anonymous user may read, never *which fields* — so a
 * published page used to hand over its draft, its author ids and every
 * unpublished edit along with it. The fix is to write a second document that
 * never contained those fields in the first place.
 *
 * Build it by naming each field. Never `...doc` with deletions afterwards: a
 * field added to SellpageDocument later would then start leaking on its own,
 * silently, on the day it was added. With an explicit list, a new field stays
 * private until someone decides otherwise here.
 */

/**
 * Every key of a public document, in one array.
 *
 * `firestore.rules` pins the stored shape to exactly this list, and
 * `rules.test.ts` compares the two so the rule and this file cannot drift
 * apart. Changing this array means changing the rule in the same commit.
 */
export const PUBLIC_DOCUMENT_KEYS = [
  'pageId',
  'slug',
  'name',
  'schemaVersion',
  'config',
  'theme',
  'seo',
  'settings',
  'publishedAt',
] as const satisfies readonly (keyof PublicSellpageDocument)[]

/**
 * The published half of a page, or null when the page has nothing live.
 *
 * Null means "no public document should exist" — callers delete rather than
 * write. A page reverts to that on unpublish, so taking a page offline
 * removes the record instead of leaving it readable with a status flag that
 * only the app checks.
 */
export const toPublicDocument = (doc: SellpageDocument): PublicSellpageDocument | null => {
  if (doc.status !== 'published' || doc.publishedConfig === null) return null

  // The published* fields are carried across as they are, nulls included: a
  // page published before theme/SEO/settings existed has none, and the public
  // route substitutes defaults. Substituting them here instead would write a
  // guess into storage and lose the fact that the page never had one.
  return {
    pageId: doc.id,
    slug: doc.slug,
    name: doc.name,
    schemaVersion: doc.schemaVersion,
    config: doc.publishedConfig,
    theme: doc.publishedTheme,
    seo: doc.publishedSeo,
    settings: doc.publishedSettings,
    publishedAt: doc.publishedAt,
  }
}

/** True when two projections would store the same bytes. */
export const samePublicDocument = (a: PublicSellpageDocument | null, b: PublicSellpageDocument | null): boolean =>
  JSON.stringify(a) === JSON.stringify(b)
