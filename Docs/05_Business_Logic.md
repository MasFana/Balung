# Business Logic: Sistem Informasi Manajemen Logistik Gizi & SPK RSD Balung

## 1. Overview
Dokumen ini menguraikan logika bisnis (business logic) utama untuk **Sistem Informasi Manajemen Logistik Gizi & Surat Pesanan Kebutuhan (SPK) RSD Balung**. Sistem ini dirancang untuk mengotomatisasi perhitungan kebutuhan bahan makanan pasien berdasarkan diet, siklus menu, dan jumlah pasien, serta mengelola inventaris bahan makanan menggunakan metode FIFO dengan mekanisme locking.

---

## 2. Algorithm 1: Menu Formulation (Package -> Dish -> Ingredient)

### 2.1 Konsep Hierarki
Sistem menggunakan struktur hierarki tiga tingkat untuk menghitung kebutuhan dasar:
1. **Package (Paket Diet/Siklus Menu)**: Kumpulan hidangan untuk satu waktu makan (misal: Makan Pagi Diet Biasa).
2. **Dish (Hidangan/Resep)**: Komponen dari paket (misal: Nasi Putih, Ayam Bumbu Rujak, Sayur Sop).
3. **Ingredient (Bahan Makanan)**: Komponen mentah dengan standar porsi/kotor (misal: Beras 50g, Daging Ayam 50g, Bumbu 10g).

### 2.2 Logika Resolusi (Formulasi)
Ketika sebuah `Package` dipanggil untuk `N` jumlah pasien, sistem akan memecah (flatten) hierarki menjadi agregasi bahan makanan mentah.

**Formula:**
`Total Ingredient (i) = N_Pasien * (Portion_Dish * Kebutuhan_Ingredient_per_Dish)`

**Langkah Algoritma:**
1. Ambil data `Package` berdasarkan Tipe Diet dan Kelas Perawatan.
2. Iterasi seluruh `Dish` yang ada di dalam `Package` tersebut.
3. Untuk setiap `Dish`, iterasi seluruh `Ingredient`.
4. Kalikan porsi standar (berat kotor/berat bersih) bahan dengan jumlah pasien.
5. Agregasikan (Group By) `Ingredient ID` untuk mendapatkan total kebutuhan per bahan makanan.

---

## 3. Algorithm 2: SPK Calculation (Patient + Buffer)

### 3.1 Konsep Buffer (Safety Stock)
Untuk menghindari kekurangan bahan akibat fluktuasi pasien baru atau tumpahan/kerusakan, sistem menerapkan perhitungan buffer:
* **5% Buffer**: Untuk bahan makanan kering (Beras, Gula, Minyak).
* **10% Buffer**: Untuk bahan makanan segar/basah (Sayur, Buah, Daging) yang memiliki risiko penyusutan (edible portion) tinggi atau fluktuasi cepat.

### 3.2 Logika Perhitungan SPK
**Formula:**
`Net_Requirement = Agregasi_Ingredient(N_Pasien)`
`Buffer_Amount = Net_Requirement * (Buffer_Percentage / 100)`
`Total_SPK = Kebutuhan_Gross = Net_Requirement + Buffer_Amount`

**Langkah Algoritma:**
1. Hitung `Net_Requirement` dari seluruh kelas rawat inap dan jenis diet untuk hari `H+1` atau `H+2`.
2. Kelompokkan berdasarkan Kategori Bahan (Kering/Basah).
3. Terapkan `Buffer_Percentage` (5% atau 10%) sesuai kategori bahan.
4. Hitung `Total_SPK` dan bulatkan ke atas (Ceiling) sesuai satuan pembelian terkecil (misal: 1.1 Kg ayam dibulatkan menjadi 1.2 Kg atau sesuai standar vendor).
5. Kurangi dengan `Stok_Gudang_Saat_Ini` untuk mendapatkan `Net_Order_to_Vendor`.

---

## 4. Algorithm 3: Stock Deduction Logic (FIFO & Locking)

### 4.1 Konsep FIFO (First In First Out)
Bahan makanan yang masuk gudang lebih dulu (berdasarkan Tanggal Kedatangan / Expire Date) harus dikeluarkan lebih dulu.

### 4.2 Mekanisme Locking (Concurrency Control)
Mencegah *race condition* (stok minus) saat beberapa petugas farmasi/gizi melakukan validasi pengeluaran stok secara bersamaan. Menggunakan *Pessimistic Locking* di level database.

**Langkah Algoritma (Stock Deduction):**
1. **Begin Transaction**.
2. **Locking**: Query stok bahan makanan dengan klausa `FOR UPDATE` agar row data terkunci.
3. Ambil daftar *batch* stok bahan makanan, urutkan berdasarkan `Tanggal_Masuk ASC` atau `Expired_Date ASC`.
4. **Iterasi Pengurangan**:
   * Jika kebutuhan > stok batch pertama, kurangi stok batch pertama hingga 0, sisa kebutuhan dilanjutkan ke batch kedua.
   * Jika kebutuhan <= stok batch, kurangi stok batch tersebut.
5. Catat riwayat pengeluaran (Stock Card / Kartu Stok).
6. **Commit Transaction** (Lock dilepas).
7. Jika terjadi error/stok tidak mencukupi, **Rollback Transaction**.

---

## 5. Code Structure Examples (TypeScript / Node.js)

Berikut adalah contoh struktur arsitektur *Service Layer* menggunakan TypeScript.

### 5.1 Menu Formulation Service
```typescript
interface IngredientRequirement {
  ingredientId: string;
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  category: 'DRY' | 'WET';
}

class MenuFormulationService {
  async calculatePackageNeeds(packageId: string, patientCount: number): Promise<IngredientRequirement[]> {
    // 1. Fetch Package -> Dishes -> Ingredients
    const menuPackage = await Database.package.findById(packageId).populate('dishes.ingredients');
    
    const requirementMap = new Map<string, IngredientRequirement>();

    // 2. Resolve hierarchy
    for (const dish of menuPackage.dishes) {
      for (const item of dish.ingredients) {
        const currentTotal = requirementMap.get(item.ingredientId)?.totalQuantity || 0;
        const additionalQty = item.qtyPerPortion * patientCount;
        
        requirementMap.set(item.ingredientId, {
          ingredientId: item.ingredientId,
          ingredientName: item.ingredientName,
          totalQuantity: currentTotal + additionalQty,
          unit: item.unit,
          category: item.category
        });
      }
    }
    return Array.from(requirementMap.values());
  }
}
```

### 5.2 SPK Calculation Service
```typescript
class SPKCalculationService {
  calculateTotalSPK(requirements: IngredientRequirement[]): any[] {
    return requirements.map(req => {
      // 5% for DRY, 10% for WET
      const bufferPercentage = req.category === 'DRY' ? 0.05 : 0.10;
      
      const bufferAmount = req.totalQuantity * bufferPercentage;
      const grossRequirement = req.totalQuantity + bufferAmount;
      
      // Round up based on standard unit (e.g., Math.ceil for simplicity)
      const finalSPKQuantity = Math.ceil(grossRequirement);

      return {
        ingredientId: req.ingredientId,
        netRequirement: req.totalQuantity,
        bufferAmount: bufferAmount,
        totalSPKQuantity: finalSPKQuantity,
        unit: req.unit
      };
    });
  }
}
```

### 5.3 Stock Deduction (FIFO & Locking) Service
```typescript
class InventoryService {
  async deductStockFifo(ingredientId: string, qtyNeeded: number, transaction: DbTransaction): Promise<void> {
    let remainingToDeduct = qtyNeeded;

    // 1. Pessimistic Lock on Inventory Batches (FIFO Order)
    const batches = await transaction.rawQuery(`
      SELECT id, current_qty 
      FROM inventory_batches 
      WHERE ingredient_id = ? AND current_qty > 0 
      ORDER BY expiration_date ASC, created_at ASC
      FOR UPDATE
    `, [ingredientId]);

    // 2. Validate sufficient total stock
    const totalAvailable = batches.reduce((sum, b) => sum + b.current_qty, 0);
    if (totalAvailable < qtyNeeded) {
      throw new Error(`Insufficient stock for ingredient ${ingredientId}`);
    }

    // 3. FIFO Deduction logic
    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;

      let qtyToDeductFromBatch = 0;

      if (batch.current_qty >= remainingToDeduct) {
        qtyToDeductFromBatch = remainingToDeduct;
        remainingToDeduct = 0;
      } else {
        qtyToDeductFromBatch = batch.current_qty;
        remainingToDeduct -= batch.current_qty;
      }

      // Update database
      await transaction.rawQuery(`
        UPDATE inventory_batches 
        SET current_qty = current_qty - ? 
        WHERE id = ?
      `, [qtyToDeductFromBatch, batch.id]);

      // Insert to stock card (audit trail)
      await transaction.rawQuery(`
        INSERT INTO stock_cards (ingredient_id, batch_id, qty_out, type, created_at)
        VALUES (?, ?, ?, 'SPK_USAGE', NOW())
      `, [ingredientId, batch.id, qtyToDeductFromBatch]);
    }
  }
}
```