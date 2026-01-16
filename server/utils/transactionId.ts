/**
 * Transaction ID Generator Utility
 * 
 * Generates unique pharmacy transaction IDs in the format: TXNYYMMDDSSSrrrr
 * - TXN: Prefix (3 chars)
 * - YYMMDD: Date (6 chars) - Year, Month, Day
 * - SSS: Daily sequence (3 chars) - 001, 002, 003... (resets daily)
 * - rrrr: Random component (4 chars) - 1000-9999 (prevents prediction)
 * 
 * Examples:
 * - TXN2601160017423 (2026-01-16, sequence 1, random 7423)
 * - TXN2601160025891 (2026-01-16, sequence 2, random 5891)
 * - TXN2601170013456 (2026-01-17, sequence 1, random 3456)
 */

import { db } from '../db';
import { inventoryLedger } from '@shared/schema';
import { sql, and, gte, lt } from 'drizzle-orm';

/**
 * Generate a unique pharmacy transaction ID
 * 
 * @returns Promise<string> Unique transaction ID in format TXNYYMMDDSSSrrrr
 */
export async function generateTransactionId(): Promise<string> {
  const now = new Date();
  
  // Format date components
  const year = now.getFullYear().toString().slice(-2); // 26
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 01
  const day = now.getDate().toString().padStart(2, '0'); // 16
  const datePrefix = `${year}${month}${day}`; // 260116
  
  // Retry loop to handle potential race conditions
  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get today's date range in ISO format (for SQLite datetime comparison)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      
      const todayStartStr = todayStart.toISOString();
      const todayEndStr = todayEnd.toISOString();
      
      // Count transactions created today to get the daily sequence
      // Using SQL to ensure compatibility with both SQLite and PostgreSQL
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryLedger)
        .where(
          and(
            gte(inventoryLedger.createdAt, todayStartStr),
            lt(inventoryLedger.createdAt, todayEndStr)
          )
        );
      
      const todayCount = result[0]?.count || 0;
      const sequence = todayCount + 1;
      const seqPadded = sequence.toString().padStart(3, '0'); // 001
      
      // Random component (1000-9999) for uniqueness and unpredictability
      // This helps prevent collisions even if there's a race condition
      const random = Math.floor(1000 + Math.random() * 9000); // 1000-9999
      
      // Construct final transaction ID
      const transactionId = `TXN${datePrefix}${seqPadded}${random}`;
      
      // Verify uniqueness by checking if this ID already exists
      const existing = await db
        .select()
        .from(inventoryLedger)
        .where(sql`${inventoryLedger.transactionId} = ${transactionId}`)
        .limit(1);
      
      if (existing.length === 0) {
        // ID is unique, return it
        return transactionId;
      }
      
      // If ID exists (very rare due to random component), retry with different random number
      if (attempt === maxRetries - 1) {
        throw new Error('Failed to generate unique transaction ID after multiple attempts');
      }
      
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error('Error generating transaction ID:', error);
        
        // Fallback: use full timestamp-based ID with additional entropy to ensure uniqueness
        const timestamp = Date.now().toString();
        const fallbackRandom = Math.floor(1000 + Math.random() * 9000);
        return `TXN${timestamp}${fallbackRandom}`;
      }
      // Retry on error
    }
  }
  
  // This should never be reached due to the fallback in the catch block
  const timestamp = Date.now().toString();
  const fallbackRandom = Math.floor(1000 + Math.random() * 9000);
  return `TXN${timestamp}${fallbackRandom}`;
}

/**
 * Parse transaction ID to extract date and sequence information
 * 
 * @param transactionId - The transaction ID to parse
 * @returns Object with parsed components or null if invalid
 */
export function parseTransactionId(transactionId: string): {
  date: Date;
  sequence: number;
  random: number;
} | null {
  // Match format: TXNYYMMDDSSSrrrr
  const match = transactionId.match(/^TXN(\d{2})(\d{2})(\d{2})(\d{3})(\d{4})$/);
  
  if (!match) {
    return null;
  }
  
  const [, year, month, day, seq, rand] = match;
  
  // Since this is a new system (2026+), all 2-digit years represent 20XX
  // This will work correctly until year 2100
  const yy = parseInt(year, 10);
  const fullYear = 2000 + yy;
  const date = new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10));
  
  return {
    date,
    sequence: parseInt(seq, 10),
    random: parseInt(rand, 10),
  };
}

/**
 * Validate transaction ID format
 * 
 * @param transactionId - The transaction ID to validate
 * @returns boolean - True if valid format
 */
export function isValidTransactionId(transactionId: string): boolean {
  return /^TXN\d{2}\d{2}\d{2}\d{3}\d{4}$/.test(transactionId);
}
