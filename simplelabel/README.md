# SimpleLabel MVP

**SimpleLabel** adalah aplikasi web sederhana dan efisien untuk membantu kelompok mahasiswa melakukan pelabelan teks (*manual human annotation*) secara merata dan membandingkannya dengan pelabelan LLM (*Language Model Benchmark*).

Aplikasi ini dibuat khusus untuk memenuhi kebutuhan proyek penelitian tugas kelompok mata kuliah **Pemrosesan Teks Praktik**.

* **Repository GitHub**: [https://github.com/RajendraF1/label-text](https://github.com/RajendraF1/label-text)
* **Supabase Project**: [https://oqigkuywngvhzrisjkuo.supabase.co](https://oqigkuywngvhzrisjkuo.supabase.co)

---

## 🔐 Kredensial Akses Aplikasi

| Peran | Cara Masuk | Kata Sandi |
| :--- | :--- | :--- |
| **Anggota Kelompok** | Pilih nama Anda di dropdown | `tugas-ptp-21` |
| **Admin** | Klik tab Admin | `rahasia123` |

---

## 🚀 Fitur Utama & Alur Kerja

1. **Portal Login Terpisah (Anggota & Admin)**:
   - **Anggota**: Memilih nama mereka + memasukkan password anggota (`tugas-ptp-21`) untuk mengakses data tugas mereka.
   - **Admin**: Memasukkan password admin (`rahasia123`) untuk mengelola dataset, memantau kemajuan, dan membandingkan hasil LLM.
2. **Koneksi Murni ke Supabase Cloud**:
   - Seluruh data tersimpan secara terpusat dan realtime di database PostgreSQL Supabase Anda.
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

## 📦 Cara Menjalankan Lokal

```bash
cd simplelabel
npm run dev
```
Buka browser di `http://localhost:5173`.

---

## ☁️ Menghubungkan ke Project Supabase

1. Buka [Supabase SQL Editor](https://supabase.com/dashboard/project/oqigkuywngvhzrisjkuo/sql).
2. Salin seluruh isi file [supabase_schema.sql](file:///c:/Users/Rajendra/OneDrive%20-%20Universitas%20Teknologi%20Yogyakarta/Universitas%20Teknologi%20Yogyakarta/Semester%207/Pemrosesan%20Teks%20Praktik/Tugas%20Kelompok/supabase_schema.sql) dan klik **Run**.
3. Buka [API Settings Supabase](https://supabase.com/dashboard/project/oqigkuywngvhzrisjkuo/settings/api), salin **Project API Keys (anon public)**.
4. Masukkan ke file `simplelabel/.env` atau melalui modal database di aplikasi.

---

## 🚀 Push ke Repository GitHub

```bash
git push -u origin main
```
Repository terhubung ke: [https://github.com/RajendraF1/label-text](https://github.com/RajendraF1/label-text).
