// Tests for the PreToolUse hook: each case pipes a JSON payload into the script
// (as Claude Code does) and asserts the exit code. See docs/ai/hook-evidence.md.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
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
