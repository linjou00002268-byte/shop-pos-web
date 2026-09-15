// app/api/admin/users/route.js
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getUserContext } from '@/lib/getUserContext';

// GET -> ລາຍຊື່ບັນຊີທັງໝົດ (ຈາກ Supabase Auth) ພ້ອມ role/branch ຂອງແຕ່ລະຄົນ (ຖ້າມີ)
export async function GET() {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'ສະເພາະ admin ເທົ່ານັ້ນ' }, { status: 403 });

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, branch_id, full_name, branches(name)');
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  const users = authUsers.users.map((u) => ({
    id: u.id,
    email: u.email,
    profile: profileMap[u.id] || null,
  }));

  return NextResponse.json({ users });
}

// POST { userId, role, branchId, fullName } -> ສ້າງ/ອັບເດດ profile (ກຳນົດສິດ+ສາຂາ) ໃຫ້ບັນຊີທີ່ມີຢູ່ແລ້ວ
export async function POST(request) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'ສະເພາະ admin ເທົ່ານັ້ນ' }, { status: 403 });

  const body = await request.json();
  if (!body.userId || !body.role) {
    return NextResponse.json({ error: 'ຕ້ອງລະບຸ userId ແລະ role' }, { status: 400 });
  }
  if (body.role === 'staff' && !body.branchId) {
    return NextResponse.json({ error: 'staff ຕ້ອງກຳນົດສາຂາ' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: body.userId,
      role: body.role,
      branch_id: body.role === 'admin' ? null : body.branchId,
      full_name: body.fullName || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
