import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  allowedPageSizes,
  createLatestRequestLoader,
  customerPageLinks,
  normalizeCustomerQuery,
  updateCustomerQuery,
} from './customerList';
import './styles.css';

type Customer = {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
};

type CustomerPage = {
  items: Customer[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type Result =
  | { loading: true }
  | { loading: false; customers: CustomerPage }
  | { loading: false; error: string };

function initialQuery() {
  const normalized = normalizeCustomerQuery(window.location.search);
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${normalized.query}${window.location.hash}`,
  );
  return normalized.query;
}

function App() {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<Result>({ loading: true });
  const [retry, setRetry] = useState(0);
  const [customerLoader] = useState(() => createLatestRequestLoader(async (requestQuery, signal) => {
    const response = await fetch(`/api/customers${requestQuery}`, { signal });
    if (!response.ok) {
      throw new Error(`Could not load customers (HTTP ${response.status}).`);
    }
    return await response.json() as CustomerPage;
  }));
  const params = new URLSearchParams(query);

  useEffect(() => {
    function restoreFromUrl() {
      const normalized = normalizeCustomerQuery(window.location.search);
      if (normalized.changed) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${normalized.query}${window.location.hash}`,
        );
      }
      setQuery(normalized.query);
    }

    window.addEventListener('popstate', restoreFromUrl);
    return () => window.removeEventListener('popstate', restoreFromUrl);
  }, []);

  useEffect(() => {
    setResult({ loading: true });
    const requestedQuery = query;
    const requestedPage = Number(new URLSearchParams(requestedQuery).get('page'));

    void customerLoader.load(requestedQuery).then((outcome) => {
      if (outcome?.status === 'success') {
        const customers = outcome.value;
        if (customers.page !== requestedPage) {
          const clampedQuery = updateCustomerQuery(requestedQuery, 'page', String(customers.page));
          window.history.replaceState(
            null,
            '',
            `${window.location.pathname}${clampedQuery}${window.location.hash}`,
          );
        }
        setResult({ loading: false, customers });
      } else if (outcome?.status === 'error') {
        const message = outcome.error instanceof Error
          ? outcome.error.message
          : 'Could not load customers.';
        setResult({ loading: false, error: message });
      }
    });

    return customerLoader.cancel;
  }, [customerLoader, query, retry]);

  function changeQuery(
    key: 'search' | 'status' | 'sort' | 'page' | 'pageSize',
    value: string,
  ) {
    const next = updateCustomerQuery(query, key, value);
    window.history.pushState(null, '', `${window.location.pathname}${next}${window.location.hash}`);
    setQuery(next);
  }

  function pageHref(page: number) {
    return `${window.location.pathname}${updateCustomerQuery(query, 'page', String(page))}${window.location.hash}`;
  }

  function navigateToPage(page: number) {
    const next = updateCustomerQuery(query, 'page', String(page));
    window.history.pushState(null, '', `${window.location.pathname}${next}${window.location.hash}`);
    setQuery(next);
  }

  const page = !result.loading && 'customers' in result ? result.customers : null;
  const firstItem = page ? (page.page - 1) * page.pageSize + 1 : 0;
  const lastItem = page ? Math.min(page.page * page.pageSize, page.totalItems) : 0;

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
            value={params.get('search') ?? ''}
            onChange={(event) => changeQuery('search', event.target.value)}
          />
        </label>
        <label>
          Status
          <select value={params.get('status') ?? ''} onChange={(event) => changeQuery('status', event.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label>
          Sort by
          <select value={params.get('sort') ?? ''} onChange={(event) => changeQuery('sort', event.target.value)}>
            <option value="">Customer ID</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      {result.loading ? (
        <p className="state" role="status">Loading customers…</p>
      ) : 'error' in result ? (
        <div className="state error-state" role="alert">
          <p>{result.error}</p>
          <button type="button" onClick={() => setRetry((attempt) => attempt + 1)}>Retry</button>
        </div>
      ) : result.customers.items.length === 0 ? (
        <p className="state" role="status">No customers match these criteria.</p>
      ) : (
        <>
          <p className="count" role="status">
            Showing {firstItem}–{lastItem} of {result.customers.totalItems} customers
          </p>
          <div className="table-frame">
            <table aria-label="Customers">
              <thead>
                <tr><th scope="col">ID</th><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {result.customers.items.map((customer) => (
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
          <div className="pagination-bar">
            <p className="page-status">Page {result.customers.page} of {result.customers.totalPages}</p>
            <nav className="pagination" aria-label="Customer pagination">
              <button
                type="button"
                disabled={result.customers.page === 1}
                onClick={() => navigateToPage(result.customers.page - 1)}
                aria-label="Previous page"
              >
                Previous
              </button>
              {customerPageLinks(result.customers.page, result.customers.totalPages).map((pageNumber, index) =>
                pageNumber === 'ellipsis' ? (
                  <span className="pagination-ellipsis" aria-hidden="true" key={`ellipsis-${index}`}>…</span>
                ) : (
                  <a
                    href={pageHref(pageNumber)}
                    key={pageNumber}
                    aria-label={`Go to page ${pageNumber}`}
                    aria-current={pageNumber === result.customers.page ? 'page' : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToPage(pageNumber);
                    }}
                  >
                    {pageNumber}
                  </a>
                ),
              )}
              <button
                type="button"
                disabled={result.customers.page === result.customers.totalPages}
                onClick={() => navigateToPage(result.customers.page + 1)}
                aria-label="Next page"
              >
                Next
              </button>
            </nav>
            <label className="page-size">
              Rows per page
              <select
                value={result.customers.pageSize}
                onChange={(event) => changeQuery('pageSize', event.target.value)}
              >
                {allowedPageSizes.map((pageSize) => (
                  <option value={pageSize} key={pageSize}>{pageSize}</option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
