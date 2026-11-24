import assert from 'node:assert/strict';
import test from 'node:test';

async function getCustomers(query = '') {
  const response = await fetch(`http://127.0.0.1:5173/api/customers${query}`, {
    signal: AbortSignal.timeout(5000),
  });
  return response;
}

async function getEnvelope(query = '') {
  const response = await getCustomers(query);
  assert.equal(response.status, 200);
  return response.json();
}

test('the default response is the first 25-customer page of the 134-customer collection', async () => {
  const result = await getEnvelope();
  assert.deepEqual(Object.keys(result).sort(), ['items', 'page', 'pageSize', 'totalItems', 'totalPages']);
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 25);
  assert.equal(result.totalItems, 134);
  assert.equal(result.totalPages, 6);
  assert.deepEqual(result.items.map(({ id }) => id), Array.from({ length: 25 }, (_, i) => i + 1));
});

test('search, status, and name sort can be combined', async () => {
  const result = await getEnvelope('?search=MAYA&status=inactive&sort=name');
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 25);
  assert.deepEqual(result.items.map(({ name, status }) => [name, status]), [
    ['Maya Okafor', 'inactive'],
    ['Maya Patel', 'inactive'],
  ]);
});

test('a search with no matches returns an empty list', async () => {
  const result = await getEnvelope('?search=no-such-customer');
  assert.deepEqual(result.items, []);
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 25);
  assert.equal(result.totalItems, 0);
  assert.equal(result.totalPages, 0);
});

test('page size allows only 10, 25, 50, and 100', async () => {
  for (const pageSize of [10, 25, 50, 100]) {
    const result = await getEnvelope(`?page=1&pageSize=${pageSize}`);
    assert.equal(result.pageSize, pageSize);
    assert.equal(result.items.length, Math.min(pageSize, 134));
  }
});

test('invalid page and page size normalize to page 1 and 25', async () => {
  for (const query of [
    '?page=invalid&pageSize=25',
    '?page=0&pageSize=25',
    '?page=-4&pageSize=25',
    '?page=1&pageSize=13',
    '?page=invalid&pageSize=bogus',
  ]) {
    const result = await getEnvelope(query);
    assert.equal(result.page, 1);
    assert.equal(result.pageSize, 25);
  }
});

test('a page above the last available page is clamped', async () => {
  const result = await getEnvelope('?page=99&pageSize=25');
  assert.equal(result.page, 6);
  assert.equal(result.pageSize, 25);
  assert.equal(result.totalItems, 134);
  assert.equal(result.totalPages, 6);
  assert.equal(result.items.length, 9);
  assert.deepEqual(result.items.map(({ id }) => id), Array.from({ length: 9 }, (_, i) => i + 126));
});

test('search, status, and sort are applied before paging', async () => {
  const matching = await getEnvelope('?search=a&status=active&sort=name&page=1&pageSize=100');
  assert.equal(matching.totalItems, matching.items.length);

  const pageTwo = await getEnvelope('?search=a&status=active&sort=name&page=2&pageSize=10');
  assert.equal(pageTwo.page, 2);
  assert.equal(pageTwo.pageSize, 10);
  assert.equal(pageTwo.totalItems, matching.totalItems);
  assert.deepEqual(pageTwo.items, matching.items.slice(10, 20));
});

test('invalid status and sort values keep HTTP 400 behavior', async () => {
  for (const query of ['?status=unknown', '?sort=unknown']) {
    const response = await getCustomers(query);
    assert.equal(response.status, 400);
  }
});
