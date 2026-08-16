const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_PATH || './data/app.db';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    lastfm_username TEXT PRIMARY KEY,
    session_key TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    to_fetch_user TEXT NOT NULL,
    to_receive_user TEXT NOT NULL,
    status TEXT NOT NULL,
    curr_track TEXT,
    curr_artist TEXT,
    curr_startsat DATETIME
  );  
`);

module.exports = db;