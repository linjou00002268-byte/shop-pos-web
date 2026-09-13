// app/page.js
'use client';

import { useEffect, useRef, useState } from 'react';

const MONTH_LABELS = ['ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ', 'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'];

export default function DashboardPage() {
  const [dashData, setDashData] = useState(null);
  const [filterType, setFilterType] = useState('year');
  const [filterDate, setFilterDate] = useState('');
  const [computed, setComputed] = useState(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const chartLibRef = useRef(null);

  // ໂຫຼດຂໍ້ມູນຄັ້ງທຳອິດ (ຄື initDashboard)
  useEffect(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISODate = new Date(now - offset).toISOString().split('T')[0];
    setFilterDate(localISODate);

    fetch('/api/reports/dashboard')
      .then((res) => res.json())
      .then((json) => setDashData(json));

    // ໂຫຼດ Chart.js + plugin ແບບ dynamic (client-only)
    Promise.all([import('chart.js/auto'), import('chartjs-plugin-datalabels')]).then(
      ([chartModule, datalabelsModule]) => {
        chartLibRef.current = { Chart: chartModule.default, datalabels: datalabelsModule.default };
      }
    );
  }, []);

  // ຄື processDashboardData — ຄິດໄລ່ຄືນທຸກຄັ້ງທີ່ຂໍ້ມູນ ຫຼື filter ປ່ຽນ
  useEffect(() => {
    if (!dashData) return;

    const dateVal = filterDate;
    let fYear = 0, fMonth = 0, fDay = 0;
    if (dateVal) {
      const [y, m, d] = dateVal.split('-').map(Number);
      fYear = y; fMonth = m; fDay = d;
    } else {
      const now = new Date();
      fYear = now.getFullYear(); fMonth = now.getMonth() + 1; fDay = now.getDate();
    }

    const rows = dashData.sales || [];
    const filteredSales = rows.filter((row) => {
      const dateStr = row.sales?.created_at;
      if (!dateStr) return false;
      const sDate = new Date(dateStr);
      if (isNaN(sDate.getTime())) return false;
      if (filterType === 'all') return true;
      if (filterType === 'year') return sDate.getFullYear() === fYear;
      if (filterType === 'month') return sDate.getFullYear() === fYear && sDate.getMonth() + 1 === fMonth;
      if (filterType === 'day') return sDate.getFullYear() === fYear && sDate.getMonth() + 1 === fMonth && sDate.getDate() === fDay;
      return false;
    });

    let totalSales = 0, totalCost = 0, totalProfit = 0;
    const productSaleStats = {};
    filteredSales.forEach((row) => {
      const qty = Number(row.qty) || 0;
      const cost = Number(row.total_cost) || 0;
      const revenue = Number(row.total_price) || 0;
      const profit = Number(row.profit) || 0;
      totalSales += revenue;
      totalCost += cost;
      totalProfit += profit;
      const pId = row.product_id;
      if (!productSaleStats[pId]) {
        productSaleStats[pId] = { name: row.product_name, category: row.category || 'ທົ່ວໄປ', qty: 0, revenue: 0 };
      }
      productSaleStats[pId].qty += qty;
      productSaleStats[pId].revenue += revenue;
    });

    let labels = [], revenueData = [], profitData = [], chartTitleText = '';

    if (filterType === 'all') {
      chartTitleText = 'ສະຖິຕິຍອດຂາຍ ແລະ ກຳໄລ (ລາຍປີ)';
      const yearMap = {};
      rows.forEach((row) => {
        const dateStr = row.sales?.created_at;
        if (!dateStr) return;
        const sDate = new Date(dateStr);
        if (isNaN(sDate.getTime())) return;
        const yr = sDate.getFullYear();
        if (!yearMap[yr]) yearMap[yr] = { rev: 0, prof: 0 };
        yearMap[yr].rev += Number(row.total_price) || 0;
        yearMap[yr].prof += Number(row.profit) || 0;
      });
      let sortedYears = Object.keys(yearMap).sort();
      if (sortedYears.length === 0) sortedYears = [String(fYear)];
      sortedYears.forEach((yr) => {
        labels.push('ປີ ' + yr);
        revenueData.push(yearMap[yr] ? yearMap[yr].rev : 0);
        profitData.push(yearMap[yr] ? yearMap[yr].prof : 0);
      });
    } else if (filterType === 'year') {
      chartTitleText = `ສະຖິຕິຍອດຂາຍ ແລະ ກຳໄລ ປີ ${fYear} (ລາຍເດືອນ)`;
      labels = MONTH_LABELS;
      revenueData = new Array(12).fill(0);
      profitData = new Array(12).fill(0);
      filteredSales.forEach((row) => {
        const sDate = new Date(row.sales.created_at);
        const mIdx = sDate.getMonth();
        revenueData[mIdx] += Number(row.total_price) || 0;
        profitData[mIdx] += Number(row.profit) || 0;
      });
    } else if (filterType === 'month') {
      chartTitleText = `ສະຖິຕິຍອດຂາຍ ແລະ ກຳໄລ ເດືອນ ${fMonth}/${fYear} (ລາຍວັນ)`;
      const daysInMonth = new Date(fYear, fMonth, 0).getDate();
      revenueData = new Array(daysInMonth).fill(0);
      profitData = new Array(daysInMonth).fill(0);
      for (let d = 1; d <= daysInMonth; d++) labels.push('ວັນທີ ' + d);
      filteredSales.forEach((row) => {
        const sDate = new Date(row.sales.created_at);
        const dayIdx = sDate.getDate() - 1;
        if (dayIdx >= 0 && dayIdx < daysInMonth) {
          revenueData[dayIdx] += Number(row.total_price) || 0;
          profitData[dayIdx] += Number(row.profit) || 0;
        }
      });
    } else if (filterType === 'day') {
      chartTitleText = `ສະຖິຕິຍອດຂາຍ ແລະ ກຳໄລ ວັນທີ ${fDay}/${fMonth}/${fYear} (ລາຍຊົ່ວໂມງ)`;
      revenueData = new Array(24).fill(0);
      profitData = new Array(24).fill(0);
      for (let h = 0; h < 24; h++) labels.push((h < 10 ? '0' + h : h) + ':00');
      filteredSales.forEach((row) => {
        const sDate = new Date(row.sales.created_at);
        const hourIdx = sDate.getHours();
        revenueData[hourIdx] += Number(row.total_price) || 0;
        profitData[hourIdx] += Number(row.profit) || 0;
      });
    }

    const bestSellers = Object.values(productSaleStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    setComputed({
      totalSales, totalCost, totalProfit,
      totalSKUs: dashData.totalSKUs || 0,
      totalStockValue: dashData.totalStockValue || 0,
      labels, revenueData, profitData, chartTitleText,
      bestSellers,
      lowStock: dashData.lowStock || [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashData, filterType, filterDate]);

  // Render Chart.js ຄື renderDynamicChart
  useEffect(() => {
    if (!computed || !canvasRef.current || !chartLibRef.current) return;
    const { Chart, datalabels } = chartLibRef.current;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current.getContext('2d'), {
      type: 'bar',
      plugins: [datalabels],
      data: {
        labels: computed.labels,
        datasets: [
          { label: 'ຍອດຂາຍລວມ (Revenue)', data: computed.revenueData, backgroundColor: 'rgba(54, 162, 235, 0.75)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1, borderRadius: 4 },
          { label: 'ກຳໄລສຸດທິ (Net Profit)', data: computed.profitData, backgroundColor: 'rgba(40, 167, 69, 0.75)', borderColor: 'rgba(40, 167, 69, 1)', borderWidth: 1, borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 25 } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (v) => v.toLocaleString() + ' LAK' } },
          x: { ticks: { font: { size: 10 } } },
        },
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'top',
            formatter: (val) => (val > 0 ? val.toLocaleString() : ''),
            font: { size: 9 },
          },
        },
      },
    });
  }, [computed]);

  const dateDisabled = filterType === 'all' || filterType === 'year';

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="m-0 fw-bold"><i className="fa-solid fa-chart-pie text-primary me-2"></i> ເດດບອດສະຫຼຸບຂໍ້ມູນ (Dashboard)</h3>
          <small className="text-muted">ສະຫຼຸບຍອດຂາຍ, ກຳໄລ ແລະ ສະຖານະຄັງສິນຄ້າແບບ Realtime</small>
        </div>
        <div className="card shadow-sm border-0 p-2 bg-white">
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <select className="form-select form-select-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">📅 ທັງໝົດ</option>
                <option value="day">📅 ລາຍວັນ</option>
                <option value="month">📅 ລາຍເດືອນ</option>
                <option value="year">📅 ປີນີ້</option>
              </select>
            </div>
            <div className="col-auto">
              <input type="date" className="form-control form-control-sm" value={filterDate} disabled={dateDisabled}
                onChange={(e) => setFilterDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card bg-primary text-white p-3 shadow-sm border-0 position-relative overflow-hidden">
            <div className="position-absolute end-0 bottom-0 opacity-10 m-3"><i className="fa-solid fa-money-bill-trend-up fa-4x"></i></div>
            <small className="text-white-50">ຍອດຂາຍລວມ</small>
            <h2 className="fw-bold my-1">{(computed?.totalSales || 0).toLocaleString()} LAK</h2>
            <small className="text-white-50">ຕາມໄລຍະເວລາທີ່ເລືອກ</small>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card bg-secondary text-white p-3 shadow-sm border-0 position-relative overflow-hidden">
            <div className="position-absolute end-0 bottom-0 opacity-10 m-3"><i className="fa-solid fa-calculator fa-4x"></i></div>
            <small className="text-white-50">ຕົ້ນທຶນສິນຄ້າທີ່ຂາຍ</small>
            <h2 className="fw-bold my-1">{(computed?.totalCost || 0).toLocaleString()} LAK</h2>
            <small className="text-white-50">ຕົ້ນທຶນຂອງສິນຄ້າທີ່ອອກໄປ</small>
          </div>
        </div>
        <div className="col-12 col-md-12 col-xl-4">
          <div className="card bg-success text-white p-3 shadow-sm border-0 position-relative overflow-hidden">
            <div className="position-absolute end-0 bottom-0 opacity-10 m-3"><i className="fa-solid fa-coins fa-4x"></i></div>
            <small className="text-white-50">ກຳໄລສຸດທິ</small>
            <h2 className="fw-bold my-1">{(computed?.totalProfit || 0).toLocaleString()} LAK</h2>
            <small className="text-white-50">ລາຍຮັບ ຫັກ ຕົ້ນທຶນ</small>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6">
          <div className="card bg-white border-start border-primary border-4 p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted fw-bold">ຈຳນວນລາຍການສິນຄ້າທັງໝົດ</small>
                <h3 className="fw-bold text-primary my-1">{(computed?.totalSKUs || 0).toLocaleString()} ລາຍການ</h3>
              </div>
              <div className="bg-primary-subtle text-primary p-3 rounded-circle"><i className="fa-solid fa-boxes-stacked fa-lg"></i></div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6">
          <div className="card bg-white border-start border-warning border-4 p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted fw-bold">ມູນຄ່າສິນຄ້າຄັງເຫຼືອທັງໝົດ (ທຶນ)</small>
                <h3 className="fw-bold text-warning my-1">{(computed?.totalStockValue || 0).toLocaleString()} LAK</h3>
              </div>
              <div className="bg-warning-subtle text-warning p-3 rounded-circle"><i className="fa-solid fa-vault fa-lg"></i></div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card shadow-sm p-3">
            <h5 className="fw-bold text-dark mb-3">
              <i className="fa-solid fa-chart-bar text-info me-2"></i> {computed?.chartTitleText || 'ສະຖິຕິຍອດຂາຍ ແລະ ກຳໄລ'}
            </h5>
            <div style={{ position: 'relative', height: 350, width: '100%' }}>
              <canvas ref={canvasRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white border-0 py-3 d-flex align-items-center">
              <h5 className="m-0 fw-bold text-dark"><i className="fa-solid fa-star text-warning me-2"></i> 10 ອັນດັບສິນຄ້າຂາຍດີ</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }} className="text-center">ອັນດັບ</th>
                      <th>ຊື່ສິນຄ້າ</th>
                      <th>ໝວດໝູ່</th>
                      <th className="text-end">ຈຳນວນທີ່ຂາຍ</th>
                      <th className="text-end">ຍອດຂາຍລວມ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!computed || computed.bestSellers.length === 0 ? (
                      <tr><td colSpan={5} className="text-center text-muted py-4">❌ ບໍ່ມີຂໍ້ມູນການຂາຍໃນຊ່ວງເວລານີ້</td></tr>
                    ) : (
                      computed.bestSellers.map((item, i) => (
                        <tr key={i}>
                          <td className="text-center fw-bold"><span className="badge bg-primary rounded-pill">{i + 1}</span></td>
                          <td><strong>{item.name}</strong></td>
                          <td><span className="badge bg-secondary">{item.category}</span></td>
                          <td className="text-end fw-bold text-success">{item.qty.toLocaleString()}</td>
                          <td className="text-end">{item.revenue.toLocaleString()} LAK</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card shadow-sm border-danger h-100">
            <div className="card-header bg-danger text-white py-3 d-flex justify-content-between align-items-center">
              <span className="fw-bold"><i className="fa-solid fa-triangle-exclamation me-2"></i> ສິນຄ້າໃກ້ໝົດຄັງ (Low Stock)</span>
              <span className="badge bg-white text-danger">{computed?.lowStock.length || 0}</span>
            </div>
            <div className="card-body p-0" style={{ maxHeight: 350, overflowY: 'auto' }}>
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0">
                  <thead className="table-light">
                    <tr><th>ຊື່ສິນຄ້າ</th><th className="text-center">ຄັງເຫຼືອ</th><th className="text-center">ຈຸດເຕືອນ</th></tr>
                  </thead>
                  <tbody>
                    {!computed || computed.lowStock.length === 0 ? (
                      <tr><td colSpan={3} className="text-center text-success fw-bold py-4">🎉 ບໍ່ມີສິນຄ້າໃກ້ໝົດຄັງ</td></tr>
                    ) : (
                      computed.lowStock.map((p) => (
                        <tr key={p.id} className="table-warning">
                          <td><strong>{p.name}</strong><br /><small className="text-muted">ID: {p.id}</small></td>
                          <td className="text-center text-danger fw-bold">{p.stock}</td>
                          <td className="text-center text-muted">{p.reorder_point}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
