import { eq, like, ilike, desc, and, count, or, sql } from "drizzle-orm";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

const { patients, treatments, labTests, xrayExams, ultrasoundExams, pharmacyOrders } = schema;

// Tables are automatically created by Drizzle with PostgreSQL
console.log("✓ Database connection established");

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

async function generatePharmacyId(): Promise<string> {
  if (prescriptionCounter === 0) {
    const allOrders = await db.select().from(pharmacyOrders);
    prescriptionCounter = allOrders.length;
  }
  prescriptionCounter++;
  return `BGC-PHARM${prescriptionCounter}`;
}


export interface IStorage {
  // Patients
  createPatient(data: schema.InsertPatient): Promise<schema.Patient>;
  getPatients(search?: string): Promise<schema.Patient[]>;
  getPatientById(id: string): Promise<schema.Patient | null>;
  getPatientByPatientId(patientId: string): Promise<schema.Patient | null>;
  updatePatient(patientId: string, data: Partial<schema.InsertPatient>): Promise<schema.Patient>;

  // Treatments
  createTreatment(data: schema.InsertTreatment): Promise<schema.Treatment>;
  getTreatmentsByPatient(patientId: string): Promise<schema.Treatment[]>;
  getTreatments(limit?: number): Promise<schema.Treatment[]>;

  // Lab Tests
  createLabTest(data: schema.InsertLabTest): Promise<schema.LabTest>;
  getLabTests(status?: string): Promise<schema.LabTest[]>;
  getLabTestsByPatient(patientId: string): Promise<schema.LabTest[]>;
  updateLabTest(testId: string, data: Partial<schema.LabTest>): Promise<schema.LabTest>;
  updateLabTestAttachments(testId: string, attachments: any[]): Promise<schema.LabTest>;

  // X-Ray Exams
  createXrayExam(data: schema.InsertXrayExam): Promise<schema.XrayExam>;
  getXrayExams(status?: string): Promise<schema.XrayExam[]>;
  getXrayExamsByPatient(patientId: string): Promise<schema.XrayExam[]>;
  updateXrayExam(examId: string, data: Partial<schema.XrayExam>): Promise<schema.XrayExam>;

  // Ultrasound Exams
  createUltrasoundExam(data: schema.InsertUltrasoundExam): Promise<schema.UltrasoundExam>;
  getUltrasoundExams(status?: string): Promise<schema.UltrasoundExam[]>;
  getUltrasoundExamsByPatient(patientId: string): Promise<schema.UltrasoundExam[]>;
  updateUltrasoundExam(examId: string, data: Partial<schema.UltrasoundExam>): Promise<schema.UltrasoundExam>;

  // Pharmacy Orders
  createPharmacyOrder(data: schema.InsertPharmacyOrder): Promise<schema.PharmacyOrder>;
  getPharmacyOrders(status?: string): Promise<schema.PharmacyOrder[]>;
  getPharmacyOrdersByPatient(patientId: string): Promise<schema.PharmacyOrder[]>;
  updatePharmacyOrder(orderId: string, data: Partial<schema.PharmacyOrder>): Promise<schema.PharmacyOrder>;
  dispensePharmacyOrder(orderId: string): Promise<schema.PharmacyOrder>;


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

  getRecentPatients(limit?: number): Promise<(schema.Patient & { lastVisit?: string; status: string })[]>;
  
  // Today filters
  getTodaysPatients(): Promise<schema.Patient[]>;
  getPatientsByDate(date: string): Promise<schema.Patient[]>;
  getTodaysTreatments(): Promise<schema.Treatment[]>;
  
  // Enhanced patient queries with service status
  getPatientsWithStatus(search?: string): Promise<(schema.Patient & { serviceStatus: any })[]>;
  getTodaysPatientsWithStatus(): Promise<(schema.Patient & { serviceStatus: any })[]>;
  getPatientsByDateWithStatus(date: string): Promise<(schema.Patient & { serviceStatus: any })[]>;
  getPatientServiceStatus(patientId: string): Promise<any>;
}

export class MemStorage implements IStorage {
  async createPatient(data: schema.InsertPatient): Promise<schema.Patient> {
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

  async getPatients(search?: string): Promise<schema.Patient[]> {
    if (search) {
      return await db.select().from(patients)
        .where(
          or(
            ilike(patients.firstName, `%${search}%`),
            ilike(patients.lastName, `%${search}%`),
            ilike(patients.patientId, `%${search}%`)
          )
        )
        .orderBy(desc(patients.createdAt));
    }
    
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatientById(id: string): Promise<schema.Patient | null> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, parseInt(id)));
    return patient || null;
  }

  async getPatientByPatientId(patientId: string): Promise<schema.Patient | null> {
    const [patient] = await db.select().from(patients).where(eq(patients.patientId, patientId));
    return patient || null;
  }

  async updatePatient(patientId: string, data: Partial<schema.InsertPatient>): Promise<schema.Patient> {
    const [patient] = await db.update(patients)
      .set(data as any)
      .where(eq(patients.patientId, patientId))
      .returning();
    
    return patient;
  }

  async createTreatment(data: schema.InsertTreatment): Promise<schema.Treatment> {
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

  async getTreatmentsByPatient(patientId: string): Promise<schema.Treatment[]> {
    return await db.select().from(treatments)
      .where(eq(treatments.patientId, patientId))
      .orderBy(desc(treatments.visitDate));
  }

  async getTreatments(limit = 50): Promise<schema.Treatment[]> {
    return await db.select().from(treatments)
      .orderBy(desc(treatments.visitDate))
      .limit(limit);
  }

  async createLabTest(data: schema.InsertLabTest): Promise<schema.LabTest> {
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

  async getLabTests(status?: string): Promise<schema.LabTest[]> {
    const query = db.select().from(labTests);
    
    if (status) {
      return await query.where(eq(labTests.status, status as any)).orderBy(desc(labTests.requestedDate));
    }
    
    return await query.orderBy(desc(labTests.requestedDate));
  }

  async getLabTestsByPatient(patientId: string): Promise<schema.LabTest[]> {
    return await db.select().from(labTests)
      .where(eq(labTests.patientId, patientId))
      .orderBy(desc(labTests.requestedDate));
  }

  async updateLabTest(testId: string, data: Partial<schema.LabTest>): Promise<schema.LabTest> {
    const [labTest] = await db.update(labTests)
      .set(data)
      .where(eq(labTests.testId, testId))
      .returning();
    
    return labTest;
  }

  async updateLabTestAttachments(testId: string, attachments: any[]): Promise<schema.LabTest> {
    const attachmentsJson = JSON.stringify(attachments);
    const [labTest] = await db.update(labTests)
      .set({ attachments: attachmentsJson })
      .where(eq(labTests.testId, testId))
      .returning();
    
    return labTest;
  }

  async createXrayExam(data: schema.InsertXrayExam): Promise<schema.XrayExam> {
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

  async getXrayExams(status?: string): Promise<schema.XrayExam[]> {
    const query = db.select().from(xrayExams);
    
    if (status) {
      return await query.where(eq(xrayExams.status, status as any)).orderBy(desc(xrayExams.requestedDate));
    }
    
    return await query.orderBy(desc(xrayExams.requestedDate));
  }

  async getXrayExamsByPatient(patientId: string): Promise<schema.XrayExam[]> {
    return await db.select().from(xrayExams)
      .where(eq(xrayExams.patientId, patientId))
      .orderBy(desc(xrayExams.requestedDate));
  }

  async updateXrayExam(examId: string, data: Partial<schema.XrayExam>): Promise<schema.XrayExam> {
    const [xrayExam] = await db.update(xrayExams)
      .set(data)
      .where(eq(xrayExams.examId, examId))
      .returning();
    
    return xrayExam;
  }

  // Ultrasound Exams
  async createUltrasoundExam(data: schema.InsertUltrasoundExam): Promise<schema.UltrasoundExam> {
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

  async getUltrasoundExams(status?: string): Promise<schema.UltrasoundExam[]> {
    const query = db.select().from(ultrasoundExams);
    
    if (status) {
      return await query.where(eq(ultrasoundExams.status, status as any)).orderBy(desc(ultrasoundExams.requestedDate));
    }
    
    return await query.orderBy(desc(ultrasoundExams.requestedDate));
  }

  async getUltrasoundExamsByPatient(patientId: string): Promise<schema.UltrasoundExam[]> {
    return await db.select().from(ultrasoundExams)
      .where(eq(ultrasoundExams.patientId, patientId))
      .orderBy(desc(ultrasoundExams.requestedDate));
  }

  async updateUltrasoundExam(examId: string, data: Partial<schema.UltrasoundExam>): Promise<schema.UltrasoundExam> {
    const [ultrasoundExam] = await db.update(ultrasoundExams)
      .set(data)
      .where(eq(ultrasoundExams.examId, examId))
      .returning();
    
    return ultrasoundExam;
  }

  async deleteUltrasoundExam(examId: string): Promise<boolean> {
    const result = await db.delete(ultrasoundExams)
      .where(eq(ultrasoundExams.examId, examId))
      .returning();
    
    return result.length > 0;
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

  async getRecentPatients(limit = 5): Promise<(schema.Patient & { lastVisit?: string; status: string })[]> {
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
  async getTodaysPatients(): Promise<schema.Patient[]> {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    return await db.select().from(patients)
      .where(
        // Check if created today by comparing the date part of the timestamp
        like(patients.createdAt, `${today}%`)
      )
      .orderBy(desc(patients.createdAt));
  }

  async getPatientsByDate(date: string): Promise<schema.Patient[]> {
    return await db.select().from(patients)
      .where(
        // Use DATE function to extract date part, avoiding timezone issues
        sql`DATE(${patients.createdAt}) = ${date}`
      )
      .orderBy(desc(patients.createdAt));
  }
  
  async getTodaysTreatments(): Promise<schema.Treatment[]> {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    
    return await db.select().from(treatments)
      .where(
        // Check if visit date is today (exact match) or created today
        or(
          eq(treatments.visitDate, today),
          like(treatments.createdAt, `${today}%`)
        )
      )
      .orderBy(desc(treatments.createdAt));
  }





  // Pharmacy Orders
  async createPharmacyOrder(data: schema.InsertPharmacyOrder): Promise<schema.PharmacyOrder> {
    const orderId = await generatePharmacyId();
    const now = new Date().toISOString();
    const insertData = {
      ...data,
      orderId,
      createdAt: now,
    };
    
    const [pharmacyOrder] = await db.insert(pharmacyOrders).values([insertData]).returning();
    return pharmacyOrder;
  }

  async getPharmacyOrders(status?: string): Promise<schema.PharmacyOrder[]> {
    if (status) {
      return await db.select().from(pharmacyOrders)
        .where(eq(pharmacyOrders.status, status as any))
        .orderBy(desc(pharmacyOrders.createdAt));
    }
    return await db.select().from(pharmacyOrders).orderBy(desc(pharmacyOrders.createdAt));
  }

  async getPharmacyOrdersByPatient(patientId: string): Promise<schema.PharmacyOrder[]> {
    return await db.select().from(pharmacyOrders)
      .where(eq(pharmacyOrders.patientId, patientId))
      .orderBy(desc(pharmacyOrders.createdAt));
  }

  async updatePharmacyOrder(orderId: string, data: Partial<schema.PharmacyOrder>): Promise<schema.PharmacyOrder> {
    const [pharmacyOrder] = await db.update(pharmacyOrders)
      .set(data)
      .where(eq(pharmacyOrders.orderId, orderId))
      .returning();
    
    return pharmacyOrder;
  }

  async dispensePharmacyOrder(orderId: string): Promise<schema.PharmacyOrder> {
    const [pharmacyOrder] = await db.update(pharmacyOrders)
      .set({ status: 'dispensed' })
      .where(eq(pharmacyOrders.orderId, orderId))
      .returning();
    
    return pharmacyOrder;
  }

  // Enhanced patient queries with service status information
  async getPatientsWithStatus(search?: string): Promise<(schema.Patient & { serviceStatus: any })[]> {
    let patientsData: schema.Patient[];
    
    if (search) {
      patientsData = await db.select().from(patients)
        .where(
          or(
            ilike(patients.firstName, `%${search}%`),
            ilike(patients.lastName, `%${search}%`),
            ilike(patients.patientId, `%${search}%`)
          )
        )
        .orderBy(desc(patients.createdAt));
    } else {
      patientsData = await db.select().from(patients).orderBy(desc(patients.createdAt));
    }
    
    // For each patient, get their service status summary
    const patientsWithStatus = await Promise.all(
      patientsData.map(async (patient) => {
        const serviceStatus = await this.getPatientServiceStatus(patient.patientId);
        return { ...patient, serviceStatus };
      })
    );
    
    return patientsWithStatus;
  }

  async getTodaysPatientsWithStatus(): Promise<(schema.Patient & { serviceStatus: any })[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const patientsData = await db.select().from(patients)
      .where(like(patients.createdAt, `${today}%`))
      .orderBy(desc(patients.createdAt));
    
    const patientsWithStatus = await Promise.all(
      patientsData.map(async (patient) => {
        const serviceStatus = await this.getPatientServiceStatus(patient.patientId);
        return { ...patient, serviceStatus };
      })
    );
    
    return patientsWithStatus;
  }

  async getPatientsByDateWithStatus(date: string): Promise<(schema.Patient & { serviceStatus: any })[]> {
    const patientsData = await db.select().from(patients)
      .where(sql`DATE(${patients.createdAt}) = ${date}`)
      .orderBy(desc(patients.createdAt));
    
    const patientsWithStatus = await Promise.all(
      patientsData.map(async (patient) => {
        const serviceStatus = await this.getPatientServiceStatus(patient.patientId);
        return { ...patient, serviceStatus };
      })
    );
    
    return patientsWithStatus;
  }

  async getPatientServiceStatus(patientId: string) {
    // Get counts of services by payment status
    const [labTestsData, xrayExamsData, ultrasoundExamsData, pharmacyOrdersData] = await Promise.all([
      db.select({
        total: sql<number>`count(*)`,
        unpaid: sql<number>`sum(case when ${labTests.paymentStatus} = 'unpaid' then 1 else 0 end)`,
        pending: sql<number>`sum(case when ${labTests.status} = 'pending' then 1 else 0 end)`,
        completed: sql<number>`sum(case when ${labTests.status} = 'completed' then 1 else 0 end)`,
      })
      .from(labTests)
      .where(eq(labTests.patientId, patientId)),
      
      db.select({
        total: sql<number>`count(*)`,
        unpaid: sql<number>`sum(case when ${xrayExams.paymentStatus} = 'unpaid' then 1 else 0 end)`,
        pending: sql<number>`sum(case when ${xrayExams.status} = 'pending' then 1 else 0 end)`,
        completed: sql<number>`sum(case when ${xrayExams.status} = 'completed' then 1 else 0 end)`,
      })
      .from(xrayExams)
      .where(eq(xrayExams.patientId, patientId)),
      
      db.select({
        total: sql<number>`count(*)`,
        unpaid: sql<number>`sum(case when ${ultrasoundExams.paymentStatus} = 'unpaid' then 1 else 0 end)`,
        pending: sql<number>`sum(case when ${ultrasoundExams.status} = 'pending' then 1 else 0 end)`,
        completed: sql<number>`sum(case when ${ultrasoundExams.status} = 'completed' then 1 else 0 end)`,
      })
      .from(ultrasoundExams)
      .where(eq(ultrasoundExams.patientId, patientId)),
      
      db.select({
        total: sql<number>`count(*)`,
        prescribed: sql<number>`sum(case when ${pharmacyOrders.status} = 'prescribed' then 1 else 0 end)`,
        dispensed: sql<number>`sum(case when ${pharmacyOrders.status} = 'dispensed' then 1 else 0 end)`,
      })
      .from(pharmacyOrders)
      .where(eq(pharmacyOrders.patientId, patientId))
    ]);

    // Sum up totals
    const totals = {
      totalServices: (labTestsData[0]?.total || 0) + (xrayExamsData[0]?.total || 0) + (ultrasoundExamsData[0]?.total || 0) + (pharmacyOrdersData[0]?.total || 0),
      unpaidServices: 0,
      pendingServices: (labTestsData[0]?.pending || 0) + (xrayExamsData[0]?.pending || 0) + (ultrasoundExamsData[0]?.pending || 0) + (pharmacyOrdersData[0]?.prescribed || 0),
      completedServices: (labTestsData[0]?.completed || 0) + (xrayExamsData[0]?.completed || 0) + (ultrasoundExamsData[0]?.completed || 0) + (pharmacyOrdersData[0]?.dispensed || 0),
      hasUnpaidServices: false,
      hasPendingServices: ((labTestsData[0]?.pending || 0) + (xrayExamsData[0]?.pending || 0) + (ultrasoundExamsData[0]?.pending || 0) + (pharmacyOrdersData[0]?.prescribed || 0)) > 0
    };

    return totals;
  }
}


export const storage = new MemStorage();

