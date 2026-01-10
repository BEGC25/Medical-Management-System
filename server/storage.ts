import { eq, like, ilike, desc, and, count, or, sql, gte, lte, lt, isNull, isNotNull, ne, inArray } from "drizzle-orm";
import { db } from './db';
import * as schema from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { hashPassword } from "./auth-service";
import { today } from "./utils/date";
import { getClinicDayKey } from "@shared/clinic-date";

const { users, patients, treatments, labTests, xrayExams, ultrasoundExams, pharmacyOrders, services, payments, paymentItems, billingSettings, encounters, orderLines, invoices, invoiceLines, drugs, drugBatches, inventoryLedger } = schema;

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
let drugCodeCounter = 0;
let batchCounter = 0;
let ledgerCounter = 0;

const XRAY_RELATED_TYPES = ["xray", "xray_exam"] as const;
const LAB_RELATED_TYPES = ["lab", "lab_test"] as const;
const ULTRASOUND_RELATED_TYPES = ["ultrasound", "ultrasound_exam"] as const;

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
    // Extract the highest encounter number from existing IDs
    const allEncounters = await db.select({ encounterId: encounters.encounterId }).from(encounters);
    let maxNum = 0;
    for (const enc of allEncounters) {
      const match = enc.encounterId.match(/BGC-ENC(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    encounterCounter = maxNum;
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

async function generateDrugCode(): Promise<string> {
  if (drugCodeCounter === 0) {
    const allDrugs = await db.select().from(drugs);
    drugCodeCounter = allDrugs.length;
  }
  drugCodeCounter++;
  return `DRG${drugCodeCounter.toString().padStart(5, '0')}`;
}

async function generateBatchId(): Promise<string> {
  if (batchCounter === 0) {
    const allBatches = await db.select().from(drugBatches);
    batchCounter = allBatches.length;
  }
  batchCounter++;
  return `BATCH${batchCounter.toString().padStart(6, '0')}`;
}

async function generateLedgerId(): Promise<string> {
  if (ledgerCounter === 0) {
    const allLedger = await db.select().from(inventoryLedger);
    ledgerCounter = allLedger.length;
  }
  ledgerCounter++;
  return `TXN${ledgerCounter.toString().padStart(8, '0')}`;
}

export interface IStorage {
  // Users (Authentication)
  createUser(data: schema.InsertUser): Promise<schema.User>;
  getUser(id: number): Promise<schema.User | null>;
  getUserByUsername(username: string): Promise<schema.User | null>;
  getAllUsers(): Promise<schema.User[]>;
  deleteUser(id: number): Promise<void>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;
  updateUser(id: number, updates: { fullName?: string; role?: string }): Promise<void>;
  sessionStore: any;

  // Patients
  createPatient(data: schema.InsertPatient): Promise<schema.Patient>;
  getPatients(search?: string): Promise<schema.Patient[]>;
  getPatientById(id: string): Promise<schema.Patient | null>;
  getPatientByPatientId(patientId: string): Promise<schema.Patient | null>;
  updatePatient(patientId: string, data: Partial<schema.InsertPatient>): Promise<schema.Patient>;
  deletePatient(patientId: string, deletedBy: string, deletionReason?: string, forceDelete?: boolean): Promise<{
    success: boolean;
    blocked?: boolean;
    blockReasons?: string[];
    forceDeleted?: boolean;
    impactSummary?: {
      encounters: number;
      labTests: number;
      xrayExams: number;
      ultrasoundExams: number;
      pharmacyOrders: number;
      payments: number;
    };
  }>;

  // Treatments
  createTreatment(data: schema.InsertTreatment): Promise<schema.Treatment>;
  getTreatmentsByPatient(patientId: string): Promise<schema.Treatment[]>;
  getTreatmentsByEncounter(encounterId: string): Promise<schema.Treatment[]>;
  getTreatments(limit?: number, startDate?: string, endDate?: string): Promise<schema.Treatment[]>;
  getTodaysTreatments(): Promise<schema.Treatment[]>;

  // Lab Tests
  createLabTest(data: schema.InsertLabTest): Promise<schema.LabTest>;
  getLabTests(status?: string, date?: string, startDate?: string, endDate?: string): Promise<(schema.LabTest & { patient?: schema.Patient })[]>;
  getLabTestsByPatient(patientId: string): Promise<schema.LabTest[]>;
  updateLabTest(testId: string, data: Partial<schema.LabTest>): Promise<schema.LabTest>;
  updateLabTestAttachments(testId: string, attachments: any[]): Promise<schema.LabTest>;
  deleteLabTest(testId: string): Promise<boolean>;

  // X-Ray Exams
  createXrayExam(data: schema.InsertXrayExam): Promise<schema.XrayExam>;
  getXrayExams(status?: string, date?: string, startDate?: string, endDate?: string): Promise<(schema.XrayExam & { patient?: schema.Patient })[]>;
  getXrayExamsByPatient(patientId: string): Promise<schema.XrayExam[]>;
  updateXrayExam(examId: string, data: Partial<schema.XrayExam>): Promise<schema.XrayExam>;
  deleteXrayExam(examId: string): Promise<boolean>;

  // Ultrasound Exams
  createUltrasoundExam(data: schema.InsertUltrasoundExam): Promise<schema.UltrasoundExam>;
  getUltrasoundExams(status?: string, startDate?: string, endDate?: string): Promise<schema.UltrasoundExam[]>;
  getUltrasoundExamsByPatient(patientId: string): Promise<schema.UltrasoundExam[]>;
  updateUltrasoundExam(examId: string, data: Partial<schema.UltrasoundExam>): Promise<schema.UltrasoundExam>;
  deleteUltrasoundExam(examId: string): Promise<boolean>;

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
  deleteService(id: number): Promise<{
    success: boolean;
    blocked?: boolean;
    notFound?: boolean;
    message?: string;
    details?: {
      orderLines?: number;
      paymentItems?: number;
      pharmacyOrders?: number;
    };
  }>;
  bulkUpdateServiceCodes(updates: Array<{ id: number; code: string }>): Promise<void>;

  // Payments
  createPayment(data: schema.InsertPayment): Promise<schema.Payment>;
  getPayments(startDayKey?: string, endDayKey?: string): Promise<schema.Payment[]>;
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
  getEncounters(status?: string, startDayKey?: string, endDayKey?: string, patientId?: string): Promise<schema.Encounter[]>;
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
  getDashboardStats(fromDate?: string, toDate?: string): Promise<{
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
  
  getPatientFlowData(): Promise<{
    waitingForDoctor: number;
    inTreatment: number;
    waitingForLab: number;
    waitingForXray: number;
    waitingForUltrasound: number;
    waitingForPharmacy: number;
    readyForCheckout: number;
  }>;
  
  getOutstandingPayments(limit?: number): Promise<any[]>;
  
  getResultsReadyForReview(limit?: number): Promise<any[]>;

  // Today filters
  getTodaysPatients(): Promise<schema.Patient[]>;
  getPatientsByDate(date: string): Promise<schema.Patient[]>;
  getPatientsByDateRange(startDate: string, endDate: string): Promise<schema.Patient[]>;
  getTodaysTreatments(): Promise<schema.Treatment[]>;

  // Enhanced patient queries with service status
  getPatientsWithStatus(search?: string): Promise<(schema.Patient & { serviceStatus: any })[]>;
  getTodaysPatientsWithStatus(): Promise<(schema.Patient & { serviceStatus: any })[]>;
  getPatientsByDateWithStatus(date: string): Promise<(schema.Patient & { serviceStatus: any })[]>;
  getPatientsByDateRangeWithStatus(startDate: string, endDate: string): Promise<(schema.Patient & { serviceStatus: any })[]>;
  getPatientServiceStatus(patientId: string): Promise<any>;

  // Pharmacy Inventory - Drugs
  createDrug(data: schema.InsertDrug): Promise<schema.Drug>;
  getDrugs(activeOnly?: boolean): Promise<schema.Drug[]>;
  getDrugById(id: number): Promise<schema.Drug | null>;
  getDrugByCode(drugCode: string): Promise<schema.Drug | null>;
  updateDrug(id: number, data: Partial<schema.Drug>): Promise<schema.Drug>;

  // Pharmacy Inventory - Batches
  createDrugBatch(data: schema.InsertDrugBatch): Promise<schema.DrugBatch>;
  getDrugBatches(drugId?: number): Promise<schema.DrugBatch[]>;
  getDrugBatchById(batchId: string): Promise<schema.DrugBatch | null>;
  updateDrugBatch(batchId: string, data: Partial<schema.DrugBatch>): Promise<schema.DrugBatch>;
  getBatchesFEFO(drugId: number): Promise<schema.DrugBatch[]>; // First Expiry First Out

  // Pharmacy Inventory - Ledger
  createInventoryLedger(data: schema.InsertInventoryLedger): Promise<schema.InventoryLedger>;
  getInventoryLedger(drugId?: number, batchId?: string): Promise<(schema.InventoryLedger & { drugName: string; drugStrength: string | null })[]>;

  // Pharmacy Inventory - Stock Queries
  getDrugStockLevel(drugId: number): Promise<number>; // Total quantity on hand
  getAllDrugsWithStock(): Promise<(schema.Drug & { stockOnHand: number })[]>; // All drugs with stock levels
  getLowStockDrugs(): Promise<(schema.Drug & { stockOnHand: number })[]>;
  getExpiringSoonDrugs(daysThreshold?: number): Promise<(schema.DrugBatch & { drugName: string })[]>;

  // Pharmacy - Dispense Operations
  dispenseDrug(orderId: string, batchId: string, quantity: number, dispensedBy: string): Promise<schema.PharmacyOrder>;
  getPaidPrescriptions(): Promise<(schema.PharmacyOrder & { patient: schema.Patient })[]>;
  getUnpaidPrescriptions(): Promise<(schema.PharmacyOrder & { patient: schema.Patient })[]>;
  getPharmacyOrdersWithPatients(): Promise<(schema.PharmacyOrder & { patient: schema.Patient })[]>;

  // Reports
  getDiagnosisStats(fromDate?: string, toDate?: string): Promise<Array<{ diagnosis: string; count: number }>>;
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
    
    // Hash the password before storing
    const hashedPassword = await hashPassword(data.password);
    
    const insertData: any = {
      ...data,
      password: hashedPassword, // Store hashed password
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

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async updateUser(id: number, updates: { fullName?: string; role?: string }): Promise<void> {
    await db.update(users).set(updates).where(eq(users.id, id));
  }

  async createPatient(data: schema.InsertPatient): Promise<schema.Patient> {
    // Initialize counter from existing patients if not set
    if (patientCounter === 0) {
      // --- FIXED: Count *all* patients (deleted or not) to prevent ID collision ---
      const allPatientsCount = await db.select({ count: count() }).from(patients);
      patientCounter = allPatientsCount[0]?.count || 0;
    }

    const patientId = generatePatientId();
    const now = new Date().toISOString();
    
    // Calculate clinic day in Africa/Juba timezone
    const { getClinicDayKey } = await import('@shared/clinic-date');
    const clinicDay = getClinicDayKey();

    const insertData: any = {
      ...data,
      patientId,
      clinicDay, // Add clinic day
      createdAt: now,
      isDeleted: 0, // Ensure new patients are not deleted
    };

    const [patient] = await db.insert(patients).values(insertData).returning();

    return patient;
  }
  // New atomic workflow for patient registration
  async registerNewPatientWorkflow(
    data: schema.InsertPatient,
    collectConsultationFee: boolean,
    registeredBy: string
  ): Promise<{
    patient: schema.Patient;
    encounter: schema.Encounter;
  }> {
    // --- Fix for Red Flag #3: Use stable service code "CONS-GEN" ---
    console.log("Looking up consultation service with code: CONS-GEN");
    let consultationService = (await db.select().from(services)
      .where(and(
        eq(services.code, "CONS-GEN"), // Use stable code from seed script
        eq(services.isActive, 1)
      ))
      .limit(1))[0];

    if (!consultationService) {
      // Log detailed error information
      console.error("CRITICAL: Consultation service 'CONS-GEN' not found!");
      
      // Check if ANY services exist
      const allServices = await db.select().from(services).limit(5);
      console.error("Available services:", allServices.map((s: any) => ({ id: s.id, code: s.code, name: s.name, isActive: s.isActive })));
      
      // Try to create the consultation service as a fallback
      console.error("Attempting to create default consultation service...");
      try {
        const newService = await this.createService({
          code: "CONS-GEN",
          name: "General Consultation",
          category: "consultation",
          description: "Basic medical consultation and examination",
          price: 2000.00,
          isActive: 1,
        });
        
        console.log("Successfully created consultation service:", newService);
        consultationService = newService;
      } catch (createError) {
        console.error("Failed to create consultation service:", createError);
        throw new Error("Critical Error: Default 'CONS-GEN' consultation service not found and could not be created. Database may need manual initialization. Please contact system administrator.");
      }
    }

    console.log("Found consultation service:", { id: consultationService.id, name: consultationService.name, price: consultationService.price });
    return this._registerPatientWithService(consultationService, data, collectConsultationFee, registeredBy);
  }

  // Helper method to complete patient registration with a service
  private async _registerPatientWithService(
    consultationService: schema.Service,
    data: schema.InsertPatient,
    collectConsultationFee: boolean,
    registeredBy: string
  ): Promise<{
    patient: schema.Patient;
    encounter: schema.Encounter;
  }> {

    // 1. Create Patient
    const patient = await this.createPatient(data);

    // 2. Create Encounter
    // Use clinic timezone (Africa/Juba) for visitDate to ensure consistent day classification
    const encounter = await this.createEncounter({
      patientId: patient.patientId,
      visitDate: today('date'),
      policy: "cash",
      attendingClinician: "", // Reception doesn't assign this
      notes: "Patient registered at reception.",
    });

    // 3. Create Consultation Order Line
    const orderLine = await this.createOrderLine({
      encounterId: encounter.encounterId,
      serviceId: consultationService.id,
      relatedType: "consultation",
      description: consultationService.name, // Use the service's actual name
      quantity: 1,
      unitPriceSnapshot: consultationService.price,
      totalPrice: consultationService.price,
      department: "consultation",
      status: "performed",
      orderedBy: registeredBy,
      addToCart: 1, // Always add consultation fee to cart
    });

    // 4. (Optional) Create Payment and Link to Order Line
    if (collectConsultationFee) {
      const payment = await this.createPayment({
        patientId: patient.patientId,
        totalAmount: consultationService.price,
        paymentMethod: "cash", // Default to cash at registration
        paymentDate: new Date().toISOString().split("T")[0],
        receivedBy: registeredBy,
        notes: "Consultation fee - paid at registration",
      });

      // Create payment item linking payment to order line
      await this.createPaymentItem({
        paymentId: payment.paymentId,
        orderLineId: orderLine.id,
        serviceId: consultationService.id,
        relatedType: "consultation",
        quantity: 1,
        unitPrice: consultationService.price,
        totalPrice: consultationService.price,
        amount: consultationService.price,
      });

      // Mark order line as paid by removing from cart
      await db.update(orderLines)
        .set({ addToCart: 0 })
        .where(eq(orderLines.id, orderLine.id));
    }

    return { patient, encounter };
  }

  async getPatients(search?: string): Promise<schema.Patient[]> {
    const baseCondition = eq(patients.isDeleted, 0); // Always filter out deleted

    if (search) {
      return await db.select().from(patients)
        .where(
          and(
            baseCondition, // Added filter
            or(
              ilike(patients.firstName, `%${search}%`),
              ilike(patients.lastName, `%${search}%`),
              ilike(patients.patientId, `%${search}%`)
            )
          )
        )
        .orderBy(desc(patients.createdAt));
    }

    // --- MODIFIED: Added isDeleted filter for the non-search case ---
    return await db.select().from(patients)
      .where(baseCondition) // Added filter
      .orderBy(desc(patients.createdAt));
  }

  async getPatientById(id: string): Promise<schema.Patient | null> {
    const [patient] = await db.select().from(patients).where(
      and(
        eq(patients.id, parseInt(id)),
        eq(patients.isDeleted, 0) // Already correct
      )
    );
    return patient || null;
  }

  async getPatientByPatientId(patientId: string): Promise<schema.Patient | null> {
    const [patient] = await db.select().from(patients).where(
      and(
        eq(patients.patientId, patientId),
        eq(patients.isDeleted, 0) // Already correct
      )
    );
    return patient || null;
  }

  async updatePatient(patientId: string, data: Partial<schema.InsertPatient>): Promise<schema.Patient> {
    // --- MODIFIED: Ensure we only update non-deleted patients ---
    const [patient] = await db.update(patients)
      .set(data as any)
      .where(and(
        eq(patients.patientId, patientId),
        eq(patients.isDeleted, 0) // Added safety check
      ))
      .returning();

    return patient;
  }

  async deletePatient(patientId: string, deletedBy: string, deletionReason?: string, forceDelete: boolean = false): Promise<{
    success: boolean;
    blocked?: boolean;
    blockReasons?: string[];
    forceDeleted?: boolean;
    impactSummary?: {
      encounters: number;
      labTests: number;
      xrayExams: number;
      ultrasoundExams: number;
      pharmacyOrders: number;
      payments: number;
    };
  }> {
    // Get patient info
    // --- MODIFIED: Fetch regardless of isDeleted, check flag later ---
    const patientResult = await db.select().from(patients).where(eq(patients.patientId, patientId));
    if (!patientResult || patientResult.length === 0) {
      return { success: false, blocked: true, blockReasons: ["Patient not found"] };
    }

    const patientData = patientResult[0];
    // --- MODIFIED: Check isDeleted flag here ---
    if (patientData.isDeleted === 1) {
      return { success: false, blocked: true, blockReasons: ["Patient already deleted"] };
    }

    // Check for blocking conditions
    const blockReasons: string[] = [];

    // Check for payment history (BLOCKING unless force-delete)
    const patientPayments = await db.select({ count: count() }).from(payments).where(eq(payments.patientId, patientId));
    const paymentCount = patientPayments[0]?.count || 0;
    if (paymentCount > 0 && !forceDelete) {
      blockReasons.push(`Patient has ${paymentCount} payment record(s). Cannot delete patients with financial history without force-delete.`);
    }

    // Check for open encounters (BLOCKING unless force-delete)
    const openEncounters = await db.select({ count: count() }).from(encounters).where(
      and(
        eq(encounters.patientId, patientId),
        eq(encounters.status, 'open')
      )
    );
    const openEncounterCount = openEncounters[0]?.count || 0;
    if (openEncounterCount > 0 && !forceDelete) {
      blockReasons.push(`Patient has ${openEncounterCount} open encounter(s). Please close encounters before deletion or use force-delete.`);
    }

    // Get impact summary (all related records)
    // --- MODIFIED: Use count() for efficiency ---
    const [
      allEncountersCountResult,
      patientLabTestsCountResult,
      patientXraysCountResult,
      patientUltrasoundsCountResult,
      patientPharmacyCountResult
    ] = await Promise.all([
      db.select({ count: count() }).from(encounters).where(eq(encounters.patientId, patientId)),
      db.select({ count: count() }).from(labTests).where(eq(labTests.patientId, patientId)),
      db.select({ count: count() }).from(xrayExams).where(eq(xrayExams.patientId, patientId)),
      db.select({ count: count() }).from(ultrasoundExams).where(eq(ultrasoundExams.patientId, patientId)),
      db.select({ count: count() }).from(pharmacyOrders).where(eq(pharmacyOrders.patientId, patientId))
    ]);

    const impactSummary = {
      encounters: allEncountersCountResult[0]?.count || 0,
      labTests: patientLabTestsCountResult[0]?.count || 0,
      xrayExams: patientXraysCountResult[0]?.count || 0,
      ultrasoundExams: patientUltrasoundsCountResult[0]?.count || 0,
      pharmacyOrders: patientPharmacyCountResult[0]?.count || 0,
      payments: paymentCount,
    };

    // If blocked, return with reasons
    if (blockReasons.length > 0) {
      return {
        success: false,
        blocked: true,
        blockReasons,
        impactSummary,
      };
    }

    // Perform soft-delete in transaction (Drizzle doesn't have explicit transactions API like some ORMs, rely on single statements)
    try {
      const now = new Date().toISOString();

      // Soft-delete patient
      await db.update(patients)
        .set({
          isDeleted: 1,
          deletedAt: now,
          deletedBy: deletedBy,
          deletionReason: deletionReason || null,
        })
        .where(eq(patients.patientId, patientId));

      // --- MODIFIED: Simplified cancellation logic - only cancel PENDING items ---
      if (impactSummary.labTests > 0) {
        await db.update(labTests)
          .set({ status: 'cancelled' })
          .where(and(eq(labTests.patientId, patientId), eq(labTests.status, 'pending')));
      }

      if (impactSummary.xrayExams > 0) {
        await db.update(xrayExams)
          .set({ status: 'cancelled' })
          .where(and(eq(xrayExams.patientId, patientId), eq(xrayExams.status, 'pending')));
      }

      if (impactSummary.ultrasoundExams > 0) {
        await db.update(ultrasoundExams)
          .set({ status: 'cancelled' })
          .where(and(eq(ultrasoundExams.patientId, patientId), eq(ultrasoundExams.status, 'pending')));
      }

      if (impactSummary.pharmacyOrders > 0) {
        await db.update(pharmacyOrders)
          .set({ status: 'cancelled' })
          .where(and(eq(pharmacyOrders.patientId, patientId), eq(pharmacyOrders.status, 'prescribed')));
      }
      
      // --- MODIFIED: Only close OPEN encounters ---
      if (impactSummary.encounters > 0) {
        await db.update(encounters)
          .set({ status: 'closed', closedAt: now })
          .where(and(eq(encounters.patientId, patientId), eq(encounters.status, 'open')));
      }

      // Create audit log
      await db.insert(schema.deletionAuditLog).values({
        patientId: patientId,
        patientName: `${patientData.firstName} ${patientData.lastName}`,
        deletedBy: deletedBy,
        deletionReason: deletionReason || null,
        impactSummary: JSON.stringify(impactSummary),
        hadPaymentHistory: paymentCount > 0 ? 1 : 0,
        // deletedAt is defaulted by DB
      });

      return {
        success: true,
        blocked: false,
        forceDeleted: forceDelete,
        impactSummary,
      };
    } catch (error) {
      console.error('Error deleting patient:', error);
      return {
        success: false,
        blocked: true,
        blockReasons: ['Database error during deletion'],
      };
    }
  }

  async createTreatment(data: schema.InsertTreatment): Promise<schema.Treatment> {
    const treatmentId = await generateTreatmentId();
    const now = new Date().toISOString();
    const clinicDay = getClinicDayKey(new Date());

    const insertData: any = {
      ...data,
      treatmentId,
      clinicDay, // Set clinic day for filtering
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

  async getTreatmentsByEncounter(encounterId: string): Promise<schema.Treatment[]> {
    return await db.select().from(treatments)
      .where(eq(treatments.encounterId, encounterId))
      .orderBy(desc(treatments.visitDate));
  }

  async getTreatments(limit = 50, startDate?: string, endDate?: string): Promise<schema.Treatment[]> {
    let query = db.select().from(treatments);
    
    // Apply date filtering if provided
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(treatments.clinicDay, startDate),
          lte(treatments.clinicDay, endDate)
        )
      );
    }
    
    return await query
      .orderBy(desc(treatments.createdAt))
      .limit(limit);
  }

  async createLabTest(data: schema.InsertLabTest): Promise<schema.LabTest> {
    const testId = await generateLabId();
    const now = new Date().toISOString();
    const clinicDay = getClinicDayKey(new Date());

    const insertData: any = {
      ...data,
      testId,
      status: "pending",
      paymentStatus: 'unpaid', // Ensure default
      clinicDay, // Set clinic day for filtering
      createdAt: now,
    };

    const [labTest] = await db.insert(labTests).values(insertData).returning();

    return labTest;
  }

  async getLabTests(status?: string, date?: string, startDate?: string, endDate?: string): Promise<(schema.LabTest & { patient?: schema.Patient })[]> {
    const baseQuery = db.select({
      labTest: labTests,
      patient: patients // Select whole patient object
    })
    .from(labTests)
    .leftJoin(patients, and(
      eq(labTests.patientId, patients.patientId),
      eq(patients.isDeleted, 0) // --- MODIFIED: Ensure joined patient is not deleted ---
    ));

    // Apply filters
    const conditions = [];
    if (status) {
      conditions.push(eq(labTests.status, status as any));
    }
    
    // Date filtering - now use clinic_day instead of requestedDate
    // Filter by clinic_day field (date when record was created in Africa/Juba)
    if (date) {
      // Exact date match (for backward compatibility)
      conditions.push(eq(labTests.clinicDay, date));
    } else if (startDate && endDate) {
      // Date range filtering using clinic_day
      // Range is [start, end] - both bounds inclusive for date columns
      conditions.push(
        and(
          gte(labTests.clinicDay, startDate),
          lte(labTests.clinicDay, endDate)
        )
      );
    }

    let query = baseQuery;
    if (conditions.length > 0) {
      query = baseQuery.where(and(...conditions));
    }

    const results = await query.orderBy(desc(labTests.createdAt));

    // Transform the results to match the expected format
    return results
      .filter(result => result.patient != null) // --- MODIFIED: Filter out results where patient was deleted ---
      .map(result => ({
        ...result.labTest,
        patient: result.patient || undefined // Should not be undefined due to filter
      }));
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

  async deleteLabTest(testId: string): Promise<boolean> {
    const result = await db.transaction(async (tx) => {
      const deletedTest = await tx.delete(labTests)
        .where(eq(labTests.testId, testId))
        .returning();

      // Also remove any related order lines so the request disappears from the Treatment page
      if (deletedTest.length > 0) {
        await tx.delete(orderLines)
          .where(
            and(
              eq(orderLines.relatedId, testId),
              inArray(orderLines.relatedType, LAB_RELATED_TYPES)
            )
          );
      }

      return deletedTest;
    });

    return result.length > 0;
  }

  async createXrayExam(data: schema.InsertXrayExam): Promise<schema.XrayExam> {
    const examId = await generateXrayId();
    const now = new Date().toISOString();
    const clinicDay = getClinicDayKey(new Date());

    const insertData: any = {
      ...data,
      examId,
      status: "pending",
      paymentStatus: 'unpaid', // Ensure default
      clinicDay, // Set clinic day for filtering
      createdAt: now,
    };

    const [xrayExam] = await db.insert(xrayExams).values(insertData).returning();

    return xrayExam;
  }

  async getXrayExams(status?: string, date?: string, startDate?: string, endDate?: string): Promise<(schema.XrayExam & { patient?: schema.Patient })[]> {
    const baseQuery = db.select({
      xrayExam: xrayExams,
      patient: patients
    })
    .from(xrayExams)
    .leftJoin(patients, and(
      eq(xrayExams.patientId, patients.patientId),
      eq(patients.isDeleted, 0) // --- MODIFIED: Ensure joined patient is not deleted ---
    ));

    // Apply filters
    const conditions = [];
    if (status) {
      conditions.push(eq(xrayExams.status, status as any));
    }
    
    // Date filtering - now use clinic_day instead of requestedDate
    // Filter by clinic_day field (date when record was created in Africa/Juba)
    if (date) {
      // Exact date match (for backward compatibility)
      conditions.push(eq(xrayExams.clinicDay, date));
    } else if (startDate && endDate) {
      // Date range filtering using clinic_day (date keys)
      // Range is [start, end] - both bounds inclusive for date columns
      conditions.push(
        and(
          gte(xrayExams.clinicDay, startDate),
          lte(xrayExams.clinicDay, endDate)
        )
      );
    }

    let query = baseQuery;
    if (conditions.length > 0) {
      query = baseQuery.where(and(...conditions));
    }

    const results = await query.orderBy(desc(xrayExams.createdAt));

    // Transform the results to match the expected format
    return results
      .filter(result => result.patient != null) // --- MODIFIED: Filter out results where patient was deleted ---
      .map(result => ({
        ...result.xrayExam,
        patient: result.patient || undefined // Should not be undefined due to filter
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

  async deleteXrayExam(examId: string): Promise<boolean> {
    const result = await db.transaction(async (tx) => {
      const deletedExam = await tx.delete(xrayExams)
        .where(eq(xrayExams.examId, examId))
        .returning();

      // Also remove any related order lines so the request disappears from the Treatment page
      if (deletedExam.length > 0) {
        await tx.delete(orderLines)
          .where(
            and(
              eq(orderLines.relatedId, examId),
              inArray(orderLines.relatedType, XRAY_RELATED_TYPES)
            )
          );
      }

      return deletedExam;
    });

    return result.length > 0;
  }

  // Ultrasound Exams
  async createUltrasoundExam(data: schema.InsertUltrasoundExam): Promise<schema.UltrasoundExam> {
    const examId = await generateUltrasoundId();
    const createdAt = new Date().toISOString();
    const clinicDay = getClinicDayKey(new Date());

    const insertData: any = {
      ...data,
      examId,
      status: "pending",
      paymentStatus: 'unpaid', // Ensure default
      clinicDay, // Set clinic day for filtering
      createdAt,
    };

    const [ultrasoundExam] = await db.insert(ultrasoundExams)
      .values(insertData)
      .returning();

    return ultrasoundExam;
  }

  async getUltrasoundExams(status?: string, startDate?: string, endDate?: string): Promise<schema.UltrasoundExam[]> {
    // --- MODIFIED: Join patients and filter ---
    const baseQuery = db.select({ ultrasoundExam: ultrasoundExams })
        .from(ultrasoundExams)
        .innerJoin(patients, and(
            eq(ultrasoundExams.patientId, patients.patientId),
            eq(patients.isDeleted, 0) // Only include exams for non-deleted patients
        ));

    // Apply filters
    const conditions = [];
    if (status) {
      conditions.push(eq(ultrasoundExams.status, status as any));
    }
    
    // Date range filtering - now use clinic_day instead of requestedDate
    // Filter by clinic_day field (date when record was created in Africa/Juba)
    if (startDate && endDate) {
      conditions.push(
        and(
          gte(ultrasoundExams.clinicDay, startDate),
          lte(ultrasoundExams.clinicDay, endDate)
        )
      );
    }

    let query = baseQuery;
    if (conditions.length > 0) {
      query = baseQuery.where(and(...conditions));
    }

    const results = await query.orderBy(desc(ultrasoundExams.createdAt));
    return results.map(r => r.ultrasoundExam);
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
    const result = await db.transaction(async (tx) => {
      const deletedExam = await tx.delete(ultrasoundExams)
        .where(eq(ultrasoundExams.examId, examId))
        .returning();

      // Also remove any related order lines so the request disappears from the Treatment page
      if (deletedExam.length > 0) {
        await tx.delete(orderLines)
          .where(
            and(
              eq(orderLines.relatedId, examId),
              inArray(orderLines.relatedType, ULTRASOUND_RELATED_TYPES)
            )
          );
      }

      return deletedExam;
    });

    return result.length > 0;
  }

  async getDashboardStats(fromDate?: string, toDate?: string) {
    try {
      console.log("Getting dashboard stats", { fromDate, toDate });

      // DEFAULT TO TODAY if no date range provided
      // Use clinic_day for consistent filtering across all modules
      const clinicToday = today('date');
      const actualFromDate = fromDate || clinicToday;
      const actualToDate = toDate || clinicToday;
      
      console.log("Dashboard stats using clinic_day filter", { actualFromDate, actualToDate });
      
      // Count patients created today (or in date range) using clinic_day
      const patientDateFilter = and(
        eq(patients.isDeleted, 0),
        gte(patients.clinicDay, actualFromDate),
        lte(patients.clinicDay, actualToDate)
      );
      
      const totalPatients = await db.select({ count: count() }).from(patients).where(patientDateFilter);
      
      // Count treatments by clinic_day (when created, not visit_date)
      const totalTreatments = await db.select({ count: count() }).from(treatments).where(
        and(
          gte(treatments.clinicDay, actualFromDate),
          lte(treatments.clinicDay, actualToDate)
        )
      );
      
      // Count lab tests by clinic_day (when ordered, not requested_date)
      const totalLabTests = await db.select({ count: count() }).from(labTests).where(
        and(
          gte(labTests.clinicDay, actualFromDate),
          lte(labTests.clinicDay, actualToDate)
        )
      );
      
      // Count X-rays by clinic_day (when ordered, not requested_date)
      const totalXrays = await db.select({ count: count() }).from(xrayExams).where(
        and(
          gte(xrayExams.clinicDay, actualFromDate),
          lte(xrayExams.clinicDay, actualToDate)
        )
      );
      
      // Count ultrasounds by clinic_day (when ordered, not requested_date)
      const totalUltrasounds = await db.select({ count: count() }).from(ultrasoundExams).where(
        and(
          gte(ultrasoundExams.clinicDay, actualFromDate),
          lte(ultrasoundExams.clinicDay, actualToDate)
        )
      );

      // Get pending counts - Apply same clinic_day range to pending counts
      // This ensures pending counts align with the filtered list view
      const pendingLabTests = await db.select({ count: count() }).from(labTests).where(
        and(
          eq(labTests.status, "pending"),
          gte(labTests.clinicDay, actualFromDate),
          lte(labTests.clinicDay, actualToDate)
        )
      );
      const pendingXrays = await db.select({ count: count() }).from(xrayExams).where(
        and(
          eq(xrayExams.status, "pending"),
          gte(xrayExams.clinicDay, actualFromDate),
          lte(xrayExams.clinicDay, actualToDate)
        )
      );
      const pendingUltrasounds = await db.select({ count: count() }).from(ultrasoundExams).where(
        and(
          eq(ultrasoundExams.status, "pending"),
          gte(ultrasoundExams.clinicDay, actualFromDate),
          lte(ultrasoundExams.clinicDay, actualToDate)
        )
      );

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
        newPatients: totalPatients[0]?.count || 0, // This might need refinement if 'new' means created today
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
      // --- MODIFIED: Add isDeleted filter ---
      const recentPatients = await db.select().from(patients)
        .where(eq(patients.isDeleted, 0)) // Added filter
        .orderBy(desc(patients.createdAt))
        .limit(limit);

      console.log("Found patients:", recentPatients.length);

      const result = [];
      for (const patient of recentPatients) {
        try {
          // Use a simpler query that works with SQLite
          const treatmentResults = await db.select().from(treatments)
            .where(eq(treatments.patientId, patient.patientId))
            .orderBy(desc(treatments.createdAt)) // Use createdAt or visitDate? Using createdAt for most recent entry.
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
  
  async getPatientFlowData() {
    try {
      // Use clinic timezone (Africa/Juba) to ensure records around midnight are classified into correct clinic day
      const clinicToday = today('date');
      
      // Count TODAY's open encounters with no treatments yet (waiting for doctor)
      const waitingForDoctor = await db.select({ count: sql<number>`count(*)` })
        .from(encounters)
        .leftJoin(treatments, eq(encounters.encounterId, treatments.encounterId))
        .where(and(
          eq(encounters.status, 'open'),
          isNull(treatments.id),
          sql`DATE(${encounters.createdAt}) = ${clinicToday}`
        ));
      
      // Count TODAY's open encounters with treatments (in treatment/consultation)
      const inTreatment = await db.select({ count: sql<number>`count(distinct ${encounters.encounterId})` })
        .from(encounters)
        .innerJoin(treatments, eq(encounters.encounterId, treatments.encounterId))
        .where(and(
          eq(encounters.status, 'open'),
          sql`DATE(${encounters.createdAt}) = ${clinicToday}`
        ));
      
      // Count pending lab tests ordered today
      const waitingForLab = await db.select({ count: sql<number>`count(*)` })
        .from(labTests)
        .where(and(
          eq(labTests.status, 'pending'),
          like(labTests.requestedDate, `${clinicToday}%`)
        ));
      
      // Count pending X-rays ordered today
      const waitingForXray = await db.select({ count: sql<number>`count(*)` })
        .from(xrayExams)
        .where(and(
          eq(xrayExams.status, 'pending'),
          like(xrayExams.requestedDate, `${clinicToday}%`)
        ));
      
      // Count pending ultrasounds ordered today
      const waitingForUltrasound = await db.select({ count: sql<number>`count(*)` })
        .from(ultrasoundExams)
        .where(and(
          eq(ultrasoundExams.status, 'pending'),
          like(ultrasoundExams.requestedDate, `${clinicToday}%`)
        ));
      
      // Count pending pharmacy orders
      const waitingForPharmacy = await db.select({ count: sql<number>`count(*)` })
        .from(pharmacyOrders)
        .where(eq(pharmacyOrders.status, 'pending'));
      
      // Count encounters ready for checkout (completed status or billed)
      const readyForCheckout = await db.select({ count: sql<number>`count(*)` })
        .from(encounters)
        .where(or(
          eq(encounters.status, 'completed'),
          eq(encounters.status, 'ready_to_bill')
        ));
      
      return {
        waitingForDoctor: Number(waitingForDoctor[0]?.count || 0),
        inTreatment: Number(inTreatment[0]?.count || 0),
        waitingForLab: Number(waitingForLab[0]?.count || 0),
        waitingForXray: Number(waitingForXray[0]?.count || 0),
        waitingForUltrasound: Number(waitingForUltrasound[0]?.count || 0),
        waitingForPharmacy: Number(waitingForPharmacy[0]?.count || 0),
        readyForCheckout: Number(readyForCheckout[0]?.count || 0),
      };
    } catch (error) {
      console.error("getPatientFlowData error:", error);
      throw error;
    }
  }
  
  async getOutstandingPayments(limit = 10) {
    try {
      // Use clinic timezone (Africa/Juba) to ensure records around midnight are classified into correct clinic day
      const clinicToday = today('date');
      
      // Get TODAY's unpaid lab tests - fetch raw data without grouping
      // to properly parse individual tests from JSON array
      // Limit at query level for performance
      const unpaidLabTestsRaw = await db.select({
        testId: labTests.testId,
        patientId: labTests.patientId,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
        tests: labTests.tests, // JSON array of test names
        category: labTests.category,
        requestedDate: labTests.requestedDate,
      })
      .from(labTests)
      .innerJoin(patients, and(
        eq(labTests.patientId, patients.patientId),
        eq(patients.isDeleted, 0)
      ))
      .where(and(
        eq(labTests.paymentStatus, 'unpaid'),
        sql`${labTests.status} IN ('pending', 'in_progress')`,
        sql`DATE(${labTests.requestedDate}) = ${clinicToday}`
      ))
      .limit(limit * 3); // Fetch more than needed to account for multiple tests per order
      
      // Get all services to look up prices
      const allServices = await this.getServices();
      // Create a Map for O(1) service lookup by name
      const servicesByName = new Map<string, schema.Service>();
      allServices.forEach(service => {
        servicesByName.set(service.name.toLowerCase(), service);
      });
      
      // Process lab tests to break them into individual test items
      interface LabTestItem {
        testId: string;
        parentTestId: string;
        patientId: string;
        patientName: string;
        testName: string;
        category: string;
        requestedDate: string;
        price: number;
      }
      const labTestItems: LabTestItem[] = [];
      
      for (const labTest of unpaidLabTestsRaw) {
        try {
          const testNames = JSON.parse(labTest.tests);
          // Validate that testNames is an array
          if (!Array.isArray(testNames)) {
            console.error(`Invalid tests format for lab test ${labTest.testId}: expected array, got ${typeof testNames}`);
            continue;
          }
          
          testNames.forEach((testName: any, index: number) => {
            // Validate testName is a string
            if (typeof testName !== 'string') {
              console.warn(`Invalid test name type for lab test ${labTest.testId}[${index}]: expected string, got ${typeof testName}`);
              return;
            }
            
            const service = servicesByName.get(testName.toLowerCase());
            if (!service) {
              console.warn(`Service not found for test: "${testName}" in lab order ${labTest.testId}`);
              return;
            }
            
            if (!service.isActive) {
              console.warn(`Service "${testName}" is inactive for lab order ${labTest.testId}`);
              return;
            }
            
            labTestItems.push({
              testId: `${labTest.testId}-${index}`,
              parentTestId: labTest.testId,
              patientId: labTest.patientId,
              patientName: `${labTest.patientFirstName} ${labTest.patientLastName}`,
              testName: testName,
              category: labTest.category,
              requestedDate: labTest.requestedDate,
              price: service.price,
            });
          });
        } catch (error) {
          console.error(`Failed to parse tests JSON for lab test ${labTest.testId}:`, error);
          // Skip this lab test if JSON parsing fails
          continue;
        }
      }
      
      // Group by patient to aggregate test counts and amounts
      const labsByPatient = new Map<string, {
        patientId: string;
        patientName: string;
        testCount: number;
        totalAmount: number;
        testIds: Set<string>;
        createdAt: string;
      }>();
      for (const item of labTestItems) {
        if (!labsByPatient.has(item.patientId)) {
          labsByPatient.set(item.patientId, {
            patientId: item.patientId,
            patientName: item.patientName,
            testCount: 0,
            totalAmount: 0,
            testIds: new Set<string>(),
            createdAt: item.requestedDate,
          });
        }
        const patientData = labsByPatient.get(item.patientId)!;
        patientData.testCount++;
        patientData.totalAmount += item.price;
        patientData.testIds.add(item.parentTestId);
        // Keep the earliest date
        if (item.requestedDate < patientData.createdAt) {
          patientData.createdAt = item.requestedDate;
        }
      }
      
      // Format the aggregated lab data
      const unpaidLabs = Array.from(labsByPatient.values()).map((data) => ({
        patientId: data.patientId,
        patientName: data.patientName,
        serviceDescription: `Lab: ${data.testCount} test${data.testCount > 1 ? 's' : ''}`,
        tests: data.testCount.toString(),
        orderType: 'lab',
        createdAt: data.createdAt,
        testId: Array.from(data.testIds).join(', '),
        amount: data.totalAmount,
      }));
      
      // Get TODAY's unpaid X-rays WITH ACTUAL PRICES from order_lines
      // ONLY show pending/in_progress (exclude completed)
      const unpaidXrays = await db.select({
        patientId: xrayExams.patientId,
        patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
        serviceDescription: sql<string>`'X-Ray: ' || ${xrayExams.examType}`,
        orderType: sql<string>`'xray'`,
        createdAt: xrayExams.requestedDate,
        examId: xrayExams.examId,
        amount: sql<number>`COALESCE(${orderLines.totalPrice}, ${orderLines.unitPriceSnapshot} * ${orderLines.quantity}, 0)`,
      })
      .from(xrayExams)
      .innerJoin(patients, and(
        eq(xrayExams.patientId, patients.patientId),
        eq(patients.isDeleted, 0)
      ))
      .leftJoin(orderLines, and(
        eq(orderLines.relatedId, xrayExams.examId),
        inArray(orderLines.relatedType, XRAY_RELATED_TYPES)
      ))
      .where(and(
        eq(xrayExams.paymentStatus, 'unpaid'),
        sql`${xrayExams.status} IN ('pending', 'in_progress')`,
        sql`DATE(${xrayExams.requestedDate}) = ${clinicToday}`
      ))
      .limit(10);
      
      // Get TODAY's unpaid ultrasounds WITH ACTUAL PRICES from order_lines
      // ONLY show pending/in_progress (exclude completed)
      const unpaidUltrasounds = await db.select({
        patientId: ultrasoundExams.patientId,
        patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
        serviceDescription: sql<string>`'Ultrasound: ' || ${ultrasoundExams.examType}`,
        orderType: sql<string>`'ultrasound'`,
        createdAt: ultrasoundExams.requestedDate,
        examId: ultrasoundExams.examId,
        amount: sql<number>`COALESCE(${orderLines.totalPrice}, ${orderLines.unitPriceSnapshot} * ${orderLines.quantity}, 0)`,
      })
      .from(ultrasoundExams)
      .innerJoin(patients, and(
        eq(ultrasoundExams.patientId, patients.patientId),
        eq(patients.isDeleted, 0)
      ))
      .leftJoin(orderLines, and(
        eq(orderLines.relatedId, ultrasoundExams.examId),
        sql`${orderLines.relatedType} IN ('ultrasound', 'ultrasound_exam')`
      ))
      .where(and(
        eq(ultrasoundExams.paymentStatus, 'unpaid'),
        sql`${ultrasoundExams.status} IN ('pending', 'in_progress')`,
        sql`DATE(${ultrasoundExams.requestedDate}) = ${clinicToday}`
      ))
      .limit(10);
      
      // Format labs (amount already calculated via COALESCE)
      const labsWithAmounts = unpaidLabs.map((lab: any) => ({
        ...lab,
        id: lab.testId,
      }));
      
      // Format X-rays (amount already calculated via COALESCE)
      const xraysWithAmounts = unpaidXrays.map((xray: any) => ({
        ...xray,
        id: xray.examId,
      }));
      
      // Format ultrasounds (amount already calculated via COALESCE)
      const ultrasoundsWithAmounts = unpaidUltrasounds.map((us: any) => ({
        ...us,
        id: us.examId,
      }));
      
      // Combine and sort by date, then limit
      const allUnpaid = [...labsWithAmounts, ...xraysWithAmounts, ...ultrasoundsWithAmounts]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
      
      console.log(`Outstanding Payments DEBUG: Found ${unpaidLabs.length} labs, ${unpaidXrays.length} xrays, ${unpaidUltrasounds.length} ultrasounds for TODAY (${today})`);
      console.log('Outstanding Payments Results:', JSON.stringify(allUnpaid, null, 2));
      
      return allUnpaid;
    } catch (error) {
      console.error("getOutstandingPayments error:", error);
      throw error;
    }
  }
  
  async getResultsReadyForReview(limit: number = 10) {
    try {
      // Use clinic timezone (Africa/Juba) to ensure records around midnight are classified into correct clinic day
      const clinicToday = today('date');
      
      // Get all non-deleted patients as a lookup map
      const allPatients = await db.select().from(patients).where(eq(patients.isDeleted, 0));
      const patientMap = new Map();
      for (const p of allPatients) {
        patientMap.set(p.patientId, p);
      }
      
      // Get TODAY's completed lab tests
      const completedLabs = await db.select()
        .from(labTests)
        .where(and(
          eq(labTests.status, 'completed'),
          sql`DATE(${labTests.completedDate}) = ${clinicToday}`
        ));
      
      // Get TODAY's completed X-rays
      const completedXrays = await db.select()
        .from(xrayExams)
        .where(and(
          eq(xrayExams.status, 'completed'),
          sql`DATE(${xrayExams.reportDate}) = ${clinicToday}`
        ));
      
      // Get TODAY's completed ultrasounds
      const completedUltrasounds = await db.select()
        .from(ultrasoundExams)
        .where(and(
          eq(ultrasoundExams.status, 'completed'),
          sql`DATE(${ultrasoundExams.reportDate}) = ${clinicToday}`
        ));
      
      // Get all order lines to link tests to encounters (if available)
      const allOrderLines = await db.select().from(orderLines);
      
      // Create mappings: testId -> encounterId (some tests may not have order lines)
      const labTestToEncounter = new Map();
      const xrayToEncounter = new Map();
      const ultrasoundToEncounter = new Map();
      
      for (const orderLine of allOrderLines) {
        if ((orderLine.relatedType === 'lab_test' || orderLine.relatedType === 'lab') && orderLine.relatedId) {
          labTestToEncounter.set(orderLine.relatedId, orderLine.encounterId);
        } else if (XRAY_RELATED_TYPES.includes(orderLine.relatedType as any) && orderLine.relatedId) {
          xrayToEncounter.set(orderLine.relatedId, orderLine.encounterId);
        } else if ((orderLine.relatedType === 'ultrasound_exam' || orderLine.relatedType === 'ultrasound') && orderLine.relatedId) {
          ultrasoundToEncounter.set(orderLine.relatedId, orderLine.encounterId);
        }
      }
      
      // Group results by patient (not encounter, since some tests may not have encounters)
      const patientResults = new Map();
      
      // Process labs
      for (const lab of completedLabs) {
        const patient = patientMap.get(lab.patientId);
        if (!patient) continue;
        
        const encId = labTestToEncounter.get(lab.testId) || null;
        const key = `${lab.patientId}`;
        
        if (!patientResults.has(key)) {
          patientResults.set(key, {
            encounterId: encId,
            patientId: patient.patientId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            results: [],
            latestTime: new Date(lab.completedDate || lab.createdAt).getTime(),
          });
        }
        
        const testNames = JSON.parse(lab.tests);
        patientResults.get(key).results.push({
          type: 'Lab',
          icon: 'TestTube',
          testName: testNames.join(', '),
          time: lab.completedDate || lab.createdAt,
        });
        patientResults.get(key).latestTime = Math.max(
          patientResults.get(key).latestTime,
          new Date(lab.completedDate || lab.createdAt).getTime()
        );
      }
      
      // Process X-rays
      for (const xray of completedXrays) {
        const patient = patientMap.get(xray.patientId);
        if (!patient) continue;
        
        const encId = xrayToEncounter.get(xray.examId) || null;
        const key = `${xray.patientId}`;
        
        if (!patientResults.has(key)) {
          patientResults.set(key, {
            encounterId: encId,
            patientId: patient.patientId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            results: [],
            latestTime: new Date(xray.reportDate || xray.createdAt).getTime(),
          });
        }
        
        patientResults.get(key).results.push({
          type: 'X-Ray',
          icon: 'Scan',
          testName: xray.examType || 'X-Ray',
          time: xray.reportDate || xray.createdAt,
        });
        patientResults.get(key).latestTime = Math.max(
          patientResults.get(key).latestTime,
          new Date(xray.reportDate || xray.createdAt).getTime()
        );
      }
      
      // Process ultrasounds
      for (const us of completedUltrasounds) {
        const patient = patientMap.get(us.patientId);
        if (!patient) continue;
        
        const encId = ultrasoundToEncounter.get(us.examId) || null;
        const key = `${us.patientId}`;
        
        if (!patientResults.has(key)) {
          patientResults.set(key, {
            encounterId: encId,
            patientId: patient.patientId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            results: [],
            latestTime: new Date(us.reportDate || us.createdAt).getTime(),
          });
        }
        
        patientResults.get(key).results.push({
          type: 'Ultrasound',
          icon: 'MonitorSpeaker',
          testName: us.examType || 'Ultrasound',
          time: us.reportDate || us.createdAt,
        });
        patientResults.get(key).latestTime = Math.max(
          patientResults.get(key).latestTime,
          new Date(us.reportDate || us.createdAt).getTime()
        );
      }
      
      // For each patient, count TOTAL ORDERED tests vs COMPLETED tests
      const resultsWithProgress = Array.from(patientResults.values()).map(entry => {
        const patientId = entry.patientId;
        
        // Count ordered diagnostic tests for this patient TODAY
        const orderedTests = allOrderLines.filter(ol => {
          if (!ol.relatedType || !ol.relatedId) return false;
          
          // Get the patient from the related test
          let testPatientId = null;
          if (ol.relatedType === 'lab' || ol.relatedType === 'lab_test') {
            const lab = completedLabs.find(l => l.testId === ol.relatedId);
            if (!lab) {
              // Check pending labs too
              const allLabs = [...completedLabs];
              const found = allLabs.find(l => l.testId === ol.relatedId);
              testPatientId = found?.patientId;
            } else {
              testPatientId = lab.patientId;
            }
          } else if (XRAY_RELATED_TYPES.includes(ol.relatedType as any)) {
            const xray = completedXrays.find(x => x.examId === ol.relatedId);
            testPatientId = xray?.patientId;
          } else if (ol.relatedType === 'ultrasound' || ol.relatedType === 'ultrasound_exam') {
            const us = completedUltrasounds.find(u => u.examId === ol.relatedId);
            testPatientId = us?.patientId;
          }
          
          return testPatientId === patientId && 
                 ['lab', 'lab_test', ...XRAY_RELATED_TYPES, 'ultrasound', 'ultrasound_exam'].includes(ol.relatedType as any);
        });
        
        // Map ordered tests to their types
        const orderedTestTypes = orderedTests.map(ol => {
          if (ol.relatedType === 'lab' || ol.relatedType === 'lab_test') return 'Lab';
          if (XRAY_RELATED_TYPES.includes(ol.relatedType as any)) return 'X-Ray';
          if (ol.relatedType === 'ultrasound' || ol.relatedType === 'ultrasound_exam') return 'Ultrasound';
          return null;
        }).filter(Boolean);
        
        const uniqueOrderedTypes = [...new Set(orderedTestTypes)];
        const completedTypes = [...new Set(entry.results.map(r => r.type))];
        const pendingTypes = uniqueOrderedTypes.filter(type => !completedTypes.includes(type));
        
        const totalOrdered = orderedTests.length || entry.results.length; // Fallback to completed count if no orders
        const completedCount = entry.results.length;
        const allComplete = completedCount >= totalOrdered;
        
        return {
          encounterId: entry.encounterId,
          patientId: entry.patientId,
          firstName: entry.firstName,
          lastName: entry.lastName,
          resultCount: completedCount,
          totalOrdered: totalOrdered,
          allComplete: allComplete,
          completionStatus: allComplete ? 'complete' : 'partial',
          resultTypes: completedTypes,
          orderedTestTypes: uniqueOrderedTypes,
          pendingTestTypes: pendingTypes,
          resultSummary: entry.results.map(r => r.testName).slice(0, 3).join(', '),
          hasMoreResults: entry.results.length > 3,
          latestTime: entry.latestTime,
        };
      });
      
      // Sort: All complete first, then by most recent
      const sortedResults = resultsWithProgress
        .sort((a, b) => {
          // Priority 1: All complete comes first
          if (a.allComplete !== b.allComplete) {
            return a.allComplete ? -1 : 1;
          }
          // Priority 2: Most recent
          return b.latestTime - a.latestTime;
        })
        .slice(0, limit);
      
      return sortedResults;
    } catch (error) {
      console.error("getResultsReadyForReview error:", error);
      throw error;
    }
  }
  
  // Today filter methods
  async getTodaysPatients(): Promise<schema.Patient[]> {
    // Use clinic timezone (Africa/Juba) to ensure records around midnight are classified into correct clinic day
    const clinicToday = today('date'); // Get YYYY-MM-DD format

    try {
      // Try using clinic_day column if it exists (preferred method after migration)
      return await db.select().from(patients)
        .where(
          and(
            eq(patients.isDeleted, 0),
            sql`clinic_day = ${clinicToday}`
          )
        )
        .orderBy(desc(patients.createdAt));
    } catch (error: any) {
      // Fallback: If clinic_day doesn't exist or query fails, use safe casting approach
      console.log('[patients] getTodaysPatients clinic_day query failed, using fallback casting');
      try {
        return await db.select().from(patients)
          .where(
            and(
              eq(patients.isDeleted, 0),
              sql`(${patients.createdAt}::timestamptz AT TIME ZONE 'Africa/Juba')::date = ${clinicToday}`
            )
          )
          .orderBy(desc(patients.createdAt));
      } catch (castError: any) {
        // Final fallback: Use UTC date extraction
        console.log('[patients] today fetch failed, using UTC fallback');
        return await db.select().from(patients)
          .where(
            and(
              eq(patients.isDeleted, 0),
              sql`DATE(${patients.createdAt}) = ${clinicToday}`
            )
          )
          .orderBy(desc(patients.createdAt));
      }
    }
  }

  async getPatientsByDate(date: string): Promise<schema.Patient[]> {
    try {
      // Try using clinic_day column if it exists (preferred method after migration)
      return await db.select().from(patients)
        .where(
          and(
            eq(patients.isDeleted, 0),
            sql`clinic_day = ${date}`
          )
        )
        .orderBy(desc(patients.createdAt));
    } catch (error: any) {
      // Fallback: Use safe casting approach
      try {
        return await db.select().from(patients)
          .where(
            and(
              eq(patients.isDeleted, 0),
              sql`(${patients.createdAt}::timestamptz AT TIME ZONE 'Africa/Juba')::date = ${date}`
            )
          )
          .orderBy(desc(patients.createdAt));
      } catch (castError: any) {
        // Final fallback: Use UTC date extraction
        return await db.select().from(patients)
          .where(
            and(
              eq(patients.isDeleted, 0),
              sql`DATE(${patients.createdAt}) = ${date}`
            )
          )
          .orderBy(desc(patients.createdAt));
      }
    }
  }

  async getPatientsByDateRange(startDate: string, endDate: string): Promise<schema.Patient[]> {
    try {
      // Try using clinic_day column if it exists (preferred method after migration)
      return await db.select().from(patients)
        .where(
          and(
            eq(patients.isDeleted, 0),
            sql`clinic_day >= ${startDate}`,
            sql`clinic_day <= ${endDate}`
          )
        )
        .orderBy(desc(patients.createdAt));
    } catch (error: any) {
      // Fallback: Use safe casting approach on created_at
      try {
        return await db.select().from(patients)
          .where(
            and(
              eq(patients.isDeleted, 0),
              sql`(${patients.createdAt}::timestamptz AT TIME ZONE 'Africa/Juba')::date >= ${startDate}`,
              sql`(${patients.createdAt}::timestamptz AT TIME ZONE 'Africa/Juba')::date <= ${endDate}`
            )
          )
          .orderBy(desc(patients.createdAt));
      } catch (castError: any) {
        // Final fallback: Use simple timestamp comparison (less accurate for timezone boundaries)
        return await db.select().from(patients)
          .where(
            and(
              eq(patients.isDeleted, 0),
              sql`${patients.createdAt} >= ${startDate}`,
              sql`${patients.createdAt} <= ${endDate}`
            )
          )
          .orderBy(desc(patients.createdAt));
      }
    }
  }

  async getTodaysTreatments(): Promise<schema.Treatment[]> {
    // Use clinic timezone (Africa/Juba) to ensure records around midnight are classified into correct clinic day
    const clinicToday = today('date'); // Get YYYY-MM-DD format

    // --- MODIFIED: Join patients and filter ---
    return await db.select({ treatment: treatments })
      .from(treatments)
      .innerJoin(patients, and(
          eq(treatments.patientId, patients.patientId),
          eq(patients.isDeleted, 0) // Only treatments for non-deleted patients
      ))
      .where(
        // Check if visit date is today (exact match) or created today
        or(
          eq(treatments.visitDate, clinicToday),
          like(treatments.createdAt, `${clinicToday}%`)
        )
      )
      .orderBy(desc(treatments.createdAt))
      .then(results => results.map(r => r.treatment)); // Extract treatment object
  }

  // Payment Services
  async getServices(): Promise<schema.Service[]> {
    // Return all services (both active and inactive) for management and historical lookup purposes
    // This ensures we can display/reference services that were previously active but are now inactive
    return await db.select().from(services).orderBy(services.category, services.name);
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
      isActive: data.isActive ?? true, // Default to active
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

  async deleteService(id: number): Promise<{
    success: boolean;
    blocked?: boolean;
    notFound?: boolean;
    message?: string;
    details?: {
      orderLines?: number;
      paymentItems?: number;
      pharmacyOrders?: number;
    };
  }> {
    // Check if service exists
    const [service] = await db.select().from(services).where(eq(services.id, id));
    if (!service) {
      return {
        success: false,
        notFound: true,
        message: "Service not found"
      };
    }

    // Check for references in all tables in parallel for better performance
    const [orderLinesCount, paymentItemsCount, pharmacyOrdersCount] = await Promise.all([
      db.select({ count: count() })
        .from(orderLines)
        .where(eq(orderLines.serviceId, id)),
      db.select({ count: count() })
        .from(paymentItems)
        .where(eq(paymentItems.serviceId, id)),
      db.select({ count: count() })
        .from(pharmacyOrders)
        .where(eq(pharmacyOrders.serviceId, id)),
    ]);
    
    // Helper function to extract count value
    const getCount = (result: { count: number }[]) => result[0]?.count || 0;
    
    const orderLinesRefs = getCount(orderLinesCount);
    const paymentItemsRefs = getCount(paymentItemsCount);
    const pharmacyOrdersRefs = getCount(pharmacyOrdersCount);
    
    const totalRefs = orderLinesRefs + paymentItemsRefs + pharmacyOrdersRefs;
    
    // If service is referenced, block deletion
    if (totalRefs > 0) {
      return {
        success: false,
        blocked: true,
        message: "Cannot delete service because it is referenced by existing records",
        details: {
          orderLines: orderLinesRefs,
          paymentItems: paymentItemsRefs,
          pharmacyOrders: pharmacyOrdersRefs,
        }
      };
    }
    
    // Safe to delete - no references found
    await db.delete(services)
      .where(eq(services.id, id))
      .run();
    
    return {
      success: true,
      message: "Service deleted successfully"
    };
  }

  async bulkUpdateServiceCodes(updates: Array<{ id: number; code: string }>): Promise<void> {
    // Perform bulk update of service codes
    for (const update of updates) {
      await db.update(services)
        .set({ code: update.code })
        .where(eq(services.id, update.id))
        .run();
    }
  }

  // Payments
  async createPayment(data: schema.InsertPayment): Promise<schema.Payment> {
    const paymentId = await generatePaymentId();
    const now = new Date().toISOString();
    const clinicDay = getClinicDayKey(); // Set clinic day using Africa/Juba timezone
    const insertData: any = {
      ...data,
      paymentId,
      clinicDay,
      createdAt: now,
    };

    const [payment] = await db.insert(payments).values(insertData).returning();
    return payment;
  }

  async getPayments(startDayKey?: string, endDayKey?: string): Promise<schema.Payment[]> {
    // If date range provided, filter by clinic_day
    if (startDayKey && endDayKey) {
      return await db.select().from(payments)
        .where(
          and(
            gte(payments.clinicDay, startDayKey),
            lte(payments.clinicDay, endDayKey)
          )
        )
        .orderBy(desc(payments.createdAt));
    }
    
    // No filter - return all payments
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
    const paymentCheck = await db.select({ count: count() })
      .from(paymentItems)
      .innerJoin(payments, eq(paymentItems.paymentId, payments.paymentId))
      .where(
        and(
          eq(payments.patientId, patientId),
          eq(paymentItems.relatedType, relatedTypeMap[serviceType] as any),
          eq(paymentItems.relatedId, requestId)
        )
      );

    return (paymentCheck[0]?.count || 0) > 0;
  }

  // Pharmacy Orders
  async createPharmacyOrder(data: schema.InsertPharmacyOrder): Promise<schema.PharmacyOrder> {
    const orderId = await generatePharmacyId();
    const now = new Date().toISOString();
    const insertData = {
      ...data,
      orderId,
      status: 'prescribed', // Ensure default
      paymentStatus: 'unpaid', // Ensure default
      createdAt: now,
    };

    const [pharmacyOrder] = await db.insert(pharmacyOrders).values([insertData]).returning();
    return pharmacyOrder;
  }

  async getPharmacyOrders(status?: string): Promise<schema.PharmacyOrder[]> {
    // --- MODIFIED: Join patients and filter ---
    const baseQuery = db.select({ pharmacyOrder: pharmacyOrders })
      .from(pharmacyOrders)
      .innerJoin(patients, and(
          eq(pharmacyOrders.patientId, patients.patientId),
          eq(patients.isDeleted, 0) // Only include orders for non-deleted patients
      ));

    if (status) {
      const results = await baseQuery.where(eq(pharmacyOrders.status, status as any))
        .orderBy(desc(pharmacyOrders.createdAt));
      return results.map(r => r.pharmacyOrder);
    }
    const results = await baseQuery.orderBy(desc(pharmacyOrders.createdAt));
    return results.map(r => r.pharmacyOrder);
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
    const now = new Date().toISOString();
    const [pharmacyOrder] = await db.update(pharmacyOrders)
      .set({ status: 'dispensed', dispensedAt: now }) // --- MODIFIED: Also set dispensedAt ---
      .where(eq(pharmacyOrders.orderId, orderId))
      .returning();

    return pharmacyOrder;
  }

  // Enhanced patient queries with service status information
  async getPatientsWithStatus(search?: string): Promise<(schema.Patient & { serviceStatus: any })[]> {
    let patientsData: schema.Patient[];

    // --- MODIFIED: Added isDeleted filter here ---
    const baseCondition = eq(patients.isDeleted, 0);

    if (search) {
      patientsData = await db.select().from(patients)
        .where(
          and(
            baseCondition, // Added filter
            or(
              ilike(patients.firstName, `%${search}%`),
              ilike(patients.lastName, `%${search}%`),
              ilike(patients.patientId, `%${search}%`)
            )
          )
        )
        .orderBy(desc(patients.createdAt));
    } else {
      patientsData = await db.select().from(patients)
        .where(baseCondition) // Added filter
        .orderBy(desc(patients.createdAt));
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
    // Use clinic timezone (Africa/Juba) to ensure records around midnight are classified into correct clinic day
    const clinicToday = today('date');

    let patientsData: schema.Patient[] = [];
    
    try {
      // Try using clinic_day column if it exists
      patientsData = await db.select().from(patients)
        .where(and(
          eq(patients.isDeleted, 0),
          sql`clinic_day = ${clinicToday}`
        ))
        .orderBy(desc(patients.createdAt));
    } catch (error: any) {
      // Fallback: Use safe casting approach
      console.log('[patients] getTodaysPatientsWithStatus clinic_day query failed, using fallback');
      try {
        patientsData = await db.select().from(patients)
          .where(and(
            eq(patients.isDeleted, 0),
            sql`(${patients.createdAt}::timestamptz AT TIME ZONE 'Africa/Juba')::date = ${clinicToday}`
          ))
          .orderBy(desc(patients.createdAt));
      } catch (castError: any) {
        // Final fallback
        patientsData = await db.select().from(patients)
          .where(and(
            eq(patients.isDeleted, 0),
            sql`DATE(${patients.createdAt}) = ${clinicToday}`
          ))
          .orderBy(desc(patients.createdAt));
      }
    }

    const patientsWithStatus = await Promise.all(
      patientsData.map(async (patient) => {
        const serviceStatus = await this.getPatientServiceStatus(patient.patientId);
        return { ...patient, serviceStatus };
      })
    );

    return patientsWithStatus;
  }

  async getPatientsByDateWithStatus(date: string): Promise<(schema.Patient & { serviceStatus: any })[]> {
    let patientsData: schema.Patient[] = [];
    
    try {
      // Try using clinic_day column if it exists
      patientsData = await db.select().from(patients)
        .where(and(
          eq(patients.isDeleted, 0),
          sql`clinic_day = ${date}`
        ))
        .orderBy(desc(patients.createdAt));
    } catch (error: any) {
      // Fallback: Use safe casting approach
      try {
        patientsData = await db.select().from(patients)
          .where(and(
            eq(patients.isDeleted, 0),
            sql`(${patients.createdAt}::timestamptz AT TIME ZONE 'Africa/Juba')::date = ${date}`
          ))
          .orderBy(desc(patients.createdAt));
      } catch (castError: any) {
        // Final fallback
        patientsData = await db.select().from(patients)
          .where(and(
            eq(patients.isDeleted, 0),
            sql`DATE(${patients.createdAt}) = ${date}`
          ))
          .orderBy(desc(patients.createdAt));
      }
    }

    const patientsWithStatus = await Promise.all(
      patientsData.map(async (patient) => {
        const serviceStatus = await this.getPatientServiceStatus(patient.patientId);
        return { ...patient, serviceStatus };
      })
    );

    return patientsWithStatus;
  }

  // Filter patients by REGISTRATION date range (patients.createdAt) - for Patients page
  async getPatientsByDateRangeWithStatus(startDate: string, endDate: string): Promise<(schema.Patient & { serviceStatus: any })[]> {
    let patientsData: schema.Patient[] = [];
    
    // Assume inputs are clinic day keys (YYYY-MM-DD) from getPresetDayKeys
    // Use inclusive comparison for both start and end day keys
    const startDayKey = startDate;
    const endDayKey = endDate;
    
    try {
      // Try using clinic_day column if it exists (preferred method)
      // Use inclusive end comparison (<=) for day-key ranges
      patientsData = await db.select().from(patients)
        .where(
          and(
            eq(patients.isDeleted, 0),
            sql`clinic_day >= ${startDayKey}`,
            sql`clinic_day <= ${endDayKey}` // Inclusive end for day keys
          )
        )
        .orderBy(desc(patients.createdAt));
    } catch (error: any) {
      // Fallback: Use safe casting approach with timestamp conversion
      try {
        patientsData = await db.select().from(patients)
          .where(
            and(
              eq(patients.isDeleted, 0),
              sql`(${patients.createdAt}::timestamptz AT TIME ZONE 'Africa/Juba')::date >= ${startDayKey}`,
              sql`(${patients.createdAt}::timestamptz AT TIME ZONE 'Africa/Juba')::date <= ${endDayKey}`
            )
          )
          .orderBy(desc(patients.createdAt));
      } catch (castError: any) {
        // Final fallback - treat as timestamp range (should not happen with day keys)
        const { getClinicDayKey } = await import('@shared/clinic-date');
        const startTimestamp = new Date(`${startDayKey}T00:00:00Z`).toISOString();
        const endTimestamp = new Date(`${endDayKey}T23:59:59.999Z`).toISOString();
        patientsData = await db.select().from(patients)
          .where(
            and(
              eq(patients.isDeleted, 0),
              sql`${patients.createdAt} >= ${startTimestamp}`,
              sql`${patients.createdAt} <= ${endTimestamp}`
            )
          )
          .orderBy(desc(patients.createdAt));
      }
    }

    const patientsWithStatus = await Promise.all(
      patientsData.map(async (patient: any) => {
        const serviceStatus = await this.getPatientServiceStatus(patient.patientId);
        return { ...patient, serviceStatus };
      })
    );

    return patientsWithStatus;
  }

  // Filter patients by ENCOUNTER/VISIT date range (encounters.clinicDay) - for Treatment page
  async getPatientsByEncounterDateRangeWithStatus(startDate: string, endDate: string): Promise<(schema.Patient & { serviceStatus: any; dateOfService?: string; lastVisit?: string; visitStatus?: string })[]> {
    console.log(`[storage] getPatientsByEncounterDateRangeWithStatus called with`, { startDate, endDate });

    // Query encounters using the SAME pattern as the working Patient page
    // Use direct sql template strings (NOT Drizzle helpers like gte/lte)
    const encounterRows = await db.select({ 
        patientId: encounters.patientId, 
        visitDate: encounters.visitDate,
        clinicDay: encounters.clinicDay,
        status: encounters.status  // Include encounter status
      })
      .from(encounters)
      .where(
        and(
          sql`${encounters.clinicDay} >= ${startDate}`,    // ✅ Direct sql - matches Patient page
          sql`${encounters.clinicDay} <= ${endDate}`       // ✅ Direct sql - matches Patient page
        )
      )
      .orderBy(desc(encounters.visitDate));

    const uniquePatientMap = new Map<string, { patientId: string; dateOfService?: string; visitStatus?: string }>();
    for (const row of encounterRows) {
      if (!uniquePatientMap.has(row.patientId)) {
        uniquePatientMap.set(row.patientId, { patientId: row.patientId, dateOfService: row.clinicDay, visitStatus: row.status });
      }
    }

    const uniquePatientIds = Array.from(uniquePatientMap.keys());
    if (uniquePatientIds.length === 0) return [];

    // Fetch active patients only
    const patientsRows = await db.select().from(patients)
      .where(and(eq(patients.isDeleted, 0), sql`${patients.patientId} IN (${sql.join(uniquePatientIds.map(id => sql`${id}`), sql`, `)})`))
      .orderBy(desc(patients.createdAt));

    // Attach serviceStatus, dateOfService, and visitStatus fields
    const results = await Promise.all(patientsRows.map(async (p: any) => {
      const serviceStatus = await this.getPatientServiceStatus(p.patientId);
      return {
        ...p,
        serviceStatus,
        dateOfService: uniquePatientMap.get(p.patientId)?.dateOfService,
        lastVisit: uniquePatientMap.get(p.patientId)?.dateOfService,
        visitStatus: uniquePatientMap.get(p.patientId)?.visitStatus,
      };
    }));

    // Sort by dateOfService descending
    return results.sort((a, b) => {
      const aTime = a.dateOfService ? new Date(a.dateOfService).getTime() : 0;
      const bTime = b.dateOfService ? new Date(b.dateOfService).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getPatientServiceStatus(patientId: string) {
    // Get counts of services by payment status
    // --- NOTE: These queries do not need isDeleted check as they operate on specific patient's orders ---
    const [labTestsData, xrayExamsData, ultrasoundExamsData, pharmacyOrdersData, consultationData] = await Promise.all([
      db.select({
        total: sql<number>`count(*)`.mapWith(Number),
        unpaid: sql<number>`sum(case when ${labTests.paymentStatus} = 'unpaid' then 1 else 0 end)`.mapWith(Number),
        pending: sql<number>`sum(case when ${labTests.status} = 'pending' then 1 else 0 end)`.mapWith(Number),
        completed: sql<number>`sum(case when ${labTests.status} = 'completed' then 1 else 0 end)`.mapWith(Number),
      })
      .from(labTests)
      .where(eq(labTests.patientId, patientId)),

      db.select({
        total: sql<number>`count(*)`.mapWith(Number),
        unpaid: sql<number>`sum(case when ${xrayExams.paymentStatus} = 'unpaid' then 1 else 0 end)`.mapWith(Number),
        pending: sql<number>`sum(case when ${xrayExams.status} = 'pending' then 1 else 0 end)`.mapWith(Number),
        completed: sql<number>`sum(case when ${xrayExams.status} = 'completed' then 1 else 0 end)`.mapWith(Number),
      })
      .from(xrayExams)
      .where(eq(xrayExams.patientId, patientId)),

      db.select({
        total: sql<number>`count(*)`.mapWith(Number),
        unpaid: sql<number>`sum(case when ${ultrasoundExams.paymentStatus} = 'unpaid' then 1 else 0 end)`.mapWith(Number),
        pending: sql<number>`sum(case when ${ultrasoundExams.status} = 'pending' then 1 else 0 end)`.mapWith(Number),
        completed: sql<number>`sum(case when ${ultrasoundExams.status} = 'completed' then 1 else 0 end)`.mapWith(Number),
      })
      .from(ultrasoundExams)
      .where(eq(ultrasoundExams.patientId, patientId)),

      db.select({
        total: sql<number>`count(*)`.mapWith(Number),
        unpaid: sql<number>`sum(case when ${pharmacyOrders.paymentStatus} = 'unpaid' then 1 else 0 end)`.mapWith(Number),
        prescribed: sql<number>`sum(case when ${pharmacyOrders.status} = 'prescribed' then 1 else 0 end)`.mapWith(Number),
        dispensed: sql<number>`sum(case when ${pharmacyOrders.status} = 'dispensed' then 1 else 0 end)`.mapWith(Number),
      })
      .from(pharmacyOrders)
      .where(eq(pharmacyOrders.patientId, patientId)),

      // Check consultation order lines - they are unpaid if no payment item exists for them
      // Also calculate the total amount due for unpaid consultation services
      db.select({
        total: sql<number>`count(*)`.mapWith(Number),
        unpaid: sql<number>`sum(case when ${paymentItems.id} is null then 1 else 0 end)`.mapWith(Number),
        unpaidAmount: sql<number>`sum(case when ${paymentItems.id} is null then ${orderLines.totalPrice} else 0 end)`.mapWith(Number),
      })
      .from(orderLines)
      .innerJoin(encounters, eq(orderLines.encounterId, encounters.encounterId))
      .leftJoin(paymentItems, eq(paymentItems.orderLineId, orderLines.id))
      .where(and(
        eq(encounters.patientId, patientId),
        eq(orderLines.relatedType, "consultation")
      ))
    ]);

    // Calculate the total balance due (unpaid consultation amounts + unpaid amounts from other services if prices available)
    // For simplicity, let's just use consultation balance for now, assuming other prices are handled elsewhere or sum to zero if paid
    const consultationBalance = consultationData[0]?.unpaidAmount || 0;

    // Sum up totals including consultation order lines
    const labTotal = labTestsData[0]?.total || 0;
    const labUnpaid = labTestsData[0]?.unpaid || 0;
    const labPending = labTestsData[0]?.pending || 0;
    const labCompleted = labTestsData[0]?.completed || 0;

    const xrayTotal = xrayExamsData[0]?.total || 0;
    const xrayUnpaid = xrayExamsData[0]?.unpaid || 0;
    const xrayPending = xrayExamsData[0]?.pending || 0;
    const xrayCompleted = xrayExamsData[0]?.completed || 0;

    const usTotal = ultrasoundExamsData[0]?.total || 0;
    const usUnpaid = ultrasoundExamsData[0]?.unpaid || 0;
    const usPending = ultrasoundExamsData[0]?.pending || 0;
    const usCompleted = ultrasoundExamsData[0]?.completed || 0;

    const pharmTotal = pharmacyOrdersData[0]?.total || 0;
    const pharmUnpaid = pharmacyOrdersData[0]?.unpaid || 0;
    const pharmPrescribed = pharmacyOrdersData[0]?.prescribed || 0;
    const pharmDispensed = pharmacyOrdersData[0]?.dispensed || 0;

    const consultTotal = consultationData[0]?.total || 0;
    const consultUnpaid = consultationData[0]?.unpaid || 0;


    const totals = {
      totalServices: labTotal + xrayTotal + usTotal + pharmTotal + consultTotal,
      unpaidServices: labUnpaid + xrayUnpaid + usUnpaid + pharmUnpaid + consultUnpaid,
      pendingServices: labPending + xrayPending + usPending + pharmPrescribed, // Consultations don't have a 'pending' state here
      completedServices: labCompleted + xrayCompleted + usCompleted + pharmDispensed, // Consultations don't have a 'completed' state here
      hasUnpaidServices: (labUnpaid + xrayUnpaid + usUnpaid + pharmUnpaid + consultUnpaid) > 0,
      hasPendingServices: (labPending + xrayPending + usPending + pharmPrescribed) > 0,
      // Add balance fields that the UI expects
      balance: consultationBalance, // Simplified balance calculation
      balanceToday: consultationBalance, // Simplified balance calculation
      // Diagnostic-specific pending counts for doctor workflow (exclude pharmacy)
      labPending,
      xrayPending,
      ultrasoundPending: usPending,
      diagnosticPending: labPending + xrayPending + usPending,
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
    const clinicDay = getClinicDayKey(new Date());

    const insertData = {
      ...data,
      encounterId,
      status: 'open', // Ensure default
      clinicDay, // Set clinic day for filtering
      createdAt: now,
    };

    const [encounter] = await db.insert(encounters).values(insertData).returning();
    return encounter;
  }

  async getEncounters(status?: string, startDayKey?: string, endDayKey?: string, patientId?: string): Promise<schema.Encounter[]> {
    // --- MODIFIED: Join patients and filter ---
    let query = db.select({ encounter: encounters })
        .from(encounters)
        .innerJoin(patients, and(
            eq(encounters.patientId, patients.patientId),
            eq(patients.isDeleted, 0) // Only encounters for non-deleted patients
        ));

    const conditions = [];
    if (status) {
      conditions.push(eq(encounters.status, status as any));
    }
    
    // Date filtering using clinic_day field
    if (startDayKey && endDayKey) {
      // Multi-day range: inclusive on both ends
      conditions.push(
        and(
          gte(encounters.clinicDay, startDayKey),
          lte(encounters.clinicDay, endDayKey)
        )
      );
      console.log(`[storage.getEncounters] Filtering by clinic_day range: ${startDayKey} to ${endDayKey} (inclusive)`);
    } else if (startDayKey) {
      // Single day: backward compatibility
      conditions.push(eq(encounters.clinicDay, startDayKey));
      console.log(`[storage.getEncounters] Filtering by single clinic_day: ${startDayKey}`);
    }
    
    if (patientId) {
      conditions.push(eq(encounters.patientId, patientId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(encounters.createdAt));
    return results.map(r => r.encounter);
  }

  async getEncounterById(encounterId: string): Promise<schema.Encounter | null> {
    // --- MODIFIED: Join patients and filter ---
    const results = await db.select({ encounter: encounters })
        .from(encounters)
        .innerJoin(patients, and(
            eq(encounters.patientId, patients.patientId),
            eq(patients.isDeleted, 0)
        ))
        .where(eq(encounters.encounterId, encounterId));
    return results[0]?.encounter || null;
  }

  async getEncountersByPatient(patientId: string): Promise<schema.Encounter[]> {
    // --- No change needed here, implicitly for an active patient ---
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
      status: 'draft', // Ensure default
      createdAt: now,
    };

    const [invoice] = await db.insert(invoices).values(insertData).returning();
    return invoice;
  }

  async getInvoices(status?: string): Promise<schema.Invoice[]> {
    // --- MODIFIED: Join patients and filter ---
    let query = db.select({ invoice: invoices })
        .from(invoices)
        .innerJoin(patients, and(
            eq(invoices.patientId, patients.patientId),
            eq(patients.isDeleted, 0) // Only invoices for non-deleted patients
        ));

    if (status) {
      query = query.where(eq(invoices.status, status as any));
    }
    const results = await query.orderBy(desc(invoices.createdAt));
    return results.map(r => r.invoice);
  }

  async getInvoiceById(invoiceId: string): Promise<schema.Invoice | null> {
    // --- MODIFIED: Join patients and filter ---
    const results = await db.select({ invoice: invoices })
        .from(invoices)
        .innerJoin(patients, and(
            eq(invoices.patientId, patients.patientId),
            eq(patients.isDeleted, 0)
        ))
        .where(eq(invoices.invoiceId, invoiceId));
    return results[0]?.invoice || null;
  }

  async generateInvoiceFromEncounter(encounterId: string, generatedBy: string): Promise<schema.Invoice> {
    // Get encounter and its order lines
    const encounter = await this.getEncounterById(encounterId); // Already checks patient deleted status
    if (!encounter) {
      throw new Error("Visit not found or belongs to a deleted patient");
    }

    const orderLinesData = await this.getOrderLinesByEncounter(encounterId);
    
    // Validate that visit has services
    if (!orderLinesData || orderLinesData.length === 0) {
      throw new Error("Cannot generate invoice: This visit has no services. Please add services before generating an invoice.");
    }

    // Calculate totals with validation
    const subtotal = orderLinesData.reduce((sum, line) => {
      const price = Number(line.totalPrice);
      if (isNaN(price)) {
        console.warn(`[Invoice] Invalid price for order line ${line.id}: ${line.totalPrice}`);
        return sum;
      }
      return sum + price;
    }, 0);
    
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

    // --- ADDED: Update encounter status after generating invoice ---
    await this.updateEncounter(encounterId, { status: 'ready_to_bill' });

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

  // Pharmacy Inventory - Drug Methods
  async createDrug(data: schema.InsertDrug): Promise<schema.Drug> {
    const drugCode = data.drugCode || await generateDrugCode();
    const now = new Date().toISOString();

    const insertData = {
      ...data,
      drugCode,
      isActive: data.isActive ?? 1, // Default to active (1 = true, 0 = false)
      createdAt: now,
      updatedAt: now,
    };

    const [drug] = await db.insert(drugs).values(insertData).returning();
    return drug;
  }

  async getDrugs(activeOnly = false): Promise<schema.Drug[]> {
    if (activeOnly) {
      return await db.select().from(drugs)
        .where(eq(drugs.isActive, 1))
        .orderBy(drugs.name);
    }
    return await db.select().from(drugs).orderBy(drugs.name);
  }

  async getDrugById(id: number): Promise<schema.Drug | null> {
    const [drug] = await db.select().from(drugs).where(eq(drugs.id, id));
    return drug || null;
  }

  async getDrugByCode(drugCode: string): Promise<schema.Drug | null> {
    const [drug] = await db.select().from(drugs).where(eq(drugs.drugCode, drugCode));
    return drug || null;
  }

  async updateDrug(id: number, data: Partial<schema.Drug>): Promise<schema.Drug> {
    const now = new Date().toISOString();
    const [updated] = await db.update(drugs)
      .set({ ...data, updatedAt: now })
      .where(eq(drugs.id, id))
      .returning();
    return updated;
  }

  // Pharmacy Inventory - Batch Methods
  async createDrugBatch(data: schema.InsertDrugBatch): Promise<schema.DrugBatch> {
    const batchId = await generateBatchId();
    const now = new Date().toISOString();

    const insertData = {
      ...data,
      batchId,
      createdAt: now,
    };

    const [batch] = await db.insert(drugBatches).values(insertData).returning();

    // Create ledger entry for receipt
    await this.createInventoryLedger({
      drugId: batch.drugId,
      batchId: batch.batchId,
      transactionType: 'receive',
      quantity: batch.quantityOnHand,
      quantityBefore: 0,
      quantityAfter: batch.quantityOnHand,
      unitCost: batch.unitCost,
      totalValue: batch.quantityOnHand * batch.unitCost,
      relatedType: 'supplier',
      relatedId: data.supplier || undefined,
      performedBy: batch.receivedBy,
      notes: `Initial stock receipt - Lot: ${batch.lotNumber}`,
    });

    return batch;
  }

  async getDrugBatches(drugId?: number): Promise<schema.DrugBatch[]> {
    if (drugId) {
      return await db.select().from(drugBatches)
        .where(eq(drugBatches.drugId, drugId))
        .orderBy(drugBatches.expiryDate);
    }
    return await db.select().from(drugBatches).orderBy(drugBatches.expiryDate);
  }

  async getDrugBatchById(batchId: string): Promise<schema.DrugBatch | null> {
    const [batch] = await db.select().from(drugBatches).where(eq(drugBatches.batchId, batchId));
    return batch || null;
  }

  async updateDrugBatch(batchId: string, data: Partial<schema.DrugBatch>): Promise<schema.DrugBatch> {
    const [updated] = await db.update(drugBatches)
      .set(data)
      .where(eq(drugBatches.batchId, batchId))
      .returning();
    return updated;
  }

  async getBatchesFEFO(drugId: number): Promise<schema.DrugBatch[]> {
    // First Expiry First Out - batches with stock, ordered by expiry date
    return await db.select().from(drugBatches)
      .where(and(
        eq(drugBatches.drugId, drugId),
        sql`${drugBatches.quantityOnHand} > 0` // Use sql helper for comparison
      ))
      .orderBy(drugBatches.expiryDate);
  }

  // Pharmacy Inventory - Ledger Methods
  async createInventoryLedger(data: schema.InsertInventoryLedger): Promise<schema.InventoryLedger> {
    const transactionId = await generateLedgerId();
    const now = new Date().toISOString();

    const insertData = {
      ...data,
      transactionId,
      createdAt: now,
    };

    const [ledgerEntry] = await db.insert(inventoryLedger).values(insertData).returning();
    return ledgerEntry;
  }

  async getInventoryLedger(drugId?: number, batchId?: string): Promise<(schema.InventoryLedger & { drugName: string; drugStrength: string | null })[]> {
    const conditions = [];
    if (drugId) conditions.push(eq(inventoryLedger.drugId, drugId));
    if (batchId) conditions.push(eq(inventoryLedger.batchId, batchId));

    if (conditions.length > 0) {
      return await db.select({
        ...inventoryLedger,
        drugName: drugs.name,
        drugStrength: drugs.strength,
      }).from(inventoryLedger)
        .leftJoin(drugs, eq(inventoryLedger.drugId, drugs.id))
        .where(and(...conditions))
        .orderBy(desc(inventoryLedger.createdAt));
    }

    return await db.select({
      ...inventoryLedger,
      drugName: drugs.name,
      drugStrength: drugs.strength,
    }).from(inventoryLedger)
      .leftJoin(drugs, eq(inventoryLedger.drugId, drugs.id))
      .orderBy(desc(inventoryLedger.createdAt));
  }

  // Pharmacy Inventory - Stock Query Methods
  async getDrugStockLevel(drugId: number): Promise<number> {
    const result = await db.select({ total: sql<number>`sum(${drugBatches.quantityOnHand})`.mapWith(Number) })
      .from(drugBatches)
      .where(eq(drugBatches.drugId, drugId));

    return result[0]?.total || 0;
  }

  async getAllDrugsWithStock(): Promise<(schema.Drug & { stockOnHand: number })[]> {
    const allDrugs = await db.select().from(drugs).where(eq(drugs.isActive, 1));
    const drugsWithStock: (schema.Drug & { stockOnHand: number })[] = [];

    for (const drug of allDrugs) {
      const stockLevel = await this.getDrugStockLevel(drug.id);
      drugsWithStock.push({ ...drug, stockOnHand: stockLevel });
    }

    return drugsWithStock;
  }

  async getLowStockDrugs(): Promise<(schema.Drug & { stockOnHand: number })[]> {
    const allDrugs = await db.select().from(drugs).where(eq(drugs.isActive, 1));
    const lowStockDrugs: (schema.Drug & { stockOnHand: number })[] = [];

    for (const drug of allDrugs) {
      const stockLevel = await this.getDrugStockLevel(drug.id);
      // Low stock means: stock is low but not zero (0 < stock <= reorderLevel)
      if (stockLevel > 0 && stockLevel <= drug.reorderLevel) {
        lowStockDrugs.push({ ...drug, stockOnHand: stockLevel });
      }
    }

    return lowStockDrugs;
  }

  async getExpiringSoonDrugs(daysThreshold = 90): Promise<(schema.DrugBatch & { drugName: string })[]> {
    // Use clinic timezone (Africa/Juba) for consistent date comparison
    const clinicToday = today('date');
    const thresholdDate = new Date(clinicToday);
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    // Format the threshold date in YYYY-MM-DD format for comparison with expiryDate field
    const thresholdStr = thresholdDate.toISOString().split('T')[0];

    const batches = await db.select()
      .from(drugBatches)
      .innerJoin(drugs, eq(drugBatches.drugId, drugs.id)) // Join to get drug name
      .where(and(
        sql`${drugBatches.expiryDate} <= ${thresholdStr}`,
        sql`${drugBatches.quantityOnHand} > 0` // Use sql helper
      ))
      .orderBy(drugBatches.expiryDate);

    // --- MODIFIED: Map result directly ---
    return batches.map(b => ({ ...b.drug_batches, drugName: b.drugs.name }));
  }

  // Pharmacy - Dispense Operations
  async dispenseDrug(orderId: string, batchId: string, quantity: number, dispensedBy: string): Promise<schema.PharmacyOrder> {
    // Get batch
    const batch = await this.getDrugBatchById(batchId);
    if (!batch) throw new Error("Batch not found");
    if (batch.quantityOnHand < quantity) throw new Error("Insufficient stock");

    // Update batch quantity
    const newQuantity = batch.quantityOnHand - quantity;
    await this.updateDrugBatch(batchId, { quantityOnHand: newQuantity });

    // Create ledger entry
    await this.createInventoryLedger({
      drugId: batch.drugId,
      batchId: batch.batchId,
      transactionType: 'dispense',
      quantity: -quantity,
      quantityBefore: batch.quantityOnHand,
      quantityAfter: newQuantity,
      unitCost: batch.unitCost,
      totalValue: -(quantity * batch.unitCost),
      relatedId: orderId,
      relatedType: 'pharmacy_order',
      performedBy: dispensedBy,
      notes: `Dispensed to patient - Order: ${orderId}`,
    });

    // Update pharmacy order
    const now = new Date().toISOString();
    const [order] = await db.update(pharmacyOrders)
      .set({
        status: 'dispensed',
        dispensedBy,
        dispensedAt: now
      })
      .where(eq(pharmacyOrders.orderId, orderId))
      .returning();

    return order;
  }

  async getPaidPrescriptions(): Promise<(schema.PharmacyOrder & { patient: schema.Patient })[]> {
    // --- MODIFIED: Join patients and filter ---
    const orders = await db.select({ order: pharmacyOrders, patient: patients })
      .from(pharmacyOrders)
      .innerJoin(patients, and(
          eq(pharmacyOrders.patientId, patients.patientId),
          eq(patients.isDeleted, 0)
      ))
      .where(and(
        eq(pharmacyOrders.status, 'prescribed'),
        eq(pharmacyOrders.paymentStatus, 'paid')
      ))
      .orderBy(desc(pharmacyOrders.createdAt));

    return orders.map(o => ({ ...o.order, patient: o.patient }));
  }

  async getUnpaidPrescriptions(): Promise<(schema.PharmacyOrder & { patient: schema.Patient })[]> {
    const orders = await db.select({ order: pharmacyOrders, patient: patients })
      .from(pharmacyOrders)
      .innerJoin(patients, and(
          eq(pharmacyOrders.patientId, patients.patientId),
          eq(patients.isDeleted, 0)
      ))
      .where(and(
        eq(pharmacyOrders.status, 'prescribed'),
        eq(pharmacyOrders.paymentStatus, 'unpaid')
      ))
      .orderBy(desc(pharmacyOrders.createdAt));

    return orders.map(o => ({ ...o.order, patient: o.patient }));
  }

  async getDispensedPrescriptions(): Promise<(schema.PharmacyOrder & { patient: schema.Patient })[]> {
     // --- MODIFIED: Join patients and filter ---
    const orders = await db.select({ order: pharmacyOrders, patient: patients })
      .from(pharmacyOrders)
      .innerJoin(patients, and(
          eq(pharmacyOrders.patientId, patients.patientId),
          eq(patients.isDeleted, 0)
      ))
      .where(eq(pharmacyOrders.status, 'dispensed'))
      .orderBy(desc(pharmacyOrders.dispensedAt)); // Order by dispensed time

    return orders.map(o => ({ ...o.order, patient: o.patient }));
  }

  async getPharmacyOrdersWithPatients(): Promise<(schema.PharmacyOrder & { patient: schema.Patient })[]> {
     // --- MODIFIED: Join patients and filter ---
    const orders = await db.select({ order: pharmacyOrders, patient: patients })
      .from(pharmacyOrders)
      .innerJoin(patients, and(
          eq(pharmacyOrders.patientId, patients.patientId),
          eq(patients.isDeleted, 0) // Only orders for active patients
      ))
      .orderBy(desc(pharmacyOrders.createdAt));

    return orders.map(o => ({ ...o.order, patient: o.patient }));
  }

  // Reports
  async getDiagnosisStats(fromDate?: string, toDate?: string): Promise<Array<{ diagnosis: string; count: number }>> {
    try {
      // Build the query to group by diagnosis and count occurrences
      const conditions = [];
      
      // Filter out empty/null diagnoses using Drizzle helpers for type safety
      conditions.push(isNotNull(treatments.diagnosis));
      conditions.push(ne(treatments.diagnosis, ''));
      // Also filter trimmed empty strings
      conditions.push(sql`TRIM(${treatments.diagnosis}) != ''`);
      
      // Apply date range filtering on visitDate if provided
      // Use visitDate for compatibility (clinicDay may not exist in older schemas)
      if (fromDate && toDate) {
        conditions.push(
          and(
            gte(treatments.visitDate, fromDate),
            lte(treatments.visitDate, toDate)
          )
        );
      } else if (fromDate) {
        conditions.push(gte(treatments.visitDate, fromDate));
      } else if (toDate) {
        conditions.push(lte(treatments.visitDate, toDate));
      }
      
      // Execute the query with GROUP BY and COUNT
      const results = await db
        .select({
          diagnosis: treatments.diagnosis,
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(treatments)
        .where(and(...conditions))
        .groupBy(treatments.diagnosis)
        .orderBy(desc(sql`count(*)`));
      
      // Return the results with proper typing
      // diagnosis is guaranteed to be non-null and non-empty due to WHERE clause
      // Using type assertion is safe here because of the filters above
      return results.map(r => ({
        diagnosis: r.diagnosis as string,
        count: r.count,
      }));
    } catch (error) {
      console.error("Error fetching diagnosis stats:", error);
      throw error;
    }
  }
}

// Initialize default services
async function seedDefaultServices() {
  try {
    const existingServices = await storage.getServices();
    if (existingServices.length === 0) {
      console.log("Seeding default services...");

      // Consultation services - Commented out to allow clinics to set their own pricing
      // Users should add consultation services manually through the UI to match clinic pricing
      // Example:
      // await storage.createService({
      //   code: "CONS-GEN",
      //   name: "General Consultation",
      //   category: "consultation",
      //   description: "Basic medical consultation and examination",
      //   price: 5000.00, // Set according to your clinic's pricing
      //   isActive: 1,
      // });
      //
      // await storage.createService({
      //   code: "CONS-FU",
      //   name: "Follow-up Consultation",
      //   category: "consultation",
      //   description: "Follow-up visit for existing patients",
      //   price: 2000.00, // Set according to your clinic's pricing
      //   isActive: 1,
      // });

      // Laboratory services
      await storage.createService({
        name: "Complete Blood Count (CBC)",
        category: "laboratory",
        description: "Full blood analysis including RBC, WBC, platelets",
        price: 25.00,
        isActive: 1,
      });

      await storage.createService({
        name: "Urine Analysis",
        category: "laboratory",
        description: "Complete urine examination",
        price: 15.00,
        isActive: 1,
      });

      await storage.createService({
        name: "Malaria Test",
        category: "laboratory",
        description: "Malaria parasite detection",
        price: 10.00,
        isActive: 1,
      });

      await storage.createService({
        name: "Stool Examination",
        category: "laboratory",
        description: "Stool analysis for parasites and infections",
        price: 15.00,
        isActive: 1,
      });

      // Radiology services
      await storage.createService({
        name: "Chest X-Ray",
        category: "radiology",
        description: "X-ray examination of chest and lungs",
        price: 40.00,
        isActive: 1,
      });

      await storage.createService({
        name: "Abdominal X-Ray",
        category: "radiology",
        description: "X-ray examination of abdomen",
        price: 45.00,
        isActive: 1,
      });

      await storage.createService({
        name: "Extremity X-Ray",
        category: "radiology",
        description: "X-ray of arms, legs, hands, or feet",
        price: 35.00,
        isActive: 1,
      });

      // Ultrasound services
      await storage.createService({
        name: "Abdominal Ultrasound",
        category: "ultrasound",
        description: "Ultrasound examination of abdominal organs",
        price: 60.00,
        isActive: 1,
      });

      await storage.createService({
        name: "Pelvic Ultrasound",
        category: "ultrasound",
        description: "Ultrasound examination of pelvic organs",
        price: 55.00,
        isActive: 1,
      });

      await storage.createService({
        name: "Obstetric Ultrasound",
        category: "ultrasound",
        description: "Pregnancy monitoring ultrasound",
        price: 65.00,
        isActive: 1,
      });

      // Pharmacy services
      await storage.createService({
        code: "PHARM-PARACETAMOL",
        name: "Paracetamol 500mg",
        category: "pharmacy",
        description: "Pain reliever and fever reducer",
        price: 5.00,
        isActive: 1,
      });

      await storage.createService({
        code: "PHARM-AMOXICILLIN",
        name: "Amoxicillin 250mg",
        category: "pharmacy",
        description: "Antibiotic for bacterial infections",
        price: 15.00,
        isActive: 1,
      });

      await storage.createService({
        code: "PHARM-IBUPROFEN",
        name: "Ibuprofen 400mg",
        category: "pharmacy",
        description: "Anti-inflammatory and pain reliever",
        price: 8.00,
        isActive: 1,
      });

      await storage.createService({
        code: "PHARM-ORS",
        name: "ORS (Oral Rehydration Salts)",
        category: "pharmacy",
        description: "For dehydration treatment",
        price: 3.00,
        isActive: 1,
      });

      await storage.createService({
        code: "PHARM-DISPENSE",
        name: "Pharmacy Dispensing",
        category: "pharmacy",
        description: "General pharmacy medication dispensing fee",
        price: 5.00, // Example fee
        isActive: 1,
      });


      console.log("✓ Default services seeded successfully");
    }
  } catch (error) {
    console.log("Error seeding default services:", error);
  }
}

// Initialize default admin user if none exists
async function seedDefaultAdminUser() {
  try {
    const existingUsers = await storage.getAllUsers();
    if (existingUsers.length === 0) {
      console.log("No users found. Creating default test users for all roles...");
      
      // Create default admin: username=admin, password=admin123
      await storage.createUser({
        username: "admin",
        password: "admin123", // Will be hashed by createUser
        fullName: "Administrator",
        role: "admin",
      });
      
      // Create doctor user
      await storage.createUser({
        username: "doctor",
        password: "doctor123",
        fullName: "Dr. James Malual",
        role: "doctor",
      });
      
      // Create lab technician user
      await storage.createUser({
        username: "lab",
        password: "lab123",
        fullName: "Sarah Johnson - Lab Tech",
        role: "lab",
      });
      
      // Create radiology technician user
      await storage.createUser({
        username: "radiology",
        password: "radio123",
        fullName: "Michael Deng - Radiology Tech",
        role: "radiology",
      });
      
      console.log("✓ Default test users created successfully:");
      console.log("  Admin:     username=admin, password=admin123");
      console.log("  Doctor:    username=doctor, password=doctor123");
      console.log("  Lab:       username=lab, password=lab123");
      console.log("  Radiology: username=radiology, password=radio123");
    }
  } catch (error) {
    console.log("Error seeding default admin user:", error);
  }
}

export const storage = new MemStorage();

// Initialize defaults on startup
setTimeout(() => {
  seedDefaultAdminUser();
  seedDefaultServices();
}, 100); // Delay slightly to ensure DB connection is ready
