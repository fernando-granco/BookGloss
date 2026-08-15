import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { afterAll, describe, expect, it } from "vitest";

const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");

// Guards the mistake this file was added for: a column default changed in schema.prisma
// without a matching migration, so a fresh `prisma migrate deploy` builds a database that
// silently disagrees with the schema every contributor generates their client from.
const workspace = mkdtempSync(join(tmpdir(), "bookgloss-schema-"));
afterAll(() => rmSync(workspace, { recursive: true, force: true }));

describe("migrations", () => {
  it("produce exactly the database described by schema.prisma", () => {
    const diff = execFileSync(process.execPath, [
      prismaCli, "migrate", "diff",
      "--from-migrations", "prisma/migrations",
      "--to-schema-datamodel", "prisma/schema.prisma",
      "--shadow-database-url", `file:${join(workspace, "shadow.db")}`,
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

    expect(diff).toContain("No difference detected");
  }, 120_000);
});
