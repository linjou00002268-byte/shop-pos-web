// app/low-stock/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LowStockPage() {
  const [items, setItems] = useState([]);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(true);

  function load(l) {
    setLoading(true);
    fetch(`/api/products/low-stock?limit=${l}`)
      .then((res) => res.json())
      .then((json) => setItems(Array.isArray(json) ? json : []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">ສິນຄ້າໃກ້ໝົດຄັງ</h1>
          <p className="page-subtitle">ລາຍການສິນຄ້າທີ່ຄົງເຫຼືອຢູ່ ຫຼື ຕ່ຳກວ່າຄ່າທີ່ກຳນົດ</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13.5, color: 'var(--muted)' }}>ຄົງເຫຼືອຕ່ຳກວ່າ</label>
          <input
            type="number"
            min="1"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ width: 70, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6 }}
          />
          <button className="btn secondary" onClick={() => load(limit)}>
            ອັບເດດ
          </button>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">ກຳລັງໂຫຼດ...</p>
      ) : items.length === 0 ? (
        <p className="empty-state">ບໍ່ມີສິນຄ້າໃກ້ໝົດຄັງ 🎉</p>
      ) : (
        <table className="ledger-table">
          <thead>
            <tr>
              <th>ລະຫັດ</th>
              <th>ຊື່</th>
              <th>ໝວດໝູ່</th>
              <th className="num">ຄົງເຫຼືອ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.barcode}>
                <td>{p.barcode}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td className="num">
                  <span className="tag danger">
                    {p.stock} {p.unit}
                  </span>
                </td>
                <td>
                  <Link href="/receive" className="btn secondary" style={{ padding: '5px 10px', fontSize: 12.5 }}>
                    ຮັບເຂົ້າຄັງ →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
