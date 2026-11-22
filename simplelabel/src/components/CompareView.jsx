import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  Upload, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  FileSpreadsheet, 
  Filter, 
  Search,
  RefreshCw
} from 'lucide-react';
import Papa from 'papaparse';
import { importLlmResults, getComparisonData, exportComparisonCsv } from '../services/storage';

export default function CompareView() {
  const [llmFile, setLlmFile] = useState(null);
  const [parsedLlmRows, setParsedLlmRows] = useState([]);
  const [llmColumns, setLlmColumns] = useState([]);
  const [selectedRecordIdCol, setSelectedRecordIdCol] = useState('');
  const [selectedLabelCol, setSelectedLabelCol] = useState('');
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);

  // Comparison State
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'MATCH', 'MISMATCH', 'PENDING'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadComparison();
  }, []);

  async function loadComparison() {
    try {
      setLoading(true);
      const res = await getComparisonData();
      setComparisonData(res);
    } catch (err) {
      console.error('Failed to load comparison data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle LLM CSV Upload
  const handleLlmUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLlmFile(file);
    setImportFeedback(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^\ufeff/, '').trim(),
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setParsedLlmRows(results.data);
          const cols = Object.keys(results.data[0]);
          setLlmColumns(cols);

          // Auto-select candidate columns
          const idCand = cols.find(c => /^(id|record_id|no)$/i.test(c)) || cols[0];
          const labelCand = cols.find(c => /^(label|llm_label|prediksi|sentiment)$/i.test(c)) || cols[cols.length - 1];

          setSelectedRecordIdCol(idCand);
          setSelectedLabelCol(labelCand);
        }
      },
      error: (err) => alert('Gagal membaca CSV LLM: ' + err.message)
    });
  };

  // Handle Save LLM Results
  const handleSaveLlm = async () => {
    if (parsedLlmRows.length === 0 || !selectedRecordIdCol || !selectedLabelCol) {
      alert('Pilih kolom record_id dan kolom label terlebih dahulu.');
      return;
    }

    try {
      setImporting(true);
      const res = await importLlmResults(parsedLlmRows, selectedRecordIdCol, selectedLabelCol);
      setImportFeedback(res);
      await loadComparison();
    } catch (err) {
      alert('Gagal mengimpor hasil LLM: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Filter items
  const items = comparisonData?.items || [];
  const filteredItems = items.filter(item => {
    const matchesFilter = statusFilter === 'ALL' || item.comparison_status === statusFilter;
    const matchesSearch = !searchTerm.trim() || 
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assigned_member.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = comparisonData?.stats;
  const cm = stats?.confusionMatrix;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <GitCompare className="w-6 h-6 text-blue-600" />
            <span>Perbandingan Pelabelan: Manual vs LLM</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencocokan label anotator manusia dengan prediksi LLM berdasarkan <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">record_id</code>
          </p>
        </div>

        <button
          onClick={loadComparison}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* SECTION 1: IMPORT HASIL LLM */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center space-x-2">
          <Upload className="w-5 h-5 text-blue-600" />
          <span>Import CSV Hasil Prediksi LLM</span>
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Unggah file CSV hasil prediksi LLM (seperti <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">hasil_prediksi_NPM_221_279.csv</code>)
        </p>

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50">
          <input
            type="file"
            accept=".csv"
            onChange={handleLlmUpload}
            className="hidden"
            id="llm-file-input"
          />
          <label
            htmlFor="llm-file-input"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs cursor-pointer shadow-sm transition"
          >
            Pilih File CSV LLM
          </label>
          {llmFile && (
            <p className="text-xs font-semibold text-slate-700 mt-3 font-mono">
              File: {llmFile.name} ({parsedLlmRows.length} baris terbaca)
            </p>
          )}
        </div>

        {/* Column Selectors for LLM */}
        {parsedLlmRows.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Kolom Record ID:</label>
                <select
                  value={selectedRecordIdCol}
                  onChange={(e) => setSelectedRecordIdCol(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {llmColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Kolom Label LLM:</label>
                <select
                  value={selectedLabelCol}
                  onChange={(e) => setSelectedLabelCol(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {llmColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Format label 'positif' / 'negatif' otomatis dinormalisasi ke POSITIVE / NEGATIVE.
              </span>
              <button
                onClick={handleSaveLlm}
                disabled={importing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
              >
                {importing ? 'Menyimpan...' : 'Simpan & Cocokkan Prediksi LLM'}
              </button>
            </div>

            {importFeedback && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Import Hasil LLM Berhasil!</span>
                </p>
                <p>
                  • Berhasil dicocokkan dengan dataset: <strong>{importFeedback.matchedCount} data</strong>
                </p>
                {importFeedback.unmatchedCount > 0 && (
                  <p className="text-amber-700">
                    • ID tidak ditemukan dalam penugasan dataset: {importFeedback.unmatchedCount} data
                  </p>
                )}
                {importFeedback.invalidLabelCount > 0 && (
                  <p className="text-red-700">
                    • Baris dilewati karena bukan positif/negatif: {importFeedback.invalidLabelCount}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: RINGKASAN HASIL & CONFUSION MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Cards (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bisa Dibandingkan</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {stats?.totalComparable || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Kedua label terisi</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>MATCH</span>
              </span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                {stats?.match || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Label sepakat</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider flex items-center space-x-1">
                <XCircle className="w-3 h-3" />
                <span>MISMATCH</span>
              </span>
              <div className="text-2xl font-extrabold text-rose-700 mt-1">
                {stats?.mismatch || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Beda pendapat</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>PENDING</span>
              </span>
              <div className="text-2xl font-extrabold text-amber-700 mt-1">
                {stats?.pending || 0}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Menunggu label</p>
            </div>
          </div>

          {/* Agreement Rate Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                Tingkat Kesepakatan (Agreement Rate)
              </span>
              <div className="text-4xl font-black mt-1">
                {stats?.agreementRate || '0.0'}%
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Persentase kesepakatan antara label manual manusia dan prediksi LLM
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-blue-400/30 sm:pl-6 text-xs text-blue-100 space-y-1">
              <div>Rumus Metrik:</div>
              <div className="font-mono font-bold bg-white/10 px-2.5 py-1 rounded-lg">
                MATCH / (MATCH + MISMATCH) × 100%
              </div>
            </div>
          </div>
        </div>

        {/* Confusion Matrix (1 Column) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Confusion Matrix 2×2</h4>
            <p className="text-[11px] text-slate-500 mb-4">
              Matriks perbandingan klasifikasi Manusia (Baris) vs LLM (Kolom)
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold">
                    <th className="p-2 border-b border-r border-slate-200 text-left">Manual \ LLM</th>
                    <th className="p-2 border-b border-r border-slate-200 text-emerald-700 font-bold">LLM POS</th>
                    <th className="p-2 border-b border-slate-200 text-rose-700 font-bold">LLM NEG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-bold text-left bg-slate-50 text-emerald-800">
                      Manual POS
                    </td>
                    <td className="p-2 border-r border-slate-200 bg-emerald-50/60 font-bold font-mono text-emerald-900">
                      {cm?.manPosLlmPos || 0}
                    </td>
                    <td className="p-2 bg-rose-50/40 font-mono text-rose-800">
                      {cm?.manPosLlmNeg || 0}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-200 font-bold text-left bg-slate-50 text-rose-800">
                      Manual NEG
                    </td>
                    <td className="p-2 border-r border-slate-200 bg-rose-50/40 font-mono text-rose-800">
                      {cm?.manNegLlmPos || 0}
                    </td>
                    <td className="p-2 bg-emerald-50/60 font-bold font-mono text-emerald-900">
                      {cm?.manNegLlmNeg || 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            *Hijau menunjukkan kesepakatan (True Positif & True Negatif).
          </div>
        </div>
      </div>

      {/* SECTION 3: DETAIL TABLE, FILTER & EXPORT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </span>
            {['ALL', 'MATCH', 'MISMATCH', 'PENDING'].map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'ALL' ? 'Semua Data' : filter}
              </button>
            ))}
          </div>

          {/* Search & Export Action */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari teks / ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => exportComparisonCsv(items)}
              disabled={items.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Perbandingan</span>
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Teks Opini</th>
                <th className="py-3 px-4">Nama Anggota</th>
                <th className="py-3 px-4">Manual Label</th>
                <th className="py-3 px-4">LLM Label</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Memuat data perbandingan...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Tidak ada data yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.record_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                      {item.record_id}
                    </td>
                    <td className="py-3 px-4 text-slate-800 max-w-md">
                      <p className="line-clamp-2">{item.text}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {item.assigned_member}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.manual_label === 'POSITIVE' && (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                          POSITIVE
                        </span>
                      )}
                      {item.manual_label === 'NEGATIVE' && (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                          NEGATIVE
                        </span>
                      )}
                      {item.manual_label === '-' && (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.llm_label === 'POSITIVE' && (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                          POSITIVE
                        </span>
                      )}
                      {item.llm_label === 'NEGATIVE' && (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                          NEGATIVE
                        </span>
                      )}
                      {item.llm_label === '-' && (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.comparison_status === 'MATCH' && (
                        <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 flex items-center space-x-1 w-max">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MATCH</span>
                        </span>
                      )}
                      {item.comparison_status === 'MISMATCH' && (
                        <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-rose-100 text-rose-800 flex items-center space-x-1 w-max">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>MISMATCH</span>
                        </span>
                      )}
                      {item.comparison_status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-full font-medium text-xs bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1 w-max">
                          <Clock className="w-3.5 h-3.5" />
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
