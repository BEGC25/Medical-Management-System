/**
 * Determines if a lab test value is abnormal based on common indicators
 */
export function isAbnormalValue(value: string): boolean {
  if (!value) return false;
  
  const valueStr = value.toString().toLowerCase();
  
  // Common abnormal indicators
  const abnormalIndicators = [
    '+', '++', '+++',
    'positive',
    'seen',
    'turbid',
    'bloody',
    'p. falciparum',
    'p. vivax',
    'p. malariae',
    'p. ovale',
    '1:160',
    '1:320',
    'reactive'
  ];
  
  return abnormalIndicators.some(indicator => valueStr.includes(indicator.toLowerCase()));
}

/**
 * Gets the appropriate text color class for a lab result value
 */
export function getResultValueColor(value: string): string {
  return isAbnormalValue(value) 
    ? 'text-red-600 dark:text-red-400 font-bold' 
    : 'text-green-600 dark:text-green-400';
}
