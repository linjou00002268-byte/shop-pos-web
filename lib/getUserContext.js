// lib/getUserContext.js
// ໃຊ້ຢູ່ຫົວແຖວຂອງທຸກ API route ທີ່ຕ້ອງການຮູ້ວ່າ "ຄົນນີ້ແມ່ນໃຜ, ສາຂາໃດ, admin ຫຼືບໍ່"
//
// ວິທີໃຊ້ໃນ route.js:
//   const ctx = await getUserContext();
//   if (!ctx) return NextResponse.json({ error: 'ຕ້ອງເຂົ້າສູ່ລະບົບ' }, { status: 401 });
//   const branchId = ctx.role === 'admin' ? requestedBranchId : ctx.branchId;

import { createClient } from '@/lib/supabase-server';
import { supabase as adminSupabase } from '@/lib/supabase';

export async function getUserContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // ອ່ານ profiles ດ້ວຍ service_role client ເພື່ອບໍ່ຕິດ RLS (route ນີ້ເອງເປັນຄົນກວດສິດແທນ)
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role, branch_id, full_name')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    role: profile.role,           // 'admin' | 'staff'
    branchId: profile.branch_id,  // null ສຳລັບ admin
    fullName: profile.full_name,
  };
}
