/**
 * Utility functions for safe JSON serialization.
 * Handles BigInt values that PostgreSQL may return for integer columns.
 */

/**
 * Converts BigInt values to Numbers in an object for JSON serialization.
 * PostgreSQL's node-postgres driver returns BigInt for some integer columns,
 * which causes JSON.stringify to throw "TypeError: Do not know how to serialize a BigInt".
 * 
 * @param obj - The object to convert
 * @returns A new object with BigInt values converted to Numbers
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    // Convert BigInt to Number (safe for values < Number.MAX_SAFE_INTEGER)
    return Number(obj) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result as T;
  }
  
  return obj;
}
