// server/routes/reports.daily-cash.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = Router();

function ymd(v?: string) {
  const s = v ?? new Date().toISOString().slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Invalid date');
  return s;
}
function asBool(v: any) { return String(v ?? 'false').toLowerCase() === 'true'; }

// GET /api/reports/daily-cash?date=YYYY-MM-DD&byCashier=true|false
router.get('/api/reports/daily-cash', async (req: Request, res: Response) => {
  try {
    const day = ymd(String(req.query.date || ''));
    const byCashier = asBool(req.query.byCashier);

    const groupCols = ['department'] as string[];
    if (byCashier) groupCols.push('cashier_id');

    const rows = await prisma.$queryRawUnsafe(`
      SELECT ${groupCols.join(', ')}, SUM(total_amount)::numeric AS total_amount, SUM(receipt_count)::int AS receipt_count
      FROM finance_vw_daily_cash
      WHERE collection_date = $1 AND payment_method = 'cash'
      GROUP BY ${groupCols.join(', ')}
      ORDER BY ${groupCols.join(', ')}
    `, day) as any[];

    const totals = await prisma.$queryRawUnsafe(`
      SELECT COALESCE(SUM(total_amount),0)::numeric AS total_amount,
             COALESCE(SUM(receipt_count),0)::int AS receipt_count
      FROM finance_vw_daily_cash
      WHERE collection_date = $1 AND payment_method = 'cash'
    `, day) as any[];

    res.json({
      date: day,
      method: 'cash',
      byCashier,
      totals: totals?.[0] ?? { total_amount: 0, receipt_count: 0 },
      rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Server error. Did you create the view finance_vw_daily_cash?' });
  }
});

export default router;
