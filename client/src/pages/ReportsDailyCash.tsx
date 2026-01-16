import { useEffect, useMemo, useState } from "react"
import { Calendar as CalendarIcon, Download, RefreshCcw, Printer, Lock, ChevronRight, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { ROLES } from "@shared/auth-roles"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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

function formatDateYMD(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Parse YYYY-MM-DD as a local date (not UTC) to avoid timezone shift bugs.
// DO NOT use new Date('YYYY-MM-DD') - it parses as UTC and causes off-by-one in Africa/Juba (UTC+2).
function ymdToLocalDate(ymd: string): Date {
  const [year, month, day] = ymd.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function todayYMD() {
  return formatDateYMD(new Date())
}

function yesterdayYMD() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatDateYMD(yesterday)
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

  return (
    <>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Compact Premium Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            {/* Left: Title & Subtitle */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Daily Cash Report
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Cash receipts summarized per department
              </p>
            </div>
            
            {/* Right: Metadata & Actions */}
            <div className="flex items-center gap-4">
              {/* Metadata - Compact */}
              <div className="hidden md:flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-mono">DCR-{date.replace(/-/g, '')}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  closingStatus.closed 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                )}>
                  {closingStatus.closed ? "Reconciled" : "Open"}
                </span>
              </div>
              
              {/* Action Icons - Minimal */}
              <div className="flex items-center gap-1 print:hidden">
                <button
                  onClick={handlePrint}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  title="Print/PDF"
                >
                  <Printer className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                </button>
                <a
                  href={csvUrl}
                  download
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  title="Download CSV"
                  data-testid="button-download-csv"
                >
                  <Download className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                </a>
                <button
                  onClick={load}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  title="Refresh"
                  data-testid="button-refresh"
                >
                  <RefreshCcw className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                </button>
              </div>
            </div>
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
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {/* Use ymdToLocalDate to avoid UTC parsing timezone shift */}
                {date ? format(ymdToLocalDate(date), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              {/* Use ymdToLocalDate to avoid UTC parsing timezone shift */}
              <Calendar
                mode="single"
                selected={date ? ymdToLocalDate(date) : undefined}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    setDate(format(selectedDate, 'yyyy-MM-dd'))
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {/* Quick date shortcuts */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDate(todayYMD())}
            className="font-medium"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDate(yesterdayYMD())}
            className="font-medium"
          >
            Yesterday
          </Button>
          
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

        {/* Single Metrics Row - REPLACES all duplicate cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {/* Expected Cash */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 sm:p-4">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Expected Cash</div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {formatSSP(closingStatus.closing?.expected_amount || totals.total_amount)}
            </div>
          </div>
          
          {/* Counted Cash */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 sm:p-4">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Counted Cash</div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {closingStatus.closing?.counted_amount != null ? formatSSP(closingStatus.closing.counted_amount) : "—"}
            </div>
          </div>
          
          {/* Variance */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 sm:p-4">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              Variance
              {closingStatus.closed && variance === 0 && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </div>
            <div className={cn(
              "text-xl sm:text-2xl font-bold tabular-nums",
              variance === 0 ? "text-gray-900 dark:text-gray-100" : "text-red-600 dark:text-red-400"
            )}>
              {closingStatus.closed ? formatSSP(variance) : "—"}
            </div>
          </div>
          
          {/* Total Receipts */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 sm:p-4">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Receipts</div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {totals.receipt_count.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Close Day Button - Compact, Integrated */}
        {isAdmin && !closingStatus.closed && (
          <div className="mb-5">
            <button
              onClick={() => setShowCloseDialog(true)}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Close Day
            </button>
          </div>
        )}

        {/* Table - mobile optimized */}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-300">Department</th>
                  <th className="px-3 sm:px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">Receipts</th>
                  <th className="px-3 sm:px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">Total Cash ({CURRENCY})</th>
                  <th className="px-3 sm:px-4 py-3 print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 sm:px-4 py-3">
                        <div className="h-3 w-20 sm:w-28 rounded bg-gray-200 dark:bg-gray-700" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right">
                        <div className="ml-auto h-3 w-8 sm:w-10 rounded bg-gray-200 dark:bg-gray-700" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right">
                        <div className="ml-auto h-3 w-12 sm:w-16 rounded bg-gray-200 dark:bg-gray-700" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 print:hidden"></td>
                    </tr>
                  ))
                ) : (
                  rows.map((r) => (
                    <tr 
                      key={r.department} 
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer print:cursor-auto"
                      onClick={() => loadReceiptDetails(r.department)}
                    >
                      <td className="px-3 sm:px-4 py-3 capitalize font-medium text-gray-900 dark:text-gray-100">{r.department}</td>
                      <td className="px-3 sm:px-4 py-3 text-right tabular-nums text-gray-900 dark:text-gray-100">
                        {Number(r.receipt_count).toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right tabular-nums font-semibold text-gray-900 dark:text-gray-100">
                        {Number(r.total_amount).toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right print:hidden">
                        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 inline" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {!loading && (
                <tfoot className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-t-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    <td className="px-3 sm:px-4 py-3 font-bold text-gray-900 dark:text-gray-100">Total</td>
                    <td className="px-3 sm:px-4 py-3 text-right tabular-nums font-bold text-gray-900 dark:text-gray-100">
                      {Number(totals.receipt_count).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right tabular-nums font-bold text-gray-900 dark:text-gray-100">
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
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Close Day - {date}</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expected Amount
                </label>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatSSP(totals.total_amount)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Counted Cash <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Handed Over By (Receptionist) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={handedOverBy}
                  onChange={(e) => setHandedOverBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Received By (Manager/Admin) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCloseDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
          <div className="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-3xl sm:max-h-[80vh] flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                  {selectedDepartment} - Receipt Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{date}</p>
              </div>
              <button
                onClick={() => setSelectedDepartment(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {receiptsLoading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No receipts found</div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt, idx) => (
                    <div 
                      key={idx} 
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Receipt ID</div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{receipt.receipt_id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Time</div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{receipt.time}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                          <div className="font-bold text-green-700 dark:text-green-400">{formatSSP(receipt.amount)}</div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Patient</div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{receipt.patient_name || receipt.patient_id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Cashier</div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{receipt.cashier}</div>
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
