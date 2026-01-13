import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { OrderLine } from "@shared/schema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency for SSP (South Sudanese Pound) without decimals, with comma separation
 * @param amount - The amount to format (number or string)
 * @param currency - The currency symbol (defaults to 'SSP')
 * @returns Formatted currency string (e.g., "10,000 SSP")
 */
export function formatCurrency(amount: number | string, currency: string = 'SSP'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return `0 ${currency}`;
  
  // Format number with comma separation
  const formattedNumber = Math.round(numAmount).toLocaleString('en-US');
  return `${formattedNumber} ${currency}`;
}

/**
 * Calculate total from order lines
 * @param orderLines - Array of order lines
 * @returns Total amount
 */
export function calculateOrderLinesTotal(orderLines: OrderLine[]): number {
  return orderLines.reduce((sum, line) => {
    const price = typeof line.totalPrice === 'string' 
      ? parseFloat(line.totalPrice) 
      : line.totalPrice;
    return sum + (isNaN(price) ? 0 : price);
  }, 0);
}
