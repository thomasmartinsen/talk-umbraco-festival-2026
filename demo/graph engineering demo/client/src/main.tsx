import { type MouseEvent, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Customer = {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
};

type Result =
  | { loading: true; requestId: number }
  | { loading: false; envelope: CustomerEnvelope }
  | { loading: false; error: string };

type CustomerEnvelope = {
  items: Customer[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type Query = {
  search: string;
  status: '' | 'active' | 'inactive';
  sort: '' | 'name';
  page: number;
  pageSize: 10 | 25 | 50 | 100;
};

const DEFAULT_QUERY: Query = {
  search: '',
  status: '',
  sort: '',
  page: 1,
  pageSize: 25,
};

function positiveInteger(value: string | null, fallback: number) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizePageSize(value: number): Query['pageSize'] {
  return value === 10 || value === 25 || value === 50 || value === 100 ? value : 25;
}

function parseQuery(search: string): Query {
  const params = new URLSearchParams(search);
  const status = params.get('status');
  const sort = params.get('sort');
  const size = positiveInteger(params.get('pageSize'), 25);

  return {
    search: params.get('search') ?? '',
    status: status === 'active' || status === 'inactive' ? status : '',
    sort: sort === 'name' ? 'name' : '',
    page: positiveInteger(params.get('page'), 1),
    pageSize: size === 10 || size === 50 || size === 100 ? size : 25,
  };
}

function buildSearch(query: Query) {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.sort) params.set('sort', query.sort);
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  return `?${params.toString()}`;
}

function canonicalUrl(query: Query) {
  return `${window.location.pathname}${buildSearch(query)}${window.location.hash}`;
}

function pageItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const selected = new Set([1, total]);
  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page >= 1 && page <= total) selected.add(page);
  }

  const ordered = [...selected].sort((a, b) => a - b);
  const items: Array<number | 'ellipsis'> = [];
  for (let index = 0; index < ordered.length; index += 1) {
    if (index > 0 && ordered[index] - ordered[index - 1] > 1) items.push('ellipsis');
    items.push(ordered[index]);
  }
  return items;
}

function App() {
  const [query, setQuery] = useState<Query>(() => parseQuery(window.location.search));
  const [result, setResult] = useState<Result>({ loading: true, requestId: 0 });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const normalized = parseQuery(window.location.search);
    const canonical = canonicalUrl(normalized);
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== canonical) {
      window.history.replaceState(null, '', canonical);
    }
  }, []);

  useEffect(() => {
    const request = new AbortController();
    setResult({ loading: true, requestId: Date.now() });
    const serialized = buildSearch(query);

    async function loadCustomers() {
      try {
        const response = await fetch(`/api/customers${serialized}`, { signal: request.signal });
        if (!response.ok) {
          throw new Error(`Could not load customers (HTTP ${response.status}).`);
        }
        const envelope: CustomerEnvelope = await response.json();
        if (!request.signal.aborted) {
          const normalizedPageSize = normalizePageSize(envelope.pageSize);
          const normalizedEnvelope: CustomerEnvelope = { ...envelope, pageSize: normalizedPageSize };
          setResult({ loading: false, envelope: normalizedEnvelope });
          if (envelope.page !== query.page || normalizedPageSize !== query.pageSize) {
            const corrected: Query = { ...query, page: envelope.page, pageSize: normalizedPageSize };
            setQuery(corrected);
            window.history.replaceState(null, '', canonicalUrl(corrected));
          }
        }
      } catch (error) {
        if (!request.signal.aborted) {
          const message = error instanceof Error ? error.message : 'Could not load customers.';
          setResult({ loading: false, error: message });
        }
      }
    }

    void loadCustomers();
    return () => request.abort();
  }, [query, retry]);

  useEffect(() => {
    function onPopState() {
      const normalized = parseQuery(window.location.search);
      const canonical = canonicalUrl(normalized);
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== canonical) {
        window.history.replaceState(null, '', canonical);
      }
      setQuery(normalized);
    }

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function navigate(next: Query) {
    window.history.pushState(null, '', canonicalUrl(next));
    setQuery(next);
  }

  function updateSetting(key: 'search' | 'status' | 'sort' | 'pageSize', value: string | number) {
    const next: Query = { ...query, page: 1 };
    if (key === 'search') next.search = String(value);
    if (key === 'status') next.status = value === 'active' || value === 'inactive' ? value : '';
    if (key === 'sort') next.sort = value === 'name' ? 'name' : '';
    if (key === 'pageSize') {
      next.pageSize = (value === 10 || value === 50 || value === 100 ? value : 25) as Query['pageSize'];
    }
    navigate(next);
  }

  function goToPage(page: number, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (result.loading === false && 'envelope' in result && page > result.envelope.totalPages) return;
    if (page >= 1) navigate({ ...query, page });
  }

  return (
    <main>
      <header>
        <p className="eyebrow">Customer directory</p>
        <h1>Customers</h1>
        <p className="description">Find customers by name or email, or filter by status.</p>
      </header>

      <div className="toolbar" aria-label="Customer list options" role="group">
        <label>
          Search
          <input
            type="search"
            placeholder="Name or email"
            value={query.search}
            onChange={(event) => updateSetting('search', event.target.value)}
          />
        </label>
        <label>
          Status
          <select value={query.status} onChange={(event) => updateSetting('status', event.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label>
          Sort by
          <select value={query.sort} onChange={(event) => updateSetting('sort', event.target.value)}>
            <option value="">Customer ID</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
        <label>
          Customers per page
          <select
            value={query.pageSize}
            onChange={(event) => updateSetting('pageSize', Number(event.target.value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
      </div>

      {result.loading ? (
        <p className="state" role="status">Loading customers…</p>
      ) : 'error' in result ? (
        <div className="state error" role="alert">
          <p>{result.error}</p>
          <button type="button" className="retry" onClick={() => setRetry((value) => value + 1)}>Retry</button>
        </div>
      ) : result.envelope.totalItems === 0 ? (
        <p className="state" role="status">No customers match these criteria.</p>
      ) : (
        <>
          {(() => {
            const envelope = result.envelope;
            const start = (envelope.page - 1) * envelope.pageSize + 1;
            const end = Math.min(envelope.page * envelope.pageSize, envelope.totalItems);
            return (
              <div className="count" role="status">
                <span>Showing {start}–{end} of {envelope.totalItems} customers</span>
                <span>Page {envelope.page} of {envelope.totalPages}</span>
              </div>
            );
          })()}
          <div className="table-frame">
            <table aria-label="Customers">
              <thead>
                <tr><th scope="col">ID</th><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {result.envelope.items.map((customer) => (
                  <tr key={customer.id}>
                    <td className="customer-id">{customer.id}</td>
                    <th scope="row">{customer.name}</th>
                    <td>{customer.email}</td>
                    <td><span className={`badge ${customer.status}`}>{customer.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.envelope.totalPages > 0 && (
            <nav className="pagination" aria-label="Customer pagination">
              {result.envelope.page === 1 ? (
                <button type="button" className="page-link disabled" disabled>Previous</button>
              ) : (
                <a
                  className="page-link"
                  href={canonicalUrl({ ...query, page: result.envelope.page - 1 })}
                  onClick={(event) => goToPage(result.envelope.page - 1, event)}
                >
                  Previous
                </a>
              )}
              <div className="page-links">
                {pageItems(result.envelope.page, result.envelope.totalPages).map((item, index) =>
                  item === 'ellipsis' ? (
                    <span className="ellipsis" aria-hidden="true" key={`ellipsis-${index}`}>…</span>
                  ) : (
                    <a
                      key={item}
                      className="page-link"
                      href={canonicalUrl({ ...query, page: item })}
                      aria-current={item === result.envelope.page ? 'page' : undefined}
                      aria-label={`Page ${item}`}
                      onClick={(event) => goToPage(item, event)}
                    >
                      {item}
                    </a>
                  ),
                )}
              </div>
              {result.envelope.page === result.envelope.totalPages ? (
                <button type="button" className="page-link disabled" disabled>Next</button>
              ) : (
                <a
                  className="page-link"
                  href={canonicalUrl({ ...query, page: result.envelope.page + 1 })}
                  onClick={(event) => goToPage(result.envelope.page + 1, event)}
                >
                  Next
                </a>
              )}
            </nav>
          )}
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
