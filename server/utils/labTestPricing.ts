import { db } from '../db';
import { labTests } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { OrderLine, Service } from "@shared/schema";

/**
 * Recalculates lab test order line prices from the service catalog.
 * This fixes historical data where prices were incorrectly set to only the first test's price
 * instead of the sum of all tests.
 * 
 * @param orderLines - Array of order lines to process
 * @param laboratoryServices - Array of active laboratory services from the catalog
 * @returns Promise resolving to order lines with corrected prices
 */
export async function recalculateLabTestPrices(
  orderLines: OrderLine[],
  laboratoryServices: Service[]
): Promise<OrderLine[]> {
  return Promise.all(orderLines.map(async (line) => {
    if (line.relatedType === 'lab_test' && line.relatedId) {
      try {
        // Get the lab test record to access the tests array
        const [labTest] = await db.select().from(labTests).where(eq(labTests.testId, line.relatedId));
        
        if (labTest && labTest.tests) {
          // Parse test names from the JSON array
          const testNames = JSON.parse(labTest.tests);
          let calculatedTotal = 0;
          
          testNames.forEach((testName: string) => {
            const service = laboratoryServices.find(s => 
              s.name.toLowerCase() === testName.toLowerCase() ||
              s.name.toLowerCase().includes(testName.toLowerCase()) ||
              testName.toLowerCase().includes(s.name.toLowerCase())
            );
            if (service) {
              calculatedTotal += service.price || 0;
            }
          });
          
          // If we found prices, use the calculated total
          if (calculatedTotal > 0) {
            return {
              ...line,
              unitPriceSnapshot: calculatedTotal,
              totalPrice: calculatedTotal,
            };
          }
        }
      } catch (err) {
        // If there's an error recalculating, just return the original line
        console.error(`Error recalculating lab test price for order line ${line.id}:`, err);
      }
    }
    return line;
  }));
}
