// Medical-Management-System/server/routes.ts

import express from "express";
import session from "express-session";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { eq, gte, lte, and, sql, isNotNull, ne } from "drizzle-orm";
import {
  insertPatientSchema,
  insertTreatmentSchema,
  insertLabTestSchema,
  insertXrayExamSchema,
  insertUltrasoundExamSchema,
  insertPharmacyOrderSchema,
  insertEncounterSchema,
  insertOrderLineSchema,
  insertInvoiceSchema,
  insertDrugSchema,
  insertDrugBatchSchema,
  insertInventoryLedgerSchema,
  patients,
  treatments,
  encounters,
  labTests,
  xrayExams,
  ultrasoundExams,
  normalizeRelatedType,
  relatedTypeToDepartment,
} from "@shared/schema";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { hasRoutePermission, ROLES, type UserRole } from "@shared/auth-roles";
import {
  hashPassword,
  verifyPassword,
  toSafeUser,
  toSessionUser,
  type SessionUser,
} from "./auth-service";
import { parseDateFilter } from "./utils/date";
import { parseClinicRangeParams, rangeToISOStrings, rangeToDayKeys } from "./utils/clinic-range";

// Extend express-session types to include our user
declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}

const router = express.Router();

/* ----------------------------- Auth guards ----------------------------- */

/**
 * Require authentication - checks if user has valid session
 */
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    console.log("[AUTH] Denied: No session found");
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Attach user to request for convenience
  req.user = req.session.user;
  next();
};

/**
 * Require specific role(s) - checks if user has any of the allowed roles
 * Admin always has access
 */
const requireRole = (...roles: UserRole[]) => {
  return (req: any, res: any, next: any) => {
    const user: SessionUser | undefined = req.session?.user;
    
    if (!user) {
      console.log("[RBAC] Denied: No user in session");
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Admin always has access
    if (user.role === ROLES.ADMIN) {
      console.log(`[RBAC] Allowed: ${user.username} is admin`);
      return next();
    }
    
    // Check if user has one of the required roles
    if (roles.includes(user.role)) {
      console.log(`[RBAC] Allowed: ${user.username} (${user.role}) accessing with role permission`);
      return next();
    }
    
    console.log(`[RBAC] Denied: ${user.username} (${user.role}) needs one of [${roles.join(', ')}]`);
    return res.status(403).json({ error: "Insufficient permissions", requiredRoles: roles });
  };
};

/**
 * Automatically check route permissions based on ROUTE_PERMISSIONS mapping
 */
const checkRoutePermission = (req: any, res: any, next: any) => {
  const user: SessionUser | undefined = req.session?.user;
  const path = req.path;
  
  if (!user) {
    console.log(`[RBAC] Denied: No user for ${path}`);
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Check if route requires specific permissions
  if (hasRoutePermission(user.role, path)) {
    console.log(`[RBAC] Allowed: ${user.username} (${user.role}) can access ${path}`);
    return next();
  }
  
  console.log(`[RBAC] Denied: ${user.username} (${user.role}) cannot access ${path}`);
  return res.status(403).json({ error: "Insufficient permissions for this resource" });
};

// Role-specific helpers
const requireAdmin = requireRole(ROLES.ADMIN);
const requireDoctor = requireRole(ROLES.DOCTOR);
const requireLab = requireRole(ROLES.LAB);
const requireRadiology = requireRole(ROLES.RADIOLOGY);

/* ----------------------------- Prepayment Enforcement Helpers ----------------------------- */

/**
 * Checks if a diagnostic update requires prepayment enforcement
 * 
 * Prepayment is required when:
 * - Status is changing to 'completed'
 * - Results/findings are being entered for the first time
 * - The exam is being marked as performed
 * 
 * @param currentData - Current diagnostic record from database
 * @param updateData - Proposed update data
 * @param diagnosticType - Type of diagnostic (lab_test, xray_exam, ultrasound_exam)
 * @returns true if update requires payment, false otherwise
 */
function requiresPrepayment(
  currentData: any,
  updateData: any,
  diagnosticType: "lab_test" | "xray_exam" | "ultrasound_exam"
): boolean {
  // If status is being changed to 'completed', payment is required
  if (updateData.status === 'completed' && currentData.status !== 'completed') {
    return true;
  }

  // If results/findings are being entered for the first time, payment is required
  if (diagnosticType === 'lab_test') {
    // Lab test: check if results are being added
    if (updateData.results && !currentData.results) {
      return true;
    }
  } else if (diagnosticType === 'xray_exam') {
    // X-ray: check if findings are being added
    if (updateData.findings && !currentData.findings) {
      return true;
    }
  } else if (diagnosticType === 'ultrasound_exam') {
    // Ultrasound: check if findings are being added
    if (updateData.findings && !currentData.findings) {
      return true;
    }
  }

  return false;
}

/**
 * Validates that a diagnostic exam has been paid before allowing result entry
 * 
 * @param paymentStatus - Current payment status
 * @param diagnosticType - Type of diagnostic
 * @param diagnosticId - ID of the diagnostic
 * @returns Error response object if not paid, null if paid
 */
function validatePrepayment(
  paymentStatus: string,
  diagnosticType: string,
  diagnosticId: string
): { status: number; json: any } | null {
  if (paymentStatus !== 'paid') {
    return {
      status: 402, // Payment Required
      json: {
        error: "Payment required",
        message: `Cannot perform ${diagnosticType.replace('_', ' ')} until payment has been received. Please collect payment before entering results.`,
        diagnosticId,
        paymentStatus,
      }
    };
  }
  return null;
}

/* ----------------------------- Public Authentication Routes ----------------------------- */
// ⚠️ IMPORTANT: These routes MUST be defined BEFORE the global requireAuth middleware
// so they remain accessible without authentication

// Login endpoint (public - no auth required)
router.post("/api/login", async (req, res) => {
  try {
    const schema = z.object({
      username: z.string().min(1, "Username is required"),
      password: z.string().min(1, "Password is required"),
    });

    const { username, password } = schema.parse(req.body);

    // Find user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      console.log(`[AUTH] Login failed: User '${username}' not found`);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      console.log(`[AUTH] Login failed: Invalid password for user '${username}'`);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Create session
    const sessionUser = toSessionUser(user);
    req.session.user = sessionUser;
    
    console.log(`[AUTH] Login successful: ${username} (${user.role})`);
    
    // Return safe user data (no password)
    res.json(toSafeUser(user));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid login data", details: error.errors });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Logout endpoint (public - doesn't require auth)
router.post("/api/logout", (req, res) => {
  const username = req.session.user?.username || "unknown";
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    console.log(`[AUTH] Logout successful: ${username}`);
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user (public - returns 401 if not authenticated)
router.get("/api/user", (req, res) => {
  // Check if session exists
  if (!req.session) {
    console.error("[AUTH] ERROR: req.session is undefined - session middleware not working!");
    return res.status(500).json({ error: "Session not configured" });
  }
  
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Return session user data
  const user: SessionUser = req.session.user;
  res.json(user);
});

/* -------------------------------- Debug Endpoints (Public) ----------------------------- */
// These debug endpoints are public (no auth required) for troubleshooting

/**
 * Debug endpoint: Get current clinic time and preset ranges
 * 
 * Returns diagnostic information about the current clinic day and
 * computed UTC boundaries for various presets. Useful for validating
 * that date range calculations are correct.
 * 
 * @example GET /api/debug/time
 */
router.get("/api/debug/time", async (_req, res) => {
  try {
    const { getClinicTimeInfo } = await import("./utils/clinicDay");
    const timeInfo = getClinicTimeInfo();
    res.json(timeInfo);
  } catch (error) {
    console.error("Error in debug/time endpoint:", error);
    res.status(500).json({ error: "Failed to get time info" });
  }
});

/**
 * Debug endpoint: Comprehensive clinic time diagnostics
 * 
 * Returns detailed information about clinic time calculations, preset parsing,
 * and day key generation. More comprehensive than /api/debug/time.
 * 
 * TODO: Remove this endpoint after validation
 * 
 * @example GET /api/debug/clinic-time
 */
router.get("/api/debug/clinic-time", async (_req, res) => {
  try {
    const { getClinicTimeInfo } = await import("./utils/clinicDay");
    const { getPresetDayKeys } = await import("./utils/clinic-range");
    const { parsePreset } = await import("./utils/preset");
    
    const timeInfo = getClinicTimeInfo();
    
    // Include preset day keys for comparison
    const presetKeys = {
      today: getPresetDayKeys('today'),
      yesterday: getPresetDayKeys('yesterday'),
      last7: getPresetDayKeys('last7'),
      last30: getPresetDayKeys('last30'),
    };
    
    // And parsed presets
    const parsedPresets = {
      today: parsePreset('today'),
      yesterday: parsePreset('yesterday'),
      last7: parsePreset('last7'),
      last30: parsePreset('last30'),
    };

    res.json({
      ...timeInfo,
      presetDayKeys: presetKeys,
      parsedPresets,
      note: 'This is a temporary debug endpoint and will be removed after validation',
    });
  } catch (error) {
    console.error('[debug-clinic-time] Error:', error);
    res.status(500).json({ 
      error: 'Failed to get clinic time info',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Debug endpoint: Echo parsed range parameters
 * 
 * Accepts the same query parameters as other endpoints (preset, from, to)
 * and returns the parsed date range. Useful for validating that range
 * parsing works as expected.
 * 
 * @example GET /api/debug/range?preset=today
 * @example GET /api/debug/range?from=2025-11-01&to=2025-11-08
 */
router.get("/api/debug/range", async (req, res) => {
  try {
    const { parseClinicRangeParams, rangeToDayKeys } = await import("./utils/clinic-range");
    const range = parseClinicRangeParams(req.query, true); // Enable deprecation warnings
    
    if (!range) {
      return res.json({
        range: null,
        message: "No filtering (preset=all or no parameters)",
      });
    }
    
    const dayKeys = rangeToDayKeys(range);
    
    res.json({
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
      dayKeys,
      query: req.query,
    });
  } catch (error) {
    console.error("Error in debug/range endpoint:", error);
    res.status(500).json({ error: "Failed to parse range" });
  }
});

// 🔒 GLOBAL AUTHENTICATION MIDDLEWARE
// Everything below this point requires a valid session
// To DISABLE authentication for troubleshooting, comment out the line below:
router.use("/api", requireAuth);
console.log("✅ Authentication is ENABLED - all API routes require valid session");

/* ------------------------------ Users (admin) ------------------------------ */

router.get("/api/users", async (_req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error in users route:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create user (admin only) - also available as /api/register for compatibility
router.post("/api/users", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      fullName: z.string().optional(),
      role: z.enum(["admin", "doctor", "lab", "radiology", "pharmacy", "reception"]),
    });

    const data = schema.parse(req.body);

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Create user with hashed password
    const user = await storage.createUser(data);
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    console.log(`[USER_MGT] User created: ${user.username} by ${req.session.user?.username}`);
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid user data", details: error.errors });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Alias for backward compatibility
router.post("/api/register", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      fullName: z.string().optional(),
      role: z.enum(["admin", "doctor", "lab", "radiology", "pharmacy", "reception"]),
    });

    const data = schema.parse(req.body);

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Create user with hashed password
    const user = await storage.createUser(data);
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    console.log(`[USER_MGT] User created: ${user.username} by ${req.session.user?.username}`);
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid user data", details: error.errors });
    }
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Delete user (admin only)
router.delete("/api/users/:id", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUser = req.session.user;
    
    // Prevent self-deletion
    if (currentUser?.id === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    
    await storage.deleteUser(userId);
    console.log(`[USER_MGT] User ${userId} deleted by ${currentUser?.username}`);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Reset user password (admin only)
router.put("/api/users/:id/reset-password", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const schema = z.object({
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
    });
    
    const { newPassword } = schema.parse(req.body);
    const hashedPassword = await hashPassword(newPassword);
    
    await storage.updateUserPassword(userId, hashedPassword);
    console.log(`[USER_MGT] Password reset for user ${userId} by ${req.session.user?.username}`);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid password data", details: error.errors });
    }
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Update user details (admin only)
router.put("/api/users/:id", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const schema = z.object({
      fullName: z.string().optional(),
      role: z.enum(["admin", "doctor", "lab", "radiology", "pharmacy", "reception"]).optional(),
    });
    
    const updates = schema.parse(req.body);
    await storage.updateUser(userId, updates);
    console.log(`[USER_MGT] User ${userId} updated by ${req.session.user?.username}`);
    res.json({ message: "User updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid user data", details: error.errors });
    }
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

/* ----------------------------- Patient counts ----------------------------- */

router.get("/api/patients/counts", async (req, res) => {
  try {
    const date = req.query.date as string;

    const todayPatientsArray = await storage.getTodaysPatients();
    const allPatientsArray = await storage.getPatients();
    const todayCount = todayPatientsArray.length;
    const allCount = allPatientsArray.length;

    let specificDateCount = 0;
    if (date) {
      const datePatientsArray = await storage.getPatientsByDate(date);
      specificDateCount = datePatientsArray.length;
    }

    res.json({
      today: todayCount,
      all: allCount,
      date: specificDateCount,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in patient counts route:", error);
    res.status(500).json({ error: "Failed to fetch patient counts" });
  }
});

/* -------------------------------- Patients -------------------------------- */

router.get("/api/patients", async (req, res) => {
  try {
    const search = req.query.search as string;
    const withStatus = req.query.withStatus === "true";
    const filterBy = req.query.filterBy as string; // "encounters" or "registration" (default)

    // Parse preset or custom range into clinic day keys
    const preset = req.query.preset as string;
    const from = req.query.from as string;
    const to = req.query.to as string;
    
    // Log legacy parameters with deprecation warning
    if ((req.query.today || req.query.date || req.query.startDate) && preset) {
      console.warn('[patients] DEPRECATED: Legacy date params ignored when preset is provided');
    }
    
    let startDayKey: string | undefined;
    let endDayKey: string | undefined;
    
    // Use direct day-key calculation for presets (avoids off-by-one errors)
    if (preset && preset.toLowerCase() === 'custom') {
      // Custom range: use from/to parameters directly
      if (from && to) {
        startDayKey = from;
        endDayKey = to;
        console.log(`[patients] Custom range: ${startDayKey} to ${endDayKey} (inclusive)`);
      } else {
        console.warn('[patients] Custom preset specified but from/to parameters missing');
      }
    } else if (preset) {
      // Standard preset (today, yesterday, last7, last30)
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys(preset);
      
      if (dayKeys) {
        startDayKey = dayKeys.startDayKey;
        endDayKey = dayKeys.endDayKey;
        console.log(`[patients] Preset ${preset}: ${startDayKey} to ${endDayKey} (inclusive)`);
      }
    } else if (from && to) {
      // Legacy: from/to without preset
      startDayKey = from;
      endDayKey = to;
      console.log(`[patients] Legacy custom range: ${startDayKey} to ${endDayKey} (inclusive)`);
    } else if (req.query.today === '1' || req.query.today === 'true') {
      // Legacy: today=1
      console.warn('[patients] DEPRECATED: today=1 parameter. Use preset=today instead.');
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys('today');
      if (dayKeys) {
        startDayKey = dayKeys.startDayKey;
        endDayKey = dayKeys.endDayKey;
      }
    }

    if (withStatus) {
      if (startDayKey && endDayKey) {
        // Date range filtering - check filterBy parameter
        if (filterBy === "encounters") {
          // Filter by encounter/visit dates (for Treatment page)
          const patients = await storage.getPatientsByEncounterDateRangeWithStatus(startDayKey, endDayKey);
          res.json(patients);
        } else {
          // Filter by registration dates (for Patients page - default)
          try {
            const patients = await storage.getPatientsByDateRangeWithStatus(startDayKey, endDayKey);
            res.json(patients);
          } catch (error) {
            console.error('[patients] Date range query failed, attempting fallback:', error);
            // Fallback: get all patients and filter client-side
            const allPatients = await storage.getPatientsWithStatus(search);
            res.json(allPatients);
          }
        }
      } else {
        const patients = await storage.getPatientsWithStatus(search);
        res.json(patients);
      }
    } else {
      if (startDayKey && endDayKey) {
        // Date range filtering
        try {
          const patients = await storage.getPatientsByDateRange(startDayKey, endDayKey);
          res.json(patients);
        } catch (error) {
          console.error('[patients] Date range query failed, attempting fallback:', error);
          // Fallback: get all patients
          const allPatients = await storage.getPatients(search);
          res.json(allPatients);
        }
      } else {
        const patients = await storage.getPatients(search);
        res.json(patients);
      }
    }
  } catch (error) {
    console.error("Error in patients route:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// Reports API - Get total patient count (MUST be before :patientId route)
router.get("/api/patients/count", async (_req, res) => {
  try {
    const patients = await storage.getPatients();
    res.json({ count: patients.length });
  } catch (error) {
    console.error("Error fetching patient count:", error);
    res.status(500).json({ error: "Failed to fetch patient count" });
  }
});

router.get("/api/patients/:patientId", async (req, res) => {
  try {
    const patient = await storage.getPatientByPatientId(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient" });
  }
});

/**
 * POST /api/patients - Register a new patient
 * 
 * This endpoint creates a new patient record along with an initial encounter.
 * Optionally collects consultation fee and creates payment record.
 * 
 * Request body:
 * {
 *   patientData: InsertPatient,        // Patient demographic and medical info
 *   collectConsultationFee: boolean,   // Whether to collect consultation fee at registration
 *   consultationServiceId?: number     // Optional: Specific consultation service to use
 * }
 * 
 * If consultationServiceId is not provided, the system will automatically select:
 * 1. Service with code "CONS-GEN" (General Consultation)
 * 2. Service with "General" in the name
 * 3. First active consultation service
 * 
 * Returns: Created patient object (201)
 * 
 * Error codes:
 * - 400: Invalid patient data, service validation errors (service not found/inactive/wrong category)
 * - 500: Server error during patient creation
 */
router.post("/api/patients", async (req, res) => {
  try {
    // The frontend will send { patientData: {...}, collectConsultationFee: true, consultationServiceId?: number }
    const { patientData, collectConsultationFee, consultationServiceId } = req.body;

    if (!patientData) {
      return res.status(400).json({ error: "Invalid request body. Expected { patientData, ... }" });
    }

    const data = insertPatientSchema.parse(patientData);
    const registeredBy = (req as any).user?.username || (req as any).user?.email || "System";

    // Call the new atomic storage function with optional consultationServiceId
    const result = await storage.registerNewPatientWorkflow(
      data,
      !!collectConsultationFee,
      registeredBy,
      consultationServiceId
    );

    res.status(201).json(result.patient); // Return just the patient, as before

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid patient data", details: error.errors });
    }
    if (error instanceof Error) {
      // Return 400 for service-related validation errors (not 500)
      // This provides clear feedback to reception staff about configuration issues
      if (error.message.includes("consultation service") || 
          error.message.includes("not found") || 
          error.message.includes("inactive") ||
          error.message.includes("UNIQUE constraint failed: patients.patient_id")) {
        return res.status(400).json({ error: error.message });
      }
    }
    console.error("Error in patient registration workflow:", error);
    res.status(500).json({ error: "Failed to create patient" });
  }
});

router.put("/api/patients/:patientId", async (req, res) => {
  try {
    const data = insertPatientSchema.partial().parse(req.body);
    const patient = await storage.updatePatient(req.params.patientId, data);
    res.json(patient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid patient data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update patient" });
  }
});

router.delete("/api/patients/:patientId", requireAdmin, async (req: any, res) => {
  try {
    const deletedBy = req.user.username || req.user.email || "admin";
    const deletionReason = req.body.reason as string | undefined;
    const forceDelete = req.body.forceDelete === true;

    const result = await storage.deletePatient(
      req.params.patientId,
      deletedBy,
      deletionReason,
      forceDelete
    );

    if (result.blocked) {
      return res.status(400).json({
        error: "Cannot delete patient",
        blockReasons: result.blockReasons,
        impactSummary: result.impactSummary,
      });
    }

    if (result.success) {
      res.json({
        message: "Patient deleted successfully",
        impactSummary: result.impactSummary,
        forceDeleted: result.forceDeleted || false,
      });
    } else {
      res.status(500).json({ error: "Failed to delete patient" });
    }
  } catch (error) {
    console.error("Error in delete patient route:", error);
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

/* -------------------------------- Treatments ------------------------------- */

router.get("/api/treatments", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const patientId = req.query.patientId as string;
    const encounterId = req.query.encounterId as string;

    // Parse preset or custom range into clinic day keys
    const preset = req.query.preset as string;
    const from = req.query.from as string;
    const to = req.query.to as string;
    
    let startDayKey: string | undefined;
    let endDayKey: string | undefined;
    
    // Use direct day-key calculation for presets
    if (preset && preset.toLowerCase() === 'custom') {
      // Custom range: use from/to parameters directly
      if (from && to) {
        startDayKey = from;
        endDayKey = to;
        console.log(`[treatments] Custom range: ${startDayKey} to ${endDayKey} (inclusive)`);
      } else {
        console.warn('[treatments] Custom preset specified but from/to parameters missing');
      }
    } else if (preset) {
      // Standard preset (today, yesterday, last7, last30)
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys(preset);
      
      if (dayKeys) {
        startDayKey = dayKeys.startDayKey;
        endDayKey = dayKeys.endDayKey;
        console.log(`[treatments] Preset ${preset}: ${startDayKey} to ${endDayKey} (inclusive)`);
      }
    } else if (from && to) {
      // Legacy: from/to without preset
      startDayKey = from;
      endDayKey = to;
      console.log(`[treatments] Legacy custom range: ${startDayKey} to ${endDayKey} (inclusive)`);
    } else if (req.query.today === '1' || req.query.today === 'true') {
      // Legacy: today=1
      console.warn('[treatments] DEPRECATED: today=1 parameter. Use preset=today instead.');
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys('today');
      if (dayKeys) {
        startDayKey = dayKeys.startDayKey;
        endDayKey = dayKeys.endDayKey;
      }
    }

    // Filter by encounterId if provided
    if (encounterId) {
      const treatments = await storage.getTreatmentsByEncounter(encounterId);
      res.json(treatments);
      return;
    }

    // Filter by patientId if provided
    if (patientId) {
      const treatments = await storage.getTreatmentsByPatient(patientId);
      res.json(treatments);
      return;
    }

    // Apply date range filtering if provided
    if (startDayKey && endDayKey) {
      const treatments = await storage.getTreatments(limit, startDayKey, endDayKey);
      res.json(treatments);
      return;
    }

    // Default: return all treatments with optional limit
    const treatments = await storage.getTreatments(limit);
    res.json(treatments);
  } catch (error) {
    console.error("Error fetching treatments:", error);
    res.status(500).json({ error: "Failed to fetch treatments" });
  }
});

router.get("/api/patients/:patientId/treatments", async (req, res) => {
  try {
    const treatments = await storage.getTreatmentsByPatient(req.params.patientId);
    res.json(treatments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch treatments" });
  }
});

router.post("/api/treatments", async (req, res) => {
  try {
    const data = insertTreatmentSchema.parse(req.body);
    const treatment = await storage.createTreatment(data);
    res.status(201).json(treatment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid treatment data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create treatment" });
  }
});

/* --------------------------------- Lab Tests -------------------------------- */

router.get("/api/lab-tests", async (req, res) => {
  try {
    const status = req.query.status as string;
    
    // Parse preset or custom range into clinic day keys
    const preset = req.query.preset as string;
    const from = req.query.from as string;
    const to = req.query.to as string;
    
    let filterStartDate: string | undefined;
    let filterEndDate: string | undefined;
    
    // Use direct day-key calculation for presets
    if (preset && preset.toLowerCase() === 'custom') {
      // Custom range: use from/to parameters directly
      if (from && to) {
        filterStartDate = from;
        filterEndDate = to;
        console.log(`[lab-tests] Custom range: ${filterStartDate} to ${filterEndDate} (inclusive)`);
      } else {
        console.warn('[lab-tests] Custom preset specified but from/to parameters missing');
      }
    } else if (preset) {
      // Standard preset (today, yesterday, last7, last30)
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys(preset);
      
      if (dayKeys) {
        filterStartDate = dayKeys.startDayKey;
        filterEndDate = dayKeys.endDayKey;
        console.log(`[lab-tests] Preset ${preset}: ${filterStartDate} to ${filterEndDate} (inclusive)`);
      }
    } else if (from && to) {
      // Legacy: from/to without preset
      filterStartDate = from;
      filterEndDate = to;
      console.log(`[lab-tests] Legacy custom range: ${filterStartDate} to ${filterEndDate} (inclusive)`);
    } else if (req.query.today === '1' || req.query.today === 'true') {
      // Legacy: today=1
      console.warn('[lab-tests] DEPRECATED: today=1 parameter. Use preset=today instead.');
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys('today');
      if (dayKeys) {
        filterStartDate = dayKeys.startDayKey;
        filterEndDate = dayKeys.endDayKey;
      }
    } else if (req.query.date) {
      // Legacy: date=YYYY-MM-DD
      const dateParam = req.query.date as string;
      console.warn(`[lab-tests] DEPRECATED: date=${dateParam} parameter. Use preset=custom&from=${dateParam}&to=${dateParam} instead.`);
      filterStartDate = dateParam;
      filterEndDate = dateParam;
    }
    
    // Pass null for exact date param (deprecated), use range instead
    const labTests = await storage.getLabTests(status, undefined, filterStartDate, filterEndDate);
    res.json(labTests);
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    res
      .status(500)
      .json({
        error:
          "Failed to fetch lab tests - Please check your connection and try again",
      });
  }
});

router.get("/api/patients/:patientId/lab-tests", async (req, res) => {
  try {
    const labTests = await storage.getLabTestsByPatient(req.params.patientId);
    res.json(labTests);
  } catch (error) {
    console.error("Error fetching patient lab tests:", error);
    res
      .status(500)
      .json({
        error:
          "Failed to fetch patient lab tests - Please verify the patient ID and try again",
      });
  }
});

router.post("/api/lab-tests", async (req, res) => {
  return res.status(400).json({ 
    error: "Direct lab test creation is blocked",
    message: "All diagnostic orders must go through POST /api/order-lines with a valid serviceId from Service Management",
    code: "DIRECT_CREATION_BLOCKED"
  });
});

router.put("/api/lab-tests/:testId", async (req, res) => {
  try {
    const data = req.body;
    
    // Get current lab test to check payment status and current state
    const allTests = await storage.getLabTests();
    const currentLabTest = allTests.find(t => t.testId === req.params.testId);
    
    if (!currentLabTest) {
      return res.status(404).json({ error: "Lab test not found" });
    }

    // PREPAYMENT ENFORCEMENT: Check if this update requires payment
    if (requiresPrepayment(currentLabTest, data, 'lab_test')) {
      const paymentError = validatePrepayment(
        currentLabTest.paymentStatus,
        'lab_test',
        req.params.testId
      );
      
      if (paymentError) {
        console.log(`[Lab Test Update] Payment required for ${req.params.testId}. Current status: ${currentLabTest.paymentStatus}`);
        return res.status(paymentError.status).json(paymentError.json);
      }
    }

    const labTest = await storage.updateLabTest(req.params.testId, data);
    res.json(labTest);
  } catch (error) {
    console.error("Error updating lab test:", error);
    res.status(500).json({ error: "Failed to update lab test" });
  }
});

// Cancel pending lab test (soft delete for audit trail)
router.delete("/api/lab-tests/:testId", async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Verify the test exists and get its status
    const allTests = await storage.getLabTests();
    const labTest = allTests.find(t => t.testId === testId);
    
    if (!labTest) {
      return res.status(404).json({ error: "Lab test not found" });
    }
    
    // Only allow deleting pending tests to prevent data loss
    if (labTest.status !== "pending") {
      return res.status(400).json({ error: "Can only delete pending tests" });
    }
    
    // Delete the lab test and associated order_lines
    const success = await storage.deleteLabTest(testId);
    if (success) {
      res.json({ message: "Lab test deleted successfully" });
    } else {
      res.status(404).json({ error: "Lab test not found" });
    }
  } catch (error) {
    console.error("Error deleting lab test:", error);
    res.status(500).json({ error: "Failed to delete lab test" });
  }
});

// Edit pending lab test (modify test selections)
router.patch("/api/lab-tests/:testId", async (req, res) => {
  try {
    const { testId } = req.params;
    const { tests, priority, clinicalInfo } = req.body;
    
    // Get all lab tests and find this one
    const allTests = await storage.getLabTests();
    const labTest = allTests.find(t => t.testId === testId);
    
    if (!labTest) {
      return res.status(404).json({ error: "Lab test not found" });
    }
    
    // Only allow editing pending tests
    if (labTest.status !== "pending") {
      return res.status(400).json({ error: "Can only edit pending tests" });
    }
    
    // Check permissions: admin or doctor only
    const allowedRoles = ["admin", "doctor"];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Only doctors and admins can edit lab tests" });
    }
    
    // Update the test
    const updateData: any = {};
    if (tests !== undefined) updateData.tests = tests;
    if (priority !== undefined) updateData.priority = priority;
    if (clinicalInfo !== undefined) updateData.clinicalInfo = clinicalInfo;
    
    const updatedTest = await storage.updateLabTest(testId, updateData);
    
    res.json(updatedTest);
  } catch (error) {
    console.error("Error editing lab test:", error);
    res.status(500).json({ error: "Failed to edit lab test" });
  }
});

/* -------------------------------- X-Ray Exams ------------------------------- */

router.get("/api/xray-exams", async (req, res) => {
  try {
    const status = req.query.status as string;
    
    // Parse preset or custom range into clinic day keys
    const preset = req.query.preset as string;
    const from = req.query.from as string;
    const to = req.query.to as string;
    
    let filterStartDate: string | undefined;
    let filterEndDate: string | undefined;
    
    // Use direct day-key calculation for presets
    if (preset && preset.toLowerCase() === 'custom') {
      // Custom range: use from/to parameters directly
      if (from && to) {
        filterStartDate = from;
        filterEndDate = to;
        console.log(`[xray-exams] Custom range: ${filterStartDate} to ${filterEndDate} (inclusive)`);
      } else {
        console.warn('[xray-exams] Custom preset specified but from/to parameters missing');
      }
    } else if (preset) {
      // Standard preset (today, yesterday, last7, last30)
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys(preset);
      
      if (dayKeys) {
        filterStartDate = dayKeys.startDayKey;
        filterEndDate = dayKeys.endDayKey;
        console.log(`[xray-exams] Preset ${preset}: ${filterStartDate} to ${filterEndDate} (inclusive)`);
      }
    } else if (from && to) {
      // Legacy: from/to without preset
      filterStartDate = from;
      filterEndDate = to;
      console.log(`[xray-exams] Legacy custom range: ${filterStartDate} to ${filterEndDate} (inclusive)`);
    } else if (req.query.today === '1' || req.query.today === 'true') {
      // Legacy: today=1
      console.warn('[xray-exams] DEPRECATED: today=1 parameter. Use preset=today instead.');
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys('today');
      if (dayKeys) {
        filterStartDate = dayKeys.startDayKey;
        filterEndDate = dayKeys.endDayKey;
      }
    } else if (req.query.date) {
      // Legacy: date=YYYY-MM-DD
      const dateParam = req.query.date as string;
      console.warn(`[xray-exams] DEPRECATED: date=${dateParam} parameter. Use preset=custom&from=${dateParam}&to=${dateParam} instead.`);
      filterStartDate = dateParam;
      filterEndDate = dateParam;
    }
    
    // Pass null for exact date param (deprecated), use range instead
    const xrayExams = await storage.getXrayExams(status, undefined, filterStartDate, filterEndDate);
    res.json(xrayExams);
  } catch (error) {
    console.error("Error fetching X-ray exams:", error);
    res
      .status(500)
      .json({
        error:
          "Failed to fetch X-ray exams - Please check your connection and try again",
      });
  }
});

router.get("/api/patients/:patientId/xray-exams", async (req, res) => {
  try {
    const xrayExams = await storage.getXrayExamsByPatient(req.params.patientId);
    res.json(xrayExams);
  } catch (error) {
    console.error("Error fetching patient X-ray exams:", error);
    res
      .status(500)
      .json({
        error:
          "Failed to fetch patient X-ray exams - Please verify the patient ID and try again",
      });
  }
});

// BLOCKED: Direct X-Ray exam creation is disabled. Use order-lines endpoint instead.
// This endpoint now only blocks direct creation to enforce catalog-driven ordering.
router.post("/api/xray-exams", async (req, res) => {
  return res.status(400).json({ 
    error: "Direct X-ray exam creation is blocked",
    message: "All diagnostic orders must go through POST /api/order-lines with a valid serviceId from Service Management",
    code: "DIRECT_CREATION_BLOCKED"
  });
});

router.put("/api/xray-exams/:examId", async (req, res) => {
  try {
    const data = req.body;
    
    // Get current X-ray exam to check payment status and current state
    const allExams = await storage.getXrayExams();
    const currentExam = allExams.find(e => e.examId === req.params.examId);
    
    if (!currentExam) {
      return res.status(404).json({ error: "X-ray exam not found" });
    }

    // PREPAYMENT ENFORCEMENT: Check if this update requires payment
    if (requiresPrepayment(currentExam, data, 'xray_exam')) {
      const paymentError = validatePrepayment(
        currentExam.paymentStatus,
        'xray_exam',
        req.params.examId
      );
      
      if (paymentError) {
        console.log(`[X-Ray Update] Payment required for ${req.params.examId}. Current status: ${currentExam.paymentStatus}`);
        return res.status(paymentError.status).json(paymentError.json);
      }
    }

    const xrayExam = await storage.updateXrayExam(req.params.examId, data);
    res.json(xrayExam);
  } catch (error) {
    console.error("Error updating X-ray exam:", error);
    res.status(500).json({ error: "Failed to update X-ray exam" });
  }
});

router.delete("/api/xray-exams/:examId", async (req, res) => {
  try {
    const success = await storage.deleteXrayExam(req.params.examId);
    if (success) {
      res.json({ message: "X-ray exam deleted successfully" });
    } else {
      res.status(404).json({ error: "X-ray exam not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete X-ray exam" });
  }
});

/* ------------------------------ Ultrasound Exams --------------------------- */

router.get("/api/ultrasound-exams", async (req, res) => {
  try {
    const status = req.query.status as string;
    
    // Parse preset or custom range into clinic day keys
    const preset = req.query.preset as string;
    const from = req.query.from as string;
    const to = req.query.to as string;
    
    let filterStartDate: string | undefined;
    let filterEndDate: string | undefined;
    
    // Use direct day-key calculation for presets
    if (preset && preset.toLowerCase() === 'custom') {
      // Custom range: use from/to parameters directly
      if (from && to) {
        filterStartDate = from;
        filterEndDate = to;
        console.log(`[ultrasound-exams] Custom range: ${filterStartDate} to ${filterEndDate} (inclusive)`);
      } else {
        console.warn('[ultrasound-exams] Custom preset specified but from/to parameters missing');
      }
    } else if (preset) {
      // Standard preset (today, yesterday, last7, last30)
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys(preset);
      
      if (dayKeys) {
        filterStartDate = dayKeys.startDayKey;
        filterEndDate = dayKeys.endDayKey;
        console.log(`[ultrasound-exams] Preset ${preset}: ${filterStartDate} to ${filterEndDate} (inclusive)`);
      }
    } else if (from && to) {
      // Legacy: from/to without preset
      filterStartDate = from;
      filterEndDate = to;
      console.log(`[ultrasound-exams] Legacy custom range: ${filterStartDate} to ${filterEndDate} (inclusive)`);
    } else if (req.query.today === '1' || req.query.today === 'true') {
      // Legacy: today=1
      console.warn('[ultrasound-exams] DEPRECATED: today=1 parameter. Use preset=today instead.');
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys('today');
      if (dayKeys) {
        filterStartDate = dayKeys.startDayKey;
        filterEndDate = dayKeys.endDayKey;
      }
    }
    
    const ultrasoundExams = await storage.getUltrasoundExams(status, filterStartDate, filterEndDate);
    res.json(ultrasoundExams);
  } catch (error) {
    console.error("Error fetching ultrasound exams:", error);
    res
      .status(500)
      .json({
        error:
          "Failed to fetch ultrasound exams - Please check your connection and try again",
      });
  }
});

router.get("/api/patients/:patientId/ultrasound-exams", async (req, res) => {
  try {
    const ultrasoundExams = await storage.getUltrasoundExamsByPatient(
      req.params.patientId
    );
    res.json(ultrasoundExams);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ultrasound exams" });
  }
});

// BLOCKED: Direct Ultrasound exam creation is disabled. Use order-lines endpoint instead.
// This endpoint now only blocks direct creation to enforce catalog-driven ordering.
router.post("/api/ultrasound-exams", async (req, res) => {
  return res.status(400).json({ 
    error: "Direct ultrasound exam creation is blocked",
    message: "All diagnostic orders must go through POST /api/order-lines with a valid serviceId from Service Management",
    code: "DIRECT_CREATION_BLOCKED"
  });
});

router.put("/api/ultrasound-exams/:examId", async (req, res) => {
  try {
    const data = req.body;
    
    // Get current ultrasound exam to check payment status and current state
    const allExams = await storage.getUltrasoundExams();
    const currentExam = allExams.find(e => e.examId === req.params.examId);
    
    if (!currentExam) {
      return res.status(404).json({ error: "Ultrasound exam not found" });
    }

    // PREPAYMENT ENFORCEMENT: Check if this update requires payment
    if (requiresPrepayment(currentExam, data, 'ultrasound_exam')) {
      const paymentError = validatePrepayment(
        currentExam.paymentStatus,
        'ultrasound_exam',
        req.params.examId
      );
      
      if (paymentError) {
        console.log(`[Ultrasound Update] Payment required for ${req.params.examId}. Current status: ${currentExam.paymentStatus}`);
        return res.status(paymentError.status).json(paymentError.json);
      }
    }

    const ultrasoundExam = await storage.updateUltrasoundExam(
      req.params.examId,
      data
    );
    res.json(ultrasoundExam);
  } catch (error) {
    console.error("Error updating ultrasound exam:", error);
    res.status(500).json({ error: "Failed to update ultrasound exam" });
  }
});

router.delete("/api/ultrasound-exams/:examId", async (req, res) => {
  try {
    const success = await storage.deleteUltrasoundExam(req.params.examId);
    if (success) {
      res.json({ message: "Ultrasound exam deleted successfully" });
    } else {
      res.status(404).json({ error: "Ultrasound exam not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete ultrasound exam" });
  }
});

/* -------------------------------- Dashboard -------------------------------- */

router.get("/api/dashboard/stats", async (req, res) => {
  try {
    // Dashboard always shows TODAY only - ignore any client-provided preset
    // This ensures the dashboard remains focused on current day activity
    const { parsePreset } = await import('./utils/preset');
    const todayPreset = parsePreset('today');
    
    console.log("Dashboard stats route - hard-coded to TODAY", { 
      startKey: todayPreset.startKey, 
      endKey: todayPreset.endKey 
    });
    
    const stats = await storage.getDashboardStats(todayPreset.startKey, todayPreset.endKey);
    console.log("Dashboard stats result:", stats);
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats route error:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard stats",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/api/dashboard/recent-patients", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const patients = await storage.getRecentPatients(limit);
    res.json(patients);
  } catch (error) {
    console.error("Recent patients error:", error);
    res.status(500).json({
      error: "Failed to fetch recent patients",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/api/dashboard/patient-flow", async (req, res) => {
  try {
    const flowData = await storage.getPatientFlowData();
    res.json(flowData);
  } catch (error) {
    console.error("Patient flow error:", error);
    res.status(500).json({
      error: "Failed to fetch patient flow data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/api/dashboard/outstanding-payments", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const outstandingPayments = await storage.getOutstandingPayments(limit);
    res.json(outstandingPayments);
  } catch (error) {
    console.error("Outstanding payments error:", error);
    res.status(500).json({
      error: "Failed to fetch outstanding payments",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/api/dashboard/results-ready", async (req, res) => {
  try {
    const results = await storage.getResultsReadyForReview(10);
    res.json(results);
  } catch (error) {
    console.error("Results ready error:", error);
    res.status(500).json({
      error: "Failed to fetch results ready for review",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/* ---------------------------- Object Storage API --------------------------- */

// Upload (🔒 keep authenticated)
router.post("/api/objects/upload", async (_req, res) => {
  try {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  } catch (error) {
    console.error("Error getting upload URL:", error);
    res.status(500).json({ error: "Failed to get upload URL" });
  }
});

// Serve objects (NOTE: currently public; lock down later if needed)
router.get("/objects/:objectPath(*)", async (req, res) => {
  try {
    const objectStorageService = new ObjectStorageService();
    const objectFile = await objectStorageService.getObjectEntityFile(req.path);
    objectStorageService.downloadObject(objectFile, res);
  } catch (error) {
    console.error("Error serving object:", error);
    if (error instanceof ObjectNotFoundError) {
      return res.sendStatus(404);
    }
    return res.sendStatus(500);
  }
});

// Update lab test results with attachments
router.put("/api/lab-tests/:testId/attachments", async (req, res) => {
  try {
    const { attachments } = req.body;
    if (!Array.isArray(attachments)) {
      return res.status(400).json({ error: "Attachments must be an array" });
    }

    const objectStorageService = new ObjectStorageService();

    const normalizedAttachments = [];
    for (const attachment of attachments) {
      try {
        const normalizedPath =
          objectStorageService.normalizeObjectEntityPath(attachment.url);
        normalizedAttachments.push({
          ...attachment,
          url: normalizedPath,
        });
      } catch (error) {
        console.error("Error normalizing attachment path:", error);
        normalizedAttachments.push(attachment);
      }
    }

    const labTest = await storage.updateLabTestAttachments(
      req.params.testId,
      normalizedAttachments
    );
    res.json(labTest);
  } catch (error) {
    console.error("Error updating lab test attachments:", error);
    res.status(500).json({ error: "Failed to update lab test attachments" });
  }
});

/* ------------------------------- Services / Pricing ------------------------------- */

router.get("/api/services", async (req, res) => {
  try {
    const category = req.query.category as string;
    const services = category
      ? await storage.getServicesByCategory(category)
      : await storage.getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Only admins can create/update services (prices/catalog)
router.post("/api/services", async (req, res) => {
  try {
    const service = await storage.createService(req.body);
    res.status(201).json(service);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
});

router.put("/api/services/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const service = await storage.updateService(id, req.body);
    res.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
});

// Delete service
router.delete("/api/services/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await storage.deleteService(id);
    
    // Service not found
    if (result.notFound) {
      return res.status(404).json({ error: result.message });
    }
    
    // Service is referenced and cannot be deleted
    if (result.blocked) {
      return res.status(409).json({ 
        error: result.message,
        details: result.details
      });
    }
    
    // Successfully deleted
    res.json({ message: result.message });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
});

// Bulk update service codes
router.put("/api/services/bulk-update-codes", async (req, res) => {
  try {
    const { updates } = req.body;
    
    // Validate request body
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "Invalid updates format - must be an array" });
    }
    
    // Validate each update object
    for (const update of updates) {
      if (!update.id || typeof update.id !== 'number') {
        return res.status(400).json({ error: "Invalid update: missing or invalid id" });
      }
      if (!update.code || typeof update.code !== 'string') {
        return res.status(400).json({ error: "Invalid update: missing or invalid code" });
      }
    }
    
    await storage.bulkUpdateServiceCodes(updates);
    res.json({ success: true, count: updates.length });
  } catch (error) {
    console.error("Error bulk updating service codes:", error);
    res.status(500).json({ error: "Failed to bulk update service codes" });
  }
});

/* ---------------------------------- Payments --------------------------------- */

router.post("/api/payments", async (req: any, res) => {
  try {
    const { patientId, items, paymentMethod, receivedBy, notes, totalAmount: providedTotal } =
      req.body;

    const totalAmount =
      items && items.length > 0
        ? items.reduce(
            (sum: number, item: any) => sum + item.unitPrice * item.quantity,
            0
          )
        : providedTotal;

    const payment = await storage.createPayment({
      patientId,
      totalAmount,
      paymentMethod,
      paymentDate: new Date().toISOString().split("T")[0],
      receivedBy: receivedBy || req.user?.username || req.user?.email || "System",
      notes: notes || "",
    });

    if (items && items.length > 0) {
      for (const item of items) {
        const quantity = item.quantity || 1;
        const amount = item.unitPrice * quantity;
        await storage.createPaymentItem({
          paymentId: payment.paymentId,
          serviceId: item.serviceId,
          relatedId: item.relatedId,
          relatedType: item.relatedType,
          quantity,
          unitPrice: item.unitPrice,
          amount,
          totalPrice: amount,
        });
      }

      // Group lab_test_item payments by parent lab order
      const labTestItemsByParent = new Map<string, Set<number>>();
      
      for (const item of items) {
        if (item.relatedType === "lab_test_item" && item.relatedId) {
          // Extract parent ID from "BGC-LAB21-0" -> "BGC-LAB21"
          // Split by "-", take first 2 parts for BGC-LAB21, ignore index
          const parts = item.relatedId.split("-");
          const parentId = parts.slice(0, parts.length - 1).join("-");
          const testIndex = parseInt(parts[parts.length - 1]);
          
          if (!labTestItemsByParent.has(parentId)) {
            labTestItemsByParent.set(parentId, new Set());
          }
          labTestItemsByParent.get(parentId)!.add(testIndex);
        }
      }

      // Update payment status for each order type
      for (const item of items) {
        if (item.relatedId && item.relatedType) {
          try {
            if (item.relatedType === "lab_test") {
              await storage.updateLabTest(item.relatedId, { paymentStatus: "paid" });
            } else if (item.relatedType === "lab_test_item") {
              // For individual lab test items, check if ALL tests from parent order are paid
              const parts = item.relatedId.split("-");
              const parentId = parts.slice(0, parts.length - 1).join("-");
              
              // Get the parent lab test to see total number of tests
              const allLabTests = await storage.getLabTests();
              const labTest = allLabTests.find(t => t.testId === parentId);
              if (labTest) {
                const totalTests = JSON.parse(labTest.tests).length;
                
                // Check how many tests have been paid (current + previous payments)
                // Get all payment_items for this lab order by querying all payments
                const allPayments = await storage.getPayments();
                const paidTestIndices = new Set<number>();
                
                for (const payment of allPayments) {
                  const paymentItemsList = await storage.getPaymentItems(payment.paymentId);
                  paymentItemsList.forEach(pi => {
                    if (pi.relatedType === "lab_test_item" && pi.relatedId) {
                      const piParts = pi.relatedId.split("-");
                      const piParentId = piParts.slice(0, piParts.length - 1).join("-");
                      if (piParentId === parentId) {
                        const testIndex = parseInt(piParts[piParts.length - 1]);
                        paidTestIndices.add(testIndex);
                      }
                    }
                  });
                }
                
                // Add current transaction items
                const currentItems = labTestItemsByParent.get(parentId);
                if (currentItems) {
                  currentItems.forEach(idx => paidTestIndices.add(idx));
                }
                
                // Only mark parent as paid if ALL tests are now paid
                if (paidTestIndices.size === totalTests) {
                  await storage.updateLabTest(parentId, { paymentStatus: "paid" });
                }
              }
            } else if (item.relatedType === "xray_exam") {
              await storage.updateXrayExam(item.relatedId, { paymentStatus: "paid" });
            } else if (item.relatedType === "ultrasound_exam") {
              await storage.updateUltrasoundExam(item.relatedId, {
                paymentStatus: "paid",
              });
            } else if (item.relatedType === "pharmacy_order") {
              await storage.updatePharmacyOrder(item.relatedId, {
                paymentStatus: "paid",
              });
            }
          } catch (error) {
            console.error("Error updating payment status:", error);
          }
        }
      }
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

router.get("/api/payments", async (req, res) => {
  try {
    const { patientId, date, receivedBy, limit, preset, from, to } = req.query;
    
    // Parse preset or custom range into clinic day keys
    let startDayKey: string | undefined;
    let endDayKey: string | undefined;
    
    // Use direct day-key calculation for presets
    if (preset && (preset as string).toLowerCase() === 'custom') {
      // Custom range: use from/to parameters directly
      if (from && to) {
        startDayKey = from as string;
        endDayKey = to as string;
        console.log(`[payments] Custom range: ${startDayKey} to ${endDayKey} (inclusive)`);
      } else {
        console.warn('[payments] Custom preset specified but from/to parameters missing');
      }
    } else if (preset) {
      // Standard preset (today, yesterday, last7, last30)
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys(preset as string);
      
      if (dayKeys) {
        startDayKey = dayKeys.startDayKey;
        endDayKey = dayKeys.endDayKey;
        console.log(`[payments] Preset ${preset}: ${startDayKey} to ${endDayKey} (inclusive)`);
      }
    } else if (from && to) {
      // Legacy: from/to without preset
      startDayKey = from as string;
      endDayKey = to as string;
      console.log(`[payments] Legacy custom range: ${startDayKey} to ${endDayKey} (inclusive)`);
    } else if (req.query.today === '1' || req.query.today === 'true') {
      // Legacy: today=1
      console.warn('[payments] DEPRECATED: today=1 parameter. Use preset=today instead.');
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys('today');
      if (dayKeys) {
        startDayKey = dayKeys.startDayKey;
        endDayKey = dayKeys.endDayKey;
      }
    } else if (date) {
      // Legacy: date=YYYY-MM-DD (single day)
      console.warn(`[payments] DEPRECATED: date=${date} parameter. Use preset=custom&from=${date}&to=${date} instead.`);
      startDayKey = date as string;
      endDayKey = date as string;
    }
    
    // Get payments with optional date range filtering
    let payments = patientId
      ? await storage.getPaymentsByPatient(patientId as string)
      : await storage.getPayments(startDayKey, endDayKey);

    // Apply legacy date filter if no clinic_day filtering was applied
    // This provides backward compatibility for paymentDate filtering
    if (!startDayKey && !endDayKey && date) {
      payments = payments.filter(p => p.paymentDate === date);
    }

    // Filter by receivedBy if provided
    if (receivedBy) {
      payments = payments.filter(p => 
        p.receivedBy.toLowerCase().includes((receivedBy as string).toLowerCase())
      );
    }

    // Limit results if provided
    if (limit) {
      payments = payments.slice(0, parseInt(limit as string));
    }

    // Fetch patient info and payment items for each payment
    // Note: We include soft-deleted patients for financial audit requirements
    const patientsMap = new Map();
    const uniquePatientIds = Array.from(new Set(payments.map(p => p.patientId)));
    const allPatients = await storage.getPatients();
    allPatients.forEach(p => patientsMap.set(p.patientId, p));

    // Fetch payment items and services for breakdown
    const allServices = await storage.getServices();
    const servicesMap = new Map(allServices.map(s => [s.id, s]));

    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        const items = await storage.getPaymentItems(payment.paymentId);
        
        // Group items by category for summary
        const breakdown = items.reduce((acc: any, item) => {
          const service = servicesMap.get(item.serviceId);
          const category = service?.category || 
            (item.relatedType === 'pharmacy_order' ? 'pharmacy' : 'other');
          const categoryName = 
            category === 'laboratory' ? 'Lab Tests' :
            category === 'radiology' ? 'X-Ray' :
            category === 'ultrasound' ? 'Ultrasound' :
            category === 'pharmacy' ? 'Pharmacy' :
            category === 'consultation' ? 'Consultation' :
            'Other';
          
          if (!acc[categoryName]) {
            acc[categoryName] = { count: 0, amount: 0 };
          }
          acc[categoryName].count += item.quantity;
          acc[categoryName].amount += item.amount;
          return acc;
        }, {});

        return {
          ...payment,
          patient: patientsMap.get(payment.patientId) || null,
          items,
          breakdown,
        };
      })
    );

    res.json(paymentsWithDetails);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

router.get("/api/payments/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Get payment
    const allPayments = await storage.getPayments();
    const payment = allPayments.find(p => p.paymentId === paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Get payment items
    const items = await storage.getPaymentItems(paymentId);

    // Get patient info
    const allPatients = await storage.getPatients();
    const patient = allPatients.find(p => p.patientId === payment.patientId);

    // Get services for item names
    const services = await storage.getServices();
    const servicesMap = new Map();
    services.forEach(s => servicesMap.set(s.id, s));

    const itemsWithDetails = items.map(item => ({
      ...item,
      serviceName: servicesMap.get(item.serviceId)?.name || 'Unknown Service',
    }));

    res.json({
      ...payment,
      patient,
      items: itemsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
});

/* ----------------------------- Unpaid orders views ----------------------------- */

// Shared helper to calculate pharmacy order price with proper fallback logic
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

router.get("/api/unpaid-orders/all", async (_req, res) => {
  try {
    const [labTests, xrayExams, ultrasoundExams, pharmacyOrders, patients, services, drugs] =
      await Promise.all([
        storage.getLabTests(),
        storage.getXrayExams(),
        storage.getUltrasoundExams(),
        storage.getPharmacyOrders(),
        storage.getPatients(),
        storage.getServices(),
        storage.getDrugs(true), // Get active drugs only
      ]);

    const patientMap = new Map();
    patients.forEach((p) => patientMap.set(p.patientId, p));

    const drugMap = new Map();
    drugs.forEach((d) => drugMap.set(d.id, d));

    const getServiceByCategory = (category: string) => {
      return services.find((s) => s.category === category && s.isActive);
    };

    const getServiceByName = (name: string) => {
      return services.find((s) => s.name.toLowerCase() === name.toLowerCase() && s.isActive);
    };

    // Helper function to convert string to Title Case
    const toTitleCase = (str: string): string => {
      if (!str) return '';
      return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    // Helper function to get X-Ray exam type label
    const getExamTypeLabel = (examType: string): string => {
      const labels: Record<string, string> = {
        'chest': 'Chest',
        'abdomen': 'Abdomen',
        'spine': 'Spine',
        'extremities': 'Extremities',
        'pelvis': 'Pelvis',
        'skull': 'Skull',
      };
      return labels[examType.toLowerCase()] || toTitleCase(examType);
    };

    const result = {
      laboratory: labTests
        .filter((test) => test.paymentStatus === "unpaid")
        .map((test) => {
          const testNames = JSON.parse(test.tests);
          
          // Calculate total price by summing all individual test prices
          let totalPrice = 0;
          const serviceIds: number[] = [];
          
          testNames.forEach((testName: string) => {
            const service = getServiceByName(testName);
            if (service) {
              totalPrice += service.price;
              if (!serviceIds.includes(service.id)) {
                serviceIds.push(service.id);
              }
            }
          });
          
          // Fallback to category service if no individual matches found
          if (totalPrice === 0) {
            const fallbackService = getServiceByCategory("laboratory");
            totalPrice = fallbackService?.price || 0;
            if (fallbackService) serviceIds.push(fallbackService.id);
          }
          
          return {
            id: test.testId,
            type: "lab_test",
            description: `Lab Test: ${testNames.join(", ")}`,
            date: test.requestedDate,
            category: test.category,
            patient: patientMap.get(test.patientId) || null,
            patientId: test.patientId,
            serviceIds: serviceIds,
            price: totalPrice,
          };
        }),
      xray: xrayExams
        .filter((exam) => exam.paymentStatus === "unpaid")
        .map((exam) => {
          const service = getServiceByCategory("radiology");
          const examTypeLabel = getExamTypeLabel(exam.examType);
          const displayName = exam.bodyPart 
            ? `${examTypeLabel} X-Ray - ${exam.bodyPart}` 
            : `${examTypeLabel} X-Ray`;
          return {
            id: exam.examId,
            type: "xray_exam",
            description: displayName,
            date: exam.requestedDate,
            bodyPart: exam.bodyPart,
            examType: exam.examType,
            patient: patientMap.get(exam.patientId) || null,
            patientId: exam.patientId,
            serviceId: service?.id,
            serviceName: service?.name,
            price: service?.price,
          };
        }),
      ultrasound: ultrasoundExams
        .filter((exam) => exam.paymentStatus === "unpaid")
        .map((exam) => {
          const service = getServiceByCategory("ultrasound");
          const examTypeLabel = toTitleCase(exam.examType);
          let displayName = '';
          
          if (exam.specificExam) {
            // If examType already contains "Ultrasound", don't duplicate it
            if (examTypeLabel.toLowerCase().includes('ultrasound')) {
              displayName = `${examTypeLabel} - ${exam.specificExam}`;
            } else {
              displayName = `${examTypeLabel} Ultrasound - ${exam.specificExam}`;
            }
          } else {
            // If examType already contains "Ultrasound", use as-is
            if (examTypeLabel.toLowerCase().includes('ultrasound')) {
              displayName = examTypeLabel;
            } else {
              displayName = `${examTypeLabel} Ultrasound`;
            }
          }
          
          return {
            id: exam.examId,
            type: "ultrasound_exam",
            description: displayName,
            date: exam.requestedDate,
            examType: exam.examType,
            specificExam: exam.specificExam,
            patient: patientMap.get(exam.patientId) || null,
            patientId: exam.patientId,
            serviceId: service?.id,
            serviceName: service?.name,
            price: service?.price,
          };
        }),
      pharmacy: await Promise.all(
        pharmacyOrders
          .filter((order) => order.paymentStatus === "unpaid" && order.status === "prescribed")
          .map(async (order) => {
            const unitPrice = await calculatePharmacyOrderPriceHelper(order, services, drugMap, storage);
            
            // Validate and multiply unit price by quantity for total price
            const quantity = (order.quantity && order.quantity > 0) ? order.quantity : 1;
            const price = unitPrice * quantity;
            
            const service = order.serviceId ? services.find((s) => s.id === order.serviceId) : null;
            
            return {
              id: order.orderId,
              type: "pharmacy_order",
              description: `Pharmacy: ${order.drugName || "Medication"}`,
              date: order.createdAt,
              dosage: order.dosage,
              quantity: order.quantity,
              patient: patientMap.get(order.patientId) || null,
              patientId: order.patientId,
              drugId: order.drugId,
              serviceId: service?.id,
              serviceName: service?.name,
              price,
            };
          })
      ),
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching all unpaid orders:", error);
    res.status(500).json({ error: "Failed to fetch unpaid orders" });
  }
});

router.get("/api/patients/:patientId/unpaid-orders", async (req, res) => {
  try {
    const patientId = req.params.patientId;

    const [labTests, xrayExams, ultrasoundExams, pharmacyOrders, services, drugs] = await Promise.all([
      storage.getLabTestsByPatient(patientId),
      storage.getXrayExamsByPatient(patientId),
      storage.getUltrasoundExamsByPatient(patientId),
      storage.getPharmacyOrdersByPatient(patientId),
      storage.getServices(),
      storage.getDrugs(true), // Get active drugs only
    ]);

    const drugMap = new Map();
    drugs.forEach((d) => drugMap.set(d.id, d));

    const getServiceByName = (name: string) => {
      return services.find((s) => s.name.toLowerCase() === name.toLowerCase() && s.isActive);
    };

    const getServiceByCategory = (category: string) => {
      return services.find((s) => s.category === category && s.isActive);
    };

    const unpaidOrders: any[] = [];

    // Break lab tests into individual items
    labTests
      .filter((test) => test.paymentStatus === "unpaid")
      .forEach((test) => {
        const testNames = JSON.parse(test.tests);
        
        // Return EACH test as a separate item
        testNames.forEach((testName: string, index: number) => {
          const service = getServiceByName(testName);
          if (service) {
            unpaidOrders.push({
              id: `${test.testId}-${index}`, // Unique ID for each test
              parentId: test.testId, // Track parent lab order
              type: "lab_test_item",
              description: testName,
              date: test.requestedDate,
              category: test.category,
              serviceId: service.id,
              serviceName: service.name,
              price: service.price,
            });
          }
        });
      });

    // X-ray exams remain as single items
    xrayExams
      .filter((exam) => exam.paymentStatus === "unpaid")
      .forEach((exam) => {
        const service = getServiceByCategory("radiology");
        unpaidOrders.push({
          id: exam.examId,
          type: "xray_exam",
          description: `X-Ray: ${exam.examType}`,
          date: exam.requestedDate,
          bodyPart: exam.bodyPart,
          serviceId: service?.id,
          serviceName: service?.name,
          price: service?.price || 0,
        });
      });

    // Ultrasound exams remain as single items
    ultrasoundExams
      .filter((exam) => exam.paymentStatus === "unpaid")
      .forEach((exam) => {
        const service = getServiceByCategory("ultrasound");
        unpaidOrders.push({
          id: exam.examId,
          type: "ultrasound_exam",
          description: `Ultrasound: ${exam.examType}`,
          date: exam.requestedDate,
          serviceId: service?.id,
          serviceName: service?.name,
          price: service?.price || 0,
        });
      });

    // Pharmacy orders remain as single items - process with async price calculation
    const pharmacyOrdersPromises = pharmacyOrders
      .filter((order) => order.paymentStatus === "unpaid")
      .map(async (order) => {
        const unitPrice = await calculatePharmacyOrderPriceHelper(order, services, drugMap, storage);
        
        // Validate and multiply unit price by quantity for total price
        const quantity = (order.quantity && order.quantity > 0) ? order.quantity : 1;
        const price = unitPrice * quantity;
        
        const service = order.serviceId ? services.find((s) => s.id === order.serviceId) : null;
        
        return {
          id: order.orderId,
          type: "pharmacy_order",
          description: `Pharmacy: ${order.drugName || "Medication"}`,
          date: order.createdAt,
          dosage: order.dosage,
          quantity: order.quantity,
          drugId: order.drugId,
          serviceId: service?.id,
          serviceName: service?.name,
          price,
        };
      });

    const pharmacyOrdersUnpaid = await Promise.all(pharmacyOrdersPromises);
    unpaidOrders.push(...pharmacyOrdersUnpaid);

    res.json(unpaidOrders);
  } catch (error) {
    console.error("Error fetching unpaid orders:", error);
    res.status(500).json({ error: "Failed to fetch unpaid orders" });
  }
});

/* --------------------------------- Pharmacy --------------------------------- */

router.get("/api/pharmacy-orders", async (_req, res) => {
  try {
    const pharmacyOrders = await storage.getPharmacyOrdersWithPatients();
    res.json(pharmacyOrders);
  } catch (error) {
    console.error("Error in pharmacy orders route:", error);
    res
      .status(500)
      .json({
        error:
          "Failed to fetch pharmacy orders - Please check your connection and try again",
      });
  }
});

router.get("/api/pharmacy-orders/:patientId", async (req, res) => {
  try {
    const pharmacyOrders = await storage.getPharmacyOrdersByPatient(
      req.params.patientId
    );
    res.json(pharmacyOrders);
  } catch (error) {
    console.error("Error in patient pharmacy orders route:", error);
    res.status(500).json({ error: "Failed to fetch patient pharmacy orders" });
  }
});

router.post("/api/pharmacy-orders", async (req, res) => {
  try {
    const data = insertPharmacyOrderSchema.parse(req.body);
    const pharmacyOrder = await storage.createPharmacyOrder(data);
    res.status(201).json(pharmacyOrder);
  } catch (error) {
    console.error("Error creating pharmacy order:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid pharmacy order data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create pharmacy order" });
  }
});

router.patch("/api/pharmacy-orders/:orderId", async (req, res) => {
  try {
    const updates = req.body;
    const pharmacyOrder = await storage.updatePharmacyOrder(
      req.params.orderId,
      updates
    );
    res.json(pharmacyOrder);
  } catch (error) {
    console.error("Error updating pharmacy order:", error);
    res.status(500).json({ error: "Failed to update pharmacy order" });
  }
});

router.patch("/api/pharmacy-orders/:orderId/dispense", async (req: any, res) => {
  try {
    const pharmacyOrder = await storage.dispensePharmacyOrder(
      req.params.orderId
    );
    res.json(pharmacyOrder);
  } catch (error) {
    console.error("Error dispensing pharmacy order:", error);
    res.status(500).json({ error: "Failed to dispense pharmacy order" });
  }
});

/* ---------------------------------- Encounters / Visits ---------------------------------- */

router.get("/api/encounters", async (req, res) => {
  try {
    const status = req.query.status as string;
    const patientId = req.query.patientId as string;

    // Parse preset or custom range into clinic day keys
    const preset = req.query.preset as string;
    const from = req.query.from as string;
    const to = req.query.to as string;
    
    let startDayKey: string | undefined;
    let endDayKey: string | undefined;
    
    // Use direct day-key calculation for presets (supports multi-day ranges)
    if (preset && preset.toLowerCase() === 'custom') {
      // Custom range: use from/to parameters directly
      if (from && to) {
        startDayKey = from;
        endDayKey = to;
        console.log(`[encounters] Custom range: ${startDayKey} to ${endDayKey} (inclusive)`);
      } else {
        console.warn('[encounters] Custom preset specified but from/to parameters missing');
      }
    } else if (preset) {
      // Standard preset (today, yesterday, last7, last30)
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys(preset);
      
      if (dayKeys) {
        startDayKey = dayKeys.startDayKey;
        endDayKey = dayKeys.endDayKey;
        console.log(`[encounters] Preset ${preset}: ${startDayKey} to ${endDayKey} (inclusive)`);
      }
    } else if (from && to) {
      // Legacy: from/to without preset
      startDayKey = from;
      endDayKey = to;
      console.log(`[encounters] Legacy custom range: ${startDayKey} to ${endDayKey} (inclusive)`);
    } else if (req.query.date) {
      // Legacy: date=YYYY-MM-DD (single day)
      startDayKey = req.query.date as string;
      endDayKey = req.query.date as string;
      console.log(`[encounters] Legacy date parameter: ${startDayKey}`);
    } else if (req.query.today === '1' || req.query.today === 'true') {
      // Legacy: today=1
      console.warn('[encounters] DEPRECATED: today=1 parameter. Use preset=today instead.');
      const { getPresetDayKeys } = await import('./utils/clinic-range');
      const dayKeys = getPresetDayKeys('today');
      if (dayKeys) {
        startDayKey = dayKeys.startDayKey;
        endDayKey = dayKeys.endDayKey;
      }
    }

    const encounters = await storage.getEncounters(status, startDayKey, endDayKey, patientId);
    res.json(encounters);
  } catch (error) {
    console.error("Error fetching encounters:", error);
    res.status(500).json({ error: "Failed to fetch encounters" });
  }
});

router.get("/api/encounters/:encounterId", async (req, res) => {
  try {
    const { encounterId } = req.params;
    const encounter = await storage.getEncounterById(encounterId);

    if (!encounter) {
      return res.status(404).json({ error: "Encounter not found" });
    }

    const orderLines = await storage.getOrderLinesByEncounter(encounterId);

    res.json({ encounter, orderLines });
  } catch (error) {
    console.error("Error fetching encounter:", error);
    res.status(500).json({ error: "Failed to fetch encounter" });
  }
});

router.post("/api/encounters", async (req, res) => {
  try {
    const result = insertEncounterSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Invalid encounter data", details: result.error.errors });
    }

    const encounter = await storage.createEncounter(result.data);
    res.status(201).json(encounter);
  } catch (error) {
    // COMPREHENSIVE ERROR LOGGING for debugging production issues
    console.error("=== ENCOUNTER CREATION ERROR ===");
    // Redact sensitive patient data - only log non-sensitive request fields
    console.error("Request (redacted):", JSON.stringify({
      patientId: req.body.patientId,
      visitDate: req.body.visitDate,
      policy: req.body.policy,
      hasNotes: !!req.body.notes,
    }, null, 2));
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("================================");
    
    // Return a more specific error message based on the error type
    let errorMessage = "Failed to create encounter";
    if (error instanceof Error) {
      // Provide more context without exposing sensitive details
      if (error.message.includes("UNIQUE constraint")) {
        errorMessage = "Failed to create encounter: Duplicate encounter ID detected. Please try again.";
      } else if (error.message.includes("NOT NULL constraint")) {
        errorMessage = "Failed to create encounter: Missing required field. Please check your data.";
      } else if (error.message.includes("SQLITE_ERROR") || error.message.includes("database")) {
        errorMessage = "Failed to create encounter: Database error. Please try again.";
      } else if (error.message.includes("generate encounter ID")) {
        errorMessage = "Failed to create encounter: ID generation error. Please try again.";
      } else if (error.message.includes("Insert") || error.message.includes("insert")) {
        errorMessage = "Failed to create encounter: Database insert error. Please try again.";
      } else {
        // For other errors, only expose safe parts of the message
        errorMessage = "Failed to create encounter. Please try again or contact support.";
      }
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

router.put("/api/encounters/:encounterId", async (req, res) => {
  try {
    const { encounterId } = req.params;
    const encounter = await storage.updateEncounter(encounterId, req.body);
    res.json(encounter);
  } catch (error) {
    console.error("Error updating encounter:", error);
    res.status(500).json({ error: "Failed to update encounter" });
  }
});

router.post("/api/encounters/:encounterId/close", async (req, res) => {
  try {
    const { encounterId } = req.params;

    const treatments = await storage.getTreatmentsByEncounter(encounterId);
    const treatment = treatments[0]; // Get the first treatment for this encounter
    if (!treatment || !treatment.diagnosis || treatment.diagnosis.trim() === "") {
      return res.status(400).json({ error: "Cannot close visit: Diagnosis is required" });
    }

    const [labTests, xrays, ultrasounds] = await Promise.all([
      storage.getLabTests(),
      storage.getXrayExams(),
      storage.getUltrasoundExams(),
    ]);

    const orderLines = await storage.getOrderLinesByEncounter(encounterId);
    const orderLineMap = new Map(orderLines.map((ol: any) => [ol.relatedId || "", ol]));

    const completedDiagnostics = [
      ...labTests.filter((t: any) => t.encounterId === encounterId && t.status === "completed"),
      ...xrays.filter((x: any) => x.encounterId === encounterId && x.status === "completed"),
      ...ultrasounds.filter((u: any) => u.encounterId === encounterId && u.status === "completed"),
    ];

    const unacknowledged = completedDiagnostics.filter((d: any) => {
      const orderLine = orderLineMap.get(d.testId || d.xrayId || d.ultrasoundId);
      return !orderLine || !orderLine.acknowledgedBy;
    });

    if (unacknowledged.length > 0) {
      return res
        .status(400)
        .json({
          error: `Cannot close visit: ${unacknowledged.length} completed diagnostic(s) need acknowledgment`,
        });
    }

    const cartItems = orderLines.filter((ol: any) => ol.addToCart);
    let invoiceStatus: "open" | "ready_to_bill" | "closed" = "closed";

    if (cartItems.length > 0) {
      try {
        const generatedBy = (req as any).user?.username || (req as any).user?.email || "System";
        await storage.generateInvoiceFromEncounter(encounterId, generatedBy);
        invoiceStatus = "ready_to_bill";
      } catch (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
      }
    }

    const encounter = await storage.updateEncounter(encounterId, {
      status: invoiceStatus,
      closedAt: new Date().toISOString(),
    });

    res.json(encounter);
  } catch (error) {
    console.error("Error closing encounter:", error);
    res.status(500).json({ error: "Failed to close encounter" });
  }
});

/* --------------------------- Diagnostics aggregation --------------------------- */

router.get("/api/encounters/:encounterId/diagnostics", async (req, res) => {
  try {
    const { encounterId } = req.params;
    const encounter = await storage.getEncounterById(encounterId);

    if (!encounter) {
      return res.status(404).json({ error: "Encounter not found" });
    }

    const [labTests, xrays, ultrasounds] = await Promise.all([
      storage.getLabTestsByPatient(encounter.patientId),
      storage.getXrayExamsByPatient(encounter.patientId),
      storage.getUltrasoundExamsByPatient(encounter.patientId),
    ]);

    const orderLines = await storage.getOrderLinesByEncounter(encounterId);

    const orderLineMap = new Map(orderLines.map((ol: any) => [ol.relatedId || "", ol]));

    const enrichedLabTests = labTests.map((test: any) => ({
      ...test,
      orderLine: orderLineMap.get(test.testId),
    }));

    const enrichedXrays = xrays.map((xray: any) => ({
      ...xray,
      orderLine: orderLineMap.get(xray.examId),
    }));

    const enrichedUltrasounds = ultrasounds.map((ultrasound: any) => ({
      ...ultrasound,
      orderLine: orderLineMap.get(ultrasound.ultrasoundId),
    }));

    res.json({
      labTests: enrichedLabTests,
      xrays: enrichedXrays,
      ultrasounds: enrichedUltrasounds,
    });
  } catch (error) {
    console.error("Error fetching diagnostics:", error);
    res.status(500).json({ error: "Failed to fetch diagnostics" });
  }
});

/* ------------------------- Unified orders view for a visit ------------------------- */

router.get("/api/visits/:visitId/orders", async (req, res) => {
  try {
    const { visitId } = req.params;
    const encounter = await storage.getEncounterById(visitId);

    if (!encounter) {
      return res.status(404).json({ error: "Visit not found" });
    }

    console.log(`Getting orders for visit ${visitId}, patient ${encounter.patientId}`);

    const [labTests, xrays, ultrasounds] = await Promise.all([
      storage.getLabTestsByPatient(encounter.patientId),
      storage.getXrayExamsByPatient(encounter.patientId),
      storage.getUltrasoundExamsByPatient(encounter.patientId),
    ]);

    console.log(
      `Found ${labTests.length} lab tests, ${xrays.length} xrays, ${ultrasounds.length} ultrasounds for patient ${encounter.patientId}`
    );

    const orderLines = await storage.getOrderLinesByEncounter(visitId);
    const orderLineMap = new Map(orderLines.map((ol: any) => [ol.relatedId || "", ol]));

    const labOrders = labTests.map((test: any) => {
      const orderLine = orderLineMap.get(test.testId);
      
      // Parse test names from JSON array
      let testNames = [];
      try {
        testNames = JSON.parse(test.tests || "[]");
      } catch (e) {
        testNames = [];
      }
      
      // Create display name from test names
      const displayName = testNames.length > 0 
        ? testNames.join(", ") 
        : (test.category || "Lab Test");
      
      return {
        ...test,
        orderId: orderLine?.id || `lab-${test.testId}`,
        visitId,
        type: "lab",
        name: displayName,
        flags: test.clinicalSignificance || null,
        snippet: test.criticalFindings || test.interpretation || null,
        resultUrl: `/api/lab-tests/${test.testId}`,
        orderLine,
        acknowledgedAt: orderLine?.acknowledgedAt || null,
        acknowledgedBy: orderLine?.acknowledgedBy || null,
        addToCart: orderLine?.addToCart || false,
        isPaid: test.paymentStatus === "paid",
      };
    });

    // X-ray display name priority: bodyPart (specific) > examType (category)
    // e.g., "Left Femur" is more helpful than "extremities"
    const xrayOrders = xrays.map((xray: any) => {
      const orderLine = orderLineMap.get(xray.examId);
      return {
        ...xray,
        orderId: orderLine?.id || `xray-${xray.examId}`,
        visitId,
        type: "xray",
        name: xray.bodyPart || xray.examType || "X-Ray",
        flags: null,
        snippet: xray.impression || null,
        resultUrl: `/api/xray-exams/${xray.examId}`,
        orderLine,
        acknowledgedAt: orderLine?.acknowledgedAt || null,
        acknowledgedBy: orderLine?.acknowledgedBy || null,
        addToCart: orderLine?.addToCart || false,
        isPaid: xray.paymentStatus === "paid",
      };
    });

    const ultrasoundOrders = ultrasounds.map((us: any) => {
      const orderLine = orderLineMap.get(us.examId);
      return {
        ...us,
        orderId: orderLine?.id || `ultrasound-${us.examId}`,
        visitId,
        type: "ultrasound",
        name: us.examType || "Ultrasound",
        flags: null,
        snippet: us.impression || null,
        resultUrl: `/api/ultrasound-exams/${us.examId}`,
        orderLine,
        acknowledgedAt: orderLine?.acknowledgedAt || null,
        acknowledgedBy: orderLine?.acknowledgedBy || null,
        addToCart: orderLine?.addToCart || false,
        isPaid: us.paymentStatus === "paid",
      };
    });

    // Add consultation order lines (they don't have a separate table)
    const consultationOrders = orderLines
      .filter((ol: any) => ol.relatedType === "consultation")
      .map((ol: any) => ({
        orderId: ol.id,
        visitId,
        type: "consultation",
        name: ol.description || "Consultation",
        status: ol.status || "performed",
        totalPrice: ol.totalPrice,
        orderLine: ol,
        acknowledgedAt: ol.acknowledgedAt || null,
        acknowledgedBy: ol.acknowledgedBy || null,
        addToCart: ol.addToCart || 0,
        isPaid: ol.addToCart === 0, // If not in cart, it's paid
      }));

    // Add orphan order lines (ordered but not yet processed by lab/xray/ultrasound departments)
    const processedIds = new Set([
      ...labTests.map((t: any) => t.testId),
      ...xrays.map((x: any) => x.examId),
      ...ultrasounds.map((u: any) => u.examId),
    ]);

    const orphanOrders = orderLines
      .filter((ol: any) => {
        // Only include lab/xray/ultrasound orders that don't have a related record yet
        if (ol.relatedType === "consultation") return false;
        if (!ol.relatedId) return true; // No related ID = definitely pending
        return !processedIds.has(ol.relatedId); // Related ID but no record = pending
      })
      .map((ol: any) => ({
        orderId: ol.id,
        visitId,
        type: ol.relatedType || "unknown",
        name: ol.description || "Pending Order",
        status: "pending",
        department: ol.relatedType === "lab" ? "Laboratory" : 
                    ol.relatedType === "xray" ? "X-Ray" : 
                    ol.relatedType === "ultrasound" ? "Ultrasound" : "Unknown",
        description: ol.description,
        totalPrice: ol.totalPrice,
        orderLine: ol,
        requestedDate: ol.createdAt,
        acknowledgedAt: ol.acknowledgedAt || null,
        acknowledgedBy: ol.acknowledgedBy || null,
        addToCart: ol.addToCart || 0,
        isPaid: false, // Pending orders are not paid yet
      }));

    const allOrders = [...consultationOrders, ...orphanOrders, ...labOrders, ...xrayOrders, ...ultrasoundOrders];

    res.json(allOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* ---------------------------- Order line helpers ---------------------------- */

router.put("/api/order-lines/:id/acknowledge", async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { acknowledgedBy, acknowledged } = req.body;

    const updates: any = {};
    if (acknowledged) {
      updates.acknowledgedBy =
        acknowledgedBy || req.user?.username || req.user?.email || "System";
      updates.acknowledgedAt = new Date().toISOString();
    } else {
      updates.acknowledgedBy = null;
      updates.acknowledgedAt = null;
    }

    const orderLine = await storage.updateOrderLine(id, updates);
    res.json(orderLine);
  } catch (error) {
    console.error("Error updating acknowledgment:", error);
    res.status(500).json({ error: "Failed to update acknowledgment" });
  }
});

router.put("/api/order-lines/:id/add-to-cart", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { addToCart } = req.body;

    const orderLine = await storage.updateOrderLine(id, {
      addToCart: addToCart ? 1 : 0,
    });
    res.json(orderLine);
  } catch (error) {
    console.error("Error updating add to cart:", error);
    res.status(500).json({ error: "Failed to update add to cart" });
  }
});

router.put("/api/orders/:orderId/ack", async (req: any, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { acknowledged } = req.body;

    const updates: any = {};
    if (acknowledged) {
      updates.acknowledgedBy =
        req.user?.username || req.user?.email || "System";
      updates.acknowledgedAt = new Date().toISOString();
    } else {
      updates.acknowledgedBy = null;
      updates.acknowledgedAt = null;
    }

    const orderLine = await storage.updateOrderLine(orderId, updates);
    res.json({ acknowledged: !!orderLine.acknowledgedBy });
  } catch (error) {
    console.error("Error updating acknowledgment:", error);
    res.status(500).json({ error: "Failed to update acknowledgment" });
  }
});

router.put("/api/orders/:orderId/cart", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { addToCart } = req.body;

    const orderLine = await storage.updateOrderLine(orderId, {
      addToCart: addToCart ? 1 : 0,
    });
    res.json({ addToCart: !!orderLine.addToCart });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

/* --------------------------------- Order lines -------------------------------- */

// RBAC for diagnostic ordering: Allow ADMIN and DOCTOR only (not RECEPTION)
// Reception can view/update order lines for billing, but cannot create diagnostic orders
router.post("/api/order-lines", async (req: any, res) => {
  try {
    const result = insertOrderLineSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Invalid order line data", details: result.error.errors });
    }

    // Validate and normalize relatedType
    const normalizedRelatedType = normalizeRelatedType(result.data.relatedType);
    if (!normalizedRelatedType) {
      return res.status(400).json({ 
        error: "Invalid relatedType",
        details: `relatedType '${result.data.relatedType}' is not valid` 
      });
    }

    // RBAC: Block Reception from creating diagnostic orders
    // Diagnostic orders use normalized types: lab_test, xray_exam, ultrasound_exam
    const isDiagnosticOrder = ["lab_test", "xray_exam", "ultrasound_exam"].includes(normalizedRelatedType);
    if (isDiagnosticOrder && req.user?.role === ROLES.RECEPTION) {
      return res.status(403).json({
        error: "Insufficient permissions",
        details: "Reception staff cannot order diagnostics. Only Doctors can order from Treatment, and Admins can order referrals.",
      });
    }
    
    // STRICT CATALOG VALIDATION: Ensure service exists and is active
    const service = await storage.getServiceById(result.data.serviceId);
    if (!service) {
      return res.status(400).json({ 
        error: "Service not found",
        details: `Service ID ${result.data.serviceId} does not exist in the catalog` 
      });
    }

    if (!service.isActive) {
      return res.status(400).json({ 
        error: "Service is inactive",
        details: `Service '${service.name}' is not currently active. Please contact administration.` 
      });
    }

    // Validate that service category matches the relatedType
    // Map service categories to expected relatedTypes
    const categoryToRelatedType: Record<string, string[]> = {
      "laboratory": ["lab_test"],
      "radiology": ["xray_exam"],
      "ultrasound": ["ultrasound_exam"],
      "consultation": ["consultation", "procedure"],
      "pharmacy": ["pharmacy_order"],
      "procedure": ["procedure", "consultation"],
    };

    const expectedRelatedTypes = categoryToRelatedType[service.category] || [];
    if (!expectedRelatedTypes.includes(normalizedRelatedType)) {
      return res.status(400).json({ 
        error: "Service category mismatch",
        details: `Service '${service.name}' is a ${service.category} service but you are trying to order it as ${normalizedRelatedType}` 
      });
    }

    // DUPLICATE CONSULTATION CHECK: Prevent duplicate consultation orders for same encounter
    // This is a server-side safeguard to prevent billing integrity issues
    // Only runs when creating a consultation order (not for every order line)
    if (normalizedRelatedType === "consultation") {
      const existingOrderLines = await storage.getOrderLinesByEncounter(result.data.encounterId);
      const hasExistingConsultation = existingOrderLines.some(
        (ol) => ol.relatedType === "consultation"
      );
      
      if (hasExistingConsultation) {
        console.log(`[ORDER-LINES] Blocked duplicate consultation for encounter ${result.data.encounterId}`);
        return res.status(400).json({ 
          error: "Duplicate consultation order",
          details: "A consultation order already exists for this encounter. Cannot add another consultation." 
        });
      }
    }

    // AUTO-CREATE DIAGNOSTIC RECORDS: If relatedId is missing for diagnostic orders,
    // automatically create the diagnostic record (lab_test, xray_exam, ultrasound_exam)
    let relatedId = result.data.relatedId;
    
    if (!relatedId && ["lab_test", "xray_exam", "ultrasound_exam"].includes(normalizedRelatedType)) {
      console.log(`[ORDER-LINES] Auto-creating ${normalizedRelatedType} record for service ${service.name}`);
      
      try {
        // Extract diagnostic-specific data from request body
        const diagnosticData = req.body.diagnosticData || {};
        
        // Get encounter to extract patientId
        const encounter = await storage.getEncounterById(result.data.encounterId);
        if (!encounter) {
          console.error(`[ORDER-LINES] ERROR: Encounter ${result.data.encounterId} not found for diagnostic auto-creation`);
          return res.status(400).json({ 
            error: "Encounter not found",
            details: `Cannot create diagnostic order - encounter ${result.data.encounterId} does not exist. Please ensure the encounter was created successfully.` 
          });
        }

        console.log(`[ORDER-LINES] Found encounter ${encounter.encounterId} for patient [REDACTED]`);

        // Create diagnostic record based on type
        if (normalizedRelatedType === "xray_exam") {
          const xrayData = {
            patientId: encounter.patientId,
            examType: diagnosticData.examType || "chest",
            bodyPart: diagnosticData.bodyPart || service.name,
            clinicalIndication: diagnosticData.clinicalIndication || "",
            specialInstructions: diagnosticData.specialInstructions || "",
            requestedDate: new Date().toISOString(),
          };
          // Log only non-sensitive metadata
          console.log(`[ORDER-LINES] Creating X-Ray exam - type: ${xrayData.examType}, bodyPart: ${xrayData.bodyPart}`);
          const xrayExam = await storage.createXrayExam(xrayData);
          relatedId = xrayExam.examId;
          console.log(`[ORDER-LINES] SUCCESS: Created X-Ray exam ${relatedId}`);
        } else if (normalizedRelatedType === "ultrasound_exam") {
          const ultrasoundData = {
            patientId: encounter.patientId,
            examType: diagnosticData.examType || "abdominal",
            specificExam: diagnosticData.specificExam || service.name,
            clinicalIndication: diagnosticData.clinicalIndication || "",
            specialInstructions: diagnosticData.specialInstructions || "",
            requestedDate: new Date().toISOString(),
          };
          // Log only non-sensitive metadata
          console.log(`[ORDER-LINES] Creating Ultrasound exam - type: ${ultrasoundData.examType}, specificExam: ${ultrasoundData.specificExam}`);
          const ultrasoundExam = await storage.createUltrasoundExam(ultrasoundData);
          relatedId = ultrasoundExam.examId;
          console.log(`[ORDER-LINES] SUCCESS: Created Ultrasound exam ${relatedId}`);
        } else if (normalizedRelatedType === "lab_test") {
          const labData = {
            patientId: encounter.patientId,
            category: diagnosticData.category || "blood",
            tests: diagnosticData.tests || JSON.stringify([service.name]),
            clinicalInfo: diagnosticData.clinicalInfo || "",
            priority: diagnosticData.priority || "routine",
            requestedDate: new Date().toISOString(),
          };
          // Log only non-sensitive metadata
          console.log(`[ORDER-LINES] Creating Lab test - category: ${labData.category}, priority: ${labData.priority}`);
          const labTest = await storage.createLabTest(labData);
          relatedId = labTest.testId;
          console.log(`[ORDER-LINES] SUCCESS: Created Lab test ${relatedId}`);
        }
      } catch (diagnosticError) {
        // Specific error for diagnostic record creation failure
        console.error(`[ORDER-LINES] CRITICAL ERROR: Failed to create ${normalizedRelatedType} record:`, diagnosticError);
        console.error(`[ORDER-LINES] Error details:`, diagnosticError instanceof Error ? diagnosticError.message : 'Unknown error');
        console.error(`[ORDER-LINES] Error stack:`, diagnosticError instanceof Error ? diagnosticError.stack : 'No stack trace');
        
        // Sanitize error message for client - don't expose internal database details
        const clientErrorMessage = `Unable to create ${normalizedRelatedType.replace('_', ' ')} record. Please try again or contact support if the problem persists.`;
        
        return res.status(500).json({ 
          error: `Failed to create ${normalizedRelatedType.replace('_', ' ')} record`,
          details: clientErrorMessage,
          stage: "diagnostic_creation",
          diagnosticType: normalizedRelatedType,
        });
      }
    }

    // Create order line with normalized relatedType and relatedId
    console.log(`[ORDER-LINES] Creating order line for encounter ${result.data.encounterId}, service ${service.name}, relatedId: ${relatedId}`);
    const orderLineData = {
      ...result.data,
      relatedType: normalizedRelatedType,
      relatedId: relatedId,
    };

    let orderLine;
    try {
      orderLine = await storage.createOrderLine(orderLineData);
      console.log(`[ORDER-LINES] SUCCESS: Created order line ID ${orderLine.id} for encounter ${result.data.encounterId}`);
    } catch (orderLineError) {
      console.error(`[ORDER-LINES] CRITICAL ERROR: Failed to create order line:`, orderLineError);
      // Log order line data but redact sensitive patient information
      const safeOrderLineData = {
        encounterId: orderLineData.encounterId,
        serviceId: orderLineData.serviceId,
        relatedType: orderLineData.relatedType,
        relatedId: orderLineData.relatedId,
        department: orderLineData.department,
      };
      console.error(`[ORDER-LINES] Order line metadata:`, JSON.stringify(safeOrderLineData));
      console.error(`[ORDER-LINES] Error details:`, orderLineError instanceof Error ? orderLineError.message : 'Unknown error');
      
      return res.status(500).json({ 
        error: "Failed to create order line",
        details: "The diagnostic record was created but could not be linked to the encounter. Please contact support.",
        stage: "order_line_creation",
        diagnosticId: relatedId,
      });
    }

    res.status(201).json(orderLine);
  } catch (error) {
    // Generic catch-all for unexpected errors
    console.error("[ORDER-LINES] UNEXPECTED ERROR:", error);
    console.error("[ORDER-LINES] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("[ORDER-LINES] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[ORDER-LINES] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    // Don't expose internal error details to client
    res.status(500).json({ 
      error: "Failed to create order line",
      details: "An unexpected error occurred. Please try again or contact support if the problem persists.",
      stage: "unknown"
    });
  }
});

router.get("/api/encounters/:encounterId/order-lines", async (req, res) => {
  try {
    const { encounterId } = req.params;
    const orderLines = await storage.getOrderLinesByEncounter(encounterId);
    res.json(orderLines);
  } catch (error) {
    console.error("Error fetching order lines:", error);
    res.status(500).json({ error: "Failed to fetch order lines" });
  }
});

router.put("/api/order-lines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const orderLine = await storage.updateOrderLine(id, req.body);
    res.json(orderLine);
  } catch (error) {
    console.error("Error updating order line:", error);
    res.status(500).json({ error: "Failed to update order line" });
  }
});

/* ----------------------------------- Invoices ---------------------------------- */

router.get("/api/invoices", async (req, res) => {
  try {
    const status = req.query.status as string;
    const invoices = await storage.getInvoices(status);
    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

router.get("/api/invoices/:invoiceId", async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await storage.getInvoiceById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoiceLines = await storage.getInvoiceLines(invoiceId);

    res.json({ invoice, invoiceLines });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

router.post("/api/encounters/:encounterId/generate-invoice", async (req: any, res) => {
  try {
    const { encounterId } = req.params;
    const generatedBy =
      req.body.generatedBy ||
      req.user?.username ||
      req.user?.email ||
      "System";

    // Check if invoice already exists for this encounter
    const existingInvoices = await storage.getInvoices();
    const duplicate = existingInvoices.find(inv => inv.encounterId === encounterId);
    if (duplicate) {
      console.log(`[Invoice] Duplicate invoice attempt for encounter ${encounterId}, existing invoice: ${duplicate.invoiceId}`);
      return res.status(400).json({ 
        error: `Invoice already exists for this visit (Invoice ID: ${duplicate.invoiceId})`,
        invoiceId: duplicate.invoiceId 
      });
    }

    const invoice = await storage.generateInvoiceFromEncounter(
      encounterId,
      generatedBy
    );
    console.log(`[Invoice] Successfully generated invoice ${invoice.invoiceId} for encounter ${encounterId}`);
    res.status(201).json(invoice);
  } catch (error: any) {
    console.error("[Invoice] DETAILED Error generating invoice:", error);
    console.error("[Invoice] Error stack:", error.stack);
    
    // Return specific error message (never expose stack trace to client)
    const errorMessage = error.message || "Failed to generate invoice";
    res.status(500).json({ 
      error: errorMessage
    });
  }
});

/* ------------------ Enhanced service → auto order helper ------------------ */

router.post("/api/services/:serviceType/auto-order", async (req: any, res) => {
  try {
    const { serviceType } = req.params;
    const { patientId, encounterId, serviceId, relatedId, attendingClinician } =
      req.body;

    let encounter;
    if (encounterId) {
      encounter = await storage.getEncounterById(encounterId);
    } else {
      const today = new Date().toISOString().split("T")[0];
      encounter = await storage.createEncounter({
        patientId,
        visitDate: today,
        attendingClinician:
          attendingClinician || req.user?.username || req.user?.email || "System",
      });
    }

    if (!encounter) {
      return res
        .status(404)
        .json({ error: "Encounter not found or could not be created" });
    }

    const services = await storage.getServices();
    const service = services.find((s) => s.id === serviceId);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const orderLine = await storage.createOrderLine({
      encounterId: encounter.encounterId,
      serviceId,
      relatedId,
      relatedType: serviceType as any,
      description: service.name,
      quantity: 1,
      unitPriceSnapshot: service.price,
      totalPrice: service.price,
      department: service.category as any,
      orderedBy: attendingClinician || req.user?.username || req.user?.email || "System",
    });

    res.status(201).json({ encounter, orderLine });
  } catch (error) {
    console.error("Error creating auto order:", error);
    res.status(500).json({ error: "Failed to create auto order" });
  }
});

/* -------------------------- Pharmacy inventory & stock -------------------------- */

router.get("/api/pharmacy/drugs", async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly === "true";
    const drugs = await storage.getDrugs(activeOnly);
    res.json(drugs);
  } catch (error) {
    console.error("Error fetching drugs:", error);
    res.status(500).json({ error: "Failed to fetch drugs" });
  }
});

router.get("/api/pharmacy/drugs/:id", async (req, res) => {
  try {
    const drug = await storage.getDrugById(parseInt(req.params.id));
    if (!drug) {
      return res.status(404).json({ error: "Drug not found" });
    }
    res.json(drug);
  } catch (error) {
    console.error("Error fetching drug:", error);
    res.status(500).json({ error: "Failed to fetch drug" });
  }
});

router.post("/api/pharmacy/drugs", async (req, res) => {
  try {
    const data = insertDrugSchema.parse(req.body);
    const drug = await storage.createDrug(data);
    res.status(201).json(drug);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid drug data", details: error.errors });
    }
    console.error("Error creating drug:", error);
    res.status(500).json({ error: "Failed to create drug" });
  }
});

router.put("/api/pharmacy/drugs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const drug = await storage.updateDrug(id, req.body);
    res.json(drug);
  } catch (error) {
    console.error("Error updating drug:", error);
    res.status(500).json({ error: "Failed to update drug" });
  }
});

router.get("/api/pharmacy/batches", async (req, res) => {
  try {
    const drugId = req.query.drugId ? parseInt(req.query.drugId as string) : undefined;
    const batches = await storage.getDrugBatches(drugId);
    res.json(batches);
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Failed to fetch batches" });
  }
});

router.get("/api/pharmacy/batches/:batchId", async (req, res) => {
  try {
    const batch = await storage.getDrugBatchById(req.params.batchId);
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }
    res.json(batch);
  } catch (error) {
    console.error("Error fetching batch:", error);
    res.status(500).json({ error: "Failed to fetch batch" });
  }
});

router.post("/api/pharmacy/batches", async (req, res) => {
  try {
    const data = insertDrugBatchSchema.parse(req.body);
    const batch = await storage.createDrugBatch(data);
    res.status(201).json(batch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid batch data", details: error.errors });
    }
    console.error("Error creating batch:", error);
    res.status(500).json({ error: "Failed to create batch" });
  }
});

router.get("/api/pharmacy/batches/fefo/:drugId", async (req, res) => {
  try {
    const drugId = parseInt(req.params.drugId);
    const batches = await storage.getBatchesFEFO(drugId);
    res.json(batches);
  } catch (error) {
    console.error("Error fetching FEFO batches:", error);
    res.status(500).json({ error: "Failed to fetch FEFO batches" });
  }
});

router.get("/api/pharmacy/ledger", async (req, res) => {
  try {
    const drugId = req.query.drugId ? parseInt(req.query.drugId as string) : undefined;
    const batchId = req.query.batchId as string | undefined;
    const ledger = await storage.getInventoryLedger(drugId, batchId);
    res.json(ledger);
  } catch (error) {
    console.error("Error fetching ledger:", error);
    res.status(500).json({ error: "Failed to fetch inventory ledger" });
  }
});

router.post("/api/pharmacy/ledger", async (req, res) => {
  try {
    const data = insertInventoryLedgerSchema.parse(req.body);
    const entry = await storage.createInventoryLedger(data);
    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid ledger data", details: error.errors });
    }
    console.error("Error creating ledger entry:", error);
    res.status(500).json({ error: "Failed to create ledger entry" });
  }
});

router.get("/api/pharmacy/stock/all", async (_req, res) => {
  try {
    const drugsWithStock = await storage.getAllDrugsWithStock();
    res.json(drugsWithStock);
  } catch (error) {
    console.error("Error fetching all drugs with stock:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch drugs with stock levels" });
  }
});

router.get("/api/pharmacy/stock/:drugId", async (req, res) => {
  try {
    const drugId = parseInt(req.params.drugId);
    const stockLevel = await storage.getDrugStockLevel(drugId);
    res.json({ drugId, stockOnHand: stockLevel });
  } catch (error) {
    console.error("Error fetching stock level:", error);
    res.status(500).json({ error: "Failed to fetch stock level" });
  }
});

router.get("/api/pharmacy/alerts/low-stock", async (_req, res) => {
  try {
    const lowStockDrugs = await storage.getLowStockDrugs();
    res.json(lowStockDrugs);
  } catch (error) {
    console.error("Error fetching low stock drugs:", error);
    res.status(500).json({ error: "Failed to fetch low stock drugs" });
  }
});

router.get("/api/pharmacy/alerts/expiring", async (req, res) => {
  try {
    const daysThreshold = req.query.days ? parseInt(req.query.days as string) : 90;
    const expiringDrugs = await storage.getExpiringSoonDrugs(daysThreshold);
    res.json(expiringDrugs);
  } catch (error) {
    console.error("Error fetching expiring drugs:", error);
    res.status(500).json({ error: "Failed to fetch expiring drugs" });
  }
});

router.get("/api/pharmacy/prescriptions/paid", async (_req, res) => {
  try {
    const prescriptions = await storage.getPaidPrescriptions();
    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching paid prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch paid prescriptions" });
  }
});

router.get("/api/pharmacy/prescriptions/unpaid", async (_req, res) => {
  try {
    const prescriptions = await storage.getUnpaidPrescriptions();
    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching unpaid prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch unpaid prescriptions" });
  }
});

router.get("/api/pharmacy/prescriptions/dispensed", async (_req, res) => {
  try {
    const prescriptions = await storage.getDispensedPrescriptions();
    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching dispensed prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch dispensed prescriptions" });
  }
});

router.post("/api/pharmacy/dispense", async (req, res) => {
  try {
    const { orderId, batchId, quantity, dispensedBy } = req.body;

    if (!orderId || !batchId || !quantity || !dispensedBy) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const order = await storage.dispenseDrug(orderId, batchId, quantity, dispensedBy);
    res.json(order);
  } catch (error) {
    console.error("Error dispensing drug:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to dispense drug" });
  }
});

/* ---------------------------------- Reports ---------------------------------- */

// Reports Summary - range-based metrics for Reports page
router.get("/api/reports/summary", async (req, res) => {
  try {
    const { fromDate, toDate, compareWithPrevious } = req.query;
    
    console.log("Reports summary route called", { fromDate, toDate, compareWithPrevious });
    
    // Validate date parameters
    if (!fromDate || !toDate) {
      return res.status(400).json({ 
        error: "Missing required parameters: fromDate and toDate" 
      });
    }
    
    // Use getDashboardStats which already filters by date range using clinic_day
    // This ensures consistency with the Dashboard but respects the provided date range
    const stats = await storage.getDashboardStats(
      fromDate as string,
      toDate as string
    );
    
    let previousPeriodStats = null;
    
    // If comparison is requested, calculate previous period
    if (compareWithPrevious === 'true') {
      const startDate = new Date(fromDate as string);
      const endDate = new Date(toDate as string);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate previous period dates
      const prevEndDate = new Date(startDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      const prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
      
      const prevFromDate = prevStartDate.toISOString().split('T')[0];
      const prevToDate = prevEndDate.toISOString().split('T')[0];
      
      console.log("Previous period:", { prevFromDate, prevToDate });
      
      previousPeriodStats = await storage.getDashboardStats(prevFromDate, prevToDate);
    }
    
    console.log("Reports summary result:", stats);
    
    res.json({
      totalPatients: stats.newPatients, // Patients registered in range
      newPatients: stats.newPatients,
      totalVisits: stats.totalVisits,
      labTests: stats.labTests,
      xrays: stats.xrays,
      ultrasounds: stats.ultrasounds,
      pending: stats.pending,
      previousPeriod: previousPeriodStats ? {
        totalPatients: previousPeriodStats.newPatients, // Same as newPatients in this system
        newPatients: previousPeriodStats.newPatients,
        totalVisits: previousPeriodStats.totalVisits,
        labTests: previousPeriodStats.labTests,
        xrays: previousPeriodStats.xrays,
        ultrasounds: previousPeriodStats.ultrasounds,
      } : null,
    });
  } catch (error) {
    console.error("Reports summary route error:", error);
    res.status(500).json({
      error: "Failed to fetch reports summary",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/api/reports/diagnoses", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    // Use the new getDiagnosisStats method which performs the grouping and counting in SQL
    const diagnosisStats = await storage.getDiagnosisStats(
      fromDate as string | undefined,
      toDate as string | undefined
    );

    res.json(diagnosisStats);
  } catch (error) {
    console.error("Error fetching diagnosis data:", error);
    res.status(500).json({ error: "Failed to fetch diagnosis data" });
  }
});

router.get("/api/reports/age-distribution", async (req, res) => {
  try {
    // Constants for age validation
    const MAX_VALID_AGE = 150;
    
    // Get all non-deleted patients
    const allPatients = await db.select({
      age: patients.age
    }).from(patients).where(eq(patients.isDeleted, 0));
    
    console.log(`Processing ${allPatients.length} patients for age distribution`);
    console.log("Sample ages:", allPatients.slice(0, 5).map((p: any) => p.age));

    const ageRanges: Record<string, number> = {
      "0-5": 0,
      "6-17": 0,
      "18-35": 0,
      "36-50": 0,
      "51-64": 0,
      "65+": 0,
    };
    
    let unknownCount = 0;

    allPatients.forEach((patient: any) => {
      if (!patient.age || patient.age.trim() === "") {
        unknownCount++;
        return;
      }

      // Parse age - handle formats like "25", "25 years", "25y", etc.
      const ageMatch = patient.age.match(/\d+/);
      if (!ageMatch) {
        unknownCount++;
        return;
      }
      
      const age = parseInt(ageMatch[0], 10);
      
      if (isNaN(age) || age < 0 || age > MAX_VALID_AGE) {
        unknownCount++;
      } else if (age <= 5) {
        ageRanges["0-5"]++;
      } else if (age <= 17) {
        ageRanges["6-17"]++;
      } else if (age <= 35) {
        ageRanges["18-35"]++;
      } else if (age <= 50) {
        ageRanges["36-50"]++;
      } else if (age <= 64) {
        ageRanges["51-64"]++;
      } else {
        ageRanges["65+"]++;
      }
    });

    const total = allPatients.length;
    
    // Build distribution array - only include ranges with data
    const distribution = Object.entries(ageRanges)
      .map(([ageRange, count]) => ({
        ageRange,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
    
    // Add unknown if there are any
    if (unknownCount > 0) {
      distribution.push({
        ageRange: "Unknown",
        count: unknownCount,
        percentage: total > 0 ? Math.round((unknownCount / total) * 100) : 0,
      });
    }

    console.log("Age distribution result:", distribution);
    res.json(distribution);
  } catch (error) {
    console.error("Error fetching age distribution:", error);
    res.status(500).json({ error: "Failed to fetch age distribution" });
  }
});

router.get("/api/reports/gender-distribution", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    // Validate dates
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "fromDate and toDate are required" });
    }
    
    console.log("Gender distribution route called", { fromDate, toDate });
    
    // Query patients who had encounters in the date range
    const patientsWithVisits = await db
      .select({
        gender: patients.gender,
        patientId: patients.id,
      })
      .from(patients)
      .innerJoin(encounters, eq(encounters.patientId, patients.id))
      .where(
        and(
          gte(encounters.visitDate, fromDate as string),
          lte(encounters.visitDate, toDate as string),
          eq(patients.isDeleted, 0)
        )
      )
      .groupBy(patients.id, patients.gender);

    // Count by gender
    const genderCounts: Record<string, number> = patientsWithVisits.reduce((acc: Record<string, number>, patient) => {
      const gender = patient.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    // Calculate total and percentages
    const total = Object.values(genderCounts).reduce((sum: number, count: number) => sum + count, 0);
    
    const distribution = Object.entries(genderCounts).map(([gender, count]: [string, number]) => ({
      gender,
      count,
      percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0
    }));

    // Calculate gender ratio (Male:Female)
    const male = genderCounts['Male'] || 0;
    const female = genderCounts['Female'] || 0;
    let ratio: string;
    if (male === 0 && female === 0) {
      ratio = 'No data';
    } else if (male === 0) {
      ratio = `0:${female}`;
    } else if (female === 0) {
      ratio = `${male}:0`;
    } else {
      ratio = `${(male / female).toFixed(2)}:1`;
    }

    res.json({
      distribution,
      total,
      ratio
    });

  } catch (error) {
    console.error("Error fetching gender distribution:", error);
    res.status(500).json({ error: "Failed to fetch gender distribution" });
  }
});

router.get("/api/reports/trends", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    // Use visitDate which is always populated (NOT NULL)
    let startDate: string;
    let endDate: string;
    
    if (fromDate && toDate && typeof fromDate === 'string' && typeof toDate === 'string') {
      startDate = fromDate;
      endDate = toDate;
    } else {
      // Default to last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
    }
    
    console.log("Trends query using visitDate:", { startDate, endDate });
    
    // Query using visitDate (which is NOT NULL and always populated)
    const allTreatments = await db.select({
      visitDate: treatments.visitDate
    }).from(treatments).where(
      and(
        gte(treatments.visitDate, startDate),
        lte(treatments.visitDate, endDate)
      )
    );
    
    console.log(`Found ${allTreatments.length} treatments in date range`);
    
    // Count visits per day
    const visitCounts: Record<string, number> = {};
    
    allTreatments.forEach((t: any) => {
      // visitDate is stored as text in YYYY-MM-DD format, but may contain time component
      // Extract just the date part to ensure consistent grouping
      const dayKey = t.visitDate.split('T')[0];
      visitCounts[dayKey] = (visitCounts[dayKey] || 0) + 1;
    });
    
    // Generate array for all days in range (including zero-visit days)
    const trends: Array<{ date: string; visits: number }> = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split('T')[0];
      trends.push({
        date: dayKey,
        visits: visitCounts[dayKey] || 0
      });
    }
    
    console.log("Returning trends:", trends);
    res.json(trends);
  } catch (error) {
    console.error("Error fetching trends:", error);
    res.status(500).json({ error: "Failed to fetch trends" });
  }
});

// Helper function to get dashboard stats for a date range
async function getDashboardStats(fromDate: string, toDate: string) {
  // Query encounters in date range
  const encountersInRange = await db
    .select()
    .from(encounters)
    .where(
      and(
        gte(encounters.visitDate, fromDate),
        lte(encounters.visitDate, toDate)
      )
    );

  // Count visits
  const totalVisits = encountersInRange.length;

  // Count new patients registered in range
  const newPatientsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(patients)
    .where(
      and(
        sql`clinic_day >= ${fromDate}`,
        sql`clinic_day <= ${toDate}`,
        eq(patients.isDeleted, 0)
      )
    );

  // Count lab tests ordered in range
  const labTestsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(labTests)
    .where(
      and(
        gte(labTests.requestedDate, fromDate),
        lte(labTests.requestedDate, toDate)
      )
    );

  // Count X-rays in range
  const xraysResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(xrayExams)
    .where(
      and(
        gte(xrayExams.requestedDate, fromDate),
        lte(xrayExams.requestedDate, toDate)
      )
    );

  // Count ultrasounds in range
  const ultrasoundsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(ultrasoundExams)
    .where(
      and(
        gte(ultrasoundExams.requestedDate, fromDate),
        lte(ultrasoundExams.requestedDate, toDate)
      )
    );

  // Count pending items
  const pendingLabsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(labTests)
    .where(eq(labTests.status, 'pending'));

  const pendingXraysResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(xrayExams)
    .where(eq(xrayExams.status, 'pending'));

  const pendingUltrasoundsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(ultrasoundExams)
    .where(eq(ultrasoundExams.status, 'pending'));

  // Get top diagnosis from treatments in range
  const treatmentsInRange = await db
    .select({ diagnosis: treatments.diagnosis })
    .from(treatments)
    .innerJoin(encounters, eq(treatments.encounterId, encounters.encounterId))
    .where(
      and(
        gte(encounters.visitDate, fromDate),
        lte(encounters.visitDate, toDate),
        isNotNull(treatments.diagnosis),
        ne(treatments.diagnosis, '')
      )
    );

  const diagnosisCounts: Record<string, number> = treatmentsInRange.reduce((acc: Record<string, number>, t) => {
    const diag = t.diagnosis || 'Unknown';
    acc[diag] = (acc[diag] || 0) + 1;
    return acc;
  }, {});

  const diagnosisEntries = Object.entries(diagnosisCounts).sort(([, a], [, b]) => (b as number) - (a as number));
  const topDiagnosis = diagnosisEntries.length > 0 ? diagnosisEntries[0] : null;

  return {
    totalVisits,
    newPatients: Number(newPatientsResult[0]?.count) || 0,
    labTests: Number(labTestsResult[0]?.count) || 0,
    xrays: Number(xraysResult[0]?.count) || 0,
    ultrasounds: Number(ultrasoundsResult[0]?.count) || 0,
    pending: {
      labResults: Number(pendingLabsResult[0]?.count) || 0,
      xrayReports: Number(pendingXraysResult[0]?.count) || 0,
      ultrasoundReports: Number(pendingUltrasoundsResult[0]?.count) || 0
    },
    topDiagnosis: topDiagnosis ? {
      name: topDiagnosis[0],
      count: topDiagnosis[1] as number
    } : null
  };
}

router.get("/api/reports/insights", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "fromDate and toDate are required" });
    }

    // Fetch current period stats
    const stats = await getDashboardStats(fromDate as string, toDate as string);
    
    // Calculate previous period for comparison
    const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
    const fromDateTime = new Date(fromDate as string);
    const toDateTime = new Date(toDate as string);
    const dateRange = toDateTime.getTime() - fromDateTime.getTime();
    
    // Previous period ends 1 day before current period starts
    const prevToDate = new Date(fromDateTime.getTime() - MILLISECONDS_PER_DAY);
    const prevFromDate = new Date(prevToDate.getTime() - dateRange);
    
    const prevStats = await getDashboardStats(
      prevFromDate.toISOString().split('T')[0],
      prevToDate.toISOString().split('T')[0]
    );

    // Generate insights
    const insights = [];

    // 1. Visit trend analysis
    if (stats.totalVisits > 0) {
      const visitChange = stats.totalVisits - prevStats.totalVisits;
      if (visitChange > 0) {
        insights.push({
          icon: 'TrendingUp',
          text: `Visit volume increased by ${visitChange} visits compared to previous period`,
          type: 'positive'
        });
      } else if (visitChange < 0) {
        insights.push({
          icon: 'TrendingDown',
          text: `Visit volume decreased by ${Math.abs(visitChange)} visits compared to previous period`,
          type: 'warning'
        });
      } else {
        insights.push({
          icon: 'Activity',
          text: `${stats.totalVisits} patient visits recorded this period`,
          type: 'info'
        });
      }
    }

    // 2. Diagnostic test utilization
    const totalTests = stats.labTests + stats.xrays + stats.ultrasounds;
    if (totalTests > 0 && stats.totalVisits > 0) {
      const testsPerVisit = (totalTests / stats.totalVisits).toFixed(1);
      if (parseFloat(testsPerVisit) > 1.5) {
        insights.push({
          icon: 'TestTube',
          text: `High diagnostic activity: ${testsPerVisit} tests per visit on average`,
          type: 'positive'
        });
      } else {
        insights.push({
          icon: 'TestTube',
          text: `${totalTests} diagnostic tests performed across all services`,
          type: 'info'
        });
      }
    }

    // 3. Pending results alert
    const totalPending = stats.pending.labResults + stats.pending.xrayReports + stats.pending.ultrasoundReports;
    if (totalPending > 3) {
      insights.push({
        icon: 'AlertTriangle',
        text: `${totalPending} test results pending review - attention needed`,
        type: 'warning'
      });
    } else if (totalPending > 0) {
      insights.push({
        icon: 'CheckCircle',
        text: `${totalPending} results pending - within normal range`,
        type: 'info'
      });
    }

    // 4. Top diagnosis (if available)
    if (stats.topDiagnosis && stats.topDiagnosis.count > 0) {
      insights.push({
        icon: 'Stethoscope',
        text: `Leading diagnosis: ${stats.topDiagnosis.name} (${stats.topDiagnosis.count} cases)`,
        type: 'info'
      });
    }

    // 5. New patient registration
    if (stats.newPatients > 0) {
      insights.push({
        icon: 'Users',
        text: `${stats.newPatients} new patients registered this period`,
        type: 'positive'
      });
    }

    // If no insights generated, add default message
    if (insights.length === 0) {
      insights.push({
        icon: 'Info',
        text: 'No significant insights for this period. Keep collecting data!',
        type: 'info'
      });
    }

    // Limit to 5 insights
    res.json(insights.slice(0, 5));

  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// Unified dashboard endpoint - single source of truth for Reports page
router.get("/api/reports/dashboard", async (req, res) => {
  try {
    const { fromDate, toDate, compareWithPrevious } = req.query;
    
    console.log("Unified dashboard endpoint called", { fromDate, toDate, compareWithPrevious });
    
    // Validate date parameters
    if (!fromDate || !toDate) {
      return res.status(400).json({ 
        error: "Missing required parameters: fromDate and toDate" 
      });
    }
    
    const fromDateStr = fromDate as string;
    const toDateStr = toDate as string;
    
    // Fetch current period stats (uses encounters for visits, which is correct)
    const stats = await getDashboardStats(fromDateStr, toDateStr);
    
    // Fetch diagnosis data
    const diagnosisData = await storage.getDiagnosisStats(fromDateStr, toDateStr);
    
    // Fetch trends data - use ENCOUNTERS not treatments to match getDashboardStats
    // Visits are defined as ENCOUNTERS, not treatments (treatments can be 0, 1, or many per encounter)
    const startDate = fromDateStr;
    const endDate = toDateStr;
    
    const allEncounters = await db.select({
      visitDate: encounters.visitDate
    }).from(encounters).where(
      and(
        gte(encounters.visitDate, startDate),
        lte(encounters.visitDate, endDate)
      )
    );
    
    // Count visits per day
    const visitCounts: Record<string, number> = {};
    allEncounters.forEach((e: any) => {
      const dayKey = e.visitDate.split('T')[0];
      visitCounts[dayKey] = (visitCounts[dayKey] || 0) + 1;
    });
    
    // Generate array for all days in range (including zero-visit days)
    const trends: Array<{ date: string; visits: number }> = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split('T')[0];
      trends.push({
        date: dayKey,
        visits: visitCounts[dayKey] || 0
      });
    }
    
    // Calculate previous period for comparison
    let previousPeriodStats = null;
    if (compareWithPrevious === 'true') {
      const startDateTime = new Date(fromDateStr);
      const endDateTime = new Date(toDateStr);
      const daysDiff = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
      
      const prevEndDate = new Date(startDateTime);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      const prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
      
      const prevFromDate = prevStartDate.toISOString().split('T')[0];
      const prevToDate = prevEndDate.toISOString().split('T')[0];
      
      const prevStats = await getDashboardStats(prevFromDate, prevToDate);
      previousPeriodStats = {
        totalPatients: prevStats.newPatients,
        newPatients: prevStats.newPatients,
        totalVisits: prevStats.totalVisits,
        labTests: prevStats.labTests,
        xrays: prevStats.xrays,
        ultrasounds: prevStats.ultrasounds,
      };
    }
    
    // Generate AI insights (server-side only)
    const insights = [];
    
    // Calculate previous period for insights
    const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
    const fromDateTime = new Date(fromDateStr);
    const toDateTime = new Date(toDateStr);
    const dateRange = toDateTime.getTime() - fromDateTime.getTime();
    
    const prevToDate = new Date(fromDateTime.getTime() - MILLISECONDS_PER_DAY);
    const prevFromDate = new Date(prevToDate.getTime() - dateRange);
    
    const prevStats = await getDashboardStats(
      prevFromDate.toISOString().split('T')[0],
      prevToDate.toISOString().split('T')[0]
    );
    
    // Only generate insights if there's actual data
    const hasData = stats.totalVisits > 0 || stats.newPatients > 0 || 
                    stats.labTests > 0 || stats.xrays > 0 || stats.ultrasounds > 0;
    
    if (hasData) {
      // Visit trend analysis
      if (stats.totalVisits > 0) {
        const visitChange = stats.totalVisits - prevStats.totalVisits;
        if (visitChange > 0) {
          insights.push({
            icon: 'TrendingUp',
            text: `Visit volume increased by ${visitChange} visits compared to previous period`,
            type: 'positive'
          });
        } else if (visitChange < 0) {
          insights.push({
            icon: 'TrendingDown',
            text: `Visit volume decreased by ${Math.abs(visitChange)} visits compared to previous period`,
            type: 'warning'
          });
        } else {
          insights.push({
            icon: 'Activity',
            text: `${stats.totalVisits} patient visits recorded this period`,
            type: 'info'
          });
        }
      }

      // Diagnostic test utilization
      const totalTests = stats.labTests + stats.xrays + stats.ultrasounds;
      if (totalTests > 0 && stats.totalVisits > 0) {
        const testsPerVisit = (totalTests / stats.totalVisits).toFixed(1);
        if (parseFloat(testsPerVisit) > 1.5) {
          insights.push({
            icon: 'TestTube',
            text: `High diagnostic activity: ${testsPerVisit} tests per visit on average`,
            type: 'positive'
          });
        } else {
          insights.push({
            icon: 'TestTube',
            text: `${totalTests} diagnostic tests performed across all services`,
            type: 'info'
          });
        }
      }

      // Pending results alert
      const totalPending = stats.pending.labResults + stats.pending.xrayReports + stats.pending.ultrasoundReports;
      if (totalPending > 3) {
        insights.push({
          icon: 'AlertTriangle',
          text: `${totalPending} test results pending review - attention needed`,
          type: 'warning'
        });
      } else if (totalPending > 0) {
        insights.push({
          icon: 'CheckCircle',
          text: `${totalPending} results pending - within normal range`,
          type: 'info'
        });
      }

      // Top diagnosis
      if (stats.topDiagnosis && stats.topDiagnosis.count > 0) {
        insights.push({
          icon: 'Stethoscope',
          text: `Leading diagnosis: ${stats.topDiagnosis.name} (${stats.topDiagnosis.count} cases)`,
          type: 'info'
        });
      }

      // New patient registration
      if (stats.newPatients > 0) {
        insights.push({
          icon: 'Users',
          text: `${stats.newPatients} new patients registered this period`,
          type: 'positive'
        });
      }
    }
    
    // If no insights generated, add appropriate message
    if (insights.length === 0) {
      insights.push({
        icon: 'Info',
        text: hasData 
          ? 'No significant insights for this period. Keep collecting data!'
          : 'No activity recorded in the selected period.',
        type: 'info'
      });
    }
    
    // Build unified response
    const response = {
      // Summary KPIs
      summary: {
        totalPatients: stats.newPatients,
        newPatients: stats.newPatients,
        totalVisits: stats.totalVisits,
        labTests: stats.labTests,
        xrays: stats.xrays,
        ultrasounds: stats.ultrasounds,
        pending: stats.pending,
        previousPeriod: previousPeriodStats,
      },
      
      // Trends data
      trends,
      
      // Tests by type (for bar chart)
      testsByType: {
        labTests: stats.labTests,
        xrays: stats.xrays,
        ultrasounds: stats.ultrasounds,
      },
      
      // Top diagnoses
      diagnoses: diagnosisData,
      
      // Pending backlog
      pendingBacklog: {
        total: stats.pending.labResults + stats.pending.xrayReports + stats.pending.ultrasoundReports,
        labResults: stats.pending.labResults,
        xrayReports: stats.pending.xrayReports,
        ultrasoundReports: stats.pending.ultrasoundReports,
      },
      
      // AI insights (server-generated only)
      insights: insights.slice(0, 5),
      
      // Metadata
      metadata: {
        fromDate: fromDateStr,
        toDate: toDateStr,
        generatedAt: new Date().toISOString(),
        hasData,
      },
    };
    
    console.log("Unified dashboard response metadata:", response.metadata);
    res.json(response);
    
  } catch (error) {
    console.error("Unified dashboard endpoint error:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Current Backlog Endpoint - Returns GLOBAL pending counts (all pending right now)
router.get("/api/reports/backlog", async (req, res) => {
  try {
    console.log("Current backlog endpoint called");
    
    // Count ALL pending items regardless of date (current backlog)
    const pendingLabsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(labTests)
      .where(eq(labTests.status, 'pending'));

    const pendingXraysResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(xrayExams)
      .where(eq(xrayExams.status, 'pending'));

    const pendingUltrasoundsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ultrasoundExams)
      .where(eq(ultrasoundExams.status, 'pending'));

    const labResults = Number(pendingLabsResult[0]?.count) || 0;
    const xrayReports = Number(pendingXraysResult[0]?.count) || 0;
    const ultrasoundReports = Number(pendingUltrasoundsResult[0]?.count) || 0;

    res.json({
      total: labResults + xrayReports + ultrasoundReports,
      labResults,
      xrayReports,
      ultrasoundReports,
      metadata: {
        scope: 'current',
        description: 'All pending items system-wide right now',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Current backlog endpoint error:", error);
    res.status(500).json({
      error: "Failed to fetch current backlog",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

import { createServer } from "http";
import { writeFileSync } from "fs";
import path from "path";
import { setupAuth } from "./auth";
import dailyCashRouter from "./reports.daily-cash";
import dailyCashCsvRouter from "./reports.daily-cash.csv";
import dailyCashClosingRouter from "./reports.daily-cash-closing";
import dailyCashReceiptsRouter from "./reports.daily-cash-receipts";

// Function to register routes with the express app
export async function registerRoutes(app: any) {
  // ⚠️ OLD AUTH DISABLED - Using new scrypt-based authentication instead
  // setupAuth(app);  // This was the old Passport.js auth system
  
  // Note: Session middleware is set up in server/index.ts BEFORE this function is called
  
  app.use(router);
  app.use(dailyCashRouter);
  app.use(dailyCashCsvRouter);
  app.use(dailyCashReceiptsRouter);
  app.use(dailyCashClosingRouter);

  // Return a basic HTTP server for compatibility
  return createServer(app);
}
