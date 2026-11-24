import { test, expect } from '@playwright/test';

const table = page => page.getByRole('table', { name: 'Customers' });
const rows = page => table(page).locator('tbody tr');
const size = page => page.getByRole('combobox', { name: /page size|per page|customers per page|rows per page/i });
const current = page => page.locator('[aria-current="page"]');

test('size selector exposes every allowed size and resets to page 1', async ({ page }) => {
  await page.goto('/?page=2&pageSize=25');
  await expect(current(page)).toHaveText('2');

  for (const pageSize of [10, 25, 50, 100]) {
    await size(page).selectOption(String(pageSize));
    await expect(current(page)).toHaveText('1');
    await expect(rows(page)).toHaveCount(pageSize === 100 ? 100 : pageSize);
    await expect.poll(() => new URL(page.url()).searchParams.get('pageSize')).toBe(String(pageSize));
  }
});

test('numbered pagination has Page X of Y, ellipses, and accessible current page', async ({ page }) => {
  await page.goto('/?page=1&pageSize=25');
  await expect(page.getByText('Page 1 of 6')).toBeVisible();
  await expect(page.getByText(/Showing\s+1\s*[–—-]\s+25\s+of\s+134\s+customers/i)).toBeVisible();

  await size(page).selectOption('10');
  await expect(page.getByText('Page 1 of 14')).toBeVisible();
  await expect(current(page)).toHaveText('1');
  await expect(page.getByText('…', { exact: true }).or(page.getByText('...', { exact: true })).first()).toBeVisible();
  const previousControl = page.getByRole('button', { name: 'Previous' }).or(page.getByRole('link', { name: 'Previous' }));
  await expect.poll(async () => (await previousControl.isDisabled()) || (await previousControl.getAttribute('aria-disabled')) === 'true').toBe(true);
});
