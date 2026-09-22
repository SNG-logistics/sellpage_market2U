import { act, cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { SellpageRenderer } from '../renderer/SellpageRenderer'
import { puckConfig } from '../blocks'
import type { SellpageData } from '../schemas/sellpage.types'
import { createPage, duplicatePage, setSellpageStorageAdapter } from '../services/sellpageService'
import { localStorageAdapter } from '../services/storageAdapter'
import { createLuxuryContactTemplate } from '../templates/luxuryContactTemplate'

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear() })

it('C3 duplicate must generate fresh block identities', async () => {
  setSellpageStorageAdapter(localStorageAdapter)
  const template = createLuxuryContactTemplate()
  const original = await createPage('Original QA', null, template.data, template.theme)
  const copy = await duplicatePage(original.id, null)
  expect(copy.id).not.toBe(original.id)
  expect(copy.slug).not.toBe(original.slug)
  expect(copy.status).toBe('draft')
  expect(copy.publishedConfig).toBeNull()
  const originalIds = original.draftConfig.content.map((block) => block.props.id)
  expect(copy.draftConfig.content.every((block) => !originalIds.includes(block.props.id))).toBe(true)
})

const counterData = (overrides: Record<string, unknown>) => ({
  content: [{ type: 'OnlineCounter', props: { ...puckConfig.components.OnlineCounter.defaultProps, id: 'qa-counter', ...overrides } }],
  root: { props: {} },
}) as SellpageData

/**
 * These replace three tests that pinned down the counter's "random simulation"
 * mode — how fast it drifted, and that it stayed inside its invented range.
 * That mode is gone: it presented a number nobody measured as a live audience
 * figure. What is worth pinning down now is that it cannot come back by
 * accident.
 */
it('C8 the counter shows the number it was given, and never invents one', () => {
  vi.useFakeTimers()
  // Any call to Math.random while rendering this block would be a figure the
  // seller never entered.
  const random = vi.spyOn(Math, 'random')
  const view = render(<SellpageRenderer data={counterData({ number: 2547 })} />)

  expect(view.container.querySelector('strong')?.textContent).toBe('2,547')
  expect(random).not.toHaveBeenCalled()

  // No timer drifts it towards something more flattering, either.
  act(() => vi.advanceTimersByTime(120_000))
  expect(view.container.querySelector('strong')?.textContent).toBe('2,547')
  expect(random).not.toHaveBeenCalled()
})

it('C8 a page created from the template starts the counter at zero', () => {
  // A template ships to every new page, so any figure baked in here would be a
  // claim the seller never made.
  const counter = createLuxuryContactTemplate().data.content.find((block) => block.type === 'OnlineCounter')
  expect(counter).toBeDefined()
  expect(counter?.props.number).toBe(0)
})

it('C18 BrandHero overlay must reject image-set resource loading', () => {
  const data = { content: [{ type: 'BrandHero', props: {
    ...puckConfig.components.BrandHero.defaultProps, id: 'hero-qa',
    backgroundImage: 'https://example.com/hero.png', overlay: 'image-set("https://untrusted.example/track.png" 1x)',
  } }], root: { props: {} } } as SellpageData
  const { container } = render(<SellpageRenderer data={data} />)
  expect(container.innerHTML).not.toContain('untrusted.example')
})
