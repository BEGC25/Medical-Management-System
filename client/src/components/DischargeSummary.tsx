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
            body { margin: 0; }
            .summary-container {
              width: 210mm;
              padding: 8mm 12mm;
              box-sizing: border-box;
            }
          }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #111;
            line-height: 1.4;
            font-size: 10pt;
          }
          h1 { font-size: 14pt; margin: 0; font-weight: 700; }
          h2 { 
            font-size: 11pt; 
            color: #0066CC; 
            margin: 8px 0 4px 0; 
            font-weight: 700; 
            padding: 4px 6px;
            background: #e3f2fd;
            border-left: 3px solid #0066CC;
          }
          h3 { font-size: 10pt; font-weight: 600; margin: 4px 0 2px 0; }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 8px; 
            padding-bottom: 6px;
            border-bottom: 2px solid #0066CC;
          }
          .header-left { display: flex; align-items: center; gap: 8px; }
          .header-left img { height: 45px; width: 45px; object-fit: contain; }
          .header-left h1 { color: #0066CC; font-size: 14pt; margin: 0; }
          .header-right { text-align: right; }
          .header-right p { margin: 0; font-size: 9pt; color: #666; }
          .inline-info { font-size: 9pt; margin: 4px 0; }
          .section { margin-bottom: 8px; page-break-inside: avoid; }
          .two-column-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 8px 0;
          }
          .column { min-width: 0; }
          .medication-item { padding: 4px 6px; background: #f8f9fa; border-left: 2px solid #0066CC; margin-bottom: 3px; font-size: 9pt; }
          .medication-item strong { font-weight: 600; }
          .warning-box { 
            background: #fff9e6; 
            border: 2px solid #ffc107; 
            padding: 6px 8px; 
            margin: 8px 0; 
          }
          .warning-box strong { font-weight: 700; margin-bottom: 3px; display: block; color: #ff6b00; font-size: 9pt; }
          .warning-box ul { margin: 3px 0; padding-left: 18px; font-size: 9pt; }
          .warning-box li { margin-bottom: 1px; }
          .test-result { padding: 3px 4px; margin-bottom: 2px; border-left: 2px solid #28a745; background: #f8f9fa; font-size: 9pt; }
          .footer-section { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-top: 8px; 
            padding-top: 6px; 
            border-top: 1px solid #ddd; 
            font-size: 9pt;
          }
          .signature-row { display: flex; gap: 40px; }
          .clinic-contact { text-align: right; color: #666; }
          ul { margin: 3px 0; padding-left: 16px; }
          li { margin-bottom: 1px; font-size: 9pt; }
          p { margin: 4px 0; font-size: 10pt; }
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

        <div id="discharge-summary-print" className="space-y-2">
          {/* Compact Header - Logo + Clinic on Left, Title on Right */}
          <div className="header">
            <div className="header-left">
              <img src={clinicLogo} alt="Clinic Logo" style={{ height: "45px", width: "45px", objectFit: "contain" }} />
              <div>
                <h1>Bahr El Ghazal Clinic</h1>
                <p style={{ margin: 0, fontSize: "8pt", color: "#666" }}>Your health is our priority</p>
              </div>
            </div>
            <div className="header-right">
              <p style={{ fontSize: "12pt", fontWeight: "600", color: "#333", margin: 0 }}>DISCHARGE SUMMARY</p>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Patient & Visit Information - Single Inline Row */}
          <div className="section">
            <div className="inline-info">
              <strong>Patient:</strong> {patient?.firstName} {patient?.lastName} | 
              <strong> ID:</strong> {patient?.patientId} | 
              <strong> Age:</strong> {patient?.age || "N/A"} | 
              <strong> Gender:</strong> {patient?.gender || "N/A"} | 
              <strong> Phone:</strong> {patient?.phoneNumber || "N/A"}
            </div>
            <div className="inline-info">
              <strong>Visit:</strong> {encounter?.visitDate ? new Date(encounter.visitDate).toLocaleDateString() : "Today"} | 
              <strong> Type:</strong> {treatment?.visitType || "Consultation"} | 
              <strong> Location:</strong> Bahr El Ghazal, South Sudan
            </div>
          </div>

          {/* Diagnosis */}
          {treatment?.diagnosis && (
            <div className="section">
              <h2>Diagnosis</h2>
              <p style={{ padding: "4px 6px", background: "#f8f9fa", margin: "2px 0" }}>
                {treatment.diagnosis}
              </p>
            </div>
          )}

          {/* Chief Complaint */}
          {treatment?.chiefComplaint && (
            <div className="section">
              <h2>Reason for Visit</h2>
              <p style={{ padding: "4px 6px", background: "#f8f9fa", margin: "2px 0" }}>
                {treatment.chiefComplaint}
              </p>
            </div>
          )}

          {/* Treatment Provided */}
          {treatment?.treatmentPlan && (
            <div className="section">
              <h2>Treatment Provided</h2>
              <p style={{ padding: "4px 6px", background: "#f8f9fa", margin: "2px 0", whiteSpace: "pre-wrap" }}>
                {treatment.treatmentPlan}
              </p>
            </div>
          )}

          {/* Two-Column Layout: Medications & Test Results */}
          {(pharmacyOrders.length > 0 || labTests.length > 0 || xrays.length > 0 || ultrasounds.length > 0) && (
            <div className="two-column-grid">
              {/* Left Column - Medications */}
              {pharmacyOrders.length > 0 && (
                <div className="column">
                  <h2>Medications Prescribed</h2>
                  {pharmacyOrders.map((order, idx) => (
                    <div key={order.id} className="medication-item">
                      <div style={{ fontWeight: "600", marginBottom: "1px" }}>
                        {idx + 1}. {order.drugName}
                      </div>
                      {order.dosage && (
                        <div style={{ fontSize: "8pt", color: "#555" }}>
                          {order.dosage}
                        </div>
                      )}
                      {order.instructions && (
                        <div style={{ fontSize: "8pt", color: "#555" }}>
                          {order.instructions}
                        </div>
                      )}
                      <div style={{ fontSize: "8pt", color: "#555" }}>
                        Qty: {order.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Right Column - Test Results */}
              {(labTests.length > 0 || xrays.length > 0 || ultrasounds.length > 0) && (
                <div className="column">
                  <h2>Test Results Summary</h2>
                  
                  {/* Lab Tests */}
                  {labTests.length > 0 && (
                    <div style={{ marginBottom: "6px" }}>
                      <h3 style={{ color: "#ff8c00", margin: "3px 0 2px 0" }}>🔬 Laboratory</h3>
                      {labTests.map((test) => {
                        const testsOrdered = test.testsOrdered ? JSON.parse(test.testsOrdered) : [];
                        return (
                          <div key={test.id} className="test-result" style={{ borderLeft: "2px solid #ff8c00", marginBottom: "3px" }}>
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
                    <div style={{ marginBottom: "6px" }}>
                      <h3 style={{ color: "#8b5cf6", margin: "3px 0 2px 0" }}>📷 X-Ray</h3>
                      {xrays.map((xray) => (
                        <div key={xray.id} className="test-result" style={{ borderLeft: "2px solid #8b5cf6", marginBottom: "3px" }}>
                          <div style={{ fontWeight: "600", fontSize: "8pt" }}>
                            {xray.bodyPart}: {xray.impression || xray.findings || "Completed"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ultrasounds */}
                  {ultrasounds.length > 0 && (
                    <div style={{ marginBottom: "6px" }}>
                      <h3 style={{ color: "#0ea5e9", margin: "3px 0 2px 0" }}>🔊 Ultrasound</h3>
                      {ultrasounds.map((us) => (
                        <div key={us.id} className="test-result" style={{ borderLeft: "2px solid #0ea5e9", marginBottom: "3px" }}>
                          <div style={{ fontWeight: "600", fontSize: "8pt" }}>
                            {us.examType}: {us.impression || us.findings || "Completed"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Follow-up Instructions */}
          {treatment?.followUpDate && (
            <div className="section">
              <h2>Follow-up Appointment</h2>
              <div style={{ padding: "4px 6px", background: "#e3f2fd", borderLeft: "2px solid #0066CC" }}>
                <span style={{ fontWeight: "600" }}>Return on: {new Date(treatment.followUpDate).toLocaleDateString()}</span>
                {treatment.followUpType && <span> - {treatment.followUpType}</span>}
              </div>
            </div>
          )}

          {/* Warning Signs - More Compact */}
          <div className="section">
            <h2>⚠️ Return to Clinic If:</h2>
            <div className="warning-box">
              <ul style={{ margin: "0", padding: "0 0 0 16px" }}>
                <li>High fever (very hot body)</li>
                <li>Severe pain or difficulty breathing</li>
                <li>Heavy bleeding</li>
                <li>Cannot eat/drink or confusion</li>
              </ul>
            </div>
          </div>

          {/* Footer with Signature and Contact */}
          <div className="footer-section">
            <div className="signature-row">
              <div style={{ fontSize: "9pt" }}>
                <div>Signature: ________________</div>
                <div style={{ marginTop: "2px" }}>{encounter?.attendingClinician || "Medical Officer"}</div>
              </div>
              <div style={{ fontSize: "9pt" }}>
                <div>Date: ________________</div>
              </div>
            </div>
            <div className="clinic-contact">
              <div style={{ fontWeight: "600" }}>Bahr El Ghazal Clinic</div>
              <div>+211916759060</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
