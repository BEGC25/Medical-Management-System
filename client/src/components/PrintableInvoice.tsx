import React from 'react';
import type { Encounter, OrderLine, Patient } from '@shared/schema';
import { formatCurrency, calculateOrderLinesTotal } from '@/lib/utils';

interface PrintableInvoiceProps {
  visit: Encounter;
  patient: Patient;
  orderLines: OrderLine[];
  invoiceId?: string;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  visit,
  patient,
  orderLines,
  invoiceId,
}) => {
  const total = calculateOrderLinesTotal(orderLines);
  const [logoError, setLogoError] = React.useState(false);
  
  return (
    <div id="printable-invoice">
      <style>{`
        @media print {
          @page {
            /* A4 margins: 12mm top/bottom for single-page fit, 15mm left/right for printer safety */
            margin: 12mm 15mm;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Constrain invoice to single page: A4 height (297mm) minus top+bottom margins (12mm × 2 = 24mm) */
          #printable-invoice {
            max-height: calc(297mm - 24mm);
            overflow: hidden;
          }
          .invoice-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
      
      {/* Premium Professional Invoice Layout */}
      <div className="p-4 max-w-4xl mx-auto bg-white font-sans">
        {/* Professional Header with Gradient Border */}
        <div className="border-b-2 border-blue-700 pb-2 mb-2" style={{ borderImage: 'linear-gradient(to right, #1e40af, #3b82f6) 1' }}>
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-blue-700 mb-1 leading-tight" style={{ letterSpacing: '-0.02em' }}>
                Bahr El Ghazal Clinic
              </h1>
              <div className="text-gray-700 leading-tight">
                <p className="text-xs font-medium">Aweil, South Sudan</p>
                <p className="text-xs">Tel: +211916759060/+211928754760</p>
                <p className="text-xs">Email: bahr.ghazal.clinic@gmail.com</p>
              </div>
            </div>
            {!logoError && (
              <div className="w-36 h-36 flex-shrink-0 ml-4">
                <img 
                  src="/clinic-logo.jpg" 
                  alt="Clinic Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
          </div>
          <div className="mt-1 pt-1 border-t border-gray-300">
            <p className="text-center text-sm font-semibold text-gray-800 tracking-wide">
              OFFICIAL MEDICAL INVOICE
            </p>
          </div>
        </div>
        
        {/* Blue Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-700 mb-2"></div>

        {/* Invoice Details and Patient Information - Side by Side Cards */}
        <div className="grid grid-cols-2 gap-3 mb-2 invoice-section">
          {/* Invoice Details Box */}
          <div className="border border-gray-200 shadow-sm rounded-lg p-2 bg-gray-50">
            <h2 className="font-bold text-sm mb-1 text-gray-800 border-b border-blue-600 pb-1">
              INVOICE DETAILS
            </h2>
            <div className="space-y-1 leading-tight">
              {invoiceId && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Invoice:</span>
                  <span className="text-xs font-bold text-blue-700">{invoiceId}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">Date:</span>
                <span className="text-xs font-medium">{new Date(visit.visitDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">Visit ID:</span>
                <span className="text-xs font-medium">{visit.encounterId}</span>
              </div>
              {visit.attendingClinician && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Clinician:</span>
                  <span className="text-xs font-medium">{visit.attendingClinician}</span>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information Box */}
          <div className="border border-gray-200 shadow-sm rounded-lg p-2 bg-blue-50">
            <h3 className="font-bold text-sm mb-1 text-gray-800 border-b border-blue-600 pb-1">
              PATIENT INFORMATION
            </h3>
            <div className="space-y-1 leading-tight">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">Name:</span>
                <span className="text-xs font-bold text-gray-900">{patient.firstName} {patient.lastName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">Patient ID:</span>
                <span className="text-xs font-medium text-gray-900">{patient.patientId}</span>
              </div>
              {patient.phoneNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Phone:</span>
                  <span className="text-xs font-medium text-gray-900">{patient.phoneNumber}</span>
                </div>
              )}
              {(patient.age || patient.gender) && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">
                    {patient.age && patient.gender ? 'Age/Gender:' : patient.age ? 'Age:' : 'Gender:'}
                  </span>
                  <span className="text-xs font-medium text-gray-900">
                    {patient.age && patient.gender ? `${patient.age} / ${patient.gender}` : patient.age || patient.gender}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services Table with Professional Styling */}
        <div className="mb-2 invoice-section">
          <h3 className="font-bold text-sm mb-1 text-gray-800 border-b border-gray-400 pb-1">
            SERVICES RENDERED
          </h3>
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="text-left p-1 text-xs font-bold border-r border-blue-600">Service Description</th>
                <th className="text-center p-1 text-xs font-bold w-16 border-r border-blue-600">Qty</th>
                <th className="text-right p-1 text-xs font-bold w-24 border-r border-blue-600">Unit Price</th>
                <th className="text-right p-1 text-xs font-bold w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderLines.map((line, idx) => (
                <tr 
                  key={idx} 
                  className={`border-b border-gray-300 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <td className="p-1 px-2 border-r border-gray-300">
                    <span className="font-medium text-xs text-gray-900">{line.description}</span>
                  </td>
                  <td className="text-center p-1 border-r border-gray-300">
                    <span className="font-semibold text-xs text-gray-800">{line.quantity}</span>
                  </td>
                  <td className="text-right p-1 px-2 border-r border-gray-300">
                    <span className="text-xs text-gray-800">{formatCurrency(line.unitPriceSnapshot)}</span>
                  </td>
                  <td className="text-right p-1 px-2">
                    <span className="font-bold text-xs text-gray-900">{formatCurrency(line.totalPrice)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Section - Simplified */}
        <div className="flex justify-end mb-2 invoice-section">
          <div className="w-64 border border-gray-400 rounded overflow-hidden shadow-sm">
            {/* Grand Total */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">GRAND TOTAL:</span>
                <span className="font-bold text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section - Streamlined */}
        <div className="border-t border-gray-400 pt-2 mt-1">
          {/* Signature Line - Single Line */}
          <div className="flex justify-between items-center mb-1">
            <div className="flex-1">
              <div className="border-b border-gray-800 w-48 mb-1"></div>
              <p className="text-xs font-bold text-gray-800">Authorized By:</p>
            </div>
            <div className="flex-1 text-right">
              <div className="border-b border-gray-800 w-48 mb-1 ml-auto"></div>
              <p className="text-xs font-bold text-gray-800">Date:</p>
            </div>
          </div>

          {/* Official Statement */}
          <div className="text-center mb-1">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              This is a computer-generated invoice
            </p>
            <p className="text-xs text-gray-700 mt-1">
              Thank you for choosing Bahr El Ghazal Clinic
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
