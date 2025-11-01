// Medical-Management-System/server/routes.ts

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
  insertDrugSchema,
  insertDrugBatchSchema,
  insertInventoryLedgerSchema,
} from "@shared/schema";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

const router = express.Router();

/* ----------------------------- Auth guards ----------------------------- */

const requireAuth = (req: any, res: any, next: any) => {
  // Optional bypass during local dev if ever needed:
  // if (process.env.SKIP_AUTH === "1") return next();
  try {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
  } catch {}
  return res.status(401).json({ error: "Not authenticated" });
};

const requireRole =
  (...roles: string[]) =>
  (req: any, res: any, next: any) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (roles.includes(req.user.role) || req.user.role === "admin") {
      return next();
    }
    return res.status(403).json({ error: "Insufficient role" });
  };

// Admin-only helper
const requireAdmin = requireRole("admin");

// 🔒 Apply auth to ALL /api/* routes defined in this router.
// (Auth routes are added in setupAuth(app) outside this router, so they are not affected.)
router.use("/api", requireAuth);

/* ------------------------------ Users (admin) ------------------------------ */

router.get("/api/users", requireAdmin, async (_req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error in users route:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ----------------------------- Patient counts ----------------------------- */

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

/* -------------------------------- Patients -------------------------------- */

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

// Reports API - Get total patient count (MUST be before :patientId route)
router.get("/api/patients/count", async (_req, res) => {
  try {
    const patients = await storage.getPatients();
    res.json({ count: patients.length });
  } catch (error) {
    console.error("Error fetching patient count:", error);
    res.status(500).json({ error: "Failed to fetch patient count" });
  }
});

router.get("/api/patients/:patientId", async (req, res) => {
  try {
    const patient = await storage.getPatientByPatientId(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient" });
  }
});

router.post("/api/patients", async (req, res) => {
  try {
    // The frontend will send { patientData: {...}, collectConsultationFee: true }
    const { patientData, collectConsultationFee } = req.body;

    if (!patientData) {
      return res.status(400).json({ error: "Invalid request body. Expected { patientData, ... }" });
    }

    const data = insertPatientSchema.parse(patientData);
    const registeredBy = (req as any).user?.username || (req as any).user?.email || "System";

    // Call the new atomic storage function
    const result = await storage.registerNewPatientWorkflow(
      data,
      !!collectConsultationFee,
      registeredBy
    );

    res.status(201).json(result.patient); // Return just the patient, as before

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid patient data", details: error.errors });
    }
    if (error instanceof Error && (error.message.includes("CONS--GEN") || error.message.includes("UNIQUE constraint failed: patients.patient_id"))) {
      // Catch the service not found error or a duplicate patientId error
      return res.status(400).json({ error: error.message });
    }
    console.error("Error in patient registration workflow:", error);
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

router.delete("/api/patients/:patientId", requireAdmin, async (req: any, res) => {
  try {
    const deletedBy = req.user.username || req.user.email || "admin";
    const deletionReason = req.body.reason as string | undefined;
    const forceDelete = req.body.forceDelete === true;

    const result = await storage.deletePatient(
      req.params.patientId,
      deletedBy,
      deletionReason,
      forceDelete
    );

    if (result.blocked) {
      return res.status(400).json({
        error: "Cannot delete patient",
        blockReasons: result.blockReasons,
        impactSummary: result.impactSummary,
      });
    }

    if (result.success) {
      res.json({
        message: "Patient deleted successfully",
        impactSummary: result.impactSummary,
        forceDeleted: result.forceDeleted || false,
      });
    } else {
      res.status(500).json({ error: "Failed to delete patient" });
    }
  } catch (error) {
    console.error("Error in delete patient route:", error);
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

/* -------------------------------- Treatments ------------------------------- */

router.get("/api/treatments", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const today = req.query.today;

    if (today === "true" || req.path.includes("today")) {
      const treatments = await storage.getTodaysTreatments();
      res.json(treatments);
    } else {
      const treatments = await storage.getTreatments(limit);
      res.json(treatments);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch treatments" });
  }
});

router.get("/api/patients/:patientId/treatments", async (req, res) => {
  try {
    const treatments = await storage.getTreatmentsByPatient(req.params.patientId);
    res.json(treatments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch treatments" });
  }
});

router.post("/api/treatments", async (req, res) => {
  try {
    const data = insertTreatmentSchema.parse(req.body);
    const treatment = await storage.createTreatment(data);
    res.status(201).json(treatment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid treatment data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create treatment" });
  }
});

/* --------------------------------- Lab Tests -------------------------------- */

router.get("/api/lab-tests", async (req, res) => {
  try {
    const status = req.query.status as string;
    const date = req.query.date as string;
    const labTests = await storage.getLabTests(status, date);
    res.json(labTests);
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
        error:
          "Failed to fetch patient lab tests - Please verify the patient ID and try again",
      });
  }
});

router.post("/api/lab-tests", async (req, res) => {
  try {
    console.log("Creating lab test with data:", req.body);
    const data = insertLabTestSchema.parse(req.body);
    console.log("Parsed data:", data);
    const labTest = await storage.createLabTest(data);
    console.log("Created lab test:", labTest);
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
  } catch (error) {
    res.status(500).json({ error: "Failed to update lab test" });
  }
});

/* -------------------------------- X-Ray Exams ------------------------------- */

router.get("/api/xray-exams", async (req, res) => {
  try {
    const status = req.query.status as string;
    const date = req.query.date as string;
    const xrayExams = await storage.getXrayExams(status, date);
    res.json(xrayExams);
  } catch (error) {
    console.error("Error fetching X-ray exams:", error);
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
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
  } catch (error) {
    res.status(500).json({ error: "Failed to update X-ray exam" });
  }
});

/* ------------------------------ Ultrasound Exams --------------------------- */

router.get("/api/ultrasound-exams", async (_req, res) => {
  try {
    const ultrasoundExams = await storage.getUltrasoundExams();
    res.json(ultrasoundExams);
  } catch (error) {
    console.error("Error fetching ultrasound exams:", error);
    res
      .status(500)
      .json({
        error:
          "Failed to fetch ultrasound exams - Please check your connection and try again",
      });
  }
});

router.get("/api/patients/:patientId/ultrasound-exams", async (req, res) => {
  try {
    const ultrasoundExams = await storage.getUltrasoundExamsByPatient(
      req.params.patientId
    );
    res.json(ultrasoundExams);
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ error: "Failed to delete ultrasound exam" });
  }
});

/* -------------------------------- Dashboard -------------------------------- */

router.get("/api/dashboard/stats", async (req, res) => {
  try {
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    console.log("Dashboard stats route called", { fromDate, toDate });
    const stats = await storage.getDashboardStats(fromDate, toDate);
    console.log("Dashboard stats result:", stats);
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats route error:", error);
    res.status(500).json({
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
    res.status(500).json({
      error: "Failed to fetch recent patients",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/* ---------------------------- Object Storage API --------------------------- */

// Upload (🔒 keep authenticated)
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

// Serve objects (NOTE: currently public; lock down later if needed)
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

/* ------------------------------- Services / Pricing ------------------------------- */

router.get("/api/services", async (req, res) => {
  try {
    const category = req.query.category as string;
    const services = category
      ? await storage.getServicesByCategory(category)
      : await storage.getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Only admins can create/update services (prices/catalog)
router.post("/api/services", requireAdmin, async (req, res) => {
  try {
    const service = await storage.createService(req.body);
    res.status(201).json(service);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
});

router.put("/api/services/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const service = await storage.updateService(id, req.body);
    res.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
});

/* ---------------------------------- Payments --------------------------------- */

router.post("/api/payments", async (req: any, res) => {
  try {
    const { patientId, items, paymentMethod, receivedBy, notes, totalAmount: providedTotal } =
      req.body;

    const totalAmount =
      items && items.length > 0
        ? items.reduce(
            (sum: number, item: any) => sum + item.unitPrice * item.quantity,
            0
          )
        : providedTotal;

    const payment = await storage.createPayment({
      patientId,
      totalAmount,
      paymentMethod,
      paymentDate: new Date().toISOString().split("T")[0],
      receivedBy: receivedBy || req.user?.username || req.user?.email || "System",
      notes: notes || "",
    });

    if (items && items.length > 0) {
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
              await storage.updateUltrasoundExam(item.relatedId, {
                paymentStatus: "paid",
              });
            } else if (item.relatedType === "pharmacy_order") {
              await storage.updatePharmacyOrder(item.relatedId, {
                paymentStatus: "paid",
              });
            }
          } catch (error) {
            console.error("Error updating payment status:", error);
          }
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

/* ----------------------------- Unpaid orders views ----------------------------- */

router.get("/api/unpaid-orders/all", async (_req, res) => {
  try {
    const [labTests, xrayExams, ultrasoundExams, pharmacyOrders, patients, services] =
      await Promise.all([
        storage.getLabTests(),
        storage.getXrayExams(),
        storage.getUltrasoundExams(),
        storage.getPharmacyOrders(),
        storage.getPatients(),
        storage.getServices(),
      ]);

    const patientMap = new Map();
    patients.forEach((p) => patientMap.set(p.patientId, p));

    const getServiceByCategory = (category: string) => {
      return services.find((s) => s.category === category && s.isActive);
    };

    const result = {
      laboratory: labTests
        .filter((test) => test.paymentStatus === "unpaid")
        .map((test) => {
          const service = getServiceByCategory("laboratory");
          return {
            id: test.testId,
            type: "lab_test",
            description: `Lab Test: ${JSON.parse(test.tests).join(", ")}`,
            date: test.requestedDate,
            category: test.category,
            patient: patientMap.get(test.patientId) || null,
            patientId: test.patientId,
            serviceId: service?.id,
            serviceName: service?.name,
            price: service?.price,
          };
        }),
      xray: xrayExams
        .filter((exam) => exam.paymentStatus === "unpaid")
        .map((exam) => {
          const service = getServiceByCategory("radiology");
          return {
            id: exam.examId,
            type: "xray_exam",
            description: `X-Ray: ${exam.examType}`,
            date: exam.requestedDate,
            bodyPart: exam.bodyPart,
            patient: patientMap.get(exam.patientId) || null,
            patientId: exam.patientId,
            serviceId: service?.id,
            serviceName: service?.name,
            price: service?.price,
          };
        }),
      ultrasound: ultrasoundExams
        .filter((exam) => exam.paymentStatus === "unpaid")
        .map((exam) => {
          const service = getServiceByCategory("ultrasound");
          return {
            id: exam.examId,
            type: "ultrasound_exam",
            description: `Ultrasound: ${exam.examType}`,
            date: exam.requestedDate,
            patient: patientMap.get(exam.patientId) || null,
            patientId: exam.patientId,
            serviceId: service?.id,
            serviceName: service?.name,
            price: service?.price,
          };
        }),
      pharmacy: pharmacyOrders
        .filter((order) => order.paymentStatus === "unpaid" && order.status === "prescribed")
        .map((order) => {
          const service = services.find((s) => s.id === order.serviceId);
          return {
            id: order.orderId,
            type: "pharmacy_order",
            description: `Pharmacy: ${order.drugName || "Medication"}`,
            date: order.createdAt,
            dosage: order.dosage,
            quantity: order.quantity,
            patient: patientMap.get(order.patientId) || null,
            patientId: order.patientId,
            serviceId: service?.id,
            serviceName: service?.name,
            price: service?.price,
          };
        }),
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching all unpaid orders:", error);
    res.status(500).json({ error: "Failed to fetch unpaid orders" });
  }
});

router.get("/api/patients/:patientId/unpaid-orders", async (req, res) => {
  try {
    const patientId = req.params.patientId;

    const [labTests, xrayExams, ultrasoundExams, pharmacyOrders] = await Promise.all([
      storage.getLabTestsByPatient(patientId),
      storage.getXrayExamsByPatient(patientId),
      storage.getUltrasoundExamsByPatient(patientId),
      storage.getPharmacyOrdersByPatient(patientId),
    ]);

    const unpaidOrders = [
      ...labTests
        .filter((test) => test.paymentStatus === "unpaid")
        .map((test) => ({
          id: test.testId,
          type: "lab_test",
          description: `Lab Test: ${JSON.parse(test.tests).join(", ")}`,
          date: test.requestedDate,
          category: test.category,
        })),
      ...xrayExams
        .filter((exam) => exam.paymentStatus === "unpaid")
        .map((exam) => ({
          id: exam.examId,
          type: "xray_exam",
          description: `X-Ray: ${exam.examType}`,
          date: exam.requestedDate,
          bodyPart: exam.bodyPart,
        })),
      ...ultrasoundExams
        .filter((exam) => exam.paymentStatus === "unpaid")
        .map((exam) => ({
          id: exam.examId,
          type: "ultrasound_exam",
          description: `Ultrasound: ${exam.examType}`,
          date: exam.requestedDate,
        })),
      ...pharmacyOrders
        .filter((order) => order.paymentStatus === "unpaid")
        .map((order) => ({
          id: order.orderId,
          type: "pharmacy_order",
          description: `Pharmacy: ${order.drugName || "Medication"}`,
          date: order.createdAt,
          dosage: order.dosage,
          quantity: order.quantity,
        })),
    ];

    res.json(unpaidOrders);
  } catch (error) {
    console.error("Error fetching unpaid orders:", error);
    res.status(500).json({ error: "Failed to fetch unpaid orders" });
  }
});

/* --------------------------------- Pharmacy --------------------------------- */

router.get("/api/pharmacy-orders", async (_req, res) => {
  try {
    const pharmacyOrders = await storage.getPharmacyOrdersWithPatients();
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

router.patch("/api/pharmacy-orders/:orderId/dispense", async (req: any, res) => {
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

/* ------------------------------- Billing System ------------------------------ */

router.get("/api/billing/settings", async (_req, res) => {
  try {
    const settings = await storage.getBillingSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching billing settings:", error);
    res.status(500).json({ error: "Failed to fetch billing settings" });
  }
});

// Admin only
router.put("/api/billing/settings", requireAdmin, async (req, res) => {
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

/* ---------------------------------- Encounters / Visits ---------------------------------- */

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

    const treatments = await storage.getTreatments();
    const treatment = treatments.find((t: any) => t.encounterId === encounterId);
    if (!treatment || !treatment.diagnosis || treatment.diagnosis.trim() === "") {
      return res.status(400).json({ error: "Cannot close visit: Diagnosis is required" });
    }

    const [labTests, xrays, ultrasounds] = await Promise.all([
      storage.getLabTests(),
      storage.getXrayExams(),
      storage.getUltrasoundExams(),
    ]);

    const orderLines = await storage.getOrderLinesByEncounter(encounterId);
    const orderLineMap = new Map(orderLines.map((ol: any) => [ol.relatedId || "", ol]));

    const completedDiagnostics = [
      ...labTests.filter((t: any) => t.encounterId === encounterId && t.status === "completed"),
      ...xrays.filter((x: any) => x.encounterId === encounterId && x.status === "completed"),
      ...ultrasounds.filter((u: any) => u.encounterId === encounterId && u.status === "completed"),
    ];

    const unacknowledged = completedDiagnostics.filter((d: any) => {
      const orderLine = orderLineMap.get(d.testId || d.xrayId || d.ultrasoundId);
      return !orderLine || !orderLine.acknowledgedBy;
    });

    if (unacknowledged.length > 0) {
      return res
        .status(400)
        .json({
          error: `Cannot close visit: ${unacknowledged.length} completed diagnostic(s) need acknowledgment`,
        });
    }

    const cartItems = orderLines.filter((ol: any) => ol.addToCart);
    let invoiceStatus: "open" | "ready_to_bill" | "closed" = "closed";

    if (cartItems.length > 0) {
      try {
        const generatedBy = (req as any).user?.username || (req as any).user?.email || "System";
        await storage.generateInvoiceFromEncounter(encounterId, generatedBy);
        invoiceStatus = "ready_to_bill";
      } catch (invoiceError) {
        console.error("Error creating invoice:", invoiceError);
      }
    }

    const encounter = await storage.updateEncounter(encounterId, {
      status: invoiceStatus,
      closedAt: new Date().toISOString(),
    });

    res.json(encounter);
  } catch (error) {
    console.error("Error closing encounter:", error);
    res.status(500).json({ error: "Failed to close encounter" });
  }
});

/* --------------------------- Diagnostics aggregation --------------------------- */

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
      orderLine: orderLineMap.get(xray.examId),
    }));

    const enrichedUltrasounds = ultrasounds.map((ultrasound: any) => ({
      ...ultrasound,
      orderLine: orderLineMap.get(ultrasound.ultrasoundId),
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

/* ------------------------- Unified orders view for a visit ------------------------- */

router.get("/api/visits/:visitId/orders", async (req, res) => {
  try {
    const { visitId } = req.params;
    const encounter = await storage.getEncounterById(visitId);

    if (!encounter) {
      return res.status(404).json({ error: "Visit not found" });
    }

    console.log(`Getting orders for visit ${visitId}, patient ${encounter.patientId}`);

    const [labTests, xrays, ultrasounds] = await Promise.all([
      storage.getLabTestsByPatient(encounter.patientId),
      storage.getXrayExamsByPatient(encounter.patientId),
      storage.getUltrasoundExamsByPatient(encounter.patientId),
    ]);

    console.log(
      `Found ${labTests.length} lab tests, ${xrays.length} xrays, ${ultrasounds.length} ultrasounds for patient ${encounter.patientId}`
    );

    const orderLines = await storage.getOrderLinesByEncounter(visitId);
    const orderLineMap = new Map(orderLines.map((ol: any) => [ol.relatedId || "", ol]));

    const labOrders = labTests.map((test: any) => {
      const orderLine = orderLineMap.get(test.testId);
      return {
        ...test,
        orderId: orderLine?.id || `lab-${test.testId}`,
        visitId,
        type: "lab",
        name: test.category || "Lab Test",
        flags: test.clinicalSignificance || null,
        snippet: test.criticalFindings || test.interpretation || null,
        resultUrl: `/api/lab-tests/${test.testId}`,
        orderLine,
        acknowledgedAt: orderLine?.acknowledgedAt || null,
        acknowledgedBy: orderLine?.acknowledgedBy || null,
        addToCart: orderLine?.addToCart || false,
        isPaid: test.paymentStatus === "paid",
      };
    });

    const xrayOrders = xrays.map((xray: any) => {
      const orderLine = orderLineMap.get(xray.examId);
      return {
        ...xray,
        orderId: orderLine?.id || `xray-${xray.examId}`,
        visitId,
        type: "xray",
        name: xray.examType || "X-Ray",
        flags: null,
        snippet: xray.impression || null,
        resultUrl: `/api/xray-exams/${xray.examId}`,
        orderLine,
        acknowledgedAt: orderLine?.acknowledgedAt || null,
        acknowledgedBy: orderLine?.acknowledgedBy || null,
        addToCart: orderLine?.addToCart || false,
        isPaid: xray.paymentStatus === "paid",
      };
    });

    const ultrasoundOrders = ultrasounds.map((us: any) => {
      const orderLine = orderLineMap.get(us.examId);
      return {
        ...us,
        orderId: orderLine?.id || `ultrasound-${us.examId}`,
        visitId,
        type: "ultrasound",
        name: us.examinationType || "Ultrasound",
        flags: null,
        snippet: us.impression || null,
        resultUrl: `/api/ultrasound-exams/${us.examId}`,
        orderLine,
        acknowledgedAt: orderLine?.acknowledgedAt || null,
        acknowledgedBy: orderLine?.acknowledgedBy || null,
        addToCart: orderLine?.addToCart || false,
        isPaid: us.paymentStatus === "paid",
      };
    });

    // Add consultation order lines (they don't have a separate table)
    const consultationOrders = orderLines
      .filter((ol: any) => ol.relatedType === "consultation")
      .map((ol: any) => ({
        orderId: ol.id,
        visitId,
        type: "consultation",
        name: ol.description || "Consultation",
        status: ol.status || "performed",
        totalPrice: ol.totalPrice,
        orderLine: ol,
        acknowledgedAt: ol.acknowledgedAt || null,
        acknowledgedBy: ol.acknowledgedBy || null,
        addToCart: ol.addToCart || 0,
        isPaid: ol.addToCart === 0, // If not in cart, it's paid
      }));

    const allOrders = [...consultationOrders, ...labOrders, ...xrayOrders, ...ultrasoundOrders];

    res.json(allOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/* ---------------------------- Order line helpers ---------------------------- */

router.put("/api/order-lines/:id/acknowledge", async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { acknowledgedBy, acknowledged } = req.body;

    const updates: any = {};
    if (acknowledged) {
      updates.acknowledgedBy =
        acknowledgedBy || req.user?.username || req.user?.email || "System";
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

router.put("/api/orders/:orderId/ack", async (req: any, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { acknowledged } = req.body;

    const updates: any = {};
    if (acknowledged) {
      updates.acknowledgedBy =
        req.user?.username || req.user?.email || "System";
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

/* --------------------------------- Order lines -------------------------------- */

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

/* ----------------------------------- Invoices ---------------------------------- */

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

router.post("/api/encounters/:encounterId/generate-invoice", async (req: any, res) => {
  try {
    const { encounterId } = req.params;
    const generatedBy =
      req.body.generatedBy ||
      req.user?.username ||
      req.user?.email ||
      "System";

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

/* ------------------ Enhanced service → auto order helper ------------------ */

router.post("/api/services/:serviceType/auto-order", async (req: any, res) => {
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
        attendingClinician:
          attendingClinician || req.user?.username || req.user?.email || "System",
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
      orderedBy: attendingClinician || req.user?.username || req.user?.email || "System",
    });

    res.status(201).json({ encounter, orderLine });
  } catch (error) {
    console.error("Error creating auto order:", error);
    res.status(500).json({ error: "Failed to create auto order" });
  }
});

/* -------------------------- Pharmacy inventory & stock -------------------------- */

router.get("/api/pharmacy/drugs", async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly === "true";
    const drugs = await storage.getDrugs(activeOnly);
    res.json(drugs);
  } catch (error) {
    console.error("Error fetching drugs:", error);
    res.status(500).json({ error: "Failed to fetch drugs" });
  }
});

router.get("/api/pharmacy/drugs/:id", async (req, res) => {
  try {
    const drug = await storage.getDrugById(parseInt(req.params.id));
    if (!drug) {
      return res.status(404).json({ error: "Drug not found" });
    }
    res.json(drug);
  } catch (error) {
    console.error("Error fetching drug:", error);
    res.status(500).json({ error: "Failed to fetch drug" });
  }
});

router.post("/api/pharmacy/drugs", requireAdmin, async (req, res) => {
  try {
    const data = insertDrugSchema.parse(req.body);
    const drug = await storage.createDrug(data);
    res.status(201).json(drug);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid drug data", details: error.errors });
    }
    console.error("Error creating drug:", error);
    res.status(500).json({ error: "Failed to create drug" });
  }
});

router.put("/api/pharmacy/drugs/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const drug = await storage.updateDrug(id, req.body);
    res.json(drug);
  } catch (error) {
    console.error("Error updating drug:", error);
    res.status(500).json({ error: "Failed to update drug" });
  }
});

router.get("/api/pharmacy/batches", async (req, res) => {
  try {
    const drugId = req.query.drugId ? parseInt(req.query.drugId as string) : undefined;
    const batches = await storage.getDrugBatches(drugId);
    res.json(batches);
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Failed to fetch batches" });
  }
});

router.get("/api/pharmacy/batches/:batchId", async (req, res) => {
  try {
    const batch = await storage.getDrugBatchById(req.params.batchId);
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }
    res.json(batch);
  } catch (error) {
    console.error("Error fetching batch:", error);
    res.status(500).json({ error: "Failed to fetch batch" });
  }
});

router.post("/api/pharmacy/batches", requireAdmin, async (req, res) => {
  try {
    const data = insertDrugBatchSchema.parse(req.body);
    const batch = await storage.createDrugBatch(data);
    res.status(201).json(batch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid batch data", details: error.errors });
    }
    console.error("Error creating batch:", error);
    res.status(500).json({ error: "Failed to create batch" });
  }
});

router.get("/api/pharmacy/batches/fefo/:drugId", async (req, res) => {
  try {
    const drugId = parseInt(req.params.drugId);
    const batches = await storage.getBatchesFEFO(drugId);
    res.json(batches);
  } catch (error) {
    console.error("Error fetching FEFO batches:", error);
    res.status(500).json({ error: "Failed to fetch FEFO batches" });
  }
});

router.get("/api/pharmacy/ledger", async (req, res) => {
  try {
    const drugId = req.query.drugId ? parseInt(req.query.drugId as string) : undefined;
    const batchId = req.query.batchId as string | undefined;
    const ledger = await storage.getInventoryLedger(drugId, batchId);
    res.json(ledger);
  } catch (error) {
    console.error("Error fetching ledger:", error);
    res.status(500).json({ error: "Failed to fetch inventory ledger" });
  }
});

router.post("/api/pharmacy/ledger", requireAdmin, async (req, res) => {
  try {
    const data = insertInventoryLedgerSchema.parse(req.body);
    const entry = await storage.createInventoryLedger(data);
    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid ledger data", details: error.errors });
    }
    console.error("Error creating ledger entry:", error);
    res.status(500).json({ error: "Failed to create ledger entry" });
  }
});

router.get("/api/pharmacy/stock/all", async (_req, res) => {
  try {
    const drugsWithStock = await storage.getAllDrugsWithStock();
    res.json(drugsWithStock);
  } catch (error) {
    console.error("Error fetching all drugs with stock:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch drugs with stock levels" });
  }
});

router.get("/api/pharmacy/stock/:drugId", async (req, res) => {
  try {
    const drugId = parseInt(req.params.drugId);
    const stockLevel = await storage.getDrugStockLevel(drugId);
    res.json({ drugId, stockOnHand: stockLevel });
  } catch (error) {
    console.error("Error fetching stock level:", error);
    res.status(500).json({ error: "Failed to fetch stock level" });
  }
});

router.get("/api/pharmacy/alerts/low-stock", async (_req, res) => {
  try {
    const lowStockDrugs = await storage.getLowStockDrugs();
    res.json(lowStockDrugs);
  } catch (error) {
    console.error("Error fetching low stock drugs:", error);
    res.status(500).json({ error: "Failed to fetch low stock drugs" });
  }
});

router.get("/api/pharmacy/alerts/expiring", async (req, res) => {
  try {
    const daysThreshold = req.query.days ? parseInt(req.query.days as string) : 90;
    const expiringDrugs = await storage.getExpiringSoonDrugs(daysThreshold);
    res.json(expiringDrugs);
  } catch (error) {
    console.error("Error fetching expiring drugs:", error);
    res.status(500).json({ error: "Failed to fetch expiring drugs" });
  }
});

router.get("/api/pharmacy/prescriptions/paid", async (_req, res) => {
  try {
    const prescriptions = await storage.getPaidPrescriptions();
    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching paid prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch paid prescriptions" });
  }
});

router.get("/api/pharmacy/prescriptions/dispensed", async (_req, res) => {
  try {
    const prescriptions = await storage.getDispensedPrescriptions();
    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching dispensed prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch dispensed prescriptions" });
  }
});

router.post("/api/pharmacy/dispense", async (req, res) => {
  try {
    const { orderId, batchId, quantity, dispensedBy } = req.body;

    if (!orderId || !batchId || !quantity || !dispensedBy) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const order = await storage.dispenseDrug(orderId, batchId, quantity, dispensedBy);
    res.json(order);
  } catch (error) {
    console.error("Error dispensing drug:", error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to dispense drug" });
  }
});

/* ---------------------------------- Reports ---------------------------------- */

router.get("/api/reports/diagnoses", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const treatments = await storage.getTreatments();

    let filteredTreatments = treatments;
    if (fromDate || toDate) {
      filteredTreatments = treatments.filter((t) => {
        const visitDate = t.visitDate;
        if (fromDate && visitDate < fromDate) return false;
        if (toDate && visitDate > toDate) return false;
        return true;
      });
    }

    const diagnosisCounts: Record<string, number> = {};
    filteredTreatments.forEach((t) => {
      if (t.diagnosis && t.diagnosis.trim()) {
        const diagnosis = t.diagnosis.trim();
        diagnosisCounts[diagnosis] = (diagnosisCounts[diagnosis] || 0) + 1;
      }
    });

    const diagnosisArray = Object.entries(diagnosisCounts)
      .map(([diagnosis, count]) => ({
        diagnosis,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    res.json(diagnosisArray);
  } catch (error) {
    console.error("Error fetching diagnosis data:", error);
    res.status(500).json({ error: "Failed to fetch diagnosis data" });
  }
});

router.get("/api/reports/age-distribution", async (_req, res) => {
  try {
    const patients = await storage.getPatients();

    const ageRanges: Record<string, number> = {
      "0-5 years": 0,
      "6-17 years": 0,
      "18-64 years": 0,
      "65+ years": 0,
      Unknown: 0,
    };

    patients.forEach((patient) => {
      if (!patient.age || patient.age.trim() === "") {
        ageRanges["Unknown"]++;
        return;
      }

      const age = parseInt(patient.age);
      if (isNaN(age)) {
        ageRanges["Unknown"]++;
      } else if (age <= 5) {
        ageRanges["0-5 years"]++;
      } else if (age <= 17) {
        ageRanges["6-17 years"]++;
      } else if (age <= 64) {
        ageRanges["18-64 years"]++;
      } else {
        ageRanges["65+ years"]++;
      }
    });

    const total = patients.length || 1;
    const distribution = Object.entries(ageRanges)
      .filter(([_, count]) => count > 0)
      .map(([ageRange, count]) => ({
        ageRange,
        count,
        percentage: Math.round((count / total) * 100),
      }));

    res.json(distribution);
  } catch (error) {
    console.error("Error fetching age distribution:", error);
    res.status(500).json({ error: "Failed to fetch age distribution" });
  }
});

export default router;

import { createServer } from "http";
import { writeFileSync } from "fs";
import path from "path";
import { setupAuth } from "./auth";
import dailyCashRouter from "./reports.daily-cash";
import dailyCashCsvRouter from "./reports.daily-cash.csv";

// Function to register routes with the express app
export async function registerRoutes(app: any) {
  setupAuth(app);
  app.use(router);
  app.use(dailyCashRouter);
  app.use(dailyCashCsvRouter);

  // Return a basic HTTP server for compatibility
  return createServer(app);
}
