import { eq, like, ilike, desc, and, count, or, sql } from "drizzle-orm";
import { db } from './db';
import * as schema from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const { users, patients, treatments, labTests, xrayExams, ultrasoundExams, pharmacyOrders, services, payments, paymentItems, billingSettings, encounters, orderLines, invoices, invoiceLines } = schema;

// Tables are automatically created by Drizzle
console.log("✓ Database connection established");

// Counters for sequential IDs
let patientCounter = 0;
let treatmentCounter = 0;
let labCounter = 0;
let xrayCounter = 0;
let ultrasoundCounter = 0;
let prescriptionCounter = 0;
let paymentCounter = 0;
let encounterCounter = 0;
let invoiceCounter = 0;

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

async function generatePaymentId(): Promise<string> {
  if (paymentCounter === 0) {
    const allPayments = await db.select().from(payments);
    paymentCounter = allPayments.length;
  }
  paymentCounter++;
  return `BGC-PAY${paymentCounter}`;
}

async function generateEncounterId(): Promise<string> {
  if (encounterCounter === 0) {
    const allEncounters = await db.select().from(encounters);
    encounterCounter = allEncounters.length;
  }
  encounterCounter++;
  return `BGC-ENC${encounterCounter}`;
}

async function generateInvoiceId(): Promise<string> {
  if (invoiceCounter === 0) {
    const allInvoices = await db.select().from(invoices);
    invoiceCounter = allInvoices.length;
  }
  invoiceCounter++;
  return `BGC-INV${invoiceCounter}`;
}

export interface IStorage {
  // Users (Authentication)
  createUser(data: schema.InsertUser): Promise<schema.User>;
  getUser(id: number): Promise<schema.User | null>;
  getUserByUsername(username: string): Promise<schema.User | null>;
  getAllUsers(): Promise<schema.User[]>;
  sessionStore: any;

  // Patients
  createPatient(data: schema.InsertPatient): Promise<schema.Patient>;
  getPatients(search?: string): Promise<schema.Patient[]>;
  getPatientById(id: string): Promise<schema.Patient | null>;
  getPatientByPatientId(patientId: string): Promise<schema.Patient | null>;
  updatePatient(patientId: string, data: Partial<schema.InsertPatient>): Promise<schema.Patient>;
  deletePatient(patientId: string): Promise<boolean>;

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
  getXrayExams(status?: string, date?: string): Promise<(schema.XrayExam & { patient?: schema.Patient })[]>;
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

  // Payment Services
  getServices(): Promise<schema.Service[]>;
  getServicesByCategory(category: string): Promise<schema.Service[]>;
  createService(data: schema.InsertService): Promise<schema.Service>;
  updateService(id: number, data: Partial<schema.Service>): Promise<schema.Service>;

  // Payments
  createPayment(data: schema.InsertPayment): Promise<schema.Payment>;
  getPayments(): Promise<schema.Payment[]>;
  getPaymentsByPatient(patientId: string): Promise<schema.Payment[]>;
  getPaymentById(id: number): Promise<schema.Payment | null>;
  
  // Payment Items
  createPaymentItem(data: schema.InsertPaymentItem): Promise<schema.PaymentItem>;
  getPaymentItems(paymentId: string): Promise<schema.PaymentItem[]>;
  
  // Payment status checking
  checkPaymentStatus(patientId: string, serviceType: 'laboratory' | 'radiology' | 'ultrasound', requestId: string): Promise<boolean>;

  // Billing Settings
  getBillingSettings(): Promise<schema.BillingSettings>;
  updateBillingSettings(data: schema.InsertBillingSettings): Promise<schema.BillingSettings>;

  // Encounters
  createEncounter(data: schema.InsertEncounter): Promise<schema.Encounter>;
  getEncounters(status?: string, date?: string): Promise<schema.Encounter[]>;
  getEncounterById(encounterId: string): Promise<schema.Encounter | null>;
  getEncountersByPatient(patientId: string): Promise<schema.Encounter[]>;
  updateEncounter(encounterId: string, data: Partial<schema.Encounter>): Promise<schema.Encounter>;
  closeEncounter(encounterId: string): Promise<schema.Encounter>;

  // Order Lines
  createOrderLine(data: schema.InsertOrderLine): Promise<schema.OrderLine>;
  getOrderLinesByEncounter(encounterId: string): Promise<schema.OrderLine[]>;
  updateOrderLine(id: number, data: Partial<schema.OrderLine>): Promise<schema.OrderLine>;

  // Invoices
  createInvoice(data: schema.InsertInvoice): Promise<schema.Invoice>;
  getInvoices(status?: string): Promise<schema.Invoice[]>;
  getInvoiceById(invoiceId: string): Promise<schema.Invoice | null>;
  generateInvoiceFromEncounter(encounterId: string, generatedBy: string): Promise<schema.Invoice>;

  // Invoice Lines
  createInvoiceLine(data: schema.InsertInvoiceLine): Promise<schema.InvoiceLine>;
  getInvoiceLines(invoiceId: string): Promise<schema.InvoiceLine[]>;

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
  sessionStore: any;

  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async createUser(data: schema.InsertUser): Promise<schema.User> {
    const now = new Date().toISOString();
    const insertData: any = {
      ...data,
      createdAt: now,
    };
    
    const [user] = await db.insert(users).values(insertData).returning();
    return user;
  }

  async getUser(id: number): Promise<schema.User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByUsername(username: string): Promise<schema.User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  async getAllUsers(): Promise<schema.User[]> {
    return await db.select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
  }

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

  async deletePatient(patientId: string): Promise<boolean> {
    const result = await db.delete(patients)
      .where(eq(patients.patientId, patientId))
      .returning();
    
    return result.length > 0;
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

  async getXrayExams(status?: string, date?: string): Promise<(schema.XrayExam & { patient?: schema.Patient })[]> {
    const baseQuery = db.select({
      xrayExam: xrayExams,
      patient: patients
    })
    .from(xrayExams)
    .leftJoin(patients, eq(xrayExams.patientId, patients.patientId));
    
    // Apply filters
    const conditions = [];
    if (status) {
      conditions.push(eq(xrayExams.status, status as any));
    }
    if (date) {
      conditions.push(eq(xrayExams.requestedDate, date));
    }
    
    let query = baseQuery;
    if (conditions.length > 0) {
      query = baseQuery.where(and(...conditions));
    }
    
    const results = await query.orderBy(desc(xrayExams.requestedDate));
    
    // Transform the results to match the expected format
    return results.map(result => ({
      ...result.xrayExam,
      patient: result.patient || undefined
    }));
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

  // Payment Services
  async getServices(): Promise<schema.Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(services.category, services.name);
  }

  async getServicesByCategory(category: string): Promise<schema.Service[]> {
    return await db.select().from(services)
      .where(and(eq(services.category, category as any), eq(services.isActive, true)))
      .orderBy(services.name);
  }

  async createService(data: schema.InsertService): Promise<schema.Service> {
    const now = new Date().toISOString();
    const insertData: any = {
      ...data,
      createdAt: now,
    };
    
    const [service] = await db.insert(services).values(insertData).returning();
    return service;
  }

  async updateService(id: number, data: Partial<schema.Service>): Promise<schema.Service> {
    const [service] = await db.update(services)
      .set(data)
      .where(eq(services.id, id))
      .returning();
    
    return service;
  }

  // Payments
  async createPayment(data: schema.InsertPayment): Promise<schema.Payment> {
    const paymentId = await generatePaymentId();
    const now = new Date().toISOString();
    const insertData: any = {
      ...data,
      paymentId,
      createdAt: now,
    };
    
    const [payment] = await db.insert(payments).values(insertData).returning();
    return payment;
  }

  async getPayments(): Promise<schema.Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByPatient(patientId: string): Promise<schema.Payment[]> {
    return await db.select().from(payments)
      .where(eq(payments.patientId, patientId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentById(id: number): Promise<schema.Payment | null> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || null;
  }

  // Payment Items
  async createPaymentItem(data: schema.InsertPaymentItem): Promise<schema.PaymentItem> {
    const now = new Date().toISOString();
    const insertData: any = {
      ...data,
      createdAt: now,
    };
    
    const [paymentItem] = await db.insert(paymentItems).values(insertData).returning();
    return paymentItem;
  }

  async getPaymentItems(paymentId: string): Promise<schema.PaymentItem[]> {
    return await db.select().from(paymentItems).where(eq(paymentItems.paymentId, paymentId));
  }

  // Payment status checking
  async checkPaymentStatus(patientId: string, serviceType: 'laboratory' | 'radiology' | 'ultrasound', requestId: string): Promise<boolean> {
    // Map service types to related types
    const relatedTypeMap = {
      'laboratory': 'lab_test',
      'radiology': 'xray_exam', 
      'ultrasound': 'ultrasound_exam'
    };
    
    // Check if there's a payment item that covers this service
    const paymentCheck = await db.select()
      .from(paymentItems)
      .innerJoin(payments, eq(paymentItems.paymentId, payments.paymentId))
      .where(
        and(
          eq(payments.patientId, patientId),
          eq(paymentItems.relatedType, relatedTypeMap[serviceType] as any),
          eq(paymentItems.relatedId, requestId)
        )
      );
    
    return paymentCheck.length > 0;
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
    const [labTestsData, xrayExamsData, ultrasoundExamsData, pharmacyOrdersData, consultationData] = await Promise.all([
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
        unpaid: sql<number>`sum(case when ${pharmacyOrders.paymentStatus} = 'unpaid' then 1 else 0 end)`,
        prescribed: sql<number>`sum(case when ${pharmacyOrders.status} = 'prescribed' then 1 else 0 end)`,
        dispensed: sql<number>`sum(case when ${pharmacyOrders.status} = 'dispensed' then 1 else 0 end)`,
      })
      .from(pharmacyOrders)
      .where(eq(pharmacyOrders.patientId, patientId)),

      // Check consultation order lines - they are unpaid if no payment item exists for them
      // Also calculate the total amount due for unpaid consultation services
      db.select({
        total: sql<number>`count(*)`,
        unpaid: sql<number>`sum(case when ${paymentItems.id} is null then 1 else 0 end)`,
        unpaidAmount: sql<number>`sum(case when ${paymentItems.id} is null then ${orderLines.totalPrice} else 0 end)`,
      })
      .from(orderLines)
      .innerJoin(encounters, eq(orderLines.encounterId, encounters.encounterId))
      .leftJoin(paymentItems, eq(paymentItems.orderLineId, orderLines.id))
      .where(and(
        eq(encounters.patientId, patientId),
        eq(orderLines.relatedType, "consultation")
      ))
    ]);

    // Calculate the total balance due (unpaid consultation amounts)
    const consultationBalance = consultationData[0]?.unpaidAmount || 0;

    // Sum up totals including consultation order lines
    const totals = {
      totalServices: (labTestsData[0]?.total || 0) + (xrayExamsData[0]?.total || 0) + (ultrasoundExamsData[0]?.total || 0) + (pharmacyOrdersData[0]?.total || 0) + (consultationData[0]?.total || 0),
      unpaidServices: (labTestsData[0]?.unpaid || 0) + (xrayExamsData[0]?.unpaid || 0) + (ultrasoundExamsData[0]?.unpaid || 0) + (pharmacyOrdersData[0]?.unpaid || 0) + (consultationData[0]?.unpaid || 0),
      pendingServices: (labTestsData[0]?.pending || 0) + (xrayExamsData[0]?.pending || 0) + (ultrasoundExamsData[0]?.pending || 0) + (pharmacyOrdersData[0]?.prescribed || 0),
      completedServices: (labTestsData[0]?.completed || 0) + (xrayExamsData[0]?.completed || 0) + (ultrasoundExamsData[0]?.completed || 0) + (pharmacyOrdersData[0]?.dispensed || 0),
      hasUnpaidServices: ((labTestsData[0]?.unpaid || 0) + (xrayExamsData[0]?.unpaid || 0) + (ultrasoundExamsData[0]?.unpaid || 0) + (pharmacyOrdersData[0]?.unpaid || 0) + (consultationData[0]?.unpaid || 0)) > 0,
      hasPendingServices: ((labTestsData[0]?.pending || 0) + (xrayExamsData[0]?.pending || 0) + (ultrasoundExamsData[0]?.pending || 0) + (pharmacyOrdersData[0]?.prescribed || 0)) > 0,
      // Add balance fields that the UI expects
      balance: consultationBalance,
      balanceToday: consultationBalance,
    };

    return totals;
  }

  // Billing Settings Methods
  async getBillingSettings(): Promise<schema.BillingSettings> {
    const settings = await db.select().from(billingSettings).limit(1);
    if (settings.length === 0) {
      // Create default settings
      const now = new Date().toISOString();
      const defaultSettings = {
        consultationFee: 2000.00,
        requirePrepayment: 0, // SQLite needs integers for booleans
        allowEmergencyGrace: 1, // SQLite needs integers for booleans
        currency: "SSP",
        updatedBy: "system",
        createdAt: now,
        updatedAt: now,
      };
      const [newSettings] = await db.insert(billingSettings).values(defaultSettings).returning();
      
      // Convert integers back to booleans for the response
      return {
        ...newSettings,
        requirePrepayment: !!newSettings.requirePrepayment,
        allowEmergencyGrace: !!newSettings.allowEmergencyGrace,
      };
    }
    
    // Convert integers back to booleans for the response
    return {
      ...settings[0],
      requirePrepayment: !!settings[0].requirePrepayment,
      allowEmergencyGrace: !!settings[0].allowEmergencyGrace,
    };
  }

  async updateBillingSettings(data: schema.InsertBillingSettings): Promise<schema.BillingSettings> {
    const now = new Date().toISOString();
    
    // Convert boolean values to integers for SQLite compatibility
    const updateData = {
      consultationFee: data.consultationFee,
      requirePrepayment: data.requirePrepayment ? 1 : 0,
      allowEmergencyGrace: data.allowEmergencyGrace ? 1 : 0,
      currency: data.currency,
      updatedBy: data.updatedBy,
      updatedAt: now,
    };
    
    const existingSettings = await db.select().from(billingSettings).limit(1);
    if (existingSettings.length === 0) {
      const [newSettings] = await db.insert(billingSettings).values({
        ...updateData,
        createdAt: now,
      }).returning();
      
      // Convert integers back to booleans for the response
      return {
        ...newSettings,
        requirePrepayment: !!newSettings.requirePrepayment,
        allowEmergencyGrace: !!newSettings.allowEmergencyGrace,
      };
    } else {
      const [updatedSettings] = await db.update(billingSettings)
        .set(updateData)
        .where(eq(billingSettings.id, existingSettings[0].id))
        .returning();
      
      // Convert integers back to booleans for the response  
      return {
        ...updatedSettings,
        requirePrepayment: !!updatedSettings.requirePrepayment,
        allowEmergencyGrace: !!updatedSettings.allowEmergencyGrace,
      };
    }
  }

  // Encounter Methods
  async createEncounter(data: schema.InsertEncounter): Promise<schema.Encounter> {
    const encounterId = await generateEncounterId();
    const now = new Date().toISOString();
    
    const insertData = {
      ...data,
      encounterId,
      createdAt: now,
    };
    
    const [encounter] = await db.insert(encounters).values(insertData).returning();
    return encounter;
  }

  async getEncounters(status?: string, date?: string): Promise<schema.Encounter[]> {
    let query = db.select().from(encounters);
    
    const conditions = [];
    if (status) {
      conditions.push(eq(encounters.status, status as any));
    }
    if (date) {
      conditions.push(eq(encounters.visitDate, date));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(encounters.createdAt));
  }

  async getEncounterById(encounterId: string): Promise<schema.Encounter | null> {
    const results = await db.select().from(encounters).where(eq(encounters.encounterId, encounterId));
    return results[0] || null;
  }

  async getEncountersByPatient(patientId: string): Promise<schema.Encounter[]> {
    return await db.select().from(encounters)
      .where(eq(encounters.patientId, patientId))
      .orderBy(desc(encounters.createdAt));
  }

  async updateEncounter(encounterId: string, data: Partial<schema.Encounter>): Promise<schema.Encounter> {
    const [updated] = await db.update(encounters)
      .set(data)
      .where(eq(encounters.encounterId, encounterId))
      .returning();
    return updated;
  }

  async closeEncounter(encounterId: string): Promise<schema.Encounter> {
    const now = new Date().toISOString();
    const [updated] = await db.update(encounters)
      .set({ status: "closed", closedAt: now })
      .where(eq(encounters.encounterId, encounterId))
      .returning();
    return updated;
  }

  // Order Line Methods
  async createOrderLine(data: schema.InsertOrderLine): Promise<schema.OrderLine> {
    const now = new Date().toISOString();
    const insertData = {
      ...data,
      createdAt: now,
    };
    
    const [orderLine] = await db.insert(orderLines).values(insertData).returning();
    return orderLine;
  }

  async getOrderLinesByEncounter(encounterId: string): Promise<schema.OrderLine[]> {
    return await db.select().from(orderLines)
      .where(eq(orderLines.encounterId, encounterId))
      .orderBy(desc(orderLines.createdAt));
  }

  async updateOrderLine(id: number, data: Partial<schema.OrderLine>): Promise<schema.OrderLine> {
    const [updated] = await db.update(orderLines)
      .set(data)
      .where(eq(orderLines.id, id))
      .returning();
    return updated;
  }

  // Invoice Methods
  async createInvoice(data: schema.InsertInvoice): Promise<schema.Invoice> {
    const invoiceId = await generateInvoiceId();
    const now = new Date().toISOString();
    
    const insertData = {
      ...data,
      invoiceId,
      createdAt: now,
    };
    
    const [invoice] = await db.insert(invoices).values(insertData).returning();
    return invoice;
  }

  async getInvoices(status?: string): Promise<schema.Invoice[]> {
    if (status) {
      return await db.select().from(invoices)
        .where(eq(invoices.status, status as any))
        .orderBy(desc(invoices.createdAt));
    }
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(invoiceId: string): Promise<schema.Invoice | null> {
    const results = await db.select().from(invoices).where(eq(invoices.invoiceId, invoiceId));
    return results[0] || null;
  }

  async generateInvoiceFromEncounter(encounterId: string, generatedBy: string): Promise<schema.Invoice> {
    // Get encounter and its order lines
    const encounter = await this.getEncounterById(encounterId);
    if (!encounter) {
      throw new Error("Encounter not found");
    }

    const orderLinesData = await this.getOrderLinesByEncounter(encounterId);
    
    // Calculate totals
    const subtotal = orderLinesData.reduce((sum, line) => sum + line.totalPrice, 0);
    const discount = 0; // Could be configurable
    const tax = 0; // Could be configurable
    const grandTotal = subtotal - discount + tax;

    // Create invoice
    const invoice = await this.createInvoice({
      encounterId,
      patientId: encounter.patientId,
      subtotal,
      discount,
      tax,
      grandTotal,
      generatedBy,
    });

    // Create invoice lines
    for (const orderLine of orderLinesData) {
      await this.createInvoiceLine({
        invoiceId: invoice.invoiceId,
        orderLineId: orderLine.id,
        description: orderLine.description,
        quantity: orderLine.quantity,
        unitPrice: orderLine.unitPriceSnapshot,
        totalPrice: orderLine.totalPrice,
      });
    }

    return invoice;
  }

  // Invoice Line Methods
  async createInvoiceLine(data: schema.InsertInvoiceLine): Promise<schema.InvoiceLine> {
    const now = new Date().toISOString();
    const insertData = {
      ...data,
      createdAt: now,
    };
    
    const [invoiceLine] = await db.insert(invoiceLines).values(insertData).returning();
    return invoiceLine;
  }

  async getInvoiceLines(invoiceId: string): Promise<schema.InvoiceLine[]> {
    return await db.select().from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, invoiceId))
      .orderBy(desc(invoiceLines.createdAt));
  }
}

// Initialize default services
async function seedDefaultServices() {
  try {
    const existingServices = await storage.getServices();
    if (existingServices.length === 0) {
      console.log("Seeding default services...");
      
      // Consultation services (updated to match policy)  
      await storage.createService({
        code: "CONS-GEN",
        name: "General Consultation",
        category: "consultation",
        description: "Basic medical consultation and examination",
        price: 2000.00,
        isActive: true,
      });
      
      await storage.createService({
        code: "CONS-FU",
        name: "Follow-up Consultation",
        category: "consultation", 
        description: "Follow-up visit for existing patients",
        price: 1000.00,
        isActive: true,
      });

      // Laboratory services
      await storage.createService({
        name: "Complete Blood Count (CBC)",
        category: "laboratory",
        description: "Full blood analysis including RBC, WBC, platelets",
        price: 25.00,
        isActive: true,
      });

      await storage.createService({
        name: "Urine Analysis",
        category: "laboratory",
        description: "Complete urine examination",
        price: 15.00,
        isActive: true,
      });

      await storage.createService({
        name: "Malaria Test",
        category: "laboratory",
        description: "Malaria parasite detection",
        price: 10.00,
        isActive: true,
      });

      await storage.createService({
        name: "Stool Examination",
        category: "laboratory",
        description: "Stool analysis for parasites and infections",
        price: 15.00,
        isActive: true,
      });

      // Radiology services
      await storage.createService({
        name: "Chest X-Ray",
        category: "radiology",
        description: "X-ray examination of chest and lungs",
        price: 40.00,
        isActive: true,
      });

      await storage.createService({
        name: "Abdominal X-Ray",
        category: "radiology",
        description: "X-ray examination of abdomen",
        price: 45.00,
        isActive: true,
      });

      await storage.createService({
        name: "Extremity X-Ray",
        category: "radiology",
        description: "X-ray of arms, legs, hands, or feet",
        price: 35.00,
        isActive: true,
      });

      // Ultrasound services
      await storage.createService({
        name: "Abdominal Ultrasound",
        category: "ultrasound",
        description: "Ultrasound examination of abdominal organs",
        price: 60.00,
        isActive: true,
      });

      await storage.createService({
        name: "Pelvic Ultrasound",
        category: "ultrasound",
        description: "Ultrasound examination of pelvic organs",
        price: 55.00,
        isActive: true,
      });

      await storage.createService({
        name: "Obstetric Ultrasound",
        category: "ultrasound",
        description: "Pregnancy monitoring ultrasound",
        price: 65.00,
        isActive: true,
      });

      // Pharmacy services
      await storage.createService({
        code: "PHARM-PARACETAMOL",
        name: "Paracetamol 500mg",
        category: "pharmacy",
        description: "Pain reliever and fever reducer",
        price: 5.00,
        isActive: true,
      });

      await storage.createService({
        code: "PHARM-AMOXICILLIN",
        name: "Amoxicillin 250mg",
        category: "pharmacy",
        description: "Antibiotic for bacterial infections",
        price: 15.00,
        isActive: true,
      });

      await storage.createService({
        code: "PHARM-IBUPROFEN",
        name: "Ibuprofen 400mg",
        category: "pharmacy",
        description: "Anti-inflammatory and pain reliever",
        price: 8.00,
        isActive: true,
      });

      await storage.createService({
        code: "PHARM-ORS",
        name: "ORS (Oral Rehydration Salts)",
        category: "pharmacy",
        description: "For dehydration treatment",
        price: 3.00,
        isActive: true,
      });

      console.log("✓ Default services seeded successfully");
    }
  } catch (error) {
    console.log("Error seeding default services:", error);
  }
}

export const storage = new MemStorage();

// Initialize services on startup
setTimeout(() => {
  seedDefaultServices();
}, 100);
