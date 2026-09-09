-- Aktifkan ekstensi UUID (jika belum aktif)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hapus tabel lama jika ingin reset bersih (Hati-hati: ini akan menghapus data yang ada!)
DROP TABLE IF EXISTS transaction_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS products;

-- 1. Tabel Produk (Katalog, Stok, dan Modal)
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT, -- Digunakan untuk Ukuran (Small/Large)
  price NUMERIC NOT NULL, -- Harga Jual Dasar (Offline)
  price_merchant NUMERIC, -- Harga Jual Merchant/Ojol
  cost_price NUMERIC DEFAULT 0, -- Modal Dasar Flat (Untuk Kalkulasi Laba Bersih)
  stock_quantity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE, -- Untuk menyembunyikan/menampilkan produk
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Promosi (Paket Diskon)
CREATE TABLE promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price_offline NUMERIC NOT NULL, -- Harga promo untuk kasir offline
  price_merchant NUMERIC NOT NULL, -- Harga promo untuk ojol/online
  required_quantity INT DEFAULT 2, -- Berapa item produk yang harus dipilih
  eligible_product_ids JSONB DEFAULT '[]'::jsonb, -- Array of UUID produk yang valid dipilih
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Transaksi (Header Nota)
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cashier_id UUID REFERENCES auth.users(id), -- ID user dari Supabase Auth
  total_amount NUMERIC NOT NULL,
  shipping_fee NUMERIC DEFAULT 0, -- Ongkos Kirim
  addon_fee NUMERIC DEFAULT 0, -- Biaya tambahan lainnya (misal: packaging)
  payment_method TEXT NOT NULL, -- Contoh: 'cash', 'qris', 'transfer'
  order_type TEXT DEFAULT 'offline', -- Contoh: 'offline' atau 'merchant'
  status TEXT DEFAULT 'completed', -- 'completed' atau 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Detail Transaksi (Item di dalam keranjang belanja)
CREATE TABLE transaction_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id), -- Bisa NULL jika ini baris header promo
  promo_id UUID REFERENCES promotions(id), -- NULL jika produk biasa, terisi jika ini terkait promo
  quantity INT NOT NULL,
  price_at_time NUMERIC NOT NULL -- Merekam harga final saat transaksi (Offline vs Merchant vs Promo)
);

-- 5. Tabel Chat Logs (Untuk WA Webhook AI)
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  is_bot_response BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
