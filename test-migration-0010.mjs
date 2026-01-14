#!/usr/bin/env node
/**
 * Test script for migration 0010
 * 
 * This script:
 * 1. Creates a test database with OLD schema (service_id NOT NULL)
 * 2. Inserts test data
 * 3. Applies the migration
 * 4. Verifies the migration worked correctly
 * 5. Tests creating a record with null service_id
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = './test_migration.db';

console.log('📝 Migration 0010 Test Script');
console.log('================================\n');

// Step 1: Create test database with OLD schema
console.log('Step 1: Creating test database with OLD schema (service_id NOT NULL)...');
const db = new Database(TEST_DB_PATH);

// Create pharmacy_orders table with OLD schema (service_id NOT NULL)
db.exec(`
  CREATE TABLE pharmacy_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    patient_id TEXT NOT NULL,
    treatment_id TEXT,
    encounter_id TEXT,
    service_id INTEGER NOT NULL,  -- OLD SCHEMA: Has NOT NULL constraint
    drug_id INTEGER,
    drug_name TEXT,
    dosage TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    instructions TEXT,
    route TEXT,
    duration TEXT,
    status TEXT NOT NULL DEFAULT 'prescribed',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    dispensed_by TEXT,
    dispensed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log('✅ Test database created with OLD schema\n');

// Step 2: Insert test data
console.log('Step 2: Inserting test data...');
const insertStmt = db.prepare(`
  INSERT INTO pharmacy_orders (order_id, patient_id, service_id, drug_id, drug_name, quantity, status, payment_status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

insertStmt.run('BGC-PH1', 'BGC1', 10, 5, 'Amoxicillin 500mg', 10, 'prescribed', 'unpaid');
insertStmt.run('BGC-PH2', 'BGC2', 11, 6, 'Paracetamol 500mg', 20, 'dispensed', 'paid');
insertStmt.run('BGC-PH3', 'BGC3', 12, 7, 'Ibuprofen 400mg', 15, 'prescribed', 'unpaid');

console.log('✅ Inserted 3 test records\n');

// Step 3: Verify OLD schema
console.log('Step 3: Verifying OLD schema...');
const tableInfo = db.prepare("PRAGMA table_info(pharmacy_orders)").all();
const serviceIdColumn = tableInfo.find(col => col.name === 'service_id');
console.log('service_id column info:', serviceIdColumn);
console.log(`  - NOT NULL: ${serviceIdColumn.notnull === 1 ? 'YES ❌' : 'NO ✅'}\n`);

// Step 4: Try to insert with null service_id (should fail with OLD schema)
console.log('Step 4: Testing insert with null service_id (should fail)...');
try {
  db.prepare(`
    INSERT INTO pharmacy_orders (order_id, patient_id, service_id, drug_id, drug_name, quantity, status, payment_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run('BGC-PH-NULL', 'BGC4', null, 8, 'Test Drug', 5, 'prescribed', 'unpaid');
  console.log('❌ UNEXPECTED: Insert with null service_id succeeded (should have failed)\n');
} catch (error) {
  console.log('✅ EXPECTED: Insert with null service_id failed');
  console.log(`   Error: ${error.message}\n`);
}

// Step 5: Apply migration
console.log('Step 5: Applying migration...');
const migrationSQL = readFileSync(join(process.cwd(), 'migrations', '0010_make_pharmacy_service_id_nullable.sql'), 'utf-8');
try {
  db.exec(migrationSQL);
  console.log('✅ Migration applied successfully\n');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  db.close();
  process.exit(1);
}

// Step 6: Verify NEW schema
console.log('Step 6: Verifying NEW schema...');
const newTableInfo = db.prepare("PRAGMA table_info(pharmacy_orders)").all();
const newServiceIdColumn = newTableInfo.find(col => col.name === 'service_id');
console.log('service_id column info:', newServiceIdColumn);
console.log(`  - NOT NULL: ${newServiceIdColumn.notnull === 1 ? 'YES ❌' : 'NO ✅'}\n`);

// Step 7: Verify data integrity
console.log('Step 7: Verifying data integrity...');
const records = db.prepare('SELECT * FROM pharmacy_orders WHERE order_id LIKE \'BGC-PH%\' ORDER BY id').all();
console.log(`Found ${records.length} records (expected 3):`);
records.forEach(record => {
  console.log(`  - ${record.order_id}: patient=${record.patient_id}, service_id=${record.service_id}, drug=${record.drug_name}`);
});
console.log();

if (records.length !== 3) {
  console.error('❌ Data integrity check failed: Expected 3 records, found', records.length);
  db.close();
  process.exit(1);
}
console.log('✅ All existing records preserved\n');

// Step 8: Test insert with null service_id (should succeed with NEW schema)
console.log('Step 8: Testing insert with null service_id (should succeed)...');
try {
  db.prepare(`
    INSERT INTO pharmacy_orders (order_id, patient_id, service_id, drug_id, drug_name, quantity, status, payment_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run('BGC-PH-NULL', 'BGC4', null, 8, 'Test Drug with NULL service_id', 5, 'prescribed', 'unpaid');
  
  const nullRecord = db.prepare('SELECT * FROM pharmacy_orders WHERE order_id = ?').get('BGC-PH-NULL');
  console.log('✅ Insert with null service_id succeeded');
  console.log(`   Record: ${JSON.stringify(nullRecord)}\n`);
} catch (error) {
  console.error('❌ UNEXPECTED: Insert with null service_id failed');
  console.error(`   Error: ${error.message}\n`);
  db.close();
  process.exit(1);
}

// Cleanup
console.log('Step 9: Cleanup...');
db.close();
console.log('✅ Test database closed\n');

console.log('================================');
console.log('✅ All tests passed!');
console.log('================================\n');

console.log('Test database created at:', TEST_DB_PATH);
console.log('You can inspect it with: sqlite3', TEST_DB_PATH);
console.log('To remove: rm', TEST_DB_PATH);
