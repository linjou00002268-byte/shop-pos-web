// lib/validate.js
// ຟັງຊັນຊ່ວຍກວດຄ່າ input ພື້ນຖານ — ໃຊ້ຮ່ວມກັນທຸກ API route
// ຄືນຄ່າ null ຖ້າຖືກຕ້ອງ, ຄືນຂໍ້ຄວາມ error (string) ຖ້າຜິດ

export function validateNonNegativeNumber(value, fieldLabel) {
  if (value === undefined || value === null || value === '') return null; // optional field, ຂ້າມການກວດ
  const num = Number(value);
  if (isNaN(num)) return `${fieldLabel} ຕ້ອງເປັນຕົວເລກ`;
  if (num < 0) return `${fieldLabel} ຕ້ອງບໍ່ຕິດລົບ`;
  return null;
}

export function validatePositiveInt(value, fieldLabel) {
  if (value === undefined || value === null || value === '') return `${fieldLabel} ຈຳເປັນຕ້ອງໃສ່`;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) return `${fieldLabel} ຕ້ອງເປັນຈຳນວນເຕັມບວກ (ຕັ້ງແຕ່ 1 ຂຶ້ນໄປ)`;
  return null;
}

export function validateNonEmptyString(value, fieldLabel) {
  if (!value || !String(value).trim()) return `${fieldLabel} ຈຳເປັນຕ້ອງໃສ່`;
  return null;
}

// ກວດຫຼາຍຄ່າພ້ອມກັນ — ຄືນ array ຂອງ error message (ຫວ່າງເປົ່າ = ຜ່ານໝົດ)
export function collectErrors(checks) {
  return checks.filter(Boolean);
}
