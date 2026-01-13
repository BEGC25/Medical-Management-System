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
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      
      {/* Premium Professional Invoice Layout with Border */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="p-3 max-w-4xl mx-auto bg-white font-sans">
        {/* Professional Header with Gradient Border */}
        <div className="border-b-2 border-blue-900 pb-2 mb-3" style={{ borderImage: 'linear-gradient(to right, #1e3a8a, #1e40af) 1' }}>
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-blue-900 mb-0.5 leading-tight" style={{ letterSpacing: '-0.02em' }}>
                Bahr El Ghazal Clinic
              </h1>
              <p className="text-xs text-gray-600 italic mb-1">Excellence in Healthcare</p>
              <div className="text-gray-700 leading-tight">
                <p className="text-xs font-medium">Aweil, South Sudan</p>
                <p className="text-xs">Tel: +211916759060/+211928754760</p>
                <p className="text-xs">Email: bahr.ghazal.clinic@gmail.com</p>
              </div>
            </div>
            {!logoError && (
              <div className="w-32 h-32 flex-shrink-0 ml-4">
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
        <div className="h-1 bg-gradient-to-r from-blue-900 to-blue-800 mb-3"></div>

        {/* Invoice Details and Patient Information - Side by Side Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4 invoice-section">
          {/* Invoice Details Box */}
          <div className="border border-gray-300 shadow-sm rounded p-2 bg-gray-50">
            <h2 className="font-bold text-sm mb-1 text-gray-800 border-b border-blue-900 pb-1">
              INVOICE DETAILS
            </h2>
            <div className="space-y-1 leading-tight">
              {invoiceId && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Invoice:</span>
                  <span className="text-xs font-bold text-blue-900">{invoiceId}</span>
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
          <div className="border border-gray-300 shadow-sm rounded p-2 bg-blue-50">
            <h3 className="font-bold text-sm mb-1 text-gray-800 border-b border-blue-900 pb-1">
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
        <div className="mb-4 invoice-section">
          <h3 className="font-bold text-sm mb-1 text-gray-800 border-b-2 border-gray-400 pb-1">
            SERVICES RENDERED
          </h3>
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="text-left p-1.5 text-xs font-bold border-r border-blue-800">Service Description</th>
                <th className="text-center p-1.5 text-xs font-bold w-16 border-r border-blue-800">Qty</th>
                <th className="text-right p-1.5 text-xs font-bold w-24 border-r border-blue-800">Unit Price</th>
                <th className="text-right p-1.5 text-xs font-bold w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderLines.map((line, idx) => (
                <tr 
                  key={idx} 
                  className={`border-b border-gray-300 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <td className="p-1.5 px-2 border-r border-gray-300">
                    <span className="font-medium text-xs text-gray-900">{line.description}</span>
                  </td>
                  <td className="text-center p-1.5 border-r border-gray-300">
                    <span className="font-semibold text-xs text-gray-800">{line.quantity}</span>
                  </td>
                  <td className="text-right p-1.5 px-2 border-r border-gray-300">
                    <span className="text-xs text-gray-800">{formatCurrency(line.unitPriceSnapshot)}</span>
                  </td>
                  <td className="text-right p-1.5 px-2">
                    <span className="font-bold text-xs text-gray-900">{formatCurrency(line.totalPrice)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Section - Simplified */}
        <div className="flex justify-end mb-4 invoice-section">
          <div className="w-64 border-2 border-gray-400 rounded overflow-hidden shadow-sm">
            {/* Grand Total */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">GRAND TOTAL:</span>
                <span className="font-bold text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section - Professional with adequate space */}
        <div className="grid grid-cols-2 gap-12 mt-4 mb-3 invoice-section">
          <div>
            <div className="border-t-2 border-gray-800 pt-2 mt-12">
              <p className="text-sm font-bold text-gray-900">Authorized By:</p>
              <p className="text-xs text-gray-600">Billing Department</p>
            </div>
          </div>
          <div>
            <div className="border-t-2 border-gray-800 pt-2 mt-12">
              <p className="text-sm font-bold text-gray-900">Date:</p>
              <p className="text-xs text-gray-600">{new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}</p>
            </div>
          </div>
        </div>

        {/* Professional Footer Branding */}
        <div className="text-center text-xs text-gray-600 border-t-2 border-gray-300 pt-2 mt-4 print:mb-0 print:pb-0">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            This is a computer-generated invoice
          </p>
          <p className="font-semibold text-gray-800">Bahr El Ghazal Clinic</p>
          <p className="text-gray-700">Accredited Medical Facility | Republic of South Sudan</p>
          <p className="mt-1 italic text-gray-600">Your health is our priority</p>
        </div>
      </div>
    </div>
    </div>
  );
};
