// app/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatKip, formatDate } from '@/lib/format';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/reports/dashboard')
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <p className="empty-state">ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໄດ້: {error}</p>;
  }

  if (!data) {
    return <p className="empty-state">ກຳລັງໂຫຼດ...</p>;
  }

  // ຄິດໄລ່ຍອດຂາຍລວມຈາກ sale_items (ບໍ່ຮວມການຂາຍທີ່ຊ້ຳ sale_id)
  const seenSales = new Set();
  let totalSalesValue = 0;
  let totalProfit = 0;
  for (const item of data.sales) {
    totalSalesValue += Number(item.total_price);
    totalProfit += Number(item.profit);
    seenSales.add(item.sale_id);
  }
  const recentItems = data.sales.slice(0, 8);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">ພາບລວມຂອງຮ້ານ ຄັງສິນຄ້າ ແລະ ຍອດຂາຍ</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-cell">
          <div className="label">ຈຳນວນລາຍການສິນຄ້າ</div>
          <div className="value">{data.totalSKUs}</div>
        </div>
        <div className="stat-cell">
          <div className="label">ມູນຄ່າສະຕັອກລວມ</div>
          <div className="value">{formatKip(data.totalStockValue)}</div>
        </div>
        <div className="stat-cell">
          <div className="label">ຈຳນວນໃບບິນ</div>
          <div className="value">{seenSales.size}</div>
        </div>
        <div className="stat-cell">
          <div className="label">ຍອດຂາຍລວມ</div>
          <div className="value success">{formatKip(totalSalesValue)}</div>
        </div>
        <div className="stat-cell">
          <div className="label">ກຳໄລລວມ</div>
          <div className="value success">{formatKip(totalProfit)}</div>
        </div>
        <div className="stat-cell">
          <div className="label">ສິນຄ້າໃກ້ໝົດ</div>
          <div className="value danger">{data.lowStock.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
        <div>
          <h2 className="section-title">ລາຍການຂາຍຫຼ້າສຸດ</h2>
          {recentItems.length === 0 ? (
            <p className="empty-state">ຍັງບໍ່ມີການຂາຍ</p>
          ) : (
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>ສິນຄ້າ</th>
                  <th>ຈຳນວນ</th>
                  <th className="num">ຍອດ</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item, i) => (
                  <tr key={i}>
                    <td>{item.product_name}</td>
                    <td>{item.qty}</td>
                    <td className="num">{formatKip(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <h2 className="section-title">ສິນຄ້າໃກ້ໝົດຄັງ</h2>
          {data.lowStock.length === 0 ? (
            <p className="empty-state">ບໍ່ມີສິນຄ້າໃກ້ໝົດ 🎉</p>
          ) : (
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>ສິນຄ້າ</th>
                  <th className="num">ເຫຼືອ</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.slice(0, 8).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="num">
                      {p.stock} {p.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 14 }}>
            <Link href="/low-stock" className="btn secondary">
              ເບິ່ງທັງໝົດ →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
