/**
 * Utility functions for exporting data in various formats
 */

export type ExportFormat = "csv" | "excel" | "pdf";

/**
 * Convert data to CSV format
 */
export function exportToCSV(data: any[], columns: string[], filename: string) {
  if (data.length === 0) return;

  // Create CSV header
  const header = columns.join(",");

  // Create CSV rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col];
        // Handle values that contain commas, quotes, or newlines
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",");
  });

  // Combine header and rows
  const csv = [header, ...rows].join("\n");

  // Create and trigger download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Convert data to Excel format (requires library installation)
 * For now, we'll use CSV as a fallback
 */
export function exportToExcel(data: any[], columns: string[], filename: string) {
  // TODO: Implement proper Excel export using xlsx library
  // For now, use CSV as fallback
  exportToCSV(data, columns, filename);
}

/**
 * Convert data to PDF format (basic implementation)
 */
export function exportToPDF(data: any[], columns: string[], columnLabels: Record<string, string>, filename: string) {
  // Create a simple HTML table for PDF printing
  const header = columns.map((col) => columnLabels[col] || col).join("</th><th>");
  const rows = data
    .map((row) => {
      const cells = columns.map((col) => {
        const value = row[col];
        return value === null || value === undefined ? "" : String(value);
      });
      return `<tr><td>${cells.join("</td><td>")}</td></tr>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 24px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>${filename}</h1>
        <table>
          <thead>
            <tr><th>${header}</th></tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

/**
 * Helper function to download a blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data based on format
 */
export function exportData(
  data: any[],
  columns: string[],
  columnLabels: Record<string, string>,
  format: ExportFormat,
  filename: string
) {
  switch (format) {
    case "csv":
      exportToCSV(data, columns, filename);
      break;
    case "excel":
      exportToExcel(data, columns, filename);
      break;
    case "pdf":
      exportToPDF(data, columns, columnLabels, filename);
      break;
    default:
      console.error("Unsupported export format:", format);
  }
}
