// app/pos/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatKip } from '@/lib/format';

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]); // [{id, name, price, qty, stock}]
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  function loadProducts() {
    setLoading(true);
    fetch('/api/products')
      .then((res) => res.json())
      .then((json) => setProducts(json.products || []))
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
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [products, search]);

  function addToCart(product) {
    if (product.stock <= 0) {
      setToast({ type: 'error', text: `${product.name} ໝົດຄັງແລ້ວ` });
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          setToast({ type: 'error', text: `ສະຕັອກ ${product.name} ບໍ່ພຽງພໍ` });
          return prev;
        }
        return prev.map((c) =>
          c.id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [
        ...prev,
        { id: product.id, name: product.name, price: product.price, qty: 1, stock: product.stock },
      ];
    });
  }

  function updateQty(id, qty) {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: Math.max(0, qty) } : c))
        .filter((c) => c.qty > 0)
    );
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  async function checkout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: cart.map((c) => ({ id: c.id, qty: c.qty, price: c.price })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ type: 'error', text: json.error || 'ບັນທຶກການຂາຍບໍ່ສຳເລັດ' });
        return;
      }
      setToast({ type: 'success', text: `ຂາຍສຳເລັດ — ໃບບິນ ${json.saleCode}` });
      setCart([]);
      loadProducts();
    } catch (e) {
      setToast({ type: 'error', text: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">ຂາຍເຄື່ອງ (POS)</h1>
          <p className="page-subtitle">ຄົ້ນຫາສິນຄ້າ ເພີ່ມໃສ່ກະຕ່າ ແລ້ວກົດຢືນຢັນການຂາຍ</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 28 }}>
        {/* ລາຍການສິນຄ້າ */}
        <div>
          <div className="field">
            <input
              placeholder="ຄົ້ນຫາຊື່ ຫຼື ລະຫັດສິນຄ້າ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="empty-state">ກຳລັງໂຫຼດສິນຄ້າ...</p>
          ) : filtered.length === 0 ? (
            <p className="empty-state">ບໍ່ພົບສິນຄ້າ</p>
          ) : (
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>ສິນຄ້າ</th>
                  <th className="num">ລາຄາ</th>
                  <th className="num">ຄົງເຫຼືອ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="num">{formatKip(p.price)}</td>
                    <td className="num">
                      {p.stock} {p.unit}
                    </td>
                    <td>
                      <button
                        className="btn secondary"
                        onClick={() => addToCart(p)}
                        disabled={p.stock <= 0}
                      >
                        + ໃສ່ກະຕ່າ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ກະຕ່າ */}
        <div className="card" style={{ position: 'sticky', top: 20, height: 'fit-content' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>ກະຕ່າ</h2>
          {cart.length === 0 ? (
            <p className="empty-state">ຍັງບໍ່ມີສິນຄ້າໃນກະຕ່າ</p>
          ) : (
            <>
              {cart.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                      {formatKip(c.price)} / ອັນ
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min="0"
                      max={c.stock}
                      value={c.qty}
                      onChange={(e) => updateQty(c.id, Number(e.target.value))}
                      style={{
                        width: 52,
                        padding: '5px 6px',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        fontFamily: 'Inter, sans-serif',
                        textAlign: 'center',
                      }}
                    />
                    <button
                      onClick={() => removeFromCart(c.id)}
                      className="btn secondary"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                    >
                      ລຶບ
                    </button>
                  </div>
                </div>
              ))}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '16px 0 4px',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                <span>ລວມທັງໝົດ</span>
                <span style={{ fontFamily: 'Inter, sans-serif' }}>{formatKip(total)}</span>
              </div>
            </>
          )}

          <button
            className="btn"
            style={{ width: '100%', marginTop: 12 }}
            disabled={cart.length === 0 || submitting}
            onClick={checkout}
          >
            {submitting ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນການຂາຍ'}
          </button>
        </div>
      </div>

      {toast && <div className={`toast${toast.type === 'error' ? ' error' : ''}`}>{toast.text}</div>}
    </>
  );
}
