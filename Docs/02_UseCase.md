# Dokumen Use Case
**Sistem Informasi Manajemen Logistik Gizi & SPK RSD Balung**

## 1. Daftar Aktor (Actors)

Berikut adalah daftar aktor yang berinteraksi dengan Sistem Informasi Manajemen Logistik Gizi & SPK di RSD Balung beserta deskripsi perannya:

1. **Gudang (Petugas Gudang Logistik)**: Bertanggung jawab atas manajemen inventaris bahan makanan mentah, penerimaan barang dari supplier, pencatatan stok masuk/keluar, dan pendistribusian bahan makanan ke bagian dapur berdasarkan permintaan.
2. **SPK / Gizi (Ahli Gizi / Kepala Instalasi Gizi)**: Bertanggung jawab dalam perencanaan menu pasien, penentuan standar diet, perhitungan kebutuhan bahan makanan, dan penerbitan SPK (Surat Perintah Kerja / Surat Permintaan Kebutuhan) bahan makanan ke gudang maupun instruksi memasak ke dapur.
3. **Dapur (Petugas Pengolahan Makanan / Koki)**: Bertugas menerima SPK/instruksi memasak, menerima bahan makanan dari gudang, mengolah makanan sesuai standar diet pasien, dan melaporkan status produksi makanan.
4. **Super Admin**: Administrator sistem yang memiliki hak akses penuh untuk mengelola pengguna (manajemen user), hak akses, manajemen data master (data bahan, data supplier, ruang perawatan, dll.), serta memantau seluruh laporan sistem.

---

## 2. Deskripsi Diagram Use Case (Use Case Diagram Description)

Diagram Use Case menggambarkan interaksi antara keempat aktor dengan sistem:

*   **Super Admin** terhubung dengan *Use Case*: Login, Kelola Pengguna, Kelola Data Master (Bahan, Supplier, Ruangan, Diet), dan Cetak Seluruh Laporan.
*   **Gudang** terhubung dengan *Use Case*: Login, Kelola Penerimaan Barang (Purchase Order), Kelola Stok Logistik, dan Proses Permintaan Bahan (Distribusi ke Dapur).
*   **SPK / Gizi** terhubung dengan *Use Case*: Login, Input Data Pasien & Diet, Buat Perencanaan Menu (Siklus Menu), Buat SPK/Permintaan Bahan ke Gudang, dan Cetak Laporan Gizi.
*   **Dapur** terhubung dengan *Use Case*: Login, Lihat SPK/Instruksi Memasak Harian, Konfirmasi Penerimaan Bahan dari Gudang, dan Update Status Produksi Makanan.
*   *(Include/Extend)*: Semua fitur utama membutuhkan *include* ke proses "Login". Proses pembuatan SPK dapat meng-*extend* notifikasi ke Gudang dan Dapur.

---

## 3. Skenario Use Case (Use Case Scenarios)

### 3.1. Skenario Aktor: Gudang

#### UC-G01: Proses Permintaan Bahan Makanan (Distribusi ke Dapur)
*   **Aktor Utama**: Gudang
*   **Pre-condition**: Aktor telah login, SPK/Permintaan bahan dari Gizi telah disetujui dan masuk ke sistem Gudang.
*   **Main Success Path (Skenario Utama)**:
    1. Sistem menampilkan daftar permintaan bahan makanan (SPK) yang berstatus "Menunggu Diproses".
    2. Aktor Gudang memilih salah satu SPK untuk melihat detail kebutuhan bahan.
    3. Aktor Gudang menyiapkan bahan sesuai daftar dan kuantitas yang diminta.
    4. Aktor Gudang menekan tombol "Kirim ke Dapur".
    5. Sistem secara otomatis mengurangi stok bahan di inventaris.
    6. Sistem mengubah status SPK menjadi "Didistribusikan".
*   **Alternate Paths (Skenario Alternatif)**:
    *   *Stok Tidak Mencukupi*: Pada langkah 4, jika stok di sistem kurang dari yang diminta, sistem menampilkan peringatan "Stok Tidak Cukup". Aktor dapat menyesuaikan jumlah yang dikirim (parsial) atau menolak permintaan tersebut dengan memberikan catatan/alasan.

#### UC-G02: Penerimaan Barang dari Supplier
*   **Aktor Utama**: Gudang
*   **Pre-condition**: Aktor telah login.
*   **Main Success Path (Skenario Utama)**:
    1. Aktor masuk ke menu "Penerimaan Barang".
    2. Aktor memasukkan nomor referensi PO (Purchase Order) atau memilih supplier.
    3. Aktor menginput item bahan makanan yang diterima beserta tanggal kedaluwarsa (expired date).
    4. Aktor menyimpan data penerimaan.
    5. Sistem memperbarui (menambah) jumlah stok bahan makanan terkait.
*   **Alternate Paths (Skenario Alternatif)**:
    *   *Barang Rusak/Tidak Sesuai*: Aktor hanya menginput jumlah barang yang diterima dalam kondisi baik. Barang yang ditolak dicatat dalam form "Retur Barang".

---

### 3.2. Skenario Aktor: SPK / Gizi

#### UC-Z01: Pembuatan SPK (Surat Perintah Kerja / Kebutuhan Bahan)
*   **Aktor Utama**: SPK / Gizi
*   **Pre-condition**: Aktor telah login, data jumlah pasien dan jenis diet harian telah diupdate.
*   **Main Success Path (Skenario Utama)**:
    1. Aktor masuk ke menu "Manajemen SPK".
    2. Aktor memilih tanggal produksi dan jenis waktu makan (Pagi/Siang/Malam).
    3. Sistem mengkalkulasi kebutuhan total bahan baku secara otomatis berdasarkan jumlah pasien, jenis diet, dan siklus menu.
    4. Aktor memverifikasi daftar bahan dan kuantitasnya.
    5. Aktor menekan tombol "Terbitkan SPK".
    6. Sistem menyimpan SPK, mengirim notifikasi ke Gudang (untuk penyiapan bahan) dan ke Dapur (untuk instruksi menu).
*   **Alternate Paths (Skenario Alternatif)**:
    *   *Koreksi Manual*: Pada langkah 4, jika ada perubahan mendadak (misal: penambahan pasien baru), aktor dapat mengubah kuantitas bahan secara manual sebelum menekan "Terbitkan SPK".

#### UC-Z02: Pencatatan Diet Pasien Baru
*   **Aktor Utama**: SPK / Gizi
*   **Pre-condition**: Aktor telah login.
*   **Main Success Path (Skenario Utama)**:
    1. Aktor masuk ke menu "Data Pasien & Diet".
    2. Aktor memilih ruangan/bangsal.
    3. Aktor memperbarui status diet pasien (misal: Diet Rendah Garam, Diet DM, dll.).
    4. Aktor menyimpan data.
    5. Sistem memperbarui rekapitulasi kebutuhan diet harian rumah sakit.
*   **Alternate Paths (Skenario Alternatif)**:
    *   *Pasien Pulang/Pindah Ruangan*: Aktor mengubah status pasien menjadi "Pulang" atau memindahkan data ke ruangan baru. Sistem otomatis mengurangi porsi dari rekapitulasi ruangan asal.

---

### 3.3. Skenario Aktor: Dapur

#### UC-D01: Konfirmasi Penerimaan Bahan Makanan
*   **Aktor Utama**: Dapur
*   **Pre-condition**: Aktor telah login, Gudang telah mendistribusikan bahan makanan.
*   **Main Success Path (Skenario Utama)**:
    1. Sistem menampilkan notifikasi bahan makanan yang sedang dikirim oleh Gudang.
    2. Aktor Dapur mengecek fisik bahan makanan yang tiba.
    3. Aktor memilih SPK pengiriman dan menekan tombol "Terima Bahan".
    4. Sistem mengubah status pengiriman menjadi "Selesai" dan status SPK menjadi "Siap Dimasak".
*   **Alternate Paths (Skenario Alternatif)**:
    *   *Ketidaksesuaian Bahan*: Jika fisik barang kurang atau rusak, Aktor Dapur memasukkan catatan diskrepansi pada sistem sebelum menekan "Terima dengan Catatan". Sistem mengirim notifikasi balik ke Gudang.

#### UC-D02: Update Status Produksi Makanan
*   **Aktor Utama**: Dapur
*   **Pre-condition**: Aktor telah login, bahan telah diterima.
*   **Main Success Path (Skenario Utama)**:
    1. Aktor melihat daftar menu yang harus dimasak berdasarkan SPK harian.
    2. Setelah makanan selesai dimasak dan diporsikan, aktor menekan tombol "Produksi Selesai".
    3. Sistem mengubah status produksi menjadi "Selesai" dan menginformasikan ke bagian Gizi / Distribusi bahwa makanan siap diantar ke bangsal.
*   **Alternate Paths (Skenario Alternatif)**:
    *   *Kendala Produksi (Alat rusak/Bahan basi)*: Aktor menekan tombol "Lapor Kendala", mengisi deskripsi masalah, dan sistem mengirim notifikasi darurat ke Ahli Gizi untuk perubahan menu dadakan.

---

### 3.4. Skenario Aktor: Super Admin

#### UC-A01: Manajemen Pengguna (User Management)
*   **Aktor Utama**: Super Admin
*   **Pre-condition**: Aktor telah login sebagai Super Admin.
*   **Main Success Path (Skenario Utama)**:
    1. Aktor mengakses menu "Manajemen User".
    2. Aktor memilih untuk menambah pengguna baru.
    3. Aktor mengisi form identitas (Nama, NIP, Username, Password) dan memilih Role (Gudang/Gizi/Dapur).
    4. Aktor menekan tombol "Simpan".
    5. Sistem memvalidasi data dan membuat akun baru.
*   **Alternate Paths (Skenario Alternatif)**:
    *   *Username Sudah Digunakan*: Sistem menampilkan pesan error "Username telah terdaftar". Aktor harus memasukkan username yang berbeda.

#### UC-A02: Kelola Data Master (Bahan Makanan)
*   **Aktor Utama**: Super Admin
*   **Pre-condition**: Aktor telah login.
*   **Main Success Path (Skenario Utama)**:
    1. Aktor mengakses menu "Master Data" > "Bahan Makanan".
    2. Aktor menambah data bahan baru (Nama Bahan, Satuan, Kategori, Harga Satuan, Batas Stok Minimum).
    3. Aktor menyimpan data.
    4. Sistem memasukkan bahan makanan ke dalam database sehingga dapat digunakan dalam penyusunan resep/menu oleh Gizi.
*   **Alternate Paths (Skenario Alternatif)**:
    *   *Data Tidak Lengkap*: Jika aktor lupa mengisi "Satuan", sistem menolak penyimpanan dan menyorot kolom yang wajib diisi.