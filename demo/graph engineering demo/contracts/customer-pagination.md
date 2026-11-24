# Customer pagination contract

This contract is derived from the original loop prompt and issue. It is the proposed shared interface for this demo. The engineer approves the existing array-to-envelope change by launching the demo. If another consumer is discovered, stop and ask. The original app has no customer selection or edit actions, database, or authentication; do not introduce them.

## HTTP interface

`GET /api/customers?search=maya&status=active&sort=name&page=1&pageSize=25`

- `page`: 1-based positive integer, default 1. Missing, malformed or non-positive values normalize to 1.
- `pageSize`: one of 10, 25, 50, 100; default 25. Missing or invalid values normalize to 25.
- Preserve `search` (case-insensitive name/email), `status` (active/inactive), `sort` (id/name), and existing invalid status/sort HTTP 400 behavior.
- Search/filter before count; sort before slicing. Preserve sort semantics; use customer ID as deterministic tie-breaker. Return only the effective page from the server.
- `totalPages = ceil(totalItems / pageSize)`. A valid page above the last page is clamped. For zero matches return page 1, zero total pages, empty items and the effective page size.
- JSON response replaces the baseline array with this envelope:

```json
{
  "items": [{"id": 26, "name": "Finn Patel", "email": "finn.patel.26@example.test", "status": "active"}],
  "page": 2,
  "pageSize": 25,
  "totalItems": 134,
  "totalPages": 6
}
```

Illustrative `items` array (only one record shown; actual page 2 has 25 records). The fixture generates the customer names; IDs are the stable test reference. The customer object shape is unchanged.

## Testable sort seam

To allow the original prompt’s tied-sort requirement to be verified without changing seed data or adding .NET packages, the API agent implements `api/CustomerQuery.cs` with `internal static class CustomerQuery` and `internal static IEnumerable<Customer> Order(IEnumerable<Customer> customers, string? sort)`. The endpoint calls this helper for its actual sorting. This is a prepared implementation convention, not a new public API. The supplied console check compiles the helper with `CustomerSeed.cs` and checks case-insensitive ties using unsorted IDs.

## UI interface

- The URL holds search/status/sort/page/pageSize; restore on reload and Back/Forward. User-driven transitions preserve history; correcting invalid/clamped values replaces the current history entry. Do not create a history entry for an internal correction.
- Changes to search, status, sort or size reset to page 1; page navigation preserves all other criteria.
- Show Previous, Next, numbered links, non-interactive ellipses for long ranges, a labeled size selector, `Page X of Y` and `Showing x–y of z customers`. Use accessible labels and `aria-current="page"` for the selected numbered link; disabled ends must be inoperable. Prefer semantic controls and visible focus.
- Clear rows on loading, retain existing loading/empty state, ignore stale successes/failures, and expose inline Retry for the failed current request. Hide paging controls and summary for zero matches.

## Ownership and approvals

API agent owns `api/`; Frontend agent owns `client/src/`; Test agent owns `client/test/` and may add tests under `verification/browser/tests/` but cannot change the supplied `pagination.spec.mjs`. No app dependency changes. The test-only Playwright tooling is an explicitly prepared demo prerequisite, not an app dependency. All agents must work from this same contract. Any contract change requires the engineer's decision.
