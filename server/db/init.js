const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../diary.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

async function initDatabase() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await db.exec(schema);
  console.log('Database initialized successfully');
  return db;
}

module.exports = { initDatabase };
