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

  findings: text("findings"),
  impression: text("impression"),
  recommendations: text("recommendations"),
  reportStatus: text("report_status").$type<"normal" | "abnormal" | "urgent">(),
  reportDate: text("report_date"),
  sonographer: text("sonographer"),
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

  createdAt: true,
});

export const insertXrayExamSchema = createInsertSchema(xrayExams).omit({
  id: true,
  examId: true,
  status: true,

  createdAt: true,
});

export const insertUltrasoundExamSchema = createInsertSchema(ultrasoundExams).omit({
  id: true,
  examId: true,
  status: true,

  createdAt: true,
});


export const insertPharmacyOrderSchema = createInsertSchema(pharmacyOrders).omit({
  id: true,
  orderId: true,
  status: true,

  createdAt: true,
});

// Types
export type Patient = typeof patients.$inferSelect;
export type Treatment = typeof treatments.$inferSelect;
export type LabTest = typeof labTests.$inferSelect;
export type XrayExam = typeof xrayExams.$inferSelect;
export type UltrasoundExam = typeof ultrasoundExams.$inferSelect;
export type PharmacyOrder = typeof pharmacyOrders.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertTreatment = z.infer<typeof insertTreatmentSchema>;
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type InsertXrayExam = z.infer<typeof insertXrayExamSchema>;
export type InsertUltrasoundExam = z.infer<typeof insertUltrasoundExamSchema>;
export type InsertPharmacyOrder = z.infer<typeof insertPharmacyOrderSchema>;
