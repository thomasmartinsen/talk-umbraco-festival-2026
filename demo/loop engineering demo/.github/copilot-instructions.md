# Customer Directory

## Application
- Small pagination-exercise baseline: currently displays all 134 fictional customers in one table, intentionally without pagination.
- `api/`: ASP.NET Core Minimal API targeting .NET 11. `Program.cs` defines the endpoint; `CustomerSeed.cs` defines the customer record and deterministic in-memory seed.
- `client/`: React 19, TypeScript, and Vite 8. `src/main.tsx` contains the UI and fetch logic; `src/styles.css` contains styling.
- No database, authentication, or customer editing. Keep this scope unless explicitly requested.

## Behavior to preserve
- `GET /api/customers` returns a JSON array of `{ id, name, email, status }`, not a paginated envelope.
- Optional query parameters: `search` (trimmed, case-insensitive name/email substring), `status` (`active` or `inactive`), and `sort` (`id` by default, or case-insensitive ascending `name`).
- Invalid status or sort values return HTTP 400 with `{ error }`. No matches return an empty array.
- The client keeps search/filter/sort in URL query parameters using `history.replaceState` and fetches through relative `/api` URLs.
- Preserve request cancellation and accessible loading, error, empty, count, and table states.
- Do not add pagination unless requested; when changing the API contract, update the client, smoke tests, and README together.

## Engineering workflow

For every repository implementation task, read and follow [the Engineering Loop skill](skills/engineering-loop/SKILL.md) before editing, even if it was not loaded automatically.

Confirm scope and acceptance criteria, then use at most three edit-and-check cycles, including the initial implementation, unless the engineer explicitly approves a different limit. Stop as soon as the acceptance criteria are met and focused tests and relevant static checks pass on the final diff. If a material decision is missing, validation is blocked, or the budget runs out without passing, stop editing, preserve the diff, report the evidence, and ask the engineer for one decision or action before continuing.

## Run and check
- Start the API from the solution root: `dotnet run --project api -- --urls http://127.0.0.1:5100`.
- Start the client: `npm --prefix client run dev`. Vite serves `http://127.0.0.1:5173` and proxies `/api` to port 5100.
- Build: `dotnet build` and `npm --prefix client run build` (TypeScript check plus Vite build).
- Smoke tests: `npm --prefix client test`. These use Node's test runner in `client/test/customers.test.mjs` and require both servers running; they exercise the API through Vite, not the browser UI.
