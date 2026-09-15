// app/api/sales/route.js
// ແທນ GAS: processSale(cart) / getSalesHistory()
// ✅ ອັບເດດແລ້ວ: ກອງຕາມສາຂາ

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { logError } from '@/lib/logError';
import { getUserContext } from '@/lib/getUserContext';
import { resolveBranch } from '@/lib/resolveBranch';

// POST /api/sales
// body: { branchId, cart: [ { id, name, qty, price }, ... ] }
export async function POST(request) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });

  const body = await request.json();
  const resolved = resolveBranch(ctx, body.branchId);
  if (resolved.error) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const cart = body.cart;
  if (!Array.isArray(cart) || cart.length === 0) {
    return NextResponse.json({ error: 'ກະຕ່າສິນຄ້າຫວ່າງເປົ່າ' }, { status: 400 });
  }
  for (const item of cart) {
    if (!item.id) return NextResponse.json({ error: 'ມີລາຍການສິນຄ້າທີ່ບໍ່ມີລະຫັດ' }, { status: 400 });
    if (!Number.isFinite(Number(item.qty)) || Number(item.qty) < 1) {
      return NextResponse.json({ error: `ຈຳນວນຂອງ ${item.name || item.id} ຕ້ອງເປັນຈຳນວນເຕັມບວກ` }, { status: 400 });
    }
    if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0) {
      return NextResponse.json({ error: `ລາຄາຂອງ ${item.name || item.id} ບໍ່ຖືກຕ້ອງ` }, { status: 400 });
    }
  }

  const items = cart.map((item) => ({ id: item.id, qty: item.qty, price: item.price }));

  const { data, error } = await supabase.rpc('process_sale', {
    p_branch_id: resolved.branchId,
    cart: items,
  });

  if (error) {
    await logError('POST /api/sales', error.message, { branchId: resolved.branchId, cart: items });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const result = data[0];
  return NextResponse.json(
    { success: true, saleId: result.sale_id, saleCode: result.sale_code },
    { status: 201 }
  );
}

// GET /api/sales?branch_id=xxx -> ປະຫວັດການຂາຍສະເພາະສາຂານັ້ນ
export async function GET(request) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const resolved = resolveBranch(ctx, searchParams.get('branch_id'));
  if (resolved.error) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const { data: sales, error } = await supabase
    .from('sales')
    .select('id, sale_code, total_price, created_at, sale_items(product_barcode, product_name, qty, total_price)')
    .eq('branch_id', resolved.branchId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total_price), 0);

  return NextResponse.json({
    summary: { totalSales, totalOrders: sales.length },
    sales,
  });
}
