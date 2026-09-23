import { expect, test, type Page } from '@playwright/test'
import type { SellpageDocument } from '../../src/features/sellpage/schemas/sellpage.types'

const STORAGE_KEY = 'market2u:sellpages:v1'

type StoredPage = SellpageDocument

const readPages = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, StoredPage>, STORAGE_KEY)

const replaceDraft = (page: Page, id: string, type: 'Heading' | 'Text', copy: string) =>
  page.evaluate(
    ({ key, id, type, copy }) => {
      const pages = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, StoredPage>
      const stored = pages[id]
      stored.draftConfig = {
        root: { props: { title: '' } },
        content: [
          type === 'Heading'
            ? { type, props: { id: 'heading-1', text: copy, level: 'h2', align: 'left', color: '', fontSize: 32 } }
            : { type, props: { id: 'text-1', content: copy, align: 'left', color: '', fontSize: 16 } },
        ],
        zones: {},
      }
      localStorage.setItem(key, JSON.stringify(pages))
    },
    { key: STORAGE_KEY, id, type, copy },
  )

test('localStorage create, publish, public isolation, and unpublished fallback', async ({ page }) => {
  await page.goto('/admin/sellpages')
  await expect(page.getByRole('status')).toContainText('Local mode')
  await page.getByLabel('Page template').selectOption('blank')

  await page.getByPlaceholder('New page name').fill('Smoke Published')
  await page.getByRole('button', { name: 'Create Page', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/sellpages\/[^/]+$/)

  const created = Object.values(await readPages(page)).find((item) => item.slug === 'smoke-published')
  expect(created).toBeTruthy()
  await replaceDraft(page, created!.id, 'Heading', 'Published copy')
  await page.reload()
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeEnabled()

  await page.goto(`/s/${created!.slug}`)
  await expect(page.getByRole('heading', { name: 'Published copy' })).toBeVisible()

  await replaceDraft(page, created!.id, 'Text', 'Draft must stay private')
  await page.goto(`/s/${created!.slug}`)
  await expect(page.getByRole('heading', { name: 'Published copy' })).toBeVisible()
  await expect(page.getByText('Draft must stay private')).toHaveCount(0)

  await page.goto('/admin/sellpages')
  await page.getByLabel('Page template').selectOption('blank')
  await page.getByPlaceholder('New page name').fill('Never Published')
  await page.getByRole('button', { name: 'Create Page', exact: true }).click()
  const neverPublished = Object.values(await readPages(page)).find((item) => item.slug === 'never-published')
  expect(neverPublished).toBeTruthy()

  await page.goto(`/s/${neverPublished!.slug}`)
  await expect(page.getByRole('heading', { name: 'Page unavailable' })).toBeVisible()
  await expect(page.getByText('This page has not been published yet.')).toBeVisible()
})
