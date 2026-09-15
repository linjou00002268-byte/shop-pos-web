// lib/supabase-server.js
// ໃຊ້ໃນ API route (route.js) ເພື່ອອ່ານ session ຂອງຄົນທີ່ login ຢູ່ (ຈາກ cookie)
// ຕ່າງຈາກ lib/supabase.js (service_role, ບໍ່ຮູ້ວ່າໃຜ login) ແລະ
// lib/supabase-browser.js (ໃຊ້ໃນ browser ເທົ່ານັ້ນ)

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // API route ບໍ່ຈຳເປັນຕ້ອງຂຽນ cookie ຄືນ (middleware ຈັດການແລ້ວ)
        },
      },
    }
  );
}
