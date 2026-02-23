import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "meter.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
      CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        unit INTEGER NOT NULL CHECK(unit IN (1, 2)),
        utility TEXT NOT NULL CHECK(utility IN ('gas', 'water', 'electricity')),
        value REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_readings_lookup
      ON readings (unit, utility, date)
    `);
  }
  return db;
}

export interface Reading {
  id: number;
  date: string;
  unit: number;
  utility: "gas" | "water" | "electricity";
  value: number;
  created_at: string;
}

export interface ReadingInput {
  date: string;
  unit: number;
  utility: "gas" | "water" | "electricity";
  value: number;
}

export function getAllReadings(): Reading[] {
  return getDb()
    .prepare("SELECT * FROM readings ORDER BY date ASC, unit ASC, utility ASC")
    .all() as Reading[];
}

export function getReadingsFiltered(unit?: number, utility?: string): Reading[] {
  let sql = "SELECT * FROM readings WHERE 1=1";
  const params: Record<string, unknown> = {};

  if (unit) {
    sql += " AND unit = @unit";
    params.unit = unit;
  }
  if (utility) {
    sql += " AND utility = @utility";
    params.utility = utility;
  }

  sql += " ORDER BY date ASC";
  return getDb().prepare(sql).all(params) as Reading[];
}

export function createReading(input: ReadingInput): Reading {
  const stmt = getDb().prepare(
    "INSERT INTO readings (date, unit, utility, value) VALUES (@date, @unit, @utility, @value)"
  );
  const result = stmt.run(input);
  return getDb()
    .prepare("SELECT * FROM readings WHERE id = ?")
    .get(result.lastInsertRowid) as Reading;
}

export function updateReading(id: number, input: ReadingInput): Reading | null {
  const stmt = getDb().prepare(
    "UPDATE readings SET date = @date, unit = @unit, utility = @utility, value = @value WHERE id = @id"
  );
  const result = stmt.run({ ...input, id });
  if (result.changes === 0) return null;
  return getDb().prepare("SELECT * FROM readings WHERE id = ?").get(id) as Reading;
}

export function deleteReading(id: number): boolean {
  const result = getDb().prepare("DELETE FROM readings WHERE id = ?").run(id);
  return result.changes > 0;
}
