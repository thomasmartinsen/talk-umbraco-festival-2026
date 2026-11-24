## Prompt before

Add pagination to the list of customers on the customers page – keep working until pagination is done.



## Prompt after

### Objective and scope

Implement pagination end to end for the existing customer list. Preserve existing search, filters, sorting, selection, and customer actions. Change only the customer-list query/API, request and response types, URL state, UI, and directly related tests.

### How to solve it

1. Trace the existing customer-list UI, URL state, API, and data query. Reuse repository patterns for paging, loading, errors, empty states, and accessibility. Identify the focused test and static-check commands before editing.
2. Add 1-based `page` and `pageSize` query parameters to the customer-list API. Default to page 1 and size 25. Accept only sizes 10, 25, 50, and 100. Treat missing values as defaults; normalize malformed or non-positive page values to 1 and invalid sizes to 25.
3. Apply existing search and filters before counting or slicing. Use the existing selected or default sort, with customer ID as a deterministic tie-breaker. Fetch only the effective page on the server; do not fetch all matching rows and slice them in the client. Return `items`, `page`, `pageSize`, `totalItems`, and `totalPages`. Derive `totalPages` by rounding up the matching count divided by page size. Clamp a valid page above the last page to the last page before fetching. For no matches, return `items: []`, `page: 1`, `totalItems: 0`, and `totalPages: 0`, with the effective `pageSize`.
4. Keep `page` and `pageSize` in the URL while preserving existing search, filter, and sort parameters. Restore them on reload, shared links, and browser Back/Forward. Replace the URL when correcting invalid values or syncing a clamped page. User changes to search, filters, sort, or page size reset to page 1; navigation between pages leaves those settings alone.
5. Add Previous, Next, compact numbered links with non-interactive ellipses, a page-size selector, `Page X of Y`, and `Showing x–y of z customers`. Disable Previous on the first page and Next on the last. Make controls keyboard operable with descriptive labels, visible focus, and an accessible current-page state.
6. Clear previous rows while loading and show the existing loading state. Ignore stale successes and failures; only the latest request can update the UI. On failure, show an inline error with Retry that repeats the failed request. For no matches, show the existing empty state and hide pagination controls and summaries.

### Done and how to verify

Add focused automated coverage for the API and UI behavior above. Use 134 matching customers at size 25 to verify that page 2 returns and displays customers 26–50, page 6 displays 126–134, and a request for page 99 resolves to page 6. Cover all allowed sizes, defaults and invalid inputs, tied sort values, URL restoration and resets, empty results, loading, Retry, and stale responses. Verify keyboard operation and the current-page state.

Done means the specified behavior is implemented and both gates pass on the same diff: (1) focused pagination tests and (2) relevant repository static checks, such as lint and type-check, plus a build if the affected project requires it. Stop as soon as both gates pass. Report the commands and results; do not spend unused cycles on cleanup.

### Work limit and when to ask for help

Use at most **three edit-and-check cycles**, including the initial implementation. A cycle is one coherent batch of edits followed by both check gates and an evaluation of the results. Read-only inspection does not count; a rerun to confirm a known transient tooling failure does not count if the code is unchanged. Do not retry unchanged failures without new evidence.

Do not redesign the list, add dependencies or migrations, change unrelated APIs, break existing consumers, or fix unrelated failures. Do not weaken tests or disable checks to make the gate pass.

Stop early if the spec conflicts with the codebase, an unanswered decision would materially change behavior, a required check is blocked by an unavailable prerequisite or unrelated failure, or the fix would exceed scope. Otherwise, use the next cycle only for a correction supported by the check results.

If either gate remains failing or blocked after cycle three, stop editing, preserve the current diff, and ask the engineer for direction. Do not start a fourth cycle without explicit approval.

### How to ask for help

Lead with one specific decision or action you need from the engineer. State the blocker and its impact, the cycles used, what you tried in each cycle, and which checks passed, failed, or could not run. Include the exact failing command and the smallest useful error excerpt, with secrets removed. If there are viable options, recommend one and explain the trade-off in a sentence. Mark the task blocked and wait for the engineer's response.