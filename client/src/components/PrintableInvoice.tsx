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
  
  return (
    <div className="hidden print:block" id="printable-invoice">
      {/* Professional invoice layout */}
      <div className="p-8 max-w-4xl mx-auto bg-white">
        {/* Header with Clinic Logo/Name */}
        <div className="border-b-2 border-blue-600 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Bahr El Ghazal Clinic</h1>
          <p className="text-gray-600">Medical Management System</p>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="font-bold text-lg mb-2">INVOICE</h2>
            {invoiceId && <p>Invoice #: {invoiceId}</p>}
            <p>Date: {new Date(visit.visitDate).toLocaleDateString()}</p>
            <p>Visit ID: {visit.encounterId}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold mb-2">Patient Information</h3>
            <p className="font-semibold">{patient.firstName} {patient.lastName}</p>
            <p>ID: {patient.patientId}</p>
            {patient.phoneNumber && <p>Phone: {patient.phoneNumber}</p>}
          </div>
        </div>

        {/* Services Table */}
        <table className="w-full mb-6">
          <thead className="bg-gray-100 border-y border-gray-300">
            <tr>
              <th className="text-left p-3">Service Description</th>
              <th className="text-center p-3">Qty</th>
              <th className="text-right p-3">Unit Price</th>
              <th className="text-right p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {orderLines.map((line, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="p-3">{line.description}</td>
                <td className="text-center p-3">{line.quantity}</td>
                <td className="text-right p-3">{formatCurrency(line.unitPriceSnapshot)}</td>
                <td className="text-right p-3">{formatCurrency(line.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between p-3 bg-blue-600 text-white font-bold text-xl">
              <span>TOTAL:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-center text-sm text-gray-600">
          <p>Thank you for choosing Bahr El Ghazal Clinic</p>
          <p className="mt-2">This is an official invoice for medical services rendered.</p>
        </div>
      </div>
    </div>
  );
};
