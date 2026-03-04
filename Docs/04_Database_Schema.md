# Database Schema: Sistem Informasi Manajemen Logistik Gizi & SPK RSD Balung

## 1. Deskripsi ERD (Entity Relationship Diagram)

Sistem ini dirancang untuk mengelola logistik instalasi gizi (penerimaan, pengeluaran, dan stok bahan makanan) serta mengintegrasikan Sistem Pendukung Keputusan (SPK) untuk optimalisasi pengadaan (misalnya menggunakan metode SAW/AHP untuk pemilihan *supplier* atau EOQ untuk manajemen stok).

**Relasi Utama:**
*   **Katalog & Inventaris:** `items` (Bahan Makanan) berelasi dengan `categories` (Golongan Bahan) dan `units` (Satuan). Tabel `inventory` menyimpan stok aktual (real-time).
*   **Konversi Satuan:** `unit_conversions` menghubungkan dua `units` untuk memfasilitasi konversi dinamis (misal: 1 Sak = 25 Kg, 1 Kg = 1000 Gram) yang sangat krusial dalam logistik gizi.
*   **Transaksi:** `transactions` mencatat *header* penerimaan (In), pengeluaran (Out), atau *Stock Opname* (Adjust). `transaction_details` memuat *line items* dari transaksi tersebut, berelasi dengan `items` dan `unit_conversions`.
*   **SPK (Pemilihan Supplier / Pengadaan):** `spk_criteria` menyimpan kriteria penilaian (Harga, Kualitas, Waktu Pengiriman). `spk_evaluations` memetakan nilai tiap `suppliers` terhadap kriteria. `spk_results` menyimpan riwayat hasil komputasi SPK untuk audit dan laporan.

---

## 2. Struktur Tabel (Table Structures)

### 2.1. Master Data

#### `users` (Pengguna Sistem)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AUTO_INCREMENT | ID Pengguna |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Username login |
| `password_hash`| VARCHAR(255)| NOT NULL | Hash password |
| `role` | ENUM | NOT NULL | 'Admin', 'AhliGizi', 'Gudang', 'Manajemen' |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu dibuat |

#### `categories` (Kategori Bahan Makanan)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AUTO_INCREMENT | ID Kategori |
| `name` | VARCHAR(100) | NOT NULL | Cth: Sayuran, Lauk Pauk, Bumbu |
| `type` | ENUM | NOT NULL | 'Basah', 'Kering' (Penting untuk masa simpan) |

#### `units` (Satuan Dasar)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AUTO_INCREMENT | ID Satuan |
| `name` | VARCHAR(50) | NOT NULL | Cth: Kilogram, Gram, Liter, Sak, Ikat |
| `symbol` | VARCHAR(10) | NOT NULL | Cth: Kg, g, L |

#### `suppliers` (Pemasok Bahan Makanan)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AUTO_INCREMENT | ID Pemasok |
| `name` | VARCHAR(150) | NOT NULL | Nama perusahaan/pemasok |
| `contact` | VARCHAR(50) | | Nomor kontak yang bisa dihubungi |
| `address` | TEXT | | Alamat pemasok |
| `status` | ENUM | DEFAULT 'Active' | 'Active', 'Blacklisted' |

#### `items` (Data Bahan Makanan)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AUTO_INCREMENT | ID Item |
| `category_id` | INT | FK -> categories(id) | Kategori bahan makanan |
| `name` | VARCHAR(150) | NOT NULL | Nama item (Cth: Beras Putih) |
| `base_unit_id` | INT | FK -> units(id) | Satuan terkecil/dasar (Cth: Gram) |
| `min_stock` | DECIMAL(10,2)| NOT NULL, DEFAULT 0 | Batas stok minimum (Reorder Point) |
| `max_stock` | DECIMAL(10,2)| NOT NULL, DEFAULT 0 | Batas stok maksimum (Kapasitas Gudang) |

---

### 2.2. Manajemen Logistik & Inventaris

#### `unit_conversions` (Master Konversi Satuan)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AUTO_INCREMENT | ID Konversi |
| `item_id` | INT | FK -> items(id) | Spesifik per item (Opsional/Bisa NULL jika global) |
| `from_unit_id` | INT | FK -> units(id) | Satuan asal (Cth: Sak) |
| `to_unit_id` | INT | FK -> units(id) | Satuan tujuan (Cth: Kg) |
| `factor` | DECIMAL(10,4)| NOT NULL | Faktor pengali (Cth: 25.0000) |

#### `inventory` (Stok Gudang Real-time)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `item_id` | INT | PK, FK -> items(id) | ID Item |
| `current_stock`| DECIMAL(12,2)| NOT NULL, DEFAULT 0 | Stok aktual dalam `base_unit_id` |
| `last_updated` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP| Kapan stok terakhir berubah |

#### `transactions` (Header Transaksi Gudang)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AUTO_INCREMENT | ID Transaksi |
| `tx_date` | DATETIME | NOT NULL | Waktu transaksi |
| `tx_type` | ENUM | NOT NULL | 'IN' (Masuk), 'OUT' (Keluar), 'ADJ' (Opname) |
| `reference_no` | VARCHAR(50) | UNIQUE | Nomor PO / Nota / Faktur |
| `supplier_id` | INT | FK -> suppliers(id)| Pemasok (NULL jika tx_type = 'OUT'/'ADJ')|
| `user_id` | INT | FK -> users(id) | Petugas yang mencatat |

#### `transaction_details` (Detail Transaksi)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | ID Detail |
| `transaction_id`| INT | FK -> transactions(id)| Header Transaksi |
| `item_id` | INT | FK -> items(id) | Bahan Makanan |
| `input_qty` | DECIMAL(10,2)| NOT NULL | Jumlah yang diinput (Sesuai `input_unit_id`) |
| `input_unit_id` | INT | FK -> units(id) | Satuan saat input (Cth: Sak, Ikat) |
| `base_qty` | DECIMAL(12,2)| NOT NULL | Hasil konversi ke `base_unit_id` |
| `unit_price` | DECIMAL(12,2)| NOT NULL, DEFAULT 0 | Harga per `input_unit_id` (Untuk HPP/SPK) |
| `expire_date` | DATE | | Tanggal kadaluarsa (Penting untuk FIFO/FEFO) |

---

### 2.3. Sistem Pendukung Keputusan (SPK)

#### `spk_criteria` (Kriteria Penilaian Pemasok - Metode SAW/AHP)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AUTO_INCREMENT | ID Kriteria |
| `code` | VARCHAR(10) | UNIQUE, NOT NULL | Cth: C1, C2, C3 |
| `name` | VARCHAR(100) | NOT NULL | Cth: Harga, Kualitas, Ketepatan Waktu |
| `attribute` | ENUM | NOT NULL | 'Cost' (Makin kecil makin baik), 'Benefit' |
| `weight` | DECIMAL(5,4) | NOT NULL | Bobot kriteria (Total harus 1.0) |

#### `spk_evaluations` (Data Alternatif & Nilai Pemasok)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AUTO_INCREMENT | ID Evaluasi |
| `period` | VARCHAR(7) | NOT NULL | Periode penilaian (Cth: '2023-10') |
| `supplier_id` | INT | FK -> suppliers(id)| Alternatif pemasok |
| `criteria_id` | INT | FK -> spk_criteria(id)| Kriteria yang dinilai |
| `raw_score` | DECIMAL(10,2)| NOT NULL | Nilai asli/mentah |

#### `spk_results` (Hasil Keputusan SPK)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, AUTO_INCREMENT | ID Hasil |
| `period` | VARCHAR(7) | NOT NULL | Periode (Cth: '2023-10') |
| `supplier_id` | INT | FK -> suppliers(id)| Pemasok yang dievaluasi |
| `final_score` | DECIMAL(8,4) | NOT NULL | Nilai preferensi akhir SPK |
| `rank` | INT | NOT NULL | Peringkat pemasok pada periode tersebut |

---

## 3. Logika Konversi Satuan (Unit Conversion Logic)

Sistem ini menggunakan mekanisme **Base Unit (Satuan Dasar)** untuk menyimpan stok aktual di tabel `inventory` dan komputasi SPK. 

**Prosedur Konversi:**
1. Setiap `items` memiliki `base_unit_id` (Misal: Gram).
2. Saat petugas gudang menerima barang, mereka menginput `input_qty` dan `input_unit_id` (Misal: 5 Sak).
3. Sistem akan mencari nilai konversi di tabel `unit_conversions` dengan kondisi:
   `from_unit_id = input_unit_id` DAN `to_unit_id = base_unit_id`.
4. Jika ditemukan faktor konversi (Misal 1 Sak = 25000 Gram, `factor = 25000`), maka:
   `base_qty = input_qty * factor` (5 * 25000 = 125000 Gram).
5. Nilai `base_qty` inilah yang dijumlahkan/dikurangkan ke tabel `inventory` melalui *Database Trigger* atau *Application Logic*.

**Formula SQL untuk Insert:**
```sql
-- Contoh mengambil faktor konversi secara dinamis saat transaksi
SELECT factor INTO @conv_factor 
FROM unit_conversions 
WHERE (item_id = @item_id OR item_id IS NULL) 
  AND from_unit_id = @input_unit_id 
  AND to_unit_id = (SELECT base_unit_id FROM items WHERE id = @item_id)
LIMIT 1;

SET @base_qty = @input_qty * IFNULL(@conv_factor, 1);
```

---

## 4. Strategi Indexing untuk Optimasi SPK & Logistik

Sistem Pendukung Keputusan (seperti *Forecasting* kebutuhan bahan atau penilaian *Supplier*) memerlukan agregasi data yang berat dari jutaan baris detail transaksi historis. Berikut adalah strategi optimasi B-Tree Indexing:

### 4.1. Index untuk Optimasi Perhitungan Stok & Reorder Point (ROP)
```sql
-- Mempercepat query peringatan stok menipis (Alert System)
CREATE INDEX idx_inventory_stock_alert 
ON inventory (current_stock);

-- Composite index untuk pencarian minimum stock per kategori item
CREATE INDEX idx_items_category_stock 
ON items (category_id, min_stock);
```

### 4.2. Index untuk Optimasi Data Historis SPK (Forecasting/EOQ)
SPK sering kali mengambil rata-rata penggunaan logistik per bulan untuk *Forecasting*.
```sql
-- Mempercepat agregasi data transaksi keluar (OUT) berdasarkan rentang waktu dan jenis barang
CREATE INDEX idx_transactions_type_date 
ON transactions (tx_type, tx_date);

-- Composite index pada detail transaksi untuk JOIN yang sangat cepat pada agregasi SPK
CREATE INDEX idx_tx_details_item_tx 
ON transaction_details (item_id, transaction_id);
```

### 4.3. Index untuk Optimasi Matriks Keputusan SPK (Pemilihan Supplier)
Pembuatan matriks normalisasi pada metode SAW memerlukan pencarian nilai `MAX()` atau `MIN()` secara berulang untuk setiap kriteria pada periode tertentu.
```sql
-- Sangat krusial untuk mencari Max/Min (Normalisasi SAW/TOPSIS) dengan cepat
CREATE INDEX idx_spk_evaluations_period_criteria 
ON spk_evaluations (period, criteria_id, raw_score);

-- Mempercepat query dashboard untuk menampilkan ranking supplier per periode
CREATE INDEX idx_spk_results_period_rank 
ON spk_results (period, rank);
```