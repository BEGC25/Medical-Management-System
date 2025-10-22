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
  const [byCashier, setByCashier] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ApiRow[]>([])
  const [totals, setTotals] = useState({ receipt_count: 0, total_amount: 0 })

  const jsonUrl = useMemo(
    () =>
      `/api/reports/daily-cash?date=${encodeURIComponent(
        date
      )}&byCashier=${byCashier}`,
    [date, byCashier]
  )
  const csvUrl = useMemo(
    () =>
      `/api/reports/daily-cash.csv?date=${encodeURIComponent(
        date
      )}&byCashier=${byCashier}`,
    [date, byCashier]
  )

  useEffect(() => {
    let cancelled = false
    async function go() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(jsonUrl, { credentials: "include" })
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
  }, [jsonUrl])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Daily Cash by Department</h1>

      <div className="flex items-center gap-3">
        <label className="text-sm">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-2 py-1"
        />

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={byCashier}
            onChange={(e) => setByCashier(e.target.checked)}
          />
          Group by cashier
        </label>

        <a href={csvUrl} className="ml-auto underline">
          Download CSV
        </a>

        <button onClick={() => window.print()} className="border rounded px-3 py-1">
          Print Manager Copy
        </button>
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
          <table className="min-w-[800px] w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border">Department</th>
                {byCashier && <th className="text-left p-2 border">Cashier</th>}
                <th className="text-right p-2 border"># Receipts</th>
                <th className="text-right p-2 border">Total Cash</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={`${r.department}-${byCashier ? String(r.cashier_id ?? "") : "all"}`}
                >
                  <td className="p-2 border capitalize">{r.department}</td>
                  {byCashier && <td className="p-2 border">{r.cashier_id ?? "-"}</td>}
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
                <td className="p-2 border">{byCashier ? "Total (all cashiers)" : "Total"}</td>
                {byCashier && <td className="p-2 border"></td>}
                <td className="p-2 border text-right">
                  {Number(totals.receipt_count).toLocaleString()}
                </td>
                <td className="p-2 border text-right">
                  {Number(totals.total_amount).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signature footer for printouts */}
          <div className="mt-12 print:mt-24">
            <div className="flex justify-between">
              <div>Receptionist Signature: ____________________</div>
              <div>Manager Signature: ____________________</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
