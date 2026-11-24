// Tests for the PreToolUse hook: each case pipes a JSON payload into the script
// (as Claude Code does) and asserts the exit code. See docs/ai/hook-evidence.md.
import { spawnSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const hook = fileURLToPath(new URL("./protect-migrations.mjs", import.meta.url));

function runHook(payload: string) {
  return spawnSync(process.execPath, [hook], {
    input: payload,
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    encoding: "utf8",
  });
}

const payload = (file_path: string) =>
  JSON.stringify({ tool_name: "Edit", tool_input: { file_path } });

// On a case-sensitive FS (Linux CI) "DB/Migrations/…" is a genuinely different,
// non-existent path, so allowing it is correct — the case-variant test only
// applies where the FS resolves it to the applied migration.
const caseVariant = join(root, "DB", "Migrations", "001_create_tasks.sql");

it.runIf(existsSync(caseVariant))(
  "blocks an applied migration referenced with the wrong case",
  () => {
    const r = runHook(payload("DB/Migrations/001_create_tasks.sql"));
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/applied DB migration/);
  },
);

it("blocks a payload prefixed with a BOM (PowerShell pipes)", () => {
  const r = runHook(String.fromCodePoint(0xfeff) + payload("db/migrations/001_create_tasks.sql"));
  expect(r.status).toBe(2);
  expect(r.stderr).toMatch(/applied DB migration/);
});

it("blocks .env files regardless of name case", () => {
  const r = runHook(payload(".ENV"));
  expect(r.status).toBe(2);
  expect(r.stderr).toMatch(/env file/);
});

it("allows writing a new migration", () => {
  const r = runHook(payload("db/migrations/003_add_task_priority.sql"));
  expect(r.status).toBe(0);
});

it("allows editing a migration that exists but is not tracked by git yet", () => {
  // A migration the agent just created is untracked, so it stays editable until committed.
  const probe = join(root, "db", "migrations", "999_untracked_probe.sql");
  writeFileSync(probe, "-- probe: deleted by the test\n");
  try {
    const r = runHook(payload("db/migrations/999_untracked_probe.sql"));
    expect(r.status).toBe(0);
  } finally {
    rmSync(probe, { force: true });
  }
});
