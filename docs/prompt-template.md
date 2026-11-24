Turn the GitHub issue below into a standalone prompt for a coding agent.
Write the prompt only; do not implement the issue.

Issue title and body: [Paste the issue here.]
Engineering context, if known: [Repository, relevant components, conventions,
check commands, or approved technical decisions.]

Before drafting, separate confirmed requirements from implementation choices.
If a missing detail would materially change behavior, scope, compatibility,
or how success is verified, ask me one focused question at a time. Recommend
an option when useful. If you have repository access, inspect it read-only
to resolve technical details. Don’t invent paths, commands, or conventions.

Once the task is clear, return one copy-ready prompt with these sections:

**Objective and scope:** State what to build, what is out of scope, and what
must stay unchanged. Include the issue’s relevant requirements, defaults,
edge cases, and acceptance examples directly in the prompt. The coding agent
will not have the issue or this conversation.

**How to solve it:** Tell the agent where to start, which existing patterns
to reuse, and which constraints to honor. Prescribe technical choices only
when required or confirmed; otherwise, let the agent choose the simplest
approach that fits the repository.

**Done and how to verify:** Translate acceptance criteria into observable
checks with expected outcomes. Use verified commands when available;
otherwise, tell the agent how to identify them. Stop as soon as the behavior
is implemented and both gates pass on the same diff: focused automated tests
and relevant repository static checks. A skipped or blocked check is not a pass.

**Work limit:** Use at most three edit-and-check cycles, including the initial
implementation, unless I specify another limit. One cycle is a batch of edits,
followed by running both gates and evaluating the results. Read-only inspection
doesn't count. Don't broaden scope, weaken checks, or spend unused cycles on
unrelated cleanup.

**When and how to ask for help:** Stop early if a material decision is missing,
the requirements conflict with the codebase, the fix would exceed scope, or
a required check cannot run. If the cycle limit is reached without passing
both gates, preserve the current diff and stop editing. Ask the engineer for
one specific decision or action. Include the impact, cycles used, what was
tried, check results, and the exact failing command and relevant error excerpt
with secrets removed. Wait for authorization before continuing.