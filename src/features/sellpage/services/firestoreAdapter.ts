import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { getDb } from '../../../lib/firebase'
import { samePublicDocument, toPublicDocument } from '../schemas/publicProjection'
import type { PublicSellpageDocument, SellpageDocument, SellpageVersion } from '../schemas/sellpage.types'
import type { SellpageStorageAdapter } from './storageAdapter'

/**
 * Firestore implementation of SellpageStorageAdapter.
 *
 * Layout:
 *   sellpages/{pageId}              admin only, holds the draft
 *   sellpages/{pageId}/versions/{versionId}
 *   publicPages/{slug}              world-readable, published half only
 *
 * Versions are a subcollection so deleting a page can drop its history with
 * it, and so a page read never drags every snapshot along.
 *
 * `publicPages` is keyed by slug so the visitor's read is a `get` of a known
 * document id rather than a query. That is not a convenience: a query has to
 * be provably safe from its constraints alone, which forced the old public
 * rule to reason about which fields the query pinned. A `get` on a collection
 * whose every document is publishable needs no such reasoning.
 *
 * Enforcement of who may write lives in firestore.rules, not here — this
 * adapter runs in the browser and cannot be trusted on its own.
 */
const PAGES = 'sellpages'
const VERSIONS = 'versions'
const PUBLIC_PAGES = 'publicPages'

const pageRef = (id: string) => doc(getDb(), PAGES, id)
const versionsRef = (pageId: string) => collection(getDb(), PAGES, pageId, VERSIONS)
const publicRef = (slug: string) => doc(getDb(), PUBLIC_PAGES, slug)

export const firestoreAdapter: SellpageStorageAdapter = {
  async list() {
    const snap = await getDocs(query(collection(getDb(), PAGES), orderBy('updatedAt', 'desc')))
    return snap.docs.map((d) => d.data() as SellpageDocument)
  },

  async get(id) {
    const snap = await getDoc(pageRef(id))
    return snap.exists() ? (snap.data() as SellpageDocument) : null
  },

  async getBySlug(slug) {
    const snap = await getDocs(query(collection(getDb(), PAGES), where('slug', '==', slug), limit(1)))
    return snap.empty ? null : (snap.docs[0].data() as SellpageDocument)
  },

  async getPublicBySlug(slug) {
    const snap = await getDoc(publicRef(slug))
    return snap.exists() ? (snap.data() as PublicSellpageDocument) : null
  },

  async save(document) {
    // A transaction, not two writes: the page and what the public sees have to
    // move together, or a failure between them leaves the site showing
    // something nobody published. Firestore requires every read before every
    // write, hence the single get at the top.
    //
    // The cost is that a save now needs the server — a plain `setDoc` would
    // queue offline and sync later. The admin is online-only anyway (auth,
    // rules, media uploads), and a draft that saved offline while the public
    // copy did not would be the exact split this exists to prevent.
    await runTransaction(getDb(), async (tx) => {
      const existing = await tx.get(pageRef(document.id))
      const previous = existing.exists() ? (existing.data() as SellpageDocument) : null

      // The whole document is written, so the doc id and the stored id stay in sync.
      tx.set(pageRef(document.id), document)

      // A renamed slug leaves a document behind at the old one, still
      // readable, still serving the page it used to serve.
      if (previous && previous.slug !== document.slug) tx.delete(publicRef(previous.slug))

      const projection = toPublicDocument(document)
      const unchanged = previous !== null && previous.slug === document.slug && samePublicDocument(toPublicDocument(previous), projection)
      // Every draft autosave on a published page reaches this method. Writing
      // an identical projection each time would double the cost of typing.
      if (unchanged) return

      if (projection) tx.set(publicRef(document.slug), projection)
      else tx.delete(publicRef(document.slug))
    })
  },

  async remove(id) {
    // Firestore does not cascade: the subcollection and the projection are
    // separate documents and have to be named.
    const [page, versions] = await Promise.all([getDoc(pageRef(id)), getDocs(versionsRef(id))])

    const batch = writeBatch(getDb())
    versions.docs.forEach((d) => batch.delete(d.ref))
    if (page.exists()) batch.delete(publicRef((page.data() as SellpageDocument).slug))
    batch.delete(pageRef(id))
    await batch.commit()
  },

  async listVersions(pageId) {
    const snap = await getDocs(query(versionsRef(pageId), orderBy('version', 'desc')))
    return snap.docs.map((d) => d.data() as SellpageVersion)
  },

  async saveVersion(version) {
    await setDoc(doc(versionsRef(version.pageId), version.id), version)
  },
}
