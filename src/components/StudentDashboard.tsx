 

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api-client';
import { User, Attempt } from '../types';
import { GraduationCap, Landmark, ClipboardList, Clock, Calendar, CheckSquare, Trophy, AlertTriangle, Monitor, X, LogOut, Code } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export default function StudentDashboard({ user, onLogout, addToast }: StudentDashboardProps) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [testCodeInput, setTestCodeInput] = useState('');
  

  // Fetch student attempt history
  const fetchAttemptHistory = async () => {
    setLoading(true);
    try {
      const response = await apiFetch<Attempt[]>('/users/attemptList');
      if (response.success && response.data) {
        setAttempts(response.data);
      }
    } catch (err: any) {
      // 404 is returned if there are no records yet, handle gracefully as empty state
      if (err.statusCode !== 404) {
        addToast('error', err.message || 'Could not fetch your attempt. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttemptHistory();
  }, []);

  // Compute stats
  const totalAttempts = attempts.length;
  const scoredMarksSum = attempts.reduce((acc, curr) => acc + (curr.obtainedMarks || 0), 0);
  const totalMarksSum = attempts.reduce((acc, curr) => acc + (curr.totalMarks || 100), 0); // fallback total
  const avgPerformance = totalAttempts > 0 ? Math.round((scoredMarksSum / totalMarksSum) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Premium Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center font-display font-bold text-lg text-white">
              V
            </div>
            <div>
              <span className="font-display font-medium text-lg text-slate-900 tracking-tight">ValidEx <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 py-0.5 px-2 rounded-full font-sans font-semibold ml-2">Student Portal</span></span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 text-xs font-bold font-mono">
                {user.fullname.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user.fullname}</p>
                <p className="text-xs text-slate-500 font-medium">{user.email}</p>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              id="logout-btn"
              className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors hover:bg-slate-50 p-2 rounded-lg"
              title="Logout session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Block + Action Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle_at_70%_20%,#3b82f61a,transparent_60%)]" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">  Verified Account</span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back, {user.fullname}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
                <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-indigo-400" /> Dept: {user.department}</span>
                <span className="text-slate-500">&middot;</span>
                <span className="flex items-center gap-1.5"><Landmark className="h-4 w-4 text-indigo-400" /> Reg No: {user.regNo || 'N/A'}</span>
                {user.batch && (
                  <>
                    <span className="text-slate-500">&middot;</span>
                    <span>Batch: {user.batch}</span>
                  </>
                )}
              </div>
            </div>

            {/* <button
              id="join-test-btn"
              onClick={() => {
                setTestCodeInput('');
                setShowJoinModal(true);
              }}
              className="bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 hover:border-indigo-800 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 text-sm shadow-indigo-950/20 shadow-md hover:shadow-lg transition-all cursor-pointer select-none"
            >
              <Monitor className="h-4 w-4" /> Join Live Examination
            </button> */}

            <button
  id="download-validex-btn"
  onClick={() => {
    window.open(
      'https://github.com/HaseebAhmedRajput/validex-desktop/releases/latest/download/ValidEx.exe',
      '_blank'
    );
  }}
  className="bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 hover:border-indigo-800 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 text-sm shadow-indigo-950/20 shadow-md hover:shadow-lg transition-all cursor-pointer select-none"
>
  <Monitor className="h-4 w-4" />
  Download ValidEx Desktop
</button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-premium flex items-center gap-5">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Attempts</p>
              <p className="text-2xl font-bold text-slate-950 font-display mt-0.5">{totalAttempts}</p>
            </div>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-premium flex items-center gap-5">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Performance</p>
              <p className="text-2xl font-bold text-slate-950 font-display mt-0.5">{avgPerformance}%</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-premium flex items-center gap-5">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profile Status</p>
              <p className="text-base font-bold text-emerald-600 mt-0.5 flex items-center gap-1">Verified</p>
            </div>
          </div>
        </div>

        {/* Attended Tests Section */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-premium overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-slate-500" /> Exam Attempt History & Results
            </h2>
            <button
              onClick={fetchAttemptHistory}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 rounded-md py-1 px-3"
            >
              Refresh Table
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <span className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-500">Analyzing attempt databases...</p>
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-20 text-center max-w-sm mx-auto flex flex-col items-center">
              <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 text-slate-400">
                <ClipboardList className="h-6 w-6" />
              </div>
              <p className="text-slate-950 font-semibold mb-1">No completed exam sessions found</p>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                You haven't participated in any exams using ValidEx yet. When an exam is taken via the desktop engine, the scores will automatically stream here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-6">Subject Code</th>
                    <th className="py-3.5 px-6">Exam Title</th>
                    <th className="py-3.5 px-6">Attempt Date</th>
                    <th className="py-3.5 px-6 text-right">Scored Marks</th>
                    <th className="py-3.5 px-6 text-center">Violations</th>
                    <th className="py-3.5 px-6 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attempts.map((attempt) => {
                    const testInfo = typeof attempt.testId === 'object' ? (attempt.testId as any) : null;
                    const testTitle = testInfo?.title || 'External Evaluation Session';
                    const testSubject = testInfo?.subjectCode || 'GEN-EXAM';
                  const dateVal = attempt.createdAt;
// ya agar exam start time dikhana hai:
// const dateVal = attempt.startTime;
                    let date = 'N/A';
                    if (dateVal) {
                      const d = new Date(dateVal);
                      if (!isNaN(d.getTime())) {
                        try {
                          date = d.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          });
                        } catch (e) {
                          date = d.toISOString();
                        }
                      }
                    }

                    // Percent score computation
                   const obtained = attempt.obtainedMarks ?? 0;
const totalScore = attempt.totalMarks ?? 0;

const percent =
  totalScore > 0
    ? Math.round((obtained / totalScore) * 100)
    : 0;

                    return (
                      <tr key={attempt._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-900">{testSubject}</td>
                        <td className="py-4 px-6 font-medium text-slate-800">{testTitle}</td>
                        <td className="py-4 px-6 text-slate-500 text-xs font-medium">
                          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {date}</span>
                        </td>
                      <td className="py-4 px-6 text-right font-semibold font-mono text-slate-900">
  {obtained}
  <span className="text-xs font-normal text-slate-500">
    / {totalScore}
  </span>
</td>
<td className="py-4 px-6 text-center">
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
      (attempt.violation ?? 0) > 0
        ? "bg-amber-50 text-amber-700 border border-amber-100"
        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
    }`}
  >
    <AlertTriangle className="h-3.5 w-3.5" />
    {attempt.violation ?? 0}
  </span>
</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full text-xs font-semibold leading-relaxed ${
                            percent >= 40
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {percent >= 40 ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-mono mt-8">
        ValidEx Proctoring Secure Core &middot; Standard Academic Client &middot; hasib2994@gmail.com
      </footer>

      {/* JOIN EXAM DESKTOP DIALOG (MODAL) */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowJoinModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Content card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-premium p-6 overflow-hidden z-10"
            >
              <button
                onClick={() => setShowJoinModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center mt-2">
                <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Monitor className="h-6 w-6 animate-pulse" />
                </div>

                <h3 className="font-display font-semibold text-slate-900 text-lg tracking-tight">
                Desktop Application Required
                </h3>
                
                <p className="text-slate-500 text-xs mt-1 font-mono">
                  PLATFORM: VALIDEX SYSTEM DESKTOP APP
                </p>

                {/* CRITICAL DIALOG STRING ASSIGNED BY NEGATIVE CONSTRAINT */}
             <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl my-5">
  <p className="text-center font-bold text-sm text-amber-900">
    Desktop Application Required
  </p>

  <p className="text-center text-sm text-slate-700 mt-2">
    This exam can only be taken using the ValidEx Desktop Application.
  </p>

  <p className="text-xs text-slate-600 text-center mt-3 leading-relaxed">
    Download the application, sign in with your account, and join your assigned exam securely.
  </p>
</div>

             

                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="py-2.5 px-4 rounded-xl text-slate-600 font-semibold bg-slate-50 border border-slate-200 text-sm hover:bg-slate-100 transition-all select-none focus:outline-none"
                  >
                    Cancel
                  </button>
                  <a
                    href="https://github.com/hasib2994/ValidEx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 rounded-xl text-white font-semibold bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 hover:border-indigo-800 text-sm transition-all focus:outline-none flex items-center justify-center gap-1.5"
                  >
                    Download Desktop App
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
