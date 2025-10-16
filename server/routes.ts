import express from "express";
import { z } from "zod";
import { storage } from "./storage";
import {
  insertPatientSchema,
  insertTreatmentSchema,
  insertLabTestSchema,
  insertXrayExamSchema,
  insertUltrasoundExamSchema,
  insertPharmacyOrderSchema,
  insertBillingSettingsSchema,
  insertEncounterSchema,
  insertOrderLineSchema,
  insertInvoiceSchema,
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Users - Admin only
router.get("/api/users", requireAdmin, async (_req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error in users route:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Patient Counts
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

// Patients
router.get("/api/patients", async (req, res) => {
  try {
    const search = req.query.search as string;
    const today = req.query.today;
    const date = req.query.date as string;
    const withStatus = req.query.withStatus === "true";

    if (withStatus) {
      if (today === "true" || search === "today") {
        const patients = await storage.getTodaysPatientsWithStatus();
        res.json(patients);
      } else if (date) {
        const patients = await storage.getPatientsByDateWithStatus(date);
        res.json(patients);
      } else {
        const patients = await storage.getPatientsWithStatus(search);
        res.json(patients);
      }
    } else {
      if (today === "true" || search === "today") {
        const patients = await storage.getTodaysPatients();
        res.json(patients);
      } else if (date) {
        const patients = await storage.getPatientsByDate(date);
        res.json(patients);
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

router.get("/api/patients/:patientId", async (req, res) => {
  try {
    const patient = await storage.getPatientByPatientId(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch {
    res.status(500).json({ error: "Failed to fetch patient" });
  }
});

router.post("/api/patients", async (req, res) => {
  try {
    const data = insertPatientSchema.parse(req.body);
    const patient = await storage.createPatient(data);
    res.status(201).json(patient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid patient data", details: error.errors });
    }
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

router.delete("/api/patients/:patientId", async (req, res) => {
  try {
    const success = await storage.deletePatient(req.params.patientId);
    if (success) {
      res.json({ message: "Patient deleted successfully" });
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  } catch {
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

// Treatments
router.get("/api/treatments", async (req, res) => {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;
    const today = req.query.today;

    if (today === "true" || req.path.includes("today")) {
      const treatments = await storage.getTodaysTreatments();
      res.json(treatments);
    } else {
      const treatments = await storage.getTreatments(limit);
      res.json(treatments);
    }
  } catch {
    res.status(500).json({ error: "Failed to fetch treatments" });
  }
});

router.get("/api/patients/:patientId/treatments", async (req, res) => {
  try {
    const treatments = await storage.getTreatmentsByPatient(
      req.params.patientId
    );
    res.json(treatments);
  } catch {
    res.status(500).json({ error: "Failed to fetch treatments" });
  }
});

router.post("/api/treatments", async (req, res) => {
  try {
    console.log("Creating treatment with data:", req.body);
    const data = insertTreatmentSchema.parse(req.body);
    const treatment = await storage.createTreatment(data);
    res.status(201).json(treatment);
  } catch (error) {
    console.error("Error creating treatment:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid treatment data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create treatment" });
  }
});

// Lab Tests
router.get("/api/lab-tests", async (req, res) => {
  try {
    const status = req.query.status as string;
    const date = req.query.date as string;
    const labTests = await storage.getLabTests(status, date);
    res.json(labTests);
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    res.status(500).json({
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
    res.status(500).json({
      error:
        "Failed to fetch patient lab tests - Please verify the patient ID and try again",
    });
  }
});

router.post("/api/lab-tests", async (req, res) => {
  try {
    console.log("Creating lab test with data:", req.body);
    const data = insertLabTestSchema.parse(req.body);
    const labTest = await storage.createLabTest(data);
    res.status(201).json(labTest);
  } catch (error) {
    console.error("Error creating lab test:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid lab test data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create lab test" });
  }
});

router.put("/api/lab-tests/:testId", async (req, res) => {
  try {
    const data = req.body;
    const labTest = await storage.updateLabTest(req.params.testId, data);
    res.json(labTest);
  } catch {
    res.status(500).json({ error: "Failed to update lab test" });
  }
});

// X-Ray Exams
router.get("/api/xray-exams", async (req, res) => {
  try {
    const status = req.query.status as string;
    const date = req.query.date as string;
    const xrayExams = await storage.getXrayExams(status, date);
    res.json(xrayExams);
  } catch (error) {
    console.error("Error fetching X-ray exams:", error);
    res.status(500).json({
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
    res.status(500).json({
      error:
        "Failed to fetch patient X-ray exams - Please verify the patient ID and try again",
    });
  }
});

router.post("/api/xray-exams", async (req, res) => {
  try {
    const data = insertXrayExamSchema.parse(req.body);
    const xrayExam = await storage.createXrayExam(data);
    res.status(201).json(xrayExam);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid X-ray exam data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create X-ray exam" });
  }
});

router.put("/api/xray-exams/:examId", async (req, res) => {
  try {
    const data = req.body;
    const xrayExam = await storage.updateXrayExam(req.params.examId, data);
    res.json(xrayExam);
  } catch {
    res.status(500).json({ error: "Failed to update X-ray exam" });
  }
});

// Ultrasound Exams
router.get("/api/ultrasound-exams", async (_req, res) => {
  try {
    const ultrasoundExams = await storage.getUltrasoundExams();
    res.json(ultrasoundExams);
  } catch (error) {
    console.error("Error fetching ultrasound exams:", error);
    res.status(500).json({ error: "Failed to fetch ultrasound exams - Please check your connection and try again" });
  }
});

router.get("/api/patients/:patientId/ultrasound-exams", async (req, res) => {
  try {
    const ultrasoundExams = await storage.getUltrasoundExamsByPatient(
      req.params.patientId
    );
    res.json(ultrasoundExams);
  } catch {
    res.status(500).json({ error: "Failed to fetch ultrasound exams" });
  }
});

router.post("/api/ultrasound-exams", async (req, res) => {
  try {
    const data = insertUltrasoundExamSchema.parse(req.body);
    const ultrasoundExam = await storage.createUltrasoundExam(data);
    res.status(201).json(ultrasoundExam);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid ultrasound exam data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create ultrasound exam" });
  }
});

router.put("/api/ultrasound-exams/:examId", async (req, res) => {
  try {
    const data = req.body;
    const ultrasoundExam = await storage.updateUltrasoundExam(
      req.params.examId,
      data
    );
    res.json(ultrasoundExam);
  } catch {
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
  } catch {
    res.status(500).json({ error: "Failed to delete ultrasound exam" });
  }
});

// Dashboard
router.get("/api/dashboard/stats", async (_req, res) => {
  try {
    console.log("Dashboard stats route called");
    const stats = await storage.getDashboardStats();
    console.log("Dashboard stats result:", stats);
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats route error:", error);
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
        error: "Failed to fetch recent patients",
        details: error instanceof Error ? error.message : "Unknown error",
      });
  }
});

// Object Storage Routes for File Uploads
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

// Payment Services
router.get("/api/services", async (req, res) => {
  try {
    const category = req.query.category as string;
    const services = category
      ? await storage.getServicesByCategory(category)
      : await storage.getServices();
    res.json(services);
  } catch {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Payments
router.post("/api/payments", async (req, res) => {
  try {
    const { patientId, items, paymentMethod, receivedBy, notes } = req.body;

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0
    );

    const payment = await storage.createPayment({
      patientId,
      totalAmount,
      paymentMethod,
      paymentDate: new Date().toISOString().split("T")[0],
      receivedBy,
      notes: notes || "",
    });

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

    for (const item of items) {
      if (item.relatedId && item.relatedType) {
        try {
          if (item.relatedType === "lab_test") {
            await storage.updateLabTest(item.relatedId, { paymentStatus: "paid" });
          } else if (item.relatedType === "xray_exam") {
            await storage.updateXrayExam(item.relatedId, { paymentStatus: "paid" });
          } else if (item.relatedType === "ultrasound_exam") {
            await storage.updateUltrasoundExam(item.relatedId, { paymentStatus: "paid" });
          }
        } catch (error) {
          console.error("Error updating payment status:", error);
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
    const patientId = req.query.patientId as string;
    const payments = patientId
      ? await storage.getPaymentsByPatient(patientId)
      : await storage.getPayments();
    res.json(payments);
  } catch {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Get unpaid orders for a patient
router.get("/api/patients/:patientId/unpaid-orders", async (req, res) => {
  try {
    const patientId = req.params.patientId;

    const [labTests, xrayExams, ultrasoundExams] = await Promise.all([
      storage.getLabTestsByPatient(patientId),
      storage.getXrayExamsByPatient(patientId),
      storage.getUltrasoundExamsByPatient(patientId),
    ]);

    const unpaidOrders = [
      ...labTests
        .filter((test) => test.paymentStatus === "unpaid")
        .map((test) => ({
          id: test.testId,
          type: "lab_test",
          description: `Lab Test: ${
            safeParseTests(test.tests).join(", ") || test.category
          }`,
          date: test.requestedDate,
          category: test.category,
        })),
      ...xrayExams
        .filter((exam) => exam.paymentStatus === "unpaid")
        .map((exam) => ({
          id: exam.examId,
          type: "xray_exam",
          description: `X-Ray: ${exam.examType || "X-Ray"}`,
          date: exam.requestedDate,
          bodyPart: exam.bodyPart,
        })),
      ...ultrasoundExams
        .filter((exam) => exam.paymentStatus === "unpaid")
        .map((exam) => ({
          id: exam.examId,
          type: "ultrasound_exam",
          description: `Ultrasound: ${exam.examType || "Ultrasound"}`,
          date: exam.requestedDate,
        })),
    ];

    res.json(unpaidOrders);
  } catch (error) {
    console.error("Error fetching unpaid orders:", error);
    res.status(500).json({ error: "Failed to fetch unpaid orders" });
  }
});

// Pharmacy Orders
router.get("/api/pharmacy-orders", async (_req, res) => {
  try {
    const pharmacyOrders = await storage.getPharmacyOrders();
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

router.patch("/api/pharmacy-orders/:orderId/dispense", async (req, res) => {
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

// ========================================
// BILLING SYSTEM ROUTES
// ========================================

// Billing Settings
router.get("/api/billing/settings", async (_req, res) => {
  try {
    const settings = await storage.getBillingSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching billing settings:", error);
    res.status(500).json({ error: "Failed to fetch billing settings" });
  }
});

router.put("/api/billing/settings", async (req, res) => {
  try {
    const result = insertBillingSettingsSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Invalid billing settings data", details: result.error.errors });
    }

    const settings = await storage.updateBillingSettings(result.data);
    res.json(settings);
  } catch (error) {
    console.error("Error updating billing settings:", error);
    res.status(500).json({ error: "Failed to update billing settings" });
  }
});

// Encounters
router.get("/api/encounters", async (req, res) => {
  try {
    const status = req.query.status as string;
    const date = req.query.date as string;
    const patientId = req.query.patientId as string;

    const encounters = await storage.getEncounters(status, date, patientId);
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

    // Keep original shape (encounter + orderLines) to remain backward compatible
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
    console.error("Error creating encounter:", error);
    res.status(500).json({ error: "Failed to create encounter" });
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

    // Load encounter to get patientId + visitDate (treatments table doesn't have encounterId)
    const encounter = await storage.getEncounterById(encounterId);
    if (!encounter) {
      return res.status(404).json({ error: "Encounter not found" });
    }

    // 1. Validate diagnosis exists for this patient's visit date
    const patientTreatments = await storage.getTreatmentsByPatient(encounter.patientId);
    const treatment = patientTreatments.find((t: any) => t.visitDate === encounter.visitDate);
    if (!treatment || !treatment.diagnosis || treatment.diagnosis.trim() === "") {
      return res.status(400).json({ error: "Cannot close visit: Diagnosis is required" });
    }

    // 2. Check all completed diagnostics are acknowledged
    const [labTests, xrays, ultrasounds] = await Promise.all([
      storage.getLabTestsByPatient(encounter.patientId),
      storage.getXrayExamsByPatient(encounter.patientId),
      storage.getUltrasoundExamsByPatient(encounter.patientId),
    ]);

    const orderLines = await storage.getOrderLinesByEncounter(encounterId);
    const orderLineMap = new Map(orderLines.map((ol: any) => [ol.relatedId || "", ol]));

    // Use membership in orderLineMap (do not rely on encounterId columns on tests/exams)
    const completedDiagnostics = [
      ...labTests.filter((t: any) => t.status === "completed" && orderLineMap.has(t.testId)),
      ...xrays.filter((x: any) => x.status === "completed" && orderLineMap.has(x.examId)),
      ...ultrasounds.filter((u: any) => u.status === "completed" && orderLineMap.has(u.examId)),
    ];

    const unacknowledged = completedDiagnostics.filter((d: any) => {
      const relatedKey = d.testId || d.examId;
      const orderLine = relatedKey ? orderLineMap.get(relatedKey) : null;
      return !orderLine || !orderLine.acknowledgedBy;
    });

    if (unacknowledged.length > 0) {
      return res.status(400).json({
        error: `Cannot close visit: ${unacknowledged.length} completed diagnostic(s) need acknowledgment`,
      });
    }

    // 3. Create/update invoice for cart items
    const cartItems = orderLines.filter((ol: any) => ol.addToCart);
    let invoiceStatus: "open" | "ready_to_bill" | "closed" = "closed";

    if (cartItems.length > 0) {
      try {
        await storage.generateInvoiceFromEncounter(encounterId, "System");
        invoiceStatus = "ready_to_bill";
      } catch (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
      }
    }

    // 4. Close encounter
    const updated = await storage.updateEncounter(encounterId, {
      status: invoiceStatus,
      closedAt: new Date().toISOString(),
    });

    res.json(updated);
  } catch (error) {
    console.error("Error closing encounter:", error);
    res.status(500).json({ error: "Failed to close encounter" });
  }
});

// Get diagnostics with acknowledgment status for an encounter
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
      orderLine: orderLineMap.get(xray.examId),            // examId
    }));

    const enrichedUltrasounds = ultrasounds.map((us: any) => ({
      ...us,
      orderLine: orderLineMap.get(us.examId),              // examId
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

// Helpers
function safeParseTests(testsField: string): string[] {
  if (!testsField) return [];
  try {
    const parsed = JSON.parse(testsField);
    if (Array.isArray(parsed)) return parsed.filter((t) => typeof t === "string");
    if (Array.isArray((parsed as any)?.tests)) return (parsed as any).tests;
    return [];
  } catch {
    return [];
  }
}

function resultFlagFromStatus(status?: "normal" | "abnormal" | "critical" | null) {
  if (status === "critical") return "critical";
  if (status === "abnormal") return "abnormal";
  return null;
}

// Get unified orders for a visit
router.get("/api/visits/:visitId/orders", async (req, res) => {
  try {
    const { visitId } = req.params;
    const encounter = await storage.getEncounterById(visitId);

    if (!encounter) {
      return res.status(404).json({ error: "Visit not found" });
    }

    const [labTests, xrays, ultrasounds] = await Promise.all([
      storage.getLabTestsByPatient(encounter.patientId),
      storage.getXrayExamsByPatient(encounter.patientId),
      storage.getUltrasoundExamsByPatient(encounter.patientId),
    ]);

    const orderLines = await storage.getOrderLinesByEncounter(visitId);
    const orderLineMap = new Map(orderLines.map((ol: any) => [ol.relatedId || "", ol]));

    // LAB (bind to visit via order lines, not encounterId on test rows)
    const labOrders = labTests
      .filter((test: any) => orderLineMap.has(test.testId))
      .map((test: any) => {
        const orderLine = orderLineMap.get(test.testId);
        const testNames = safeParseTests(test.tests);
        const name =
          testNames.length > 0
            ? `Lab: ${testNames.join(", ")}`
            : `Lab: ${test.category || "Test"}`;
        const flags = resultFlagFromStatus(test.resultStatus as any);
        const snippet =
          (Array.isArray(testNames) && testNames.length > 0 && testNames.join(", ")) ||
          test.technicianNotes ||
          null;

        return {
          orderId: orderLine?.id || `lab-${test.testId}`,
          visitId,
          type: "lab",
          name,
          status: test.status || "pending",
          flags,
          snippet,
          resultUrl: `/api/lab-tests/${test.testId}`,
          acknowledgedAt: orderLine?.acknowledgedAt || null,
          acknowledgedBy: orderLine?.acknowledgedBy || null,
          addToCart: !!orderLine?.addToCart,
          isPaid: test.paymentStatus === "paid",
          orderLine,
        };
      });

    // XRAY
    const xrayOrders = xrays
      .filter((xray: any) => orderLineMap.has(xray.examId))
      .map((xray: any) => {
        const orderLine = orderLineMap.get(xray.examId);
        return {
          orderId: orderLine?.id || `xray-${xray.examId}`,
          visitId,
          type: "xray",
          name: xray.examType || "X-Ray",
          status: xray.status || "pending",
          flags: null,
          snippet: xray.impression || null,
          resultUrl: `/api/xray-exams/${xray.examId}`,
          acknowledgedAt: orderLine?.acknowledgedAt || null,
          acknowledgedBy: orderLine?.acknowledgedBy || null,
          addToCart: !!orderLine?.addToCart,
          isPaid: xray.paymentStatus === "paid",
          orderLine,
        };
      });

    // ULTRASOUND
    const ultrasoundOrders = ultrasounds
      .filter((us: any) => orderLineMap.has(us.examId))
      .map((us: any) => {
        const orderLine = orderLineMap.get(us.examId);
        return {
          orderId: orderLine?.id || `ultrasound-${us.examId}`,
          visitId,
          type: "ultrasound",
          name: us.examType || "Ultrasound",
          status: us.status || "pending",
          flags: null,
          snippet: us.impression || null,
          resultUrl: `/api/ultrasound-exams/${us.examId}`,
          acknowledgedAt: orderLine?.acknowledgedAt || null,
          acknowledgedBy: orderLine?.acknowledgedBy || null,
          addToCart: !!orderLine?.addToCart,
          isPaid: us.paymentStatus === "paid",
          orderLine,
        };
      });

    const allOrders = [...labOrders, ...xrayOrders, ...ultrasoundOrders];
    res.json(allOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Update order line acknowledgment
router.put("/api/order-lines/:id/acknowledge", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { acknowledgedBy, acknowledged } = req.body;

    const updates: any = {};
    if (acknowledged) {
      updates.acknowledgedBy = acknowledgedBy;
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

// Update order line add to cart status
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

// Simplified acknowledge API for unified orders
router.put("/api/orders/:orderId/ack", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { acknowledged } = req.body;

    const updates: any = {};
    if (acknowledged) {
      updates.acknowledgedBy = "Current User"; // TODO: Get from auth session
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

// Simplified cart API for unified orders
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

// Order Lines
router.post("/api/order-lines", async (req, res) => {
  try {
    const result = insertOrderLineSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Invalid order line data", details: result.error.errors });
    }

    const orderLine = await storage.createOrderLine(result.data);
    res.status(201).json(orderLine);
  } catch (error) {
    console.error("Error creating order line:", error);
    res.status(500).json({ error: "Failed to create order line" });
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

// Invoices
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

router.post("/api/encounters/:encounterId/generate-invoice", async (req, res) => {
  try {
    const { encounterId } = req.params;
    const { generatedBy } = req.body;

    if (!generatedBy) {
      return res.status(400).json({ error: "generatedBy is required" });
    }

    const invoice = await storage.generateInvoiceFromEncounter(
      encounterId,
      generatedBy
    );
    res.status(201).json(invoice);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

// Enhanced service creation endpoint for automatic encounter/order line creation
router.post("/api/services/:serviceType/auto-order", async (req, res) => {
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
        attendingClinician: attendingClinician || "System",
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
      orderedBy: attendingClinician || "System",
    });

    res.status(201).json({ encounter, orderLine });
  } catch (error) {
    console.error("Error creating auto order:", error);
    res.status(500).json({ error: "Failed to create auto order" });
  }
});

export default router;

import { createServer } from "http";
import { setupAuth } from "./auth";

// Function to register routes with the express app
export async function registerRoutes(app: any) {
  setupAuth(app);
  app.use(router);
  return createServer(app);
}
