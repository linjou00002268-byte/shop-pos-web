// app/api/admin/branches/route.js
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getUserContext } from '@/lib/getUserContext';
import { validateNonEmptyString } from '@/lib/validate';

export async function GET() {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'ສະເພາະ admin ເທົ່ານັ້ນ' }, { status: 403 });

  const { data, error } = await supabase.from('branches').select('*').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ branches: data });
}

// POST { name, address }
export async function POST(request) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'ສະເພາະ admin ເທົ່ານັ້ນ' }, { status: 403 });

  const body = await request.json();
  const err = validateNonEmptyString(body.name, 'ຊື່ສາຂາ');
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { data, error } = await supabase
    .from('branches')
    .insert({ name: body.name.trim(), address: body.address?.trim() || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
