import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH ?? "./data/movienight.db";

function open() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  const migrationsFolder = path.join(process.cwd(), "src/db/migrations");
  try {
    migrate(db, { migrationsFolder });
  } catch (e) {
    // Several processes (e.g. parallel build workers) can race to run the first migration.
    // The loser sees the winner's tables, so a second pass finds nothing left to do.
    migrate(db, { migrationsFolder });
    void e;
  }
  return db;
}

const g = globalThis as unknown as { __db?: ReturnType<typeof open> };
export const db = (g.__db ??= open());
export { schema };
