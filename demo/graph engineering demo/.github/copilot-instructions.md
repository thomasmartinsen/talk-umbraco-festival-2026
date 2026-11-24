# Customer Directory repository instructions

This is a .NET 11 Minimal API and React/TypeScript customer directory. Data is in memory (134 customers); API port 5100, Vite port 5173. Open the repository root. See `README.md` for commands.

Preserve existing behavior and unrelated edits. No dependency changes, migrations, unrelated APIs, commits, pushes, or deployments without explicit approval. The feature-specific scope is in `issues/customer-pagination.md` and `contracts/customer-pagination.md`.

For a single-agent task use `.github/skills/engineering-loop/SKILL.md`. For delegated graph delivery use `.github/skills/engineering-graph/SKILL.md` and `workflows/feature-delivery.md`. The graph uses one shared cycle budget, not a separate budget per worker; its orchestrator owns integration and verification. A worker assigned a graph node must not independently launch the engineering-loop skill or another subagent. A single-agent task must not automatically start graph orchestration.

Treat supplied acceptance tests under `verification/api/` and `verification/browser/tests/pagination.spec.mjs`, routing policy and original loop artifacts as read-only. Do not edit checks to make a failing implementation pass. A missing prerequisite is a blocker, not a passing or inapplicable gate. Read applicable paths explicitly rather than assuming they are in context.
