// app/api/products/[id]/route.js
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { validateNonEmptyString, validateNonNegativeNumber, collectErrors } from '@/lib/validate';
import { getUserContext } from '@/lib/getUserContext';
import { resolveBranch } from '@/lib/resolveBranch';

// PUT /api/products/:id   body: { branchId, name, category, cost, price, location, unit }
export async function PUT(request, { params }) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });

  const body = await request.json();
  const resolved = resolveBranch(ctx, body.branchId);
  if (resolved.error) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const errors = collectErrors([
    validateNonEmptyString(body.name, 'ຊື່ສິນຄ້າ'),
    validateNonNegativeNumber(body.cost, 'ລາຄາທຶນ'),
    validateNonNegativeNumber(body.price, 'ລາຄາຂາຍ'),
  ]);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      name: body.name, category: body.category,
      cost: Number(body.cost) || 0, price: Number(body.price) || 0,
      location: body.location, unit: body.unit,
    })
    .eq('id', id)
    .eq('branch_id', resolved.branchId) // ✅ ບໍ່ໃຫ້ແກ້ໄຂສິນຄ້າຂອງສາຂາອື່ນໄດ້
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'ບໍ່ພົບສິນຄ້ານີ້ໃນສາຂານີ້' }, { status: 404 });
  return NextResponse.json(data);
}

// DELETE /api/products/:id?branch_id=xxx
export async function DELETE(request, { params }) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const resolved = resolveBranch(ctx, searchParams.get('branch_id'));
  if (resolved.error) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const { data: product } = await supabase
    .from('products')
    .select('row_id')
    .eq('id', id)
    .eq('branch_id', resolved.branchId)
    .maybeSingle();

  if (!product) return NextResponse.json({ error: 'ບໍ່ພົບສິນຄ້ານີ້ໃນສາຂານີ້' }, { status: 404 });

  const { count: saleCount } = await supabase
    .from('sale_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_row_id', product.row_id);

  if (saleCount > 0) {
    return NextResponse.json(
      { error: 'ບໍ່ສາມາດລຶບໄດ້ — ສິນຄ້ານີ້ມີປະຫວັດການຂາຍຢູ່ໃນລະບົບແລ້ວ' },
      { status: 409 }
    );
  }

  const { error } = await supabase.from('products').delete().eq('row_id', product.row_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
