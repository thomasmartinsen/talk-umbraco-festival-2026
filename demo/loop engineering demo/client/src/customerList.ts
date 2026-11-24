export const allowedPageSizes = [10, 25, 50, 100] as const;

export type PageSize = (typeof allowedPageSizes)[number];

export type NormalizedCustomerQuery = {
  query: string;
  page: number;
  pageSize: PageSize;
  changed: boolean;
};

export function normalizeCustomerQuery(search: string): NormalizedCustomerQuery {
  const params = new URLSearchParams(search);
  const parsedPage = Number(params.get('page'));
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedPageSize = Number(params.get('pageSize'));
  const pageSize = allowedPageSizes.includes(parsedPageSize as PageSize)
    ? parsedPageSize as PageSize
    : 25;

  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  const normalizedSearch = `?${params.toString()}`;
  return {
    query: normalizedSearch,
    page,
    pageSize,
    changed: normalizedSearch !== (search.startsWith('?') ? search : `?${search}`),
  };
}

export function updateCustomerQuery(
  search: string,
  key: 'search' | 'status' | 'sort' | 'page' | 'pageSize',
  value: string,
): string {
  const params = new URLSearchParams(search);
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }

  if (key !== 'page') {
    params.set('page', '1');
  }

  return normalizeCustomerQuery(params.toString()).query;
}

export function customerPageLinks(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
  const links: Array<number | 'ellipsis'> = [];

  for (const page of pages) {
    const previous = links[links.length - 1];
    if (typeof previous === 'number' && page - previous > 1) {
      links.push('ellipsis');
    }
    links.push(page);
  }

  return links;
}

type RequestOutcome<T> =
  | { status: 'success'; value: T }
  | { status: 'error'; error: unknown };

export function createLatestRequestLoader<T>(
  request: (query: string, signal: AbortSignal) => Promise<T>,
) {
  let latestRequest = 0;
  let controller: AbortController | null = null;

  return {
    async load(query: string): Promise<RequestOutcome<T> | null> {
      const requestNumber = ++latestRequest;
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;

      try {
        const value = await request(query, signal);
        return requestNumber === latestRequest && !signal.aborted
          ? { status: 'success', value }
          : null;
      } catch (error) {
        return requestNumber === latestRequest && !signal.aborted
          ? { status: 'error', error }
          : null;
      }
    },
    cancel() {
      latestRequest++;
      controller?.abort();
    },
  };
}
