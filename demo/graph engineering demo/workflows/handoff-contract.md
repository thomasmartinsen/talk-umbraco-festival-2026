# Handoff and evidence contract

## Assignment from orchestrator

Include the node name, cycle number and remaining global budget, issue and contract paths, exact write scope, previous findings/evidence (if repair), dependencies, and expected output. Workers read the sources themselves. Do not pass whole conversation histories.

## Worker response

```json
{
  "node": "frontend",
  "cycle": 1,
  "status": "completed",
  "changedFiles": ["client/src/main.tsx"],
  "summary": "Implemented the assigned scope",
  "checks": [{"command":"not run (integration owned by coordinator)","status":"not_run","evidence":"Awaiting fan-in"}],
  "findings": []
}
```

Node is `api`, `frontend`, `test`, or `review`. Implementation status is `completed` or `blocked`; review status is `review_passed`, `changes_required` or `blocked`. Each finding must include `id`, `owner` (`api`, `frontend`, `test`, `human`), `kind` (`repairable` or `blocker`), `requirement`, `evidence`, and actionable `nextAction`. State check outcome as `pass`, `fail`, `blocked` or `not_run`. Do not claim integrated gates based on a worker's own checks. A worker that blocks must include the specific decision/action required.

## Integrated evidence input (coordinator-owned)

After fan-in, use `.demo-state/evidence.json` with this shape (sample is a hypothetical defect, not executed evidence):

```json
{
  "cyclesUsed": 1,
  "cycleLimit": 3,
  "tests": "fail",
  "staticChecks": "pass",
  "review": "not_run",
  "findings": [{"id":"F-1","owner":"frontend","kind":"repairable","requirement":"Reset page on filter change","evidence":"Browser check observed page 6 after filtering","nextAction":"Reset page on filter transition"}]
}
```

Tests and staticChecks are each `pass`, `fail`, `blocked`, or `not_run`. Review is `pass`, `fail`, `blocked`, or `not_run`. Do not use `pass` for a skipped gate. The routing script returns `repair` with owners, `review` (both gates passed but no review yet), `await_human_approval`, or `escalate` with a reason. It fails closed on invalid inputs or unclassified failures. All findings must be backed by actual evidence; sample inputs under `demo/graph/examples` are explicitly rehearsals, never live proof.
