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

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    // Generate the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medication Instructions - ${patient.patientId}</title>
          <style>
            @page {
              margin: 1.5cm;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #000;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .clinic-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .doc-title {
              font-size: 18px;
              font-weight: bold;
              margin: 15px 0;
            }
            .patient-info {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              width: 150px;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              background: #000;
              color: #fff;
              padding: 8px 12px;
              border-radius: 4px;
              margin-bottom: 10px;
            }
            .medication-name {
              font-size: 20px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .description {
              margin-bottom: 10px;
              font-size: 14px;
            }
            ul {
              margin: 10px 0;
              padding-left: 25px;
            }
            li {
              margin-bottom: 8px;
              font-size: 14px;
            }
            .warning-list {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 10px 15px;
            }
            .donts-list {
              background: #f8d7da;
              border-left: 4px solid #dc3545;
              padding: 10px 15px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #000;
              text-align: center;
              font-size: 12px;
            }
            .contact-info {
              margin-top: 10px;
              font-weight: bold;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">🏥 BAHR EL GHAZAL CLINIC</div>
            <div class="doc-title">MEDICATION INSTRUCTIONS</div>
          </div>

          <div class="patient-info">
            <div class="info-row">
              <span class="info-label">Patient Name:</span>
              <span>${patient.firstName} ${patient.lastName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Patient ID:</span>
              <span>${patient.patientId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Order Number:</span>
              <span>${prescription.orderId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${date}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">💊 YOUR MEDICATION</div>
            <div class="medication-name">${drug.name.toUpperCase()}</div>
            <div class="description">
              <strong>Generic Name:</strong> ${drug.genericName || 'N/A'}<br>
              <strong>Form:</strong> ${drug.form}<br>
              <strong>Strength:</strong> ${drug.strength || 'N/A'}
            </div>
          </div>

          <div class="section">
            <div class="section-title">📋 WHAT THIS MEDICINE DOES</div>
            <p class="description">${content.whatItDoes}</p>
          </div>

          <div class="section">
            <div class="section-title">💊 HOW TO TAKE IT</div>
            <p class="description">
              <strong>Dosage:</strong> ${prescription.dosage}<br>
              <strong>Quantity:</strong> ${prescription.quantity} ${drug.form}s<br>
              <strong>Instructions:</strong> ${prescription.instructions}
              ${prescription.duration ? `<br><strong>Duration:</strong> ${prescription.duration}` : ''}
            </p>
          </div>

          <div class="section">
            <div class="section-title">⚠️ IMPORTANT - DO NOT</div>
            <div class="donts-list">
              <ul>
                ${content.donts.map(dont => `<li>${dont}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🚨 WHEN TO RETURN TO CLINIC</div>
            <div class="warning-list">
              <p><strong>Come back to the clinic immediately if:</strong></p>
              <ul>
                ${content.warnings.map(warning => `<li>${warning}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="footer">
            <div class="contact-info">📞 QUESTIONS? Contact the clinic immediately if you have concerns</div>
            <p style="margin-top: 15px; font-style: italic;">Keep this instruction sheet for reference. Take all medication as prescribed.</p>
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
