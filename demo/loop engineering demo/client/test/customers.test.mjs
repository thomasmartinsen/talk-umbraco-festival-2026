import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLatestRequestLoader,
  customerPageLinks,
  normalizeCustomerQuery,
  updateCustomerQuery,
} from '../src/customerList.ts';

const apiUrl = process.env.CUSTOMER_API_URL ?? 'http://127.0.0.1:5173/api';

async function getCustomers(query = '') {
  const response = await fetch(`${apiUrl}/customers${query}`, {
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.status, 200);
  return response.json();
}

test('pagination returns the requested server-side slices', async () => {
  const page2 = await getCustomers('?page=2&pageSize=25');
  assert.deepEqual(page2.items.map(({ id }) => id), Array.from({ length: 25 }, (_, i) => i + 26));
  assert.deepEqual(
    { page: page2.page, pageSize: page2.pageSize, totalItems: page2.totalItems, totalPages: page2.totalPages },
    { page: 2, pageSize: 25, totalItems: 134, totalPages: 6 },
  );

  const page6 = await getCustomers('?page=6&pageSize=25');
  assert.deepEqual(page6.items.map(({ id }) => id), Array.from({ length: 9 }, (_, i) => i + 126));

  const clamped = await getCustomers('?page=99&pageSize=25');
  assert.equal(clamped.page, 6);
  assert.deepEqual(clamped.items.map(({ id }) => id), page6.items.map(({ id }) => id));
});

test('all allowed page sizes are honored', async () => {
  for (const pageSize of [10, 25, 50, 100]) {
    const result = await getCustomers(`?page=1&pageSize=${pageSize}`);
    assert.equal(result.pageSize, pageSize);
    assert.equal(result.items.length, Math.min(pageSize, 134));
    assert.equal(result.totalPages, Math.ceil(134 / pageSize));
  }
});

test('defaults and malformed pagination values are normalized', async () => {
  const cases = [
    ['', 1, 25],
    ['?page=0&pageSize=20', 1, 25],
    ['?page=-3&pageSize=bad', 1, 25],
    ['?page=1.5&pageSize=', 1, 25],
    ['?page=not-a-page&pageSize=50', 1, 50],
  ];

  for (const [query, expectedPage, expectedPageSize] of cases) {
    const result = await getCustomers(query);
    assert.equal(result.page, expectedPage);
    assert.equal(result.pageSize, expectedPageSize);
  }
});

test('filters are applied before pagination and preserve deterministic sorting', async () => {
  const result = await getCustomers('?search=MAYA&status=inactive&sort=name&page=1&pageSize=10');
  assert.deepEqual(result.items.map(({ name, status }) => [name, status]), [
    ['Maya Okafor', 'inactive'],
    ['Maya Patel', 'inactive'],
  ]);
  assert.equal(result.totalItems, 2);
  assert.equal(result.totalPages, 1);

  const ids = (await getCustomers('?sort=id&page=2&pageSize=100')).items.map(({ id }) => id);
  assert.deepEqual(ids, Array.from({ length: 34 }, (_, i) => i + 101));
});

test('no matches returns pagination metadata for an empty result', async () => {
  assert.deepEqual(await getCustomers('?search=no-such-customer&page=99&pageSize=50'), {
    items: [],
    page: 1,
    pageSize: 50,
    totalItems: 0,
    totalPages: 0,
  });
});

test('URL pagination defaults, restoration, and resetting are deterministic', () => {
  assert.deepEqual(normalizeCustomerQuery(''), {
    query: '?page=1&pageSize=25',
    page: 1,
    pageSize: 25,
    changed: true,
  });

  const restored = normalizeCustomerQuery('?status=active&sort=name&page=3&pageSize=50');
  assert.equal(restored.query, '?status=active&sort=name&page=3&pageSize=50');
  assert.equal(restored.page, 3);
  assert.equal(restored.pageSize, 50);

  for (const [key, value] of [['search', 'Maya'], ['status', 'active'], ['sort', 'name'], ['pageSize', '10']]) {
    const next = new URLSearchParams(updateCustomerQuery(restored.query, key, value));
    assert.equal(next.get('page'), '1');
    assert.equal(next.get(key), value);
  }

  const navigated = new URLSearchParams(updateCustomerQuery(restored.query, 'page', '4'));
  assert.equal(navigated.get('page'), '4');
  assert.equal(navigated.get('status'), 'active');
  assert.equal(navigated.get('sort'), 'name');
  assert.equal(navigated.get('pageSize'), '50');
});

test('compact page links include the current page and non-interactive ellipsis', () => {
  assert.deepEqual(customerPageLinks(5, 6), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(customerPageLinks(5, 12), [1, 'ellipsis', 4, 5, 6, 'ellipsis', 12]);
});

test('latest-request loading ignores stale successes and failures', async () => {
  const pending = [];
  const loader = createLatestRequestLoader((query) => new Promise((resolve, reject) => {
    pending.push({ query, resolve, reject });
  }));

  const first = loader.load('?page=1');
  const second = loader.load('?page=2');
  pending[1].resolve('newest');
  pending[0].resolve('stale');
  assert.deepEqual(await second, { status: 'success', value: 'newest' });
  assert.equal(await first, null);

  const third = loader.load('?page=3');
  const fourth = loader.load('?page=4');
  pending[2].reject(new Error('stale failure'));
  pending[3].reject(new Error('latest failure'));
  assert.equal(await third, null);
  const latestFailure = await fourth;
  assert.equal(latestFailure.status, 'error');
  assert.equal(latestFailure.error.message, 'latest failure');
});
