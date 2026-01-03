/**
 * Add specific_exam column to ultrasound_exams table
 * 
 * This migration adds the specific_exam column to store detailed exam information
 * (e.g., "Renal (Kidneys & Bladder)") for better display and tracking.
 */

import Database from 'better-sqlite3';
import { join } from 'path';

async function addSpecificExamColumn() {
  console.log('[Migration] Adding specific_exam column to ultrasound_exams...');
  
  const dbPath = join(process.cwd(), 'clinic.db');
  const db = new Database(dbPath);
  
  try {
    // Check if the column already exists
    const tableInfo = db.prepare("PRAGMA table_info(ultrasound_exams)").all() as any[];
    const columnExists = tableInfo.some((col: any) => col.name === 'specific_exam');
    
    if (columnExists) {
      console.log('[Migration] Column specific_exam already exists, skipping...');
      db.close();
      return;
    }
    
    // Add the column
    db.prepare('ALTER TABLE ultrasound_exams ADD COLUMN specific_exam TEXT').run();
    
    console.log('[Migration] Successfully added specific_exam column');
    db.close();
  } catch (error) {
    db.close();
    console.error('[Migration] Error:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  addSpecificExamColumn()
    .then(() => {
      console.log('[Migration] Success!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Migration] Failed:', error);
      process.exit(1);
    });
}

export { addSpecificExamColumn };
