/**
 * Backfill order_lines for existing pharmacy orders
 * 
 * This script creates order_lines for pharmacy orders that were created
 * before the order line creation logic was implemented. It uses the same
 * logic as the POST /api/pharmacy-orders endpoint but with serviceId: null.
 */

import { db } from '../db';
import { pharmacyOrders, orderLines } from '@shared/schema';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';
import { storage } from '../storage';

/**
 * Helper function to calculate pharmacy order price with proper fallback logic
 * (copied from routes.ts to avoid circular dependencies)
 */
async function calculatePharmacyOrderPriceHelper(
  order: any, 
  services: any[], 
  drugMap: Map<number, any>,
  storage: any
): Promise<number> {
  // Try to get price from service first (backward compatibility)
  const service = order.serviceId ? services.find((s: any) => s.id === order.serviceId) : null;
  
  // If no service, get price from drug inventory
  let price = service?.price;
  if (price === null || price === undefined) {
    if (order.drugId) {
      const drug = drugMap.get(order.drugId);
      if (drug) {
        price = drug.defaultPrice;
        
        // If drug has no defaultPrice, fallback to latest batch's unitCost
        if (price === null || price === undefined) {
          const latestBatch = await storage.getLatestBatchForDrug(order.drugId);
          if (latestBatch) {
            price = latestBatch.unitCost;
          }
        }
      }
    }
  }
  
  return price ?? 0;
}

async function backfillPharmacyOrderLines() {
  console.log('[Backfill] Starting order_lines backfill for pharmacy orders...');
  
  try {
    // Get all pharmacy orders that have an encounterId but no corresponding order line
    const allPharmacyOrders = await db
      .select()
      .from(pharmacyOrders)
      .where(isNotNull(pharmacyOrders.encounterId));
    
    console.log(`[Backfill] Found ${allPharmacyOrders.length} pharmacy orders with encounters`);
    
    // Filter out ones that already have order lines
    const ordersToBackfill = [];
    for (const order of allPharmacyOrders) {
      const existingOrderLine = await db
        .select()
        .from(orderLines)
        .where(
          and(
            eq(orderLines.relatedType, 'pharmacy_order'),
            eq(orderLines.relatedId, order.orderId)
          )
        )
        .limit(1);
      
      if (existingOrderLine.length === 0) {
        ordersToBackfill.push(order);
      }
    }
    
    console.log(`[Backfill] Found ${ordersToBackfill.length} pharmacy orders without order lines`);
    
    if (ordersToBackfill.length === 0) {
      console.log('[Backfill] No pharmacy orders need backfilling');
      return;
    }
    
    // Fetch drugs for price calculation
    const drugs = await storage.getDrugs(true);
    const drugMap = new Map(drugs.map((d: any) => [d.id, d]));
    
    let created = 0;
    let errors = 0;
    
    for (const pharmacyOrder of ordersToBackfill) {
      try {
        // Calculate unit price using the helper function
        const unitPrice = await calculatePharmacyOrderPriceHelper(
          pharmacyOrder,
          [], // Empty services array - pharmacy doesn't use services
          drugMap,
          storage
        );
        
        // Calculate total price based on quantity
        const quantity = (pharmacyOrder.quantity && pharmacyOrder.quantity > 0) 
          ? pharmacyOrder.quantity 
          : 1;
        const totalPrice = unitPrice * quantity;
        
        // Build description
        let description = `Pharmacy: ${pharmacyOrder.drugName || "Medication"}`;
        if (pharmacyOrder.dosage) {
          description += ` (${pharmacyOrder.dosage})`;
        }
        
        // Create order line WITHOUT requiring a service
        await storage.createOrderLine({
          encounterId: pharmacyOrder.encounterId,
          serviceId: null, // Pharmacy orders don't need a service
          relatedType: "pharmacy_order" as const,
          relatedId: pharmacyOrder.orderId,
          description,
          quantity,
          unitPriceSnapshot: unitPrice,
          totalPrice,
          department: "pharmacy" as const,
          orderedBy: "System (Backfill)",
        });
        
        created++;
        console.log(`[Backfill] Created order line for pharmacy order ${pharmacyOrder.orderId} (${created}/${ordersToBackfill.length})`);
      } catch (error) {
        console.error(`[Backfill] Error creating order line for ${pharmacyOrder.orderId}:`, error);
        errors++;
      }
    }
    
    console.log(`[Backfill] Completed! Created ${created} order lines, ${errors} errors`);
  } catch (error) {
    console.error('[Backfill] Fatal error:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  backfillPharmacyOrderLines()
    .then(() => {
      console.log('[Backfill] Success!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Backfill] Failed:', error);
      process.exit(1);
    });
}

export { backfillPharmacyOrderLines };
