import { Drug } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PatientInstructionSheetProps {
  patient: {
    patientId: string;
    firstName: string;
    lastName: string;
  };
  drug: Drug;
  prescription: {
    orderId: string;
    dosage: string;
    quantity: number;
    instructions: string;
    duration?: string;
  };
  date: string;
}

// Get educational content for the drug
const getInstructionContent = (drug: Drug) => {
  const genericName = drug.genericName?.toLowerCase() || "";
  
  // Paracetamol/Acetaminophen
  if (genericName.includes("acetaminophen") || genericName.includes("paracetamol")) {
    return {
      whatItDoes: "This medicine reduces pain and fever. It is safe and works well for headaches, body aches, and fevers from malaria or other infections.",
      donts: [
        "Do not take more than 8 tablets per day (4000mg)",
        "Do not drink alcohol while taking this medicine",
        "Do not use if you have severe liver disease",
        "Do not combine with other medicines containing paracetamol"
      ],
      warnings: [
        "If fever continues for more than 3 days",
        "If pain continues for more than 5 days",
        "If you develop yellowing of eyes or skin",
        "If you have stomach pain or vomiting"
      ]
    };
  }
  
  // Antimalarials
  if (genericName.includes("artemether") || genericName.includes("coartem")) {
    return {
      whatItDoes: "This medicine treats malaria by killing the parasites in your blood. It is very important to take all doses even if you feel better.",
      donts: [
        "Do not skip any doses",
        "Do not stop taking it even if you feel better",
        "Do not take on an empty stomach",
        "Do not share with others"
      ],
      warnings: [
        "If fever continues after 3 days of treatment",
        "If you vomit within 1 hour of taking the medicine",
        "If you develop severe headache or confusion",
        "If you cannot eat or drink"
      ]
    };
  }
  
  // Antibiotics
  if (genericName.includes("amoxicillin") || genericName.includes("antibiotic")) {
    return {
      whatItDoes: "This medicine fights bacterial infections. You must complete the full course of treatment to cure the infection and prevent resistance.",
      donts: [
        "Do not stop taking it early, even if you feel better",
        "Do not skip doses",
        "Do not share with others",
        "Do not save for later use"
      ],
      warnings: [
        "If you develop a rash or severe itching",
        "If you have severe diarrhea",
        "If symptoms worsen after 2-3 days",
        "If you develop difficulty breathing"
      ]
    };
  }
  
  // Default
  return {
    whatItDoes: "This medication has been prescribed for your specific condition. Follow your healthcare provider's instructions carefully.",
    donts: [
      "Do not share this medication with others",
      "Do not take more than prescribed",
      "Do not skip doses",
      "Do not use if expired"
    ],
    warnings: [
      "If symptoms worsen",
      "If you experience side effects",
      "If condition does not improve in expected time",
      "If you have questions about the medication"
    ]
  };
};

export function PatientInstructionSheet({ patient, drug, prescription, date }: PatientInstructionSheetProps) {
  const content = getInstructionContent(drug);
  
  // Helper for quantity display
  const quantityText = `${prescription.quantity} ${drug.form}${prescription.quantity !== 1 ? 's' : ''}`;

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      // Popup was blocked or failed to open
      alert('Please allow popups for this website to print patient instructions. You can also try using Ctrl+P to print this page.');
      return;
    }

    // Generate the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medication Instructions - ${patient.patientId}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              box-sizing: border-box;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            
            /* Header - Premium Design Matching Invoice */
            .header {
              border-bottom: 3px solid #1e3a8a;
              padding-bottom: 12px;
              margin-bottom: 15px;
            }
            .clinic-branding {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 10px;
            }
            .clinic-info {
              flex: 1;
            }
            .clinic-name {
              font-size: 20px;
              font-weight: bold;
              color: #1e3a8a;
              margin-bottom: 4px;
              letter-spacing: -0.02em;
            }
            .clinic-tagline {
              font-size: 12px;
              font-style: italic;
              color: #4b5563;
              margin-bottom: 8px;
            }
            .clinic-contact {
              font-size: 10px;
              color: #374151;
              line-height: 1.5;
            }
            .clinic-contact p {
              margin: 2px 0;
            }
            .logo-placeholder {
              width: 80px;
              height: 80px;
              background: #f3f4f6;
              border: 2px solid #1e3a8a;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              color: #6b7280;
              text-align: center;
              padding: 4px;
            }
            
            /* Document Title - Navy Blue Header */
            .doc-title {
              background: #1e3a8a;
              color: white;
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              padding: 12px;
              margin: 15px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            /* Patient Information Section */
            .patient-info {
              border: 1px solid #4b5563;
              border-radius: 4px;
              padding: 16px;
              margin-bottom: 20px;
            }
            .patient-info-header {
              font-weight: bold;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 12px;
              padding-bottom: 6px;
              border-bottom: 1px solid #4b5563;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              line-height: 1.6;
            }
            .info-label {
              font-weight: bold;
              font-size: 11px;
            }
            .info-value {
              font-size: 11px;
            }
            
            /* Section Headers - Navy Blue */
            .section {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .section-header {
              background: #1e3a8a;
              color: white;
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              padding: 8px;
              margin-bottom: 12px;
              text-transform: uppercase;
            }
            
            /* Medication Name */
            .medication-name {
              font-size: 18px;
              font-weight: bold;
              color: #1e3a8a;
              margin-bottom: 8px;
            }
            .generic-name {
              font-size: 12px;
              font-style: italic;
              color: #6b7280;
              margin-bottom: 10px;
            }
            
            /* Details Box */
            .details-box {
              border: 1px solid #d1d5db;
              border-radius: 4px;
              padding: 12px;
              margin-bottom: 12px;
            }
            .details-box p {
              margin: 6px 0;
              font-size: 11px;
              line-height: 1.8;
            }
            .details-box strong {
              font-weight: bold;
            }
            
            /* Content Text */
            .content-text {
              font-size: 11px;
              line-height: 1.7;
              color: #1f2937;
              margin-bottom: 12px;
            }
            
            /* Lists */
            ul {
              margin: 10px 0;
              padding-left: 25px;
              list-style: none;
            }
            li {
              margin-bottom: 8px;
              font-size: 11px;
              line-height: 1.8;
              position: relative;
              padding-left: 20px;
            }
            li:before {
              content: "✓";
              position: absolute;
              left: 0;
              color: #1e3a8a;
              font-weight: bold;
            }
            
            /* Warnings Box - Highlighted */
            .warning-box {
              border: 2px solid #dc2626;
              background-color: #fef2f2;
              border-radius: 4px;
              padding: 16px;
              margin: 12px 0;
            }
            .warning-box ul {
              margin: 8px 0 0 0;
            }
            .warning-box li:before {
              content: "✗";
              color: #dc2626;
            }
            .warning-header {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 8px;
            }
            
            /* Return Box */
            .return-box {
              background-color: #fffbeb;
              border: 2px solid #f59e0b;
              border-radius: 4px;
              padding: 16px;
              margin: 12px 0;
            }
            .return-box ul {
              margin: 8px 0 0 0;
            }
            .return-box li:before {
              content: "•";
              color: #f59e0b;
            }
            .contact-info {
              font-weight: bold;
              font-size: 11px;
              margin-top: 12px;
              color: #1e3a8a;
            }
            
            /* Dispenser Section */
            .dispenser-section {
              border-top: 1px solid #4b5563;
              border-bottom: 1px solid #4b5563;
              padding: 12px 0;
              margin: 20px 0;
              font-size: 10px;
            }
            .dispenser-section p {
              margin: 4px 0;
            }
            .dispenser-section strong {
              font-weight: bold;
            }
            
            /* Footer - Match Invoice Style */
            .footer {
              border-top: 2px solid #4b5563;
              margin-top: 30px;
              padding-top: 15px;
              text-align: center;
            }
            .footer-computer-generated {
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
              color: #374151;
            }
            .footer-clinic-name {
              font-size: 11px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 4px;
            }
            .footer-credentials {
              font-size: 9px;
              color: #6b7280;
              margin-bottom: 6px;
            }
            .footer-tagline {
              font-size: 10px;
              font-style: italic;
              color: #6b7280;
            }
            
            @media print {
              body {
                padding: 0;
              }
              .section {
                page-break-inside: avoid;
              }
              button, .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Premium Header Matching Invoice -->
            <div class="header">
              <div class="clinic-branding">
                <div class="clinic-info">
                  <div class="clinic-name">Bahr El Ghazal Clinic</div>
                  <div class="clinic-tagline">Excellence in Healthcare</div>
                  <div class="clinic-contact">
                    <p><strong>Aweil, South Sudan</strong></p>
                    <p>Tel: +211916759060 / +211928754760</p>
                    <p>Email: bahr.ghazal.clinic@gmail.com</p>
                  </div>
                </div>
                <div class="logo-placeholder">
                  [LOGO]
                </div>
              </div>
            </div>

            <!-- Document Title - Navy Blue Bar -->
            <div class="doc-title">
              Medication Instructions - Patient Copy
            </div>

            <!-- Patient Information Section -->
            <div class="patient-info">
              <div class="patient-info-header">Patient Information</div>
              <div class="info-row">
                <span class="info-label">Patient Name:</span>
                <span class="info-value">${patient.firstName} ${patient.lastName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Patient ID:</span>
                <span class="info-value">${patient.patientId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Order Number:</span>
                <span class="info-value">${prescription.orderId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date Dispensed:</span>
                <span class="info-value">${date}</span>
              </div>
            </div>

            <!-- Medication Details Section -->
            <div class="section">
              <div class="section-header">💊 Your Medication</div>
              <div class="medication-name">${drug.name.toUpperCase()}</div>
              ${drug.genericName ? `<div class="generic-name">(Generic Name: ${drug.genericName})</div>` : ''}
              
              <div class="details-box">
                <p><strong>Form:</strong> ${drug.form}</p>
                ${drug.strength ? `<p><strong>Strength:</strong> ${drug.strength}</p>` : ''}
                <p><strong>Quantity:</strong> ${quantityText}</p>
              </div>
            </div>

            <!-- What This Medicine Does -->
            <div class="section">
              <div class="section-header">📋 What This Medicine Does</div>
              <p class="content-text">${content.whatItDoes}</p>
            </div>

            <!-- How to Take It -->
            <div class="section">
              <div class="section-header">💊 How to Take It</div>
              <div class="details-box">
                <p><strong>Dosage:</strong> ${prescription.dosage}</p>
                <p><strong>Quantity:</strong> ${quantityText}</p>
                <p><strong>Instructions:</strong> ${prescription.instructions}</p>
                ${prescription.duration ? `<p><strong>Duration:</strong> ${prescription.duration}</p>` : ''}
              </div>
            </div>

            <!-- Important Warnings - Highlighted Box -->
            <div class="section">
              <div class="section-header">⚠️ Important Warnings</div>
              <div class="warning-box">
                <div class="warning-header">DO NOT:</div>
                <ul>
                  ${content.donts.map(dont => `<li>${dont}</li>`).join('')}
                </ul>
              </div>
            </div>

            <!-- When to Return to Clinic -->
            <div class="section">
              <div class="section-header">🚨 When to Return to Clinic</div>
              <div class="return-box">
                <p style="font-weight: bold; margin-bottom: 8px; font-size: 11px;">Return immediately if you experience:</p>
                <ul>
                  ${content.warnings.map(warning => `<li>${warning}</li>`).join('')}
                </ul>
                <div class="contact-info">Contact us: +211916759060</div>
              </div>
            </div>

            <!-- Dispenser/Date Section -->
            <div class="dispenser-section">
              <p><strong>Dispensed By:</strong> Pharmacy Department</p>
              <p><strong>Date:</strong> ${date}</p>
            </div>

            <!-- Official Footer Matching Invoice -->
            <div class="footer">
              <p class="footer-computer-generated">
                This is a computer-generated medication guide
              </p>
              <p class="footer-clinic-name">Bahr El Ghazal Clinic</p>
              <p class="footer-credentials">Accredited Medical Facility | Republic of South Sudan</p>
              <p class="footer-tagline">Your health is our priority</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePrint}
        variant="outline"
        className="w-full border-purple-500 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
      >
        <Printer className="w-4 h-4 mr-2" />
        📄 Generate Patient Instructions
      </Button>
    </div>
  );
}
