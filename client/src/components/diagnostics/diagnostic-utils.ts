/**
 * Shared utility functions for diagnostic modal formatting
 */

/**
 * Shorten verbose view descriptions to compact format
 * "AP and lateral view obtained" → "AP + Lateral"
 * "PA and lateral views" → "PA + Lateral"
 */
export function shortenViewDescription(views: string): string {
  const lowerViews = views.toLowerCase();
  
  if (lowerViews.includes("ap") && lowerViews.includes("lateral")) {
    return "AP + Lateral";
  }
  if (lowerViews.includes("pa") && lowerViews.includes("lateral")) {
    return "PA + Lateral";
  }
  if (lowerViews.includes("oblique") && lowerViews.includes("lateral")) {
    return "Oblique + Lateral";
  }
  if (lowerViews.includes("anterior") && lowerViews.includes("posterior")) {
    return "AP";
  }
  
  if (views.length > 30) {
    const viewTerms: string[] = [];
    if (lowerViews.includes("ap")) viewTerms.push("AP");
    if (lowerViews.includes("pa")) viewTerms.push("PA");
    if (lowerViews.includes("lateral")) viewTerms.push("Lateral");
    if (lowerViews.includes("oblique")) viewTerms.push("Oblique");
    if (lowerViews.includes("axial")) viewTerms.push("Axial");
    if (lowerViews.includes("lordotic")) viewTerms.push("Lordotic");
    
    if (viewTerms.length > 0) {
      return viewTerms.join(" + ");
    }
  }
  
  return views;
}

/**
 * Format exam label combining exam type with body part or scan region
 * For X-ray: "chest" + body part → "Chest — Body Part"
 * For Ultrasound: "abdominal" + scan region → "Abdominal — Scan Region"
 */
export function formatExamLabel(
  examType?: string | null, 
  bodyPart?: string | null, 
  scanRegion?: string | null
): string {
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  let parts: string[] = [];
  
  if (examType) {
    parts.push(capitalize(examType.trim()));
  }
  
  if (bodyPart && bodyPart.toLowerCase() !== examType?.toLowerCase()) {
    parts.push(capitalize(bodyPart.trim()));
  }
  
  if (scanRegion) {
    const scanLower = scanRegion.toLowerCase();
    const examLower = examType?.toLowerCase() || "";
    if (!scanLower.includes(examLower) && !examLower.includes(scanLower.split(" ")[0])) {
      parts.push(scanRegion.trim());
    } else if (scanRegion !== examType) {
      parts = [scanRegion.trim()];
    }
  }
  
  return parts.join(" — ");
}
