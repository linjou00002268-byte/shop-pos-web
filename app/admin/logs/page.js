// app/admin/logs/page.js
'use client';

import { useEffect, useState } from 'react';

function fmtDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    setLogs(null);
    fetch('/api/admin/logs')
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setLogs(json.logs || []);
      });
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0 fw-bold text-dark">
            <i className="fa-solid fa-bug text-danger me-2"></i> ບັນທຶກຂໍ້ຜິດພາດລະບົບ (Error Logs)
          </h4>
          <button className="btn btn-sm btn-primary fw-bold" onClick={load}>
            <i className="fa-solid fa-rotate me-1"></i> ໂຫຼດໃໝ່
          </button>
        </div>

        {error && (
          <div className="alert alert-warning small">
            ບໍ່ສາມາດໂຫຼດ log ໄດ້: {error} — ອາດຍັງບໍ່ໄດ້ສ້າງ table <code>error_logs</code> (ເບິ່ງໄຟລ໌ <code>error_logs.sql</code>)
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle small">
            <thead className="table-light">
              <tr>
                <th>ເວລາ</th>
                <th>ບ່ອນເກີດ</th>
                <th>ຂໍ້ຄວາມ</th>
                <th>ລາຍລະອຽດເພີ່ມ</th>
              </tr>
            </thead>
            <tbody>
              {logs === null ? (
                <tr><td colSpan={4} className="text-center text-muted py-4">ກຳລັງໂຫຼດ...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-success fw-bold py-4">🎉 ບໍ່ມີ error ບັນທຶກໄວ້</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-nowrap text-secondary">{fmtDate(log.created_at)}</td>
                    <td><span className="badge bg-dark">{log.source}</span></td>
                    <td className="text-danger">{log.message}</td>
                    <td>
                      <code style={{ fontSize: 11 }}>
                        {log.context ? JSON.stringify(log.context) : '-'}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
