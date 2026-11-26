<!-- owner: @JKord · why: a PR was merged where half the commits had no ticket key and no agent attribution, so the trace from ticket to merge broke and CI could not audit it · review-by: 2027-02-28 -->

# Commit trailers are mandatory

Every commit of a traced change ends with trailers (last paragraph of the message, one per line):

- `Refs: <KEY>` — **always**, e.g. `Refs: TASK-7`. The branch is named `<KEY>-<slug>`, the PR title starts with `<KEY>`.
- `Assisted-by: <tool> (<model>)` — when an agent wrote or changed any part of the commit; omit for human-only commits.
- `Evidence: docs/evidence/<KEY>/<slice>.md` — on the evidence commit; points to the file with commands, raw outputs, exit codes and the SHA they ran on.

Example of a full commit message:

```text
Reject fractional estimates

estimateHours must be a whole number 1..40; the API answers 422 otherwise.

Refs: TASK-7
Assisted-by: Claude Code (claude-opus-5-5)
Evidence: docs/evidence/TASK-7/whole-hours.md
```

Single-line form (git 2.32+; works in PowerShell, cmd and Git Bash):

```bash
git commit -m "Reject fractional estimates" --trailer "Refs: TASK-7" --trailer "Assisted-by: Claude Code (claude-opus-5-5)" --trailer "Evidence: docs/evidence/TASK-7/whole-hours.md"
```

Check what git actually parsed: `git log -1 --format="%(trailers)"`.

Why trailers: they survive rebases and tool changes, `git log` can filter on them, and CI (the trace gate) can check
them per commit. An "AI was used: yes/no" checkbox in a PR description can't be audited per commit.

A missing `Refs:` trailer makes the trace gate red. Fix a just-made local commit with
`git commit --amend --trailer "Refs: <KEY>"`; after a push, `git rebase` + `git push --force-with-lease`.
