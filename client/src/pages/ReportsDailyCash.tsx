import { useEffect, useMemo, useState } from "react"
import { Calendar, Download, RefreshCcw, Receipt, CircleDollarSign } from "lucide-react"

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

function todayYMD() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function ReportsDailyCash() {
  const [date, setDate] = useState(todayYMD())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ApiRow[]>([])
  const [totals, setTotals] = useState({ receipt_count: 0, total_amount: 0 })

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

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonUrl])

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily Cash by Department</h1>
          <p className="text-sm text-gray-500">Cash receipts summarized per department</p>
        </div>
        <div className="flex gap-2">
          <a
            href={csvUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0066CC] text-white px-4 py-2 text-sm font-semibold shadow-md hover:bg-[#0052A3] hover:shadow-lg transition-all"
            data-testid="button-download-csv"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </a>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0066CC] text-white px-4 py-2 text-sm font-semibold shadow-md hover:bg-[#0052A3] hover:shadow-lg transition-all"
            data-testid="button-refresh"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">Date</label>
        <div className="relative">
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-8 pr-3 py-2 text-sm rounded-lg border bg-white"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {String(error).includes("finance_vw_daily_cash")
            ? "The SQL view is missing on this database."
            : error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-gradient-to-br from-green-50 to-white p-6 shadow-lg hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Total Cash</span>
            <div className="rounded-lg bg-green-100 p-2.5 shadow-md">
              <CircleDollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold tabular-nums text-gray-900">
            {Number(totals.total_amount).toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700"># Receipts</span>
            <div className="rounded-lg bg-blue-100 p-2.5 shadow-md">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold tabular-nums text-gray-900">
            {Number(totals.receipt_count).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Department</th>
                <th className="px-3 py-2 text-right font-medium"># Receipts</th>
                <th className="px-3 py-2 text-right font-medium">Total Cash</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-3 py-3">
                      <div className="h-3 w-28 rounded bg-gray-200" />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="ml-auto h-3 w-10 rounded bg-gray-200" />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="ml-auto h-3 w-16 rounded bg-gray-200" />
                    </td>
                  </tr>
                ))
              ) : (
                rows.map((r) => (
                  <tr key={r.department} className="hover:bg-gray-50/60">
                    <td className="px-3 py-2 capitalize">{r.department}</td>
                    <td className="px-3 py-2 text-right">
                      {Number(r.receipt_count).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(r.total_amount).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && (
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">
                    {Number(totals.receipt_count).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Number(totals.total_amount).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
