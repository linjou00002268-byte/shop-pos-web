// app/api/reports/dashboard/route.js
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getUserContext } from '@/lib/getUserContext';
import { resolveBranch } from '@/lib/resolveBranch';

// GET /api/reports/dashboard?branch_id=xxx
export async function GET(request) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'ສະເພາະ admin ເທົ່ານັ້ນທີ່ເບິ່ງ Dashboard ໄດ້' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const resolved = resolveBranch(ctx, searchParams.get('branch_id'));
  if (resolved.error) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const [salesRes, productsRes, lowStockRes] = await Promise.all([
    supabase
      .from('sale_items')
      .select('sale_id, product_barcode, product_name, category, qty, total_cost, total_price, profit, sales!inner(branch_id, created_at)')
      .eq('sales.branch_id', resolved.branchId)
      .order('sale_id', { ascending: false }),
    supabase.from('products').select('id, cost, stock').eq('branch_id', resolved.branchId),
    supabase.from('low_stock_products').select('*').eq('branch_id', resolved.branchId),
  ]);

  if (salesRes.error) return NextResponse.json({ error: salesRes.error.message }, { status: 500 });
  if (productsRes.error) return NextResponse.json({ error: productsRes.error.message }, { status: 500 });
  if (lowStockRes.error) return NextResponse.json({ error: lowStockRes.error.message }, { status: 500 });

  const totalSKUs = productsRes.data.length;
  const totalStockValue = productsRes.data.reduce((sum, p) => sum + Number(p.stock) * Number(p.cost), 0);

  return NextResponse.json({
    sales: salesRes.data,
    lowStock: lowStockRes.data,
    totalSKUs,
    totalStockValue,
  });
}
