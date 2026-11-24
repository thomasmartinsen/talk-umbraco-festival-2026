import { test, expect } from '@playwright/test';

const table = page => page.getByRole('table', { name: 'Customers' });
const rows = page => table(page).locator('tbody tr');
const size = page => page.getByRole('combobox', { name: /page size|per page|customers per page|rows per page/i });
const next = page => page.getByRole('button', {name: /next/i}).or(page.getByRole('link', {name: /next/i}));
const previous = page => page.getByRole('button', {name: /previous/i}).or(page.getByRole('link', {name: /previous/i}));
const range = (page, start, end, total) => page.getByText(new RegExp(`Showing\\s+${start}\\s*[–—-]\\s*${end}\\s+of\\s+${total}\\s+customers`, 'i'));
const current = page => page.locator('[aria-current="page"]');
async function assertPage(page, number, count) {
  await expect(current(page)).toHaveCount(1);
  await expect(current(page)).toHaveText(String(number));
  await expect(rows(page)).toHaveCount(count);
}
async function assertURL(page, pageNumber, pageSize) {
  await expect.poll(() => {
    const q = new URL(page.url()).searchParams;
    return [q.get('page'), q.get('pageSize')];
  }).toEqual([String(pageNumber), String(pageSize)]);
}
async function assertInactive(control) {
  // Native disabled buttons or correctly disabled links are both permitted.
  await expect.poll(async () => (await control.isDisabled()) || (await control.getAttribute('aria-disabled')) === 'true').toBe(true);
}

test('real API: first, second and last page, range, URL and navigation', async ({page}) => {
  await page.goto('/');
  await assertPage(page,1,25);
  await expect(range(page,1,25,134)).toBeVisible();
  await assertInactive(previous(page));
  await next(page).click();
  await assertPage(page,2,25);
  await expect(range(page,26,50,134)).toBeVisible();
  await expect(rows(page).first().locator('td').first()).toHaveText('26');
  await assertURL(page,2,25);
  const shared = page.url();
  await page.reload();
  await assertPage(page,2,25);
  await page.goto(shared);
  await assertPage(page,2,25);
  await page.goto('/?page=6&pageSize=25');
  await assertPage(page,6,9);
  await expect(range(page,126,134,134)).toBeVisible();
  await assertInactive(next(page));
});

test('real API: user changes reset page; page navigation preserves criteria', async ({page}) => {
  await page.goto('/?page=2&pageSize=25');
  await assertPage(page,2,25);
  await size(page).selectOption('10');
  await assertPage(page,1,10);
  await assertURL(page,1,10);
  await expect(page.getByText('…', {exact:true}).or(page.getByText('...', {exact:true})).first()).toBeVisible();
  await page.getByRole('combobox', {name:'Status', exact:true}).selectOption('active');
  await assertPage(page,1,10);
  await next(page).click();
  await assertPage(page,2,10);
  expect(new URL(page.url()).searchParams.get('status')).toBe('active');
  await page.getByRole('combobox', {name:'Sort by'}).selectOption('name');
  await assertPage(page,1,10);
  await next(page).click();
  await assertPage(page,2,10);
  await page.getByRole('searchbox').fill('Maya');
  await expect(current(page)).toHaveText('1');
  await assertURL(page,1,10);
  expect(new URL(page.url()).searchParams.get('sort')).toBe('name');
  await page.goto('/?page=2&pageSize=10');
  await assertPage(page,2,10);
  await page.getByRole('combobox', {name:'Status', exact:true}).selectOption('active');
  await assertPage(page,1,10);
  await assertURL(page,1,10);
});

test('real API: Back/Forward, invalid values, clamp and empty state', async ({page}) => {
  await page.goto('/?page=1&pageSize=25');
  await assertPage(page,1,25);
  await next(page).click();
  await assertPage(page,2,25);
  await page.goBack();
  await assertPage(page,1,25);
  await page.goForward();
  await assertPage(page,2,25);
  await page.goto('/?page=invalid&pageSize=13');
  await assertPage(page,1,25);
  await assertURL(page,1,25);
  await page.goto('/?page=99&pageSize=25');
  await assertPage(page,6,9);
  await assertURL(page,6,25);
  await page.getByRole('searchbox').fill('no-such-customer');
  await expect(page.getByText('No customers match these criteria.')).toBeVisible();
  await expect(current(page)).toHaveCount(0);
  await expect(next(page)).toHaveCount(0);
  await expect(page.getByText(/Showing.*of.*customers/i)).toHaveCount(0);
});

test('keyboard navigation exposes current page and visible focus', async ({page}) => {
  await page.goto('/?page=1&pageSize=25');
  await assertPage(page,1,25);
  const control = next(page);
  // Enter is the native keyboard activation for both links and buttons.
  // Tab from the preceding focusable control, without assuming DOM order.
  await page.keyboard.press('Tab');
  for (let i=0;i<40 && !(await control.evaluate(el => el === document.activeElement));i++) await page.keyboard.press('Tab');
  await expect(control).toBeFocused();
  const hasFocusStyle = await control.evaluate(el => {
    const css = getComputedStyle(el);
    return el.matches(':focus-visible') && ((css.outlineStyle !== 'none' && parseFloat(css.outlineWidth) > 0) || css.boxShadow !== 'none' || css.borderStyle !== 'none');
  });
  expect(hasFocusStyle).toBe(true);
  await page.keyboard.press('Enter');
  await assertPage(page,2,25);
});

const customer = (id, name) => ({id,name,email:`${name}@example.test`,status:'active'});
const result = (id, name) => ({items:[customer(id,name)],page:1,pageSize:25,totalItems:1,totalPages:1});
const fulfill = (route, data) => route.fulfill({json:data});
function deferred() { let resolve; const promise = new Promise(r => {resolve=r;}); return {promise,resolve}; }

for (const staleFailure of [false,true]) {
  test(`controlled response: loading clears rows and stale ${staleFailure?'failure':'success'} cannot win`, async ({page}) => {
    const oldStarted = deferred(); const releaseOld = deferred(); const newStarted = deferred(); const releaseNew = deferred(); const oldFinished = deferred();
    let oldHeld = false, newHeld = false;
    await page.route('**/api/customers**', async route => {
      const q = new URL(route.request().url()).searchParams;
      const search = q.get('search');
      if (search === 'old' && !oldHeld) {
        oldHeld = true; oldStarted.resolve(); await releaseOld.promise;
        try { if (staleFailure) await route.fulfill({status:503,body:'old error'}); else await fulfill(route,result(1,'Old response')); } catch { /* aborted request is valid */ } finally { oldFinished.resolve(); }
      } else if (search === 'new' && !newHeld) {
        newHeld = true; newStarted.resolve(); await releaseNew.promise; await fulfill(route,result(2,'New response'));
      } else if (search === 'new') await fulfill(route,result(2,'New response'));
      else await fulfill(route,result(3,'Initial response'));
    });
    try {
      await page.goto('/?page=1&pageSize=25');
      await expect(page.getByText('Initial response',{exact:true})).toBeVisible();
      await page.getByRole('searchbox').fill('old');
      await oldStarted.promise;
      await expect(page.getByText('Loading customers…')).toBeVisible();
      await expect(rows(page)).toHaveCount(0);
      await page.getByRole('searchbox').fill('new');
      await newStarted.promise;
      releaseNew.resolve();
      await expect(page.getByText('New response',{exact:true})).toBeVisible();
      releaseOld.resolve();
      await oldFinished.promise;
      // Let browser response callbacks settle; aborted stale requests are valid too.
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      await expect(page.getByText('New response',{exact:true})).toBeVisible();
      await expect(page.getByText('Old response',{exact:true})).toHaveCount(0);
      await expect(page.getByRole('alert')).toHaveCount(0);
    } finally { releaseOld.resolve(); releaseNew.resolve(); }
  });
}

test('controlled response: Retry repeats current failed request', async ({page}) => {
  const urls=[];
  await page.route('**/api/customers**', async route => {
    urls.push(new URL(route.request().url()).searchParams.toString());
    if(urls.length===1) await route.fulfill({status:503,body:'temporary error'});
    else await fulfill(route,result(7,'Recovered customer'));
  });
  await page.goto('/?search=Maya&page=1&pageSize=25');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button',{name:/retry/i}).click();
  await expect(page.getByText('Recovered customer',{exact:true})).toBeVisible();
  expect(urls).toHaveLength(2);
  expect(urls[1]).toBe(urls[0]);
});
