// app/api/products/low-stock/route.js
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getUserContext } from '@/lib/getUserContext';
import { resolveBranch } from '@/lib/resolveBranch';

// GET /api/products/low-stock?branch_id=xxx&limit=5
export async function GET(request) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const resolved = resolveBranch(ctx, searchParams.get('branch_id'));
  if (resolved.error) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const limit = Number(searchParams.get('limit')) || 5;

  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, stock, unit')
    .eq('branch_id', resolved.branchId)
    .lte('stock', limit)
    .order('stock', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data.map((p) => ({ barcode: p.id, name: p.name, category: p.category, stock: p.stock, unit: p.unit }));
  return NextResponse.json(items);
}
