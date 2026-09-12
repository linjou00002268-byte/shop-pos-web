// app/layout.js
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'ຮ້ານຄ້າ POS — ລະບົບຄັງສິນຄ້າ ແລະ ການຂາຍ',
  description: 'ລະບົບ POS ແລະ ຄັງສິນຄ້າສຳລັບຮ້ານຄ້າ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="lo">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
