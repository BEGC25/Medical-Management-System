/**
 * Maps drug forms to their appropriate unit terminology
 * Follows pharmacy industry standards for inventory management
 */

export interface DrugFormUnit {
  singular: string;
  plural: string;
  short: string;
}

export const DRUG_FORM_UNITS: Record<string, DrugFormUnit> = {
  // Solid oral dosage forms
  'Tablet': { singular: 'tablet', plural: 'tablets', short: 'tabs' },
  'tablet': { singular: 'tablet', plural: 'tablets', short: 'tabs' },
  'Capsule': { singular: 'capsule', plural: 'capsules', short: 'caps' },
  'capsule': { singular: 'capsule', plural: 'capsules', short: 'caps' },
  'Pill': { singular: 'pill', plural: 'pills', short: 'pills' },
  'pill': { singular: 'pill', plural: 'pills', short: 'pills' },
  'Lozenge': { singular: 'lozenge', plural: 'lozenges', short: 'loz' },
  'lozenge': { singular: 'lozenge', plural: 'lozenges', short: 'loz' },
  
  // Liquid oral dosage forms
  'Syrup': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'syrup': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'Suspension': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'suspension': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'Solution': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'solution': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'Drops': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'drops': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'Elixir': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'elixir': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'Emulsion': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'emulsion': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  
  // Injectable forms
  'Injection': { singular: 'ampoule', plural: 'ampoules', short: 'amps' },
  'injection': { singular: 'ampoule', plural: 'ampoules', short: 'amps' },
  'Vial': { singular: 'vial', plural: 'vials', short: 'vials' },
  'vial': { singular: 'vial', plural: 'vials', short: 'vials' },
  'Ampoule': { singular: 'ampoule', plural: 'ampoules', short: 'amps' },
  'ampoule': { singular: 'ampoule', plural: 'ampoules', short: 'amps' },
  'Prefilled Syringe': { singular: 'syringe', plural: 'syringes', short: 'syr' },
  'prefilled syringe': { singular: 'syringe', plural: 'syringes', short: 'syr' },
  
  // Topical forms
  'Cream': { singular: 'tube', plural: 'tubes', short: 'tubes' },
  'cream': { singular: 'tube', plural: 'tubes', short: 'tubes' },
  'Ointment': { singular: 'tube', plural: 'tubes', short: 'tubes' },
  'ointment': { singular: 'tube', plural: 'tubes', short: 'tubes' },
  'Gel': { singular: 'tube', plural: 'tubes', short: 'tubes' },
  'gel': { singular: 'tube', plural: 'tubes', short: 'tubes' },
  'Lotion': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'lotion': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'Paste': { singular: 'tube', plural: 'tubes', short: 'tubes' },
  'paste': { singular: 'tube', plural: 'tubes', short: 'tubes' },
  'Foam': { singular: 'can', plural: 'cans', short: 'cans' },
  'foam': { singular: 'can', plural: 'cans', short: 'cans' },
  
  // Respiratory forms
  'Inhaler': { singular: 'inhaler', plural: 'inhalers', short: 'inhl' },
  'inhaler': { singular: 'inhaler', plural: 'inhalers', short: 'inhl' },
  'Nebulizer': { singular: 'vial', plural: 'vials', short: 'vials' },
  'nebulizer': { singular: 'vial', plural: 'vials', short: 'vials' },
  'Spray': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  'spray': { singular: 'bottle', plural: 'bottles', short: 'btls' },
  
  // Other forms
  'Suppository': { singular: 'suppository', plural: 'suppositories', short: 'supp' },
  'suppository': { singular: 'suppository', plural: 'suppositories', short: 'supp' },
  'Patch': { singular: 'patch', plural: 'patches', short: 'patch' },
  'patch': { singular: 'patch', plural: 'patches', short: 'patch' },
  'Powder': { singular: 'sachet', plural: 'sachets', short: 'sach' },
  'powder': { singular: 'sachet', plural: 'sachets', short: 'sach' },
  'Sachet': { singular: 'sachet', plural: 'sachets', short: 'sach' },
  'sachet': { singular: 'sachet', plural: 'sachets', short: 'sach' },
  'Granules': { singular: 'sachet', plural: 'sachets', short: 'sach' },
  'granules': { singular: 'sachet', plural: 'sachets', short: 'sach' },
  'Pessary': { singular: 'pessary', plural: 'pessaries', short: 'pess' },
  'pessary': { singular: 'pessary', plural: 'pessaries', short: 'pess' },
  'Insert': { singular: 'insert', plural: 'inserts', short: 'ins' },
  'insert': { singular: 'insert', plural: 'inserts', short: 'ins' },
  
  // Fallback for unknown forms
  'other': { singular: 'unit', plural: 'units', short: 'units' },
  'default': { singular: 'unit', plural: 'units', short: 'units' },
};

/**
 * Get the appropriate unit name for a drug form
 * Automatically handles singular/plural based on quantity
 * 
 * @param form - The drug form (e.g., "Tablet", "Capsule")
 * @param quantity - The quantity (for singular/plural handling)
 * @returns The appropriate unit name (e.g., "tablet", "tablets")
 */
export function getFormUnit(form: string, quantity: number = 2): string {
  const formUnit = DRUG_FORM_UNITS[form] || DRUG_FORM_UNITS['default'];
  return quantity === 1 ? formUnit.singular : formUnit.plural;
}

/**
 * Get the short form unit abbreviation
 * 
 * @param form - The drug form
 * @returns The abbreviated unit name (e.g., "tabs", "caps")
 */
export function getFormUnitShort(form: string): string {
  const formUnit = DRUG_FORM_UNITS[form] || DRUG_FORM_UNITS['default'];
  return formUnit.short;
}

/**
 * Format a quantity with its appropriate unit
 * 
 * @param quantity - The quantity
 * @param form - The drug form
 * @param useShort - Whether to use abbreviated form
 * @returns Formatted string (e.g., "979 tablets", "1 tablet")
 */
export function formatDrugQuantity(
  quantity: number, 
  form: string, 
  useShort: boolean = false
): string {
  if (useShort) {
    return `${quantity} ${getFormUnitShort(form)}`;
  }
  return `${quantity} ${getFormUnit(form, quantity)}`;
}
