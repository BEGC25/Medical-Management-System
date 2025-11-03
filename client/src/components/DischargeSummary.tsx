import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Printer } from "lucide-react";
import clinicLogo from "@assets/Logo-Clinic_1762148237143.jpeg";

type Patient = any;
type Encounter = any;
type Treatment = any;
type LabTest = any;
type XrayExam = any;
type UltrasoundExam = any;
type PharmacyOrder = any;

interface DischargeSummaryProps {
  encounterId: string;
  patientId: string;
}

export function DischargeSummary({ encounterId, patientId }: DischargeSummaryProps) {
  const [open, setOpen] = useState(false);

  // Fetch patient data
  const { data: patient } = useQuery<Patient>({
    queryKey: ["/api/patients", patientId],
    queryFn: async () => {
      const r = await fetch(`/api/patients/${patientId}`);
      if (!r.ok) throw new Error("Failed to fetch patient");
      return r.json();
    },
    enabled: open,
  });

  // Fetch encounter data
  const { data: encounter } = useQuery<Encounter>({
    queryKey: ["/api/encounters", encounterId],
    queryFn: async () => {
      const r = await fetch(`/api/encounters/${encounterId}`);
      if (!r.ok) throw new Error("Failed to fetch encounter");
      return r.json();
    },
    enabled: open,
  });

  // Fetch treatment data
  const { data: treatment } = useQuery<Treatment | null>({
    queryKey: ["/api/treatments", "encounter", encounterId],
    queryFn: async () => {
      const r = await fetch(`/api/treatments?encounterId=${encounterId}`);
      if (!r.ok) return null;
      const data = await r.json();
      return data[0] || null;
    },
    enabled: open,
  });

  // Fetch lab tests
  const { data: labTests = [] } = useQuery<LabTest[]>({
    queryKey: ["/api/lab-tests", patientId],
    queryFn: async () => {
      const r = await fetch(`/api/lab-tests?patientId=${patientId}`);
      if (!r.ok) return [];
      const allTests = await r.json();
      // Filter to only tests from today's visit
      const visitDate = encounter?.visitDate || new Date().toISOString().split("T")[0];
      return allTests.filter((t: LabTest) => 
        t.requestedDate.startsWith(visitDate) || t.completedDate?.startsWith(visitDate)
      );
    },
    enabled: open && !!encounter,
  });

  // Fetch X-rays
  const { data: xrays = [] } = useQuery<XrayExam[]>({
    queryKey: ["/api/xrays", patientId],
    queryFn: async () => {
      const r = await fetch(`/api/xrays?patientId=${patientId}`);
      if (!r.ok) return [];
      const allXrays = await r.json();
      const visitDate = encounter?.visitDate || new Date().toISOString().split("T")[0];
      return allXrays.filter((x: XrayExam) => 
        x.requestedDate.startsWith(visitDate) || x.reportDate?.startsWith(visitDate)
      );
    },
    enabled: open && !!encounter,
  });

  // Fetch ultrasounds
  const { data: ultrasounds = [] } = useQuery<UltrasoundExam[]>({
    queryKey: ["/api/ultrasounds", patientId],
    queryFn: async () => {
      const r = await fetch(`/api/ultrasounds?patientId=${patientId}`);
      if (!r.ok) return [];
      const allUltrasounds = await r.json();
      const visitDate = encounter?.visitDate || new Date().toISOString().split("T")[0];
      return allUltrasounds.filter((u: UltrasoundExam) => 
        u.requestedDate.startsWith(visitDate) || u.reportDate?.startsWith(visitDate)
      );
    },
    enabled: open && !!encounter,
  });

  // Fetch pharmacy orders
  const { data: pharmacyOrders = [] } = useQuery<PharmacyOrder[]>({
    queryKey: ["/api/pharmacy-orders", patientId],
    queryFn: async () => {
      const r = await fetch(`/api/pharmacy-orders/${patientId}`);
      if (!r.ok) return [];
      const allOrders = await r.json();
      return allOrders.filter((o: PharmacyOrder) => o.encounterId === encounterId);
    },
    enabled: open,
  });

  const handlePrint = () => {
    const printContent = document.getElementById("discharge-summary-print");
    if (!printContent) return;

    const win = window.open("", "_blank");
    if (!win) return;

    const html = printContent.innerHTML;
    win.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Discharge Summary - ${patient?.patientId || ""}</title>
        <style>
          @media print {
            body { margin: 0; }
            .summary-container {
              width: 210mm;
              padding: 12mm 15mm;
              box-sizing: border-box;
            }
          }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #111;
            line-height: 1.4;
            font-size: 11pt;
          }
          h1 { font-size: 16pt; margin: 0 0 8px 0; border-bottom: 2px solid #0066CC; padding-bottom: 4px; }
          h2 { font-size: 12pt; color: #0066CC; margin: 10px 0 4px 0; font-weight: 600; }
          h3 { font-size: 11pt; font-weight: 600; margin: 6px 0 3px 0; }
          .header { text-align: center; margin-bottom: 12px; }
          .header h1 { border: none; }
          .header p { font-size: 10pt; color: #666; margin: 0; }
          .info-row { margin: 3px 0; font-size: 10pt; }
          .info-row strong { font-weight: 600; color: #333; }
          .section { margin-bottom: 10px; page-break-inside: avoid; }
          .medication-item { padding: 6px; background: #f8f9fa; border-left: 2px solid #0066CC; margin-bottom: 4px; font-size: 10pt; }
          .medication-item strong { font-weight: 600; }
          .warning-box { background: #fff3cd; border: 1px solid #ffc107; padding: 8px; margin: 8px 0; border-radius: 3px; }
          .warning-box strong { font-weight: 600; margin-bottom: 4px; display: block; }
          .test-result { padding: 4px; margin-bottom: 3px; border-left: 2px solid #28a745; background: #f8f9fa; font-size: 10pt; }
          .signature-line { margin-top: 15px; border-top: 1px solid #000; width: 250px; padding-top: 4px; font-size: 10pt; }
          ul { margin: 4px 0; padding-left: 20px; }
          li { margin-bottom: 2px; font-size: 10pt; }
          .compact-grid { display: flex; flex-wrap: wrap; gap: 15px; margin: 6px 0; }
          .compact-item { font-size: 10pt; }
          .footer-note { margin-top: 12px; padding-top: 6px; border-top: 1px solid #ddd; text-align: center; font-size: 9pt; color: #666; }
        </style>
      </head>
      <body>
        <div class="summary-container">${html}</div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };

  // Helper to parse lab test results
  const getLabSummary = (test: LabTest) => {
    if (!test.results) return "Results pending";
    
    try {
      const results = JSON.parse(test.results);
      if (Array.isArray(results)) {
        return results.map((r: any) => `${r.test}: ${r.value} ${r.unit || ""}`).join(", ");
      }
      return test.results;
    } catch {
      return test.results;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-md hover:shadow-lg transition-all" data-testid="button-discharge-summary">
          <FileText className="w-4 h-4 mr-2" />
          Discharge Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Patient Discharge Summary</span>
            <Button onClick={handlePrint} size="sm" data-testid="button-print-discharge">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div id="discharge-summary-print" className="space-y-2">
          {/* Header - Modern Professional with Logo */}
          <div className="header" style={{ borderBottom: "2px solid #0066CC", paddingBottom: "12px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img src={clinicLogo} alt="Clinic Logo" style={{ height: "60px", width: "60px", objectFit: "contain" }} />
                <div>
                  <h1 style={{ margin: 0, color: "#0066CC", fontSize: "20pt" }}>Bahr El Ghazal Clinic</h1>
                  <p style={{ margin: 0, fontSize: "9pt", color: "#666" }}>Comprehensive Healthcare Services</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "14pt", fontWeight: "600", color: "#333" }}>Patient Discharge Summary</p>
                <p style={{ margin: 0, fontSize: "9pt", color: "#666" }}>{new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Patient Information - Compact Inline */}
          <div className="section">
            <h2>Patient Information</h2>
            <div className="compact-grid">
              <span className="compact-item"><strong>Name:</strong> {patient?.firstName} {patient?.lastName}</span>
              <span className="compact-item"><strong>ID:</strong> {patient?.patientId}</span>
              <span className="compact-item"><strong>Age:</strong> {patient?.age || "N/A"}</span>
              <span className="compact-item"><strong>Gender:</strong> {patient?.gender || "N/A"}</span>
              {patient?.village && <span className="compact-item"><strong>Village:</strong> {patient.village}</span>}
              {patient?.phoneNumber && <span className="compact-item"><strong>Phone:</strong> {patient.phoneNumber}</span>}
            </div>
          </div>

          {/* Visit Information - Compact Inline */}
          <div className="section">
            <h2>Visit Details</h2>
            <div className="compact-grid">
              <span className="compact-item">
                <strong>Date:</strong> {encounter?.visitDate ? new Date(encounter.visitDate).toLocaleDateString() : "Today"}
              </span>
              <span className="compact-item" style={{ textTransform: "capitalize" }}>
                <strong>Type:</strong> {treatment?.visitType || "Consultation"}
              </span>
              <span className="compact-item">
                <strong>Location:</strong> Bahr El Ghazal, South Sudan
              </span>
            </div>
          </div>

          {/* Diagnosis */}
          {treatment?.diagnosis && (
            <div className="section">
              <h2>Diagnosis</h2>
              <p style={{ padding: "0.75rem", background: "#f8f9fa", borderRadius: "4px" }}>
                {treatment.diagnosis}
              </p>
            </div>
          )}

          {/* Chief Complaint */}
          {treatment?.chiefComplaint && (
            <div className="section">
              <h2>Reason for Visit</h2>
              <p style={{ padding: "0.75rem", background: "#f8f9fa", borderRadius: "4px" }}>
                {treatment.chiefComplaint}
              </p>
            </div>
          )}

          {/* Treatment Provided */}
          {treatment?.treatmentPlan && (
            <div className="section">
              <h2>Treatment Provided</h2>
              <p style={{ padding: "0.75rem", background: "#f8f9fa", borderRadius: "4px", whiteSpace: "pre-wrap" }}>
                {treatment.treatmentPlan}
              </p>
            </div>
          )}

          {/* Medications */}
          {pharmacyOrders.length > 0 && (
            <div className="section">
              <h2>Medications Prescribed</h2>
              <p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.5rem" }}>
                Take these medications as directed below:
              </p>
              {pharmacyOrders.map((order, idx) => (
                <div key={order.id} className="medication-item">
                  <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                    {idx + 1}. {order.drugName}
                  </div>
                  {order.dosage && (
                    <div style={{ fontSize: "0.875rem", color: "#555" }}>
                      <strong>Dosage:</strong> {order.dosage}
                    </div>
                  )}
                  {order.instructions && (
                    <div style={{ fontSize: "0.875rem", color: "#555" }}>
                      <strong>Instructions:</strong> {order.instructions}
                    </div>
                  )}
                  <div style={{ fontSize: "0.875rem", color: "#555" }}>
                    <strong>Quantity:</strong> {order.quantity} {order.quantity === 1 ? "unit" : "units"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Test Results Summary */}
          {(labTests.length > 0 || xrays.length > 0 || ultrasounds.length > 0) && (
            <div className="section">
              <h2>Test Results Summary</h2>
              
              {labTests.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h3>Laboratory Tests</h3>
                  {labTests.map((test) => (
                    <div key={test.id} className="test-result">
                      <div style={{ fontWeight: "600" }}>
                        {test.category.charAt(0).toUpperCase() + test.category.slice(1)} Tests
                      </div>
                      <div style={{ fontSize: "0.875rem" }}>
                        {test.status === "completed" ? getLabSummary(test) : "Results pending"}
                      </div>
                      {test.technicianNotes && (
                        <div style={{ fontSize: "0.875rem", color: "#555", marginTop: "0.25rem" }}>
                          Note: {test.technicianNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {xrays.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h3>X-Ray Results</h3>
                  {xrays.map((xray) => (
                    <div key={xray.id} className="test-result">
                      <div style={{ fontWeight: "600" }}>
                        {xray.examType.charAt(0).toUpperCase() + xray.examType.slice(1)} X-Ray
                        {xray.bodyPart && ` - ${xray.bodyPart}`}
                      </div>
                      {xray.impression && (
                        <div style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                          <strong>Impression:</strong> {xray.impression}
                        </div>
                      )}
                      {xray.status === "pending" && (
                        <div style={{ fontSize: "0.875rem", color: "#666" }}>Results pending</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {ultrasounds.length > 0 && (
                <div>
                  <h3>Ultrasound Results</h3>
                  {ultrasounds.map((us) => (
                    <div key={us.id} className="test-result">
                      <div style={{ fontWeight: "600" }}>
                        {us.examType.charAt(0).toUpperCase() + us.examType.slice(1)} Ultrasound
                      </div>
                      {us.impression && (
                        <div style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                          <strong>Impression:</strong> {us.impression}
                        </div>
                      )}
                      {us.status === "pending" && (
                        <div style={{ fontSize: "0.875rem", color: "#666" }}>Results pending</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Follow-up Instructions */}
          {treatment?.followUpDate && (
            <div className="section">
              <h2>Follow-up Appointment</h2>
              <div style={{ padding: "0.75rem", background: "#e3f2fd", borderLeft: "3px solid #0066CC", borderRadius: "4px" }}>
                <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                  Return to clinic on: {new Date(treatment.followUpDate).toLocaleDateString()}
                </div>
                {treatment.followUpType && (
                  <div style={{ fontSize: "0.875rem", color: "#555" }}>
                    Purpose: {treatment.followUpType}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning Signs */}
          <div className="section">
            <h2>When to Return to Clinic Immediately</h2>
            <div className="warning-box">
              <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                Come back to the clinic right away if you have any of these problems:
              </p>
              <ul>
                <li>High fever (very hot body) that won't go down</li>
                <li>Severe pain that gets worse</li>
                <li>Difficulty breathing</li>
                <li>Heavy bleeding</li>
                <li>Cannot eat or drink anything</li>
                <li>Confusion or cannot wake up</li>
                <li>Any new serious symptoms</li>
              </ul>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="section">
            <h2>Clinic Contact</h2>
            <div className="info-item">
              <p style={{ marginBottom: "0.25rem" }}>
                <strong>Bahr El Ghazal Clinic</strong>
              </p>
              <p style={{ fontSize: "0.875rem", color: "#555" }}>
                For emergencies or questions, return to the clinic during operating hours.
              </p>
            </div>
          </div>

          {/* Signature */}
          <div className="section" style={{ marginTop: "15px" }}>
            <div className="signature-line">
              <div style={{ fontSize: "10pt", color: "#555" }}>Doctor's Signature</div>
              <div style={{ marginTop: "4px", fontWeight: "500" }}>
                {encounter?.attendingClinician || "Medical Officer"}
              </div>
              <div style={{ fontSize: "10pt", color: "#555" }}>
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer-note">
            <p style={{ margin: "0 0 3px 0" }}>Keep this document for your records. Bring it with you on your next visit.</p>
            <p style={{ margin: 0 }}>Document ID: {encounterId} | Patient ID: {patient?.patientId}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
