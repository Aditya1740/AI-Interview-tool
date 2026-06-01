const { Database } = require('node-sqlite3-wasm');
const path = require('path');
const fs = require('fs');
const { runMigrations } = require('./migrations');

const DB_PATH = path.join(__dirname, 'interview_platform.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const LOCK_PATH = DB_PATH + '.lock';

// Remove stale lock left by a previously crashed process
try { fs.rmdirSync(LOCK_PATH); } catch (_) {}

const db = new Database(DB_PATH);

db.run('PRAGMA foreign_keys = ON');

// Read and execute schema (creates tables only if missing)
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

// Apply additive migrations for any new columns introduced after initial release
runMigrations(db);

console.log('Database initialized at:', DB_PATH);

module.exports = db;
