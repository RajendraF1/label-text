import React, { useState } from 'react';
import { X, Database, Check, AlertCircle, Key } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured, saveSupabaseConfig, resetSupabaseConfig } from '../lib/supabase';

export default function SupabaseModal({ isOpen, onClose }) {
  const [url, setUrl] = useState(SUPABASE_URL || 'https://oqigkuywngvhzrisjkuo.supabase.co');
  const [key, setKey] = useState(SUPABASE_ANON_KEY || '');
  const [statusMsg, setStatusMsg] = useState(null);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setStatusMsg({ type: 'error', text: 'Supabase URL dan Anon Key wajib diisi!' });
      return;
    }
    saveSupabaseConfig(url, key);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Koneksi Database Supabase</h3>
              <p className="text-xs text-slate-500">Konfigurasi endpoint dan Anon Public Key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className={`p-3 rounded-xl text-xs flex items-start space-x-2.5 ${
            isSupabaseConfigured
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">
                Status: {isSupabaseConfigured ? 'Terhubung ke Supabase' : 'Kunci Anon Key Belum Diisi'}
              </p>
              <p className="mt-0.5 text-slate-600 leading-relaxed">
                Salin Anon Public Key dari dashboard Supabase Anda (Project Settings → API).
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Project URL:</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://oqigkuywngvhzrisjkuo.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span>Anon Public Key:</span>
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              *Hanya gunakan anon public key, jangan gunakan service role key.
            </p>
          </div>

          {statusMsg && (
            <div className="p-3 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200">
              {statusMsg.text}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Hubungkan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
