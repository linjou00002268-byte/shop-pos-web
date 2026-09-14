// lib/logError.js
import { supabase } from '@/lib/supabase';

// ບັນທຶກ error ເຂົ້າ table error_logs — ບໍ່ throw ຕໍ່ ເພື່ອບໍ່ໃຫ້ການ log ເອງເຮັດໃຫ້ request ລົ້ມເຫລວ
export async function logError(source, message, context) {
  try {
    await supabase.from('error_logs').insert({ source, message, context: context || null });
  } catch (e) {
    // ຖ້າແມ່ນແຕ່ການ log ກໍ່ຜິດພາດ (ເຊັ່ນ table ຍັງບໍ່ໄດ້ສ້າງ) ໃຫ້ຂ້າມໄປ ບໍ່ໃຫ້ກະທົບ request ຫຼັກ
    console.error('logError failed:', e.message);
  }
}
