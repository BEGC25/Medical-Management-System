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
      {/* Professional invoice layout */}
      <div className="p-8 max-w-4xl mx-auto bg-white">
        {/* Header with Clinic Logo/Name */}
        <div className="border-b-4 border-blue-600 pb-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-blue-600 mb-2">Bahr El Ghazal Clinic</h1>
              <p className="text-lg text-gray-600">Medical Management System</p>
              <p className="text-sm text-gray-500 mt-1">Professional Healthcare Services</p>
            </div>
            {!logoError && (
              <div className="w-32 h-32 flex-shrink-0">
                <img 
                  src="/clinic-logo.jpg" 
                  alt="Clinic Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="font-bold text-2xl mb-3 text-gray-800">INVOICE</h2>
            {invoiceId && <p className="text-sm mb-1"><span className="font-semibold">Invoice #:</span> {invoiceId}</p>}
            <p className="text-sm mb-1"><span className="font-semibold">Date:</span> {new Date(visit.visitDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p className="text-sm"><span className="font-semibold">Visit ID:</span> {visit.encounterId}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-lg mb-3 text-gray-800">Patient Information</h3>
            <p className="font-semibold text-lg mb-1">{patient.firstName} {patient.lastName}</p>
            <p className="text-sm mb-1">Patient ID: {patient.patientId}</p>
            {patient.phoneNumber && <p className="text-sm mb-1">Phone: {patient.phoneNumber}</p>}
          </div>
        </div>

        {/* Services Table */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-3 text-gray-800">Services Rendered</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y-2 border-gray-400">
                <th className="text-left p-3 font-semibold">Service Description</th>
                <th className="text-center p-3 font-semibold w-20">Qty</th>
                <th className="text-right p-3 font-semibold w-32">Unit Price</th>
                <th className="text-right p-3 font-semibold w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderLines.map((line, idx) => (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="p-3">{line.description}</td>
                  <td className="text-center p-3">{line.quantity}</td>
                  <td className="text-right p-3">{formatCurrency(line.unitPriceSnapshot)}</td>
                  <td className="text-right p-3 font-semibold">{formatCurrency(line.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end mb-12">
          <div className="w-80">
            <div className="bg-blue-600 text-white p-4 rounded">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xl">GRAND TOTAL:</span>
                <span className="font-bold text-2xl">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-300 pt-6">
          <p className="text-lg font-semibold text-gray-700 mb-4 text-center">Thank you for choosing Bahr El Ghazal Clinic</p>
          <p className="text-sm text-gray-600 mb-1 text-center">This is an official invoice for medical services rendered.</p>
          
          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-8 mt-12 mb-8">
            <div>
              <div className="border-t-2 border-gray-400 pt-2 mt-16">
                <p className="text-sm font-semibold text-gray-700">Authorized Signature</p>
                <p className="text-xs text-gray-500">Billing Department</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-gray-400 pt-2 mt-16">
                <p className="text-sm font-semibold text-gray-700">Date</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">For inquiries, please contact the clinic administration.</p>
        </div>
      </div>
    </div>
  );
};
