#!/usr/bin/env tsx

/**
 * Data migration script to fix incorrect clinic day keys in date-only columns
 * 
 * This script scans recent records and rewrites requestedDate/visitDate values
 * based on their createdAt timestamps using the Africa/Juba timezone.
 * 
 * Usage:
 *   npx tsx scripts/migrate-dates.ts [--days=60] [--dry-run]
 * 
 * Options:
 *   --days=N     Number of days to scan backwards (default: 30)
 *   --dry-run    Show what would be changed without making changes
 *   --help       Show this help message
 */

import { db } from '../server/db.js';
import { labTests, xrayExams, ultrasoundExams, treatments, encounters } from '@shared/schema';
import { getClinicDayKey } from '@shared/clinic-date';
import { eq, gte } from 'drizzle-orm';

interface MigrationOptions {
  days: number;
  dryRun: boolean;
}

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    days: 30,
    dryRun: false,
  };

  for (const arg of args) {
    if (arg === '--help') {
      console.log(`
Data Migration Script - Fix Clinic Day Keys

Usage:
  npx tsx scripts/migrate-dates.ts [options]

Options:
  --days=N     Number of days to scan backwards (default: 30)
  --dry-run    Show what would be changed without making changes
  --help       Show this help message

Examples:
  npx tsx scripts/migrate-dates.ts                    # Fix last 30 days
  npx tsx scripts/migrate-dates.ts --days=60          # Fix last 60 days
  npx tsx scripts/migrate-dates.ts --dry-run          # Preview changes
`);
      process.exit(0);
    } else if (arg.startsWith('--days=')) {
      options.days = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

async function migrateLabTests(cutoffDate: Date, dryRun: boolean): Promise<number> {
  console.log('\n📊 Migrating Lab Tests...');
  
  const records = await db.select()
    .from(labTests)
    .where(gte(labTests.createdAt, cutoffDate.toISOString()));
  
  console.log(`  Found ${records.length} lab tests to check`);
  
  let fixedCount = 0;
  
  for (const record of records) {
    const correctDayKey = getClinicDayKey(record.createdAt);
    
    if (record.requestedDate !== correctDayKey) {
      console.log(`  ⚠️  ${record.testId}: ${record.requestedDate} → ${correctDayKey}`);
      fixedCount++;
      
      if (!dryRun) {
        await db.update(labTests)
          .set({ requestedDate: correctDayKey })
          .where(eq(labTests.id, record.id));
      }
    }
  }
  
  console.log(`  ✓ Fixed ${fixedCount} lab tests`);
  return fixedCount;
}

async function migrateXrayExams(cutoffDate: Date, dryRun: boolean): Promise<number> {
  console.log('\n🩻 Migrating X-Ray Exams...');
  
  const records = await db.select()
    .from(xrayExams)
    .where(gte(xrayExams.createdAt, cutoffDate.toISOString()));
  
  console.log(`  Found ${records.length} X-ray exams to check`);
  
  let fixedCount = 0;
  
  for (const record of records) {
    const correctDayKey = getClinicDayKey(record.createdAt);
    
    if (record.requestedDate !== correctDayKey) {
      console.log(`  ⚠️  ${record.examId}: ${record.requestedDate} → ${correctDayKey}`);
      fixedCount++;
      
      if (!dryRun) {
        await db.update(xrayExams)
          .set({ requestedDate: correctDayKey })
          .where(eq(xrayExams.id, record.id));
      }
    }
  }
  
  console.log(`  ✓ Fixed ${fixedCount} X-ray exams`);
  return fixedCount;
}

async function migrateUltrasoundExams(cutoffDate: Date, dryRun: boolean): Promise<number> {
  console.log('\n🔬 Migrating Ultrasound Exams...');
  
  const records = await db.select()
    .from(ultrasoundExams)
    .where(gte(ultrasoundExams.createdAt, cutoffDate.toISOString()));
  
  console.log(`  Found ${records.length} ultrasound exams to check`);
  
  let fixedCount = 0;
  
  for (const record of records) {
    const correctDayKey = getClinicDayKey(record.createdAt);
    
    if (record.requestedDate !== correctDayKey) {
      console.log(`  ⚠️  ${record.examId}: ${record.requestedDate} → ${correctDayKey}`);
      fixedCount++;
      
      if (!dryRun) {
        await db.update(ultrasoundExams)
          .set({ requestedDate: correctDayKey })
          .where(eq(ultrasoundExams.id, record.id));
      }
    }
  }
  
  console.log(`  ✓ Fixed ${fixedCount} ultrasound exams`);
  return fixedCount;
}

async function migrateEncounters(cutoffDate: Date, dryRun: boolean): Promise<number> {
  console.log('\n👤 Migrating Encounters...');
  
  const records = await db.select()
    .from(encounters)
    .where(gte(encounters.createdAt, cutoffDate.toISOString()));
  
  console.log(`  Found ${records.length} encounters to check`);
  
  let fixedCount = 0;
  
  for (const record of records) {
    const correctDayKey = getClinicDayKey(record.createdAt);
    
    if (record.visitDate !== correctDayKey) {
      console.log(`  ⚠️  ${record.encounterId}: ${record.visitDate} → ${correctDayKey}`);
      fixedCount++;
      
      if (!dryRun) {
        await db.update(encounters)
          .set({ visitDate: correctDayKey })
          .where(eq(encounters.id, record.id));
      }
    }
  }
  
  console.log(`  ✓ Fixed ${fixedCount} encounters`);
  return fixedCount;
}

async function migrateTreatments(cutoffDate: Date, dryRun: boolean): Promise<number> {
  console.log('\n💊 Migrating Treatments...');
  
  const records = await db.select()
    .from(treatments)
    .where(gte(treatments.createdAt, cutoffDate.toISOString()));
  
  console.log(`  Found ${records.length} treatments to check`);
  
  let fixedCount = 0;
  
  for (const record of records) {
    const correctDayKey = getClinicDayKey(record.createdAt);
    
    if (record.visitDate !== correctDayKey) {
      console.log(`  ⚠️  ${record.treatmentId}: ${record.visitDate} → ${correctDayKey}`);
      fixedCount++;
      
      if (!dryRun) {
        await db.update(treatments)
          .set({ visitDate: correctDayKey })
          .where(eq(treatments.id, record.id));
      }
    }
  }
  
  console.log(`  ✓ Fixed ${fixedCount} treatments`);
  return fixedCount;
}

async function main() {
  const options = parseArgs();
  
  console.log('🏥 Medical Management System - Date Migration Tool');
  console.log('==================================================');
  console.log(`Timezone: Africa/Juba (UTC+2)`);
  console.log(`Scanning: Last ${options.days} days`);
  console.log(`Mode: ${options.dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update database)'}`);
  
  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made to the database');
  } else {
    console.log('\n⚠️  LIVE MODE - Database will be updated');
    console.log('   Press Ctrl+C within 5 seconds to cancel...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - options.days);
  
  console.log(`\nCutoff date: ${cutoffDate.toISOString()}`);
  console.log('Starting migration...\n');
  
  let totalFixed = 0;
  
  try {
    totalFixed += await migrateLabTests(cutoffDate, options.dryRun);
    totalFixed += await migrateXrayExams(cutoffDate, options.dryRun);
    totalFixed += await migrateUltrasoundExams(cutoffDate, options.dryRun);
    totalFixed += await migrateEncounters(cutoffDate, options.dryRun);
    totalFixed += await migrateTreatments(cutoffDate, options.dryRun);
    
    console.log('\n==================================================');
    console.log(`✅ Migration complete!`);
    console.log(`   Total records fixed: ${totalFixed}`);
    
    if (options.dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made');
      console.log('   Run without --dry-run to apply changes');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
