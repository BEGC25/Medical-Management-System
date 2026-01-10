/**
 * Authentication & Role-Based Access Control (RBAC) Configuration
 * 
 * This file defines:
 * - User roles and their permissions
 * - API route access control
 * - Navigation menu mappings
 */

// ===========================
// ROLE DEFINITIONS
// ===========================

export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  LAB: 'lab',
  RADIOLOGY: 'radiology',
  // Future roles (not yet implemented)
  RECEPTION: 'reception',
  PHARMACY: 'pharmacy',
  BILLING: 'billing',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// ===========================
// API ROUTE PERMISSIONS
// ===========================

/**
 * Defines which roles can access which API route patterns
 * Routes are matched using startsWith(), so "/api/patients" matches "/api/patients/*"
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Public routes (no auth required) - handled separately
  '/api/login': [],
  '/api/logout': [],
  
  // Patient management
  '/api/patients': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB, ROLES.RADIOLOGY, ROLES.RECEPTION],
  
  // Treatment & Encounters (Clinical)
  '/api/encounters': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTION],
  '/api/treatments': [ROLES.ADMIN, ROLES.DOCTOR],
  '/api/encounter-services': [ROLES.ADMIN, ROLES.DOCTOR],
  
  // Laboratory
  '/api/lab-tests': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB],
  '/api/lab-results': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB],
  
  // Radiology (X-Ray & Ultrasound)
  '/api/xray-exams': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RADIOLOGY],
  '/api/ultrasound-exams': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RADIOLOGY],
  
  // Pharmacy
  '/api/pharmacy': [ROLES.ADMIN, ROLES.DOCTOR],
  '/api/pharmacy-orders': [ROLES.ADMIN, ROLES.DOCTOR],
  
  // Payment & Billing
  '/api/payments': [ROLES.ADMIN, ROLES.RECEPTION],
  '/api/invoices': [ROLES.ADMIN, ROLES.RECEPTION],
  '/api/billing': [ROLES.ADMIN, ROLES.RECEPTION],
  '/api/order-lines': [ROLES.ADMIN, ROLES.RECEPTION],
  '/api/payment-items': [ROLES.ADMIN, ROLES.RECEPTION],
  
  // Service Management (Admin only)
  '/api/services': [ROLES.ADMIN, ROLES.RECEPTION],
  
  // User Management (Admin only)
  '/api/users': [ROLES.ADMIN],
  
  // Dashboard & Reports
  '/api/dashboard': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB, ROLES.RADIOLOGY, ROLES.RECEPTION],
  '/api/reports': [ROLES.ADMIN, ROLES.RECEPTION],
  '/api/all-results': [ROLES.ADMIN],
};

// ===========================
// FRONTEND NAVIGATION MAPPING
// ===========================

/**
 * Defines which menu items (routes) each role can see in the navigation
 */
export const ROLE_NAV_MAP: Record<UserRole, string[]> = {
  // Admin: See everything
  [ROLES.ADMIN]: [
    '/',
    '/patients',
    '/payment',
    '/laboratory',
    '/xray',
    '/ultrasound',
    '/treatment',
    '/pharmacy',
    '/reports/daily-cash',
    '/billing',
    '/all-results',
    '/service-management',
    '/users',
    '/reports',
  ],
  
  // Doctor: Treatment + clinically necessary pages
  [ROLES.DOCTOR]: [
    '/',
    '/patients',
    '/treatment',
    '/laboratory',
    '/xray',
    '/ultrasound',
    '/pharmacy',
  ],
  
  // Lab: Laboratory pages only
  [ROLES.LAB]: [
    '/',
    '/laboratory',
  ],
  
  // Radiology: X-Ray & Ultrasound only
  [ROLES.RADIOLOGY]: [
    '/',
    '/xray',
    '/ultrasound',
  ],
  
  // Reception: Front desk - patients, payments, and daily cash report
  [ROLES.RECEPTION]: [
    '/',
    '/patients',
    '/payment',
    '/reports/daily-cash',
  ],
  
  // Future roles (placeholders)
  [ROLES.PHARMACY]: ['/'],
  [ROLES.BILLING]: ['/'],
};

// ===========================
// PAGE-LEVEL PERMISSIONS
// ===========================

/**
 * Defines which roles can access which frontend pages/routes
 * Used by ProtectedRoute component
 */
export const PAGE_PERMISSIONS: Record<string, UserRole[]> = {
  // Dashboard - everyone
  '/': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB, ROLES.RADIOLOGY, ROLES.RECEPTION],
  
  // Patient management
  '/patients': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB, ROLES.RADIOLOGY, ROLES.RECEPTION],
  
  // Clinical pages
  '/treatment': [ROLES.ADMIN, ROLES.DOCTOR],
  
  // Diagnostics
  '/laboratory': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB],
  '/xray': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RADIOLOGY],
  '/ultrasound': [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RADIOLOGY],
  
  // Pharmacy
  '/pharmacy': [ROLES.ADMIN, ROLES.DOCTOR],
  
  // Financial
  '/payment': [ROLES.ADMIN, ROLES.RECEPTION],
  '/billing': [ROLES.ADMIN],
  '/reports/daily-cash': [ROLES.ADMIN, ROLES.RECEPTION],
  '/all-results': [ROLES.ADMIN],
  
  // Settings (Admin only)
  '/service-management': [ROLES.ADMIN],
  '/users': [ROLES.ADMIN],
  '/reports': [ROLES.ADMIN],
};

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Check if a user role has permission to access a specific route
 */
export function hasRoutePermission(userRole: UserRole, route: string): boolean {
  // Find matching route pattern
  for (const [pattern, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (route.startsWith(pattern)) {
      // Empty array means public route
      if (allowedRoles.length === 0) return true;
      // Check if user role is allowed
      return allowedRoles.includes(userRole);
    }
  }
  
  // Default: deny access if no pattern matches
  return false;
}

/**
 * Check if a user role can see a navigation item
 */
export function canSeeNavItem(userRole: UserRole, path: string): boolean {
  const allowedPaths = ROLE_NAV_MAP[userRole] || [];
  return allowedPaths.includes(path);
}

/**
 * Check if a user role can access a page
 */
export function canAccessPage(userRole: UserRole, path: string): boolean {
  const allowedRoles = PAGE_PERMISSIONS[path] || [];
  return allowedRoles.includes(userRole);
}

/**
 * Get all navigation items for a specific role
 */
export function getNavItemsForRole(userRole: UserRole): string[] {
  return ROLE_NAV_MAP[userRole] || [];
}
