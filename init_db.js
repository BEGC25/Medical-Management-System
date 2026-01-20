const sqlite3 = require('better-sqlite3');
const fs = require('fs');
const db = new sqlite3('./clinic.db');

// Read the migration file
const migrationSql = fs.readFileSync('./migrations/0000_open_violations.sql', 'utf-8');

// Split by --> statement-breakpoint
const parts = migrationSql.split('-->').map(s => s.trim()).filter(s => s && !s.includes('statement-breakpoint'));

console.log('Found ' + parts.length + ' CREATE statements');

parts.forEach((stmt, i) => {
  if (stmt.startsWith('CREATE')) {
    console.log('Executing CREATE statement ' + (i + 1));
    // Convert PostgreSQL to SQLite
    const sqliteStmt = stmt
      .replace(/serial PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/text NOT NULL/g, 'TEXT NOT NULL')
      .replace(/real/g, 'REAL')
      .replace(/integer/g, 'INTEGER');
    
    try {
      db.exec(sqliteStmt);
      console.log('  ✓ Success');
    } catch (e) {
      console.error('  ✗ Error:', e.message);
    }
  }
});

// Create users table
const usersSQL = `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`;

try {
  db.exec(usersSQL);
  console.log('Created users table');
} catch (e) {
  console.error('Error creating users table:', e.message);
}

// Create services table
const servicesSQL = `CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cost REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`;

try {
  db.exec(servicesSQL);
  console.log('Created services table');
} catch (e) {
  console.error('Error creating services table:', e.message);
}

db.close();
console.log('Database initialized successfully');
