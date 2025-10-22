import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"

type Row = {
  department: string
  count: number
  amount: number
}

export default function ReportsDailyCash() {
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [data, setData] = useState<Row[]>([])
  const [totals, setTotals] = useState({ count: 0, amount: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        const json = await res.json()
        if (!cancelled) {
          setData(json.rows || [])
          setTotals(json.totals || { count: 0, amount: 0 })
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    go()
    return () => { cancelled = true }
  }, [url])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Daily Cash by Department</h1>

      <div className="flex items-center gap-2">
        <label className="text-sm">Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <a
          href={`${url}&format=csv`}
          className="ml-auto underline"
        >
          Download CSV
        </a>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border">Department</th>
                <th className="text-right p-2 border">Receipts</th>
                <th className="text-right p-2 border">Amount (SSP)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.department}>
                  <td className="p-2 border">{r.department}</td>
                  <td className="p-2 border text-right">{r.count}</td>
                  <td className="p-2 border text-right">
                    {r.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="p-2 border">Total</td>
                <td className="p-2 border text-right">{totals.count}</td>
                <td className="p-2 border text-right">{totals.amount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
