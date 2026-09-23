import { expect, test, type Page } from '@playwright/test'
import type { SellpageDocument } from '../../src/features/sellpage/schemas/sellpage.types'

const readPage = (page: Page) => page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('market2u:sellpages:v1') ?? '{}'))[0] as SellpageDocument)

async function createLuxury(page: Page) {
  await page.goto('/admin/sellpages')
  await page.getByLabel('Page name', { exact: true }).fill('MVP QA')
  await page.getByRole('button', { name: 'Create Page', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeVisible()
  return readPage(page)
}

test('MVP editor draft persists and only Publish changes the public page', async ({ page, context }) => {
  test.setTimeout(90_000)
  const created = await createLuxury(page)
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect.poll(async () => (await readPage(page)).status).toBe('published')
  const visitor = await context.newPage()
  await visitor.goto(`/s/${created.slug}`)
  await expect(visitor.getByRole('heading', { name: 'ติดต่อแอดมิน', exact: true })).toBeVisible()
  const canvas = page.frameLocator('iframe')
  await canvas.getByRole('heading', { name: 'ติดต่อแอดมิน', exact: true }).click()
  await page.getByRole('textbox', { name: 'Main Heading', exact: true }).fill('QA draft heading')
  await page.getByRole('textbox', { name: 'Main Heading', exact: true }).press('Tab')
  await expect.poll(async () => (await readPage(page)).draftConfig.content.find((b) => b.type === 'BrandHero')?.props, { timeout: 20_000 }).toMatchObject({ title: 'QA draft heading' })
  await canvas.locator('[data-puck-component="SocialLinksSection-1"]').click()
  console.log(await page.locator('body').ariaSnapshot())
})

test('MVP public layout at 360/390/430/768/1440 and public bundle boundary', async ({ page }, info) => {
  test.setTimeout(90_000)
  const created = await createLuxury(page)
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect.poll(async () => (await readPage(page)).status).toBe('published')
  const errors: string[] = []
  const scripts: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', (request) => { if (request.resourceType() === 'script') scripts.push(request.url()) })
  await page.goto(`/s/${created.slug}`)
  for (const width of [390, 360, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.getByRole('heading', { name: 'ติดต่อแอดมิน', exact: true })).toBeVisible()
    for (const name of ['WhatsApp', 'Facebook', 'Telegram', 'LINE Official']) {
      await expect(page.getByRole('link', { name: new RegExp(`^${name}`) })).toBeVisible()
    }
    await expect(page.getByText('10,000+', { exact: true })).toBeVisible()
    await page.screenshot({ path: info.outputPath(`mvp-${width}.png`), fullPage: true })
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
    expect.soft(dimensions.scroll, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.width)
    if (width === 1440) {
      const box = await page.locator('.sp-social-links-section').boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(480)
      expect(box?.width).toBeLessThanOrEqual(560)
      expect(Math.abs((box!.x + box!.width / 2) - width / 2)).toBeLessThan(2)
    }
  }
  expect(errors).toEqual([])
  expect(scripts.filter((url) => /AdminSellpage|SellpageBuilder|AdminGate|@puckeditor_core\.js/.test(url))).toEqual([])
})

test('list actions publish/unpublish with confirmation, duplicate, and delete', async ({ page }) => {
  const original = await createLuxury(page)
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page.getByRole('columnheader', { name: 'Published At' })).toBeVisible()
  const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: original.name, exact: true }) })
  await expect(row.getByRole('cell', { name: 'Never', exact: true })).toBeVisible()
  // Publish confirms too: from a list row it sits one misclick from Duplicate
  // and Delete, and it puts the current draft in front of the public.
  page.once('dialog', (dialog) => dialog.dismiss())
  await row.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(row.locator('.sp-status')).toHaveText('draft')
  page.once('dialog', (dialog) => dialog.accept())
  await row.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(row.locator('.sp-status')).toHaveText('published')
  page.once('dialog', (dialog) => dialog.dismiss())
  await row.getByRole('button', { name: 'Unpublish', exact: true }).click()
  await expect(row.locator('.sp-status')).toHaveText('published')
  page.once('dialog', (dialog) => dialog.accept())
  await row.getByRole('button', { name: 'Unpublish', exact: true }).click()
  await expect(row.locator('.sp-status')).toHaveText('unpublished')
  await row.getByRole('button', { name: 'Duplicate', exact: true }).click()
  const copyRow = page.getByRole('row').filter({ has: page.getByRole('cell', { name: `${original.name} (copy)`, exact: true }) })
  await expect(copyRow.locator('.sp-status')).toHaveText('draft')
  await expect(copyRow.getByRole('link', { name: 'Preview' })).not.toHaveAttribute('href', `/s/${original.slug}`)
  page.once('dialog', (dialog) => dialog.accept())
  await copyRow.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(copyRow).toHaveCount(0)
})
