import { eq, like, desc, and, count, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { patients, treatments, labTests, xrayExams, type Patient, type Treatment, type LabTest, type XrayExam, type InsertPatient, type InsertTreatment, type InsertLabTest, type InsertXrayExam } from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// Migrations already applied manually

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}${random}`.toUpperCase();
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

  // X-Ray Exams
  createXrayExam(data: InsertXrayExam): Promise<XrayExam>;
  getXrayExams(status?: string): Promise<XrayExam[]>;
  getXrayExamsByPatient(patientId: string): Promise<XrayExam[]>;
  updateXrayExam(examId: string, data: Partial<XrayExam>): Promise<XrayExam>;

  // Statistics
  getDashboardStats(): Promise<{
    newPatients: number;
    totalVisits: number;
    labTests: number;
    xrays: number;
    pending: {
      labResults: number;
      xrayReports: number;
      prescriptions: number;
    };
  }>;

  getRecentPatients(limit?: number): Promise<(Patient & { lastVisit?: string; status: string })[]>;
}

export class MemStorage implements IStorage {
  async createPatient(data: InsertPatient): Promise<Patient> {
    const patientId = generateId("PT");
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
    const now = new Date().toISOString();
    
    const insertData: any = {
      ...data,
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
    const testId = generateId("LAB");
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

  async createXrayExam(data: InsertXrayExam): Promise<XrayExam> {
    const examId = generateId("XR");
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

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    const [newPatientsResult] = await db.select({ count: count() }).from(patients)
      .where(like(patients.createdAt, `${today}%`));
    
    const [totalVisitsResult] = await db.select({ count: count() }).from(treatments)
      .where(like(treatments.visitDate, `${today}%`));
    
    const [labTestsResult] = await db.select({ count: count() }).from(labTests)
      .where(like(labTests.requestedDate, `${today}%`));
    
    const [xraysResult] = await db.select({ count: count() }).from(xrayExams)
      .where(like(xrayExams.requestedDate, `${today}%`));
    
    const [pendingLabsResult] = await db.select({ count: count() }).from(labTests)
      .where(eq(labTests.status, "pending"));
    
    const [pendingXraysResult] = await db.select({ count: count() }).from(xrayExams)
      .where(eq(xrayExams.status, "pending"));
    
    return {
      newPatients: newPatientsResult.count,
      totalVisits: totalVisitsResult.count,
      labTests: labTestsResult.count,
      xrays: xraysResult.count,
      pending: {
        labResults: pendingLabsResult.count,
        xrayReports: pendingXraysResult.count,
        prescriptions: 0, // Placeholder for future prescription feature
      },
    };
  }

  async getRecentPatients(limit = 5): Promise<(Patient & { lastVisit?: string; status: string })[]> {
    const recentPatients = await db.select().from(patients)
      .orderBy(desc(patients.createdAt))
      .limit(limit);
    
    const result = [];
    for (const patient of recentPatients) {
      const [lastTreatment] = await db.select().from(treatments)
        .where(eq(treatments.patientId, patient.patientId))
        .orderBy(desc(treatments.visitDate))
        .limit(1);
      
      result.push({
        ...patient,
        lastVisit: lastTreatment?.visitDate,
        status: lastTreatment ? "Treated" : "New",
      });
    }
    
    return result;
  }
}

export const storage = new MemStorage();
