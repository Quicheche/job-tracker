import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "jobs.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company     TEXT NOT NULL,
    title       TEXT NOT NULL,
    location    TEXT DEFAULT '',
    url         TEXT DEFAULT '',
    description TEXT DEFAULT '',
    status      TEXT DEFAULT 'saved',
    score       INTEGER,
    notes       TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now'))
  )
`);

export default db;
