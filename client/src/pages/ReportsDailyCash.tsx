import { useEffect, useMemo, useState } from "react"
import { Calendar as CalendarIcon, Download, RefreshCcw, Receipt, CircleDollarSign, Printer, CheckCircle, XCircle, Lock, ChevronRight } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ROLES } from "@shared/auth-roles"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

type ApiRow = {
  department: string
  receipt_count: number | string
  total_amount: number | string
}
type ApiPayload = {
  date: string
  method: string
  totals: { total_amount: number | string; receipt_count: number | string }
  rows: ApiRow[]
}

type ClosingStatus = {
  closed: boolean
  closing: {
    expected_amount: number
    counted_amount: number
    variance: number
    handed_over_by: string
    received_by: string
    notes?: string
    closed_at: string
  } | null
}

type ReceiptDetail = {
  receipt_id: string
  payment_date: string
  time: string
  patient_id: string
  patient_name: string
  amount: number
  cashier: string
}

function todayYMD() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const CURRENCY = "SSP"

function formatSSP(amount: number): string {
  return `${CURRENCY} ${Math.round(amount).toLocaleString('en-US')}`
}

function getVarianceText(variance: number): string {
  if (variance === 0) return "Balanced"
  if (variance < 0) return `Short by ${formatSSP(Math.abs(variance))}`
  return `Over by ${formatSSP(variance)}`
}

export default function ReportsDailyCash() {
  const { user } = useAuth()
  const isAdmin = user?.role === ROLES.ADMIN
  
  const [date, setDate] = useState(todayYMD())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ApiRow[]>([])
  const [totals, setTotals] = useState({ receipt_count: 0, total_amount: 0 })
  
  // Closing day state
  const [closingStatus, setClosingStatus] = useState<ClosingStatus>({ closed: false, closing: null })
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [countedCash, setCountedCash] = useState("")
  const [handedOverBy, setHandedOverBy] = useState("")
  const [receivedBy, setReceivedBy] = useState("")
  const [closingNotes, setClosingNotes] = useState("")
  const [closingLoading, setClosingLoading] = useState(false)
  
  // Receipt detail drill-down state
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [receipts, setReceipts] = useState<ReceiptDetail[]>([])
  const [receiptsLoading, setReceiptsLoading] = useState(false)

  const jsonUrl = useMemo(
    () => `/api/reports/daily-cash?date=${encodeURIComponent(date)}`,
    [date]
  )
  const csvUrl = useMemo(
    () => `/api/reports/daily-cash.csv?date=${encodeURIComponent(date)}`,
    [date]
  )

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(jsonUrl, { credentials: "include" })
      if (!res.ok) throw new Error(await res.text())
      const json = (await res.json()) as ApiPayload
      setRows(
        (json.rows || []).map((r) => ({
          ...r,
          receipt_count: Number(r.receipt_count ?? 0),
          total_amount: Number(r.total_amount ?? 0),
        }))
      )
      setTotals({
        receipt_count: Number(json.totals?.receipt_count ?? 0),
        total_amount: Number(json.totals?.total_amount ?? 0),
      })
    } catch (e: any) {
      setError(e?.message || "Failed to load")
      setRows([])
      setTotals({ receipt_count: 0, total_amount: 0 })
    } finally {
      setLoading(false)
    }
  }
  
  async function loadClosingStatus() {
    try {
      const res = await fetch(
        `/api/reports/daily-cash-closing/status?date=${encodeURIComponent(date)}`,
        { credentials: "include" }
      )
      if (res.ok) {
        const data = await res.json()
        setClosingStatus(data)
      }
    } catch (e) {
      console.error("Failed to load closing status:", e)
    }
  }
  
  async function handleCloseDay() {
    if (!countedCash || !handedOverBy.trim() || !receivedBy.trim()) {
      alert("Please fill in all required fields")
      return
    }
    
    const counted = parseFloat(countedCash)
    if (isNaN(counted) || counted < 0) {
      alert("Counted cash must be a valid non-negative number")
      return
    }
    
    setClosingLoading(true)
    try {
      const res = await fetch("/api/reports/daily-cash-closing/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date,
          expected_amount: totals.total_amount,
          counted_amount: counted,
          handed_over_by: handedOverBy.trim(),
          received_by: receivedBy.trim(),
          notes: closingNotes.trim() || null,
        }),
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to close day")
      }
      
      await loadClosingStatus()
      setShowCloseDialog(false)
      setCountedCash("")
      setHandedOverBy("")
      setReceivedBy("")
      setClosingNotes("")
    } catch (e: any) {
      alert(e.message || "Failed to close day")
    } finally {
      setClosingLoading(false)
    }
  }
  
  async function loadReceiptDetails(department: string) {
    setSelectedDepartment(department)
    setReceiptsLoading(true)
    try {
      const res = await fetch(
        `/api/reports/daily-cash-receipts?date=${encodeURIComponent(date)}&department=${encodeURIComponent(department)}`,
        { credentials: "include" }
      )
      if (res.ok) {
        const data = await res.json()
        setReceipts(data.receipts || [])
      } else {
        setReceipts([])
      }
    } catch (e) {
      console.error("Failed to load receipts:", e)
      setReceipts([])
    } finally {
      setReceiptsLoading(false)
    }
  }
  
  function handlePrint() {
    window.print()
  }

  useEffect(() => {
    load()
    loadClosingStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const variance = closingStatus.closing 
    ? closingStatus.closing.counted_amount - closingStatus.closing.expected_amount 
    : 0
  const showVarianceBlock = closingStatus.closed || (isAdmin && !closingStatus.closed)

  return (
    <>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Page header - mobile optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Daily Cash Report</h1>
            <p className="text-sm text-gray-500">Cash receipts summarized per department</p>
          </div>
          
          {/* Action buttons - wrap on mobile */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-600 text-white px-3 sm:px-4 py-2 text-sm font-semibold shadow-md hover:bg-gray-700 hover:shadow-lg transition-all print:hidden"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print/PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
            <a
              href={csvUrl}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0066CC] text-white px-3 sm:px-4 py-2 text-sm font-semibold shadow-md hover:bg-[#0052A3] hover:shadow-lg transition-all print:hidden"
              data-testid="button-download-csv"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download CSV</span>
              <span className="sm:hidden">CSV</span>
            </a>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0066CC] text-white px-3 sm:px-4 py-2 text-sm font-semibold shadow-md hover:bg-[#0052A3] hover:shadow-lg transition-all print:hidden"
              data-testid="button-refresh"
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Controls - single row, mobile friendly */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <label className="text-sm font-medium">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`justify-start text-left font-normal min-w-[200px] ${
                  !date && "text-muted-foreground"
                }`}
                disabled={closingStatus.closed}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(new Date(date), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={date ? new Date(date) : undefined}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    const pad = (n: number) => String(n).padStart(2, "0")
                    const yyyy = selectedDate.getFullYear()
                    const mm = pad(selectedDate.getMonth() + 1)
                    const dd = pad(selectedDate.getDate())
                    setDate(`${yyyy}-${mm}-${dd}`)
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {closingStatus.closed && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
              <Lock className="h-3.5 w-3.5" />
              Day Closed
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {String(error).includes("finance_vw_daily_cash")
              ? "The SQL view is missing on this database."
              : error}
          </div>
        )}

        {/* Expected vs Counted vs Variance - mobile optimized cards */}
        {showVarianceBlock && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5 shadow-md">
              <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Expected Cash</div>
              <div className="text-xl sm:text-2xl font-bold tabular-nums text-gray-900">
                {formatSSP(closingStatus.closing?.expected_amount || totals.total_amount)}
              </div>
            </div>
            
            <div className="rounded-xl border bg-gradient-to-br from-green-50 to-white p-4 sm:p-5 shadow-md">
              <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Counted Cash</div>
              <div className="text-xl sm:text-2xl font-bold tabular-nums text-gray-900">
                {closingStatus.closing 
                  ? formatSSP(closingStatus.closing.counted_amount)
                  : "—"}
              </div>
            </div>
            
            <div className={`rounded-xl border p-4 sm:p-5 shadow-md ${
              variance === 0 
                ? "bg-gradient-to-br from-green-50 to-white" 
                : "bg-gradient-to-br from-red-50 to-white"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-xs sm:text-sm font-semibold text-gray-600">Variance</div>
                {variance === 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className={`text-lg sm:text-xl font-bold ${
                variance === 0 ? "text-green-700" : variance > 0 ? "text-red-700" : "text-orange-700"
              }`}>
                {closingStatus.closing ? getVarianceText(variance) : "—"}
              </div>
              {closingStatus.closing && variance !== 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatSSP(variance)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Close Day button - admin only */}
        {isAdmin && !closingStatus.closed && (
          <div className="flex justify-end print:hidden">
            <button
              onClick={() => setShowCloseDialog(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2.5 text-sm font-semibold shadow-md hover:bg-green-700 hover:shadow-lg transition-all"
            >
              <Lock className="h-4 w-4" />
              Close Day
            </button>
          </div>
        )}

        {/* KPI cards - mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className="rounded-xl border bg-gradient-to-br from-green-50 to-white p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Cash</span>
              <div className="rounded-lg bg-green-100 p-2 sm:p-2.5 shadow-md">
                <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tabular-nums text-gray-900">
              {formatSSP(totals.total_amount)}
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Receipts</span>
              <div className="rounded-lg bg-blue-100 p-2 sm:p-2.5 shadow-md">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tabular-nums text-gray-900">
              {Number(totals.receipt_count).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Table - mobile optimized */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left font-bold text-gray-700">Department</th>
                  <th className="px-3 sm:px-4 py-3 text-right font-bold text-gray-700">Receipts</th>
                  <th className="px-3 sm:px-4 py-3 text-right font-bold text-gray-700">Total Cash ({CURRENCY})</th>
                  <th className="px-3 sm:px-4 py-3 print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 sm:px-4 py-3">
                        <div className="h-3 w-20 sm:w-28 rounded bg-gray-200" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right">
                        <div className="ml-auto h-3 w-8 sm:w-10 rounded bg-gray-200" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right">
                        <div className="ml-auto h-3 w-12 sm:w-16 rounded bg-gray-200" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 print:hidden"></td>
                    </tr>
                  ))
                ) : (
                  rows.map((r) => (
                    <tr 
                      key={r.department} 
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer print:cursor-auto"
                      onClick={() => loadReceiptDetails(r.department)}
                    >
                      <td className="px-3 sm:px-4 py-3 capitalize font-medium">{r.department}</td>
                      <td className="px-3 sm:px-4 py-3 text-right tabular-nums">
                        {Number(r.receipt_count).toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right tabular-nums font-semibold">
                        {Number(r.total_amount).toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right print:hidden">
                        <ChevronRight className="h-4 w-4 text-gray-400 inline" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && (
                <tfoot className="bg-gradient-to-r from-gray-50 to-white border-t-2 border-gray-200">
                  <tr>
                    <td className="px-3 sm:px-4 py-3 font-bold text-gray-900">Total</td>
                    <td className="px-3 sm:px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                      {Number(totals.receipt_count).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                      {Number(totals.total_amount).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 print:hidden"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Close Day Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Close Day - {date}</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Amount
                </label>
                <div className="text-2xl font-bold text-gray-900">
                  {formatSSP(totals.total_amount)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Counted Cash <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Handed Over By (Receptionist) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={handedOverBy}
                  onChange={(e) => setHandedOverBy(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Received By (Manager/Admin) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCloseDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={closingLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCloseDay}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={closingLoading}
              >
                {closingLoading ? "Closing..." : "Close Day"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Details Drawer */}
      {selectedDepartment && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center sm:justify-center z-50 print:hidden">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-3xl sm:max-h-[80vh] flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 capitalize">
                  {selectedDepartment} - Receipt Details
                </h2>
                <p className="text-sm text-gray-500">{date}</p>
              </div>
              <button
                onClick={() => setSelectedDepartment(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {receiptsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No receipts found</div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt, idx) => (
                    <div 
                      key={idx} 
                      className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">Receipt ID</div>
                          <div className="font-medium">{receipt.receipt_id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Time</div>
                          <div className="font-medium">{receipt.time}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Amount</div>
                          <div className="font-bold text-green-700">{formatSSP(receipt.amount)}</div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <div className="text-xs text-gray-500">Patient</div>
                          <div className="font-medium">{receipt.patient_name || receipt.patient_id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Cashier</div>
                          <div className="font-medium">{receipt.cashier}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          
          @page {
            margin: 1cm;
          }
          
          /* Print header */
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }
          
          /* Hide print button and other non-printable elements */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Ensure table is visible and properly formatted */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          
          /* Signature section */
          .print-signatures {
            display: block !important;
            margin-top: 40px;
            page-break-inside: avoid;
          }
        }
        
        .print-header {
          display: none;
        }
        
        .print-signatures {
          display: none;
        }
      `}</style>
      
      {/* Print-only header and signatures */}
      <div className="print:block">
        <div className="print-header">
          <h1 className="text-2xl font-bold">Medical Clinic</h1>
          <h2 className="text-xl font-semibold mt-2">Daily Cash Report</h2>
          <p className="text-sm mt-1">Date: {date}</p>
        </div>
        
        <div className="print-signatures">
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <p className="mb-8">Handed Over By: ____________________</p>
              <p className="text-sm text-gray-600">Receptionist Name & Signature</p>
            </div>
            <div>
              <p className="mb-8">Received By: ____________________</p>
              <p className="text-sm text-gray-600">Manager/Admin Name & Signature</p>
            </div>
          </div>
          {closingStatus.closed && closingStatus.closing && (
            <div className="mt-6 p-4 border rounded">
              <p className="font-semibold">Closing Summary:</p>
              <p className="text-sm mt-2">Expected: {formatSSP(closingStatus.closing.expected_amount)}</p>
              <p className="text-sm">Counted: {formatSSP(closingStatus.closing.counted_amount)}</p>
              <p className="text-sm">Variance: {getVarianceText(variance)}</p>
              {closingStatus.closing.notes && (
                <p className="text-sm mt-2">Notes: {closingStatus.closing.notes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
