// app/api/products/route.js
// ແທນ GAS: getProducts() / getAllProductsReport() / addNewProduct()
// ✅ ອັບເດດແລ້ວ: ກອງຕາມສາຂາ (branch_id) — ນີ້ຄືຕົວຢ່າງ pattern ໃຫ້ນຳໄປໃຊ້ກັບ route ອື່ນ

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { validateNonEmptyString, validateNonNegativeNumber, collectErrors } from '@/lib/validate';
import { getUserContext } from '@/lib/getUserContext';
import { resolveBranch } from '@/lib/resolveBranch';

// GET /api/products?branch_id=xxx  -> ລາຍການສິນຄ້າສະເພາະສາຂານັ້ນ
export async function GET(request) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const resolved = resolveBranch(ctx, searchParams.get('branch_id'));
  if (resolved.error) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('branch_id', resolved.branchId)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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
// body: { branchId, id, name, category, cost, price, stock, location, reorder, unit }
export async function POST(request) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });

  const body = await request.json();
  const resolved = resolveBranch(ctx, body.branchId);
  if (resolved.error) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const errors = collectErrors([
    validateNonEmptyString(body.id, 'ລະຫັດສິນຄ້າ'),
    validateNonEmptyString(body.name, 'ຊື່ສິນຄ້າ'),
    validateNonNegativeNumber(body.cost, 'ລາຄາທຶນ'),
    validateNonNegativeNumber(body.price, 'ລາຄາຂາຍ'),
    validateNonNegativeNumber(body.stock, 'ສະຕັອກເລີ່ມຕົ້ນ'),
    validateNonNegativeNumber(body.reorder, 'ຈຸດສັ່ງເພີ່ມ'),
  ]);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  // ລະຫັດບາໂຄ້ດ (id) ບໍ່ຊ້ຳກັນສະເພາະ "ພາຍໃນສາຂາດຽວກັນ" — ສາຂາອື່ນໃຊ້ລະຫັດດຽວກັນໄດ້
  const { data: existing } = await supabase
    .from('products')
    .select('row_id')
    .eq('id', body.id)
    .eq('branch_id', resolved.branchId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'ລະຫັດສິນຄ້ານີ້ມີຢູ່ໃນສາຂານີ້ແລ້ວ' },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      id: body.id,
      branch_id: resolved.branchId,
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

  if (Number(body.stock) > 0) {
    await supabase.from('purchases').insert({
      purchase_code: `PO-${Date.now()}`,
      branch_id: resolved.branchId,
      product_row_id: data.row_id,
      product_barcode: body.id,
      product_name: body.name,
      qty: Number(body.stock),
      unit_cost: Number(body.cost) || 0,
      total: Number(body.stock) * (Number(body.cost) || 0),
    });
  }

  return NextResponse.json(data, { status: 201 });
}
