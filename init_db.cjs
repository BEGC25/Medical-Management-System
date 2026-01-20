const sqlite3 = require('better-sqlite3');
const fs = require('fs');

// Remove existing db
try {
  fs.unlinkSync('./clinic.db');
  console.log('Removed existing clinic.db');
} catch(e) {}

const db = new sqlite3('./clinic.db');

// Create users table with correct schema
const usersSQL = `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'reception',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

// Create services table with correct schema
const servicesSQL = `CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

// Create sessions table for express-session
const sessionsSQL = `CREATE TABLE sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expire INTEGER NOT NULL
)`;

// Create patients table
const patientsSQL = `CREATE TABLE patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age TEXT,
  gender TEXT,
  phone_number TEXT,
  village TEXT,
  emergency_contact TEXT,
  allergies TEXT,
  medical_history TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  patient_type TEXT,
  clinic_day TEXT
)`;

// Create treatments table
const treatmentsSQL = `CREATE TABLE treatments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  visit_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  chief_complaint TEXT,
  temperature REAL,
  blood_pressure TEXT,
  heart_rate INTEGER,
  weight REAL,
  examination TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_date TEXT,
  follow_up_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  clinic_day TEXT,
  payment_status TEXT
)`;

// Create lab_tests table
const labTestsSQL = `CREATE TABLE lab_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id TEXT NOT NULL UNIQUE,
  patient_id TEXT NOT NULL,
  category TEXT NOT NULL,
  tests TEXT NOT NULL,
  clinical_info TEXT,
  priority TEXT NOT NULL,
  requested_date TEXT NOT NULL,
  status TEXT NOT NULL,
  results TEXT,
  normal_values TEXT,
  result_status TEXT,
  completed_date TEXT,
  technician_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  specific_exam TEXT
)`;

// Create xray_exams table
const xrayExamsSQL = `CREATE TABLE xray_exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id TEXT NOT NULL UNIQUE,
  patient_id TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  body_part TEXT,
  clinical_indication TEXT,
  special_instructions TEXT,
  specific_exam TEXT,
  priority TEXT NOT NULL,
  requested_date TEXT NOT NULL,
  status TEXT NOT NULL,
  technical_quality TEXT,
  findings TEXT,
  impression TEXT,
  recommendations TEXT,
  report_status TEXT,
  report_date TEXT,
  radiologist TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const tables = [
  { name: 'users', sql: usersSQL },
  { name: 'services', sql: servicesSQL },
  { name: 'sessions', sql: sessionsSQL },
  { name: 'patients', sql: patientsSQL },
  { name: 'treatments', sql: treatmentsSQL },
  { name: 'lab_tests', sql: labTestsSQL },
  { name: 'xray_exams', sql: xrayExamsSQL },
];

for (const table of tables) {
  try {
    db.exec(table.sql);
    console.log('✓ Created ' + table.name + ' table');
  } catch (e) {
    console.error('✗ Error creating ' + table.name + ' table:', e.message);
  }
}

db.close();
console.log('✓ Database initialized successfully');
