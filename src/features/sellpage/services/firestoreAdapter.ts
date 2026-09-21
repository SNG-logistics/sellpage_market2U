import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { getDb } from '../../../lib/firebase'
import type { SellpageDocument, SellpageVersion } from '../schemas/sellpage.types'
import type { SellpageStorageAdapter } from './storageAdapter'

/**
 * Firestore implementation of SellpageStorageAdapter.
 *
 * Layout:
 *   sellpages/{pageId}
 *   sellpages/{pageId}/versions/{versionId}
 *
 * Versions are a subcollection so deleting a page can drop its history with
 * it, and so a page read never drags every snapshot along.
 *
 * Enforcement of who may write lives in firestore.rules, not here — this
 * adapter runs in the browser and cannot be trusted on its own.
 */
const PAGES = 'sellpages'
const VERSIONS = 'versions'

const pageRef = (id: string) => doc(getDb(), PAGES, id)
const versionsRef = (pageId: string) => collection(getDb(), PAGES, pageId, VERSIONS)

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

  async save(document) {
    // The whole document is written, so the doc id and the stored id stay in sync.
    await setDoc(pageRef(document.id), document)
  },

  async remove(id) {
    // Drop the version subcollection first; Firestore does not cascade.
    const versions = await getDocs(versionsRef(id))
    if (!versions.empty) {
      const batch = writeBatch(getDb())
      versions.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
    await deleteDoc(pageRef(id))
  },

  async listVersions(pageId) {
    const snap = await getDocs(query(versionsRef(pageId), orderBy('version', 'desc')))
    return snap.docs.map((d) => d.data() as SellpageVersion)
  },

  async saveVersion(version) {
    await setDoc(doc(versionsRef(version.pageId), version.id), version)
  },
}
