// app/api/products/[id]/route.js
// ແທນ GAS: updateProductDetails() + ໃໝ່: delete product

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { validateNonEmptyString, validateNonNegativeNumber, collectErrors } from '@/lib/validate';

// PUT /api/products/:id
// body: { name, category, cost, price, location, unit }
// ໝາຍເຫດ: ບໍ່ແກ້ stock ຢູ່ນີ້ (ຄືເດີມ — ໃຫ້ໃຊ້ /api/stock/receive ແທນ)
export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();

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

// DELETE /api/products/:id
// ລຶບສິນຄ້າ — ປະຕິເສດຖ້າສິນຄ້ານີ້ຍັງມີປະຫວັດການຂາຍ ເພື່ອຮັກສາຄວາມຖືກຕ້ອງຂອງລາຍງານເກົ່າ
export async function DELETE(request, { params }) {
  const { id } = await params;

  const { count: saleCount } = await supabase
    .from('sale_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', id);

  if (saleCount > 0) {
    return NextResponse.json(
      { error: 'ບໍ່ສາມາດລຶບໄດ້ — ສິນຄ້ານີ້ມີປະຫວັດການຂາຍຢູ່ໃນລະບົບແລ້ວ (ລຶບຈະເຮັດໃຫ້ລາຍງານເກົ່າຜິດພາດ)' },
      { status: 409 }
    );
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
