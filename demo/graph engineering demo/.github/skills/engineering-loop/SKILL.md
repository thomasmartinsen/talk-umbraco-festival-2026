---
name: engineering-loop
description: Run a bounded engineering loop for repository features, bug fixes, refactors, and other implementation tasks. Use when turning an issue or request into code that must meet acceptance criteria, pass checks, and stop or escalate at a defined limit.
---

# Engineering loop

Implement the smallest change that satisfies the task. Verify the behavior, then stop. If a decision, prerequisite, or work limit blocks completion, preserve the current diff and hand the decision back to the engineer.

## 1. Define the task before editing

- Read the task and applicable repository instructions. Trace the affected code, existing tests, and established patterns. Do not assume that a referenced issue or attachment is available; if you cannot obtain required information, ask for it.
- Identify the objective, in-scope changes, behavior to preserve, and observable acceptance criteria. Separate confirmed requirements from implementation choices. For routine choices, use the simplest approach consistent with the repository. If a missing decision would materially change behavior, scope, compatibility, or verification, ask one focused question before editing.
- Identify the commands for the two check gates using repository scripts, docs, or CI configuration. Use the narrowest checks that cover the change. Do not invent commands or silently waive a required gate.
- Use the engineer's explicit cycle limit if provided; otherwise use **three edit-and-check cycles**, including the initial implementation. Keep track of attempts for the task across turns, retries, or handoffs; do not reset the budget without explicit approval.

## 2. Implement and check

One cycle is one coherent batch of implementation or test edits, followed by running both applicable gates and evaluating the results:

1. **Focused automated tests:** Verify the acceptance criteria and relevant edge cases. Add or update tests for behavior that changes.
2. **Relevant static checks:** Run the affected project's lint, type-check, or equivalent checks, plus any build required to validate the change.

The initial edit batch uses cycle 1. Once you start editing in a cycle, that cycle counts even if a check cannot run. Read-only inspection and pre-edit baseline checks do not count. A no-edit rerun to confirm a known transient tooling failure does not consume another cycle, but do not repeatedly rerun an unchanged failure. Record the edits, commands, and outcomes for each cycle. Use another cycle only when the evidence points to a specific, in-scope correction.

Keep the diff surgical and preserve unrelated user changes. Do not expand scope, fix unrelated failures, or make unapproved changes to dependencies, schemas, or public contracts. Do not weaken tests, suppress failures, or disable checks to get a pass.

## 3. Stop when done, or stop and ask

**Done:** The acceptance criteria are met and all applicable checks in both gates pass on the same diff you will hand back. Stop immediately; unused cycles are not a cleanup budget. Report what changed, the commands and results, and cycles used. Record a gate as **not applicable** only if repository conventions or the engineer explicitly establish that it does not apply to this change. A missing or unavailable check is not automatically inapplicable. Skipped, failing, and blocked checks are not passes.

**Ask early:** Pause if a material requirement is ambiguous, the specification conflicts with existing behavior or architecture, a fix would exceed scope, a required check is blocked by a missing prerequisite or unrelated failure, or the evidence no longer supports another in-scope correction. Ask the person who owns the decision; do not silently change the requirements or take on unrelated work.

**At the limit:** If the acceptance criteria or a required gate are unmet when the budget is used, stop editing, leave the current diff intact, and mark the task **blocked**. Do not start a fourth cycle under the default budget or delegate additional attempts to bypass it. Resume only after the engineer supplies the decision or prerequisite, or explicitly approves more cycles if the budget is exhausted.

## 4. Ask for help with evidence

Use the available input channel and lead with **one specific decision or action**. Report:

- **Impact:** What is blocked and why it matters for acceptance or verification.
- **Attempts:** Cycles used out of the limit and what changed in each.
- **Evidence:** Pass, fail, blocked, or not-run status for each gate; the exact failing command and a short, relevant error excerpt with secrets removed, where applicable. Distinguish confirmed facts from a suspected cause.
- **Recommendation:** If there are real options, recommend one and explain its trade-off briefly.

Wait for the engineer's response. Do not report the task as done while it is blocked.