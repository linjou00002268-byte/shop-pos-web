// components/Sidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const LINKS = [
  { href: '/', label: 'ເດດບອດ (Dashboard)', icon: 'fa-chart-line' },
  { href: '/pos', label: 'ໜ້າຂາຍສິນຄ້າ (POS)', icon: 'fa-cart-shopping' },
  { href: '/receive', label: 'ຮັບສິນຄ້າເຂົ້າຄັງ', icon: 'fa-box-open' },
  { href: '/inventory', label: 'ສິນຄ້າທັງໝົດ', icon: 'fa-warehouse' },
  { href: '/history', label: 'ປະຫວັດການຂາຍ', icon: 'fa-clock-rotate-left' },
  { href: '/low-stock', label: 'ແຈ້ງເຕືອນສະຕັອກ', icon: 'fa-triangle-exclamation text-warning' },
];

export default function Sidebar({ children }) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  function toggleSidebar() {
    setShow((s) => !s);
  }

  return (
    <>
      <div
        className={`sidebar-overlay${show ? ' show' : ''}`}
        onClick={toggleSidebar}
      ></div>

      <div className="mobile-header">
        <h5 className="m-0">
          <i className="fa-solid fa-store me-2"></i> My Shop POS
        </h5>
        <button className="btn btn-outline-light btn-sm" onClick={toggleSidebar}>
          <i className="fa-solid fa-bars fa-lg"></i>
        </button>
      </div>

      <div className={`sidebar d-flex flex-column${show ? ' show' : ''}`}>
        <div className="px-4 mb-3 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="text-white m-0">
              <i className="fa-solid fa-store me-2"></i> My Shop POS
            </h4>
            <small className="text-muted">ລະບົບຈັດການຮ້ານຄ້າ</small>
          </div>
          <button
            className="btn-close btn-close-white d-lg-none"
            onClick={toggleSidebar}
          ></button>
        </div>
        <hr className="mx-3 text-secondary mt-1" />
        <ul className="nav nav-pills flex-column mb-auto">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`nav-link${pathname === link.href ? ' active' : ''}`}
                onClick={() => setShow(false)}
              >
                <i className={`fa-solid ${link.icon} me-2`} style={{ width: 20 }}></i>{' '}
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="main-content">
        <div id="content-area">{children}</div>
      </div>
    </>
  );
}
