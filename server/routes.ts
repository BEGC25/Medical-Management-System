import express from "express";
import { z } from "zod";
import { storage } from "./storage";
import { insertPatientSchema, insertTreatmentSchema, insertLabTestSchema, insertXrayExamSchema } from "@shared/schema";

const router = express.Router();

// Patients
router.get("/api/patients", async (req, res) => {
  try {
    const search = req.query.search as string;
    const patients = await storage.getPatients(search);
    res.json(patients);
  } catch (error) {
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
    const treatments = await storage.getTreatments(limit);
    res.json(treatments);
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
    const data = insertLabTestSchema.parse(req.body);
    const labTest = await storage.createLabTest(data);
    res.status(201).json(labTest);
  } catch (error) {
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
    const xrayExams = await storage.getXrayExams(status);
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

// Dashboard
router.get("/api/dashboard/stats", async (req, res) => {
  try {
    console.log("Dashboard stats route called");
    const stats = await storage.getDashboardStats();
    console.log("Dashboard stats result:", stats);
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats route error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats", details: error.message });
  }
});

router.get("/api/dashboard/recent-patients", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const patients = await storage.getRecentPatients(limit);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent patients" });
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
