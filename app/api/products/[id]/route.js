// app/api/products/[id]/route.js
// ແທນ GAS: updateProductDetails()

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// PUT /api/products/:id
// body: { name, category, cost, price, location, unit }
// ໝາຍເຫດ: ບໍ່ແກ້ stock ຢູ່ນີ້ (ຄືເດີມ — ໃຫ້ໃຊ້ /api/stock/receive ແທນ)
export async function PUT(request, { params }) {
  const { id } = params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('products')
    .update({
      name: body.name,
      category: body.category,
      cost: Number(body.cost) || 0,
      price: Number(body.price) || 0,
      location: body.location,
      unit: body.unit,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'ບໍ່ພົບສິນຄ້ານີ້' }, { status: 404 });
  }

  return NextResponse.json(data);
}
