import { Router } from "express";
import type { Request, Response } from "express";

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
  const s = v ?? new Date().toISOString().slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error("Invalid date");
  return s;
}

// GET /api/reports/daily-cash-receipts?date=YYYY-MM-DD&department=xxx
// Returns receipt-level details for a specific date and department (cash only)
// NOTE: Uses PostgreSQL-compatible syntax for time extraction and string concatenation
router.get("/api/reports/daily-cash-receipts", async (req: Request, res: Response) => {
  try {
    // Prevent caching of financial data
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    const run = await getRunner();
    const day = ymd(String(req.query.date || ""));
    const department = String(req.query.department || "").toLowerCase();
    
    if (!department) {
      return res.status(400).json({ error: "Department parameter is required" });
    }

    // Build department filter condition
    let departmentFilter = "";
    if (department === "consultation") {
      departmentFilter = "AND (pi.related_type = 'consultation')";
    } else if (department === "laboratory") {
      departmentFilter = "AND (pi.related_type = 'lab_test' OR pi.related_type = 'lab_test_item')";
    } else if (department === "xray") {
      departmentFilter = "AND (pi.related_type = 'xray_exam')";
    } else if (department === "ultrasound") {
      departmentFilter = "AND (pi.related_type = 'ultrasound_exam')";
    } else if (department === "other") {
      departmentFilter = "AND (pi.related_type NOT IN ('consultation', 'lab_test', 'lab_test_item', 'xray_exam', 'ultrasound_exam') OR pi.related_type IS NULL)";
    }

    // Query to get receipt details
    // Join payments, payment_items, and patients to get comprehensive details
    // PostgreSQL-compatible time extraction and string concatenation
    const rows = await run(
      `
      SELECT 
        p.payment_id AS receipt_id,
        p.payment_date,
        to_char((p.created_at::timestamptz AT TIME ZONE 'Africa/Juba')::time, 'HH24:MI') AS time,
        p.patient_id,
        concat(pat.first_name, ' ', pat.last_name) AS patient_name,
        SUM(pi.total_price) AS amount,
        p.received_by AS cashier
      FROM payments p
      LEFT JOIN payment_items pi ON p.payment_id = pi.payment_id
      LEFT JOIN patients pat ON p.patient_id = pat.patient_id
      WHERE p.clinic_day = $1
        AND p.payment_method = 'cash'
        ${departmentFilter}
      GROUP BY p.payment_id, p.payment_date, p.created_at, p.patient_id, pat.first_name, pat.last_name, p.received_by
      ORDER BY p.created_at
      `,
      [day]
    );

    res.json({
      date: day,
      department,
      receipts: rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Server error" });
  }
});

export default router;
