# SimpleLabel MVP

**SimpleLabel** adalah aplikasi web sederhana dan efisien untuk membantu kelompok mahasiswa melakukan pelabelan teks (*manual human annotation*) secara merata dan membandingkannya dengan pelabelan LLM (*Language Model Benchmark*).

Aplikasi ini dibuat khusus untuk memenuhi kebutuhan proyek penelitian tugas kelompok mata kuliah **Pemrosesan Teks Praktik**.

* **Repository GitHub**: [https://github.com/RajendraF1/label-text](https://github.com/RajendraF1/label-text)
* **Supabase Project**: [https://oqigkuywngvhzrisjkuo.supabase.co](https://oqigkuywngvhzrisjkuo.supabase.co)

---

## 🚀 Fitur Utama & Pembaruan

1. **Autentikasi Berbasis Nama (Zero-Password untuk Anggota)**:
   - Anggota kelompok tidak perlu membuat akun dengan email & password.
   - Anggota cukup memilih **Nama mereka masing-masing** di dropdown untuk langsung mengerjakan paket tugas mereka.
2. **Keamanan Admin Panel dengan Password**:
   - Akses Admin Panel dilindungi oleh kata sandi:
     > **Password Admin**: `rahasia123`
   - Hanya admin yang dapat mendaftarkan/menghapus nama anggota, mengimpor dataset, dan mendistribusikan data.
   - Terdapat tombol **Keluar Admin** untuk mengunci kembali panel kontrol.
3. **Import Dataset & Distribusi Merata**:
   - Unggah CSV dataset opini (`hasil_prediksi_NPM_221_279.csv` / `hasil_preprocessing_NPM_221_279.csv`).
   - Sistem otomatis membagi 1.921 data secara merata ke seluruh anggota (selisih tugas antaranggota maksimal 1 baris).
   - ID asli tweet (`record_id`) dipertahankan agar pencocokan dengan LLM 100% presisi.
4. **Antarmuka Labeling Cepat & Ramah Pengguna**:
   - Tampilan satu teks dalam satu kartu fokus.
   - Dua tombol besar: **POSITIVE** (Hijau) dan **NEGATIVE** (Merah).
   - **Keyboard Shortcuts**: Tekan `1` untuk POSITIVE dan `2` untuk NEGATIVE.
   - Otomatis tersimpan (*autosave*) dan otomatis berpindah ke data berikutnya.
   - Riwayat pengerjaan: Tombol navigasi `Sebelumnya (←)` dan `Berikutnya (→)` untuk merevisi label kapan saja.
   - Indikator progres realtime (contoh: *Data 45 dari 320 - 14%*).
5. **Monitoring & Export Manual**:
   - Dashboard kemajuan tiap anggota (Total, Sudah Dilabeli, Sisa, Persentase).
   - Ekspor hasil manual ke CSV: `record_id, text, assigned_member, manual_label, labeled_at`.
6. **Compare Labels (Manual vs LLM)**:
   - Import file CSV hasil prediksi LLM.
   - Otomatis mencocokkan `manual_label` vs `llm_label` berdasarkan `record_id` (bukan posisi baris).
   - Status pencocokan: `MATCH`, `MISMATCH`, dan `PENDING`.
   - **Tingkat Kesepakatan (Agreement Rate)** = $\frac{\text{MATCH}}{\text{MATCH} + \text{MISMATCH}} \times 100\%$.
   - **Confusion Matrix 2×2 Sederhana** (Manual POS/NEG vs LLM POS/NEG).
   - Filter teks yang berselisih paham (`MISMATCH`) untuk bahan analisis laporan.
   - Ekspor hasil perbandingan ke CSV: `record_id, text, assigned_member, manual_label, llm_label, comparison_status`.

---

## 🛠️ Teknologi yang Digunakan

- **React 19 + Vite**
- **Tailwind CSS**
- **Supabase** (`@supabase/supabase-js`)
- **PapaParse** (CSV parser & generator)
- **Lucide React** (Ikon antarmuka)

---

## 📦 Cara Menjalankan Aplikasi

### 1. Masuk ke direktori aplikasi
```bash
cd simplelabel
```

### 2. Jalankan server lokal
```bash
npm run dev
```
Buka browser di alamat `http://localhost:5173`.

---

## ☁️ Menghubungkan ke Project Supabase

Project Supabase Anda sudah siap di `https://oqigkuywngvhzrisjkuo.supabase.co`. Lakukan 2 langkah mudah ini:

### 1. Jalankan SQL Schema di Supabase
1. Buka dashboard Supabase Anda di [https://supabase.com/dashboard/project/oqigkuywngvhzrisjkuo/sql](https://supabase.com/dashboard/project/oqigkuywngvhzrisjkuo/sql).
2. Salin seluruh isi file [supabase_schema.sql](file:///c:/Users/Rajendra/OneDrive%20-%20Universitas%20Teknologi%20Yogyakarta/Universitas%20Teknologi%20Yogyakarta/Semester%207/Pemrosesan%20Teks%20Praktik/Tugas%20Kelompok/supabase_schema.sql).
3. Paste ke SQL Editor dan klik tombol **Run**.

### 2. Masukkan Anon Key
Buka [Project Settings $\rightarrow$ API](https://supabase.com/dashboard/project/oqigkuywngvhzrisjkuo/settings/api), salin **Project API Keys (anon public)**, lalu masukkan dengan salah satu cara:
* **Cara A (Melalui Aplikasi)**: Klik badge database di pojok kanan atas aplikasi SimpleLabel, masukkan Anon Key, lalu klik *Simpan & Hubungkan*.
* **Cara B (Melalui File .env)**: Buka file `simplelabel/.env` dan isi:
  ```env
  VITE_SUPABASE_URL=https://oqigkuywngvhzrisjkuo.supabase.co
  VITE_SUPABASE_ANON_KEY=paste_anon_key_disini
  ```

---

## 🚀 Push ke Repository GitHub

Repository git lokal sudah diinisialisasi dan dihubungkan ke remote `https://github.com/RajendraF1/label-text.git`.

Untuk melakukan push commit ke GitHub, cukup jalankan:
```bash
git push -u origin main
```
*(Catatan: File `.env` yang memuat kredensial otomatis diabaikan oleh `.gitignore` sehingga aman dari kebocoran).*
