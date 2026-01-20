const sqlite3 = require('better-sqlite3');

const db = new sqlite3('./clinic.db');

// Generate a patient ID
function generatePatientId() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `P${year}${month}${randomNum}`;
}

// Sample patients to insert
const patients = [
  {
    patientId: generatePatientId(),
    firstName: 'Ahmed',
    lastName: 'Hassan',
    age: '35',
    gender: 'Male',
    phoneNumber: '+211912345678',
    village: 'Juba',
    createdAt: new Date().toISOString(),
  },
  {
    patientId: generatePatientId(),
    firstName: 'Amina',
    lastName: 'Ibrahim',
    age: '28',
    gender: 'Female',
    phoneNumber: '+211987654321',
    village: 'Kosti',
    createdAt: new Date().toISOString(),
  },
  {
    patientId: generatePatientId(),
    firstName: 'Mohammed',
    lastName: 'Ali',
    age: '45',
    gender: 'Male',
    phoneNumber: '+211933334444',
    village: 'Bahri',
    createdAt: new Date().toISOString(),
  },
  {
    patientId: generatePatientId(),
    firstName: 'Fatima',
    lastName: 'Rahman',
    age: '32',
    gender: 'Female',
    phoneNumber: '+211955556666',
    village: 'Omdurman',
    createdAt: new Date().toISOString(),
  },
  {
    patientId: generatePatientId(),
    firstName: 'Omar',
    lastName: 'Noor',
    age: '52',
    gender: 'Male',
    phoneNumber: '+211911112222',
    village: 'Khartoum',
    createdAt: new Date().toISOString(),
  },
];

// Insert patients
const insertStmt = db.prepare(`
  INSERT INTO patients 
  (patient_id, first_name, last_name, age, gender, phone_number, village, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

let insertedCount = 0;
for (const patient of patients) {
  try {
    insertStmt.run(
      patient.patientId,
      patient.firstName,
      patient.lastName,
      patient.age,
      patient.gender,
      patient.phoneNumber,
      patient.village,
      patient.createdAt
    );
    insertedCount++;
    console.log(`✓ Inserted patient: ${patient.firstName} ${patient.lastName} (${patient.patientId})`);
  } catch (e) {
    console.error(`✗ Error inserting patient: ${e.message}`);
  }
}

console.log(`\n✓ Successfully inserted ${insertedCount} test patients`);
db.close();
