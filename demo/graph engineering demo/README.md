# Customer Directory — graph engineering demo

A runnable starting point for a live GitHub Copilot graph engineering demo in VS Code. The original customer directory has 134 fictional customers, search, status filtering and sorting, but **no pagination**. The feature is deliberately not implemented. GitHub Copilot delivers the feature during the demo.

The graph uses the same pagination issue and requirements as the loop engineering demo. It replaces the single scoped implementer with specialized subagents, an approved interface, integration, independent review and targeted repair, using one shared three-cycle budget.

## 1. Prerequisites and setup

- .NET 11 SDK (the supplied solution targets `net11.0`). Node.js 22.12+ (use a supported LTS release), npm, Git.
- VS Code with GitHub Copilot, signed in, Copilot harness selected, custom agents and subagents available. Open the **repository root**, not `client/` alone. Trust this workspace only after inspecting the code. Keep normal tool approvals enabled.
- Network access for initial npm dependencies and Playwright Chromium installation. No database, Docker, MCP server or API key beyond Copilot sign-in is required.

Extract the archive and open `graph-engineering-demo`. From that folder:

```sh
npm --prefix client ci
npm --prefix verification/browser install
npm --prefix verification/browser run install-browser
```

Playwright is a pinned, separate demo-only test dependency; it does not change the original app's dependencies. Its package lock could not be generated in the packaging environment; `npm install` generates it locally. On Linux, Playwright may also require its documented OS prerequisites.

Initialize a local Git baseline if this is not already a Git repository (these are manual engineer actions, not permissions for agents):

```sh
git init
git add .
git commit -m "Graph engineering demo baseline"
```

Start the API from the repository root in terminal 1. Use watch so code changes are available during integrated checks:

```sh
dotnet watch --project api run -- --urls http://127.0.0.1:5100
```

If a change requires a restart, allow it or stop and restart the process before validation. If watch is unsuitable, use `dotnet run --project api -- --urls http://127.0.0.1:5100` and restart after API edits.

In terminal 2:

```sh
npm --prefix client run dev
```

Open http://127.0.0.1:5173. The original directory shows all 134 customers. Vite proxies `/api` to port 5100. Keep both terminals running and use a third terminal for checks:

```sh
npm --prefix client test
dotnet build
npm --prefix client run build
node --test demo/graph/route.test.mjs
```

The original API smoke tests must be green on the baseline. The prepared pagination browser and C# query acceptance checks are intentionally not green yet (the required feature and sort helper do not exist). Do not fix the baseline by changing acceptance tests. If setup fails, resolve the prerequisite before the live demo.

## 2. Verify GitHub Copilot customizations

Select the **Copilot** session harness in VS Code Chat. Use the Command Palette → **Chat: Open Customizations** → Agents and Skills. Confirm these agents are discovered without errors:

- Graph Orchestrator (selectable)
- Scoped Implementer (selectable, original loop agent)
- API Engineer, Frontend Engineer, Test Engineer and Feature Reviewer (delegation-only; intentionally hidden from the picker)

Confirm skills `engineering-loop`, `engineering-graph`, and `deliver-pagination` appear in Customizations. Native Copilot uses its own subagent delegation; the `agent` tool alias is configured on the coordinator. Older VS Code Local harness uses a different delegation tool. Do not assume Local-only `agents` or `handoffs` fields enforce this graph; they are deliberately omitted. Some organizations restrict agent capabilities: verify actual subagent activity in a fresh chat before the talk.

Select Graph Orchestrator and paste the read-only prompt in `demo/prompts/preflight.md`. Confirm that Feature Reviewer was actually invoked (inspect subagent activity), not merely described. Stop after preflight; no files should change. If delegation is unavailable, fix the session configuration before the demo. Do not silently substitute the parent implementing all roles.

## 3. Run the live demo

1. Open the baseline app and show the 134 customers. Show `issues/customer-pagination.md` (goal) and `contracts/customer-pagination.md` (shared interface).
2. Show the graph in `workflows/feature-delivery.md` using Markdown preview. Show `.github/agents/graph-orchestrator.agent.md`, the specialists, and the `engineering-graph` skill. Explain disjoint ownership and the single iteration budget.
3. Start a new Copilot chat. Select **Graph Orchestrator**. Invoke `/deliver-pagination`, or paste the full prompt in `demo/prompts/graph.md`. This approves the documented array-to-envelope transition for the current app only. Confirm any material new decision separately.
4. Inspect actual subagent calls in the parent chat. The API, frontend and test agents can work independently against the shared contract and own non-overlapping files. Parallelism depends on the active Copilot harness; if serialized, say so. The coordinator must wait for fan-in before running integrated checks.
5. Open `.demo-state/run.md` after the first transition to show the graph's live execution record: assignments, cycle count, gate evidence, route, and blockers. Inspect the integrated Git diff and review findings. Restart the API if watch has not applied the current source.
6. If a real check fails, show how the coordinator classifies the evidence and uses `demo/graph/route.mjs` to route only to the responsible specialist. If no defect occurs, use the explicitly simulated route rehearsal below rather than pretending the live run failed.
7. At verified completion, inspect the final UI, diff and recorded tests; give or withhold final approval. A blocked workflow must retain its diff and ask for the specific decision or prerequisite. It must not claim success.

The graph is model-orchestrated, not an enforced runtime. Named subagents, ownership, budget and graph traversal are instructions. The router is executable and deterministic for supplied evidence, but the parent is responsible for invoking it and classifying the actual evidence. No absolute guarantee of tool isolation, parallel execution or compliance is made.

## 4. Verification after implementation

From the repository root, with current API/Vite running, run both gates on the same integrated diff:

```sh
# Gate 1: focused automated checks
npm --prefix client test
dotnet run --project verification/api/CustomerDirectory.QueryChecks.csproj
npm --prefix verification/browser test

# Gate 2: build and type-check
dotnet build
npm --prefix client run build
```

The test agent updates the existing array-based API smoke tests to the envelope while preserving their regression assertions and adds coverage for the new contract. The supplied C# check tests tied sort values without changing the seed. The supplied browser suite exercises the actual app against the API for navigation, URL/history, filtering, invalid input, empty state and keyboard behavior; controlled HTTP responses exercise loading, stale success/failure, and Retry. Browser tests assume the existing semantic names (Customers table, Search, Status, Sort by, Loading customers…, empty-state text) and accessible pagination labels in the shared contract. Inspect failures rather than weakening checks.

Manual demonstration: at size 25, page 2 shows 26–50 of 134 and page 6 shows 126–134, with Next disabled. Change status/search/sort/size from page 2; each resets page to 1. Try a shared page link, Back/Forward, page 99, invalid input and no matches. Test keyboard navigation and visible focus. Automated keyboard checks are not a complete accessibility audit.

## 5. Quick routing rehearsal (no app edits or live agent required)

Use the supplied synthetic evidence to illustrate branching, even if the live run succeeds on its first try. Each JSON file is labeled/treated as simulated evidence, not proof of an actual run.

```sh
node demo/graph/route.mjs demo/graph/examples/frontend-failure.json
node demo/graph/route.mjs demo/graph/examples/api-failure.json
node demo/graph/route.mjs demo/graph/examples/human-blocker.json
node demo/graph/route.mjs demo/graph/examples/budget-exhausted.json
node demo/graph/route.mjs demo/graph/examples/success.json
```

Expected: frontend repair, API repair, human escalation, budget escalation, and awaiting human approval. `node --test demo/graph/route.test.mjs` tests the router. This part can be demonstrated independently of the app and Copilot.

## 6. Repeat or compare with loop engineering

Use a separate clean extraction or a separate local branch from the baseline for each approach. Do not rerun graph delivery on an already paginated app and call that an equivalent comparison. To resume a blocked graph, keep `.demo-state/` and continue in the same chat or explicitly tell the new coordinator to load it; never delete the ledger to bypass a limit. For a genuinely fresh demo, use a fresh extraction.

The four original loop engineering input files are preserved byte-for-byte in `demo/original-loop/`. The existing Scoped Implementer and engineering-loop skill are installed in `.github/`; graph workers do not run their own independent loops. To compare with the original loop demo, choose Scoped Implementer and supply the improved prompt from `demo/original-loop/prompt.md` in a separate original-project extraction. This graph package adds the shared sort seam and acceptance tooling specifically for the graph run.

## Files

| Path | Purpose |
|---|---|
| `api/`, `client/`, `CustomerDirectory.slnx` | Original application, unchanged |
| `issues/`, `contracts/` | Improved issue and approved interface |
| `.github/copilot-instructions.md` | Project-level context and constraints |
| `.github/agents/` | Coordinator, four specialists and original Scoped Implementer |
| `.github/skills/` | Original loop, graph procedure, launch skill |
| `workflows/` | Graph definition and handoff/evidence contract |
| `verification/` | Prepared query and browser acceptance tooling |
| `demo/graph/` | Deterministic decision function, tests and simulated inputs |
| `demo/prompts/` | Copy/paste launch and read-only preflight prompts |
| `demo/original-loop/` | All four original source artifacts |
| `demo/presenter-guide.md` | Presenter sequence and fallback |

## VS Code documentation

- [Custom agent file reference](https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference)
- [Use subagents](https://code.visualstudio.com/docs/agents/run/subagents)
- [Agent skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [Migrate customizations to Copilot](https://code.visualstudio.com/docs/agent-customization/migrate-customizations)

Native Copilot uses skills for reusable prompts, rather than legacy `.prompt.md` files. The plain Markdown prompt is also supplied for reliable copy/paste regardless of slash-command availability. Configuration is based on official documentation checked November 24, 2026. Verify in your installed VS Code and Copilot session before presenting.
