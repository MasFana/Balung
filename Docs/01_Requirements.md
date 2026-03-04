# Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SRS)
**Sistem Informasi Manajemen Logistik Gizi & SPK RSD Balung**

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SRS) ini bertujuan untuk mendefinisikan seluruh kebutuhan fungsional dan non-fungsional, standar UI/UX, serta spesifikasi perangkat keras dan lunak untuk pengembangan "Sistem Informasi Manajemen Logistik Gizi & Surat Pesanan Kerja (SPK) RSD Balung". Dokumen ini akan menjadi acuan utama bagi tim pengembang, analis bisnis, dan pemangku kepentingan (stakeholders) di RSD Balung.

### 1.2 Ruang Lingkup
Sistem ini dirancang untuk mendigitalisasi dan mengotomatisasi proses pengelolaan logistik bahan makanan di Instalasi Gizi RSD Balung. Sistem ini memfasilitasi alur kerja antara dua entitas utama: **Gudang Logistik Utama** dan **Instalasi Gizi/Dapur**. Fungsi utama mencakup manajemen stok barang, pengajuan Surat Pesanan Kerja (SPK), persetujuan distribusi, pencatatan penerimaan, dan pelaporan.

### 1.3 Aturan Bisnis Utama (Key Constraint)
Sistem ini dibangun dengan aturan pemisahan wewenang (Segregation of Duties) yang sangat ketat:
*   **Gudang (Warehouse) adalah satu-satunya entitas yang memiliki hak untuk menambah, mengedit, menghapus, dan mengelola stok fisik secara langsung.**
*   **Instalasi Gizi / SPK (Nutrition/Kitchen) HANYA memiliki hak untuk melihat (view) ketersediaan stok, membuat dokumen permintaan (SPK), dan mengonfirmasi penerimaan barang dari Gudang.** Gizi tidak dapat memanipulasi data master stok.

---

## 2. Karakteristik Pengguna (User Roles)

1.  **Admin Sistem**
    *   Mengelola akun pengguna, hak akses (Role-Based Access Control), dan pengaturan sistem dasar.
2.  **Petugas Gudang Utama (Logistik)**
    *   Bertanggung jawab atas manajemen master data barang.
    *   Mencatat penerimaan barang dari supplier.
    *   Memproses dan menyetujui/menolak permintaan (SPK) dari Instalasi Gizi.
    *   Mendistribusikan barang dan memotong stok gudang.
3.  **Petugas Instalasi Gizi / Pembuat SPK**
    *   Melihat katalog dan sisa stok barang di gudang.
    *   Membuat dokumen permintaan barang (SPK) harian/mingguan.
    *   Melakukan konfirmasi penerimaan barang yang dikirim oleh Gudang.
    *   Melihat status riwayat permintaan.
4.  **Kepala Instalasi / Manajemen (Eksekutif)**
    *   Melihat laporan pergerakan barang, efisiensi anggaran, dan dashboard analitik tanpa hak melakukan transaksi mutasi barang.

---

## 3. Kebutuhan Fungsional (Functional Requirements)

### 3.1 Modul Manajemen Pengguna (Autentikasi & Otorisasi)
*   **FR-1.1:** Sistem harus menyediakan fitur login menggunakan *username/email* dan *password* yang terenkripsi.
*   **FR-1.2:** Sistem harus menerapkan Role-Based Access Control (RBAC) untuk memisahkan menu antara Admin, Gudang, Gizi, dan Manajemen.
*   **FR-1.3:** Sistem harus memiliki fitur pencatatan aktivitas pengguna (*audit trail*) untuk semua tindakan mutasi stok dan persetujuan SPK.

### 3.2 Modul Gudang Utama (Manajemen Stok & Distribusi)
*   **FR-2.1 [Master Data]:** Petugas Gudang dapat menambah, mengubah, dan menghapus data master bahan makanan (nama, kategori, satuan, batas kadaluarsa/ED).
*   **FR-2.2 [Penerimaan Supplier]:** Petugas Gudang dapat menginput penerimaan barang masuk dari supplier untuk menambah stok.
*   **FR-2.3 [Penyesuaian Stok]:** Petugas Gudang dapat melakukan *Stock Opname* dan penyesuaian stok (Barang Rusak/Expired).
*   **FR-2.4 [Proses SPK]:** Petugas Gudang dapat melihat daftar SPK yang diajukan oleh Instalasi Gizi.
*   **FR-2.5 [Distribusi/Fulfillment]:** Petugas Gudang dapat menyetujui penuh, merevisi jumlah, atau menolak item pada SPK. Sistem akan secara **otomatis memotong stok gudang** setelah Gudang memvalidasi pengiriman.

### 3.3 Modul Instalasi Gizi (Pengajuan & Penerimaan)
*   **FR-3.1 [Monitoring Stok]:** Petugas Gizi dapat melihat daftar barang dan kuantitas stok yang tersedia di Gudang Utama (Read-only).
*   **FR-3.2 [Pembuatan SPK]:** Petugas Gizi dapat membuat Surat Pesanan Kerja (SPK) dengan memilih barang dan menginput jumlah yang dibutuhkan.
*   **FR-3.3 [Validasi SPK]:** Sistem harus mencegah Gizi meminta barang dengan jumlah melebihi stok yang tersedia, atau memberikan peringatan jika stok menipis.
*   **FR-3.4 [Status SPK]:** Petugas Gizi dapat melacak status SPK (Draft, Menunggu Persetujuan Gudang, Sedang Dikirim, Selesai, Ditolak).
*   **FR-3.5 [Penerimaan Barang]:** Petugas Gizi harus mengonfirmasi penerimaan barang (Goods Receipt) setelah fisik barang diterima dari Gudang untuk menutup status SPK menjadi "Selesai".

### 3.4 Modul Laporan & Dashboard
*   **FR-4.1:** Sistem harus menyediakan Dashboard untuk Gudang yang menampilkan alert stok kritis (Minimum Stock) dan barang mendekati Expired Date.
*   **FR-4.2:** Sistem harus menyediakan laporan mutasi barang (Kartu Stok) secara real-time.
*   **FR-4.3:** Sistem harus menyediakan laporan rekapitulasi SPK dan distribusi barang ke Instalasi Gizi dalam periode tertentu (harian/bulanan/tahunan).
*   **FR-4.4:** Semua laporan dapat diekspor ke dalam format PDF dan Microsoft Excel.

---

## 4. Kebutuhan Non-Fungsional (Non-Functional Requirements)

### 4.1 Keamanan (Security)
*   **NFR-1.1:** *Password* pengguna harus di-*hash* (misalnya menggunakan Bcrypt) dan tidak disimpan dalam bentuk *plain text*.
*   **NFR-1.2:** Session pengguna otomatis terputus (*auto-logout*) setelah 30 menit tidak ada aktivitas.
*   **NFR-1.3:** Endpoint API yang memproses mutasi stok harus divalidasi dengan ketat pada sisi server untuk mencegah *Bypass Request* dari *role* Gizi.

### 4.2 Kinerja (Performance)
*   **NFR-2.1:** Waktu muat (*load time*) untuk halaman dashboard dan pembuatan SPK maksimal 3 detik pada koneksi internet/intranet standar (minimal 10 Mbps).
*   **NFR-2.2:** Pembuatan laporan berkapasitas besar (lebih dari 10.000 baris data mutasi) tidak boleh menyebabkan sistem mengalami *timeout* (dapat diproses secara *asynchronous* jika diperlukan).

### 4.3 Ketersediaan dan Keandalan (Availability & Reliability)
*   **NFR-3.1:** Sistem harus berjalan dengan ketersediaan 99.9% (Uptime) selama jam kerja operasional Rumah Sakit.
*   **NFR-3.2:** Basis data harus dicadangkan (*backup*) secara otomatis minimal satu kali sehari pada pukul 00:00 WIB.

---

## 5. Kebutuhan Antarmuka Pengguna (UI/UX Requirements)

*   **UI/UX-1 [Responsivitas]:** Antarmuka harus berdesain *Responsive Web Design* (RWD) yang dapat diakses dengan baik melalui Desktop (PC/Laptop) maupun Tablet, karena petugas gudang/dapur mungkin melakukan mobilitas.
*   **UI/UX-2 [Navigasi]:** Menggunakan *Sidebar Navigation* yang ringkas. Menu yang tidak sesuai dengan *role* pengguna (misalnya menu Input Stok bagi pengguna Gizi) tidak boleh ditampilkan.
*   **UI/UX-3 [Aksesibilitas]:** Menggunakan palet warna yang kontras dengan teks yang mudah dibaca. Penggunaan warna untuk status SPK harus jelas:
    *   Kuning: Menunggu Persetujuan
    *   Biru: Sedang Diproses/Dikirim
    *   Hijau: Selesai / Diterima
    *   Merah: Ditolak / Kedaluwarsa
*   **UI/UX-4 [Kemudahan Input]:** Form pencarian barang pada saat pembuatan SPK harus dilengkapi fitur *Autosuggest* atau *Searchable Dropdown* agar petugas Gizi dapat bekerja dengan cepat.

---

## 6. Kebutuhan Perangkat Keras dan Lunak (Hardware & Software Requirements)

### 6.1 Sisi Server (Minimum Spesifikasi)
*   **Sistem Operasi:** Linux (Ubuntu Server 20.04/22.04 LTS atau CentOS).
*   **Prosesor:** Minimal 4 Core (Contoh: Intel Xeon atau setara).
*   **RAM:** Minimal 8 GB.
*   **Penyimpanan (Storage):** Minimal 100 GB SSD (disarankan menggunakan arsitektur RAID untuk keamanan data).
*   **Software Stack:**
    *   Web Server: Nginx atau Apache.
    *   Bahasa Pemrograman: PHP (Laravel/CodeIgniter) / Node.js / Python (sesuai pilihan arsitektur).
    *   Database: PostgreSQL atau MySQL/MariaDB.

### 6.2 Sisi Klien / Pengguna (Minimum Spesifikasi)
*   **Perangkat Keras:**
    *   PC Desktop, Laptop, atau Tablet (Android/iPad).
    *   RAM Minimal: 4 GB.
    *   Resolusi Layar Minimal: 1024 x 768 px (disarankan 1366 x 768 px ke atas).
*   **Perangkat Lunak:**
    *   Browser: Google Chrome (versi 90+), Mozilla Firefox (versi 88+), atau Microsoft Edge terbaru.
    *   Tidak diperlukan instalasi perangkat lunak khusus (Sistem berbasis Web).
*   **Perangkat Tambahan (Opsional namun disarankan):**
    *   *Barcode/QR Code Scanner* di Gudang untuk mempercepat proses identifikasi barang masuk/keluar.
    *   Printer Thermal atau Printer Inkjet standar untuk mencetak bukti SPK dan laporan.