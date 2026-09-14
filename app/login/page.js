// app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError('ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: '#f4f6f9' }}>
      <div className="card shadow-sm p-4" style={{ width: 380 }}>
        <div className="text-center mb-4">
          <i className="fa-solid fa-store fa-2x text-primary mb-2"></i>
          <h4 className="fw-bold m-0">My Shop POS</h4>
          <small className="text-muted">ເຂົ້າສູ່ລະບົບເພື່ອໃຊ້ງານ</small>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary">ອີເມວ</label>
            <input
              type="email"
              className="form-control"
              placeholder="staff@myshop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary">ລະຫັດຜ່ານ</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <button className="btn btn-primary w-100 fw-bold py-2" type="submit" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fa-solid fa-right-to-bracket me-1"></i>}
            {loading ? 'ກຳລັງເຂົ້າສູ່ລະບົບ...' : 'ເຂົ້າສູ່ລະບົບ'}
          </button>
        </form>
      </div>
    </div>
  );
}
