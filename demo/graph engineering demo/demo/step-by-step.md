# Presenter guide — graph engineering

## Story (target: 10–15 minutes, excluding setup)

| Stage | What to show | Point |
|---|---|---|
| 1 | Existing unpaginated customer directory | Same problem as loop demo |
| 2 | Issue and approved API envelope | Shared contract makes independent work possible |
| 3 | Mermaid graph and custom agents | A graph is responsibilities, dependencies, routes and state |
| 4 | Start Graph Orchestrator | Show real delegated tool calls, not a narrated plan |
| 5 | Inspect fan-out/fan-in and gate evidence | A graph can contain a loop; one budget governs repair |
| 6 | Actual failed check or explicit simulated route rehearsal | A specific defect returns to its owner, not the whole graph |
| 7 | Review and human approval or escalation | Agents do not own every decision |

Before the talk, rehearse in a fresh extraction with the same Copilot model/harness and machine. Install all prerequisites and check baseline, custom agent discovery, read-only delegation, browser tooling and API restarts. Capture actual traces from a rehearsal and keep them separate from the fresh live workspace. Do not count on a fixed Copilot run time. Use the deterministic routing rehearsal as a fallback if the live work is still running or completes without a failure.

## Talk track

- Loop engineering: the issue owns the goal; the skill owns iteration; the scoped agent owns implementation.
- Graph engineering: the workflow owns coordination; the contract owns shared interfaces; specialized agents own individual nodes; state carries evidence.
- Parallelism is a potential benefit, not the definition of a graph. The same graph can execute sequentially where independence or runtime support is missing.
- A failed test is an observation, not a routing decision. The coordinator classifies evidence, then the deterministic decision function selects an allowed route.
- A rule-based router does not establish that model-supplied evidence is true. Verify the diff and commands. The workflow is instruction-based; programmatic orchestration would be needed for stronger guarantees.

## Rehearse conditional routing

Open `demo/graph/examples/frontend-failure.json` and run its router command. Point out `owner`, `kind` and the current shared budget. Change to the human-blocker example and then budget-exhausted example. Explain that these are prepared scenarios and are not observed failures from the live app. Show how the same policy routes success to human approval. No need to intentionally sabotage production code or weaken tests.

## If the live run blocks

Show the actual blocker as evidence of the stop boundary. A missing SDK, unsupported subagent invocation or absent test prerequisite is not a successful implementation. Do not rerun unchanged failures repeatedly or reset the shared budget. If time is short, switch to the prepared routing examples and the diagram. The source application is intentionally unimplemented; no completed feature checkpoint is included.
