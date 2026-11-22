import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  AlertCircle, 
  ThumbsUp, 
  ThumbsDown
} from 'lucide-react';
import { getAssignments, updateManualLabel } from '../services/storage';

export default function LabelingView({ memberName, onGoToAdmin, onChangeName }) {
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [jumpInput, setJumpInput] = useState('');

  useEffect(() => {
    if (memberName) {
      loadTasksForMember(memberName);
    }
  }, [memberName]);

  async function loadTasksForMember(name) {
    try {
      setLoading(true);
      const data = await getAssignments(name);
      setTasks(data);
      
      // Auto-jump to first unlabeled item if available
      const firstUnlabeled = data.findIndex(t => !t.manual_label);
      if (firstUnlabeled !== -1) {
        setCurrentIndex(firstUnlabeled);
      } else {
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Failed to load assignments for', name, err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Labeling Action
  const handleAssignLabel = useCallback(async (label) => {
    if (tasks.length === 0 || currentIndex >= tasks.length) return;
    const currentTask = tasks[currentIndex];

    try {
      setSaving(true);
      await updateManualLabel(currentTask.record_id, label);

      // Update state locally for instant UI responsiveness
      const updated = [...tasks];
      updated[currentIndex] = {
        ...updated[currentIndex],
        manual_label: label,
        labeled_at: new Date().toISOString(),
      };
      setTasks(updated);

      setFeedbackMsg({
        type: label === 'POSITIVE' ? 'positive' : 'negative',
        text: `Tersimpan: ${label}`,
      });
      setTimeout(() => setFeedbackMsg(null), 1200);

      // Auto-advance to next item
      if (currentIndex < tasks.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to save label:', err);
      alert('Gagal menyimpan label: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [tasks, currentIndex]);

  // Keyboard shortcuts listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === '1') {
        e.preventDefault();
        handleAssignLabel('POSITIVE');
      } else if (e.key === '2') {
        e.preventDefault();
        handleAssignLabel('NEGATIVE');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < tasks.length - 1) setCurrentIndex(prev => prev + 1);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAssignLabel, currentIndex, tasks.length]);

  const currentTask = tasks[currentIndex];
  const totalTasks = tasks.length;
  const labeledTasksCount = tasks.filter(t => t.manual_label).length;
  const progressPercentage = totalTasks > 0 ? Math.round((labeledTasksCount / totalTasks) * 100) : 0;
  const isAllCompleted = totalTasks > 0 && labeledTasksCount === totalTasks;

  const handleJump = (e) => {
    e.preventDefault();
    const targetNum = parseInt(jumpInput, 10);
    if (!isNaN(targetNum) && targetNum >= 1 && targetNum <= totalTasks) {
      setCurrentIndex(targetNum - 1);
      setJumpInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Bar: Member Info & Switch */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sedang Anotasi:</span>
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                {memberName}
              </span>
            </div>
            <p className="text-xs text-slate-500">Tugas pelabelan terisolasi khusus untuk bagian Anda</p>
          </div>
        </div>

        <button
          onClick={onChangeName}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition"
        >
          Ganti Nama / Keluar
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium text-slate-600">Memuat data tugas untuk {memberName}...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada Tugas untuk {memberName}</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Admin belum mengunggah dataset atau belum mendistribusikan data ke anggota kelompok.
          </p>
          {onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition shadow-sm"
            >
              Masuk Admin Panel untuk Distribusi Data
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Progres Pengerjaan</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {labeledTasksCount} dari {totalTasks} selesai ({progressPercentage}%)
                </span>
                {isAllCompleted && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lengkap 100%!</span>
                  </span>
                )}
              </div>

              {/* Jump to specific index */}
              <form onSubmit={handleJump} className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">Loncat ke:</span>
                <input
                  type="number"
                  min="1"
                  max={totalTasks}
                  placeholder={`${currentIndex + 1}`}
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  className="w-16 px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium"
                >
                  Go
                </button>
              </form>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Current Text Annotation Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 relative transition-all">
            {/* Card Header info */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 text-xs">
              <div className="flex items-center space-x-2 text-slate-500">
                <span className="font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
                  Data #{currentIndex + 1} of {totalTasks}
                </span>
                <span className="font-mono text-slate-400">ID: {currentTask?.record_id}</span>
              </div>

              {/* Label Status Badge */}
              <div className="flex items-center space-x-2">
                {currentTask?.manual_label ? (
                  <span className={`px-3 py-1 rounded-full font-bold text-xs flex items-center space-x-1 ${
                    currentTask.manual_label === 'POSITIVE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sudah Dilabeli: {currentTask.manual_label}</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full font-medium text-xs bg-slate-100 text-slate-600">
                    Belum Dilabeli
                  </span>
                )}

                {/* Instant Feedback Toast */}
                {feedbackMsg && (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold animate-pulse ${
                    feedbackMsg.type === 'positive' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}>
                    {feedbackMsg.text}
                  </span>
                )}
              </div>
            </div>

            {/* Main Text Content */}
            <div className="min-h-[160px] flex items-center justify-center p-4 sm:p-6 bg-slate-50/70 rounded-2xl border border-slate-100 mb-8">
              <p className="text-base sm:text-lg text-slate-800 leading-relaxed text-center font-normal max-w-2xl">
                "{currentTask?.text}"
              </p>
            </div>

            {/* TWO BIG ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* POSITIVE BUTTON */}
              <button
                onClick={() => handleAssignLabel('POSITIVE')}
                disabled={saving}
                className={`py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all transform active:scale-95 shadow-md ${
                  currentTask?.manual_label === 'POSITIVE'
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-300/50 shadow-emerald-600/30'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-emerald-500/25'
                }`}
              >
                <ThumbsUp className="w-6 h-6 stroke-[2.5]" />
                <div className="text-left">
                  <div className="text-base sm:text-lg font-extrabold tracking-wide">POSITIVE</div>
                  <div className="text-[11px] font-medium opacity-80">Shortcut Keyboard: [ 1 ]</div>
                </div>
              </button>

              {/* NEGATIVE BUTTON */}
              <button
                onClick={() => handleAssignLabel('NEGATIVE')}
                disabled={saving}
                className={`py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all transform active:scale-95 shadow-md ${
                  currentTask?.manual_label === 'NEGATIVE'
                    ? 'bg-rose-600 text-white ring-4 ring-rose-300/50 shadow-rose-600/30'
                    : 'bg-rose-500 hover:bg-rose-600 text-white hover:shadow-rose-500/25'
                }`}
              >
                <ThumbsDown className="w-6 h-6 stroke-[2.5]" />
                <div className="text-left">
                  <div className="text-base sm:text-lg font-extrabold tracking-wide">NEGATIVE</div>
                  <div className="text-[11px] font-medium opacity-80">Shortcut Keyboard: [ 2 ]</div>
                </div>
              </button>
            </div>

            {/* Bottom Navigation & Revising Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <button
                onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
                disabled={currentIndex === 0}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium transition ${
                  currentIndex === 0
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya (←)</span>
              </button>

              <span className="text-slate-400 hidden sm:inline">
                *Otomatis lanjut ke data berikutnya setelah memilih label
              </span>

              <button
                onClick={() => currentIndex < totalTasks - 1 && setCurrentIndex(prev => prev + 1)}
                disabled={currentIndex === totalTasks - 1}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium transition ${
                  currentIndex === totalTasks - 1
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Berikutnya (→)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
