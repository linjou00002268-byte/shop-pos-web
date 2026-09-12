# Shop POS & Inventory — Backend API (Next.js + Supabase)

ໄຟລ໌ຊຸດນີ້ແມ່ນ API routes ທີ່ແປງມາຈາກ Google Apps Script (`Code.gs`) ເດີມ
ໃຫ້ໃຊ້ກັບ Supabase (Postgres) ຕາມ `schema.sql` ທີ່ໄດ້ສ້າງໄວ້ກ່ອນໜ້ານີ້.

## ວິທີໃຊ້

1. ສ້າງໂປຣເຈັກ Next.js ໃໝ່:
   ```
   npx create-next-app@latest shop-pos-web
   cd shop-pos-web
   npm install @supabase/supabase-js
   ```

2. ຄັດລອກໂຟນເດີ `app/api/` ແລະ ໄຟລ໌ `lib/supabase.js` ຈາກຊຸດນີ້
   ໄປວາງທັບໃນໂປຣເຈັກທີ່ສ້າງໃໝ່ (ຮັກສາໂຄງສ້າງໂຟນເດີໃຫ້ຄືເດີມ)

3. ຄັດລອກ `.env.local.example` → ປ່ຽນຊື່ເປັນ `.env.local` → ໃສ່ຄ່າ
   `SUPABASE_URL` ແລະ `SUPABASE_SERVICE_ROLE_KEY` ຈິງຂອງເຈົ້າ
   (ຢູ່ Supabase: Project Settings > API)

4. ລັນ `npm run dev` ແລ້ວທົດສອບແຕ່ລະ endpoint:

| Method | Endpoint | ໜ້າທີ່ | ແທນ GAS function |
|---|---|---|---|
| GET | `/api/products` | ລາຍການສິນຄ້າ+ໝວດໝູ່+ສະຖານະ | `getAllProductsReport` |
| POST | `/api/products` | ເພີ່ມສິນຄ້າໃໝ່ | `addNewProduct` |
| PUT | `/api/products/:id` | ແກ້ໄຂຂໍ້ມູນສິນຄ້າ | `updateProductDetails` |
| GET | `/api/products/low-stock?limit=5` | ສິນຄ້າໃກ້ໝົດ | `getLowStockProducts` |
| POST | `/api/sales` | ບັນທຶກການຂາຍ (atomic) | `processSale` |
| GET | `/api/sales` | ປະຫວັດການຂາຍ | `getSalesHistory` |
| POST | `/api/stock/receive` | ຮັບສິນຄ້າເຂົ້າຄັງ | `updateStockReceive(WithPrices)` |
| GET | `/api/reports/dashboard` | ຂໍ້ມູນ Dashboard | `getReportData` |

## ຕົວຢ່າງທົດສອບດ້ວຍ curl

ບັນທຶກການຂາຍ:
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{"cart":[{"id":"P001","qty":2,"price":15000}]}'
```

ຮັບສິນຄ້າເຂົ້າຄັງ:
```bash
curl -X POST http://localhost:3000/api/stock/receive \
  -H "Content-Type: application/json" \
  -d '{"productId":"P001","qty":10,"location":"ຄັງ A"}'
```

## Frontend (6 ໜ້າ)

ໄຟລ໌ຊຸດນີ້ມີໜ້າຕາຄົບແລ້ວ ຢູ່ໃນ `app/`:

| Route | ໜ້າທີ່ |
|---|---|
| `/` | Dashboard — ພາບລວມ, ສະຖິຕິ, ສິນຄ້າໃກ້ໝົດ |
| `/pos` | ຂາຍເຄື່ອງ — ຄົ້ນຫາສິນຄ້າ, ກະຕ່າ, ຢືນຢັນການຂາຍ |
| `/receive` | ຮັບເຂົ້າຄັງ — ຮັບສິນຄ້າເກົ່າ ຫຼືເພີ່ມສິນຄ້າໃໝ່ |
| `/inventory` | ຄັງສິນຄ້າ — ຕາຕະລາງ+ຄົ້ນຫາ+ແກ້ໄຂ inline |
| `/history` | ປະຫວັດການຂາຍ — ລາຍການໃບບິນ+ລາຍລະອຽດ |
| `/low-stock` | ສິນຄ້າໃກ້ໝົດຄັງ |

ໂຄງສ້າງເພີ່ມເຕີມ: `components/Sidebar.js` (navigation), `app/globals.css` (design tokens),
`app/layout.js` (layout ຫຼັກ), `lib/format.js` (format ຕົວເລກ/ວັນທີ)

## ຍັງເຫຼືອອີກ

- `addNewProductAndReceive` — ລວມ POST /api/products + POST /api/stock/receive ຝັ່ງ frontend
  ໄດ້ເລີຍ (ເອີ້ນ 2 ຄັ້ງຕໍ່ກັນ) ຫຼືສ້າງ endpoint ລວມແຍກຕ່າງຫາກຖ້າຕ້ອງການ
- Authentication ຍັງບໍ່ໄດ້ໃສ່ — ຄວນເພີ່ມ middleware ກວດ session ກ່ອນ deploy ຈິງ
  (ໃຜກໍ່ຕາມທີ່ມີ URL ຕອນນີ້ ສາມາດຂາຍເຄື່ອງ/ແກ້ໄຂຂໍ້ມູນໄດ້ໂດຍກົງ)
