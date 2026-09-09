// app/api/stock/receive/route.js
// ແທນ GAS: updateStockReceive() / updateStockReceiveWithPrices()

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// POST /api/stock/receive
// body: { productId, qty, location, cost, price, unit }
// cost/price/unit ເປັນ optional — ຖ້າບໍ່ສົ່ງມາຈະບໍ່ປ່ຽນຄ່າເດີມ (ຄືເດີມ RPC ຈັດການໃຫ້)
export async function POST(request) {
  const body = await request.json();

  if (!body.productId || !body.qty) {
    return NextResponse.json(
      { error: 'ຕ້ອງໃສ່ productId ແລະ qty' },
      { status: 400 }
    );
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const result = data[0];
  return NextResponse.json({
    success: true,
    newStock: result.new_stock,
    purchaseCode: result.purchase_code,
  });
}
