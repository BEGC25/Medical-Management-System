// client/src/pages/finance/DailyCash.tsx
import { useEffect, useState } from "react";

type Totals = { total_amount: number; receipt_count: number };
type Row = { department: string; cashier_id?: number; total_amount: number; receipt_count: number };
type Payload = { date: string; method: string; byCashier: boolean; totals: Totals; rows: Row[] };

function todayYMD() {
  // local-date yyyy-mm-dd (avoids UTC-off-by-one)
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DailyCash() {
  const [date, setDate] = useState<string>(todayYMD);
  const [byCashier, setByCashier] = useState<boolean>(false);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/daily-cash?date=${date}&byCashier=${byCashier}`);
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as Payload;
      setData(json);
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, byCashier]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Daily Cash Collection</h1>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={byCashier}
            onChange={(e) => setByCashier(e.target.checked)}
          />
          <span>Group by cashier</span>
        </label>

        <button onClick={load} className="border rounded px-3 py-1">
          Refresh
        </button>

        <a
          className="border rounded px-3 py-1"
          href={`/api/reports/daily-cash.csv?date=${date}&byCashier=${byCashier}`}
        >
          Export CSV
        </a>

        <button onClick={() => window.print()} className="border rounded px-3 py-1">
          Print Manager Copy
        </button>
      </div>

      {loading && <div>Loading…</div>}
      {error && (
        <div className="text-red-600">
          {error.includes("finance_vw_daily_cash")
            ? "The SQL view is missing. We'll add it in the next step."
            : error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 print:grid-cols-2">
            <div className="border rounded p-4">
              <div className="text-sm text-gray-500">Total Cash ({data.date})</div>
              <div className="text-2xl font-bold">
                {Number(data.totals.total_amount ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="border rounded p-4">
              <div className="text-sm text-gray-500"># Receipts</div>
              <div className="text-2xl font-bold">
                {Number(data.totals.receipt_count ?? 0).toLocaleString()}
              </div>
            </div>
          </div>

          <table className="w-full border rounded print:mt-4">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2">Department</th>
                {data.byCashier && <th className="text-left p-2">Cashier</th>}
                <th className="text-right p-2">Receipts</th>
                <th className="text-right p-2">Total Cash</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r: Row, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 capitalize">{r.department}</td>
                  {data.byCashier && <td className="p-2">{r.cashier_id ?? "-"}</td>}
                  <td className="p-2 text-right">
                    {Number(r.receipt_count ?? 0).toLocaleString()}
                  </td>
                  <td className="p-2 text-right">
                    {Number(r.total_amount ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signature footer for printed copy */}
          <div className="mt-12 print:mt-24">
            <div className="flex justify-between">
              <div>Receptionist Signature: ____________________</div>
              <div>Manager Signature: ____________________</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
