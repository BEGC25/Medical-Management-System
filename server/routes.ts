import express from "express";
import { z } from "zod";
import { storage } from "./storage";
import { insertPatientSchema, insertTreatmentSchema, insertLabTestSchema, insertXrayExamSchema, insertUltrasoundExamSchema, insertPharmacyOrderSchema, insertBillingSettingsSchema, insertEncounterSchema, insertOrderLineSchema, insertInvoiceSchema, insertDrugSchema, insertDrugBatchSchema, insertInventoryLedgerSchema } from "@shared/schema";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Users - Admin only
router.get("/api/users", requireAdmin, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error in users route:', error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Patient Counts - Efficient endpoint for getting counts without full data
router.get("/api/patients/counts", async (req, res) => {
  try {
    const date = req.query.date as string;
    
    // Get counts efficiently without fetching full patient arrays
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
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in patient counts route:', error);
    res.status(500).json({ error: "Failed to fetch patient counts" });
  }
});

// Patients
router.get("/api/patients", async (req, res) => {
  try {
    const search = req.query.search as string;
    const today = req.query.today;
    const date = req.query.date as string;
    const withStatus = req.query.withStatus === 'true';
    
    if (withStatus) {
      // Return patients with service status information
      if (today === 'true' || search === 'today') {
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
      // Return basic patient information (legacy)
      if (today === 'true' || search === 'today') {
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
    console.error('Error in patients route:', error);
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
  } catch (error) {
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
      return res.status(400).json({ error: "Invalid patient data", details: error.errors });
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
      return res.status(400).json({ error: "Invalid patient data", details: error.errors });
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
  } catch (error) {
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

// Treatments
router.get("/api/treatments", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const today = req.query.today;
    
    if (today === 'true' || req.path.includes('today')) {
      // Get today's treatments
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
      return res.status(400).json({ error: "Invalid treatment data", details: error.errors });
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
    res.status(500).json({ error: "Failed to fetch lab tests - Please check your connection and try again" });
  }
});

router.get("/api/patients/:patientId/lab-tests", async (req, res) => {
  try {
    const labTests = await storage.getLabTestsByPatient(req.params.patientId);
    res.json(labTests);
  } catch (error) {
    console.error("Error fetching patient lab tests:", error);
    res.status(500).json({ error: "Failed to fetch patient lab tests - Please verify the patient ID and try again" });
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
      return res.status(400).json({ error: "Invalid lab test data", details: error.errors });
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

// X-Ray Exams
router.get("/api/xray-exams", async (req, res) => {
  try {
    const status = req.query.status as string;
    const date = req.query.date as string;
    const xrayExams = await storage.getXrayExams(status, date);
    res.json(xrayExams);
  } catch (error) {
    console.error("Error fetching X-ray exams:", error);
    res.status(500).json({ error: "Failed to fetch X-ray exams - Please check your connection and try again" });
  }
});

router.get("/api/patients/:patientId/xray-exams", async (req, res) => {
  try {
    const xrayExams = await storage.getXrayExamsByPatient(req.params.patientId);
    res.json(xrayExams);
  } catch (error) {
    console.error("Error fetching patient X-ray exams:", error);
    res.status(500).json({ error: "Failed to fetch patient X-ray exams - Please verify the patient ID and try again" });
  }
});

router.post("/api/xray-exams", async (req, res) => {
  try {
    const data = insertXrayExamSchema.parse(req.body);
    const xrayExam = await storage.createXrayExam(data);
    res.status(201).json(xrayExam);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid X-ray exam data", details: error.errors });
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

// Ultrasound Exams
router.get("/api/ultrasound-exams", async (req, res) => {
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
    const ultrasoundExams = await storage.getUltrasoundExamsByPatient(req.params.patientId);
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
      return res.status(400).json({ error: "Invalid ultrasound exam data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create ultrasound exam" });
  }
});

router.put("/api/ultrasound-exams/:examId", async (req, res) => {
  try {
    const data = req.body;
    const ultrasoundExam = await storage.updateUltrasoundExam(req.params.examId, data);
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

// Dashboard
router.get("/api/dashboard/stats", async (req, res) => {
  try {
    console.log("Dashboard stats route called");
    const stats = await storage.getDashboardStats();
    console.log("Dashboard stats result:", stats);
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats route error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats", details: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.get("/api/dashboard/recent-patients", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const patients = await storage.getRecentPatients(limit);
    res.json(patients);
  } catch (error) {
    console.error("Recent patients error:", error);
    res.status(500).json({ error: "Failed to fetch recent patients", details: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Object Storage Routes for File Uploads
router.post("/api/objects/upload", async (req, res) => {
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
    
    // Normalize attachment URLs and set ACL policies
    const normalizedAttachments = [];
    for (const attachment of attachments) {
      try {
        const normalizedPath = objectStorageService.normalizeObjectEntityPath(attachment.url);
        normalizedAttachments.push({
          ...attachment,
          url: normalizedPath
        });
      } catch (error) {
        console.error("Error normalizing attachment path:", error);
        normalizedAttachments.push(attachment);
      }
    }

    const labTest = await storage.updateLabTestAttachments(req.params.testId, normalizedAttachments);
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

router.post("/api/services", async (req, res) => {
  try {
    const service = await storage.createService(req.body);
    res.status(201).json(service);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
});

router.put("/api/services/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const service = await storage.updateService(id, req.body);
    res.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
});

// Payments
router.post("/api/payments", async (req, res) => {
  try {
    const { patientId, items, paymentMethod, receivedBy, notes } = req.body;
    
    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
    
    // Create payment
    const payment = await storage.createPayment({
      patientId,
      totalAmount,
      paymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      receivedBy,
      notes: notes || "",
    });
    
    // Create payment items
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
    
    // Update payment status for related orders
    for (const item of items) {
      if (item.relatedId && item.relatedType) {
        try {
          if (item.relatedType === 'lab_test') {
            await storage.updateLabTest(item.relatedId, { paymentStatus: 'paid' });
          } else if (item.relatedType === 'xray_exam') {
            await storage.updateXrayExam(item.relatedId, { paymentStatus: 'paid' });
          } else if (item.relatedType === 'ultrasound_exam') {
            await storage.updateUltrasoundExam(item.relatedId, { paymentStatus: 'paid' });
          } else if (item.relatedType === 'pharmacy_order') {
            await storage.updatePharmacyOrder(item.relatedId, { paymentStatus: 'paid' });
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Get all unpaid orders across all patients, grouped by department
router.get("/api/unpaid-orders/all", async (req, res) => {
  try {
    const [labTests, xrayExams, ultrasoundExams, pharmacyOrders, patients, services] = await Promise.all([
      storage.getLabTests(),
      storage.getXrayExams(),
      storage.getUltrasoundExams(),
      storage.getPharmacyOrders(),
      storage.getPatients(),
      storage.getServices(),
    ]);
    
    // Create maps for quick lookup
    const patientMap = new Map();
    patients.forEach(p => patientMap.set(p.patientId, p));
    
    // Map services by category for pricing
    const getServiceByCategory = (category: string) => {
      return services.find(s => s.category === category && s.isActive);
    };
    
    // Group unpaid orders by department with patient info and service details
    const result = {
      laboratory: labTests
        .filter(test => test.paymentStatus === 'unpaid')
        .map(test => {
          const service = getServiceByCategory('laboratory');
          return {
            id: test.testId,
            type: 'lab_test',
            description: `Lab Test: ${JSON.parse(test.tests).join(', ')}`,
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
        .filter(exam => exam.paymentStatus === 'unpaid')
        .map(exam => {
          const service = getServiceByCategory('radiology');
          return {
            id: exam.examId,
            type: 'xray_exam',
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
        .filter(exam => exam.paymentStatus === 'unpaid')
        .map(exam => {
          const service = getServiceByCategory('ultrasound');
          return {
            id: exam.examId,
            type: 'ultrasound_exam',
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
        .filter(order => order.paymentStatus === 'unpaid' && order.status === 'prescribed')
        .map(order => {
          const service = services.find(s => s.id === order.serviceId);
          return {
            id: order.orderId,
            type: 'pharmacy_order',
            description: `Pharmacy: ${order.drugName || 'Medication'}`,
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

// Get unpaid orders for a patient
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
      ...labTests.filter(test => test.paymentStatus === 'unpaid').map(test => ({
        id: test.testId,
        type: 'lab_test',
        description: `Lab Test: ${JSON.parse(test.tests).join(', ')}`,
        date: test.requestedDate,
        category: test.category,
      })),
      ...xrayExams.filter(exam => exam.paymentStatus === 'unpaid').map(exam => ({
        id: exam.examId,
        type: 'xray_exam',
        description: `X-Ray: ${exam.examType}`,
        date: exam.requestedDate,
        bodyPart: exam.bodyPart,
      })),
      ...ultrasoundExams.filter(exam => exam.paymentStatus === 'unpaid').map(exam => ({
        id: exam.examId,
        type: 'ultrasound_exam',
        description: `Ultrasound: ${exam.examType}`,
        date: exam.requestedDate,
      })),
      ...pharmacyOrders.filter(order => order.paymentStatus === 'unpaid').map(order => ({
        id: order.orderId,
        type: 'pharmacy_order',
        description: `Pharmacy: ${order.drugName || 'Medication'}`,
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

// Pharmacy Orders
router.get("/api/pharmacy-orders", async (req, res) => {
  try {
    const pharmacyOrders = await storage.getPharmacyOrdersWithPatients();
    res.json(pharmacyOrders);
  } catch (error) {
    console.error('Error in pharmacy orders route:', error);
    res.status(500).json({ error: "Failed to fetch pharmacy orders - Please check your connection and try again" });
  }
});

router.get("/api/pharmacy-orders/:patientId", async (req, res) => {
  try {
    const pharmacyOrders = await storage.getPharmacyOrdersByPatient(req.params.patientId);
    res.json(pharmacyOrders);
  } catch (error) {
    console.error('Error in patient pharmacy orders route:', error);
    res.status(500).json({ error: "Failed to fetch patient pharmacy orders" });
  }
});

router.post("/api/pharmacy-orders", async (req, res) => {
  try {
    const data = insertPharmacyOrderSchema.parse(req.body);
    const pharmacyOrder = await storage.createPharmacyOrder(data);
    res.status(201).json(pharmacyOrder);
  } catch (error) {
    console.error('Error creating pharmacy order:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid pharmacy order data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create pharmacy order" });
  }
});

router.patch("/api/pharmacy-orders/:orderId", async (req, res) => {
  try {
    const updates = req.body;
    const pharmacyOrder = await storage.updatePharmacyOrder(req.params.orderId, updates);
    res.json(pharmacyOrder);
  } catch (error) {
    console.error('Error updating pharmacy order:', error);
    res.status(500).json({ error: "Failed to update pharmacy order" });
  }
});

router.patch("/api/pharmacy-orders/:orderId/dispense", async (req, res) => {
  try {
    const pharmacyOrder = await storage.dispensePharmacyOrder(req.params.orderId);
    res.json(pharmacyOrder);
  } catch (error) {
    console.error('Error dispensing pharmacy order:', error);
    res.status(500).json({ error: "Failed to dispense pharmacy order" });
  }
});

// ========================================
// BILLING SYSTEM ROUTES
// ========================================

// Billing Settings
router.get("/api/billing/settings", async (req, res) => {
  try {
    const settings = await storage.getBillingSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching billing settings:', error);
    res.status(500).json({ error: "Failed to fetch billing settings" });
  }
});

router.put("/api/billing/settings", async (req, res) => {
  try {
    const result = insertBillingSettingsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid billing settings data", details: result.error.errors });
    }
    
    const settings = await storage.updateBillingSettings(result.data);
    res.json(settings);
  } catch (error) {
    console.error('Error updating billing settings:', error);
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
    console.error('Error fetching encounters:', error);
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
    
    // Get order lines for this encounter
    const orderLines = await storage.getOrderLinesByEncounter(encounterId);
    
    res.json({ encounter, orderLines });
  } catch (error) {
    console.error('Error fetching encounter:', error);
    res.status(500).json({ error: "Failed to fetch encounter" });
  }
});

router.post("/api/encounters", async (req, res) => {
  try {
    const result = insertEncounterSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid encounter data", details: result.error.errors });
    }
    
    const encounter = await storage.createEncounter(result.data);
    res.status(201).json(encounter);
  } catch (error) {
    console.error('Error creating encounter:', error);
    res.status(500).json({ error: "Failed to create encounter" });
  }
});

router.put("/api/encounters/:encounterId", async (req, res) => {
  try {
    const { encounterId } = req.params;
    const encounter = await storage.updateEncounter(encounterId, req.body);
    res.json(encounter);
  } catch (error) {
    console.error('Error updating encounter:', error);
    res.status(500).json({ error: "Failed to update encounter" });
  }
});

router.post("/api/encounters/:encounterId/close", async (req, res) => {
  try {
    const { encounterId } = req.params;
    
    // 1. Validate diagnosis exists
    const treatments = await storage.getTreatments();
    const treatment = treatments.find((t: any) => t.encounterId === encounterId);
    if (!treatment || !treatment.diagnosis || treatment.diagnosis.trim() === '') {
      return res.status(400).json({ error: "Cannot close visit: Diagnosis is required" });
    }
    
    // 2. Check all completed diagnostics are acknowledged
    const [labTests, xrays, ultrasounds] = await Promise.all([
      storage.getLabTests(),
      storage.getXrayExams(),
      storage.getUltrasoundExams(),
    ]);
    
    const orderLines = await storage.getOrderLinesByEncounter(encounterId);
    const orderLineMap = new Map(orderLines.map((ol: any) => [ol.relatedId || '', ol]));
    
    const completedDiagnostics = [
      ...labTests.filter((t: any) => t.encounterId === encounterId && t.status === 'completed'),
      ...xrays.filter((x: any) => x.encounterId === encounterId && x.status === 'completed'),
      ...ultrasounds.filter((u: any) => u.encounterId === encounterId && u.status === 'completed'),
    ];
    
    const unacknowledged = completedDiagnostics.filter((d: any) => {
      const orderLine = orderLineMap.get(d.testId || d.xrayId || d.ultrasoundId);
      return !orderLine || !orderLine.acknowledgedBy;
    });
    
    if (unacknowledged.length > 0) {
      return res.status(400).json({ 
        error: `Cannot close visit: ${unacknowledged.length} completed diagnostic(s) need acknowledgment` 
      });
    }
    
    // 3. Create/update invoice for cart items
    const cartItems = orderLines.filter((ol: any) => ol.addToCart);
    let invoiceStatus: 'open' | 'ready_to_bill' | 'closed' = 'closed';
    
    if (cartItems.length > 0) {
      // Create invoice
      try {
        await storage.generateInvoiceFromEncounter(encounterId, 'System');
        // Set status to ready_to_bill - clinical work complete, awaiting billing
        invoiceStatus = 'ready_to_bill';
      } catch (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        // Continue with closing even if invoice fails
      }
    }
    
    // 4. Close encounter
    const encounter = await storage.updateEncounter(encounterId, { 
      status: invoiceStatus,
      closedAt: new Date().toISOString() 
    });
    
    res.json(encounter);
  } catch (error) {
    console.error('Error closing encounter:', error);
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
    
    // Get all diagnostics for this patient
    const [labTests, xrays, ultrasounds] = await Promise.all([
      storage.getLabTestsByPatient(encounter.patientId),
      storage.getXrayExamsByPatient(encounter.patientId),
      storage.getUltrasoundExamsByPatient(encounter.patientId),
    ]);
    
    // Get all order lines for this encounter
    const orderLines = await storage.getOrderLinesByEncounter(encounterId);
    
    // Create a map of related_id to order line for quick lookup
    const orderLineMap = new Map(
      orderLines.map((ol: any) => [ol.relatedId || '', ol])
    );
    
    // Enrich diagnostics with acknowledgment data from order lines
    const enrichedLabTests = labTests.map((test: any) => ({
      ...test,
      orderLine: orderLineMap.get(test.testId),
    }));
    
    const enrichedXrays = xrays.map((xray: any) => ({
      ...xray,
      orderLine: orderLineMap.get(xray.xrayId),
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
    console.error('Error fetching diagnostics:', error);
    res.status(500).json({ error: "Failed to fetch diagnostics" });
  }
});

// Get unified orders for a visit (with flags, snippets, acknowledgment status)
router.get("/api/visits/:visitId/orders", async (req, res) => {
  try {
    const { visitId } = req.params;
    const encounter = await storage.getEncounterById(visitId);
    
    if (!encounter) {
      return res.status(404).json({ error: "Visit not found" });
    }
    
    console.log(`Getting orders for visit ${visitId}, patient ${encounter.patientId}`);
    
    // Get all diagnostics for this encounter
    const [labTests, xrays, ultrasounds] = await Promise.all([
      storage.getLabTestsByPatient(encounter.patientId),
      storage.getXrayExamsByPatient(encounter.patientId),
      storage.getUltrasoundExamsByPatient(encounter.patientId),
    ]);
    
    console.log(`Found ${labTests.length} lab tests, ${xrays.length} xrays, ${ultrasounds.length} ultrasounds for patient ${encounter.patientId}`);
    
    // Get order lines for this encounter
    const orderLines = await storage.getOrderLinesByEncounter(visitId);
    
    // Create a map of relatedId -> orderLine for quick lookup
    const orderLineMap = new Map(
      orderLines.map((ol: any) => [ol.relatedId || '', ol])
    );
    
    // Transform lab tests to unified order format
    const labOrders = labTests
      .map((test: any) => {
        const orderLine = orderLineMap.get(test.testId);
        return {
          ...test,
          orderId: orderLine?.id || `lab-${test.testId}`,
          visitId,
          type: 'lab',
          name: test.category || 'Lab Test',
          flags: test.clinicalSignificance || null,
          snippet: test.criticalFindings || test.interpretation || null,
          resultUrl: `/api/lab-tests/${test.testId}`,
          orderLine,
          acknowledgedAt: orderLine?.acknowledgedAt || null,
          acknowledgedBy: orderLine?.acknowledgedBy || null,
          addToCart: orderLine?.addToCart || false,
          isPaid: test.paymentStatus === 'paid',
        };
      });
    
    // Transform X-rays to unified order format
    const xrayOrders = xrays
      .map((xray: any) => {
        const orderLine = orderLineMap.get(xray.examId);
        return {
          ...xray,
          orderId: orderLine?.id || `xray-${xray.examId}`,
          visitId,
          type: 'xray',
          name: xray.examType || 'X-Ray',
          flags: null,
          snippet: xray.impression || null,
          resultUrl: `/api/xray-exams/${xray.examId}`,
          orderLine,
          acknowledgedAt: orderLine?.acknowledgedAt || null,
          acknowledgedBy: orderLine?.acknowledgedBy || null,
          addToCart: orderLine?.addToCart || false,
          isPaid: xray.paymentStatus === 'paid',
        };
      });
    
    // Transform ultrasounds to unified order format
    const ultrasoundOrders = ultrasounds
      .map((us: any) => {
        const orderLine = orderLineMap.get(us.examId);
        return {
          ...us,
          orderId: orderLine?.id || `ultrasound-${us.examId}`,
          visitId,
          type: 'ultrasound',
          name: us.examinationType || 'Ultrasound',
          flags: null,
          snippet: us.impression || null,
          resultUrl: `/api/ultrasound-exams/${us.examId}`,
          orderLine,
          acknowledgedAt: orderLine?.acknowledgedAt || null,
          acknowledgedBy: orderLine?.acknowledgedBy || null,
          addToCart: orderLine?.addToCart || false,
          isPaid: us.paymentStatus === 'paid',
        };
      });
    
    // Combine all orders
    const allOrders = [...labOrders, ...xrayOrders, ...ultrasoundOrders];
    
    res.json(allOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
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
    console.error('Error updating acknowledgment:', error);
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
    console.error('Error updating add to cart:', error);
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
      updates.acknowledgedBy = 'Current User'; // TODO: Get from auth session
      updates.acknowledgedAt = new Date().toISOString();
    } else {
      updates.acknowledgedBy = null;
      updates.acknowledgedAt = null;
    }
    
    const orderLine = await storage.updateOrderLine(orderId, updates);
    res.json({ acknowledged: !!orderLine.acknowledgedBy });
  } catch (error) {
    console.error('Error updating acknowledgment:', error);
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
    console.error('Error updating cart:', error);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// Order Lines
router.post("/api/order-lines", async (req, res) => {
  try {
    const result = insertOrderLineSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid order line data", details: result.error.errors });
    }
    
    const orderLine = await storage.createOrderLine(result.data);
    res.status(201).json(orderLine);
  } catch (error) {
    console.error('Error creating order line:', error);
    res.status(500).json({ error: "Failed to create order line" });
  }
});

router.get("/api/encounters/:encounterId/order-lines", async (req, res) => {
  try {
    const { encounterId } = req.params;
    const orderLines = await storage.getOrderLinesByEncounter(encounterId);
    res.json(orderLines);
  } catch (error) {
    console.error('Error fetching order lines:', error);
    res.status(500).json({ error: "Failed to fetch order lines" });
  }
});

router.put("/api/order-lines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const orderLine = await storage.updateOrderLine(id, req.body);
    res.json(orderLine);
  } catch (error) {
    console.error('Error updating order line:', error);
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
    console.error('Error fetching invoices:', error);
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
    
    // Get invoice lines
    const invoiceLines = await storage.getInvoiceLines(invoiceId);
    
    res.json({ invoice, invoiceLines });
  } catch (error) {
    console.error('Error fetching invoice:', error);
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
    
    const invoice = await storage.generateInvoiceFromEncounter(encounterId, generatedBy);
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

// Enhanced service creation endpoint for automatic encounter/order line creation
router.post("/api/services/:serviceType/auto-order", async (req, res) => {
  try {
    const { serviceType } = req.params;
    const { patientId, encounterId, serviceId, relatedId, attendingClinician } = req.body;
    
    // Create or get today's encounter for this patient
    let encounter;
    if (encounterId) {
      encounter = await storage.getEncounterById(encounterId);
    } else {
      // Create new encounter for today
      const today = new Date().toISOString().split('T')[0];
      encounter = await storage.createEncounter({
        patientId,
        visitDate: today,
        attendingClinician: attendingClinician || 'System',
      });
    }
    
    if (!encounter) {
      return res.status(404).json({ error: "Encounter not found or could not be created" });
    }
    
    // Get service details for price snapshot
    const services = await storage.getServices();
    const service = services.find(s => s.id === serviceId);
    
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    
    // Create order line
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
      orderedBy: attendingClinician || 'System',
    });
    
    res.status(201).json({ encounter, orderLine });
  } catch (error) {
    console.error('Error creating auto order:', error);
    res.status(500).json({ error: "Failed to create auto order" });
  }
});

// ==================== PHARMACY INVENTORY ROUTES ====================

// Drug Management - CRUD operations
router.get("/api/pharmacy/drugs", async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const drugs = await storage.getDrugs(activeOnly);
    res.json(drugs);
  } catch (error) {
    console.error('Error fetching drugs:', error);
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
    console.error('Error fetching drug:', error);
    res.status(500).json({ error: "Failed to fetch drug" });
  }
});

router.post("/api/pharmacy/drugs", async (req, res) => {
  try {
    const data = insertDrugSchema.parse(req.body);
    const drug = await storage.createDrug(data);
    res.status(201).json(drug);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid drug data", details: error.errors });
    }
    console.error('Error creating drug:', error);
    res.status(500).json({ error: "Failed to create drug" });
  }
});

router.put("/api/pharmacy/drugs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const drug = await storage.updateDrug(id, req.body);
    res.json(drug);
  } catch (error) {
    console.error('Error updating drug:', error);
    res.status(500).json({ error: "Failed to update drug" });
  }
});

// Batch Management
router.get("/api/pharmacy/batches", async (req, res) => {
  try {
    const drugId = req.query.drugId ? parseInt(req.query.drugId as string) : undefined;
    const batches = await storage.getDrugBatches(drugId);
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
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
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: "Failed to fetch batch" });
  }
});

router.post("/api/pharmacy/batches", async (req, res) => {
  try {
    const data = insertDrugBatchSchema.parse(req.body);
    const batch = await storage.createDrugBatch(data);
    res.status(201).json(batch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid batch data", details: error.errors });
    }
    console.error('Error creating batch:', error);
    res.status(500).json({ error: "Failed to create batch" });
  }
});

router.get("/api/pharmacy/batches/fefo/:drugId", async (req, res) => {
  try {
    const drugId = parseInt(req.params.drugId);
    const batches = await storage.getBatchesFEFO(drugId);
    res.json(batches);
  } catch (error) {
    console.error('Error fetching FEFO batches:', error);
    res.status(500).json({ error: "Failed to fetch FEFO batches" });
  }
});

// Inventory Ledger
router.get("/api/pharmacy/ledger", async (req, res) => {
  try {
    const drugId = req.query.drugId ? parseInt(req.query.drugId as string) : undefined;
    const batchId = req.query.batchId as string | undefined;
    const ledger = await storage.getInventoryLedger(drugId, batchId);
    res.json(ledger);
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ error: "Failed to fetch inventory ledger" });
  }
});

router.post("/api/pharmacy/ledger", async (req, res) => {
  try {
    const data = insertInventoryLedgerSchema.parse(req.body);
    const entry = await storage.createInventoryLedger(data);
    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid ledger data", details: error.errors });
    }
    console.error('Error creating ledger entry:', error);
    res.status(500).json({ error: "Failed to create ledger entry" });
  }
});

// Stock Queries
router.get("/api/pharmacy/stock/all", async (req, res) => {
  try {
    const drugsWithStock = await storage.getAllDrugsWithStock();
    res.json(drugsWithStock);
  } catch (error) {
    console.error('Error fetching all drugs with stock:', error);
    res.status(500).json({ error: "Failed to fetch drugs with stock levels" });
  }
});

router.get("/api/pharmacy/stock/:drugId", async (req, res) => {
  try {
    const drugId = parseInt(req.params.drugId);
    const stockLevel = await storage.getDrugStockLevel(drugId);
    res.json({ drugId, stockOnHand: stockLevel });
  } catch (error) {
    console.error('Error fetching stock level:', error);
    res.status(500).json({ error: "Failed to fetch stock level" });
  }
});

router.get("/api/pharmacy/alerts/low-stock", async (req, res) => {
  try {
    const lowStockDrugs = await storage.getLowStockDrugs();
    res.json(lowStockDrugs);
  } catch (error) {
    console.error('Error fetching low stock drugs:', error);
    res.status(500).json({ error: "Failed to fetch low stock drugs" });
  }
});

router.get("/api/pharmacy/alerts/expiring", async (req, res) => {
  try {
    const daysThreshold = req.query.days ? parseInt(req.query.days as string) : 90;
    const expiringDrugs = await storage.getExpiringSoonDrugs(daysThreshold);
    res.json(expiringDrugs);
  } catch (error) {
    console.error('Error fetching expiring drugs:', error);
    res.status(500).json({ error: "Failed to fetch expiring drugs" });
  }
});

// Dispense Operations
router.get("/api/pharmacy/prescriptions/paid", async (req, res) => {
  try {
    const prescriptions = await storage.getPaidPrescriptions();
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching paid prescriptions:', error);
    res.status(500).json({ error: "Failed to fetch paid prescriptions" });
  }
});

router.get("/api/pharmacy/prescriptions/dispensed", async (req, res) => {
  try {
    const prescriptions = await storage.getDispensedPrescriptions();
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching dispensed prescriptions:', error);
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
    console.error('Error dispensing drug:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to dispense drug" });
  }
});

export default router;

import { createServer } from 'http';
import { writeFileSync } from 'fs';
import path from 'path';
import { setupAuth } from './auth';

// Function to register routes with the express app
export async function registerRoutes(app: any) {
  setupAuth(app);
  app.use(router);
  
  // Return a basic HTTP server for compatibility
  return createServer(app);
}
