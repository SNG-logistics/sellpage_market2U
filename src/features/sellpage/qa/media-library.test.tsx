import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import MediaLibraryDialog from '../media/MediaLibraryDialog'
import { setMediaStorageAdapter, type MediaItem, type MediaStorageAdapter } from '../services/mediaService'
import type { SellpageData } from '../schemas/sellpage.types'

// A page with no blocks: enough for findMediaUsage, which only reads the config.
const emptyConfig = { content: [], root: { props: {} } } as unknown as SellpageData

afterEach(() => { cleanup(); setMediaStorageAdapter(null) })

// Walks the whole dialog in one test: browse, search, select, upload, delete.
// The timeout it needs comes from `testTimeout` in vite.config.ts.
it('C13 browse, search, select/replace, upload and delete through the media service', async () => {
  const make = (name: string): MediaItem => ({ name, path: `sellpages/qa/${name}`, url: `https://example.com/${name}`, size: 4, contentType: 'image/png', updatedAt: 1 })
  const items = [make('logo.png'), make('promo.webp')]
  const adapter: MediaStorageAdapter = {
    list: vi.fn(async () => items),
    upload: vi.fn(async (_pageId, fileName) => make(fileName)),
    remove: vi.fn(async () => {}),
  }
  setMediaStorageAdapter(adapter)
  const onSelect = vi.fn()
  const view = render(<MediaLibraryDialog media={{ pageId: 'qa', draftConfig: emptyConfig, publishedConfig: null }} selectedUrl={items[0].url} onSelect={onSelect} onClose={vi.fn()} />)
  await view.findByRole('button', { name: 'Use logo.png' })
  expect(view.container.ownerDocument.querySelector('img')?.getAttribute('loading')).toBe('lazy')
  fireEvent.change(view.getByRole('searchbox'), { target: { value: 'PROMO' } })
  expect(view.queryByRole('button', { name: 'Use logo.png' })).toBeNull()
  fireEvent.click(view.getByRole('button', { name: 'Use promo.webp' }))
  expect(onSelect).toHaveBeenCalledWith(items[1].url)
  fireEvent.change(view.getByRole('searchbox'), { target: { value: 'missing' } })
  expect(view.getByText(/No image matches/)).toBeTruthy()
  fireEvent.change(view.getByRole('searchbox'), { target: { value: '' } })
  fireEvent.change(view.getByLabelText('Upload images', { selector: 'input' }), { target: { files: [new File(['png'], 'upload.png', { type: 'image/png' })] } })
  await waitFor(() => expect(adapter.upload).toHaveBeenCalledOnce())
  fireEvent.click(view.getByRole('button', { name: 'Delete promo.webp' }))
  fireEvent.click(view.getByRole('button', { name: 'Delete permanently' }))
  await waitFor(() => expect(adapter.remove).toHaveBeenCalledWith(items[1].path))
  await waitFor(() => expect(view.queryByRole('button', { name: 'Use promo.webp' })).toBeNull())
})

it('C13 permission denied shows a recoverable error rather than infinite loading', async () => {
  setMediaStorageAdapter({ list: async () => { throw { code: 'storage/unauthorized' } }, upload: vi.fn(), remove: vi.fn() })
  const view = render(<MediaLibraryDialog media={{ pageId: 'qa', draftConfig: emptyConfig, publishedConfig: null }} selectedUrl="" onSelect={vi.fn()} onClose={vi.fn()} />)
  expect((await view.findByRole('alert')).textContent).toContain('admin claim')
  expect(view.queryByText('Loading…')).toBeNull()
})
