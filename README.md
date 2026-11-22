# SimpleLabel MVP

**SimpleLabel** adalah aplikasi web sederhana dan efisien untuk membantu kelompok mahasiswa melakukan pelabelan teks (*manual human annotation*) secara merata dan membandingkannya dengan pelabelan LLM (*Language Model Benchmark*).

Aplikasi ini dibuat khusus untuk memenuhi kebutuhan proyek penelitian tugas kelompok mata kuliah **Pemrosesan Teks Praktik**.

---

## 🚀 Fitur Utama

1. **Autentikasi Berbasis NPM (Zero-Password)**:
   - Anggota kelompok tidak perlu mendaftar akun dengan email & password.
   - Anggota cukup memilih atau memasukkan **NPM (Nomor Pokok Mahasiswa)** mereka untuk langsung melihat tugas yang diberikan.
2. **Import Dataset & Distribusi Merata**:
   - Unggah CSV dataset opini (seperti `hasil_prediksi_NPM_221_279.csv`).
   - Sistem otomatis membagi 1.921 data secara merata ke seluruh NPM (selisih tugas antaranggota maksimal 1 baris).
   - ID asli tweet (`record_id`) dipertahankan agar pencocokan dengan LLM 100% presisi.
3. **Antarmuka Labeling Cepat & Ramah Pengguna**:
   - Tampilan satu teks dalam satu kartu fokus.
   - Dua tombol besar: **POSITIVE** (Hijau) dan **NEGATIVE** (Merah).
   - **Keyboard Shortcuts**: Tekan `1` untuk POSITIVE dan `2` untuk NEGATIVE.
   - Otomatis tersimpan (*autosave*) dan otomatis berpindah ke data berikutnya.
   - Riwayat pengerjaan: Tombol navigasi `Sebelumnya (←)` dan `Berikutnya (→)` untuk merevisi label kapan saja.
   - Indikator progres realtime (contoh: *Data 45 dari 320 - 14%*).
4. **Monitoring & Export Manual**:
   - Dashboard kemajuan tiap anggota (Total, Sudah Dilabeli, Sisa, Persentase).
   - Ekspor hasil manual ke CSV: `record_id, text, assigned_member, manual_label, labeled_at`.
5. **Compare Labels (Manual vs LLM)**:
   - Import file CSV hasil prediksi LLM.
   - Otomatis mencocokkan `manual_label` vs `llm_label` berdasarkan `record_id` (bukan posisi baris).
   - Status pencocokan: `MATCH`, `MISMATCH`, dan `PENDING`.
   - **Tingkat Kesepakatan (Agreement Rate)** = $\frac{\text{MATCH}}{\text{MATCH} + \text{MISMATCH}} \times 100\%$.
   - **Confusion Matrix 2×2 Sederhana** (Manual POS/NEG vs LLM POS/NEG).
   - Filter teks yang berselisih paham (`MISMATCH`) untuk bahan analisis laporan.
   - Ekspor hasil perbandingan ke CSV: `record_id, text, assigned_member, manual_label, llm_label, comparison_status`.
6. **Dual-Mode (Demo/Lokal & Supabase Live)**:
   - Dapat langsung dijalankan di browser menggunakan penyimpanan lokal (*LocalStorage*) tanpa perlu database.
   - Siap dihubungkan ke cloud database PostgreSQL Supabase kapan saja.

---

## 🛠️ Teknologi yang Digunakan

- **React 19 + Vite**
- **Tailwind CSS**
- **Supabase** (`@supabase/supabase-js`)
- **PapaParse** (CSV parser & generator)
- **Lucide React** (Ikon antarmuka)

---

## 📦 Cara Instalasi & Menjalankan Aplikasi

### 1. Masuk ke direktori aplikasi
```bash
cd simplelabel
```

### 2. Install dependencies (jika belum)
```bash
npm install
```

### 3. Jalankan server lokal
```bash
npm run dev
```
Buka browser di alamat yang muncul di terminal (biasanya `http://localhost:5173`).

---

## ☁️ Konfigurasi Supabase (Opsional tapi Direkomendasikan)

Aplikasi secara bawaan berjalan dalam **Mode Demo / Lokal** (semua data tersimpan di browser Anda). Untuk menghubungkannya ke Supabase agar teman-teman kelompok bisa mengakses data yang sama:

1. Buat project baru secara gratis di [supabase.com](https://supabase.com).
2. Buka menu **SQL Editor** di dashboard Supabase.
3. Salin dan jalankan seluruh isi file `supabase_schema.sql` yang ada di root proyek ini.
4. Buka menu **Project Settings $\rightarrow$ API** di Supabase untuk mendapatkan:
   - `Project URL`
   - `Project API Keys (anon public)`
5. Masukkan ke file `.env` di dalam folder `simplelabel`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   *(Atau klik tombol badge database di pojok kanan atas aplikasi SimpleLabel untuk memasukkan URL & Anon Key langsung melalui antarmuka web).*

---

## 📖 Panduan Penggunaan Lengkap

### Langkah 1: Menambahkan Anggota (NPM)
1. Buka tab **Admin Panel** $\rightarrow$ pilih sub-tab **Manajemen Anggota (NPM)**.
2. Masukkan nomor NPM anggota kelompok (misal: `221`, `279`, dst.) lalu klik **Tambah NPM**.
3. Pastikan ke-6 NPM anggota sudah terdaftar di tabel.

### Langkah 2: Mengunggah Dataset & Mendistribusikan Tugas
1. Di **Admin Panel**, buka sub-tab **Import Dataset & Distribusi**.
2. Klik **Pilih File CSV dari Komputer**, lalu pilih file `hasil_prediksi_NPM_221_279.csv` (atau dataset Anda).
3. Verifikasi pemetaan kolom:
   - Kolom ID: `id` atau `record_id`
   - Kolom Teks: `text` atau `text_clean`
4. Klik tombol **Distribusikan Data ke Anggota**.
5. Sistem akan membagi rata 1.921 baris ke 6 anggota (~320 baris per anggota) dengan selisih maksimal 1 baris.

### Langkah 3: Melakukan Pelabelan Manual (Anggota)
1. Setiap anggota membuka tab **Labeling (Anggota)** di perangkat masing-masing.
2. Pilih nomor **NPM** mereka di dropdown atau header.
3. Baca teks opini pada kartu.
4. Beri label dengan salah satu cara:
   - Klik tombol **POSITIVE** (atau tekan tombol keyboard `1`).
   - Klik tombol **NEGATIVE** (atau tekan tombol keyboard `2`).
5. Label langsung tersimpan dan otomatis bergeser ke teks berikutnya.
6. Jika ingin mengubah atau mengecek kembali data sebelumnya, tekan tombol `Sebelumnya (←)` atau panah kiri.

### Langkah 4: Monitoring & Unduh Hasil Manual
1. Admin dapat memantau progres pengerjaan di tab **Admin Panel** $\rightarrow$ **Monitoring & Export**.
2. Setelah anggota selesai, klik **Unduh Hasil Manual (CSV)** untuk mendapatkan file `manual_labeled_results.csv`.

### Langkah 5: Mengimpor Hasil Prediksi LLM & Membandingkan Hasil
1. Buka tab **Compare Labels**.
2. Pada bagian *Import CSV Hasil Prediksi LLM*, unggah file `hasil_prediksi_NPM_221_279.csv`.
3. Pilih kolom ID (`id`) dan kolom label LLM (`label`).
4. Klik **Simpan & Cocokkan Prediksi LLM**. Format label `'positif'`/`'negatif'` otomatis dinormalisasi menjadi `POSITIVE`/`NEGATIVE`.
5. Tinjau statistik:
   - Jumlah MATCH, MISMATCH, dan PENDING.
   - **Tingkat Kesepakatan (Agreement Rate %)**.
   - **Confusion Matrix 2×2** siap pakai.

### Langkah 6: Filter & Ekspor Hasil Perbandingan
1. Gunakan filter status:
   - **MATCH**: Hanya melihat teks yang disepakati bersama oleh manusia dan LLM.
   - **MISMATCH**: Melihat kalimat yang berselisih paham (cocok dianalisis untuk bab pembahasan laporan tugas akhir).
2. Klik **Export CSV Perbandingan** untuk mengunduh file `comparison_manual_vs_llm.csv`.

---

## 🔒 Catatan Keamanan

- Pemilihan anggota berbasis NPM ditujukan untuk kenyamanan kerja kelompok agar terhindar dari proses registrasi yang rumit.
- Kunci API yang digunakan di sisi frontend hanyalah **Supabase Anon Key** yang dibatasi oleh aturan *Row Level Security* (RLS). Jangan pernah membagikan atau memasukkan *Service Role Key* ke frontend.
