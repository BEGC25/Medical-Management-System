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

// Helper functions for formatting
function capitalizeExamType(type: string): string {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(date);
  }
}

function formatShortDate(date: string | number | Date | null | undefined): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  } catch {
    return String(date);
  }
}

function formatLongDate(date: string | number | Date | null | undefined): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return String(date);
  }
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

  // Fetch ALL orders for this encounter (lab, xray, ultrasound) - this is the authoritative source
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/visits", encounterId, "orders"],
    queryFn: async () => {
      const r = await fetch(`/api/visits/${encounterId}/orders`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: open,
  });

  // Filter orders by type
  const labTests = orders.filter((o) => o.type === "lab" && o.status === "completed");
  const xrays = orders.filter((o) => o.type === "xray" && o.status === "completed");
  const ultrasounds = orders.filter((o) => o.type === "ultrasound" && o.status === "completed");

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
            body * { visibility: hidden; }
            #discharge-summary-print, #discharge-summary-print * { visibility: visible; }
            #discharge-summary-print { position: absolute; left: 0; top: 0; width: 100%; max-height: 273mm; overflow: hidden; }
            @page { size: A4; margin: 12mm 15mm; }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #111;
            line-height: 1.4;
            font-size: 10pt;
          }
          .discharge-container {
            border: 2px solid #d1d5db;
            border-radius: 8px;
            padding: 24px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          .clinic-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 16px;
          }
          .clinic-info h1 {
            font-size: 24pt;
            font-weight: 700;
            color: #1e3a8a;
            margin: 0;
            line-height: 1.2;
          }
          .tagline {
            font-size: 11pt;
            color: #6b7280;
            font-style: italic;
            margin: 4px 0;
          }
          .clinic-info p {
            font-size: 9pt;
            color: #6b7280;
            margin: 2px 0;
          }
          .logo {
            width: 100px;
            height: 100px;
            object-fit: contain;
          }
          .title-bar {
            background: linear-gradient(to right, #1e3a8a, #1e40af);
            color: white;
            text-align: center;
            padding: 12px;
            font-size: 14pt;
            font-weight: bold;
            letter-spacing: 1px;
            margin: 16px 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          .info-box {
            border: 1px solid #d1d5db;
            border-radius: 4px;
            overflow: hidden;
          }
          .box-title {
            background: #f9fafb;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 10pt;
            border-bottom: 1px solid #1e3a8a;
            letter-spacing: 0.5px;
            color: #1f2937;
          }
          .box-content {
            padding: 12px;
            background: #fef3c7;
          }
          .box-content.white {
            background: #f9fafb;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 9pt;
          }
          .row span:first-child {
            font-weight: 600;
            color: #4b5563;
          }
          .row span:last-child {
            font-weight: 500;
            color: #111827;
          }
          .section-box {
            border: 1px solid #d1d5db;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 12px;
          }
          .section-title {
            background: #f9fafb;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 10pt;
            border-bottom: 2px solid #9ca3af;
            letter-spacing: 0.5px;
            margin: 0;
            color: #1f2937;
          }
          .section-content {
            padding: 12px;
            font-size: 9pt;
            line-height: 1.5;
            margin: 0;
            background: white;
          }
          .medication-item {
            padding: 6px 8px;
            background: #f9fafb;
            border-left: 2px solid #1e3a8a;
            margin-bottom: 4px;
            font-size: 9pt;
          }
          .medication-item strong {
            font-weight: 600;
            display: block;
            margin-bottom: 2px;
          }
          .medication-item div {
            font-size: 8pt;
            color: #6b7280;
            margin-top: 2px;
          }
          .test-result {
            padding: 6px 8px;
            margin-bottom: 4px;
            border-left: 2px solid #059669;
            background: #f9fafb;
            font-size: 9pt;
          }
          .warning-box {
            border: 2px solid #f59e0b;
            background: #fffbeb;
            border-radius: 4px;
            padding: 12px;
            margin: 12px 0;
          }
          .warning-title {
            color: #b45309;
            font-weight: bold;
            margin: 0 0 8px 0;
            font-size: 10pt;
          }
          .warning-box ul {
            margin: 0;
            padding-left: 20px;
            font-size: 9pt;
          }
          .warning-box li {
            margin-bottom: 4px;
          }
          .signature-section {
            margin-top: 24px;
            margin-bottom: 16px;
          }
          .signature-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 48px;
          }
          .signature-block {
            margin-top: 40px;
          }
          .signature-line {
            border-top: 2px solid #1f2937;
            padding-top: 8px;
            margin-bottom: 4px;
          }
          .signature-label {
            font-size: 10pt;
            font-weight: bold;
            margin: 0;
            color: #1f2937;
          }
          .signature-sublabel {
            font-size: 8pt;
            color: #6b7280;
            margin: 2px 0 0 0;
          }
          .footer {
            text-align: center;
            font-size: 9pt;
            color: #6b7280;
            border-top: 2px solid #d1d5db;
            padding-top: 12px;
            margin-top: 16px;
          }
          .footer-notice {
            font-weight: 600;
            color: #4b5563;
            letter-spacing: 0.5px;
            margin: 0 0 6px 0;
          }
          .footer-clinic {
            font-weight: 600;
            color: #1f2937;
            margin: 6px 0;
          }
          .footer-accreditation {
            margin: 4px 0;
          }
          .footer-tagline {
            font-style: italic;
            margin: 6px 0 0 0;
          }
        </style>
      </head>
      <body>
        ${html}
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

  // Helper to parse and format lab test results professionally
  const getLabSummary = (test: LabTest) => {
    if (!test.results) return null;
    
    try {
      const results = JSON.parse(test.results);
      
      // If results is an array of test objects
      if (Array.isArray(results)) {
        return results.map((r: any, idx: number) => (
          <div key={idx} style={{ marginBottom: "4px", paddingLeft: "8px" }}>
            <span style={{ fontWeight: "600" }}>{r.test}:</span>{" "}
            <span>{r.value} {r.unit || ""}</span>
            {r.interpretation && (
              <span style={{ color: "#d32f2f", marginLeft: "4px" }}>({r.interpretation})</span>
            )}
          </div>
        ));
      }
      
      // If results is an object (structured test results)
      if (typeof results === "object" && !Array.isArray(results)) {
        return Object.entries(results).map(([testName, testData]: [string, any], idx: number) => (
          <div key={idx} style={{ marginBottom: "6px", paddingLeft: "8px" }}>
            <div style={{ fontWeight: "600", color: "#0066CC", marginBottom: "2px" }}>{testName}</div>
            {typeof testData === "object" ? (
              Object.entries(testData).map(([key, value]: [string, any], subIdx: number) => (
                <div key={subIdx} style={{ paddingLeft: "12px", fontSize: "0.875rem", marginBottom: "1px" }}>
                  <span style={{ fontWeight: "500" }}>{key}:</span> <span>{String(value)}</span>
                </div>
              ))
            ) : (
              <div style={{ paddingLeft: "12px", fontSize: "0.875rem" }}>{String(testData)}</div>
            )}
          </div>
        ));
      }
      
      return <div>{test.results}</div>;
    } catch {
      return <div>{test.results}</div>;
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

        <div id="discharge-summary-print">
          <div className="discharge-container">
            {/* Premium Header - Matches Invoice/X-Ray */}
            <div className="clinic-header">
              <div className="clinic-info">
                <h1>Bahr El Ghazal Clinic</h1>
                <p className="tagline">Excellence in Healthcare</p>
                <p>Aweil, South Sudan</p>
                <p>Tel: +211916759060/+211928754760</p>
                <p>Email: bahr.ghazal.clinic@gmail.com</p>
              </div>
              <img src={clinicLogo} alt="Clinic Logo" className="logo" />
            </div>

            {/* Navy Blue Title Bar */}
            <div className="title-bar">
              PATIENT DISCHARGE SUMMARY
            </div>

            {/* Patient & Visit Information - Two Column Boxes */}
            <div className="info-grid">
              <div className="info-box">
                <h3 className="box-title">PATIENT INFORMATION</h3>
                <div className="box-content">
                  <div className="row">
                    <span>Name:</span>
                    <span>{patient?.firstName} {patient?.lastName}</span>
                  </div>
                  <div className="row">
                    <span>Patient ID:</span>
                    <span>{patient?.patientId}</span>
                  </div>
                  <div className="row">
                    <span>Age:</span>
                    <span>{patient?.age || "N/A"}</span>
                  </div>
                  <div className="row">
                    <span>Gender:</span>
                    <span>{patient?.gender || "N/A"}</span>
                  </div>
                  <div className="row">
                    <span>Phone:</span>
                    <span>{patient?.phoneNumber || "N/A"}</span>
                  </div>
                </div>
              </div>
              <div className="info-box">
                <h3 className="box-title">VISIT DETAILS</h3>
                <div className="box-content white">
                  <div className="row">
                    <span>Date:</span>
                    <span>{formatLongDate(encounter?.visitDate || new Date())}</span>
                  </div>
                  <div className="row">
                    <span>Type:</span>
                    <span>{treatment?.visitType || "Consultation"}</span>
                  </div>
                  <div className="row">
                    <span>Location:</span>
                    <span>Bahr El Ghazal</span>
                  </div>
                  <div className="row">
                    <span>Visit ID:</span>
                    <span>{encounter?.encounterId}</span>
                  </div>
                  {encounter?.attendingClinician && (
                    <div className="row">
                      <span>Clinician:</span>
                      <span>{encounter.attendingClinician}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Diagnosis - Bordered Box */}
          {treatment?.diagnosis && (
            <div className="section-box">
              <h3 className="section-title">DIAGNOSIS</h3>
              <p className="section-content">{treatment.diagnosis}</p>
            </div>
          )}

          {/* Reason for Visit - Bordered Box */}
          {treatment?.chiefComplaint && (
            <div className="section-box">
              <h3 className="section-title">REASON FOR VISIT</h3>
              <p className="section-content">{treatment.chiefComplaint}</p>
            </div>
          )}

          {/* Treatment Provided - Bordered Box */}
          {treatment?.treatmentPlan && (
            <div className="section-box">
              <h3 className="section-title">TREATMENT PROVIDED</h3>
              <p className="section-content" style={{ whiteSpace: "pre-wrap" }}>{treatment.treatmentPlan}</p>
            </div>
          )}

          {/* Two-Column Layout: Medications & Test Results */}
          {(pharmacyOrders.length > 0 || labTests.length > 0 || xrays.length > 0 || ultrasounds.length > 0) && (
            <div className="info-grid">
              {/* Left Column - Medications */}
              {pharmacyOrders.length > 0 && (
                <div className="info-box">
                  <h3 className="box-title">MEDICATIONS PRESCRIBED</h3>
                  <div className="box-content white">
                    {pharmacyOrders.map((order, idx) => (
                      <div key={order.id} className="medication-item">
                        <strong>{idx + 1}. {order.drugName}</strong>
                        {order.dosage && <div>{order.dosage}</div>}
                        {order.instructions && <div>{order.instructions}</div>}
                        <div>Qty: {order.quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Right Column - Test Results */}
              {(labTests.length > 0 || xrays.length > 0 || ultrasounds.length > 0) && (
                <div className="info-box">
                  <h3 className="box-title">TEST RESULTS SUMMARY</h3>
                  <div className="box-content white">
                    {/* Lab Tests */}
                    {labTests.length > 0 && (
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontWeight: "600", fontSize: "9pt", marginBottom: "4px", color: "#d97706" }}>
                          🔬 Laboratory Tests
                        </div>
                        {labTests.map((test) => {
                          const testsOrdered = test.testsOrdered ? JSON.parse(test.testsOrdered) : [];
                          return (
                            <div key={test.id} className="test-result" style={{ borderLeft: "2px solid #d97706" }}>
                              {testsOrdered.length > 0 && (
                                <div style={{ fontWeight: "600", fontSize: "8pt", marginBottom: "2px" }}>
                                  {testsOrdered.join(", ")}
                                </div>
                              )}
                              {test.status === "completed" && (
                                <div style={{ fontSize: "8pt" }}>
                                  {getLabSummary(test)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* X-Rays */}
                    {xrays.length > 0 && (
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontWeight: "600", fontSize: "9pt", marginBottom: "4px", color: "#8b5cf6" }}>
                          📷 X-Ray Results
                        </div>
                        {xrays.map((xray) => (
                          <div key={xray.id} className="test-result" style={{ borderLeft: "2px solid #8b5cf6" }}>
                            <div style={{ fontWeight: "600", fontSize: "8pt" }}>
                              {xray.bodyPart}: {xray.impression || xray.findings || "Completed"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ultrasounds */}
                    {ultrasounds.length > 0 && (
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "9pt", marginBottom: "4px", color: "#0ea5e9" }}>
                          🔊 Ultrasound Results
                        </div>
                        {ultrasounds.map((us) => (
                          <div key={us.id} className="test-result" style={{ borderLeft: "2px solid #0ea5e9" }}>
                            <div style={{ fontWeight: "600", fontSize: "8pt" }}>
                              {us.examType}: {us.impression || us.findings || "Completed"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Follow-up Instructions */}
          {treatment?.followUpDate && (
            <div className="section-box">
              <h3 className="section-title">FOLLOW-UP APPOINTMENT</h3>
              <div className="section-content">
                <div style={{ fontWeight: "600" }}>
                  Return on: {formatLongDate(treatment.followUpDate)}
                </div>
                {treatment.followUpType && <div>Type: {treatment.followUpType}</div>}
              </div>
            </div>
          )}

          {/* Warning Box */}
          <div className="warning-box">
            <h3 className="warning-title">⚠️ RETURN TO CLINIC IF</h3>
            <ul>
              <li>High fever (very hot body)</li>
              <li>Severe pain or difficulty breathing</li>
              <li>Heavy bleeding</li>
              <li>Cannot eat/drink or confusion</li>
            </ul>
          </div>

          {/* Signature Section - Matches Invoice */}
          <div className="signature-section">
            <div className="signature-row">
              <div className="signature-block">
                <div className="signature-line"></div>
                <p className="signature-label">Doctor's Signature</p>
                <p className="signature-sublabel">{encounter?.attendingClinician || "Medical Officer"}</p>
              </div>
              <div className="signature-block">
                <div className="signature-line"></div>
                <p className="signature-label">Date</p>
                <p className="signature-sublabel">{formatLongDate(encounter?.visitDate || new Date())}</p>
              </div>
            </div>
          </div>

          {/* Professional Footer - Matches Invoice */}
          <div className="footer">
            <p className="footer-notice">THIS IS A COMPUTER-GENERATED DISCHARGE SUMMARY</p>
            <p className="footer-clinic">Bahr El Ghazal Clinic</p>
            <p className="footer-accreditation">Accredited Medical Facility | Republic of South Sudan</p>
            <p className="footer-tagline">Your health is our priority</p>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
