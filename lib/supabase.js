// lib/supabase.js
// Client ຕົວດຽວທີ່ທຸກ API route ໃນ /app/api ຈະ import ໄປໃຊ້ຮ່ວມກັນ
// ໃຊ້ service_role key ເພາະຢູ່ຝັ່ງ server ເທົ່ານັ້ນ (API routes ຂອງ Next.js
// ຮັນຢູ່ server ບໍ່ແມ່ນໃນ browser) — ຫ້າມ import ໄຟລ໌ນີ້ຈາກ component ຝັ່ງ client ເດັດຂາດ

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ SUPABASE_URL ຫຼື SUPABASE_SERVICE_ROLE_KEY ໃນໄຟລ໌ .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }, // API route ບໍ່ຕ້ອງການ session ຄ້າງໄວ້
});
