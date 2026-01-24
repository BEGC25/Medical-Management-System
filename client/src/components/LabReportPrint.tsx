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

  // Helper function for PREMIUM pill badge styling
  const getStatusBadge = (isHigh: boolean): React.ReactNode => {
    const badgeText = isHigh ? "HIGH" : "LOW";
    const bgGradient = isHigh 
      ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' 
      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: bgGradient,
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: '700',
        padding: '3px 10px',
        borderRadius: '12px',
        marginLeft: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        boxShadow: isHigh ? '0 1px 3px rgba(220, 38, 38, 0.3)' : '0 1px 3px rgba(245, 158, 11, 0.3)'
      }}>
        {badgeText}
      </span>
    );
  };

  return (
    <div id={containerId} className="prescription" style={{ minHeight: 'auto', height: 'auto' }}>
      {/* Premium Professional Medical Report Layout - Sophisticated Design */}
      <div style={{ background: '#ffffff' }}>
        <div style={{ width: '100%' }}>
          
          {/* PREMIUM HEADER - Dark Blue Gradient with WHITE Text */}
          <div style={{ 
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)',
            padding: '24px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0'
          }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                color: '#ffffff',
                fontSize: '28px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                margin: 0,
                marginBottom: '4px'
              }}>Bahr El Ghazal Clinic</h1>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '13px',
                margin: 0
              }}>Aweil, South Sudan | Tel: +211 916 759 060 / +211 928 754 760</p>
            </div>
            <div style={{ 
              background: '#ffffff',
              borderRadius: '50%',
              padding: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src={clinicLogo} alt="Clinic Logo" style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }} />
            </div>
          </div>

          {/* DOCUMENT TITLE BAR */}
          <div style={{
            background: '#f0f7ff',
            borderLeft: '4px solid #2563eb',
            padding: '12px 20px',
            margin: '20px 24px'
          }}>
            <h2 style={{
              color: '#1e40af',
              fontSize: '18px',
              fontWeight: '600',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              margin: 0
            }}>
              LABORATORY TEST REPORT
              {includeInterpretation && <span style={{ 
                fontSize: '13px',
                marginLeft: '12px',
                fontWeight: '600'
              }}>(Clinical Copy)</span>}
            </h2>
          </div>

          {/* PATIENT INFO CARD - Elevated Design */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            padding: '20px 24px',
            margin: '16px 24px'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '16px 24px'
            }}>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ 
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  marginBottom: '2px'
                }}>Patient Name</div>
                <div style={{ 
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#0f172a'
                }}>{fullName(patient)}</div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  marginBottom: '2px'
                }}>Patient ID</div>
                <div style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>{labTest.patientId}</div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  marginBottom: '2px'
                }}>Test ID</div>
                <div style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>{labTest.testId}</div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  marginBottom: '2px'
                }}>Age</div>
                <div style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>{patient?.age || '—'}</div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  marginBottom: '2px'
                }}>Gender</div>
                <div style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>{patient?.gender || '—'}</div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  marginBottom: '2px'
                }}>Category</div>
                <div style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>{labTest.category}</div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  marginBottom: '2px'
                }}>Priority</div>
                <div style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>{labTest.priority}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ 
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  marginBottom: '2px'
                }}>Completed Date</div>
                <div style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>{formatLongDate(formValues?.completedDate || labTest.completedDate)}</div>
              </div>
            </div>
          </div>

          {/* LABORATORY RESULTS - Premium Table with Sophisticated Styling */}
          <div style={{ margin: '0 24px 16px 24px' }}>
            <div style={{ 
              background: '#f0f7ff',
              borderLeft: '4px solid #2563eb',
              padding: '10px 20px',
              margin: '0 0 12px 0'
            }}>
              <h3 style={{
                color: '#1e40af',
                fontSize: '15px',
                fontWeight: '700',
                letterSpacing: '0.8px',
                margin: 0
              }}>
                LABORATORY RESULTS
              </h3>
            </div>
            
            {/* Premium Table - Elevated Container */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}>
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)'
                  }}>
                    <th style={{ 
                      textAlign: 'left',
                      padding: '14px 16px',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      width: '35%'
                    }}>Parameter</th>
                    <th style={{ 
                      textAlign: 'center',
                      padding: '14px 16px',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      width: '25%'
                    }}>Result</th>
                    <th style={{ 
                      textAlign: 'left',
                      padding: '14px 16px',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '12px',
                      textTransform: 'uppercase',
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
                        {/* Category Header Row */}
                        <tr>
                          <td colSpan={3} style={{
                            background: 'linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)',
                            color: '#1e40af',
                            fontWeight: '700',
                            fontSize: '13px',
                            padding: '10px 16px',
                            borderBottom: '1px solid #bfdbfe'
                          }}>
                            {testName}
                          </td>
                        </tr>
                        {/* Test Result Rows with Zebra Striping */}
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
                              background: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc'
                            }}>
                              <td style={{ 
                                padding: '12px 16px',
                                color: '#4b5563',
                                fontSize: '11px',
                                borderBottom: '1px solid #f1f5f9'
                              }}>{fieldName}</td>
                              <td style={{ 
                                textAlign: 'center',
                                padding: '12px 16px',
                                fontWeight: isNormal ? '600' : '700',
                                fontSize: '12px',
                                borderBottom: '1px solid #f1f5f9',
                                color: isNormal ? '#059669' : isAbnormal ? '#dc2626' : '#1f2937'
                              }}>
                                {displayValue} {config?.unit || ""}{statusBadge}
                              </td>
                              <td style={{ 
                                padding: '12px 16px',
                                color: '#6b7280',
                                fontSize: '11px',
                                borderBottom: '1px solid #f1f5f9'
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
          </div>

          {/* Clinical Interpretation - Premium Design */}
          {includeInterpretation && (() => {
            const criticalFindings = interpretation.criticalFindings.map(f => `⚠ ${f}`);
            const warnings = interpretation.warnings.map(w => `• ${w}`);
            const hasCritical = criticalFindings.length > 0;
            const hasWarnings = warnings.length > 0;
            const hasFindings = hasCritical || hasWarnings;

            return (
              <div style={{
                background: hasFindings ? '#fef3c7' : '#d1fae5',
                border: hasFindings ? '1px solid #fbbf24' : '1px solid #34d399',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                padding: '16px 20px',
                margin: '0 24px 16px 24px'
              }}>
                <h3 style={{
                  fontSize: '13px',
                  color: hasFindings ? '#78350f' : '#065f46',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  margin: '0 0 8px 0'
                }}>
                  Clinical Interpretation
                </h3>
                {hasCritical && (
                  <div style={{ marginBottom: '8px' }}>
                    {criticalFindings.map((finding, i) => (
                      <div key={i} style={{
                        background: '#fee2e2',
                        borderLeft: '3px solid #dc2626',
                        borderRadius: '4px',
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
                      <div key={i} style={{
                        background: '#fef3c7',
                        borderLeft: '3px solid #f59e0b',
                        borderRadius: '4px',
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
                  <div style={{
                    background: '#d1fae5',
                    borderLeft: '3px solid #059669',
                    borderRadius: '4px',
                    padding: '6px 8px',
                    fontSize: '11px',
                    color: '#065f46',
                    fontWeight: '600'
                  }}>
                    All test results within normal limits.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Technician Notes - Premium Card Style */}
          {(formValues?.technicianNotes || labTest.technicianNotes) && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              padding: '16px 20px',
              margin: '0 24px 16px 24px'
            }}>
              <span style={{ 
                fontSize: '12px',
                color: '#78350f',
                fontWeight: '700',
                letterSpacing: '0.5px'
              }}>Technician Notes:</span>
              <div style={{ 
                fontSize: '11px',
                color: '#92400e',
                marginTop: '4px',
                lineHeight: '1.5'
              }}>{formValues?.technicianNotes || labTest.technicianNotes}</div>
            </div>
          )}

          {/* PREMIUM FOOTER - Elegant Professional Design */}
          <div style={{ 
            borderTop: '2px solid #e2e8f0',
            paddingTop: '16px',
            marginTop: '24px',
            padding: '16px 24px 0 24px'
          }}>
            {/* Signature Line */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 0 16px 0'
            }}>
              <div>
                <span style={{ 
                  color: '#6b7280',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'block'
                }}>Lab Technician</span>
                <div style={{ 
                  color: '#1f2937',
                  fontSize: '13px',
                  fontWeight: '700',
                  marginTop: '4px'
                }}>{formValues?.completedBy || labTest.completedBy || "Lab Technician"}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  color: '#6b7280',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'block'
                }}>Report Date</span>
                <div style={{ 
                  color: '#1f2937',
                  fontSize: '13px',
                  fontWeight: '700',
                  marginTop: '4px'
                }}>{formatLongDate(formValues?.completedDate || labTest.completedDate)}</div>
              </div>
            </div>
            
            {/* Dark Blue Footer Band */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)',
              color: '#ffffff',
              textAlign: 'center',
              padding: '16px',
              marginTop: '16px',
              borderRadius: '0 0 8px 8px'
            }}>
              <p style={{ 
                fontSize: '16px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                margin: '0 0 4px 0'
              }}>Bahr El Ghazal Clinic</p>
              <p style={{ 
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>Accredited Medical Facility | Republic of South Sudan</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
