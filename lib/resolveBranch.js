// lib/resolveBranch.js
// ໃຊ້ຢູ່ຫົວແຖວຂອງທຸກ API route ຫຼັງຈາກ getUserContext() —
// ຄືນ { branchId } ຫຼື { error, status } ຖ້າບໍ່ຖືກຕ້ອງ
//
// ຫຼັກການສຳຄັນ: staff ບໍ່ສາມາດສົ່ງ branch_id ມາເອງເພື່ອຫຼົບເບິ່ງສາຂາອື່ນໄດ້ —
// ຄ່າຂອງ staff ຖືກບັງຄັບຈາກ profile ໃນ database ສະເໝີ, ບໍ່ແມ່ນຈາກ request

export function resolveBranch(ctx, requestedBranchId) {
  if (ctx.role === 'staff') {
    return { branchId: ctx.branchId };
  }
  // admin ຕ້ອງລະບຸ branch_id ມາໃນ request (ຈາກ BranchContext ຝັ່ງ frontend)
  if (!requestedBranchId) {
    return { error: 'ກະລຸນາເລືອກສາຂາ (branch_id)', status: 400 };
  }
  return { branchId: requestedBranchId };
}
