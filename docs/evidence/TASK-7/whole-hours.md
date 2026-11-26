# Evidence — TASK-7 whole-hour estimates

- Revision: `aaee7d456527ae878a98c7f887bbc63e64258323` (`git rev-parse HEAD` → `aaee7d4` "Reject non-whole estimates with 422")
- Ran: 2026-11-26, 13:12–13:15 (UTC+2), Windows 11 Pro (10.0.26300), Node v25.2.1
- Who ran it: Claude Code (claude-opus-5-5), driven and reviewed by @JKord

## `npm test`

```text
> ws1-homework-starter@0.1.0 test
> vitest run

 RUN  v5.1.0 C:/Users/y.kordiuk/Projects/test/2026-spd-ws1-homework-starter

(node:114724) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
warning: in the working copy of 'db/migrations/001_a.sql', LF will be replaced by CRLF the next time Git touches it

 Test Files  2 passed (2)
      Tests  21 passed (21)
   Start at  13:12:55
   Duration  1.21s (tests 96%, import 2%, worker 1%)
```

Exit code: 0

## `npm run typecheck`

```text
> ws1-homework-starter@0.1.0 typecheck
> tsc --noEmit
```

Exit code: 0

## `node docs/ai/ci/trace-gate.mjs --base main --head HEAD --title "TASK-7 Whole-hour estimates" --key-pattern "TASK-[0-9]+"`

Run **before** the evidence commit — the expected red state (no `Evidence:` trailer yet), the same reason the
first CI run on the PR is red:

```text
key TASK-7 (from the PR title)
3 commit(s), 0 with Assisted-by
::error::no commit carries an Evidence: trailer (e.g. Evidence: docs/evidence/<KEY>/<slice>.md)
trace gate: FAIL (1 error(s))
```

Exit code: 1 (expected at this stage; the gate goes green after the evidence commit — see below)

## Environment

- All checks above are pure local runs (`vitest` + in-memory SQLite, `tsc`, node script) — no LLM, no network.
- The tests were NOT run with LiteLLM proxy variables stripped (`env -u ANTHROPIC_BASE_URL …`) in this session:
  the command was skipped. Nothing in the tested code paths references those variables (grep `lib/`, `app/` —
  no hits), so this is not expected to matter; noted here for transparency.

## Not verified

- AC2 over real HTTP (`POST /api/tasks` → 422/201 via `curl`): verified indirectly — the route's
  `RuleViolation` → 422 mapping (`app/api/tasks/route.ts`) is unchanged by this PR, and AC2's domain part is
  covered by the unit tests. A live dev-server check was not run.
- CI runs (trace gate on GitHub Actions): not yet run at the time of writing; red (missing evidence) and green
  (after this commit) run links are collected in the PR description.
