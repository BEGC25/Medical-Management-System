import { useEffect, useMemo, useState } from "react"

// API row shape
type ApiRow = {
  department: string
  cashier_id?: number | string | null
  receipt_count: number | string
  total_amount: number | string
}

type ApiPayload = {
  date: string
  method: string
  byCashier: boolean
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

  const url = useMemo(
    () => `/api/reports/daily-cash?date=${encodeURIComponent(date)}`,
    [date]
  )

  useEffect(() => {
    let cancelled = false
    async function go() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url, { credentials: "include" })
        if (!res.ok) throw new Error(await res.text())
        const json = (await res.json()) as ApiPayload

        if (!cancelled) {
          const mappedRows = (json.rows || []).map((r) => ({
            ...r,
            receipt_count: Number(r.receipt_count ?? 0),
            total_amount: Number(r.total_amount ?? 0),
          }))
          setRows(mappedRows)
          setTotals({
            receipt_count: Number(json.totals?.receipt_count ?? 0),
            total_amount: Number(json.totals?.total_amount ?? 0),
          })
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    go()
    return () => {
      cancelled = true
    }
  }, [url])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Daily Cash by Department</h1>

      <div className="flex items-center gap-2">
        <label className="text-sm">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <a href={`${url.replace("/api/reports/daily-cash", "/api/reports/daily-cash.csv")}`} className="ml-auto underline">
          Download CSV
        </a>
      </div>

      {loading && <div>Loading…</div>}
      {error && (
        <div className="text-red-600">
          {String(error).includes("finance_vw_daily_cash")
            ? "The SQL view is missing on this database."
            : error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border">Department</th>
                <th className="text-right p-2 border"># Receipts</th>
                <th className="text-right p-2 border">Total Cash</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.department}-${String(r.cashier_id ?? "")}`}>
                  <td className="p-2 border capitalize">{r.department}</td>
                  <td className="p-2 border text-right">
                    {Number(r.receipt_count).toLocaleString()}
                  </td>
                  <td className="p-2 border text-right">
                    {Number(r.total_amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="p-2 border">Total</td>
                <td className="p-2 border text-right">
                  {Number(totals.receipt_count).toLocaleString()}
                </td>
                <td className="p-2 border text-right">
                  {Number(totals.total_amount).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
