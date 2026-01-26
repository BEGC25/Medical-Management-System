import { db } from '../db';
import { labTests } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import type { OrderLine, Service, LabTest } from "@shared/schema";

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
  // Cache lowercased service names for exact match performance
  const serviceMap = new Map(
    laboratoryServices.map(s => [s.name.toLowerCase(), s])
  );
  
  // Build fuzzy match cache to avoid repeated linear searches
  const fuzzyMatchCache = new Map<string, Service | null>();

  // Collect all lab test related IDs first
  const labTestIds = orderLines
    .filter(line => line.relatedType === 'lab_test' && line.relatedId)
    .map(line => line.relatedId!);

  // Fetch all lab tests in a single query to avoid N+1 problem
  const labTestsMap = new Map<string, LabTest>();
  if (labTestIds.length > 0) {
    const labTestsData = await db.select()
      .from(labTests)
      .where(inArray(labTests.testId, labTestIds));
    
    labTestsData.forEach(lt => {
      labTestsMap.set(lt.testId, lt);
    });
  }

  // Helper function for fuzzy matching with caching
  const findServiceFuzzy = (testNameLower: string): Service | null => {
    if (fuzzyMatchCache.has(testNameLower)) {
      return fuzzyMatchCache.get(testNameLower)!;
    }
    
    const service = laboratoryServices.find(s => 
      s.name.toLowerCase().includes(testNameLower) ||
      testNameLower.includes(s.name.toLowerCase())
    ) ?? null;
    
    fuzzyMatchCache.set(testNameLower, service);
    return service;
  };

  // Process order lines with cached data
  return orderLines.map((line) => {
    if (line.relatedType === 'lab_test' && line.relatedId) {
      try {
        const labTest = labTestsMap.get(line.relatedId);
        
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
              service = findServiceFuzzy(testNameLower);
            }
            
            if (service) {
              calculatedTotal += service.price ?? 0;
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
  });
}
