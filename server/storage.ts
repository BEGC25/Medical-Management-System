import { eq, like, desc, and, count, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { patients, treatments, labTests, xrayExams, ultrasoundExams, type Patient, type Treatment, type LabTest, type XrayExam, type UltrasoundExam, type InsertPatient, type InsertTreatment, type InsertLabTest, type InsertXrayExam, type InsertUltrasoundExam } from "@shared/schema";

// Use SQLite for development to avoid connection issues
const sqlite = new Database("clinic.db");
export const db = drizzle(sqlite);

// Initialize tables if they don't exist
try {
  sqlite.exec(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT,
    gender TEXT,
    phone_number TEXT,
    village TEXT,
    emergency_contact TEXT,
    allergies TEXT,
    medical_history TEXT,
    created_at TEXT NOT NULL
  )`);

  sqlite.exec(`DROP TABLE IF EXISTS treatments`);
  sqlite.exec(`CREATE TABLE IF NOT EXISTS treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    treatment_id TEXT UNIQUE NOT NULL,
    patient_id TEXT NOT NULL,
    visit_date TEXT NOT NULL,
    visit_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    chief_complaint TEXT,
    temperature REAL,
    blood_pressure TEXT,
    heart_rate INTEGER,
    weight REAL,
    examination TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    follow_up_date TEXT,
    follow_up_type TEXT,
    created_at TEXT NOT NULL
  )`);

  sqlite.exec(`DROP TABLE IF EXISTS lab_tests`);
  sqlite.exec(`CREATE TABLE IF NOT EXISTS lab_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id TEXT UNIQUE NOT NULL,
    patient_id TEXT NOT NULL,
    category TEXT NOT NULL,
    tests TEXT NOT NULL,
    clinical_info TEXT,
    priority TEXT NOT NULL DEFAULT 'routine',
    requested_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    results TEXT,
    normal_values TEXT,
    result_status TEXT,
    completed_date TEXT,
    technician_notes TEXT,
    attachments TEXT,
    created_at TEXT NOT NULL
  )`);

  sqlite.exec(`DROP TABLE IF EXISTS xray_exams`);
  sqlite.exec(`CREATE TABLE IF NOT EXISTS xray_exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id TEXT UNIQUE NOT NULL,
    patient_id TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    body_part TEXT,
    clinical_indication TEXT,
    special_instructions TEXT,
    priority TEXT NOT NULL DEFAULT 'routine',
    requested_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    technical_quality TEXT,
    findings TEXT,
    impression TEXT,
    recommendations TEXT,
    report_status TEXT,
    report_date TEXT,
    radiologist TEXT,
    created_at TEXT NOT NULL
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS ultrasound_exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id TEXT UNIQUE NOT NULL,
    patient_id TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    clinical_indication TEXT,
    special_instructions TEXT,
    priority TEXT NOT NULL DEFAULT 'routine',
    requested_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    image_quality TEXT,
    findings TEXT,
    impression TEXT,
    recommendations TEXT,
    report_status TEXT,
    report_date TEXT,
    sonographer TEXT,
    created_at TEXT NOT NULL
  )`);
  
  console.log("✓ Database tables initialized");
} catch (error) {
  console.log("Database initialization error:", error);
}

// Migrations already applied manually

// Counters for sequential IDs
let patientCounter = 0;
let treatmentCounter = 0;
let labCounter = 0;
let xrayCounter = 0;
let ultrasoundCounter = 0;
let prescriptionCounter = 0;

function generatePatientId(): string {
  patientCounter++;
  return `BGC${patientCounter}`;
}

async function generateTreatmentId(): Promise<string> {
  if (treatmentCounter === 0) {
    const allTreatments = await db.select().from(treatments);
    treatmentCounter = allTreatments.length;
  }
  treatmentCounter++;
  return `BGC-RX${treatmentCounter}`;
}

async function generateLabId(): Promise<string> {
  if (labCounter === 0) {
    const allLabs = await db.select().from(labTests);
    labCounter = allLabs.length;
  }
  labCounter++;
  return `BGC-LAB${labCounter}`;
}

async function generateXrayId(): Promise<string> {
  if (xrayCounter === 0) {
    const allXrays = await db.select().from(xrayExams);
    xrayCounter = allXrays.length;
  }
  xrayCounter++;
  return `BGC-XR${xrayCounter}`;
}

async function generateUltrasoundId(): Promise<string> {
  if (ultrasoundCounter === 0) {
    const allUltrasounds = await db.select().from(ultrasoundExams);
    ultrasoundCounter = allUltrasounds.length;
  }
  ultrasoundCounter++;
  return `BGC-US${ultrasoundCounter}`;
}

async function generatePrescriptionId(): Promise<string> {
  if (prescriptionCounter === 0) {
    // For future prescription table
    prescriptionCounter = 0;
  }
  prescriptionCounter++;
  return `BGC-RX${prescriptionCounter}`;
}

export interface IStorage {
  // Patients
  createPatient(data: InsertPatient): Promise<Patient>;
  getPatients(search?: string): Promise<Patient[]>;
  getPatientById(id: string): Promise<Patient | null>;
  getPatientByPatientId(patientId: string): Promise<Patient | null>;
  updatePatient(patientId: string, data: Partial<InsertPatient>): Promise<Patient>;

  // Treatments
  createTreatment(data: InsertTreatment): Promise<Treatment>;
  getTreatmentsByPatient(patientId: string): Promise<Treatment[]>;
  getTreatments(limit?: number): Promise<Treatment[]>;

  // Lab Tests
  createLabTest(data: InsertLabTest): Promise<LabTest>;
  getLabTests(status?: string): Promise<LabTest[]>;
  getLabTestsByPatient(patientId: string): Promise<LabTest[]>;
  updateLabTest(testId: string, data: Partial<LabTest>): Promise<LabTest>;
  updateLabTestAttachments(testId: string, attachments: any[]): Promise<LabTest>;

  // X-Ray Exams
  createXrayExam(data: InsertXrayExam): Promise<XrayExam>;
  getXrayExams(status?: string): Promise<XrayExam[]>;
  getXrayExamsByPatient(patientId: string): Promise<XrayExam[]>;
  updateXrayExam(examId: string, data: Partial<XrayExam>): Promise<XrayExam>;

  // Ultrasound Exams
  createUltrasoundExam(data: InsertUltrasoundExam): Promise<UltrasoundExam>;
  getUltrasoundExams(status?: string): Promise<UltrasoundExam[]>;
  getUltrasoundExamsByPatient(patientId: string): Promise<UltrasoundExam[]>;
  updateUltrasoundExam(examId: string, data: Partial<UltrasoundExam>): Promise<UltrasoundExam>;

  // Statistics
  getDashboardStats(): Promise<{
    newPatients: number;
    totalVisits: number;
    labTests: number;
    xrays: number;
    ultrasounds: number;
    pending: {
      labResults: number;
      xrayReports: number;
      ultrasoundReports: number;
    };
  }>;

  getRecentPatients(limit?: number): Promise<(Patient & { lastVisit?: string; status: string })[]>;
  
  // Today filters
  getTodaysPatients(): Promise<Patient[]>;
  getTodaysTreatments(): Promise<Treatment[]>;
}

export class MemStorage implements IStorage {
  async createPatient(data: InsertPatient): Promise<Patient> {
    // Initialize counter from existing patients if not set
    if (patientCounter === 0) {
      const allPatients = await db.select().from(patients);
      patientCounter = allPatients.length;
    }
    
    const patientId = generatePatientId();
    const now = new Date().toISOString();
    
    const insertData: any = {
      ...data,
      patientId,
      createdAt: now,
    };
    
    const [patient] = await db.insert(patients).values(insertData).returning();
    
    return patient;
  }

  async getPatients(search?: string): Promise<Patient[]> {
    if (search) {
      return await db.select().from(patients)
        .where(
          or(
            like(patients.firstName, `%${search}%`),
            like(patients.lastName, `%${search}%`),
            like(patients.patientId, `%${search}%`)
          )
        )
        .orderBy(desc(patients.createdAt));
    }
    
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatientById(id: string): Promise<Patient | null> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, parseInt(id)));
    return patient || null;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | null> {
    const [patient] = await db.select().from(patients).where(eq(patients.patientId, patientId));
    return patient || null;
  }

  async updatePatient(patientId: string, data: Partial<InsertPatient>): Promise<Patient> {
    const [patient] = await db.update(patients)
      .set(data as any)
      .where(eq(patients.patientId, patientId))
      .returning();
    
    return patient;
  }

  async createTreatment(data: InsertTreatment): Promise<Treatment> {
    const treatmentId = await generateTreatmentId();
    const now = new Date().toISOString();
    
    const insertData: any = {
      ...data,
      treatmentId,
      createdAt: now,
    };
    
    const [treatment] = await db.insert(treatments).values(insertData).returning();
    
    return treatment;
  }

  async getTreatmentsByPatient(patientId: string): Promise<Treatment[]> {
    return await db.select().from(treatments)
      .where(eq(treatments.patientId, patientId))
      .orderBy(desc(treatments.visitDate));
  }

  async getTreatments(limit = 50): Promise<Treatment[]> {
    return await db.select().from(treatments)
      .orderBy(desc(treatments.visitDate))
      .limit(limit);
  }

  async createLabTest(data: InsertLabTest): Promise<LabTest> {
    const testId = await generateLabId();
    const now = new Date().toISOString();
    
    const insertData: any = {
      ...data,
      testId,
      status: "pending",
      createdAt: now,
    };
    
    const [labTest] = await db.insert(labTests).values(insertData).returning();
    
    return labTest;
  }

  async getLabTests(status?: string): Promise<LabTest[]> {
    const query = db.select().from(labTests);
    
    if (status) {
      return await query.where(eq(labTests.status, status as any)).orderBy(desc(labTests.requestedDate));
    }
    
    return await query.orderBy(desc(labTests.requestedDate));
  }

  async getLabTestsByPatient(patientId: string): Promise<LabTest[]> {
    return await db.select().from(labTests)
      .where(eq(labTests.patientId, patientId))
      .orderBy(desc(labTests.requestedDate));
  }

  async updateLabTest(testId: string, data: Partial<LabTest>): Promise<LabTest> {
    const [labTest] = await db.update(labTests)
      .set(data)
      .where(eq(labTests.testId, testId))
      .returning();
    
    return labTest;
  }

  async updateLabTestAttachments(testId: string, attachments: any[]): Promise<LabTest> {
    const attachmentsJson = JSON.stringify(attachments);
    const [labTest] = await db.update(labTests)
      .set({ attachments: attachmentsJson })
      .where(eq(labTests.testId, testId))
      .returning();
    
    return labTest;
  }

  async createXrayExam(data: InsertXrayExam): Promise<XrayExam> {
    const examId = await generateXrayId();
    const now = new Date().toISOString();
    
    const insertData: any = {
      ...data,
      examId,
      status: "pending",
      createdAt: now,
    };
    
    const [xrayExam] = await db.insert(xrayExams).values(insertData).returning();
    
    return xrayExam;
  }

  async getXrayExams(status?: string): Promise<XrayExam[]> {
    const query = db.select().from(xrayExams);
    
    if (status) {
      return await query.where(eq(xrayExams.status, status as any)).orderBy(desc(xrayExams.requestedDate));
    }
    
    return await query.orderBy(desc(xrayExams.requestedDate));
  }

  async getXrayExamsByPatient(patientId: string): Promise<XrayExam[]> {
    return await db.select().from(xrayExams)
      .where(eq(xrayExams.patientId, patientId))
      .orderBy(desc(xrayExams.requestedDate));
  }

  async updateXrayExam(examId: string, data: Partial<XrayExam>): Promise<XrayExam> {
    const [xrayExam] = await db.update(xrayExams)
      .set(data)
      .where(eq(xrayExams.examId, examId))
      .returning();
    
    return xrayExam;
  }

  // Ultrasound Exams
  async createUltrasoundExam(data: InsertUltrasoundExam): Promise<UltrasoundExam> {
    const examId = await generateUltrasoundId();
    const createdAt = new Date().toISOString();
    
    const insertData: any = {
      ...data,
      examId,
      status: "pending",
      createdAt,
    };
    
    const [ultrasoundExam] = await db.insert(ultrasoundExams)
      .values(insertData)
      .returning();
    
    return ultrasoundExam;
  }

  async getUltrasoundExams(status?: string): Promise<UltrasoundExam[]> {
    const query = db.select().from(ultrasoundExams);
    
    if (status) {
      return await query.where(eq(ultrasoundExams.status, status as any)).orderBy(desc(ultrasoundExams.requestedDate));
    }
    
    return await query.orderBy(desc(ultrasoundExams.requestedDate));
  }

  async getUltrasoundExamsByPatient(patientId: string): Promise<UltrasoundExam[]> {
    return await db.select().from(ultrasoundExams)
      .where(eq(ultrasoundExams.patientId, patientId))
      .orderBy(desc(ultrasoundExams.requestedDate));
  }

  async updateUltrasoundExam(examId: string, data: Partial<UltrasoundExam>): Promise<UltrasoundExam> {
    const [ultrasoundExam] = await db.update(ultrasoundExams)
      .set(data)
      .where(eq(ultrasoundExams.examId, examId))
      .returning();
    
    return ultrasoundExam;
  }

  async getDashboardStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log("Getting dashboard stats for date:", today);
      
      // Get counts with simple queries first
      const totalPatients = await db.select({ count: count() }).from(patients);
      const totalTreatments = await db.select({ count: count() }).from(treatments);
      const totalLabTests = await db.select({ count: count() }).from(labTests);
      const totalXrays = await db.select({ count: count() }).from(xrayExams);
      const totalUltrasounds = await db.select({ count: count() }).from(ultrasoundExams);
      
      // Get pending counts
      const pendingLabTests = await db.select({ count: count() }).from(labTests)
        .where(eq(labTests.status, "pending"));
      const pendingXrays = await db.select({ count: count() }).from(xrayExams)
        .where(eq(xrayExams.status, "pending"));
      const pendingUltrasounds = await db.select({ count: count() }).from(ultrasoundExams)
        .where(eq(ultrasoundExams.status, "pending"));
      
      console.log("Total counts:", {
        patients: totalPatients[0]?.count || 0,
        treatments: totalTreatments[0]?.count || 0,
        labs: totalLabTests[0]?.count || 0,
        xrays: totalXrays[0]?.count || 0,
        ultrasounds: totalUltrasounds[0]?.count || 0,
        pendingLabs: pendingLabTests[0]?.count || 0,
        pendingXrays: pendingXrays[0]?.count || 0,
        pendingUltrasounds: pendingUltrasounds[0]?.count || 0
      });
      
      return {
        newPatients: totalPatients[0]?.count || 0,
        totalVisits: totalTreatments[0]?.count || 0,
        labTests: totalLabTests[0]?.count || 0,
        xrays: totalXrays[0]?.count || 0,
        ultrasounds: totalUltrasounds[0]?.count || 0,
        pending: {
          labResults: pendingLabTests[0]?.count || 0,
          xrayReports: pendingXrays[0]?.count || 0,
          ultrasoundReports: pendingUltrasounds[0]?.count || 0,
        },
      };
    } catch (error) {
      console.error("Dashboard stats error:", error);
      throw error;
    }
  }

  async getRecentPatients(limit = 5): Promise<(Patient & { lastVisit?: string; status: string })[]> {
    try {
      console.log("Getting recent patients, limit:", limit);
      const recentPatients = await db.select().from(patients)
        .orderBy(desc(patients.createdAt))
        .limit(limit);
      
      console.log("Found patients:", recentPatients.length);
      
      const result = [];
      for (const patient of recentPatients) {
        try {
          // Use a simpler query that works with SQLite
          const treatmentResults = await db.select().from(treatments)
            .where(eq(treatments.patientId, patient.patientId))
            .orderBy(desc(treatments.createdAt))
            .limit(1);
          
          const lastTreatment = treatmentResults[0];
          
          result.push({
            ...patient,
            lastVisit: lastTreatment?.visitDate,
            status: lastTreatment ? "Treated" : "New",
          });
        } catch (treatmentError) {
          console.log("Error getting treatment for patient:", patient.patientId, treatmentError);
          // Add patient without treatment info if treatment query fails
          result.push({
            ...patient,
            lastVisit: undefined,
            status: "New",
          });
        }
      }
      
      console.log("Recent patients result:", result);
      return result;
    } catch (error) {
      console.error("getRecentPatients error:", error);
      throw error;
    }
  }
  // Today filter methods
  async getTodaysPatients(): Promise<Patient[]> {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    return await db.select().from(patients)
      .where(
        and(
          // Check if created today
          eq(patients.createdAt, today) // This might need adjustment based on how dates are stored
        )
      )
      .orderBy(desc(patients.createdAt));
  }
  
  async getTodaysTreatments(): Promise<Treatment[]> {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    return await db.select().from(treatments)
      .where(
        eq(treatments.visitDate, today)
      )
      .orderBy(desc(treatments.createdAt));
  }
}

export const storage = new MemStorage();
