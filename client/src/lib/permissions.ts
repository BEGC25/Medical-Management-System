/**
 * Permission System for Medical Management System
 * 
 * This module defines the permission structure and provides utilities
 * to determine what permissions each role has in the system.
 */

export interface Permissions {
  patientManagement: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  diagnostics: {
    laboratory: {
      view: boolean;
      create: boolean;
    };
    xray: {
      view: boolean;
      create: boolean;
    };
    ultrasound: {
      view: boolean;
      create: boolean;
    };
  };
  clinical: {
    treatment: boolean;
    pharmacy: boolean;
    prescribe: boolean;
  };
  financial: {
    viewReports: boolean;
    processPayments: boolean;
    viewInvoices: boolean;
    createInvoices: boolean;
    generateReports: boolean;
  };
  userManagement: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  settings: {
    serviceManagement: boolean;
    systemSettings: boolean;
  };
}

/**
 * Get permissions for a specific role
 * This is the single source of truth for role-based permissions
 */
export function getPermissionsByRole(role: string): Permissions {
  const roleNormalized = role.toLowerCase();

  switch (roleNormalized) {
    case 'admin':
      // Admin has ALL permissions
      return {
        patientManagement: {
          view: true,
          create: true,
          edit: true,
          delete: true,
        },
        diagnostics: {
          laboratory: {
            view: true,
            create: true,
          },
          xray: {
            view: true,
            create: true,
          },
          ultrasound: {
            view: true,
            create: true,
          },
        },
        clinical: {
          treatment: true,
          pharmacy: true,
          prescribe: true,
        },
        financial: {
          viewReports: true,
          processPayments: true,
          viewInvoices: true,
          createInvoices: true,
          generateReports: true,
        },
        userManagement: {
          view: true,
          create: true,
          edit: true,
          delete: true,
        },
        settings: {
          serviceManagement: true,
          systemSettings: true,
        },
      };

    case 'doctor':
      // Doctor: Clinical focus with patient and diagnostic access
      return {
        patientManagement: {
          view: true,
          create: true,
          edit: true,
          delete: false,
        },
        diagnostics: {
          laboratory: {
            view: true,
            create: true,
          },
          xray: {
            view: true,
            create: true,
          },
          ultrasound: {
            view: true,
            create: true,
          },
        },
        clinical: {
          treatment: true,
          pharmacy: true,
          prescribe: true,
        },
        financial: {
          viewReports: true,
          processPayments: false,
          viewInvoices: false,
          createInvoices: false,
          generateReports: false,
        },
        userManagement: {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        settings: {
          serviceManagement: false,
          systemSettings: false,
        },
      };

    case 'lab':
      // Lab: Laboratory focused with view-only for other diagnostics
      return {
        patientManagement: {
          view: true,
          create: false,
          edit: false,
          delete: false,
        },
        diagnostics: {
          laboratory: {
            view: true,
            create: true,
          },
          xray: {
            view: true,
            create: false,
          },
          ultrasound: {
            view: true,
            create: false,
          },
        },
        clinical: {
          treatment: false,
          pharmacy: false,
          prescribe: false,
        },
        financial: {
          viewReports: false,
          processPayments: false,
          viewInvoices: false,
          createInvoices: false,
          generateReports: false,
        },
        userManagement: {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        settings: {
          serviceManagement: false,
          systemSettings: false,
        },
      };

    case 'radiology':
      // Radiology: X-Ray and Ultrasound focused
      return {
        patientManagement: {
          view: true,
          create: false,
          edit: false,
          delete: false,
        },
        diagnostics: {
          laboratory: {
            view: true,
            create: false,
          },
          xray: {
            view: true,
            create: true,
          },
          ultrasound: {
            view: true,
            create: true,
          },
        },
        clinical: {
          treatment: false,
          pharmacy: false,
          prescribe: false,
        },
        financial: {
          viewReports: false,
          processPayments: false,
          viewInvoices: false,
          createInvoices: false,
          generateReports: false,
        },
        userManagement: {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        settings: {
          serviceManagement: false,
          systemSettings: false,
        },
      };

    case 'reception':
      // Reception: Patient management and financial operations
      return {
        patientManagement: {
          view: true,
          create: true,
          edit: true,
          delete: false,
        },
        diagnostics: {
          laboratory: {
            view: true,
            create: false,
          },
          xray: {
            view: true,
            create: false,
          },
          ultrasound: {
            view: true,
            create: false,
          },
        },
        clinical: {
          treatment: false,
          pharmacy: false,
          prescribe: false,
        },
        financial: {
          viewReports: true,
          processPayments: true,
          viewInvoices: true,
          createInvoices: true,
          generateReports: false,
        },
        userManagement: {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        settings: {
          serviceManagement: false,
          systemSettings: false,
        },
      };

    case 'pharmacy':
      // Pharmacy: Limited to pharmacy operations
      return {
        patientManagement: {
          view: true,
          create: false,
          edit: false,
          delete: false,
        },
        diagnostics: {
          laboratory: {
            view: false,
            create: false,
          },
          xray: {
            view: false,
            create: false,
          },
          ultrasound: {
            view: false,
            create: false,
          },
        },
        clinical: {
          treatment: false,
          pharmacy: true,
          prescribe: false,
        },
        financial: {
          viewReports: false,
          processPayments: false,
          viewInvoices: false,
          createInvoices: false,
          generateReports: false,
        },
        userManagement: {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        settings: {
          serviceManagement: false,
          systemSettings: false,
        },
      };

    default:
      // Default: No permissions for unknown roles
      return {
        patientManagement: {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        diagnostics: {
          laboratory: {
            view: false,
            create: false,
          },
          xray: {
            view: false,
            create: false,
          },
          ultrasound: {
            view: false,
            create: false,
          },
        },
        clinical: {
          treatment: false,
          pharmacy: false,
          prescribe: false,
        },
        financial: {
          viewReports: false,
          processPayments: false,
          viewInvoices: false,
          createInvoices: false,
          generateReports: false,
        },
        userManagement: {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        settings: {
          serviceManagement: false,
          systemSettings: false,
        },
      };
  }
}

/**
 * Count total granted permissions for a role
 */
export function countGrantedPermissions(permissions: Permissions): { granted: number; total: number } {
  let granted = 0;
  let total = 0;

  // Patient Management
  total += 4;
  if (permissions.patientManagement.view) granted++;
  if (permissions.patientManagement.create) granted++;
  if (permissions.patientManagement.edit) granted++;
  if (permissions.patientManagement.delete) granted++;

  // Diagnostics
  total += 6;
  if (permissions.diagnostics.laboratory.view) granted++;
  if (permissions.diagnostics.laboratory.create) granted++;
  if (permissions.diagnostics.xray.view) granted++;
  if (permissions.diagnostics.xray.create) granted++;
  if (permissions.diagnostics.ultrasound.view) granted++;
  if (permissions.diagnostics.ultrasound.create) granted++;

  // Clinical
  total += 3;
  if (permissions.clinical.treatment) granted++;
  if (permissions.clinical.pharmacy) granted++;
  if (permissions.clinical.prescribe) granted++;

  // Financial
  total += 5;
  if (permissions.financial.viewReports) granted++;
  if (permissions.financial.processPayments) granted++;
  if (permissions.financial.viewInvoices) granted++;
  if (permissions.financial.createInvoices) granted++;
  if (permissions.financial.generateReports) granted++;

  // User Management
  total += 4;
  if (permissions.userManagement.view) granted++;
  if (permissions.userManagement.create) granted++;
  if (permissions.userManagement.edit) granted++;
  if (permissions.userManagement.delete) granted++;

  // Settings
  total += 2;
  if (permissions.settings.serviceManagement) granted++;
  if (permissions.settings.systemSettings) granted++;

  return { granted, total };
}
