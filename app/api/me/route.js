// app/api/me/route.js
import { NextResponse } from 'next/server';
import { getUserContext } from '@/lib/getUserContext';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const ctx = await getUserContext();
  if (!ctx) {
    return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });
  }

  let branches = [];
  if (ctx.role === 'admin') {
    const { data } = await supabase.from('branches').select('id, name').order('name');
    branches = data || [];
  } else {
    const { data } = await supabase.from('branches').select('id, name').eq('id', ctx.branchId).single();
    branches = data ? [data] : [];
  }

  return NextResponse.json({
    profile: { role: ctx.role, branchId: ctx.branchId, fullName: ctx.fullName },
    branches,
  });
}
