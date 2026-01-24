import { Fragment } from "react";
import clinicLogo from "@assets/Logo-Clinic_1762148237143.jpeg";
import { interpretLabResults } from "@/lib/lab-interpretation";
import { formatLongDate } from "@/lib/date-utils";

/**
 * Reusable Lab Report Print Component
 * 
 * This component provides a unified print layout for laboratory reports.
 * It can be used for both Patient Copy (no interpretation) and Clinical Copy (with interpretation).
 */

interface LabReportPrintProps {
  /** Unique ID for the print container (e.g., "lab-report-print", "lab-clinical-print") */
  containerId: string;
  /** Whether to show this print container */
  visible: boolean;
  /** Lab test data */
  labTest: {
    testId: string;
    patientId: string;
    category: string;
    priority: string;
    tests: string | string[];
    results: string | Record<string, Record<string, string>>;
    completedDate?: string;
    resultStatus?: string;
    technicianNotes?: string;
    completedBy?: string;
  };
  /** Patient data */
  patient?: {
    firstName?: string;
    lastName?: string;
    patientId?: string;
    age?: number | string;
    gender?: string;
    phoneNumber?: string;
  } | null;
  /** Result field configurations for displaying normal ranges */
  resultFields: Record<string, Record<string, {
    type: "number" | "text" | "select" | "multiselect";
    unit?: string;
    range?: string;
    normal?: string;
    options?: string[];
  }>>;
  /** Whether to include clinical interpretation (false for patient copy, true for clinical copy) */
  includeInterpretation?: boolean;
  /** Additional form values (for completedDate, resultStatus, technicianNotes, completedBy) */
  formValues?: {
    completedDate?: string;
    resultStatus?: string;
    technicianNotes?: string;
    completedBy?: string;
  };
}

function parseJSON<T = any>(v: any, fallback: T): T {
  try {
    return typeof v === "object" && v !== null ? v : JSON.parse(v ?? "");
  } catch {
    return fallback;
  }
}

function fullName(p?: { firstName?: string; lastName?: string; patientId?: string } | null) {
  if (!p) return "";
  const n = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return n || p.patientId || "";
}

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export function LabReportPrint({
  containerId,
  visible,
  labTest,
  patient,
  resultFields,
  includeInterpretation = false,
  formValues,
}: LabReportPrintProps) {
  if (!visible) return null;

  const tests = parseJSON<string[]>(labTest.tests, []);
  const results = parseJSON<Record<string, Record<string, string>>>(labTest.results, {});
  const interpretation = interpretLabResults(results);
  
  // Format number with commas
  const formatNumber = (num: number | string): string => {
    const parsed = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(parsed) ? String(num) : new Intl.NumberFormat('en-US').format(parsed);
  };

  // Helper function for status badge styling
  const getStatusBadge = (isHigh: boolean): React.ReactNode => {
    const badgeText = isHigh ? "HIGH" : "LOW";
    const bgColor = isHigh ? '#dc2626' : '#f59e0b';
    
    return (
      <span style={{
        display: 'inline-block',
        marginLeft: '8px',
        padding: '2px 8px',
        borderRadius: '12px',
        background: bgColor,
        color: 'white',
        fontSize: '9px',
        fontWeight: '700',
        letterSpacing: '0.5px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }}>
        {badgeText}
      </span>
    );
  };

  return (
    <div id={containerId} className="prescription" style={{ minHeight: 'auto', height: 'auto' }}>
      {/* Premium Professional Medical Report Layout - Sophisticated Design */}
      <div className="bg-white">
        <div style={{ width: '100%' }}>
          
          {/* PREMIUM HEADER - Elegant Professional Style with Gradient Band */}
          <div className="relative overflow-hidden" style={{ 
            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
            borderBottom: '3px solid #3b82f6'
          }}>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-white font-bold mb-1" style={{ 
                  fontSize: '28px',
                  letterSpacing: '0.5px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>Bahr El Ghazal Clinic</h1>
                <p className="text-blue-100 font-medium" style={{ 
                  fontSize: '11px',
                  letterSpacing: '0.3px'
                }}>Aweil, South Sudan | Tel: +211 916 759 060 / +211 928 754 760</p>
              </div>
              <div className="rounded-lg overflow-hidden" style={{ 
                width: '72px', 
                height: '72px',
                background: 'white',
                padding: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                <img src={clinicLogo} alt="Clinic Logo" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* TITLE - Premium Style with Accent Line */}
          <div className="text-center px-6 py-3 bg-gradient-to-b from-gray-50 to-white" style={{
            borderBottom: '2px solid #e5e7eb'
          }}>
            <h2 className="font-bold" style={{
              fontSize: '20px',
              color: '#1f2937',
              letterSpacing: '1.2px'
            }}>
              LABORATORY TEST REPORT
              {includeInterpretation && <span style={{ 
                fontSize: '13px',
                marginLeft: '12px',
                color: '#3b82f6',
                fontWeight: '600'
              }}>(Clinical Copy)</span>}
            </h2>
          </div>

          {/* PATIENT INFORMATION - Premium Card Design */}
          <div className="mx-6 my-4 rounded-lg overflow-hidden" style={{
            background: '#f8fafc',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div className="px-4 py-3">
              <div className="grid grid-cols-4 gap-x-6 gap-y-2" style={{ fontSize: '12px' }}>
                <div className="col-span-2">
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Patient Name</span>
                  <div style={{ 
                    color: '#1f2937', 
                    fontWeight: '700',
                    fontSize: '14px',
                    marginTop: '2px'
                  }}>{fullName(patient)}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Patient ID</span>
                  <div style={{ color: '#1f2937', fontWeight: '600', marginTop: '2px' }}>{labTest.patientId}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Test ID</span>
                  <div style={{ color: '#1f2937', fontWeight: '600', marginTop: '2px' }}>{labTest.testId}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Age</span>
                  <div style={{ color: '#1f2937', fontWeight: '600', marginTop: '2px' }}>{patient?.age || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Gender</span>
                  <div style={{ color: '#1f2937', fontWeight: '600', marginTop: '2px' }}>{patient?.gender || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Category</span>
                  <div style={{ color: '#1f2937', fontWeight: '600', marginTop: '2px' }}>{labTest.category}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Priority</span>
                  <div style={{ color: '#1f2937', fontWeight: '600', marginTop: '2px' }}>{labTest.priority}</div>
                </div>
                <div className="col-span-2">
                  <span style={{ color: '#6b7280', fontWeight: '500' }}>Completed Date</span>
                  <div style={{ color: '#1f2937', fontWeight: '600', marginTop: '2px' }}>{formatLongDate(formValues?.completedDate || labTest.completedDate)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* LABORATORY RESULTS - Premium Table with Sophisticated Styling */}
          <div className="mx-6 mb-4">
            <div className="mb-3 pb-2" style={{ 
              borderBottom: '2px solid #1e40af'
            }}>
              <h3 className="font-bold" style={{
                fontSize: '15px',
                color: '#1f2937',
                letterSpacing: '0.8px'
              }}>
                LABORATORY RESULTS
              </h3>
            </div>
            
            {/* Premium Table with Subtle Borders and Elegant Styling */}
            <table className="w-full" style={{ 
              borderCollapse: 'separate',
              borderSpacing: '0',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <thead>
                <tr style={{ 
                  background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderBottom: '2px solid #cbd5e1'
                }}>
                  <th className="text-left px-4 py-3" style={{ 
                    fontWeight: '700',
                    color: '#1f2937',
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    width: '35%',
                    borderRight: '1px solid #e5e7eb'
                  }}>Parameter</th>
                  <th className="text-center px-4 py-3" style={{ 
                    fontWeight: '700',
                    color: '#1f2937',
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    width: '25%',
                    borderRight: '1px solid #e5e7eb'
                  }}>Result</th>
                  <th className="text-left px-4 py-3" style={{ 
                    fontWeight: '700',
                    color: '#1f2937',
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    width: '40%'
                  }}>Normal Range</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(results).map(([testName, testData], testIndex) => {
                  const fields = resultFields[testName];
                  return (
                    <Fragment key={testName}>
                      {/* Premium Category Header with Gradient Background */}
                      <tr>
                        <td colSpan={3} className="px-4 py-2" style={{
                          background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '12px',
                          letterSpacing: '0.8px',
                          borderTop: testIndex > 0 ? '1px solid #e5e7eb' : 'none'
                        }}>
                          {testName}
                        </td>
                      </tr>
                      {/* Test Result Rows with Elegant Zebra Striping */}
                      {Object.entries(testData).map(([fieldName, value], rowIndex) => {
                        const config = fields?.[fieldName];
                        const isNormal = config?.normal === value;
                        const isAbnormal = config?.normal && config.normal !== value && value && value !== "Not seen" && value !== "Negative";
                        
                        // Format numeric values with commas
                        let displayValue = value;
                        if (config?.type === 'number' && value) {
                          displayValue = formatNumber(value);
                        }
                        
                        // Determine status badge for abnormal values - PREMIUM PILL BADGES
                        let statusBadge = null;
                        if (isAbnormal && config?.type === 'number' && config?.normal) {
                          const numValue = typeof value === 'string' ? parseFloat(value) : value;
                          const normalValue = parseFloat(config.normal);
                          if (!isNaN(numValue) && !isNaN(normalValue)) {
                            statusBadge = getStatusBadge(numValue > normalValue);
                          }
                        }
                        
                        return (
                          <tr key={fieldName} style={{ 
                            background: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderTop: '1px solid #f1f5f9'
                          }}>
                            <td className="px-4 py-2" style={{ 
                              color: '#4b5563',
                              fontSize: '11px',
                              borderRight: '1px solid #f1f5f9'
                            }}>{fieldName}</td>
                            <td className="text-center px-4 py-2" style={{ 
                              fontWeight: '700',
                              fontSize: '12px',
                              borderRight: '1px solid #f1f5f9',
                              color: isNormal ? '#059669' : isAbnormal ? '#dc2626' : '#1f2937'
                            }}>
                              {displayValue} {config?.unit || ""}{statusBadge}
                            </td>
                            <td className="px-4 py-2" style={{ 
                              color: '#6b7280',
                              fontSize: '11px'
                            }}>
                              {config?.normal || config?.range || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Clinical Interpretation - Premium Design */}
          {includeInterpretation && (() => {
            const criticalFindings = interpretation.criticalFindings.map(f => `⚠ ${f}`);
            const warnings = interpretation.warnings.map(w => `• ${w}`);
            const hasCritical = criticalFindings.length > 0;
            const hasWarnings = warnings.length > 0;
            const hasFindings = hasCritical || hasWarnings;

            return (
              <div className="mx-6 mb-4 rounded-lg overflow-hidden" style={{
                background: hasFindings ? '#fef3c7' : '#d1fae5',
                border: hasFindings ? '1px solid #fbbf24' : '1px solid #34d399',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div className="px-4 py-3">
                  <h3 className="font-bold mb-2" style={{
                    fontSize: '13px',
                    color: hasFindings ? '#78350f' : '#065f46',
                    letterSpacing: '0.5px'
                  }}>
                    Clinical Interpretation
                  </h3>
                  {hasCritical && (
                    <div className="mb-2">
                      {criticalFindings.map((finding, i) => (
                        <div key={i} className="rounded" style={{
                          background: '#fee2e2',
                          borderLeft: '3px solid #dc2626',
                          padding: '6px 8px',
                          fontSize: '11px',
                          color: '#7f1d1d',
                          marginBottom: '4px',
                          fontWeight: '600'
                        }}>
                          {finding}
                        </div>
                      ))}
                    </div>
                  )}
                  {hasWarnings && (
                    <div>
                      {warnings.map((warning, i) => (
                        <div key={i} className="rounded" style={{
                          background: '#fef3c7',
                          borderLeft: '3px solid #f59e0b',
                          padding: '6px 8px',
                          fontSize: '11px',
                          color: '#78350f',
                          marginBottom: '4px',
                          fontWeight: '500'
                        }}>
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}
                  {!hasFindings && (
                    <div className="rounded" style={{
                      background: '#d1fae5',
                      borderLeft: '3px solid #059669',
                      padding: '6px 8px',
                      fontSize: '11px',
                      color: '#065f46',
                      fontWeight: '600'
                    }}>
                      All test results within normal limits.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Technician Notes - Premium Card Style */}
          {(formValues?.technicianNotes || labTest.technicianNotes) && (
            <div className="mx-6 mb-4 rounded-lg overflow-hidden" style={{
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div className="px-4 py-3">
                <span className="font-bold" style={{ 
                  fontSize: '12px',
                  color: '#78350f',
                  letterSpacing: '0.5px'
                }}>Technician Notes:</span>
                <div style={{ 
                  fontSize: '11px',
                  color: '#92400e',
                  marginTop: '4px',
                  lineHeight: '1.5'
                }}>{formValues?.technicianNotes || labTest.technicianNotes}</div>
              </div>
            </div>
          )}

          {/* PREMIUM FOOTER - Elegant Professional Design */}
          <div className="mt-6" style={{ 
            borderTop: '2px solid #e5e7eb',
            paddingTop: '16px'
          }}>
            <div className="mx-6">
              {/* Signature Line */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span style={{ 
                    color: '#6b7280',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>Lab Technician</span>
                  <div style={{ 
                    color: '#1f2937',
                    fontSize: '13px',
                    fontWeight: '700',
                    marginTop: '4px'
                  }}>{formValues?.completedBy || labTest.completedBy || "Lab Technician"}</div>
                </div>
                <div className="text-right">
                  <span style={{ 
                    color: '#6b7280',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>Report Date</span>
                  <div style={{ 
                    color: '#1f2937',
                    fontSize: '13px',
                    fontWeight: '700',
                    marginTop: '4px'
                  }}>{formatLongDate(formValues?.completedDate || labTest.completedDate)}</div>
                </div>
              </div>
              
              {/* Clinic Branding Footer */}
              <div className="text-center pt-4" style={{ 
                borderTop: '1px solid #e5e7eb'
              }}>
                <p className="font-bold" style={{ 
                  color: '#1e40af',
                  fontSize: '13px',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>Bahr El Ghazal Clinic</p>
                <p style={{ 
                  color: '#6b7280',
                  fontSize: '10px',
                  letterSpacing: '0.3px'
                }}>Accredited Medical Facility | Republic of South Sudan</p>
              </div>
              
              {/* Premium Accent Bar */}
              <div style={{ 
                height: '3px',
                background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)',
                marginTop: '12px',
                borderRadius: '2px'
              }}></div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
