import { serial, text, pgTable, real, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").unique().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  age: text("age"),
  gender: text("gender").$type<"male" | "female" | "other">(),
  phoneNumber: text("phone_number"),
  village: text("village"),
  emergencyContact: text("emergency_contact"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const treatments = pgTable("treatments", {
  id: serial("id").primaryKey(),
  treatmentId: text("treatment_id").unique().notNull(),
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

export const labTests = pgTable("lab_tests", {
  id: serial("id").primaryKey(),
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

export const xrayExams = pgTable("xray_exams", {
  id: serial("id").primaryKey(),
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

export const ultrasoundExams = pgTable("ultrasound_exams", {
  id: serial("id").primaryKey(),
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
export const billingSettings = pgTable("billing_settings", {
  id: serial("id").primaryKey(),
  consultationFee: real("consultation_fee").notNull().default(2000.00),
  requirePrepayment: boolean("require_prepayment").notNull().default(false),
  allowEmergencyGrace: boolean("allow_emergency_grace").notNull().default(true),
  currency: text("currency").notNull().default("SSP"),
  updatedBy: text("updated_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Payment System Tables
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  code: text("code").unique(), // Service code for easy reference
  name: text("name").notNull(),
  category: text("category").$type<"consultation" | "laboratory" | "radiology" | "ultrasound" | "pharmacy" | "procedure">().notNull(),
  description: text("description"),
  price: real("price").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
});

// Encounters - Patient's "cart" for this visit
export const encounters = pgTable("encounters", {
  id: serial("id").primaryKey(),
  encounterId: text("encounter_id").unique().notNull(),
  patientId: text("patient_id").notNull(),  
  visitDate: text("visit_date").notNull(),
  status: text("status").$type<"open" | "closed">().notNull().default("open"),
  policy: text("policy").$type<"cash" | "insurance">().notNull().default("cash"),
  attendingClinician: text("attending_clinician"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  closedAt: text("closed_at"),
});

// Order Lines - What was ordered in this encounter
export const orderLines = pgTable("order_lines", {
  id: serial("id").primaryKey(),
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
  createdAt: text("created_at").notNull(),
});

// Invoices - Billing documents generated from encounters
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
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
export const invoiceLines = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: text("invoice_id").notNull(),
  orderLineId: integer("order_line_id").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  createdAt: text("created_at").notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  paymentId: text("payment_id").unique().notNull(),
  patientId: text("patient_id").notNull(),
  totalAmount: real("total_amount").notNull(),
  paymentMethod: text("payment_method").$type<"cash" | "mobile_money" | "bank_transfer">().notNull(),
  paymentDate: text("payment_date").notNull(),
  receivedBy: text("received_by").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const paymentItems = pgTable("payment_items", {
  id: serial("id").primaryKey(),
  paymentId: text("payment_id").notNull(),
  serviceId: integer("service_id").notNull(),
  relatedId: text("related_id"), // ID of lab test, x-ray, or ultrasound
  relatedType: text("related_type").$type<"consultation" | "lab_test" | "xray_exam" | "ultrasound_exam">(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  createdAt: text("created_at").notNull(),
});

export const pharmacyOrders = pgTable("pharmacy_orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").unique().notNull(),
  patientId: text("patient_id").notNull(),
  treatmentId: text("treatment_id"),
  serviceId: integer("service_id").notNull(),
  dosage: text("dosage"),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").$type<"prescribed" | "dispensed">().notNull().default("prescribed"),
  paymentStatus: text("payment_status").$type<"unpaid" | "paid">().notNull().default("unpaid"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  patientId: true,
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

// Types
export type Patient = typeof patients.$inferSelect;
export type Treatment = typeof treatments.$inferSelect;
export type LabTest = typeof labTests.$inferSelect;
export type XrayExam = typeof xrayExams.$inferSelect;
export type UltrasoundExam = typeof ultrasoundExams.$inferSelect;
export type BillingSettings = typeof billingSettings.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Encounter = typeof encounters.$inferSelect;
export type OrderLine = typeof orderLines.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PaymentItem = typeof paymentItems.$inferSelect;
export type PharmacyOrder = typeof pharmacyOrders.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type InsertXrayExam = z.infer<typeof insertXrayExamSchema>;
export type InsertUltrasoundExam = z.infer<typeof insertUltrasoundExamSchema>;
export type InsertBillingSettings = z.infer<typeof insertBillingSettingsSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertEncounter = z.infer<typeof insertEncounterSchema>;
export type InsertOrderLine = z.infer<typeof insertOrderLineSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertPaymentItem = z.infer<typeof insertPaymentItemSchema>;
export type InsertPharmacyOrder = z.infer<typeof insertPharmacyOrderSchema>;
