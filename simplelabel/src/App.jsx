import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LabelingView from './components/LabelingView';
import AdminView from './components/AdminView';
import CompareView from './components/CompareView';
import SupabaseModal from './components/SupabaseModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('labeling');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 pb-16">
        {activeTab === 'labeling' && (
          <LabelingView onGoToAdmin={() => setActiveTab('admin')} />
        )}
        {activeTab === 'admin' && (
          <AdminView />
        )}
        {activeTab === 'compare' && (
          <CompareView />
        )}
      </main>

      {/* Supabase Connection Modal */}
      <SupabaseModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong>SimpleLabel MVP</strong> — Aplikasi Anotasi Manual & Benchmark LLM
          </p>
          <p className="text-slate-400">
            Tugas Kelompok Pemrosesan Teks Praktik
          </p>
        </div>
      </footer>
    </div>
  );
}
