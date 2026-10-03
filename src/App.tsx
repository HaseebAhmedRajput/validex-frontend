
import React, { useState, useEffect } from 'react';
import { apiFetch } from './lib/api-client';
import { User } from './types';
import LoginForm from './components/LoginForm';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ToastContainer, { ToastMessage } from './components/Toast';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 1. Toast dispatch helper
  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    
    // Automatically dismiss toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 2. Validate current credentials & cached session on mounting
  useEffect(() => {
    const checkActiveSession = async () => {
      const cached = localStorage.getItem('validex_user');
      if (!cached) {
        setLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(cached) as User;
        setUser(parsedUser);

        // Silent confirmation call to verify cookie validation
        if (parsedUser.role === 'student') {
          await apiFetch('/users/attemptList');
        } else {
          await apiFetch('/teacher/getAllTests?page=1');
        }
      } catch (err: any) {
        // Cookie likely dead. Attempt token refresh route
        try {
          await apiFetch('/users/auth/refreshToken', { method: 'POST' });
          // If successful, the cookie is restored and we keep the user session mounted
        } catch (refreshErr) {
          // Both failed, invalidate session and force login
          localStorage.removeItem('validex_user');
          setUser(null);
          addToast('info', 'Your active session has expired. Please authenticate again.');
        }
      } finally {
        setLoading(false);
      }
    };

    checkActiveSession();
  }, []);

  // Handle unauthorized API calls that failed refreshing
  useEffect(() => {
    const handleUnauthorizedCall = () => {
      localStorage.removeItem('validex_user');
      setUser(null);
      addToast('info', 'Your session has expired. Please authenticate again.');
    };

    window.addEventListener('unauthorized-api-call', handleUnauthorizedCall);
    return () => {
      window.removeEventListener('unauthorized-api-call', handleUnauthorizedCall);
    };
  }, []);

  // 3. Authenticated handlers
  const handleAuthSuccess = (authUser: User) => {
    localStorage.setItem('validex_user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/users/auth/logoutUser', { method: 'POST' });
    } catch (err) {
      // Complete termination regardless of API sync status
    } finally {
      localStorage.removeItem('validex_user');
      setUser(null);
      addToast('success', 'Logout successfully.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <span className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-display font-medium text-slate-500 text-sm">Validating Academic Portal Clearance...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background layer */}
      <div className="fixed inset-0 bg-[#f8fafc] -z-10" />

      {/* Main Panel Selectors */}
      {!user ? (
        <LoginForm onAuthSuccess={handleAuthSuccess} addToast={addToast} />
      ) : user.role === 'student' ? (
        <StudentDashboard user={user} onLogout={handleLogout} addToast={addToast} />
      ) : (
        <TeacherDashboard user={user} onLogout={handleLogout} addToast={addToast} />
      )}

      {/* Reactive global Toast component */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
