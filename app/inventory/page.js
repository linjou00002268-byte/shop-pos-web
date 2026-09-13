// app/inventory/page.js
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const emptyForm = { id: '', name: '', category: '', newCategory: '', location: '', cost: '', price: '', qty: '0', unit: 'ອັນ' };

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const swalRef = useRef(null);

  useEffect(() => {
    import('sweetalert2').then((m) => (swalRef.current = m.default));
    load();
  }, []);

  function load() {
    fetch('/api/products')
      .then((res) => res.json())
      .then((json) => {
        setProducts(json.products || []);
        setCategories(json.categories || []);
      });
  }

  const filtered = useMemo(() => {
    const val = search.toLowerCase().trim();
    if (!val) return products;
    return products.filter(
      (p) =>
        p.id.toLowerCase().includes(val) ||
        p.name.toLowerCase().includes(val) ||
        (p.category || '').toLowerCase().includes(val) ||
        (p.location || '').toLowerCase().includes(val)
    );
  }, [products, search]);

  function openAdd() {
    setEditMode(false);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(p) {
    setEditMode(true);
    setForm({
      id: p.id, name: p.name, category: p.category, newCategory: '',
      location: p.location || '', cost: String(p.cost || 0), price: String(p.price || 0),
      qty: String(p.stock), unit: p.unit || 'ອັນ',
    });
    setShowModal(true);
  }

  const finalCategory = (form.category === '__new__' ? form.newCategory : form.category).trim() || 'ທົ່ວໄປ';

  async function handleSubmit() {
    const id = form.id.trim();
    const name = form.name.trim();
    if (!id || !name) {
      swalRef.current?.fire({ icon: 'warning', title: 'ຂໍ້ມູນບໍ່ຄົບຖ້ວນ', text: 'ກະລຸນາກອກລະຫັດ ແລະ ຊື່ສິນຄ້າໃຫ້ຄົບຖ້ວນ!' });
      return;
    }
    setSubmitting(true);
    try {
      if (editMode) {
        const res = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, category: finalCategory, cost: Number(form.cost) || 0, price: Number(form.price) || 0,
            location: form.location.trim() || 'ຄັງເດີມ', unit: form.unit.trim() || 'ອັນ',
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          swalRef.current?.fire({ icon: 'error', title: 'ເກີດຂໍ້ຜິດພາດ!', text: json.error || 'ບໍ່ສາມາດແກ້ໄຂຂໍ້ມູນໄດ້ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ' });
          return;
        }
        swalRef.current?.fire({ icon: 'success', title: '🎉 ແກ້ໄຂຂໍ້ມູນສິນຄ້າຮຽບຮ້ອຍແລ້ວ!', showConfirmButton: false, timer: 1500 });
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id, name, category: finalCategory, cost: Number(form.cost) || 0, price: Number(form.price) || 0,
            stock: Number(form.qty) || 0, location: form.location.trim() || 'ຄັງເດີມ', unit: form.unit.trim() || 'ອັນ',
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          swalRef.current?.fire({ icon: 'error', title: 'ເກີດຂໍ້ຜິດພາດ!', text: json.error || 'ລະຫັດສິນຄ້າຊ້ຳກັນ! ບໍ່ສາມາດເພີ່ມໄດ້' });
          return;
        }
        swalRef.current?.fire({ icon: 'success', title: '🎉 ເພີ່ມສິນຄ້າໃໝ່ເຂົ້າຖານຂໍ້ມູນສຳເລັດ!', showConfirmButton: false, timer: 1500 });
      }
      setShowModal(false);
      load();
    } catch (err) {
      swalRef.current?.fire({ icon: 'error', title: 'Error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  function stockClass(p) {
    return Number(p.stock) <= (p.reorder_point ?? 5) ? 'text-danger' : 'text-success';
  }

  return (
    <div className="card p-3 shadow-sm border-0">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 className="fw-bold text-dark m-0">
          <i className="fa-solid fa-boxes-stacked text-primary me-2"></i>ລາຍການສິນຄ້າທັງໝົດໃນຄັງ &amp; ຈັດການຂໍ້ມູນ (Inventory)
        </h5>
        <div className="d-flex gap-2">
          <div style={{ width: 280 }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted"><i className="fa-solid fa-magnifying-glass"></i></span>
              <input
                type="text"
                className="form-control form-control-sm border-start-0 ps-0"
                placeholder="ຄົ້ນຫາດ້ວຍ ລະຫັດ, ຊື່, ໝວດໝູ່, ໂລເຄຊັ່ນ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-sm btn-success fw-bold px-3" onClick={openAdd}>
            <i className="fa-solid fa-plus-circle me-1"></i> ເພີ່ມສິນຄ້າໃໝ່
          </button>
        </div>
      </div>

      <div className="table-responsive" style={{ maxHeight: 550 }}>
        <table className="table table-hover align-middle small table-bordered m-0">
          <thead className="table-light sticky-top">
            <tr className="text-secondary text-nowrap">
              <th style={{ width: 120 }}>ລະຫັດ / ບາໂຄ້ດ</th>
              <th>ລາຍລະອຽດສິນຄ້າ</th>
              <th style={{ width: 130 }}>ໝວດໝູ່</th>
              <th style={{ width: 100 }}>ສະຖານທີ່ເກັບ</th>
              <th className="text-end" style={{ width: 120 }}>ລາຄາທຶນ</th>
              <th className="text-end" style={{ width: 120 }}>ລາຄາຂາຍ</th>
              <th className="text-end" style={{ width: 125 }}>ຍອດຄັງເຫຼືອ</th>
              <th className="text-center" style={{ width: 90 }}>ຈັດການ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-muted py-4">❌ ບໍ່ພົບຂໍ້ມູນສິນຄ້າໃນລະບົບ</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="fw-bold text-secondary">{p.id}</td>
                  <td><strong className="text-dark">{p.name}</strong></td>
                  <td><span className="badge bg-light text-dark border px-2 py-1">{p.category}</span></td>
                  <td className="text-muted"><i className="fa-solid fa-location-dot me-1 text-danger small"></i>{p.location || '-'}</td>
                  <td className="text-end text-secondary">{Number(p.cost).toLocaleString()}</td>
                  <td className="text-end fw-bold text-primary">{Number(p.price).toLocaleString()}</td>
                  <td className={`text-end fw-bold ${stockClass(p)}`}>
                    {Number(p.stock).toLocaleString()} <small className="text-muted fw-normal">{p.unit}</small>
                  </td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-primary py-1 px-2 fw-bold" onClick={() => openEdit(p)}>
                      <i className="fa-solid fa-pen-to-square me-1"></i>ແກ້ໄຂ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="app-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content border-0 shadow-lg" style={{ maxWidth: 520, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-light border-bottom-0">
              <h5 className="modal-title fw-bold text-dark">
                <i className={`fa-solid ${editMode ? 'fa-pen-to-square text-warning' : 'fa-plus-circle text-success'} me-2`}></i>
                {editMode ? 'ແກ້ໄຂຂໍ້ມູນສິນຄ້າ' : 'ເພີ່ມສິນຄ້າໃໝ່ເຂົ້າຄັງ'}
              </h5>
              <button className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body py-3">
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">ບາໂຄ້ດ / ລະຫັດສິນຄ້າ</label>
                <input type="text" className="form-control" placeholder="ປ້ອນ ຫຼື ສະແກນລະຫັດ..."
                  value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={editMode} />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">ຊື່ສິນຄ້າ</label>
                <input type="text" className="form-control" placeholder="ຊື່ສິນຄ້າ..."
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary">ໝວດໝູ່ສິນຄ້າ</label>
                  <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">-- ເລືອກໝວດໝູ່ --</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    <option value="__new__">+ ເພີ່ມໝວດໝູ່ໃໝ່...</option>
                  </select>
                  {form.category === '__new__' && (
                    <input type="text" className="form-control mt-1" placeholder="ປ້ອນໝວດໝູ່ໃໝ່..."
                      value={form.newCategory} onChange={(e) => setForm({ ...form, newCategory: e.target.value })} />
                  )}
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary">ສະຖານທີ່ເກັບ</label>
                  <input type="text" className="form-control" placeholder="ເຊັ່ນ: ຕູ້ A, ຊັ້ນ 1"
                    value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary">ລາຄາທຶນ (LAK)</label>
                  <input type="number" className="form-control" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary">ລາຄາຂາຍ (LAK)</label>
                  <input type="number" className="form-control" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary">{editMode ? 'ຈຳນວນຄັງປັດຈຸບັນ' : 'ສະຕັອກເລີ່ມຕົ້ນ'}</label>
                  <input type="number" className="form-control" min="0" value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })} disabled={editMode} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-secondary">ຫົວໜ່ວຍສິນຄ້າ</label>
                  <input type="text" className="form-control" placeholder="ເຊັ່ນ: ອັນ, ກ່ອງ, ຕຸກ"
                    value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light border-top-0">
              <button className="btn btn-secondary fw-bold btn-sm px-3" onClick={() => setShowModal(false)}>🔒 ປິດ</button>
              <button className="btn btn-success fw-bold btn-sm px-3" onClick={handleSubmit} disabled={submitting}>
                <i className="fa-solid fa-floppy-disk me-1"></i> {submitting ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນບັນທຶກ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
