// components/Sidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/pos', label: 'ຂາຍເຄື່ອງ (POS)' },
  { href: '/receive', label: 'ຮັບເຂົ້າຄັງ' },
  { href: '/inventory', label: 'ຄັງສິນຄ້າ' },
  { href: '/history', label: 'ປະຫວັດການຂາຍ' },
  { href: '/low-stock', label: 'ໃກ້ໝົດຄັງ' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          ຮ້ານຄ້າ POS
          <span>ລະບົບຄັງສິນຄ້າ ແລະ ການຂາຍ</span>
        </div>
        <nav className="sidebar-nav">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link${pathname === link.href ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="sidebar-mobile">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </>
  );
}
