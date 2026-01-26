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
  // Cache lowercased service names for performance
  const serviceMap = new Map(
    laboratoryServices.map(s => [s.name.toLowerCase(), s])
  );

  return Promise.all(orderLines.map(async (line) => {
    if (line.relatedType === 'lab_test' && line.relatedId) {
      try {
        // Get the lab test record to access the tests array
        const [labTest] = await db.select().from(labTests).where(eq(labTests.testId, line.relatedId));
        
        if (labTest && labTest.tests) {
          let testNames: string[];
          try {
            // Parse test names from the JSON array
            testNames = JSON.parse(labTest.tests);
          } catch (parseError) {
            console.error(`Error parsing tests JSON for lab test ${line.relatedId}:`, parseError);
            return line; // Return original line if JSON is invalid
          }

          let calculatedTotal = 0;
          
          testNames.forEach((testName: string) => {
            const testNameLower = testName.toLowerCase();
            
            // Try exact match first
            let service = serviceMap.get(testNameLower);
            
            // If no exact match, try fuzzy matching
            if (!service) {
              service = laboratoryServices.find(s => 
                s.name.toLowerCase().includes(testNameLower) ||
                testNameLower.includes(s.name.toLowerCase())
              );
            }
            
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
