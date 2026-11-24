# Customer Directory

A small customer directory. The React/TypeScript client fetches one page at a time from a C# ASP.NET Core Minimal API and supports search, status filtering, sorting, and URL-backed pagination.

The in-memory data resets on restart. No database, authentication, or customer editing is needed.

## Run locally

Install the [.NET 11 SDK](https://dotnet.microsoft.com/download/dotnet/11.0) and Node.js 22.12 or later. From the solution folder, start the API:

```sh
dotnet run --project api -- --urls http://127.0.0.1:5100
```

In a second terminal, from the same folder:

```sh
npm --prefix client ci
npm --prefix client run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite proxies `/api` to ASP.NET Core.

## Baseline contract

`GET /api/customers` returns `{ items, page, pageSize, totalItems, totalPages }`. It accepts `search` (name or email), `status` (`active` or `inactive`), `sort` (`id` by default or `name`), `page` (1-based), and `pageSize` (10, 25, 50, or 100). Pagination defaults to page 1 and 25 items. The client preserves all criteria in the URL.

## Check the baseline

With both servers running, run `npm --prefix client test` for focused API and URL-state tests through the Vite proxy. Run `dotnet build` and `npm --prefix client run build` for the backend build and client type-check/build.

The directory starts on page 1 at 25 customers per page. The final page contains customers 126–134.
