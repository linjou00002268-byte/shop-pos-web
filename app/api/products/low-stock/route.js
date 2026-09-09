// app/api/products/low-stock/route.js
// ແທນ GAS: getLowStockProducts(threshold)

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/products/low-stock?limit=5
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit')) || 5;

  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, stock, unit')
    .lte('stock', limit)
    .order('stock', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ປັບຊື່ field ໃຫ້ຄືເດີມ (barcode ແທນ id) ເພື່ອໃຫ້ frontend ເດີມໃຊ້ໄດ້ໂດຍບໍ່ຕ້ອງແກ້ຫຼາຍ
  const items = data.map((p) => ({
    barcode: p.id,
    name: p.name,
    category: p.category,
    stock: p.stock,
    unit: p.unit,
  }));

  return NextResponse.json(items);
}
