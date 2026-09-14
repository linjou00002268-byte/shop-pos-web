// lib/supabase-browser.js
// Client ນີ້ໃຊ້ໃນ browser ເທົ່ານັ້ນ (login form, sign out) — ໃຊ້ anon key
// (ບໍ່ແມ່ນ service_role key) ເພາະ key ນີ້ຈະຖືກເບິ່ງເຫັນຢູ່ຝັ່ງ client

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
