// app/receive/page.js
'use client';

import { useEffect, useState } from 'react';

const emptyReceive = { productId: '', qty: '', location: '', cost: '', price: '', unit: '' };
const emptyNewProduct = {
  id: '', name: '', category: '', cost: '', price: '', stock: '', location: '', reorder: '', unit: '',
};

export default function ReceivePage() {
  const [products, setProducts] = useState([]);
  const [receiveForm, setReceiveForm] = useState(emptyReceive);
  const [newProductForm, setNewProductForm] = useState(emptyNewProduct);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function loadProducts() {
    fetch('/api/products')
      .then((res) => res.json())
      .then((json) => setProducts(json.products || []));
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleReceive(e) {
    e.preventDefault();
    if (!receiveForm.productId || !receiveForm.qty) {
      setToast({ type: 'error', text: 'ຕ້ອງເລືອກສິນຄ້າ ແລະ ໃສ່ຈຳນວນ' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/stock/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: receiveForm.productId,
          qty: Number(receiveForm.qty),
          location: receiveForm.location || undefined,
          cost: receiveForm.cost ? Number(receiveForm.cost) : undefined,
          price: receiveForm.price ? Number(receiveForm.price) : undefined,
          unit: receiveForm.unit || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ type: 'error', text: json.error });
        return;
      }
      setToast({ type: 'success', text: `ຮັບເຂົ້າຄັງສຳເລັດ — ຄົງເຫຼືອ ${json.newStock}` });
      setReceiveForm(emptyReceive);
      loadProducts();
    } catch (err) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNewProduct(e) {
    e.preventDefault();
    if (!newProductForm.id || !newProductForm.name) {
      setToast({ type: 'error', text: 'ຕ້ອງໃສ່ລະຫັດ ແລະ ຊື່ສິນຄ້າ' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductForm),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ type: 'error', text: json.error });
        return;
      }
      setToast({ type: 'success', text: `ເພີ່ມສິນຄ້າ "${newProductForm.name}" ສຳເລັດ` });
      setNewProductForm(emptyNewProduct);
      loadProducts();
    } catch (err) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">ຮັບເຂົ້າຄັງ</h1>
          <p className="page-subtitle">ຮັບສິນຄ້າເພີ່ມເຂົ້າຄັງ ຫຼື ເພີ່ມສິນຄ້າໃໝ່ເຂົ້າລະບົບ</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* ຮັບເຂົ້າຄັງ — ສິນຄ້າທີ່ມີຢູ່ແລ້ວ */}
        <form className="card" onSubmit={handleReceive}>
          <h2 className="section-title" style={{ marginTop: 0 }}>ຮັບເຂົ້າຄັງ (ສິນຄ້າເກົ່າ)</h2>

          <div className="field">
            <label>ສິນຄ້າ</label>
            <select
              value={receiveForm.productId}
              onChange={(e) => setReceiveForm({ ...receiveForm, productId: e.target.value })}
            >
              <option value="">-- ເລືອກສິນຄ້າ --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) — ຄົງເຫຼືອ {p.stock}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>ຈຳນວນທີ່ຮັບເຂົ້າ</label>
            <input
              type="number"
              min="1"
              value={receiveForm.qty}
              onChange={(e) => setReceiveForm({ ...receiveForm, qty: e.target.value })}
            />
          </div>

          <div className="field">
            <label>ບ່ອນເກັບ</label>
            <input
              value={receiveForm.location}
              onChange={(e) => setReceiveForm({ ...receiveForm, location: e.target.value })}
              placeholder="ຄັງ A"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>ລາຄາທຶນໃໝ່ (ບໍ່ບັງຄັບ)</label>
              <input
                type="number"
                value={receiveForm.cost}
                onChange={(e) => setReceiveForm({ ...receiveForm, cost: e.target.value })}
              />
            </div>
            <div className="field">
              <label>ລາຄາຂາຍໃໝ່ (ບໍ່ບັງຄັບ)</label>
              <input
                type="number"
                value={receiveForm.price}
                onChange={(e) => setReceiveForm({ ...receiveForm, price: e.target.value })}
              />
            </div>
          </div>

          <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນຮັບເຂົ້າຄັງ'}
          </button>
        </form>

        {/* ເພີ່ມສິນຄ້າໃໝ່ */}
        <form className="card" onSubmit={handleNewProduct}>
          <h2 className="section-title" style={{ marginTop: 0 }}>ເພີ່ມສິນຄ້າໃໝ່</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>ລະຫັດສິນຄ້າ</label>
              <input
                value={newProductForm.id}
                onChange={(e) => setNewProductForm({ ...newProductForm, id: e.target.value })}
                placeholder="P001"
              />
            </div>
            <div className="field">
              <label>ຊື່ສິນຄ້າ</label>
              <input
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>ໝວດໝູ່</label>
              <input
                value={newProductForm.category}
                onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
              />
            </div>
            <div className="field">
              <label>ຫົວໜ່ວຍ</label>
              <input
                value={newProductForm.unit}
                onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value })}
                placeholder="ອັນ / ແກ້ວ / ກ."
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>ລາຄາທຶນ</label>
              <input
                type="number"
                value={newProductForm.cost}
                onChange={(e) => setNewProductForm({ ...newProductForm, cost: e.target.value })}
              />
            </div>
            <div className="field">
              <label>ລາຄາຂາຍ</label>
              <input
                type="number"
                value={newProductForm.price}
                onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>ສະຕັອກເລີ່ມຕົ້ນ</label>
              <input
                type="number"
                value={newProductForm.stock}
                onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
              />
            </div>
            <div className="field">
              <label>ຈຸດສັ່ງເພີ່ມ (Reorder)</label>
              <input
                type="number"
                value={newProductForm.reorder}
                onChange={(e) => setNewProductForm({ ...newProductForm, reorder: e.target.value })}
                placeholder="5"
              />
            </div>
          </div>

          <div className="field">
            <label>ບ່ອນເກັບ</label>
            <input
              value={newProductForm.location}
              onChange={(e) => setNewProductForm({ ...newProductForm, location: e.target.value })}
            />
          </div>

          <button className="btn" type="submit" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'ກຳລັງບັນທຶກ...' : 'ເພີ່ມສິນຄ້າ'}
          </button>
        </form>
      </div>

      {toast && <div className={`toast${toast.type === 'error' ? ' error' : ''}`}>{toast.text}</div>}
    </>
  );
}
