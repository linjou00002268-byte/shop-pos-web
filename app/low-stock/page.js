// app/low-stock/page.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/lib/BranchContext';

export default function LowStockPage() {
  const { selectedBranchId } = useBranch() || {};
  const [items, setItems] = useState(null); // null = loading
  const [limit, setLimit] = useState(5);
  const swalRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    import('sweetalert2').then((m) => (swalRef.current = m.default));
  }, []);

  useEffect(() => {
    if (selectedBranchId) load(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  function load(l) {
    setItems(null);
    fetch(`/api/products/low-stock?branch_id=${selectedBranchId}&limit=${l}`)
      .then((res) => res.json())
      .then((json) => setItems(Array.isArray(json) ? json : []));
  }

  function goToReceive(barcode, name) {
    swalRef.current
      ?.fire({
        title: 'ຢືນຢັນການເຕີມສະຕັອກ?',
        text: `ຕ້ອງການເຕີມສະຕັອກສິນຄ້າ: ${name || barcode} ບໍ່?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ໄປໜ້າຮັບສິນຄ້າ',
        cancelButtonText: 'ຍົກເລີກ',
      })
      .then((result) => {
        if (result.isConfirmed) {
          router.push(`/receive?barcode=${encodeURIComponent(barcode)}`);
        }
      });
  }

  return (
    <div className="container-fluid p-3">
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="m-0 fw-bold text-danger">
            <i className="fa-solid fa-triangle-exclamation me-2"></i>ແຈ້ງເຕືອນສິນຄ້າໃກ້ໝົດຄັງ
          </h5>
          <div className="d-flex align-items-center gap-2">
            <label className="form-label m-0 small fw-bold text-nowrap">ຈຳນວນເຕືອນຂັ້ນຕ່ຳ:</label>
            <input
              type="number"
              className="form-control form-control-sm"
              value={limit}
              style={{ width: 80 }}
              onChange={(e) => setLimit(Number(e.target.value))}
              onBlur={() => load(limit)}
            />
            <button className="btn btn-sm btn-primary fw-bold" onClick={() => load(limit)}>
              <i className="fa-solid fa-rotate me-1"></i> ໂຫຼດໃໝ່
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle m-0 small">
              <thead className="table-light">
                <tr>
                  <th>ລະຫັດບາໂຄ້ດ</th>
                  <th>ຊື່ສິນຄ້າ</th>
                  <th>ໝວດໝູ່</th>
                  <th className="text-center">ຈຳນວນເຫຼືອ</th>
                  <th className="text-center">ສະຖານະ</th>
                  <th className="text-center">ຈັດການ</th>
                </tr>
              </thead>
              <tbody>
                {items === null ? (
                  <tr><td colSpan={6} className="text-center py-4"><span className="spinner-border spinner-border-sm me-2"></span>ກຳລັງກວດສອບສະຕັອກ...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-success fw-bold"><i className="fa-solid fa-circle-check me-2"></i>ບໍ່ມີສິນຄ້າໃກ້ໝົດຄັງ! (ສະຕັອກປົກກະຕິດີ)</td></tr>
                ) : (
                  items.map((item) => {
                    const isOut = item.stock <= 0;
                    return (
                      <tr key={item.barcode}>
                        <td className="fw-bold">{item.barcode}</td>
                        <td className="fw-bold text-dark">{item.name}</td>
                        <td><span className="badge bg-secondary">{item.category}</span></td>
                        <td className={`text-center fw-bold fs-6 ${isOut ? 'text-danger' : 'text-warning-emphasis'}`}>{item.stock} {item.unit}</td>
                        <td className="text-center"><span className={`badge ${isOut ? 'bg-danger' : 'bg-warning text-dark'}`}>{isOut ? 'ໝົດຄັງ' : 'ໃກ້ໝົດ'}</span></td>
                        <td className="text-center">
                          <button className="btn btn-sm btn-outline-primary fw-bold py-0" onClick={() => goToReceive(item.barcode, item.name)}>
                            <i className="fa-solid fa-box-open me-1"></i> ເຕີມສະຕັອກ
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
