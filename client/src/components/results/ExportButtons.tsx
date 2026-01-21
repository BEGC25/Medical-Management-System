import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import type { AnyResult } from "./types";
import { formatDepartmentName } from "@/lib/display-utils";
import { getAgingInfo, hasAbnormalFindings, hasCriticalFindings, hasAbnormalImagingFindings } from "@/lib/results-analysis";

interface ExportButtonsProps {
  results: AnyResult[];
  filters: {
    selectedPatient: string;
    statusFilter: string;
    typeFilter: string;
    dateFilter: string;
  };
}

export function ExportButtons({ results, filters }: ExportButtonsProps) {
  
  /**
   * Export results to CSV
   */
  const exportToCSV = () => {
    if (results.length === 0) {
      alert("No results to export");
      return;
    }

    // CSV Headers
    const headers = [
      "Patient ID",
      "Patient Name",
      "Type",
      "Test/Exam ID",
      "Status",
      "Requested Date",
      "Completed Date",
      "Days Pending",
      "Overdue",
      "Abnormal/Critical"
    ];

    // CSV Rows
    const rows = results.map(result => {
      const agingInfo = getAgingInfo((result as any).requestedDate, result.type as any, result.status);
      
      let abnormalStatus = "No";
      if (result.status === 'completed') {
        if (result.type === 'lab') {
          const critical = hasCriticalFindings((result as any).results);
          const abnormal = hasAbnormalFindings((result as any).results);
          abnormalStatus = critical ? "Critical" : (abnormal ? "Abnormal" : "Normal");
        } else if (result.type === 'xray' || result.type === 'ultrasound') {
          const abnormal = hasAbnormalImagingFindings((result as any).findings, (result as any).impression);
          abnormalStatus = abnormal ? "Abnormal" : "Normal";
        }
      }

      return [
        result.patient?.patientId || result.patientId || "",
        result.patient ? `${result.patient.firstName} ${result.patient.lastName}` : "",
        formatDepartmentName(result.type, false),
        result.type === 'lab' ? (result as any).testId : (result as any).examId,
        result.status,
        (result as any).requestedDate,
        (result as any).completedDate || "",
        result.status === 'pending' ? agingInfo.daysOld.toString() : "",
        agingInfo.isOverdue ? "Yes" : "No",
        abnormalStatus
      ].map(field => `"${field}"`).join(",");
    });

    // Combine headers and rows
    const csv = [headers.join(","), ...rows].join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `results-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Export results to PDF (print view)
   */
  const exportToPDF = () => {
    if (results.length === 0) {
      alert("No results to export");
      return;
    }

    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export PDF");
      return;
    }

    // Build filter summary
    let filterSummary = [];
    if (filters.selectedPatient) {
      const patient = results[0]?.patient;
      if (patient) {
        filterSummary.push(`Patient: ${patient.firstName} ${patient.lastName} (${patient.patientId})`);
      }
    }
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      filterSummary.push(`Status: ${filters.statusFilter}`);
    }
    if (filters.typeFilter && filters.typeFilter !== 'all') {
      filterSummary.push(`Type: ${formatDepartmentName(filters.typeFilter, false)}`);
    }
    if (filters.dateFilter && filters.dateFilter !== 'all') {
      filterSummary.push(`Date: ${filters.dateFilter}`);
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Results Report - ${format(new Date(), 'MMM dd, yyyy')}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 {
            text-align: center;
            color: #1e40af;
            margin-bottom: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }
          .filters {
            margin-bottom: 20px;
            padding: 10px;
            background: #f3f4f6;
            border-radius: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: #1e40af;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
          }
          .badge-pending {
            background: #fef3c7;
            color: #92400e;
          }
          .badge-completed {
            background: #d1fae5;
            color: #065f46;
          }
          .badge-overdue {
            background: #fed7aa;
            color: #9a3412;
          }
          .badge-critical {
            background: #fecaca;
            color: #991b1b;
          }
          .badge-abnormal {
            background: #fed7aa;
            color: #9a3412;
          }
          @media print {
            body {
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏥 Results Command Center Report</h1>
          <p><strong>Generated:</strong> ${format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
          <p><strong>Total Results:</strong> ${results.length}</p>
        </div>
        
        ${filterSummary.length > 0 ? `
          <div class="filters">
            <strong>Filters Applied:</strong> ${filterSummary.join(' | ')}
          </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Type</th>
              <th>ID</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Completed</th>
              <th>Days</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(result => {
              const agingInfo = getAgingInfo((result as any).requestedDate, result.type as any, result.status);
              
              let flags = [];
              if (agingInfo.isOverdue) {
                flags.push('<span class="badge badge-overdue">🚨 OVERDUE</span>');
              }
              
              if (result.status === 'completed') {
                if (result.type === 'lab') {
                  const critical = hasCriticalFindings((result as any).results);
                  const abnormal = hasAbnormalFindings((result as any).results);
                  if (critical) {
                    flags.push('<span class="badge badge-critical">🚨 CRITICAL</span>');
                  } else if (abnormal) {
                    flags.push('<span class="badge badge-abnormal">⚠️ Abnormal</span>');
                  }
                } else if (result.type === 'xray' || result.type === 'ultrasound') {
                  const abnormal = hasAbnormalImagingFindings((result as any).findings, (result as any).impression);
                  if (abnormal) {
                    flags.push('<span class="badge badge-abnormal">⚠️ Abnormal</span>');
                  }
                }
              }

              return `
                <tr>
                  <td>
                    ${result.patient ? `${result.patient.firstName} ${result.patient.lastName}` : 'Unknown'}<br/>
                    <small>${result.patient?.patientId || result.patientId}</small>
                  </td>
                  <td>${formatDepartmentName(result.type, false)}</td>
                  <td>${result.type === 'lab' ? (result as any).testId : (result as any).examId}</td>
                  <td>
                    <span class="badge badge-${result.status}">${result.status}</span>
                  </td>
                  <td>${format(new Date((result as any).requestedDate), 'MMM dd, yyyy')}</td>
                  <td>${(result as any).completedDate ? format(new Date((result as any).completedDate), 'MMM dd, yyyy') : '-'}</td>
                  <td>${result.status === 'pending' ? agingInfo.daysOld + 'd' : '-'}</td>
                  <td>${flags.join(' ')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToPDF}
        className="flex items-center gap-2"
        disabled={results.length === 0}
      >
        <FileText className="h-4 w-4" />
        Export PDF
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={exportToCSV}
        className="flex items-center gap-2"
        disabled={results.length === 0}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
}
