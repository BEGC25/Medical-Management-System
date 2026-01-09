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
    <div className="hidden print:block" id="printable-invoice">
      <style>{`
        @media print {
          @page {
            margin: 0.5in;
            size: letter;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      
      {/* Premium Professional Invoice Layout */}
      <div className="p-8 max-w-4xl mx-auto bg-white font-sans">
        {/* Professional Header with Gradient Border */}
        <div className="border-b-4 border-blue-700 pb-6 mb-8" style={{ borderImage: 'linear-gradient(to right, #1e40af, #3b82f6) 1' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-blue-700 mb-3" style={{ letterSpacing: '-0.02em' }}>
                Bahr El Ghazal Clinic
              </h1>
              <div className="text-gray-700 space-y-1 mt-3">
                <p className="text-base font-medium">Wau, South Sudan</p>
                <p className="text-sm">Tel: +211 XXX XXX XXX</p>
                <p className="text-sm">Email: info@bahrelghazalclinic.ss</p>
              </div>
            </div>
            {!logoError && (
              <div className="w-40 h-40 flex-shrink-0 ml-6">
                <img 
                  src="/clinic-logo.jpg" 
                  alt="Clinic Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-center text-lg font-semibold text-gray-800 tracking-wide">
              OFFICIAL MEDICAL INVOICE
            </p>
          </div>
        </div>

        {/* Invoice Details and Patient Information - Side by Side Cards */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Invoice Details Box */}
          <div className="border-2 border-gray-300 rounded-lg p-5 bg-gray-50">
            <h2 className="font-bold text-xl mb-4 text-gray-800 border-b-2 border-blue-600 pb-2">
              INVOICE DETAILS
            </h2>
            <div className="space-y-2">
              {invoiceId && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Invoice Number:</span>
                  <span className="text-sm font-bold text-blue-700">{invoiceId}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Invoice Date:</span>
                <span className="text-sm font-medium">{new Date(visit.visitDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Invoice Time:</span>
                <span className="text-sm font-medium">{new Date(visit.visitDate).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Visit ID:</span>
                <span className="text-sm font-medium">{visit.encounterId}</span>
              </div>
              {visit.attendingClinician && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Clinician:</span>
                  <span className="text-sm font-medium">{visit.attendingClinician}</span>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information Box */}
          <div className="border-2 border-gray-300 rounded-lg p-5 bg-blue-50">
            <h3 className="font-bold text-xl mb-4 text-gray-800 border-b-2 border-blue-600 pb-2">
              PATIENT INFORMATION
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Full Name</p>
                <p className="text-base font-bold text-gray-900">{patient.firstName} {patient.lastName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Patient ID</p>
                <p className="text-sm font-medium text-gray-900">{patient.patientId}</p>
              </div>
              {patient.phoneNumber && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Contact</p>
                  <p className="text-sm font-medium text-gray-900">{patient.phoneNumber}</p>
                </div>
              )}
              {patient.age && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Age</p>
                  <p className="text-sm font-medium text-gray-900">{patient.age}</p>
                </div>
              )}
              {patient.gender && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Gender</p>
                  <p className="text-sm font-medium text-gray-900">{patient.gender}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services Table with Professional Styling */}
        <div className="mb-8">
          <h3 className="font-bold text-xl mb-4 text-gray-800 border-b-2 border-gray-400 pb-2">
            SERVICES RENDERED
          </h3>
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="text-left p-4 font-bold border-r border-blue-600">Service Description</th>
                <th className="text-center p-4 font-bold w-24 border-r border-blue-600">Qty</th>
                <th className="text-right p-4 font-bold w-32 border-r border-blue-600">Unit Price</th>
                <th className="text-center p-4 font-bold w-28 border-r border-blue-600">Status</th>
                <th className="text-right p-4 font-bold w-36">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderLines.map((line, idx) => (
                <tr 
                  key={idx} 
                  className={`border-b-2 border-gray-300 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <td className="p-4 border-r border-gray-300">
                    <span className="font-medium text-gray-900">{line.description}</span>
                  </td>
                  <td className="text-center p-4 border-r border-gray-300">
                    <span className="font-semibold text-gray-800">{line.quantity}</span>
                  </td>
                  <td className="text-right p-4 border-r border-gray-300">
                    <span className="text-gray-800">{formatCurrency(line.unitPriceSnapshot)}</span>
                  </td>
                  <td className="text-center p-4 border-r border-gray-300">
                    <span className="text-xs font-semibold uppercase px-2 py-1 rounded bg-green-100 text-green-800">
                      {line.status}
                    </span>
                  </td>
                  <td className="text-right p-4">
                    <span className="font-bold text-gray-900">{formatCurrency(line.totalPrice)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Section with Breakdown */}
        <div className="flex justify-end mb-12">
          <div className="w-96 border-2 border-gray-400 rounded-lg overflow-hidden">
            {/* Subtotal */}
            <div className="bg-gray-100 border-b-2 border-gray-300 p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700 text-lg">Subtotal:</span>
                <span className="font-bold text-gray-900 text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
            {/* Tax (if applicable) */}
            <div className="bg-gray-50 border-b-2 border-gray-300 p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Tax (0%):</span>
                <span className="font-medium text-gray-900">{formatCurrency(0)}</span>
              </div>
            </div>
            {/* Grand Total */}
            <div className="bg-blue-700 text-white p-5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xl">GRAND TOTAL:</span>
                <span className="font-bold text-3xl">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="border-t-2 border-gray-400 pt-8 mt-8">
          {/* Signature and Date Lines */}
          <div className="grid grid-cols-2 gap-12 mb-8">
            <div>
              <div className="h-20 mb-2"></div>
              <div className="border-t-2 border-gray-800 pt-2">
                <p className="text-sm font-bold text-gray-800">Authorized By:</p>
                <p className="text-xs text-gray-600 mt-1">Billing Department</p>
              </div>
            </div>
            <div>
              <div className="h-20 mb-2"></div>
              <div className="border-t-2 border-gray-800 pt-2">
                <p className="text-sm font-bold text-gray-800">Date:</p>
                <p className="text-xs text-gray-600 mt-1">{new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>
          </div>

          {/* Official Statement and Contact */}
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 mb-4">
            <p className="text-center text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              This is a computer-generated invoice
            </p>
            <p className="text-center text-xs text-gray-600">
              Valid for submission to insurance companies, employers, and government agencies
            </p>
          </div>

          {/* Contact Information */}
          <div className="text-center space-y-1 mb-4">
            <p className="text-sm font-medium text-gray-700">Bahr El Ghazal Clinic</p>
            <p className="text-xs text-gray-600">Wau, South Sudan | Tel: +211 XXX XXX XXX</p>
            <p className="text-xs text-gray-600">Email: info@bahrelghazalclinic.ss</p>
          </div>

          {/* Thank You Message */}
          <div className="text-center pt-4 border-t border-gray-300">
            <p className="text-base font-semibold text-blue-700 mb-1">
              Thank you for choosing Bahr El Ghazal Clinic
            </p>
            <p className="text-xs text-gray-600">
              Your health is our priority
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
