import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

if (!process.argv.includes("--confirm"))
  throw new Error("Run with --confirm after reviewing this script.");

const db = postgres(process.env.POSTGRESURL!, { max: 1 });
const root = resolve(import.meta.dir, "..", "bot", "db", "migrations");
const journal = JSON.parse(
  await readFile(resolve(root, "meta", "_journal.json"), "utf8"),
) as { entries: { idx: number; tag: string; when: number }[] };

try {
  const [ledger] = await db<
    { count: number }[]
  >`select count(*)::int as count from drizzle.__drizzle_migrations`;
  if (ledger?.count !== 0)
    throw new Error("Migration ledger is not empty; no repair was made.");

  const required = [
    "guilds",
    "users",
    "tickets",
    "giveaways",
    "moderation_cases",
    "stat_days",
  ];
  const tables = await db<
    { table_name: string }[]
  >`select table_name from information_schema.tables where table_schema = 'public'`;
  const live = new Set(tables.map((row) => row.table_name));
  const missing = required.filter((table) => !live.has(table));
  if (missing.length)
    throw new Error(
      `Schema is not at migration 0009; missing ${missing.join(", ")}. No repair was made.`,
    );
  if (live.has("invite_members"))
    throw new Error("invite_members already exists; no repair was made.");

  const applied = journal.entries.filter((entry) => entry.idx <= 9);
  await db.begin(async (tx) => {
    for (const entry of applied) {
      const sql = await readFile(resolve(root, `${entry.tag}.sql`), "utf8");
      const hash = createHash("sha256").update(sql).digest("hex");
      await tx`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hash}, ${entry.when})`;
    }
  });
  console.log(
    `Recorded ${applied.length} already-applied migrations. Migration 0010 remains pending.`,
  );
} finally {
  await db.end();
}
