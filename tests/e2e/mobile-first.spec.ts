import { expect, test } from '@playwright/test'

test('the editor opens at phone width, whatever the size of the window', async ({ page }) => {
  // Playwright's desktop window is 1280px wide. Left to itself, Puck picks
  // the viewport closest to that — Desktop 1440 — and a seller building a
  // page that is read on phones starts from the wrong view.
  await page.goto('/admin/sellpages')
  await page.getByLabel('Page name', { exact: true }).fill('Mobile first QA')
  await page.getByRole('button', { name: 'Create Page', exact: true }).click()
  await expect(page.frameLocator('iframe').getByRole('heading', { name: 'ติดต่อแอดมิน', exact: true })).toBeVisible()

  const width = await page.locator('iframe').first().evaluate((frame) => (frame as HTMLIFrameElement).contentWindow?.innerWidth)
  expect(width).toBe(390)
})
