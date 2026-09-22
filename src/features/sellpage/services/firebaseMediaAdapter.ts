import { deleteObject, getDownloadURL, getMetadata, listAll, ref, uploadBytesResumable } from 'firebase/storage'
import { getFirebaseStorage } from '../../../lib/firebase'
import { mediaFolder, type MediaItem, type MediaStorageAdapter } from './mediaService'

/**
 * Firebase Storage implementation of MediaStorageAdapter.
 *
 * Layout: `sellpages/{pageId}/{fileName}` — the only path storage.rules opens.
 *
 * Who may write, which types and how large are enforced by storage.rules, not
 * here: this runs in the browser and cannot be trusted on its own.
 */
const toItem = async (fileRef: ReturnType<typeof ref>): Promise<MediaItem> => {
  const [url, meta] = await Promise.all([getDownloadURL(fileRef), getMetadata(fileRef)])
  return {
    name: fileRef.name,
    path: fileRef.fullPath,
    url,
    size: meta.size,
    contentType: meta.contentType ?? '',
    updatedAt: Date.parse(meta.updated) || 0,
  }
}

export const firebaseMediaAdapter: MediaStorageAdapter = {
  async list(pageId) {
    const { items } = await listAll(ref(getFirebaseStorage(), mediaFolder(pageId)))
    return Promise.all(items.map(toItem))
  },

  upload(pageId, fileName, file, onProgress) {
    const fileRef = ref(getFirebaseStorage(), `${mediaFolder(pageId)}/${fileName}`)
    // The content type is set explicitly because storage.rules checks it, and
    // the long cache lifetime is safe because file names are never reused.
    const task = uploadBytesResumable(fileRef, file, { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' })
    return new Promise<MediaItem>((resolve, reject) => {
      task.on(
        'state_changed',
        (snapshot) => onProgress?.(snapshot.totalBytes > 0 ? snapshot.bytesTransferred / snapshot.totalBytes : 0),
        reject,
        () => toItem(fileRef).then(resolve, reject),
      )
    })
  },

  async remove(path) {
    await deleteObject(ref(getFirebaseStorage(), path))
  },
}
