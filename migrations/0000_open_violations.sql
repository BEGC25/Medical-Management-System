CREATE TABLE "lab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"category" text NOT NULL,
	"tests" text NOT NULL,
	"clinical_info" text,
	"priority" text NOT NULL,
	"requested_date" text NOT NULL,
	"status" text NOT NULL,
	"results" text,
	"normal_values" text,
	"result_status" text,
	"completed_date" text,
	"technician_notes" text,
	"created_at" text NOT NULL,
	CONSTRAINT "lab_tests_test_id_unique" UNIQUE("test_id")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" text,
	"gender" text,
	"phone_number" text,
	"village" text,
	"emergency_contact" text,
	"allergies" text,
	"medical_history" text,
	"created_at" text NOT NULL,
	CONSTRAINT "patients_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "treatments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"visit_date" text NOT NULL,
	"visit_type" text NOT NULL,
	"priority" text NOT NULL,
	"chief_complaint" text,
	"temperature" real,
	"blood_pressure" text,
	"heart_rate" integer,
	"weight" real,
	"examination" text,
	"diagnosis" text,
	"treatment_plan" text,
	"follow_up_date" text,
	"follow_up_type" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xray_exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"exam_type" text NOT NULL,
	"body_part" text,
	"clinical_indication" text,
	"special_instructions" text,
	"priority" text NOT NULL,
	"requested_date" text NOT NULL,
	"status" text NOT NULL,
	"technical_quality" text,
	"findings" text,
	"impression" text,
	"recommendations" text,
	"report_status" text,
	"report_date" text,
	"radiologist" text,
	"created_at" text NOT NULL,
	CONSTRAINT "xray_exams_exam_id_unique" UNIQUE("exam_id")
);
