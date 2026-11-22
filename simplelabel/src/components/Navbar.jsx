import React from 'react';
import { Tag, Shield, GitCompare, User, LogOut, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Navbar({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  onOpenConfig 
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Tag className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">SimpleLabel</span>
                {currentUser?.role === 'admin' ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Admin
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Anggota
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Anotasi Manual & Benchmark LLM</p>
            </div>
          </div>

          {/* Navigation for Admin */}
          {currentUser?.role === 'admin' && (
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'admin'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Panel</span>
              </button>

              <button
                onClick={() => setActiveTab('compare')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'compare'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <GitCompare className="w-4 h-4" />
                <span>Compare Labels</span>
              </button>
            </nav>
          )}

          {/* Right Section: Member Profile or Logout */}
          <div className="flex items-center space-x-3">
            {/* Database settings button if needed */}
            {!isSupabaseConfigured && (
              <button
                onClick={onOpenConfig}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition flex items-center space-x-1"
                title="Atur Supabase"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Set Anon Key</span>
              </button>
            )}

            {currentUser?.role === 'member' && (
              <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
              </div>
            )}

            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
              title="Keluar / Ganti Akun"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
              <span>{currentUser?.role === 'admin' ? 'Keluar Admin' : 'Ganti Nama'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
