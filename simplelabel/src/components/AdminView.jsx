import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Upload, 
  BarChart3, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Lock, 
  KeyRound, 
  LogOut,
  FileSpreadsheet, 
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import Papa from 'papaparse';
import { 
  getMembers, 
  addMember, 
  deleteMember, 
  distributeDataset, 
  getMonitoringStats, 
  exportManualCsv 
} from '../services/storage';

const ADMIN_PASSWORD = 'rahasia123';

export default function AdminView() {
  // Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('simplelabel_admin_authenticated') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(null);

  const [subTab, setSubTab] = useState('monitoring'); // 'members', 'import', 'monitoring'

  // Members State
  const [members, setMembers] = useState([]);
  const [newName, setNewName] = useState('');
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberError, setMemberError] = useState(null);

  // CSV Import & Distribution State
  const [csvFile, setCsvFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedRecordIdCol, setSelectedRecordIdCol] = useState('');
  const [selectedTextCol, setSelectedTextCol] = useState('');
  const [distributing, setDistributing] = useState(false);
  const [distributionResult, setDistributionResult] = useState(null);

  // Monitoring State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadMembersData();
      loadStatsData();
    }
  }, [isAuthenticated]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('simplelabel_admin_authenticated', 'true');
      setAuthError(null);
    } else {
      setAuthError('Password admin salah!');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('simplelabel_admin_authenticated');
    setPasswordInput('');
  };

  async function loadMembersData() {
    try {
      setMembersLoading(true);
      const data = await getMembers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setMembersLoading(false);
    }
  }

  async function loadStatsData() {
    try {
      setStatsLoading(true);
      const data = await getMonitoringStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  }

  // Handle Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setMemberError(null);
      await addMember(newName.trim());
      setNewName('');
      await loadMembersData();
      await loadStatsData();
    } catch (err) {
      setMemberError(err.message);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus anggota "${name}"?`)) return;
    try {
      await deleteMember(id);
      await loadMembersData();
      await loadStatsData();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // Handle File Upload & Parse
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setDistributionResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^\ufeff/, '').trim(), // Clean BOM \ufeff
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setParsedRows(results.data);
          const cols = Object.keys(results.data[0]);
          setCsvColumns(cols);

          const idCandidate = cols.find(c => /^(id|record_id|no|kode)$/i.test(c)) || cols[0];
          const textCandidate = cols.find(c => /^(text|teks|tweet|clean_text|text_clean)$/i.test(c)) || cols[1] || cols[0];

          setSelectedRecordIdCol(idCandidate || '');
          setSelectedTextCol(textCandidate || '');
        }
      },
      error: (err) => {
        alert('Gagal membaca file CSV: ' + err.message);
      }
    });
  };

  // Handle Distribute
  const handleDistribute = async () => {
    if (parsedRows.length === 0) {
      alert('Unggah file CSV terlebih dahulu.');
      return;
    }
    if (!selectedTextCol) {
      alert('Pilih kolom teks.');
      return;
    }
    if (members.length === 0) {
      alert('Belum ada anggota yang terdaftar untuk menerima data.');
      return;
    }

    if (!window.confirm(`Distribusikan ${parsedRows.length} data ke ${members.length} anggota secara merata?`)) {
      return;
    }

    try {
      setDistributing(true);
      const res = await distributeDataset(
        parsedRows, 
        selectedRecordIdCol || csvColumns[0], 
        selectedTextCol, 
        members
      );
      setDistributionResult(res);
      await loadStatsData();
    } catch (err) {
      alert('Gagal mendistribusikan: ' + err.message);
    } finally {
      setDistributing(false);
    }
  };

  // ==========================================================================
  // IF NOT AUTHENTICATED: SHOW PASSWORD LOCK SCREEN
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-1">Akses Admin Dilindungi</h3>
          <p className="text-xs text-slate-500 mb-6">
            Masukkan password admin untuk mengelola anggota, distribusi dataset, dan ekspor.
          </p>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="Masukkan Password Admin"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
            >
              Buka Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // AUTHENTICATED ADMIN VIEW
  // ==========================================================================
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Admin Top Header with Logout */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Admin Mode Aktif</span>
          <h2 className="text-lg font-extrabold text-slate-900">Panel Kontrol Proyek Kelompok</h2>
        </div>
        <button
          onClick={handleAdminLogout}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>Keluar Admin</span>
        </button>
      </div>

      {/* Admin Sub-navigation */}
      <div className="flex border-b border-slate-200 mb-8 space-x-6">
        <button
          onClick={() => setSubTab('monitoring')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition ${
            subTab === 'monitoring'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Monitoring & Export</span>
        </button>

        <button
          onClick={() => setSubTab('import')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition ${
            subTab === 'import'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Import Dataset & Distribusi</span>
        </button>

        <button
          onClick={() => setSubTab('members')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition ${
            subTab === 'members'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manajemen Anggota (Nama)</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SUB-TAB 1: MONITORING & EXPORT MANUAL */}
      {/* ==================================================================== */}
      {subTab === 'monitoring' && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Data</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {statsLoading ? '...' : (stats?.total || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Seluruh record ditugaskan</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Sudah Dilabeli</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                {statsLoading ? '...' : (stats?.labeled || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                {stats?.overallPercent || 0}% terselesaikan
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Belum Dilabeli</span>
              <div className="text-2xl font-extrabold text-amber-700 mt-1">
                {statsLoading ? '...' : (stats?.unlabeled || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Menunggu pengerjaan anggota</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Aksi Admin</span>
                <p className="text-xs text-slate-500 mt-1">Unduh hasil anotasi anggota</p>
              </div>
              <button
                onClick={exportManualCsv}
                disabled={!stats || stats.total === 0}
                className="mt-3 w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Hasil Manual (CSV)</span>
              </button>
            </div>
          </div>

          {/* Member Progress Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Progress Pelabelan Tiap Anggota</h3>
                <p className="text-xs text-slate-500">Monitor kemajuan pelabelan masing-masing anggota secara transparan</p>
              </div>
              <button
                onClick={loadStatsData}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs flex items-center space-x-1"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-5">Nama Anggota</th>
                    <th className="py-3.5 px-5">Total Tugas</th>
                    <th className="py-3.5 px-5">Sudah Dilabeli</th>
                    <th className="py-3.5 px-5">Belum</th>
                    <th className="py-3.5 px-5">Progress</th>
                    <th className="py-3.5 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statsLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-500">Memuat statistik...</td>
                    </tr>
                  ) : !stats?.memberProgress || stats.memberProgress.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-500">
                        Belum ada anggota atau belum ada data yang didistribusikan.
                      </td>
                    </tr>
                  ) : (
                    stats.memberProgress.map((mp) => (
                      <tr key={mp.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          {mp.name}
                        </td>
                        <td className="py-3.5 px-5 text-slate-700">{mp.total}</td>
                        <td className="py-3.5 px-5 font-semibold text-emerald-600">{mp.done}</td>
                        <td className="py-3.5 px-5 text-slate-500">{mp.remaining}</td>
                        <td className="py-3.5 px-5 min-w-[180px]">
                          <div className="flex items-center space-x-3">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${mp.percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${mp.percent}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-medium text-slate-600 w-9 text-right">
                              {mp.percent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          {mp.total === 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              Belum ada tugas
                            </span>
                          ) : mp.percent === 100 ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Selesai
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Berjalan
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
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: IMPORT DATASET & DISTRIBUSI */}
      {/* ==================================================================== */}
      {subTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-1">Unggah Dataset CSV</h3>
            <p className="text-xs text-slate-500 mb-6">
              Pilih file CSV dataset opini (seperti <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">hasil_prediksi_NPM_221_279.csv</code>)
            </p>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition bg-slate-50/50">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs cursor-pointer shadow-sm transition"
              >
                Pilih File CSV dari Komputer
              </label>
              {csvFile && (
                <p className="text-xs font-semibold text-slate-700 mt-3 font-mono">
                  File terpilih: {csvFile.name} ({(csvFile.size / 1024 / 1024).toFixed(2)} MB, {parsedRows.length} baris)
                </p>
              )}
            </div>

            {/* Column Mapping & Preview */}
            {parsedRows.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
                <h4 className="font-bold text-sm text-slate-900">Pemetaan Kolom & Verifikasi ID</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Kolom ID Unik (record_id):
                    </label>
                    <select
                      value={selectedRecordIdCol}
                      onChange={(e) => setSelectedRecordIdCol(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {csvColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      *Digunakan untuk mencocokkan hasil manual dengan prediksi LLM.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Kolom Teks yang Akan Dilabeli:
                    </label>
                    <select
                      value={selectedTextCol}
                      onChange={(e) => setSelectedTextCol(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {csvColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      *Teks yang akan dibaca dan dinilai oleh anggota kelompok.
                    </p>
                  </div>
                </div>

                {/* Preview Table */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Preview Data (3 Baris Pertama):
                  </label>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Record ID ({selectedRecordIdCol})</th>
                          <th className="py-2 px-3">Teks ({selectedTextCol})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.slice(0, 3).map((r, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                              {r[selectedRecordIdCol]}
                            </td>
                            <td className="py-2 px-3 text-slate-800 max-w-md truncate">
                              {r[selectedTextCol]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Distribution Button */}
                <div className="pt-4 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Data akan dibagi merata ke <strong>{members.length} anggota</strong> terdaftar.
                  </div>
                  <button
                    onClick={handleDistribute}
                    disabled={distributing || members.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center space-x-2 transition shadow-sm"
                  >
                    {distributing ? (
                      <span>Mendistribusikan data...</span>
                    ) : (
                      <>
                        <span>Distribusikan {parsedRows.length} Data ke {members.length} Anggota</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Distribution Success Feedback */}
                {distributionResult && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                    <div className="font-bold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Distribusi Berhasil! Total {distributionResult.totalDistributed} data telah dibagikan:</span>
                    </div>
                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {distributionResult.distributionSummary.map(ds => (
                        <li key={ds.name} className="bg-white/80 p-1.5 rounded border border-emerald-200">
                          {ds.name}: <strong>{ds.count} data</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 3: MANAJEMEN ANGGOTA (NAMA) */}
      {/* ==================================================================== */}
      {subTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-1">Daftar Anggota Kelompok (Nama)</h3>
            <p className="text-xs text-slate-500 mb-6">
              Anggota dapat memilih nama mereka di layar pelabelan untuk langsung mengerjakan tugas masing-masing.
            </p>

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="flex gap-3 max-w-md mb-6">
              <input
                type="text"
                placeholder="Masukkan Nama Anggota (cth: Rajendra)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Nama</span>
              </button>
            </form>

            {memberError && (
              <p className="text-xs text-red-600 mb-4">{memberError}</p>
            )}

            {/* Members Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Nama Anggota</th>
                    <th className="py-3 px-4">Terdaftar Sejak</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(m.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteMember(m.id, m.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Hapus anggota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start space-x-2">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <span>
                Nama-nama di atas akan muncul pada dropdown di halaman Labeling agar teman-teman Anda dapat memilih nama mereka sendiri.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
