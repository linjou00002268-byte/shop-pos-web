// app/api/stock/receive/route.js
// ແທນ GAS: updateStockReceive() / updateStockReceiveWithPrices()

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { validatePositiveInt, validateNonNegativeNumber, collectErrors } from '@/lib/validate';
import { logError } from '@/lib/logError';

// POST /api/stock/receive
// body: { productId, qty, location, cost, price, unit }
// cost/price/unit ເປັນ optional — ຖ້າບໍ່ສົ່ງມາຈະບໍ່ປ່ຽນຄ່າເດີມ (ຄືເດີມ RPC ຈັດການໃຫ້)
export async function POST(request) {
  const body = await request.json();

  const errors = collectErrors([
    body.productId ? null : 'ຕ້ອງເລືອກສິນຄ້າ',
    validatePositiveInt(body.qty, 'ຈຳນວນທີ່ຮັບເຂົ້າ'),
    validateNonNegativeNumber(body.cost, 'ລາຄາທຶນ'),
    validateNonNegativeNumber(body.price, 'ລາຄາຂາຍ'),
  ]);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('receive_stock', {
    p_product_id: body.productId,
    p_qty: Number(body.qty),
    p_location: body.location || 'ບໍ່ມີ',
    p_cost: body.cost != null ? Number(body.cost) : null,
    p_price: body.price != null ? Number(body.price) : null,
    p_unit: body.unit || null,
  });

  if (error) {
    await logError('POST /api/stock/receive', error.message, { body });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const result = data[0];
  return NextResponse.json({
    success: true,
    newStock: result.new_stock,
    purchaseCode: result.purchase_code,
  });
}
