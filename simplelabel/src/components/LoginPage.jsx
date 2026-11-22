import React, { useState, useEffect } from 'react';
import { Tag, User, Shield, Lock, KeyRound, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { getMembers } from '../services/storage';
import { isSupabaseConfigured } from '../lib/supabase';

const ADMIN_PASSWORD = 'rahasia123';

export default function LoginPage({ onLoginAsMember, onLoginAsAdmin, onOpenSupabaseModal }) {
  const [role, setRole] = useState('member'); // 'member' or 'admin'
  const [members, setMembers] = useState([]);
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembersList() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getMembers();
        setMembers(data);
        if (data.length > 0) {
          setSelectedMemberName(data[0].name);
        }
      } catch (err) {
        console.error('Failed to load members:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMembersList();
  }, []);

  const handleMemberSubmit = (e) => {
    e.preventDefault();
    if (!selectedMemberName) {
      setAuthError('Pilih nama Anda terlebih dahulu.');
      return;
    }
    setAuthError(null);
    onLoginAsMember(selectedMemberName);
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setAuthError(null);
      onLoginAsAdmin();
    } else {
      setAuthError('Password Admin salah!');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="p-8 text-center bg-gradient-to-b from-blue-50/70 to-white border-b border-slate-100">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-4">
            <Tag className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SimpleLabel</h1>
          <p className="text-xs text-slate-500 mt-1">
            Portal Pelabelan Teks Manual & Benchmark LLM
          </p>
        </div>

        {/* Missing Supabase Key Notice */}
        {!isSupabaseConfigured && (
          <div className="p-4 mx-6 mt-6 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Koneksi Supabase Belum Lengkap</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700">
              Supabase Anon Key belum diatur. Silakan klik tombol di bawah untuk memasukkan Anon Key dari dashboard Supabase Anda.
            </p>
            <button
              onClick={onOpenSupabaseModal}
              className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Atur Anon Key Supabase
            </button>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setRole('member'); setAuthError(null); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                role === 'member'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Anggota Kelompok</span>
            </button>

            <button
              type="button"
              onClick={() => { setRole('admin'); setAuthError(null); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                role === 'admin'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>

          {/* ================================================================ */}
          {/* FORM 1: ANGGOTA KELOMPOK */}
          {/* ================================================================ */}
          {role === 'member' && (
            <form onSubmit={handleMemberSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Pilih Nama Anda:
                </label>
                {loading ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    Memuat daftar anggota...
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <p className="text-xs text-slate-600 font-medium">
                      Belum ada nama anggota yang terdaftar di database.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Silakan hubungi admin atau masuk sebagai Admin untuk menambahkan nama anggota.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedMemberName}
                    onChange={(e) => setSelectedMemberName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={members.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2"
              >
                <span>Mulai Labeling</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Tugas akan otomatis disesuaikan dengan bagian data nama Anda.
              </p>
            </form>
          )}

          {/* ================================================================ */}
          {/* FORM 2: ADMIN */}
          {/* ================================================================ */}
          {role === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Password Admin:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder="Masukkan password admin"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>Masuk Admin Panel</span>
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                Akses penuh untuk distribusi dataset, monitoring progres, dan compare LLM.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
