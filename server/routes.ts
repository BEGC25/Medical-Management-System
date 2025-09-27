import express from "express";
import { z } from "zod";
import { storage } from "./storage";
import { insertPatientSchema, insertTreatmentSchema, insertLabTestSchema, insertXrayExamSchema, insertUltrasoundExamSchema, insertPharmacyOrderSchema } from "@shared/schema";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

const router = express.Router();

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
    const labTests = await storage.getLabTests(status);
    res.json(labTests);
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    res.status(500).json({ error: "Failed to fetch lab tests" });
  }
});

router.get("/api/patients/:patientId/lab-tests", async (req, res) => {
  try {
    const labTests = await storage.getLabTestsByPatient(req.params.patientId);
    res.json(labTests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lab tests" });
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
    res.status(500).json({ error: "Failed to fetch X-ray exams" });
  }
});

router.get("/api/patients/:patientId/xray-exams", async (req, res) => {
  try {
    const xrayExams = await storage.getXrayExamsByPatient(req.params.patientId);
    res.json(xrayExams);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch X-ray exams" });
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
    const status = req.query.status as string;
    const ultrasoundExams = await storage.getUltrasoundExams(status);
    res.json(ultrasoundExams);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ultrasound exams" });
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
      await storage.createPaymentItem({
        paymentId: payment.paymentId,
        serviceId: item.serviceId,
        relatedId: item.relatedId,
        relatedType: item.relatedType,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * (item.quantity || 1),
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
    const status = req.query.status as string;
    const pharmacyOrders = await storage.getPharmacyOrders(status);
    res.json(pharmacyOrders);
  } catch (error) {
    console.error('Error in pharmacy orders route:', error);
    res.status(500).json({ error: "Failed to fetch pharmacy orders" });
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

export default router;

import { createServer } from 'http';
import { writeFileSync } from 'fs';
import path from 'path';

// Function to register routes with the express app
export async function registerRoutes(app: any) {
  app.use(router);
  
  // Return a basic HTTP server for compatibility
  return createServer(app);
}
