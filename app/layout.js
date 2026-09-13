// app/layout.js
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'POS & Inventory Management System',
  description: 'ລະບົບຈັດການຮ້ານຄ້າ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="lo">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>
        <Sidebar>{children}</Sidebar>
      </body>
    </html>
  );
}
