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

// GET /api/reports/daily-cash-closing/status?date=YYYY-MM-DD
// Returns the closing status for a specific date
router.get("/api/reports/daily-cash-closing/status", async (req: Request, res: Response) => {
  try {
    // Prevent caching of financial data
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    const run = await getRunner();
    const day = ymd(String(req.query.date || ""));

    const rows = await run(
      `SELECT * FROM daily_cash_closings WHERE date = ?`,
      [day]
    );

    if (rows.length > 0) {
      res.json({ closed: true, closing: rows[0] });
    } else {
      res.json({ closed: false, closing: null });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Server error" });
  }
});

// POST /api/reports/daily-cash-closing/close
// Close the day for a specific date (admin-only)
router.post("/api/reports/daily-cash-closing/close", async (req: Request, res: Response) => {
  try {
    // Admin-only check
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Only administrators can close the day" });
    }
    
    // Prevent caching of financial data
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
    const run = await getRunner();
    
    const { date, expected_amount, counted_amount, handed_over_by, received_by, notes } = req.body;
    
    // Validation
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
    
    if (typeof counted_amount !== 'number' || counted_amount < 0) {
      return res.status(400).json({ error: "Counted amount must be a non-negative number" });
    }
    
    if (!handed_over_by || !handed_over_by.trim()) {
      return res.status(400).json({ error: "handed_over_by is required" });
    }
    
    if (!received_by || !received_by.trim()) {
      return res.status(400).json({ error: "received_by is required" });
    }
    
    const variance = counted_amount - (expected_amount || 0);
    
    // Get user info from session (set by requireAuth middleware)
    const user = (req as any).user;
    const closed_by_username = user?.username || 'unknown';
    const closed_by_user_id = user?.id || null;
    
    try {
      // Insert closing record
      await run(
        `INSERT INTO daily_cash_closings 
         (date, expected_amount, counted_amount, variance, handed_over_by, received_by, notes, closed_by_username, closed_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [date, expected_amount || 0, counted_amount, variance, handed_over_by.trim(), received_by.trim(), notes || null, closed_by_username, closed_by_user_id]
      );
      
      // Fetch the newly created record
      const rows = await run(`SELECT * FROM daily_cash_closings WHERE date = ?`, [date]);
      
      res.json({ success: true, closing: rows[0] });
    } catch (err: any) {
      // Check for unique constraint violation
      if (err?.message?.includes('UNIQUE constraint failed') || err?.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: "Day has already been closed for this date" });
      }
      throw err;
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Server error" });
  }
});

export default router;
