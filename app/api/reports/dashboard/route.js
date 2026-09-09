// app/api/reports/dashboard/route.js
// ແທນ GAS: getReportData()

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const [salesRes, productsRes, lowStockRes] = await Promise.all([
    supabase
      .from('sale_items')
      .select('sale_id, product_id, product_name, category, qty, total_cost, total_price, profit, sales(created_at)')
      .order('sale_id', { ascending: false }),
    supabase.from('products').select('id, cost, stock'),
    supabase.from('low_stock_products').select('*'),
  ]);

  if (salesRes.error) return NextResponse.json({ error: salesRes.error.message }, { status: 500 });
  if (productsRes.error) return NextResponse.json({ error: productsRes.error.message }, { status: 500 });
  if (lowStockRes.error) return NextResponse.json({ error: lowStockRes.error.message }, { status: 500 });

  const totalSKUs = productsRes.data.length;
  const totalStockValue = productsRes.data.reduce(
    (sum, p) => sum + Number(p.stock) * Number(p.cost),
    0
  );

  return NextResponse.json({
    sales: salesRes.data,
    lowStock: lowStockRes.data,
    totalSKUs,
    totalStockValue,
  });
}
