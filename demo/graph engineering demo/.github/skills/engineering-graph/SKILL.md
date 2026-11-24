---
name: engineering-graph
description: Coordinate a scoped feature graph using named subagents, a shared contract, parallel independent work, integrated checks, independent review, bounded repair and human escalation.
---
# Engineering graph

Use when the engineer explicitly requests graph delivery. The parent must be Graph Orchestrator or be explicitly authorized to act as coordinator. This is an instruction-based graph, not a runtime guarantee. Read the [workflow](../../../workflows/feature-delivery.md) and [handoff contract](../../../workflows/handoff-contract.md) before invoking any worker.

1. **Preflight:** Confirm actual named subagent support, issue, approved contract, Git state, prerequisites and both gates. If a material decision or prerequisite is missing, stop before editing. Preserve the three-cycle budget from the engineering-loop skill; for graph work its accounting is centralized here.
2. **Plan:** Establish disjoint write scopes and a shared interface. Instruct each worker with explicit assignment, context, paths, dependencies, cycle number, allowed changes and output contract. Never assume parent conversation context is inherited.
3. **Fan-out:** Reserve one cycle immediately before the first edit invocation of a wave. Delegate to API Engineer, Frontend Engineer and Test Engineer where independent. Parallelism is optional and must be observed, not assumed. Never allow overlapping writes. Workers do not run independent repair loops.
4. **Fan-in:** Wait for every worker; inspect the changed files, ownership, contract compatibility and handoffs. If a worker blocks, stop further editing and preserve current diff. Run both check gates on the same integrated diff when safe. Record exact command, result and evidence; no skip is a pass. Get independent Feature Reviewer after both gates pass.
5. **Route:** Convert validated findings to the routing input in `workflows/handoff-contract.md`. Run the deterministic routing script and record its output. Route only in-scope corrections to the responsible worker(s); reserve one additional shared cycle for the whole repair wave. Return to fan-in and run both gates again, then review again. Block on uncertainty, missing requirements, unavailable checks, unrelated failures, out-of-scope work or exhausted budget. Never bypass the budget by delegating.
6. **Stop:** At verified success and accepted independent review stop immediately and ask for human approval. On a blocker lead with one specific decision/action; report impact, attempts, exact failing command and short evidence. No more edits until authorization. Preserve run record across turns; if starting a new chat, load it before continuing.

See the original `engineering-loop` skill for the principles behind bounded feedback. Its per-task cycle instructions are not applied independently by delegated workers.
