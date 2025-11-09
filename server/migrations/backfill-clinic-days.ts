/**
 * Data Migration: Backfill Clinic Day Keys
 * 
 * This script corrects historical records where requestedDate/visitDate
 * were stamped with UTC day instead of clinic day (Africa/Juba).
 * 
 * It converts createdAt timestamps to clinic day keys and updates
 * the date fields where they differ.
 * 
 * Features:
 * - Idempotent: Only updates rows where date doesn't match computed clinic day
 * - Dry-run mode: Preview changes without applying them
 * - Configurable window: Only backfill last N days (default 60)
 * - Progress reporting: Shows counts of updated rows
 * 
 * Usage:
 *   tsx server/migrations/backfill-clinic-days.ts [--dry-run] [--days=60]
 */

import { db } from '../db';
import { labTests, treatments, encounters } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { getClinicDayKey } from '@shared/clinic-date';

interface MigrationOptions {
  dryRun: boolean;
  days: number;
}

interface MigrationResult {
  labTests: {
    checked: number;
    updated: number;
    examples: Array<{ testId: string; oldDate: string; newDate: string; createdAt: string }>;
  };
  treatments: {
    checked: number;
    updated: number;
    examples: Array<{ treatmentId: string; oldDate: string; newDate: string; createdAt: string }>;
  };
  encounters: {
    checked: number;
    updated: number;
    examples: Array<{ encounterId: string; oldDate: string; newDate: string; createdAt: string }>;
  };
}

/**
 * Backfill lab tests requestedDate field
 */
async function backfillLabTests(options: MigrationOptions): Promise<MigrationResult['labTests']> {
  console.log(`\n📊 Backfilling lab_tests.requestedDate...`);
  
  // Calculate cutoff date (N days ago)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - options.days);
  const cutoffISO = cutoffDate.toISOString();
  
  console.log(`   Looking at records created after: ${cutoffISO.split('T')[0]}`);
  
  // Fetch all lab tests created in the window
  const allTests = await db.select()
    .from(labTests)
    .where(gte(labTests.createdAt, cutoffISO))
    .orderBy(labTests.createdAt);
  
  console.log(`   Found ${allTests.length} records to check`);
  
  let updatedCount = 0;
  const examples: MigrationResult['labTests']['examples'] = [];
  
  for (const test of allTests) {
    // Compute what the requestedDate should be based on createdAt
    const createdAtDate = new Date(test.createdAt);
    const expectedDayKey = getClinicDayKey(createdAtDate);
    
    // Check if it differs from current requestedDate
    if (test.requestedDate !== expectedDayKey) {
      if (examples.length < 5) {
        examples.push({
          testId: test.testId,
          oldDate: test.requestedDate,
          newDate: expectedDayKey,
          createdAt: test.createdAt,
        });
      }
      
      if (!options.dryRun) {
        // Update the record
        await db.update(labTests)
          .set({ requestedDate: expectedDayKey })
          .where(eq(labTests.testId, test.testId));
      }
      
      updatedCount++;
    }
  }
  
  return {
    checked: allTests.length,
    updated: updatedCount,
    examples,
  };
}

/**
 * Backfill treatments visitDate field
 */
async function backfillTreatments(options: MigrationOptions): Promise<MigrationResult['treatments']> {
  console.log(`\n🏥 Backfilling treatments.visitDate...`);
  
  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - options.days);
  const cutoffISO = cutoffDate.toISOString();
  
  console.log(`   Looking at records created after: ${cutoffISO.split('T')[0]}`);
  
  // Fetch all treatments created in the window
  const allTreatments = await db.select()
    .from(treatments)
    .where(gte(treatments.createdAt, cutoffISO))
    .orderBy(treatments.createdAt);
  
  console.log(`   Found ${allTreatments.length} records to check`);
  
  let updatedCount = 0;
  const examples: MigrationResult['treatments']['examples'] = [];
  
  for (const treatment of allTreatments) {
    // Compute what the visitDate should be based on createdAt
    const createdAtDate = new Date(treatment.createdAt);
    const expectedDayKey = getClinicDayKey(createdAtDate);
    
    // Check if it differs from current visitDate
    if (treatment.visitDate !== expectedDayKey) {
      if (examples.length < 5) {
        examples.push({
          treatmentId: treatment.treatmentId,
          oldDate: treatment.visitDate,
          newDate: expectedDayKey,
          createdAt: treatment.createdAt,
        });
      }
      
      if (!options.dryRun) {
        // Update the record
        await db.update(treatments)
          .set({ visitDate: expectedDayKey })
          .where(eq(treatments.treatmentId, treatment.treatmentId));
      }
      
      updatedCount++;
    }
  }
  
  return {
    checked: allTreatments.length,
    updated: updatedCount,
    examples,
  };
}

/**
 * Backfill encounters visitDate field
 */
async function backfillEncounters(options: MigrationOptions): Promise<MigrationResult['encounters']> {
  console.log(`\n🎫 Backfilling encounters.visitDate...`);
  
  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - options.days);
  const cutoffISO = cutoffDate.toISOString();
  
  console.log(`   Looking at records created after: ${cutoffISO.split('T')[0]}`);
  
  // Fetch all encounters created in the window
  const allEncounters = await db.select()
    .from(encounters)
    .where(gte(encounters.createdAt, cutoffISO))
    .orderBy(encounters.createdAt);
  
  console.log(`   Found ${allEncounters.length} records to check`);
  
  let updatedCount = 0;
  const examples: MigrationResult['encounters']['examples'] = [];
  
  for (const encounter of allEncounters) {
    // Compute what the visitDate should be based on createdAt
    const createdAtDate = new Date(encounter.createdAt);
    const expectedDayKey = getClinicDayKey(createdAtDate);
    
    // Check if it differs from current visitDate
    if (encounter.visitDate !== expectedDayKey) {
      if (examples.length < 5) {
        examples.push({
          encounterId: encounter.encounterId,
          oldDate: encounter.visitDate,
          newDate: expectedDayKey,
          createdAt: encounter.createdAt,
        });
      }
      
      if (!options.dryRun) {
        // Update the record
        await db.update(encounters)
          .set({ visitDate: expectedDayKey })
          .where(eq(encounters.encounterId, encounter.encounterId));
      }
      
      updatedCount++;
    }
  }
  
  return {
    checked: allEncounters.length,
    updated: updatedCount,
    examples,
  };
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Phase 2: Clinic Day Backfill Migration               ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const daysArg = args.find(arg => arg.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 60;
  
  const options: MigrationOptions = { dryRun, days };
  
  console.log(`\n⚙️  Configuration:`);
  console.log(`   Mode: ${dryRun ? '🔍 DRY RUN (no changes will be made)' : '✍️  LIVE (changes will be applied)'}`);
  console.log(`   Window: Last ${days} days`);
  
  if (dryRun) {
    console.log(`\n⚠️  DRY RUN MODE: No data will be modified`);
  }
  
  try {
    // Run backfills
    const labTestsResult = await backfillLabTests(options);
    const treatmentsResult = await backfillTreatments(options);
    const encountersResult = await backfillEncounters(options);
    
    // Print summary
    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║  Migration Summary                                     ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
    
    console.log(`\n📊 Lab Tests:`);
    console.log(`   Checked: ${labTestsResult.checked}`);
    console.log(`   ${dryRun ? 'Would update' : 'Updated'}: ${labTestsResult.updated}`);
    if (labTestsResult.examples.length > 0) {
      console.log(`\n   Example changes:`);
      labTestsResult.examples.forEach((ex, i) => {
        console.log(`   ${i + 1}. ${ex.testId}: ${ex.oldDate} → ${ex.newDate} (created: ${ex.createdAt.split('T')[0]})`);
      });
    }
    
    console.log(`\n🏥 Treatments:`);
    console.log(`   Checked: ${treatmentsResult.checked}`);
    console.log(`   ${dryRun ? 'Would update' : 'Updated'}: ${treatmentsResult.updated}`);
    if (treatmentsResult.examples.length > 0) {
      console.log(`\n   Example changes:`);
      treatmentsResult.examples.forEach((ex, i) => {
        console.log(`   ${i + 1}. ${ex.treatmentId}: ${ex.oldDate} → ${ex.newDate} (created: ${ex.createdAt.split('T')[0]})`);
      });
    }
    
    console.log(`\n🎫 Encounters:`);
    console.log(`   Checked: ${encountersResult.checked}`);
    console.log(`   ${dryRun ? 'Would update' : 'Updated'}: ${encountersResult.updated}`);
    if (encountersResult.examples.length > 0) {
      console.log(`\n   Example changes:`);
      encountersResult.examples.forEach((ex, i) => {
        console.log(`   ${i + 1}. ${ex.encounterId}: ${ex.oldDate} → ${ex.newDate} (created: ${ex.createdAt.split('T')[0]})`);
      });
    }
    
    const totalUpdated = labTestsResult.updated + treatmentsResult.updated + encountersResult.updated;
    
    if (dryRun) {
      console.log(`\n✅ Dry run complete. ${totalUpdated} records would be updated.`);
      console.log(`   Run without --dry-run to apply changes.`);
    } else {
      console.log(`\n✅ Migration complete. ${totalUpdated} records updated.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration };
