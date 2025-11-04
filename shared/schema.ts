import { integer, text, sqliteTable, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role").$type<"admin" | "reception" | "doctor" | "lab" | "radiology" | "pharmacy">().notNull().default("reception"),
  createdAt: text("created_at").notNull().default(sql`datetime('now')`),
});

export const patients = sqliteTable("patients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: text("patient_id").unique().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  age: text("age"),
  gender: text("gender").$type<"Male" | "Female">(),
  phoneNumber: text("phone_number"),
  village: text("village"),
  emergencyContact: text("emergency_contact"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  isDeleted: integer("is_deleted").notNull().default(0),
  deletedAt: text("deleted_at"),
  deletedBy: text("deleted_by"),
  deletionReason: text("deletion_reason"),
  createdAt: text("created_at").notNull().default(sql`datetime('now')`),
});

export const treatments = sqliteTable("treatments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  treatmentId: text("treatment_id").unique().notNull(),
  encounterId: text("encounter_id"),
  patientId: text("patient_id").notNull(),
  visitDate: text("visit_date").notNull(),
  visitType: text("visit_type").$type<"consultation" | "follow-up" | "emergency" | "preventive">().notNull(),
  priority: text("priority").$type<"routine" | "urgent" | "emergency">().notNull(),
  chiefComplaint: text("chief_complaint"),
  temperature: real("temperature"),
  bloodPressure: text("blood_pressure"),
  heartRate: integer("heart_rate"),
  weight: real("weight"),
  examination: text("examination"),
  diagnosis: text("diagnosis"),
  treatmentPlan: text("treatment_plan"),
  followUpDate: text("follow_up_date"),
  followUpType: text("follow_up_type"),
  createdAt: text("created_at").notNull(),
});

export const labTests = sqliteTable("lab_tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testId: text("test_id").unique().notNull(),
  patientId: text("patient_id").notNull(),
  category: text("category").$type<"blood" | "urine" | "stool" | "microbiology" | "chemistry" | "hormonal" | "other">().notNull(),
  tests: text("tests").notNull(), // JSON array of test names
  clinicalInfo: text("clinical_info"),
  priority: text("priority").$type<"routine" | "urgent" | "stat">().notNull(),
  requestedDate: text("requested_date").notNull(),
  status: text("status").$type<"pending" | "completed" | "cancelled">().notNull(),
  paymentStatus: text("payment_status").$type<"unpaid" | "paid">().notNull().default("unpaid"),
  results: text("results"),
  normalValues: text("normal_values"),
  resultStatus: text("result_status").$type<"normal" | "abnormal" | "critical">(),
  completedDate: text("completed_date"),
  technicianNotes: text("technician_notes"),
  attachments: text("attachments"), // JSON array of {url: string, name: string, type: string}
  createdAt: text("created_at").notNull(),
});

export const xrayExams = sqliteTable("xray_exams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  examId: text("exam_id").unique().notNull(),
  patientId: text("patient_id").notNull(),
  examType: text("exam_type").$type<"chest" | "abdomen" | "spine" | "extremities" | "pelvis" | "skull">().notNull(),
  bodyPart: text("body_part"),
  clinicalIndication: text("clinical_indication"),
  specialInstructions: text("special_instructions"),
  requestedDate: text("requested_date").notNull(),
  status: text("status").$type<"pending" | "completed" | "cancelled">().notNull(),
  paymentStatus: text("payment_status").$type<"unpaid" | "paid">().notNull().default("unpaid"),
  findings: text("findings"),
  impression: text("impression"),
  recommendations: text("recommendations"),
  reportDate: text("report_date"),
  radiologist: text("radiologist"),
  createdAt: text("created_at").notNull(),
});

export const ultrasoundExams = sqliteTable("ultrasound_exams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  examId: text("exam_id").unique().notNull(),
  patientId: text("patient_id").notNull(),
  examType: text("exam_type").$type<"abdominal" | "pelvic" | "obstetric" | "cardiac" | "vascular" | "thyroid" | "renal" | "hepatobiliary" | "gynecological" | "urological" | "pediatric" | "musculoskeletal" | "breast" | "scrotal" | "carotid" | "other">().notNull(),
  clinicalIndication: text("clinical_indication"),
  specialInstructions: text("special_instructions"),
  requestedDate: text("requested_date").notNull(),
  status: text("status").$type<"pending" | "completed" | "cancelled">().notNull(),
  paymentStatus: text("payment_status").$type<"unpaid" | "paid">().notNull().default("unpaid"),
  findings: text("findings"),
  impression: text("impression"),
  recommendations: text("recommendations"),
  reportStatus: text("report_status").$type<"normal" | "abnormal" | "urgent">(),
  reportDate: text("report_date"),
  sonographer: text("sonographer"),
  createdAt: text("created_at").notNull(),
});

// Billing Settings Table
export const billingSettings = sqliteTable("billing_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  consultationFee: real("consultation_fee").notNull().default(2000.00),
  requirePrepayment: integer("require_prepayment").notNull().default(0),
  allowEmergencyGrace: integer("allow_emergency_grace").notNull().default(1),
  currency: text("currency").notNull().default("SSP"),
  updatedBy: text("updated_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Payment System Tables
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").unique(), // Service code for easy reference
  name: text("name").notNull(),
  category: text("category").$type<"consultation" | "laboratory" | "radiology" | "ultrasound" | "pharmacy" | "procedure">().notNull(),
  description: text("description"),
  price: real("price").notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

// Encounters - Patient's "cart" for this visit
export const encounters = sqliteTable("encounters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  encounterId: text("encounter_id").unique().notNull(),
  patientId: text("patient_id").notNull(),  
  visitDate: text("visit_date").notNull(),
  status: text("status").$type<"open" | "ready_to_bill" | "closed">().notNull().default("open"),
  policy: text("policy").$type<"cash" | "insurance">().notNull().default("cash"),
  attendingClinician: text("attending_clinician"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  closedAt: text("closed_at"),
});

// Results Routing - Track diagnostic results routing to doctors
export const resultsRouting = sqliteTable("results_routing", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  encounterId: text("encounter_id").notNull(),
  patientId: text("patient_id").notNull(),
  routedBy: text("routed_by"),
  routedAt: text("routed_at"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  status: text("status").$type<"pending" | "routed" | "reviewed">().notNull().default("pending"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`datetime('now')`),
});

// Order Lines - What was ordered in this encounter
export const orderLines = sqliteTable("order_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  encounterId: text("encounter_id").notNull(),
  serviceId: integer("service_id").notNull(),
  relatedId: text("related_id"), // ID of lab test, x-ray, ultrasound, etc.
  relatedType: text("related_type").$type<"consultation" | "lab_test" | "xray_exam" | "ultrasound_exam" | "pharmacy_order" | "procedure">(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceSnapshot: real("unit_price_snapshot").notNull(), // Price at time of order
  totalPrice: real("total_price").notNull(),
  department: text("department").$type<"consultation" | "laboratory" | "radiology" | "ultrasound" | "pharmacy">(),
  status: text("status").$type<"requested" | "authorized" | "performed" | "canceled">().notNull().default("requested"),
  orderedBy: text("ordered_by"), // Who ordered this service
  acknowledgedBy: text("acknowledged_by"), // Clinician who acknowledged the result
  acknowledgedAt: text("acknowledged_at"), // When result was acknowledged
  addToCart: integer("add_to_cart").notNull().default(0), // Whether to add to cart (1=yes, 0=no)
  createdAt: text("created_at").notNull(),
});

// Invoices - Billing documents generated from encounters
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: text("invoice_id").unique().notNull(),
  encounterId: text("encounter_id").notNull(),
  patientId: text("patient_id").notNull(),
  subtotal: real("subtotal").notNull(),
  discount: real("discount").notNull().default(0),
  tax: real("tax").notNull().default(0),
  grandTotal: real("grand_total").notNull(),
  status: text("status").$type<"draft" | "posted" | "void">().notNull().default("draft"),
  generatedBy: text("generated_by").notNull(),
  createdAt: text("created_at").notNull(),
  postedAt: text("posted_at"),
  voidedAt: text("voided_at"),
});

// Invoice Lines - Mirror of order lines for billing
export const invoiceLines = sqliteTable("invoice_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: text("invoice_id").notNull(),
  orderLineId: integer("order_line_id").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  createdAt: text("created_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paymentId: text("payment_id").unique().notNull(),
  patientId: text("patient_id").notNull(),
  totalAmount: real("total_amount").notNull(),
  paymentMethod: text("payment_method").$type<"cash" | "mobile_money" | "bank_transfer">().notNull(),
  paymentDate: text("payment_date").notNull(),
  receivedBy: text("received_by").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const paymentItems = sqliteTable("payment_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paymentId: text("payment_id").notNull(),
  orderLineId: integer("order_line_id"), // Link to order line for new payment system
  serviceId: integer("service_id").notNull(),
  relatedId: text("related_id"), // ID of lab test, x-ray, or ultrasound
  relatedType: text("related_type").$type<"consultation" | "lab_test" | "lab_test_item" | "xray_exam" | "ultrasound_exam">(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  amount: real("amount").notNull(), // Amount paid for this specific item
  createdAt: text("created_at").notNull(),
});

export const pharmacyOrders = sqliteTable("pharmacy_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").unique().notNull(),
  patientId: text("patient_id").notNull(),
  treatmentId: text("treatment_id"),
  encounterId: text("encounter_id"), // Link to encounter
  serviceId: integer("service_id").notNull(),
  drugId: integer("drug_id"), // Link to drug from inventory
  drugName: text("drug_name"), // Drug name for display
  dosage: text("dosage"),
  quantity: integer("quantity").notNull().default(1),
  instructions: text("instructions"), // Prescription instructions
  status: text("status").$type<"prescribed" | "dispensed" | "cancelled">().notNull().default("prescribed"),
  paymentStatus: text("payment_status").$type<"unpaid" | "paid">().notNull().default("unpaid"),
  dispensedBy: text("dispensed_by"),
  dispensedAt: text("dispensed_at"),
  createdAt: text("created_at").notNull().default(sql`datetime('now')`),
});

// Drug Catalog - Master list of drugs
export const drugs = sqliteTable("drugs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  drugCode: text("drug_code").unique(), // SKU or drug code (auto-generated if not provided)
  name: text("name").notNull(),
  genericName: text("generic_name"),
  strength: text("strength"), // e.g., "500mg", "10mg/ml"
  form: text("form").$type<"tablet" | "capsule" | "syrup" | "injection" | "cream" | "ointment" | "drops" | "inhaler" | "other">().notNull(),
  manufacturer: text("manufacturer"),
  defaultPrice: real("default_price"), // Optional - prices are set per batch when receiving stock
  reorderLevel: integer("reorder_level").notNull().default(10), // Alert when stock falls below this
  isActive: integer("is_active").notNull().default(1), // 1 = active, 0 = discontinued
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`datetime('now')`),
  updatedAt: text("updated_at").notNull().default(sql`datetime('now')`),
});

// Drug Batches - Track individual batches/lots with expiry
export const drugBatches = sqliteTable("drug_batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  batchId: text("batch_id").unique().notNull(),
  drugId: integer("drug_id").notNull(), // References drugs.id
  lotNumber: text("lot_number"), // Optional - not all drugs have lot numbers
  expiryDate: text("expiry_date").notNull(), // ISO date
  quantityOnHand: integer("quantity_on_hand").notNull().default(0),
  unitsPerCarton: integer("units_per_carton"), // How many units in a carton/box
  cartonsReceived: integer("cartons_received"), // Number of cartons purchased
  unitCost: real("unit_cost").notNull(), // Cost per unit for this batch
  location: text("location"), // Storage location (e.g., "Shelf A", "Refrigerator")
  receivedAt: text("received_at").notNull(), // Date stock was received
  receivedBy: text("received_by").notNull(),
  supplier: text("supplier"), // Supplier name
  createdAt: text("created_at").notNull().default(sql`datetime('now')`),
});

// Inventory Ledger - Complete transaction history
export const inventoryLedger = sqliteTable("inventory_ledger", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: text("transaction_id").unique().notNull(),
  drugId: integer("drug_id").notNull(),
  batchId: text("batch_id"), // References drugBatches.batchId (null for general adjustments)
  transactionType: text("transaction_type").$type<"receive" | "dispense" | "adjust" | "return" | "expire" | "damage">().notNull(),
  quantity: integer("quantity").notNull(), // Positive for receive, negative for dispense/adjust out
  quantityBefore: integer("quantity_before").notNull(), // Stock before transaction
  quantityAfter: integer("quantity_after").notNull(), // Stock after transaction
  unitCost: real("unit_cost"), // Cost per unit
  totalValue: real("total_value"), // quantity * unitCost
  relatedId: text("related_id"), // pharmacyOrder.orderId, patientId, etc.
  relatedType: text("related_type").$type<"pharmacy_order" | "patient" | "supplier" | "internal">(),
  notes: text("notes"),
  performedBy: text("performed_by").notNull(), // User who made the transaction
  createdAt: text("created_at").notNull().default(sql`datetime('now')`),
});

// Deletion Audit Log - Track all patient deletions for compliance
export const deletionAuditLog = sqliteTable("deletion_audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: text("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  deletedBy: text("deleted_by").notNull(),
  deletionReason: text("deletion_reason"),
  impactSummary: text("impact_summary"), // JSON: {encounters: 2, labTests: 5, payments: 1, etc.}
  hadPaymentHistory: integer("had_payment_history").notNull(),
  deletedAt: text("deleted_at").notNull().default(sql`datetime('now')`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  patientId: true,
  isDeleted: true,
  deletedAt: true,
  deletedBy: true,
  deletionReason: true,
  createdAt: true,
});

export const insertTreatmentSchema = createInsertSchema(treatments).omit({
  id: true,
  treatmentId: true,
  createdAt: true,
});

export const insertLabTestSchema = createInsertSchema(labTests).omit({
  id: true,
  testId: true,
  status: true,
  paymentStatus: true,
  createdAt: true,
});

export const insertXrayExamSchema = createInsertSchema(xrayExams).omit({
  id: true,
  examId: true,
  status: true,
  paymentStatus: true,
  createdAt: true,
});

export const insertUltrasoundExamSchema = createInsertSchema(ultrasoundExams).omit({
  id: true,
  examId: true,
  status: true,
  paymentStatus: true,
  createdAt: true,
});

export const insertBillingSettingsSchema = createInsertSchema(billingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertEncounterSchema = createInsertSchema(encounters).omit({
  id: true,
  encounterId: true,
  status: true,
  createdAt: true,
  closedAt: true,
});

export const insertResultsRoutingSchema = createInsertSchema(resultsRouting).omit({
  id: true,
  createdAt: true,
});

export const insertOrderLineSchema = createInsertSchema(orderLines).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceId: true,
  status: true,
  createdAt: true,
  postedAt: true,
  voidedAt: true,
});

export const insertInvoiceLineSchema = createInsertSchema(invoiceLines).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  paymentId: true,
  createdAt: true,
});

export const insertPaymentItemSchema = createInsertSchema(paymentItems).omit({
  id: true,
  createdAt: true,
});

export const insertPharmacyOrderSchema = createInsertSchema(pharmacyOrders).omit({
  id: true,
  orderId: true,
  status: true,
  paymentStatus: true,
  createdAt: true,
});

export const insertDrugSchema = createInsertSchema(drugs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  drugCode: z.string().optional(), // Auto-generated if not provided
  defaultPrice: z.number().optional(), // Prices are set per batch
  category: z.string().optional(), // Added from frontend
  unitOfMeasure: z.string().optional(), // Added from frontend
});

export const insertDrugBatchSchema = createInsertSchema(drugBatches).omit({
  id: true,
  batchId: true,
  createdAt: true,
}).extend({
  lotNumber: z.string().optional(), // Optional lot number
  unitsPerCarton: z.number().optional(), // Optional bulk quantity
  cartonsReceived: z.number().optional(), // Optional carton count
  supplier: z.string().optional(), // Optional supplier name
});

export const insertInventoryLedgerSchema = createInsertSchema(inventoryLedger).omit({
  id: true,
  transactionId: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, "password">;
export type Patient = typeof patients.$inferSelect;
export type Treatment = typeof treatments.$inferSelect;
export type LabTest = typeof labTests.$inferSelect;
export type XrayExam = typeof xrayExams.$inferSelect;
export type UltrasoundExam = typeof ultrasoundExams.$inferSelect;
export type BillingSettings = typeof billingSettings.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Encounter = typeof encounters.$inferSelect;
export type ResultsRouting = typeof resultsRouting.$inferSelect;
export type OrderLine = typeof orderLines.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PaymentItem = typeof paymentItems.$inferSelect;
export type PharmacyOrder = typeof pharmacyOrders.$inferSelect;
export type Drug = typeof drugs.$inferSelect;
export type DrugBatch = typeof drugBatches.$inferSelect;
export type InventoryLedger = typeof inventoryLedger.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type InsertXrayExam = z.infer<typeof insertXrayExamSchema>;
export type InsertUltrasoundExam = z.infer<typeof insertUltrasoundExamSchema>;
export type InsertBillingSettings = z.infer<typeof insertBillingSettingsSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertEncounter = z.infer<typeof insertEncounterSchema>;
export type InsertResultsRouting = z.infer<typeof insertResultsRoutingSchema>;
export type InsertOrderLine = z.infer<typeof insertOrderLineSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertPaymentItem = z.infer<typeof insertPaymentItemSchema>;
export type InsertPharmacyOrder = z.infer<typeof insertPharmacyOrderSchema>;
export type InsertDrug = z.infer<typeof insertDrugSchema>;
export type InsertDrugBatch = z.infer<typeof insertDrugBatchSchema>;
export type InsertInventoryLedger = z.infer<typeof insertInventoryLedgerSchema>;
