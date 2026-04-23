const { Database } = require('node-sqlite3-wasm');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'interview_platform.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);

db.run('PRAGMA foreign_keys = ON');

// Read and execute schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

console.log('Database initialized at:', DB_PATH);

module.exports = db;
