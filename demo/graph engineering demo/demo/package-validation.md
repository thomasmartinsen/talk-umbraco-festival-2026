# Packaging validation

- Original application sources, solution, client package manifest and lock, and smoke tests: byte-for-byte compared to supplied original ZIP; unchanged. README and ignore rules are the only existing project files adjusted.
- Original four loop engineering input files: byte-for-byte preserved under `demo/original-loop/`.
- All six custom agent YAML headers and three skill YAML headers parsed; skill names match directories.
- JavaScript router tests: 6 passed, 0 failed (Node.js 22.16.0).
- Five synthetic router examples executed and produced the expected routes.
- Browser config and tests passed Node.js syntax checks; browser tests themselves were not executed.
- .NET SDK unavailable in packaging environment. API, query checks, application builds and smoke tests were not executed.
- npm registry DNS lookup failed (EAI_AGAIN), so Playwright package lock and dependency installation could not be completed here. Install as documented before the rehearsal. No app dependency was added.
- Actual VS Code/Copilot agent discovery, tool execution and parallel delegation have not been exercised here; verify with the read-only preflight and a rehearsal on the presenter machine.
- Pagination is intentionally not implemented; no completed checkpoint or actual agent execution trace is supplied. The routing JSON examples are synthetic.
