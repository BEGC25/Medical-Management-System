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

    // Clone the content to preserve inline styles
    const html = printContent.outerHTML;
    
    win.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Discharge Summary - ${patient?.patientId || ""}</title>
        <style>
          @page { 
            size: A4; 
            margin: 10mm 12mm; 
          }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #111;
            line-height: 1.4;
            font-size: 10pt;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          * {
            box-sizing: border-box;
          }
          img {
            max-width: 80px;
            height: auto;
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
            width: 80px;
            height: 80px;
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
    
    // Wait for images to load before printing
    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      setTimeout(() => {
        win.focus();
        win.print();
        win.close();
      }, 300);
    };
    
    // Use onload if available, otherwise fallback to immediate timeout
    if (win.document.readyState === 'complete') {
      doPrint();
    } else {
      win.onload = doPrint;
      // Fallback in case onload doesn't fire
      setTimeout(doPrint, 1000);
    }
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
          <div style={{
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '800px',
            margin: '0 auto',
            background: 'white'
          }}>
            {/* Premium Header - Matches Invoice/X-Ray */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h1 style={{
                  fontSize: '24pt',
                  fontWeight: 700,
                  color: '#1e3a8a',
                  margin: 0,
                  lineHeight: 1.2
                }}>Bahr El Ghazal Clinic</h1>
                <p style={{
                  fontSize: '11pt',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  margin: '4px 0'
                }}>Excellence in Healthcare</p>
                <p style={{
                  fontSize: '9pt',
                  color: '#6b7280',
                  margin: '2px 0'
                }}>Aweil, South Sudan</p>
                <p style={{
                  fontSize: '9pt',
                  color: '#6b7280',
                  margin: '2px 0'
                }}>Tel: +211916759060/+211928754760</p>
                <p style={{
                  fontSize: '9pt',
                  color: '#6b7280',
                  margin: '2px 0'
                }}>Email: bahr.ghazal.clinic@gmail.com</p>
              </div>
              <img src={clinicLogo} alt="Clinic Logo" style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain'
              }} />
            </div>

            {/* Navy Blue Title Bar */}
            <div style={{
              background: 'linear-gradient(to right, #1e3a8a, #1e40af)',
              color: 'white',
              textAlign: 'center',
              padding: '12px',
              fontSize: '14pt',
              fontWeight: 'bold',
              letterSpacing: '1px',
              margin: '16px 0'
            }}>
              PATIENT DISCHARGE SUMMARY
            </div>

            {/* Patient & Visit Information - Two Column Boxes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <h3 style={{
                  background: '#f9fafb',
                  padding: '8px 12px',
                  fontWeight: 'bold',
                  fontSize: '10pt',
                  borderBottom: '1px solid #1e3a8a',
                  letterSpacing: '0.5px',
                  color: '#1f2937',
                  margin: 0
                }}>PATIENT INFORMATION</h3>
                <div style={{
                  padding: '12px',
                  background: '#fef3c7'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '9pt'
                  }}>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>Name:</span>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{patient?.firstName} {patient?.lastName}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '9pt'
                  }}>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>Patient ID:</span>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{patient?.patientId}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '9pt'
                  }}>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>Age:</span>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{patient?.age || "N/A"}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '9pt'
                  }}>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>Gender:</span>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{patient?.gender || "N/A"}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '9pt'
                  }}>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>Phone:</span>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{patient?.phoneNumber || "N/A"}</span>
                  </div>
                </div>
              </div>
              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <h3 style={{
                  background: '#f9fafb',
                  padding: '8px 12px',
                  fontWeight: 'bold',
                  fontSize: '10pt',
                  borderBottom: '1px solid #1e3a8a',
                  letterSpacing: '0.5px',
                  color: '#1f2937',
                  margin: 0
                }}>VISIT DETAILS</h3>
                <div style={{
                  padding: '12px',
                  background: '#f9fafb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '9pt'
                  }}>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>Date:</span>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{formatLongDate(encounter?.visitDate || new Date())}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '9pt'
                  }}>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>Type:</span>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{treatment?.visitType || "Consultation"}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '9pt'
                  }}>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>Location:</span>
                    <span style={{ fontWeight: 500, color: '#111827' }}>Bahr El Ghazal</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '9pt'
                  }}>
                    <span style={{ fontWeight: 600, color: '#4b5563' }}>Visit ID:</span>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{encounter?.encounterId}</span>
                  </div>
                  {encounter?.attendingClinician && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                      fontSize: '9pt'
                    }}>
                      <span style={{ fontWeight: 600, color: '#4b5563' }}>Clinician:</span>
                      <span style={{ fontWeight: 500, color: '#111827' }}>{encounter.attendingClinician}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Diagnosis - Bordered Box */}
          {treatment?.diagnosis && (
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <h3 style={{
                background: '#f9fafb',
                padding: '8px 12px',
                fontWeight: 'bold',
                fontSize: '10pt',
                borderBottom: '2px solid #9ca3af',
                letterSpacing: '0.5px',
                margin: 0,
                color: '#1f2937'
              }}>DIAGNOSIS</h3>
              <p style={{
                padding: '12px',
                fontSize: '9pt',
                lineHeight: 1.5,
                margin: 0,
                background: 'white'
              }}>{treatment.diagnosis}</p>
            </div>
          )}

          {/* Reason for Visit - Bordered Box */}
          {treatment?.chiefComplaint && (
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <h3 style={{
                background: '#f9fafb',
                padding: '8px 12px',
                fontWeight: 'bold',
                fontSize: '10pt',
                borderBottom: '2px solid #9ca3af',
                letterSpacing: '0.5px',
                margin: 0,
                color: '#1f2937'
              }}>REASON FOR VISIT</h3>
              <p style={{
                padding: '12px',
                fontSize: '9pt',
                lineHeight: 1.5,
                margin: 0,
                background: 'white'
              }}>{treatment.chiefComplaint}</p>
            </div>
          )}

          {/* Treatment Provided - Bordered Box */}
          {treatment?.treatmentPlan && (
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <h3 style={{
                background: '#f9fafb',
                padding: '8px 12px',
                fontWeight: 'bold',
                fontSize: '10pt',
                borderBottom: '2px solid #9ca3af',
                letterSpacing: '0.5px',
                margin: 0,
                color: '#1f2937'
              }}>TREATMENT PROVIDED</h3>
              <p style={{
                padding: '12px',
                fontSize: '9pt',
                lineHeight: 1.5,
                margin: 0,
                background: 'white',
                whiteSpace: 'pre-wrap'
              }}>{treatment.treatmentPlan}</p>
            </div>
          )}

          {/* Two-Column Layout: Medications & Test Results */}
          {(pharmacyOrders.length > 0 || labTests.length > 0 || xrays.length > 0 || ultrasounds.length > 0) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '12px'
            }}>
              {/* Left Column - Medications */}
              {pharmacyOrders.length > 0 && (
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <h3 style={{
                    background: '#f9fafb',
                    padding: '8px 12px',
                    fontWeight: 'bold',
                    fontSize: '10pt',
                    borderBottom: '1px solid #1e3a8a',
                    letterSpacing: '0.5px',
                    color: '#1f2937',
                    margin: 0
                  }}>MEDICATIONS PRESCRIBED</h3>
                  <div style={{
                    padding: '12px',
                    background: '#f9fafb'
                  }}>
                    {pharmacyOrders.map((order, idx) => (
                      <div key={order.id} style={{
                        padding: '6px 8px',
                        background: '#f9fafb',
                        borderLeft: '2px solid #1e3a8a',
                        marginBottom: '4px',
                        fontSize: '9pt'
                      }}>
                        <strong style={{
                          fontWeight: 600,
                          display: 'block',
                          marginBottom: '2px'
                        }}>{idx + 1}. {order.drugName}</strong>
                        {order.dosage && <div style={{
                          fontSize: '8pt',
                          color: '#6b7280',
                          marginTop: '2px'
                        }}>{order.dosage}</div>}
                        {order.instructions && <div style={{
                          fontSize: '8pt',
                          color: '#6b7280',
                          marginTop: '2px'
                        }}>{order.instructions}</div>}
                        <div style={{
                          fontSize: '8pt',
                          color: '#6b7280',
                          marginTop: '2px'
                        }}>Qty: {order.quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Right Column - Test Results */}
              {(labTests.length > 0 || xrays.length > 0 || ultrasounds.length > 0) && (
                <div style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <h3 style={{
                    background: '#f9fafb',
                    padding: '8px 12px',
                    fontWeight: 'bold',
                    fontSize: '10pt',
                    borderBottom: '1px solid #1e3a8a',
                    letterSpacing: '0.5px',
                    color: '#1f2937',
                    margin: 0
                  }}>TEST RESULTS SUMMARY</h3>
                  <div style={{
                    padding: '12px',
                    background: '#f9fafb'
                  }}>
                    {/* Lab Tests */}
                    {labTests.length > 0 && (
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontWeight: "600", fontSize: "9pt", marginBottom: "4px", color: "#d97706" }}>
                          🔬 Laboratory Tests
                        </div>
                        {labTests.map((test) => {
                          const testsOrdered = test.testsOrdered ? JSON.parse(test.testsOrdered) : [];
                          return (
                            <div key={test.id} style={{
                              padding: '6px 8px',
                              marginBottom: '4px',
                              borderLeft: '2px solid #d97706',
                              background: '#f9fafb',
                              fontSize: '9pt'
                            }}>
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
                          <div key={xray.id} style={{
                            padding: '6px 8px',
                            marginBottom: '4px',
                            borderLeft: '2px solid #8b5cf6',
                            background: '#f9fafb',
                            fontSize: '9pt'
                          }}>
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
                          <div key={us.id} style={{
                            padding: '6px 8px',
                            marginBottom: '4px',
                            borderLeft: '2px solid #0ea5e9',
                            background: '#f9fafb',
                            fontSize: '9pt'
                          }}>
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
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <h3 style={{
                background: '#f9fafb',
                padding: '8px 12px',
                fontWeight: 'bold',
                fontSize: '10pt',
                borderBottom: '2px solid #9ca3af',
                letterSpacing: '0.5px',
                margin: 0,
                color: '#1f2937'
              }}>FOLLOW-UP APPOINTMENT</h3>
              <div style={{
                padding: '12px',
                fontSize: '9pt',
                lineHeight: 1.5,
                margin: 0,
                background: 'white'
              }}>
                <div style={{ fontWeight: "600" }}>
                  Return on: {formatLongDate(treatment.followUpDate)}
                </div>
                {treatment.followUpType && <div>Type: {treatment.followUpType}</div>}
              </div>
            </div>
          )}

          {/* Warning Box */}
          <div style={{
            border: '2px solid #f59e0b',
            background: '#fffbeb',
            borderRadius: '4px',
            padding: '12px',
            margin: '12px 0'
          }}>
            <h3 style={{
              color: '#b45309',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              fontSize: '10pt'
            }}>⚠️ RETURN TO CLINIC IF</h3>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '9pt'
            }}>
              <li style={{ marginBottom: '4px' }}>High fever (very hot body)</li>
              <li style={{ marginBottom: '4px' }}>Severe pain or difficulty breathing</li>
              <li style={{ marginBottom: '4px' }}>Heavy bleeding</li>
              <li style={{ marginBottom: '4px' }}>Cannot eat/drink or confusion</li>
            </ul>
          </div>

          {/* Signature Section - Matches Invoice */}
          <div style={{
            marginTop: '24px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '48px'
            }}>
              <div style={{
                marginTop: '40px'
              }}>
                <div style={{
                  borderTop: '2px solid #1f2937',
                  paddingTop: '8px',
                  marginBottom: '4px'
                }}></div>
                <p style={{
                  fontSize: '10pt',
                  fontWeight: 'bold',
                  margin: 0,
                  color: '#1f2937'
                }}>Doctor's Signature</p>
                <p style={{
                  fontSize: '8pt',
                  color: '#6b7280',
                  margin: '2px 0 0 0'
                }}>{encounter?.attendingClinician || "Medical Officer"}</p>
              </div>
              <div style={{
                marginTop: '40px'
              }}>
                <div style={{
                  borderTop: '2px solid #1f2937',
                  paddingTop: '8px',
                  marginBottom: '4px'
                }}></div>
                <p style={{
                  fontSize: '10pt',
                  fontWeight: 'bold',
                  margin: 0,
                  color: '#1f2937'
                }}>Date</p>
                <p style={{
                  fontSize: '8pt',
                  color: '#6b7280',
                  margin: '2px 0 0 0'
                }}>{formatLongDate(encounter?.visitDate || new Date())}</p>
              </div>
            </div>
          </div>

          {/* Professional Footer - Matches Invoice */}
          <div style={{
            textAlign: 'center',
            fontSize: '9pt',
            color: '#6b7280',
            borderTop: '2px solid #d1d5db',
            paddingTop: '12px',
            marginTop: '16px'
          }}>
            <p style={{
              fontWeight: 600,
              color: '#4b5563',
              letterSpacing: '0.5px',
              margin: '0 0 6px 0'
            }}>THIS IS A COMPUTER-GENERATED DISCHARGE SUMMARY</p>
            <p style={{
              fontWeight: 600,
              color: '#1f2937',
              margin: '6px 0'
            }}>Bahr El Ghazal Clinic</p>
            <p style={{
              margin: '4px 0'
            }}>Accredited Medical Facility | Republic of South Sudan</p>
            <p style={{
              fontStyle: 'italic',
              margin: '6px 0 0 0'
            }}>Your health is our priority</p>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
