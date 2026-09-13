// app/receive/page.js
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReceivePage() {
  return (
    <Suspense fallback={<p className="text-muted">ກຳລັງໂຫຼດ...</p>}>
      <ReceiveContent />
    </Suspense>
  );
}

function ReceiveContent() {
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isNewMode, setIsNewMode] = useState(false);
  const [active, setActive] = useState(null); // selected existing product
  const [form, setForm] = useState({
    scan: '', name: '', category: '', newCategory: '', location: '',
    cost: '', price: '', qty: '1', unit: 'ອັນ',
  });
  const [submitting, setSubmitting] = useState(false);
  const scanRef = useRef(null);
  const swalRef = useRef(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    import('sweetalert2').then((m) => (swalRef.current = m.default));
    loadData();
    // ຖ້າມາຈາກໜ້າ Low Stock ດ້ວຍ ?barcode=xxx ໃຫ້ຄົ້ນຫາອັດຕະໂນມັດ
    const barcode = searchParams.get('barcode');
    if (barcode) {
      setForm((f) => ({ ...f, scan: barcode }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const barcode = searchParams.get('barcode');
    if (barcode && allProducts.length > 0) {
      scanProduct(barcode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProducts]);

  function loadData() {
    fetch('/api/products')
      .then((res) => res.json())
      .then((json) => {
        const rows = json.products || [];
        setAllProducts(rows);
        setCategories(json.categories || []);
        randomizeSuggestions(rows);
      });
  }

  function randomizeSuggestions(rows) {
    const source = rows || allProducts;
    setSuggestions([...source].sort(() => 0.5 - Math.random()).slice(0, 8));
  }

  function resetForm(keepMode) {
    setActive(null);
    setForm({ scan: keepMode ? form.scan : '', name: '', category: '', newCategory: '', location: '', cost: '', price: '', qty: '1', unit: 'ອັນ' });
  }

  function toggleMode() {
    setIsNewMode((m) => !m);
    resetForm(false);
  }

  function selectProduct(p) {
    setActive(p);
    setForm({
      scan: p.id, name: p.name, category: p.category, newCategory: '',
      location: p.location || 'ຄັງເດີມ', cost: String(p.cost || 0), price: String(p.price || 0),
      qty: '1', unit: p.unit || 'ອັນ',
    });
  }

  function scanProduct(codeArg) {
    const code = (codeArg || form.scan).trim();
    if (!code) return;
    const found = allProducts.find((p) => p.id.toLowerCase() === code.toLowerCase());
    if (found) {
      selectProduct(found);
    } else {
      swalRef.current?.fire({ icon: 'warning', title: 'ບໍ່ພົບລະຫັດສິນຄ້ານີ້!', text: "ລະບົບຈະປ່ຽນເປັນໂໝດ 'ເພີ່ມສິນຄ້າໃໝ່' ໃຫ້ອັດຕະໂນມັດ", confirmButtonText: 'ຕົກລົງ' })
        .then(() => {
          setIsNewMode(true);
          setForm((f) => ({ ...f, scan: code }));
        });
    }
  }

  function handleScanKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      scanProduct();
    }
  }

  const locationLocked = !isNewMode && active && Number(active.stock) > 0;
  const category = form.category === '__new__' ? form.newCategory : form.category;

  async function handleSubmit(e) {
    e.preventDefault();
    const id = form.scan.trim();
    const name = form.name.trim();
    const qty = parseInt(form.qty, 10);
    const finalCategory = category.trim() || 'ທົ່ວໄປ';

    if (!id || !name) {
      swalRef.current?.fire({ icon: 'warning', title: 'ຂໍ້ມູນບໍ່ຄົບຖ້ວນ!', text: 'ກະລຸນາກອກລະຫັດ ແລະ ຊື່ສິນຄ້າໃຫ້ຄົບຖ້ວນ', confirmButtonText: 'ຕົກລົງ' });
      return;
    }
    if (isNaN(qty) || qty < 1) {
      swalRef.current?.fire({ icon: 'warning', title: 'ຈຳນວນບໍ່ຖືກຕ້ອງ!', text: 'ກະລຸນາກອກຈຳນວນສິນຄ້າຢ່າງນ້ອຍ 1 ລາຍການ', confirmButtonText: 'ຕົກລົງ' });
      return;
    }

    setSubmitting(true);
    try {
      if (isNewMode) {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id, name, category: finalCategory,
            cost: Number(form.cost) || 0, price: Number(form.price) || 0,
            stock: qty, location: form.location.trim() || 'ຄັງເດີມ', unit: form.unit.trim() || 'ອັນ',
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          swalRef.current?.fire({ icon: 'error', title: 'ເກີດຂໍ້ຜິດພາດ!', text: json.error || 'ລະຫັດສິນຄ້າຊ້ຳກັນ! ບໍ່ສາມາດເພີ່ມໄດ້', confirmButtonText: 'ຕົກລົງ' });
          return;
        }
        swalRef.current?.fire({ icon: 'success', title: '🎉 ເພີ່ມສິນຄ້າໃໝ່ສຳເລັດ!', text: 'ເພີ່ມສິນຄ້າ ແລະ ຮັບເຂົ້າຄັງຮຽບຮ້ອຍແລ້ວ', showConfirmButton: false, timer: 1500 });
      } else {
        const res = await fetch('/api/stock/receive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: id, qty, location: form.location.trim() || undefined,
            cost: form.cost ? Number(form.cost) : undefined, price: form.price ? Number(form.price) : undefined,
            unit: form.unit.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          swalRef.current?.fire({ icon: 'error', title: 'System Error', text: json.error, confirmButtonText: 'ຕົກລົງ' });
          return;
        }
        swalRef.current?.fire({ icon: 'success', title: '📥 ຮັບສິນຄ້າເຂົ້າຄັງສຳເລັດ!', text: `ຍອດຄັງໃໝ່: ${json.newStock}`, showConfirmButton: false, timer: 1500 });
      }
      resetForm(false);
      loadData();
    } catch (err) {
      swalRef.current?.fire({ icon: 'error', title: 'System Error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <div className="card p-3 shadow-sm mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-dark m-0">
              <i className="fa-solid fa-square-plus text-success me-2"></i>
              {isNewMode ? 'ເພີ່ມສິນຄ້າໃໝ່' : 'ຮັບສິນຄ້າເຂົ້າຄັງ'}
            </h5>
            <button className="btn btn-sm btn-warning fw-bold" onClick={toggleMode} type="button">
              <i className="fa-solid fa-plus-circle me-1"></i> {isNewMode ? 'ກັບໄປໂໝດຮັບເຂົ້າຄັງ' : 'ເພີ່ມສິນຄ້າໃໝ່'}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary">ບາໂຄ້ດ/ລະຫັດສິນຄ້າ</label>
              <div className="input-group">
                <input
                  ref={scanRef}
                  type="text"
                  className="form-control"
                  placeholder="ຍິງບາໂຄ້ດ ຫຼື ປ້ອນລະຫັດ..."
                  value={form.scan}
                  onChange={(e) => setForm({ ...form, scan: e.target.value })}
                  onKeyDown={handleScanKey}
                />
                {!isNewMode && (
                  <button className="btn btn-primary" type="button" onClick={() => scanProduct()}>
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold text-secondary">ຊື່ສິນຄ້າ</label>
              <input
                type="text"
                className="form-control"
                placeholder="ຊື່ສິນຄ້າ..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!isNewMode && !active}
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-bold text-secondary">ໝວດໝູ່ສິນຄ້າ</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  disabled={!isNewMode && !active}
                >
                  <option value="">-- ເລືອກໝວດໝູ່ --</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__new__">+ ເພີ່ມໝວດໝູ່ໃໝ່...</option>
                </select>
                {form.category === '__new__' && (
                  <input
                    type="text"
                    className="form-control mt-1"
                    placeholder="ປ້ອນຊື່ໝວດໝູ່ໃໝ່..."
                    value={form.newCategory}
                    onChange={(e) => setForm({ ...form, newCategory: e.target.value })}
                  />
                )}
              </div>
              <div className="col-6">
                <label className="form-label small fw-bold text-secondary">ສະຖານທີ່ເກັບ (Location)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ເຊັ່ນ: ຕູ້ A, ຊັ້ນ 2"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  disabled={(!isNewMode && !active) || locationLocked}
                />
                {locationLocked && (
                  <small className="text-danger small">🔒 ລັອກໂລເຄຊັນເດີມ (ເນື່ອງຈາກຍັງມີສິນຄ້າໃນຄັງ)</small>
                )}
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-bold text-secondary">ລາຄາທຶນ (LAK)</label>
                <input type="number" className="form-control" min="0" value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })} disabled={!isNewMode && !active} />
              </div>
              <div className="col-6">
                <label className="form-label small fw-bold text-secondary">ລາຄາຂາຍ (LAK)</label>
                <input type="number" className="form-control" min="0" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} disabled={!isNewMode && !active} />
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-bold text-secondary">ຈຳນວນທີ່ຮັບເຂົ້າ</label>
                <input type="number" className="form-control" min="1" value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })} disabled={!isNewMode && !active} />
              </div>
              <div className="col-6">
                <label className="form-label small fw-bold text-secondary">ຫົວໜ່ວຍສິນຄ້າ</label>
                <input type="text" className="form-control" placeholder="ເຊັ່ນ: ອັນ, ກ່ອງ" value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })} disabled={!isNewMode && !active} />
              </div>
            </div>

            {active && (
              <div className="p-2 bg-light rounded border mb-3 text-center small">
                ຍອດຄັງປັດຈຸບັນໃນລະບົບ: <span className="fw-bold text-primary">{active.stock} {active.unit}</span>
              </div>
            )}

            <button className="btn btn-success w-100 fw-bold py-2" type="submit" disabled={(!isNewMode && !active) || submitting}>
              {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fa-solid fa-download me-1"></i>}
              {submitting ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນການຮັບເຂົ້າສະຕັອກ'}
            </button>
          </form>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card p-3 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-dark m-0"><i className="fa-solid fa-list text-muted me-2"></i>ລາຍການສິນຄ້າອ້າງອີງ</h5>
            <button className="btn btn-sm btn-outline-secondary py-0" onClick={() => randomizeSuggestions()}>
              <i className="fa-solid fa-rotate me-1"></i> ສຸ່ມໃໝ່
            </button>
          </div>
          <div className="table-responsive" style={{ maxHeight: 480 }}>
            <table className="table table-hover align-middle small table-bordered m-0">
              <thead className="table-light sticky-top">
                <tr>
                  <th>ລະຫັດສິນຄ້າ</th>
                  <th>ຊື່ສິນຄ້າ</th>
                  <th className="text-end">ຄັງປັດຈຸບັນ</th>
                  <th className="text-center">ເລືອກ</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-muted py-4">ບໍ່ພົບຂໍ້ມູນສິນຄ້າ</td></tr>
                ) : (
                  suggestions.map((row) => (
                    <tr key={row.id}>
                      <td className="fw-bold text-secondary">{row.id}</td>
                      <td><strong>{row.name}</strong><br /><small className="text-muted">{row.category}</small></td>
                      <td className="text-end fw-bold text-primary">{row.stock} {row.unit}</td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-outline-primary py-0" onClick={() => { setIsNewMode(false); selectProduct(row); }}>ເລືອກ</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
