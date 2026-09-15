// app/admin/branches/page.js
'use client';

import { useEffect, useRef, useState } from 'react';

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const swalRef = useRef(null);

  useEffect(() => {
    import('sweetalert2').then((m) => (swalRef.current = m.default));
    load();
  }, []);

  function load() {
    setBranches(null);
    fetch('/api/admin/branches')
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setBranches(json.branches || []);
      });
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      swalRef.current?.fire({ icon: 'warning', title: 'ກະລຸນາໃສ່ຊື່ສາຂາ' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        swalRef.current?.fire({ icon: 'error', title: 'ເກີດຂໍ້ຜິດພາດ', text: json.error });
        return;
      }
      swalRef.current?.fire({ icon: 'success', title: 'ເພີ່ມສາຂາສຳເລັດ', showConfirmButton: false, timer: 1300 });
      setShowModal(false);
      setForm({ name: '', address: '' });
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0 fw-bold text-dark">
            <i className="fa-solid fa-code-branch text-primary me-2"></i> ຈັດການສາຂາ
          </h4>
          <button className="btn btn-sm btn-success fw-bold" onClick={() => setShowModal(true)}>
            <i className="fa-solid fa-plus-circle me-1"></i> ເພີ່ມສາຂາໃໝ່
          </button>
        </div>

        {error && <div className="alert alert-warning small">{error}</div>}

        <div className="table-responsive">
          <table className="table table-hover align-middle small">
            <thead className="table-light">
              <tr><th>ຊື່ສາຂາ</th><th>ທີ່ຢູ່</th><th>ລະຫັດສາຂາ (ID)</th></tr>
            </thead>
            <tbody>
              {branches === null ? (
                <tr><td colSpan={3} className="text-center text-muted py-4">ກຳລັງໂຫຼດ...</td></tr>
              ) : branches.length === 0 ? (
                <tr><td colSpan={3} className="text-center text-muted py-4">ຍັງບໍ່ມີສາຂາ — ກົດ "ເພີ່ມສາຂາໃໝ່" ເພື່ອເລີ່ມຕົ້ນ</td></tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.id}>
                    <td className="fw-bold text-dark">{b.name}</td>
                    <td className="text-muted">{b.address || '-'}</td>
                    <td><code style={{ fontSize: 11 }}>{b.id}</code></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="app-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content border-0 shadow-lg" style={{ maxWidth: 460, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-light border-bottom-0">
              <h5 className="modal-title fw-bold"><i className="fa-solid fa-plus-circle text-success me-2"></i>ເພີ່ມສາຂາໃໝ່</h5>
              <button className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body py-3">
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">ຊື່ສາຂາ</label>
                <input className="form-control" placeholder="ເຊັ່ນ: ສາຂາຫຼັກ, ສາຂາ ວຽງຈັນ"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">ທີ່ຢູ່ (ບໍ່ບັງຄັບ)</label>
                <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer bg-light border-top-0">
              <button className="btn btn-secondary btn-sm fw-bold px-3" onClick={() => setShowModal(false)}>ປິດ</button>
              <button className="btn btn-success btn-sm fw-bold px-3" onClick={handleSubmit} disabled={submitting}>
                <i className="fa-solid fa-floppy-disk me-1"></i> {submitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
