// server/reports.daily-cash.csv.ts
import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

type Runner = (sql: string, params?: any[]) => Promise<any[]>;

let runnerPromise: Promise<Runner> | null = null;
async function getRunner(): Promise<Runner> {
  if (runnerPromise) return runnerPromise;
  runnerPromise = (async () => {
    try {
      // @ts-ignore
      const dbmod = await import("./db");
      if (dbmod?.query) {
        return async (sql: string, params: any[] = []) => {
          const r = await dbmod.query(sql, params);
          return r?.rows ?? r ?? [];
        };
      }
      if (dbmod?.default?.query) {
        return async (sql: string, params: any[] = []) => {
          const r = await dbmod.default.query(sql, params);
          return r?.rows ?? r ?? [];
        };
      }
      if (dbmod?.pool?.query) {
        return async (sql: string, params: any[] = []) => {
          const r = await dbmod.pool.query(sql, params);
          return r?.rows ?? r ?? [];
        };
      }
    } catch (_) {}

    try {
      // @ts-ignore
      const { PrismaClient } = await import("@prisma/client");
      // @ts-ignore
      const prisma = new PrismaClient();
      return async (sql: string, params: any[] = []) => {
        // @ts-ignore
        const res = await prisma.$queryRawUnsafe(sql, ...params);
        return Array.isArray(res) ? res : [];
      };
    } catch (_e) {
      throw new Error(
        "No database client available. Ensure server/db.ts exports query/pool, or install @prisma/client."
      );
    }
  })();
  return runnerPromise;
}

function ymd(v?: string) {
  const s = v ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error("Invalid date");
  return s;
}
function asBool(v: any) {
  return String(v ?? "false").toLowerCase() === "true";
}

router.get("/api/reports/daily-cash.csv", async (req: Request, res: Response) => {
  try {
    const run = await getRunner();
    const day = ymd(String(req.query.date || ""));
    const byCashier = asBool(req.query.byCashier);

    const groupCols = ["department"];
    if (byCashier) groupCols.push("cashier_id");

    const rows = (await run(
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
    )) as any[];

    const header = ["department"];
    if (byCashier) header.push("cashier_id");
    header.push("receipt_count", "total_amount");

    const csvLines = [header.join(",")];
    for (const r of rows) {
      const line = [
        r.department ?? "",
        ...(byCashier ? [String(r.cashier_id ?? "")] : []),
        String(r.receipt_count ?? 0),
        String(r.total_amount ?? 0),
      ].join(",");
      csvLines.push(line);
    }

    const csv = csvLines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="daily-cash-${day}.csv"`
    );
    res.send(csv);
  } catch (err: any) {
    res.status(500).send(`error,${(err?.message ?? "Server error").replace(",", ";")}`);
  }
});

export default router;
