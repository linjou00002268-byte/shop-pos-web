// app/inventory/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatKip } from '@/lib/format';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  function loadProducts() {
    setLoading(true);
    fetch('/api/products')
      .then((res) => res.json())
      .then((json) => {
        setProducts(json.products || []);
        setCategories(json.categories || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  function startEdit(p) {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      category: p.category,
      cost: p.cost,
      price: p.price,
      location: p.location,
      unit: p.unit,
    });
  }

  async function saveEdit(id) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ type: 'error', text: json.error });
        return;
      }
      setToast({ type: 'success', text: 'ບັນທຶກການແກ້ໄຂສຳເລັດ' });
      setEditingId(null);
      loadProducts();
    } catch (e) {
      setToast({ type: 'error', text: e.message });
    }
  }

  function statusTag(status) {
    if (status === 'out_of_stock') return <span className="tag danger">ໝົດຄັງ</span>;
    if (status === 'low_stock') return <span className="tag danger">ໃກ້ໝົດ</span>;
    return <span className="tag success">ປົກກະຕິ</span>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">ຄັງສິນຄ້າ</h1>
          <p className="page-subtitle">ລາຍການສິນຄ້າທັງໝົດ — ກົດ "ແກ້ໄຂ" ເພື່ອປັບຂໍ້ມູນ</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <input
            placeholder="ຄົ້ນຫາຊື່ ຫຼື ລະຫັດ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field" style={{ width: 200, marginBottom: 0 }}>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">ທຸກໝວດໝູ່</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">ກຳລັງໂຫຼດ...</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">ບໍ່ພົບສິນຄ້າ</p>
      ) : (
        <table className="ledger-table">
          <thead>
            <tr>
              <th>ລະຫັດ</th>
              <th>ຊື່</th>
              <th>ໝວດໝູ່</th>
              <th className="num">ທຶນ</th>
              <th className="num">ຂາຍ</th>
              <th className="num">ຄົງເຫຼືອ</th>
              <th>ບ່ອນເກັບ</th>
              <th>ສະຖານະ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) =>
              editingId === p.id ? (
                <tr key={p.id} style={{ background: 'rgba(224,164,88,0.06)' }}>
                  <td>{p.id}</td>
                  <td>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px' }}
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editForm.cost}
                      onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                      style={{ width: 90, padding: '5px 8px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      style={{ width: 90, padding: '5px 8px' }}
                    />
                  </td>
                  <td className="num">{p.stock}</td>
                  <td>
                    <input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      style={{ width: '100%', padding: '5px 8px' }}
                    />
                  </td>
                  <td>{statusTag(p.status)}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn" style={{ padding: '5px 10px', fontSize: 12.5 }} onClick={() => saveEdit(p.id)}>
                      ບັນທຶກ
                    </button>
                    <button
                      className="btn secondary"
                      style={{ padding: '5px 10px', fontSize: 12.5 }}
                      onClick={() => setEditingId(null)}
                    >
                      ຍົກເລີກ
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td className="num">{formatKip(p.cost)}</td>
                  <td className="num">{formatKip(p.price)}</td>
                  <td className="num">
                    {p.stock} {p.unit}
                  </td>
                  <td>{p.location}</td>
                  <td>{statusTag(p.status)}</td>
                  <td>
                    <button
                      className="btn secondary"
                      style={{ padding: '5px 10px', fontSize: 12.5 }}
                      onClick={() => startEdit(p)}
                    >
                      ແກ້ໄຂ
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}

      {toast && <div className={`toast${toast.type === 'error' ? ' error' : ''}`}>{toast.text}</div>}
    </>
  );
}
