// app/admin/users/page.js
'use client';

import { useEffect, useRef, useState } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState(null);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // { userId, email, role, branchId, fullName }
  const [submitting, setSubmitting] = useState(false);
  const swalRef = useRef(null);

  useEffect(() => {
    import('sweetalert2').then((m) => (swalRef.current = m.default));
    load();
  }, []);

  function load() {
    setUsers(null);
    Promise.all([
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/admin/branches').then((r) => r.json()),
    ]).then(([usersJson, branchesJson]) => {
      if (usersJson.error) setError(usersJson.error);
      else setUsers(usersJson.users || []);
      setBranches(branchesJson.branches || []);
    });
  }

  function openEdit(u) {
    setEditing({
      userId: u.id,
      email: u.email,
      role: u.profile?.role || 'staff',
      branchId: u.profile?.branch_id || '',
      fullName: u.profile?.full_name || '',
    });
  }

  async function save() {
    if (editing.role === 'staff' && !editing.branchId) {
      swalRef.current?.fire({ icon: 'warning', title: 'ກະລຸນາເລືອກສາຂາໃຫ້ພະນັກງານ' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const json = await res.json();
      if (!res.ok) {
        swalRef.current?.fire({ icon: 'error', title: 'ເກີດຂໍ້ຜິດພາດ', text: json.error });
        return;
      }
      swalRef.current?.fire({ icon: 'success', title: 'ບັນທຶກສຳເລັດ', showConfirmButton: false, timer: 1300 });
      setEditing(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 className="m-0 fw-bold text-dark">
            <i className="fa-solid fa-users text-primary me-2"></i> ຈັດການຜູ້ໃຊ້ ແລະ ສິດ
          </h4>
          <button className="btn btn-sm btn-primary fw-bold" onClick={load}>
            <i className="fa-solid fa-rotate me-1"></i> ໂຫຼດໃໝ່
          </button>
        </div>
        <p className="text-muted small mb-3">
          ສ້າງບັນຊີໃໝ່ໄດ້ທີ່ Supabase → Authentication → Users → Add user ຈາກນັ້ນກັບມາກຳນົດສິດ+ສາຂາຢູ່ໜ້ານີ້
        </p>

        {error && <div className="alert alert-warning small">{error}</div>}

        <div className="table-responsive">
          <table className="table table-hover align-middle small">
            <thead className="table-light">
              <tr><th>ອີເມວ</th><th>ຊື່</th><th>ສິດ</th><th>ສາຂາ</th><th className="text-center">ຈັດການ</th></tr>
            </thead>
            <tbody>
              {users === null ? (
                <tr><td colSpan={5} className="text-center text-muted py-4">ກຳລັງໂຫຼດ...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted py-4">ຍັງບໍ່ມີບັນຊີຜູ້ໃຊ້</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-bold text-dark">{u.email}</td>
                    <td>{u.profile?.full_name || '-'}</td>
                    <td>
                      {u.profile ? (
                        <span className={`badge ${u.profile.role === 'admin' ? 'bg-danger' : 'bg-secondary'}`}>
                          {u.profile.role === 'admin' ? 'Admin' : 'ພະນັກງານ'}
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark">ຍັງບໍ່ໄດ້ກຳນົດ</span>
                      )}
                    </td>
                    <td className="text-muted">
                      {u.profile?.role === 'admin' ? 'ທຸກສາຂາ' : u.profile?.branches?.name || '-'}
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-primary py-0 px-2 fw-bold" onClick={() => openEdit(u)}>
                        <i className="fa-solid fa-pen-to-square me-1"></i>ກຳນົດສິດ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="app-modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal-content border-0 shadow-lg" style={{ maxWidth: 460, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-light border-bottom-0">
              <h5 className="modal-title fw-bold"><i className="fa-solid fa-user-shield text-primary me-2"></i>ກຳນົດສິດຜູ້ໃຊ້</h5>
              <button className="btn-close" onClick={() => setEditing(null)}></button>
            </div>
            <div className="modal-body py-3">
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">ອີເມວ</label>
                <input className="form-control" value={editing.email} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">ຊື່-ນາມສະກຸນ</label>
                <input className="form-control" value={editing.fullName}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">ສິດ</label>
                <select className="form-select" value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                  <option value="staff">ພະນັກງານ (ເຫັນສະເພາະສາຂາຕົນເອງ)</option>
                  <option value="admin">Admin (ເຫັນທຸກສາຂາ)</option>
                </select>
              </div>
              {editing.role === 'staff' && (
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">ສາຂາທີ່ສັງກັດ</label>
                  <select className="form-select" value={editing.branchId}
                    onChange={(e) => setEditing({ ...editing, branchId: e.target.value })}>
                    <option value="">-- ເລືອກສາຂາ --</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer bg-light border-top-0">
              <button className="btn btn-secondary btn-sm fw-bold px-3" onClick={() => setEditing(null)}>ປິດ</button>
              <button className="btn btn-success btn-sm fw-bold px-3" onClick={save} disabled={submitting}>
                <i className="fa-solid fa-floppy-disk me-1"></i> {submitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
