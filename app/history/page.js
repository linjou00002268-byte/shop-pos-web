// app/history/page.js
'use client';

import { Fragment, useEffect, useState } from 'react';
import { formatKip, formatDate } from '@/lib/format';

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch('/api/sales')
      .then((res) => res.json())
      .then((json) => {
        setSales(json.sales || []);
        setSummary(json.summary || { totalSales: 0, totalOrders: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">ປະຫວັດການຂາຍ</h1>
          <p className="page-subtitle">ລາຍການໃບບິນຂາຍທັງໝົດ ຮຽງຕາມເວລາຫຼ້າສຸດ</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-cell">
          <div className="label">ຈຳນວນໃບບິນ</div>
          <div className="value">{summary.totalOrders}</div>
        </div>
        <div className="stat-cell">
          <div className="label">ຍອດຂາຍລວມ</div>
          <div className="value success">{formatKip(summary.totalSales)}</div>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">ກຳລັງໂຫຼດ...</p>
      ) : sales.length === 0 ? (
        <p className="empty-state">ຍັງບໍ່ມີການຂາຍ</p>
      ) : (
        <table className="ledger-table">
          <thead>
            <tr>
              <th>ໃບບິນ</th>
              <th>ວັນ-ເວລາ</th>
              <th>ຈຳນວນລາຍການ</th>
              <th className="num">ຍອດລວມ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <Fragment key={sale.id}>
                <tr>
                  <td>{sale.sale_code}</td>
                  <td>{formatDate(sale.created_at)}</td>
                  <td>{sale.sale_items?.length || 0}</td>
                  <td className="num">{formatKip(sale.total_price)}</td>
                  <td>
                    <button
                      className="btn secondary"
                      style={{ padding: '4px 10px', fontSize: 12.5 }}
                      onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                    >
                      {expanded === sale.id ? 'ເຊື່ອງ' : 'ລາຍລະອຽດ'}
                    </button>
                  </td>
                </tr>
                {expanded === sale.id && (
                  <tr>
                    <td colSpan={5} style={{ background: 'rgba(31,58,61,0.03)', padding: '10px 20px' }}>
                      {sale.sale_items.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 13.5,
                            padding: '4px 0',
                          }}
                        >
                          <span>{item.product_name} × {item.qty}</span>
                          <span style={{ fontFamily: 'Inter, sans-serif' }}>
                            {formatKip(item.total_price)}
                          </span>
                        </div>
                      ))}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
