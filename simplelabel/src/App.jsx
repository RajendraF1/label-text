import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import LabelingView from './components/LabelingView';
import AdminView from './components/AdminView';
import CompareView from './components/CompareView';
import SupabaseModal from './components/SupabaseModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('simplelabel_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'compare' (for admin role)
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('simplelabel_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('simplelabel_user');
    }
  }, [currentUser]);

  const handleLoginAsMember = (name) => {
    setCurrentUser({ role: 'member', name });
  };

  const handleLoginAsAdmin = () => {
    setCurrentUser({ role: 'admin' });
    setActiveTab('admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* If logged in, show Navbar */}
      {currentUser && (
        <Navbar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onOpenConfig={() => setIsConfigOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {!currentUser ? (
          <LoginPage
            onLoginAsMember={handleLoginAsMember}
            onLoginAsAdmin={handleLoginAsAdmin}
            onOpenSupabaseModal={() => setIsConfigOpen(true)}
          />
        ) : currentUser.role === 'member' ? (
          <LabelingView
            memberName={currentUser.name}
            onChangeName={handleLogout}
            onGoToAdmin={() => setCurrentUser({ role: 'admin' })}
          />
        ) : (
          /* Admin views */
          <>
            {activeTab === 'admin' && <AdminView />}
            {activeTab === 'compare' && <CompareView />}
          </>
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
            <strong>SimpleLabel</strong> — Anotasi Teks Manual & Benchmark LLM
          </p>
          <p className="text-slate-400">
            Tugas Kelompok Pemrosesan Teks Praktik
          </p>
        </div>
      </footer>
    </div>
  );
}
