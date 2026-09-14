// app/api/sales/route.js
// ແທນ GAS: processSale(cart) / getSalesHistory()

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { logError } from '@/lib/logError';

// POST /api/sales
// body: { cart: [ { id, name, qty, price }, ... ] }
// ໃຊ້ RPC process_sale() ໃນ schema.sql ເພື່ອບັນທຶກ + ຕັດສະຕັອກແບບ atomic
// (ລັອກແຖວສິນຄ້າ ປ້ອງກັນ stock ຜິດພາດເມື່ອຂາຍພ້ອມກັນ)
export async function POST(request) {
  const body = await request.json();
  const cart = body.cart;

  if (!Array.isArray(cart) || cart.length === 0) {
    return NextResponse.json({ error: 'ກະຕ່າສິນຄ້າຫວ່າງເປົ່າ' }, { status: 400 });
  }

  // ກວດຄວາມຖືກຕ້ອງຂອງແຕ່ລະລາຍການໃນກະຕ່າ ກ່ອນສົ່ງໄປ RPC
  for (const item of cart) {
    if (!item.id) {
      return NextResponse.json({ error: 'ມີລາຍການສິນຄ້າທີ່ບໍ່ມີລະຫັດ' }, { status: 400 });
    }
    if (!Number.isFinite(Number(item.qty)) || Number(item.qty) < 1) {
      return NextResponse.json({ error: `ຈຳນວນຂອງ ${item.name || item.id} ຕ້ອງເປັນຈຳນວນເຕັມບວກ` }, { status: 400 });
    }
    if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0) {
      return NextResponse.json({ error: `ລາຄາຂອງ ${item.name || item.id} ບໍ່ຖືກຕ້ອງ` }, { status: 400 });
    }
  }

  // ແປງໃຫ້ກົງກັບ jsonb ທີ່ process_sale() ຄາດຫວັງ: [{id, qty, price}]
  const items = cart.map((item) => ({
    id: item.id,
    qty: item.qty,
    price: item.price,
  }));

  const { data, error } = await supabase.rpc('process_sale', { cart: items });

  if (error) {
    // error.message ຈະເປັນຂໍ້ຄວາມ raise exception ຈາກ SQL ເຊັ່ນ "ສະຕັອກ X ບໍ່ພຽງພໍ"
    await logError('POST /api/sales', error.message, { cart: items });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // process_sale ສົ່ງກັບເປັນ table (sale_id, sale_code) -> data ເປັນ array 1 ແຖວ
  const result = data[0];
  return NextResponse.json(
    { success: true, saleId: result.sale_id, saleCode: result.sale_code },
    { status: 201 }
  );
}

// GET /api/sales -> ປະຫວັດການຂາຍ (ຄືເດີມ getSalesHistory)
export async function GET() {
  const { data: sales, error } = await supabase
    .from('sales')
    .select('id, sale_code, total_price, created_at, sale_items(product_id, product_name, qty, total_price)')
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
