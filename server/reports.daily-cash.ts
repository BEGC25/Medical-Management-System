import { Router } from "express";
import type { Request, Response } from "express";
import { today } from "./utils/date";

const router = Router();

type Runner = (sql: string, params?: any[]) => Promise<any[]>;

let runnerPromise: Promise<Runner> | null = null;
async function getRunner(): Promise<Runner> {
  if (runnerPromise) return runnerPromise;
  runnerPromise = (async () => {
    // Try your existing DB helper first (server/db.ts)
    try {
      // @ts-ignore
      const dbmod = await import("./db");
      if (dbmod?.query) return async (sql, params: any[] = []) => (await dbmod.query(sql, params)).rows ?? [];
      if (dbmod?.default?.query) return async (sql, params: any[] = []) => (await dbmod.default.query(sql, params)).rows ?? [];
      if (dbmod?.pool?.query) return async (sql, params: any[] = []) => (await dbmod.pool.query(sql, params)).rows ?? [];
    } catch {}
    throw new Error("No database client available. Ensure server/db.ts exports query/pool.");
  })();
  return runnerPromise;
}

function ymd(v?: string) {
  const s = v ?? today('date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error("Invalid date");
  return s;
}
function asBool(v: any) { return String(v ?? "false").toLowerCase() === "true"; }

// GET /api/reports/daily-cash?date=YYYY-MM-DD&byCashier=true|false
router.get("/api/reports/daily-cash", async (req: Request, res: Response) => {
  try {
    // Prevent caching of financial data
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    const run = await getRunner();
    const day = ymd(String(req.query.date || ""));
    const byCashier = asBool(req.query.byCashier);

    const groupCols = ["department"];
    if (byCashier) groupCols.push("cashier_id");

    const rows = await run(
      `
      SELECT ${groupCols.join(", ")},
             SUM(total_amount) AS total_amount,
             SUM(receipt_count) AS receipt_count
      FROM finance_vw_daily_cash
      WHERE collection_date = $1 AND payment_method = 'cash'
      GROUP BY ${groupCols.join(", ")}
      ORDER BY ${groupCols.join(", ")}
      `,
      [day]
    );

    const totals = await run(
      `
      SELECT COALESCE(SUM(total_amount),0) AS total_amount,
             COALESCE(SUM(receipt_count),0) AS receipt_count
      FROM finance_vw_daily_cash
      WHERE collection_date = $1 AND payment_method = 'cash'
      `,
      [day]
    );

    res.json({
      date: day,
      method: "cash",
      byCashier,
      totals: (totals as any[])?.[0] ?? { total_amount: 0, receipt_count: 0 },
      rows: rows as any[],
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Server error. Did you create the view finance_vw_daily_cash?" });
  }
});

export default router;
