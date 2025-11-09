/**
 * Backfill clinic_day column for existing patients
 * 
 * This script updates all existing patient records to populate the clinic_day column
 * by converting their createdAt timestamp to the Africa/Juba timezone.
 */

import { db } from '../db';
import { patients } from '@shared/schema';
import { eq, isNull } from 'drizzle-orm';
import { getClinicDayKey } from '@shared/clinic-date';

async function backfillClinicDays() {
  console.log('[Backfill] Starting clinic_day backfill for patients...');
  
  try {
    // Get all patients without clinic_day set
    const patientsToUpdate = await db
      .select()
      .from(patients)
      .where(isNull(patients.clinicDay));
    
    console.log(`[Backfill] Found ${patientsToUpdate.length} patients to update`);
    
    let updated = 0;
    let errors = 0;
    
    for (const patient of patientsToUpdate) {
      try {
        // Calculate clinic day from createdAt timestamp
        const createdAt = new Date(patient.createdAt);
        const clinicDay = getClinicDayKey(createdAt);
        
        // Update the patient record
        await db
          .update(patients)
          .set({ clinicDay })
          .where(eq(patients.id, patient.id));
        
        updated++;
        
        if (updated % 100 === 0) {
          console.log(`[Backfill] Progress: ${updated}/${patientsToUpdate.length} patients updated`);
        }
      } catch (error) {
        console.error(`[Backfill] Error updating patient ${patient.patientId}:`, error);
        errors++;
      }
    }
    
    console.log(`[Backfill] Completed! Updated ${updated} patients, ${errors} errors`);
  } catch (error) {
    console.error('[Backfill] Fatal error:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  backfillClinicDays()
    .then(() => {
      console.log('[Backfill] Success!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Backfill] Failed:', error);
      process.exit(1);
    });
}

export { backfillClinicDays };
