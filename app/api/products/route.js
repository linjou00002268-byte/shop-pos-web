// app/api/products/route.js
// ແທນ GAS: getProducts() / getAllProductsReport() / addNewProduct()

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/products  -> ລາຍການສິນຄ້າທັງໝົດ ພ້ອມສະຖານະສະຕັອກ (ຄືເດີມ getAllProductsReport)
export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ຄິດໄລ່ status ຄືເດີມ (out_of_stock / low_stock / normal) ແລະ categories
  const categories = new Set();
  const products = data.map((p) => {
    categories.add(p.category);
    let status = 'normal';
    if (p.stock <= 0) status = 'out_of_stock';
    else if (p.stock <= p.reorder_point) status = 'low_stock';
    return { ...p, status };
  });

  return NextResponse.json({
    categories: Array.from(categories).sort(),
    products,
  });
}

// POST /api/products  -> ເພີ່ມສິນຄ້າໃໝ່ (ຄືເດີມ addNewProduct)
// body: { id, name, category, cost, price, stock, location, reorder, unit }
export async function POST(request) {
  const body = await request.json();

  if (!body.id || !body.name) {
    return NextResponse.json(
      { error: 'ຕ້ອງໃສ່ id ແລະ name' },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('id', body.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'ລະຫັດສິນຄ້ານີ້ມີຢູ່ໃນລະບົບແລ້ວ' },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      id: body.id,
      name: body.name,
      category: body.category || 'ທົ່ວໄປ',
      cost: Number(body.cost) || 0,
      price: Number(body.price) || 0,
      stock: Number(body.stock) || 0,
      location: body.location || 'ບໍ່ມີ',
      reorder_point: Number(body.reorder) || 5,
      unit: body.unit || 'ອັນ',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ຖ້າມີສະຕັອກເລີ່ມຕົ້ນ > 0, ບັນທຶກເປັນ purchase ຄັ້ງທຳອິດ (ຄືເດີມ logPurchase)
  // ໝາຍເຫດ: insert ໂດຍກົງໃສ່ purchases (ບໍ່ເອີ້ນ receive_stock RPC ເພາະ RPC ນັ້ນຈະ
  // ບວກສະຕັອກເພີ່ມອີກຄັ້ງ ເຮັດໃຫ້ຊ້ຳກັບຄ່າ stock ທີ່ໃສ່ຕອນ insert ຂ້າງເທິງ)
  if (Number(body.stock) > 0) {
    await supabase.from('purchases').insert({
      purchase_code: `PO-${Date.now()}`, // ຫຼືເອີ້ນ generate_code('PO') ຜ່ານ RPC ແຍກຕ່າງຫາກ
      product_id: body.id,
      product_name: body.name,
      qty: Number(body.stock),
      unit_cost: Number(body.cost) || 0,
      total: Number(body.stock) * (Number(body.cost) || 0),
    });
  }

  return NextResponse.json(data, { status: 201 });
}
