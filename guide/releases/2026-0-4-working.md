# 2026.0.4 working correction

Status: draft public working edition. All eight final-edition gates remain pending.

The candidate carries forward PR #8's four Part IV chapters, agency review labs,
and roadmap. The [partial source review](2026-10-05-source-review.md) corrects
the expired catalog rows and records actual access dates for twelve sources.
Earlier edition content remains available in Git history.

The local plugin also receives reliability fixes: invalid JSON-RPC input no
longer terminates the MCP process; notifications cannot trigger writes; failed
checks are marked as tool errors; initialization refuses linked artifact paths
and copies contracts exclusively. The two deploy labs gain authenticated routes,
bounded requests, timeout and failure handling, and an actual Node entrypoint
for the request surface. Their documentation states the in-memory and dry-run
limitations. These checks do not establish live model quality, deployed cloud
behavior, durable storage, paid resource access, or final-edition certification.

Validation commands: `npm test` and `git diff --check`. The publish receipt must
record their observed outcome and the exact remote tree. No final-book reviewer
or cloud deployment is implied by a passing local command.
