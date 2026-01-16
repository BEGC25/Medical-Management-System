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
    const random = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    
    // Construct final transaction ID
    const transactionId = `TXN${datePrefix}${seqPadded}${random}`;
    
    return transactionId;
    
  } catch (error) {
    console.error('Error generating transaction ID:', error);
    
    // Fallback: use timestamp-based ID to ensure uniqueness
    const timestamp = Date.now().toString().slice(-8);
    const fallbackRandom = Math.floor(1000 + Math.random() * 9000);
    return `TXN${timestamp}${fallbackRandom}`;
  }
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
  
  // Construct date (assume 2000s for YY)
  const fullYear = 2000 + parseInt(year, 10);
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
