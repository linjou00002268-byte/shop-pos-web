// app/history/page.js
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useBranch } from '@/lib/BranchContext';

function fmtDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ສ້າງ ແລະ ດາວໂຫຼດໄຟລ໌ CSV ຈາກ array ຂອງ object (ບໍ່ຕ້ອງ npm install ເພີ່ມ)
function downloadCsv(filename, rows, headers) {
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  rows.forEach((row) => lines.push(headers.map((h) => escape(row[h])).join(',')));
  const csv = '\uFEFF' + lines.join('\r\n'); // \uFEFF = BOM ໃຫ້ Excel ອ່ານພາສາລາວຖືກ
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const { selectedBranchId } = useBranch() || {};
  const [masterRows, setMasterRows] = useState([]); // flattened: {date, orderId, prodId, prodName, qty, total}
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const swalRef = useRef(null);

  useEffect(() => {
    import('sweetalert2').then((m) => (swalRef.current = m.default));
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    fetch(`/api/sales?branch_id=${selectedBranchId}`)
      .then((res) => res.json())
      .then((json) => {
        const rows = [];
        (json.sales || []).forEach((sale) => {
          (sale.sale_items || []).forEach((item) => {
            rows.push({
              date: fmtDate(sale.created_at),
              orderId: sale.sale_code,
              prodId: item.product_barcode,
              prodName: item.product_name,
              qty: item.qty,
              total: Number(item.total_price),
            });
          });
        });
        setMasterRows(rows);
      });
  }, [selectedBranchId]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return masterRows.filter((row) => {
      const mSearch =
        !s ||
        row.orderId.toLowerCase().includes(s) ||
        row.prodId.toLowerCase().includes(s) ||
        row.prodName.toLowerCase().includes(s);
      let mDate = true;
      if (row.date) {
        const dateOnly = row.date.split(' ')[0];
        if (startDate && dateOnly < startDate) mDate = false;
        if (endDate && dateOnly > endDate) mDate = false;
      }
      return mSearch && mDate;
    });
  }, [masterRows, search, startDate, endDate]);

  const totalSales = filtered.reduce((sum, r) => sum + r.total, 0);

  function clearFilters() {
    setSearch('');
    setStartDate('');
    setEndDate('');
  }

  function viewBill(orderId) {
    const items = masterRows.filter((r) => r.orderId === orderId);
    if (items.length === 0) {
      swalRef.current?.fire({ icon: 'error', title: 'ບໍ່ພົບຂໍ້ມູນ!', text: 'ບໍ່ສາມາດດຶງລາຍລະອຽດຂອງບິນ: ' + orderId });
      return;
    }
    const billDate = items[0].date || '-';
    let grandTotal = 0;
    let rowsHtml = '';
    items.forEach((item, i) => {
      const pricePerUnit = item.qty > 0 ? item.total / item.qty : 0;
      grandTotal += item.total;
      rowsHtml += `<tr>
        <td>${i + 1}</td>
        <td class="fw-bold">${item.prodName}</td>
        <td class="text-center fw-bold">${item.qty}</td>
        <td class="text-end">${pricePerUnit.toLocaleString()} LAK</td>
        <td class="text-end fw-bold text-success">${item.total.toLocaleString()} LAK</td>
      </tr>`;
    });
    const html = `
      <div class="text-start mb-2 small">
        <p class="m-0"><strong>ລະຫັດບິນ:</strong> <span class="text-primary">${orderId}</span></p>
        <p class="m-0"><strong>ວັນທີ-ເວລາ:</strong> ${billDate}</p>
      </div>
      <div class="table-responsive">
        <table class="table table-bordered align-middle small text-start">
          <thead class="table-light">
            <tr><th>#</th><th>ຊື່ສິນຄ້າ</th><th class="text-center">ຈຳນວນ</th><th class="text-end">ລາຄາ/ອັນ</th><th class="text-end">ລວມ</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot class="table-light fw-bold">
            <tr><td colspan="4" class="text-end">ຍອດລວມທັງໝົດ:</td><td class="text-end text-primary fs-6">${grandTotal.toLocaleString()} LAK</td></tr>
          </tfoot>
        </table>
      </div>`;
    swalRef.current?.fire({
      title: '<i class="fa-solid fa-receipt text-primary me-2"></i>ລາຍລະອຽດໃບບິນ',
      html,
      width: '600px',
      confirmButtonText: 'ຕົກລົງ',
      confirmButtonColor: '#0d6efd',
    });
  }

  function exportCsv() {
    downloadCsv(
      `sales-history-${new Date().toISOString().split('T')[0]}.csv`,
      filtered.map((r) => ({
        'ວັນທີ-ເວລາ': r.date, 'ລະຫັດບິນ': r.orderId, 'ລະຫັດສິນຄ້າ': r.prodId,
        'ຊື່ສິນຄ້າ': r.prodName, 'ຈຳນວນ': r.qty, 'ຍອດລວມ': r.total,
      })),
      ['ວັນທີ-ເວລາ', 'ລະຫັດບິນ', 'ລະຫັດສິນຄ້າ', 'ຊື່ສິນຄ້າ', 'ຈຳນວນ', 'ຍອດລວມ']
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm p-3">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
          <div>
            <h4 className="m-0 fw-bold text-dark"><i className="fa-solid fa-clock-rotate-left text-primary me-2"></i> ປະຫວັດການຂາຍສິນຄ້າ</h4>
            <small className="text-muted">ກວດສອບລາຍການບິນຂາຍ ແລະ ຄົ້ນຫາຕາມຊ່ວງວັນທີ</small>
          </div>
          <div className="badge bg-primary fs-6 py-2 px-3">ຍອດຂາຍລວມ: {totalSales.toLocaleString()} LAK</div>
        </div>

        <div className="d-flex justify-content-end mb-2">
          <button className="btn btn-sm btn-outline-success fw-bold" onClick={exportCsv} disabled={filtered.length === 0}>
            <i className="fa-solid fa-file-csv me-1"></i> Export CSV
          </button>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-md-4">
            <input type="text" className="form-control" placeholder="ຄົ້ນຫາດ້ວຍລະຫັດບິນ, ບາໂຄ້ດ ຫຼື ຊື່ສິນຄ້າ..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="col-6 col-md-3">
            <div className="input-group">
              <span className="input-group-text small">ແຕ່</span>
              <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="input-group">
              <span className="input-group-text small">ຫາ</span>
              <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="col-12 col-md-2">
            <button className="btn btn-outline-secondary w-100 fw-bold" onClick={clearFilters}>ລ້າງຄ່າ</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle border">
            <thead className="table-light">
              <tr>
                <th>ວັນທີ-ເວລາ</th><th>ລະຫັດບິນ (Sales_ID)</th><th>ID ສິນຄ້າ</th>
                <th>ຊື່ສິນຄ້າ</th><th className="text-center">ຈຳນວນ</th><th className="text-end">ຍອດລວມ</th>
                <th className="text-center">ລາຍລະອຽດ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-4">❌ ບໍ່ພົບປະຫວັດການຂາຍທີ່ກົງກັບເງື່ອນໄຂ</td></tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={i}>
                    <td className="text-secondary small">{s.date}</td>
                    <td><span className="badge bg-light text-primary border fw-bold" style={{ cursor: 'pointer' }} onClick={() => viewBill(s.orderId)}>{s.orderId}</span></td>
                    <td className="small text-muted">{s.prodId}</td>
                    <td><strong>{s.prodName}</strong></td>
                    <td className="text-center fw-bold text-dark">{s.qty}</td>
                    <td className="text-end fw-bold text-success">{s.total.toLocaleString()} LAK</td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary py-0 px-2 fw-bold" onClick={() => viewBill(s.orderId)}>
                        <i className="fa-solid fa-receipt me-1"></i> ເບິ່ງບິນ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-muted small">ພົບຂໍ້ມູນທັງໝົດ <span className="fw-bold text-dark">{filtered.length}</span> ລາຍການ</div>
      </div>
    </div>
  );
}
