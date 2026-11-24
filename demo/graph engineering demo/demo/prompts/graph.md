# Graph engineering launch prompt

Select **Graph Orchestrator** in GitHub Copilot, then paste the following (or invoke `/deliver-pagination`):

> Deliver the customer pagination feature in `issues/customer-pagination.md`. I approve the shared API contract in `contracts/customer-pagination.md`, including replacing the customer-list array response with its documented envelope for this app only. Follow the engineering-graph skill and `workflows/feature-delivery.md`. Invoke the named API Engineer, Frontend Engineer and Test Engineer subagents, then the independent Feature Reviewer. Delegate independent tasks in parallel if supported. Use at most three shared edit-and-check cycles. Record actual subagent calls, results, check evidence and routing. Stop at verified success awaiting my approval or a blocker; do not edit outside scope or silently change requirements.
