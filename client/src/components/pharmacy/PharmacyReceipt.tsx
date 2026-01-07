import { PharmacyOrder, Patient } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, X } from "lucide-react";
import { useRef } from "react";

interface PrescriptionWithPatient extends PharmacyOrder {
  patient: Patient;
}

interface PharmacyReceiptProps {
  order: PrescriptionWithPatient | null;
  onClose: () => void;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const dateFormatted = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeFormatted = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateFormatted} at ${timeFormatted}`;
  } catch {
    return dateString;
  }
}

export function PharmacyReceipt({ order, onClose }: PharmacyReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Print Controls - Hidden when printing */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 print:hidden">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Print Preview</h2>
            <div className="flex gap-2">
              <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
              <Button onClick={onClose} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div ref={receiptRef} className="p-8 print:p-12 bg-white">
          {/* Clinic Header */}
          <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bahr El Ghazal Clinic</h1>
            <p className="text-gray-600 text-sm">Pharmacy Department</p>
            <p className="text-gray-600 text-sm">Medication Dispensing Receipt</p>
          </div>

          {/* Receipt Information */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Patient Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b border-gray-200 pb-2">
                Patient Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient Name:</span>
                  <span className="font-semibold text-gray-900">
                    {order.patient?.firstName} {order.patient?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient ID:</span>
                  <span className="font-semibold text-gray-900">{order.patient?.patientId}</span>
                </div>
                {order.patient?.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-semibold text-gray-900">{order.patient.age}</span>
                  </div>
                )}
                {order.patient?.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-semibold text-gray-900">{order.patient.gender}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b border-gray-200 pb-2">
                Order Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-semibold text-gray-900">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prescribed:</span>
                  <span className="font-semibold text-gray-900">{formatDate(order.createdAt)}</span>
                </div>
                {order.dispensedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dispensed:</span>
                    <span className="font-semibold text-gray-900">{formatDate(order.dispensedAt)}</span>
                  </div>
                )}
                {order.dispensedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dispensed By:</span>
                    <span className="font-semibold text-gray-900">{order.dispensedBy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medication Details */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b border-gray-200 pb-2">
              Medication Details
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Drug Name:</span>
                <span className="text-lg font-bold text-blue-600">{order.drugName}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dosage:</span>
                  <span className="font-semibold text-gray-900">{order.dosage || 'As prescribed'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-semibold text-gray-900">{order.quantity}</span>
                </div>
                {order.route && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-semibold text-gray-900">{order.route}</span>
                  </div>
                )}
                {order.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold text-gray-900">{order.duration}</span>
                  </div>
                )}
              </div>
              {order.instructions && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-gray-700 font-medium block mb-1">Instructions:</span>
                  <p className="text-gray-900 text-sm italic leading-relaxed">{order.instructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="mb-8 flex gap-3 justify-center print:justify-start">
            {order.paymentStatus === 'paid' && (
              <Badge className="bg-green-600 text-white px-4 py-1 text-sm">PAID</Badge>
            )}
            {order.paymentStatus === 'unpaid' && (
              <Badge className="bg-orange-600 text-white px-4 py-1 text-sm">UNPAID</Badge>
            )}
            {order.dispensedAt && (
              <Badge className="bg-blue-600 text-white px-4 py-1 text-sm">DISPENSED</Badge>
            )}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-6 mt-8">
            <div className="text-center text-xs text-gray-500 mb-4">
              Receipt generated on {new Date().toLocaleString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            <div className="flex justify-between items-end mt-8 pt-4 border-t border-gray-200">
              <div className="text-sm">
                <p className="text-gray-600 mb-2">Pharmacist Signature:</p>
                <div className="border-b-2 border-gray-400 w-48 h-8"></div>
              </div>
              <div className="text-xs text-gray-500 text-right">
                <p>Bahr El Ghazal Clinic</p>
                <p>For official use only</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          [role="dialog"] {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          
          [role="dialog"] * {
            visibility: visible;
          }
          
          .print\\:hidden,
          [class*="sticky"],
          button {
            display: none !important;
          }
          
          .print\\:p-12 {
            padding: 0 !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
