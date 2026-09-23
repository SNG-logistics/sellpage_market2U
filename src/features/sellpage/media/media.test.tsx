import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImageFieldInput } from './ImageFieldInput'
import { MediaContext, type MediaContextValue } from './mediaContext'
import { setMediaStorageAdapter, type MediaItem, type MediaStorageAdapter } from '../services/mediaService'
import type { SellpageData } from '../schemas/sellpage.types'

// See mediaService.test.ts: keeps `.env.local` from deciding the outcome.
vi.mock('../../../lib/firebaseConfig', () => ({ isFirebaseConfigured: () => false, isStorageConfigured: () => false }))

const item = (name: string): MediaItem => ({
  name,
  path: `sellpages/page-1/${name}`,
  url: `https://storage.example/${name}`,
  size: 2048,
  contentType: 'image/png',
  updatedAt: 1,
})

const configWith = (src: string) =>
  ({ root: { props: {} }, content: [{ type: 'Image', props: { id: 'Image-1', src } }] }) as unknown as SellpageData

const fakeAdapter = (initial: MediaItem[]): MediaStorageAdapter => {
  let items = [...initial]
  return {
    list: vi.fn(async () => items),
    upload: vi.fn(async (_pageId, fileName, _file, onProgress) => {
      onProgress?.(1)
      const uploaded = item(fileName)
      items = [uploaded, ...items]
      return uploaded
    }),
    remove: vi.fn(async (path) => {
      items = items.filter((other) => other.path !== path)
    }),
  }
}

function Harness({ media, initial = '' }: { media: MediaContextValue | null; initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <MediaContext.Provider value={media}>
      <ImageFieldInput id="img" label="Image" value={value} onChange={setValue} />
      <output data-testid="value">{value}</output>
    </MediaContext.Provider>
  )
}

const media = (overrides: Partial<MediaContextValue> = {}): MediaContextValue => ({
  pageId: 'page-1',
  draftConfig: configWith(''),
  publishedConfig: null,
  ...overrides,
})

afterEach(() => {
  cleanup()
  setMediaStorageAdapter(null)
})

describe('ImageFieldInput', () => {
  it('is a plain URL input outside the builder', () => {
    render(<Harness media={null} />)
    fireEvent.change(screen.getByLabelText('Image'), { target: { value: 'https://example.com/a.png' } })
    expect(screen.getByTestId('value').textContent).toBe('https://example.com/a.png')
    expect(screen.queryByText('Choose or upload…')).toBeNull()
  })

  it('explains itself instead of offering uploads when there is no storage', () => {
    render(<Harness media={media()} />)
    expect(screen.queryByText('Choose or upload…')).toBeNull()
    expect(screen.getByText(/Uploads need Firebase Storage/)).toBeTruthy()
  })

  it('previews a safe URL and never an unsafe one', () => {
    const safe = render(<Harness media={null} initial="https://example.com/a.png" />)
    expect(safe.container.querySelector('img')?.getAttribute('src')).toBe('https://example.com/a.png')
    safe.unmount()

    const unsafe = render(<Harness media={null} initial="javascript:alert(1)" />)
    expect(unsafe.container.querySelector('img')).toBeNull()
  })

  it('clears the value', () => {
    render(<Harness media={null} initial="https://example.com/a.png" />)
    fireEvent.click(screen.getByText('Clear'))
    expect(screen.getByTestId('value').textContent).toBe('')
  })
})

describe('media library', () => {
  const open = async () => {
    fireEvent.click(screen.getByText('Choose or upload…'))
    return screen.findByRole('dialog', { name: 'Media library' })
  }

  it('picks an image: the field gets its URL and the dialog closes', async () => {
    setMediaStorageAdapter(fakeAdapter([item('a.png'), item('b.png')]))
    render(<Harness media={media()} />)
    await open()
    fireEvent.click(await screen.findByLabelText('Use b.png'))
    expect(screen.getByTestId('value').textContent).toBe('https://storage.example/b.png')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('uploads a file and shows it', async () => {
    const adapter = fakeAdapter([])
    setMediaStorageAdapter(adapter)
    render(<Harness media={media()} />)
    await open()
    await screen.findByText(/No images yet/)

    fireEvent.change(screen.getByLabelText('Upload images'), {
      target: { files: [new File(['x'], 'Banner.png', { type: 'image/png' })] },
    })

    await waitFor(() => expect(adapter.upload).toHaveBeenCalledTimes(1))
    expect(await screen.findByLabelText(/^Use [a-z0-9]+-banner\.png$/)).toBeTruthy()
  })

  it('reports a rejected file by name and uploads the rest', async () => {
    const adapter = fakeAdapter([])
    setMediaStorageAdapter(adapter)
    render(<Harness media={media()} />)
    await open()

    fireEvent.change(screen.getByLabelText('Upload images'), {
      target: { files: [new File(['x'], 'notes.pdf', { type: 'application/pdf' }), new File(['x'], 'ok.png', { type: 'image/png' })] },
    })

    expect((await screen.findByRole('alert')).textContent).toMatch(/notes\.pdf: Only PNG/)
    expect(adapter.upload).toHaveBeenCalledTimes(1)
  })

  it('explains a rules rejection in terms an admin can act on', async () => {
    const adapter = fakeAdapter([])
    vi.mocked(adapter.upload).mockRejectedValueOnce(Object.assign(new Error('Firebase Storage: …'), { code: 'storage/unauthorized' }))
    setMediaStorageAdapter(adapter)
    render(<Harness media={media()} />)
    await open()

    fireEvent.change(screen.getByLabelText('Upload images'), {
      target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
    })

    expect((await screen.findByRole('alert')).textContent).toMatch(/admin claim/)
  })

  it('deletes only after a second, explicit confirmation', async () => {
    const adapter = fakeAdapter([item('a.png')])
    setMediaStorageAdapter(adapter)
    render(<Harness media={media()} />)
    await open()

    fireEvent.click(await screen.findByLabelText('Delete a.png'))
    expect(adapter.remove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Delete permanently'))

    await waitFor(() => expect(screen.queryByLabelText('Use a.png')).toBeNull())
    expect(adapter.remove).toHaveBeenCalledWith('sellpages/page-1/a.png')
  })

  it('will not delete an image the page still shows', async () => {
    setMediaStorageAdapter(fakeAdapter([item('a.png')]))
    render(<Harness media={media({ publishedConfig: configWith('https://storage.example/a.png') })} />)
    await open()

    const del = (await screen.findByLabelText('Delete a.png')) as HTMLButtonElement
    expect(del.disabled).toBe(true)
    expect(screen.getByText(/in published page/)).toBeTruthy()
  })

  it('filters by name, and says so when nothing matches', async () => {
    setMediaStorageAdapter(fakeAdapter([item('banner.png'), item('logo.png')]))
    render(<Harness media={media()} />)
    await open()
    await screen.findByLabelText('Use banner.png')

    const search = screen.getByRole('searchbox')
    fireEvent.change(search, { target: { value: 'logo' } })
    expect(screen.queryByLabelText('Use banner.png')).toBeNull()
    expect(screen.getByLabelText('Use logo.png')).toBeTruthy()

    // An empty grid would read as "the library is gone", not "no matches".
    fireEvent.change(search, { target: { value: 'nothing-matches-this' } })
    expect(screen.getByText(/No image matches/)).toBeTruthy()
  })

  it('offers no search box until there is something to search', async () => {
    setMediaStorageAdapter(fakeAdapter([]))
    render(<Harness media={media()} />)
    await open()
    await screen.findByText(/No images yet/)
    expect(screen.queryByRole('searchbox')).toBeNull()
  })

  it('closes on Escape', async () => {
    setMediaStorageAdapter(fakeAdapter([]))
    render(<Harness media={media()} />)
    await open()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
