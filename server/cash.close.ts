// server/routes/cash.close.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = Router();

// POST /api/cash/close
// Body: { closing_date: 'YYYY-MM-DD', department: string, counted_amount: number, cashier_id?: number, manager_user_id: number, notes?: string }
router.post('/api/cash/close', async (req: Request, res: Response) => {
  try {
    const { closing_date, department, counted_amount, cashier_id, manager_user_id, notes } = req.body ?? {};
    if (!closing_date || !/^\d{4}-\d{2}-\d{2}$/.test(closing_date)) throw new Error('closing_date must be YYYY-MM-DD');
    if (!department) throw new Error('department is required');
    if (counted_amount == null) throw new Error('counted_amount is required');
    if (!manager_user_id) throw new Error('manager_user_id is required');

    const params: any[] = [closing_date, department];
    if (cashier_id != null) params.push(cashier_id);

    const sysRows = await prisma.$queryRawUnsafe(`
      SELECT COALESCE(SUM(total_amount),0)::numeric AS sys
      FROM finance_vw_daily_cash
      WHERE collection_date = $1 AND payment_method = 'cash' AND department = $2
      ${cashier_id != null ? ' AND cashier_id = $3' : ''}
    `, ...params) as any[];

    const system_amount = sysRows?.[0]?.sys ?? 0;

    const inserted = await prisma.$queryRawUnsafe(`
      INSERT INTO cash_drawer_closings (closing_date, department, counted_amount, system_amount, cashier_id, manager_user_id, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, closing_date, department, counted_amount, system_amount, cashier_id, manager_user_id, notes, created_at
    `, closing_date, department, counted_amount, system_amount, cashier_id ?? null, manager_user_id, notes ?? null) as any[];

    res.json({ ok: true, record: inserted?.[0] ?? null });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? 'Server error' });
  }
});

export default router;
