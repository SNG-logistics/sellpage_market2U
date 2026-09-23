import { expect, test, type Page } from '@playwright/test'
import type { SellpageDocument } from '../../src/features/sellpage/schemas/sellpage.types'

const readPage = (page: Page) =>
  page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('market2u:sellpages:v1') ?? '{}'))[0] as SellpageDocument)

// A file that ships in `public/`, so the image resolves on the same origin —
// the route a project without Cloud Storage uses.
const IMAGE = '/favicon.svg'

test('page background image: editor canvas, draft only, then public after Publish', async ({ page, context }) => {
  await page.goto('/admin/sellpages')
  await page.getByLabel('Page name', { exact: true }).fill('Background QA')
  await page.getByRole('button', { name: 'Create Page', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeVisible()

  // Publish once without an image, so there is a live page to compare against.
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect.poll(async () => (await readPage(page)).status).toBe('published')
  const { slug } = await readPage(page)

  await page.getByRole('button', { name: 'Theme', exact: true }).click()
  await page.getByLabel('Background image', { exact: true }).fill(IMAGE)
  await page.getByLabel(/^Image overlay/).fill('40')

  // The canvas shows the theme now — it used to render blocks with none.
  const canvasLayer = page.frameLocator('iframe').locator('.sp-page-bg')
  await expect(canvasLayer).toHaveAttribute('style', new RegExp(`url\\("${IMAGE}"\\)`))
  await expect(page.frameLocator('iframe').locator('.sp-page-bg__veil')).toHaveCSS('opacity', '0.4')

  // Autosave writes the draft theme only.
  await expect.poll(async () => (await readPage(page)).draftTheme.backgroundImage).toBe(IMAGE)
  expect((await readPage(page)).publishedTheme?.backgroundImage).toBeUndefined()

  const visitor = await context.newPage()
  await visitor.goto(`/s/${slug}`)
  await expect(visitor.getByRole('heading', { name: 'ติดต่อแอดมิน', exact: true })).toBeVisible()
  await expect(visitor.locator('.sp-page-bg')).toHaveCount(0)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect.poll(async () => (await readPage(page)).publishedTheme?.backgroundImage).toBe(IMAGE)

  await visitor.reload()
  await expect(visitor.locator('.sp-page-bg')).toHaveAttribute('style', new RegExp(`url\\("${IMAGE}"\\)`))
  // The layer sits behind the content: the page's buttons still take clicks.
  const link = visitor.getByRole('link', { name: /^WhatsApp/ })
  await expect(link).toBeVisible()
  await link.click({ trial: true })
})
