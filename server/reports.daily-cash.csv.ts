// server/routes/reports.daily-cash.csv.ts
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

router.get('/api/reports/daily-cash.csv', async (req: Request, res: Response) => {
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

    const header = ['department'] as string[];
    if (byCashier) header.push('cashier_id');
    header.push('receipt_count', 'total_amount');

    const csvLines = [header.join(',')];
    for (const r of rows) {
      const line = [
        r.department ?? '',
        ...(byCashier ? [String(r.cashier_id ?? '')] : []),
        String(r.receipt_count ?? 0),
        String(r.total_amount ?? 0)
      ].join(',');
      csvLines.push(line);
    }

    const csv = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="daily-cash-${day}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).send(`error,${(err?.message ?? 'Server error').replace(',', ';')}`);
  }
});

export default router;
