// app/pos/page.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { useBranch } from '@/lib/BranchContext';

export default function PosPage() {
  const { selectedBranchId } = useBranch() || {};
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [cart, setCart] = useState([]);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [paperWidth, setPaperWidth] = useState('58'); // '58' ຫຼື '80' (mm) — ຂະໜາດເຈ້ຍເຄື່ອງພິມບິນ
  const [showModal, setShowModal] = useState(false);
  const [cashStr, setCashStr] = useState('');
  const [confirming, setConfirming] = useState(false);
  const scanRef = useRef(null);
  const swalRef = useRef(null);
  const printRef = useRef(null);

  useEffect(() => {
    import('sweetalert2').then((m) => (swalRef.current = m.default));
  }, []);

  useEffect(() => {
    if (selectedBranchId) loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  function loadProducts() {
    fetch(`/api/products?branch_id=${selectedBranchId}`)
      .then((res) => res.json())
      .then((json) => {
        const rows = json.products || [];
        setAllProducts(rows);
        randomizeSuggestions(rows);
        focusScan();
      });
  }

  function randomizeSuggestions(rows) {
    const source = rows || allProducts;
    const shuffled = [...source].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 12));
  }

  function focusScan() {
    setTimeout(() => scanRef.current?.focus(), 50);
  }

  const grandTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  function addToCart(product) {
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        return prev.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1, stock: product.stock }];
    });
  }

  function handleScan(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const val = e.target.value.trim();
    if (!val) return;
    const found = allProducts.find((p) => p.id.toLowerCase() === val.toLowerCase());
    if (found) {
      addToCart(found);
      e.target.value = '';
    } else {
      swalRef.current?.fire({ icon: 'warning', title: 'ບໍ່ພົບສິນຄ້າ', text: 'ບໍ່ພົບລະຫັດສິນຄ້ານີ້', confirmButtonText: 'ຕົກລົງ' });
      e.target.value = '';
    }
  }

  function updateQty(id, qty) {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.max(1, qty) } : c)));
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  function clearCart() {
    if (cart.length === 0) return;
    swalRef.current
      ?.fire({
        title: 'ຢືນຢັນການຍົກເລີກ?',
        text: 'ທ່ານຕ້ອງການຍົກເລີກການຂາຍທັງໝົດ ຫຼື ບໍ່?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ຍົກເລີກການຂາຍ',
        cancelButtonText: 'ກັບຄືນ',
        reverseButtons: true,
      })
      .then((result) => {
        if (result.isConfirmed) {
          setCart([]);
          swalRef.current.fire({ icon: 'success', title: 'ຍົກເລີກການຂາຍຮຽບຮ້ອຍ', showConfirmButton: false, timer: 1200 });
          focusScan();
        }
      });
  }

  function openCheckout() {
    if (cart.length === 0) return;
    setCashStr('');
    setShowModal(true);
  }

  function pressNum(num) {
    setCashStr((prev) => {
      if (num === 'C') return '';
      if (prev === '' && (num === '0' || num === '00')) return prev;
      return prev + num;
    });
  }

  function appendQuickCash(amount) {
    setCashStr((prev) => String((Number(prev) || 0) + amount));
  }

  const cashAmount = Number(cashStr) || 0;
  const change = cashAmount - grandTotal;

  async function submitSale() {
    if (cashAmount < grandTotal) {
      swalRef.current?.fire({ icon: 'warning', title: 'ເງິນສົດບໍ່ພຽງພໍ', text: 'ຈຳນວນເງິນສົດທີ່ຮັບມາບໍ່ພຽງພໍກັບຍອດຊຳລະ', confirmButtonText: 'ຕົກລົງ' });
      return;
    }
    setConfirming(true);
    const cartCopy = [...cart];
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: selectedBranchId, cart: cart.map((c) => ({ id: c.id, qty: c.qty, price: c.price })) }),
      });
      const json = await res.json();
      if (!res.ok) {
        swalRef.current?.fire({ icon: 'error', title: 'ເກີດຂໍ້ຜິດພາດ!', text: json.error || 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ', confirmButtonText: 'ຕົກລົງ' });
        return;
      }
      swalRef.current?.fire({ icon: 'success', title: 'ບັນທຶກການຂາຍຮຽບຮ້ອຍ!', showConfirmButton: false, timer: 1500 });
      if (printReceipt) executePrint(cartCopy, cashAmount);
      setShowModal(false);
      setCart([]);
      loadProducts();
    } catch (err) {
      swalRef.current?.fire({ icon: 'error', title: 'Error', text: err.message });
    } finally {
      setConfirming(false);
      focusScan();
    }
  }

  function executePrint(printCart, cash) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
    const changeAmount = Math.max(0, cash - grandTotal);
    // ຄວາມກວ້າງເຈ້ຍ: 58mm ≈ 200px, 80mm ≈ 280px (ອີງຕາມມາດຕະຖານເຄື່ອງພິມບິນທົ່ວໄປ)
    const widthPx = paperWidth === '80' ? 280 : 200;
    const fontSize = paperWidth === '80' ? 12 : 10.5;
    let html = `<div style="font-family:'Saysettha OT', sans-serif; width:${widthPx}px; padding:8px; margin:0 auto; color:#000; font-size:${fontSize}px;">
      <div style="text-align:center; font-weight:bold; font-size:${fontSize + 4}px;">ໃບບິນຮັບເງິນ</div>
      <div style="text-align:center; font-size:${fontSize - 1}px; margin-bottom:8px;">My Shop POS</div>
      <div style="font-size:${fontSize - 1}px; border-bottom:1px dashed #000; padding-bottom:4px;">ວັນທີ: ${dateStr}</div>
      <table style="width:100%; font-size:${fontSize - 1}px; margin-top:4px; border-collapse:collapse;">`;
    printCart.forEach((item) => {
      const sum = item.price * item.qty;
      html += `<tr><td style="padding:3px 0;">${item.name}<br><small>${item.qty} x ${item.price.toLocaleString()}</small></td><td style="text-align:right; vertical-align:bottom;">${sum.toLocaleString()}</td></tr>`;
    });
    html += `</table>
      <div style="border-top:1px dashed #000; margin-top:5px; padding-top:5px; font-weight:bold;">
        <div style="display:flex; justify-content:space-between;"><span>ລວມທັງໝົດ:</span><span>${grandTotal.toLocaleString()} LAK</span></div>
        <div style="display:flex; justify-content:space-between;"><span>ຮັບເງິນສົດ:</span><span>${cash.toLocaleString()} LAK</span></div>
        <div style="display:flex; justify-content:space-between;"><span>ເງິນທອນ:</span><span>${changeAmount.toLocaleString()} LAK</span></div>
      </div>
      <div style="text-align:center; margin-top:15px; font-size:11px;">🙏 ຂອບໃຈທີ່ອຸດໜູນ 🙏</div>
    </div>`;
    if (printRef.current) {
      printRef.current.innerHTML = html;
      window.print();
      printRef.current.innerHTML = '';
    }
  }

  return (
    <>
      <div className="row g-3">
        <div className="col-md-8">
          <div className="card p-3 shadow-sm mb-3">
            <label className="form-label small fw-bold text-secondary">ສະແກນບາໂຄ້ດ / ປ້ອນລະຫັດສິນຄ້າ (ແລ້ວກົດ Enter)</label>
            <div className="input-group mb-3">
              <span className="input-group-text bg-white"><i className="fa-solid fa-barcode"></i></span>
              <input
                ref={scanRef}
                type="text"
                className="form-control form-control-lg border-start-0"
                placeholder="ສະແກນບາໂຄ້ດຢູ່ບ່ອນນີ້"
                autoFocus
                onKeyDown={handleScan}
              />
            </div>

            <h6 className="fw-bold text-muted mb-2"><i className="fa-solid fa-cart-shopping me-2"></i>ລາຍການສິນຄ້າໃນກະຕ່າ</h6>
            <div className="border rounded p-2 bg-light overflow-auto mb-3" style={{ minHeight: 350, maxHeight: 450 }}>
              {cart.length === 0 ? (
                <div className="text-center py-5 text-muted">ບໍ່ມີສິນຄ້າໃນກະຕ່າ</div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cart-item-row d-flex justify-content-between align-items-center border-bottom py-2 px-2">
                    <div>
                      <div className="fw-bold">{item.name}</div>
                      <small className="text-muted">{item.price.toLocaleString()} LAK / ອັນ</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQty(item.id, Number(e.target.value))}
                        className="form-control form-control-sm text-center cart-qty-input"
                        style={{ width: 60 }}
                      />
                      <span className="fw-bold text-success cart-line-total" style={{ minWidth: 90, textAlign: 'right' }}>
                        {(item.price * item.qty).toLocaleString()}
                      </span>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(item.id)}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-secondary m-0"><i className="fa-solid fa-star me-1 text-warning"></i> ສິນຄ້າແນະນຳ</h6>
              <button className="btn btn-sm btn-outline-secondary py-0" onClick={() => randomizeSuggestions()}>
                <i className="fa-solid fa-rotate me-1"></i> ສຸ່ມໃໝ່
              </button>
            </div>
            <div className="row row-cols-2 row-cols-md-6 g-2">
              {suggestions.map((p) => (
                <div className="col" key={p.id}>
                  <button
                    className="btn btn-outline-primary w-100 h-100 py-2 px-1 text-start"
                    style={{ fontSize: 12.5 }}
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0}
                  >
                    <div className="fw-bold text-truncate">{p.name}</div>
                    <div className="text-muted">{p.price.toLocaleString()} LAK</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card p-3 shadow-sm d-flex flex-column h-100 justify-content-between">
            <div>
              <h5 className="fw-bold mb-3 text-primary"><i className="fa-solid fa-calculator me-2"></i>ສະຫຼຸບການຂາຍ</h5>
              <hr />
              <div className="d-flex justify-content-between align-items-center my-4">
                <span className="fs-5 fw-bold">ລວມທັງໝົດ:</span>
                <span className="fs-3 fw-bold text-success">{grandTotal.toLocaleString()} LAK</span>
              </div>
              <hr />

              <div className="form-check form-switch my-3 p-3 bg-light rounded border">
                <input
                  className="form-check-input ms-0 me-2"
                  type="checkbox"
                  id="pos-print-receipt"
                  checked={printReceipt}
                  onChange={(e) => setPrintReceipt(e.target.checked)}
                />
                <label className="form-check-label fw-bold text-dark" htmlFor="pos-print-receipt">
                  <i className="fa-solid fa-print me-1 text-secondary"></i> ພິມບິນໃຫ້ລູກຄ້າ
                </label>
              </div>

              {printReceipt && (
                <div className="mb-3 d-flex align-items-center gap-2">
                  <label className="small fw-bold text-secondary m-0">ຂະໜາດເຈ້ຍ:</label>
                  <select className="form-select form-select-sm" style={{ width: 120 }} value={paperWidth} onChange={(e) => setPaperWidth(e.target.value)}>
                    <option value="58">58 mm</option>
                    <option value="80">80 mm</option>
                  </select>
                </div>
              )}

              {printReceipt && (
                <div>
                  <div className="text-center mb-1"><small className="text-muted fw-bold"><i className="fa-solid fa-eye me-1"></i>ໃບບິນສຳຫຼັບລູກຄ້າ</small></div>
                  <div className="receipt-live-box shadow-sm rounded">
                    {cart.length === 0 ? (
                      <div className="text-center py-4 text-muted small">🛒 ບໍ່ມີລາຍການສິນຄ້າເພື່ອສະແດງບິນ</div>
                    ) : (
                      <>
                        {cart.map((item) => (
                          <div key={item.id} className="d-flex justify-content-between" style={{ fontSize: 12.5 }}>
                            <span>{item.name} × {item.qty}</span>
                            <span>{(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                        <hr className="my-1" />
                        <div className="d-flex justify-content-between fw-bold">
                          <span>ລວມ</span><span>{grandTotal.toLocaleString()} LAK</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-danger w-50 py-2 fw-bold" onClick={clearCart}>
                <i className="fa-solid fa-ban me-1"></i> ຍົກເລີກການຂາຍ
              </button>
              <button className="btn btn-primary w-50 py-2 fw-bold" onClick={openCheckout} disabled={cart.length === 0}>
                <i className="fa-solid fa-money-bill-wave me-1"></i> ຢືນຢັນການຂາຍ (ຊຳລະເງິນ)
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="app-modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="modal-content border-0 shadow-lg"
            style={{ maxWidth: 360, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header bg-dark text-white py-3">
              <h5 className="modal-title fw-bold m-0"><i className="fa-solid fa-cash-register me-2 text-warning"></i> ຊຳລະເງິນສົດ</h5>
              <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body p-3">
              <div className="text-center mb-2">
                <span className="text-muted small fw-bold">ຍອດເງິນທີ່ຕ້ອງຊຳລະ</span>
                <h3 className="fw-bold text-success my-1">{grandTotal.toLocaleString()} LAK</h3>
              </div>

              <div className="mb-2">
                <label className="form-label fw-bold small text-secondary mb-1">ຈຳນວນເງິນສົດທີ່ຮັບມາ (LAK)</label>
                <input
                  type="text"
                  className="form-control form-control-lg text-end fw-bold fs-4 text-primary bg-light"
                  placeholder="0"
                  readOnly
                  value={cashAmount ? cashAmount.toLocaleString() : ''}
                />
              </div>

              <div className="row g-1 mb-2">
                {[50000, 100000, 200000, 500000].map((v) => (
                  <div className="col-3" key={v}>
                    <button className="btn btn-outline-dark w-100 fw-bold py-1 small" onClick={() => appendQuickCash(v)}>
                      {v / 1000}k
                    </button>
                  </div>
                ))}
              </div>

              <div className="row g-1 mb-2">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((n) => (
                  <div className="col-4" key={n}>
                    <button className="btn btn-light border w-100 fw-bold py-2 fs-5" onClick={() => pressNum(n)}>{n}</button>
                  </div>
                ))}
                <div className="col-4"><button className="btn btn-danger w-100 fw-bold py-2 fs-5" onClick={() => pressNum('C')}>C</button></div>
                <div className="col-4"><button className="btn btn-light border w-100 fw-bold py-2 fs-5" onClick={() => pressNum('0')}>0</button></div>
                <div className="col-4"><button className="btn btn-light border w-100 fw-bold py-2 fs-5" onClick={() => pressNum('00')}>00</button></div>
              </div>

              <div className="card bg-light border-0 p-2 mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-muted small"><mark>ເງິນທອນລູກຄ້າ:</mark></span>
                  <h4 className={`m-0 fw-bold ${change < 0 ? 'text-muted' : 'text-danger'}`}>
                    {change < 0 ? 'ເງິນສົດບໍ່ພໍ!' : change.toLocaleString() + ' LAK'}
                  </h4>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-5">
                  <button className="btn btn-outline-secondary w-100 py-2 fw-bold btn-sm" onClick={() => setShowModal(false)}>ຍົກເລີກ</button>
                </div>
                <div className="col-7">
                  <button className="btn btn-success w-100 py-2 fw-bold btn-sm" onClick={submitSale} disabled={confirming}>
                    {confirming ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fa-solid fa-check me-1"></i>}
                    {confirming ? ' ບັນທຶກ...' : ' ຢືນຢັນການຂາຍ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div id="print-section" ref={printRef} className="d-none"></div>
    </>
  );
}
