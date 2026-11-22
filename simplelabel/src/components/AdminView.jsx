import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Upload, 
  BarChart3, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Database,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  getMembers, 
  addMember, 
  deleteMember, 
  distributeDefaultDataset, 
  getMonitoringStats, 
  exportManualCsv 
} from '../services/storage';

export default function AdminView() {
  const [subTab, setSubTab] = useState('monitoring'); // 'monitoring', 'distribute', 'members'

  // Members State
  const [members, setMembers] = useState([]);
  const [newName, setNewName] = useState('');
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberError, setMemberError] = useState(null);

  // Distribution State
  const [distributing, setDistributing] = useState(false);
  const [distributionResult, setDistributionResult] = useState(null);

  // Monitoring State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadMembersData();
    loadStatsData();
  }, []);

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

  // Handle 1-Click Distribution with Embedded Dataset
  const handleDistributeDefault = async () => {
    if (members.length === 0) {
      alert('Belum ada anggota terdaftar. Daftarkan nama anggota terlebih dahulu di tab "Manajemen Anggota".');
      return;
    }

    if (!window.confirm(`Distribusikan 1.921 data opini ke ${members.length} anggota kelompok secara merata?`)) {
      return;
    }

    try {
      setDistributing(true);
      const res = await distributeDefaultDataset(members);
      setDistributionResult(res);
      await loadStatsData();
    } catch (err) {
      alert('Gagal mendistribusikan: ' + err.message);
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
          onClick={() => setSubTab('distribute')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 transition ${
            subTab === 'distribute'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Distribusi Dataset (1.921 Data)</span>
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
              <p className="text-[11px] text-slate-400 mt-1">Target data: 1.921 record</p>
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
                <p className="text-xs text-slate-500 mt-1">Unduh hasil anotasi manual</p>
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
                <p className="text-xs text-slate-500">Monitor kemajuan pelabelan masing-masing anggota secara realtime</p>
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
                        <td className="py-3.5 px-5 text-slate-700 font-semibold">{mp.total}</td>
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
      {/* SUB-TAB 2: DISTRIBUSI DATASET (AUTOMATED 1-CLICK) */}
      {/* ==================================================================== */}
      {subTab === 'distribute' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Dataset Terintegrasi Bawaan (1.921 Data)</h3>
                <p className="text-xs text-slate-500">
                  Dataset <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">hasil_prediksi_NPM_221_279.csv</code> sudah tertanam langsung dalam kode.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 mb-6 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Total Data:</span>
                  <p className="font-bold text-slate-900 font-mono text-base">1.921 Record</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Prediksi LLM:</span>
                  <p className="font-bold text-emerald-700 text-base">Otomatis Termasuk</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Jumlah Anggota:</span>
                  <p className="font-bold text-slate-900 font-mono text-base">{members.length} Orang</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Rata-rata Tugas:</span>
                  <p className="font-bold text-blue-700 font-mono text-base">
                    {members.length > 0 ? `~${Math.round(1921 / members.length)} data/orang` : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-500">
                Klik tombol di samping untuk membagi rata 1.921 data ke semua anggota sekaligus menyiapkan data LLM.
              </p>

              <button
                onClick={handleDistributeDefault}
                disabled={distributing || members.length === 0}
                className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 transition whitespace-nowrap"
              >
                {distributing ? (
                  <span>Membagi 1.921 data ke Supabase...</span>
                ) : (
                  <>
                    <span>Distribusikan 1.921 Data ke {members.length} Anggota</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Distribution Success Feedback */}
            {distributionResult && (
              <div className="mt-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-3">
                <div className="font-bold text-sm flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Distribusi Berhasil! Total {distributionResult.totalDistributed} data telah dibagikan:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {distributionResult.distributionSummary.map(ds => (
                    <div key={ds.name} className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                      <p className="font-bold text-slate-900">{ds.name}</p>
                      <p className="text-emerald-700 font-mono font-bold mt-0.5">{ds.count} data</p>
                    </div>
                  ))}
                </div>
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
              Anggota dapat memilih nama mereka di layar login untuk langsung mengerjakan tugas masing-masing.
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
                Nama-nama di atas akan muncul pada dropdown di Portal Anggota agar teman-teman kelompok dapat memilih nama mereka sendiri.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
